import { supabase } from '../../lib/supabase'

// 2-minute memory cache to prevent heavy database loads and network latency on concurrent queries
let liveCache = {
  data: null,
  timestamp: 0
}
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const now = Date.now()
    if (liveCache.data && (now - liveCache.timestamp < CACHE_DURATION)) {
      // Set Edge CDN and Browser caching headers (cache for 60s, stale-while-revalidate for 10 minutes)
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600')
      return res.status(200).json(liveCache.data)
    }

    // Fetch live settings, 3 pages of most followed (supporting up to 3000 rows in parallel), and viral reels concurrently
    const [settingsResult, profilesResult1, profilesResult2, profilesResult3, reelsResult] = await Promise.all([
      supabase.from('live_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(0, 999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(1000, 1999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(2000, 2999),
      supabase.from('viral_reels').select('*')
    ])

    if (settingsResult.error) throw settingsResult.error
    if (profilesResult1.error) throw profilesResult1.error
    if (profilesResult2.error) throw profilesResult2.error
    if (profilesResult3.error) throw profilesResult3.error
    if (reelsResult.error) throw reelsResult.error

    const settingsData = settingsResult.data
    const profilesData = (profilesResult1.data || [])
      .concat(profilesResult2.data || [])
      .concat(profilesResult3.data || [])
    const reelsData = reelsResult.data

    const sortedReels = (reelsData || []).sort((a, b) => {
      const rankA = a.order_index || 999999
      const rankB = b.order_index || 999999
      if (rankA !== rankB) {
        return rankA - rankB
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const responseData = {
      live_date: settingsData?.live_date || currentDate,
      most_followed: profilesData || [],
      viral_reels: sortedReels
    }

    // Save to server-side memory cache
    liveCache = {
      data: responseData,
      timestamp: now
    }

    // Set Edge CDN and Browser caching headers
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600')
    return res.status(200).json(responseData)
  } catch (err) {
    console.error('Public API Live Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch live data' })
  }
}

