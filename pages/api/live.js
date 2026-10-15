import { supabase } from '../../lib/supabase'
import { proxyProfileImages } from '../../lib/imageProxy'

// 2-minute memory cache to prevent heavy database loads and network latency on concurrent queries
let liveCache = {
  data: null,
  timestamp: 0
}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function parseCountText(text) {
  if (!text) return 0;
  const cleaned = text.toString().trim().toLowerCase();
  const numMatch = cleaned.match(/^([0-9.]+)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1]);
  if (isNaN(num)) return 0;
  
  if (cleaned.includes('b') || cleaned.includes('billion')) {
    return num * 1000000000;
  }
  if (cleaned.includes('m') || cleaned.includes('million')) {
    return num * 1000000;
  }
  if (cleaned.includes('k') || cleaned.includes('thousand')) {
    return num * 1000;
  }
  if (cleaned.includes('crore') || cleaned.includes('cr')) {
    return num * 10000000;
  }
  if (cleaned.includes('lakh') || cleaned.includes('l')) {
    return num * 100000;
  }
  return num;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const now = Date.now()
    const isFresh = req.query.fresh === 'true'
    if (!isFresh && liveCache.data && (now - liveCache.timestamp < CACHE_DURATION)) {
      // Set Edge CDN and Browser caching headers (cache for 5m, stale-while-revalidate for 10 minutes)
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(liveCache.data)
    }

    // Fetch live settings, profiles, viral reels, most viewed reels and celebrities concurrently
    const [
      settingsResult, 
      profilesResult1, 
      profilesResult2, 
      reelsResult, 
      mostViewedResult, 
      celebritiesResult,
      indiaMostLikedResult,
      mostLikedReelsResult,
      mostLikedCommentsResult
    ] = await Promise.all([
      supabase.from('live_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(0, 999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(1000, 1999),
      supabase.from('viral_reels').select('*'),
      supabase.from('most_viewed_reels').select('*'),
      supabase.from('celebrities').select('name, slug, photo_url, followers_count').neq('hide_search', true),
      supabase.from('most_liked_posts').select('*'),
      supabase.from('most_liked_reels').select('*'),
      supabase.from('most_liked_comments').select('*')
    ])

    if (settingsResult.error) throw settingsResult.error
    if (profilesResult1.error) throw profilesResult1.error
    if (profilesResult2.error) throw profilesResult2.error
    if (reelsResult.error) throw reelsResult.error
    if (mostViewedResult.error) throw mostViewedResult.error
    if (celebritiesResult.error) throw celebritiesResult.error
    if (indiaMostLikedResult.error) throw indiaMostLikedResult.error
    if (mostLikedReelsResult.error) throw mostLikedReelsResult.error

    const settingsData = settingsResult.data
    const reelsData = reelsResult.data
    const mostViewedData = mostViewedResult.data
    const celebritiesData = celebritiesResult.data || []

    // Build mapping from trimmed name to slug, photo_url and followers_count
    const celebrityMap = {}
    for (const c of celebritiesData) {
      if (c.name && c.slug) {
        celebrityMap[c.name.toLowerCase().trim()] = { slug: c.slug, photo_url: c.photo_url, followers_count: c.followers_count }
      }
    }

    // Combine profiles page ranges and fetch further pages dynamically only if database exceeds 2000
    let combinedProfiles = (profilesResult1.data || []).concat(profilesResult2.data || [])
    if ((profilesResult2.data || []).length === 1000) {
      const { data: profilesResult3 } = await supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(2000, 2999)
      if (profilesResult3) combinedProfiles = combinedProfiles.concat(profilesResult3)
    }

    const profilesData = combinedProfiles.map(profile => ({
      ...profile,
      celebritySlug: profile.name ? (celebrityMap[profile.name.toLowerCase().trim()]?.slug || null) : null
    }))

    const sortedReels = (reelsData || []).sort((a, b) => {
      const rankA = a.order_index || 999999
      const rankB = b.order_index || 999999
      if (rankA !== rankB) {
        return rankA - rankB
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const mappedReels = sortedReels.map(reel => {
      const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
      const match = celebrityMap[nameKey]
      return {
        ...reel,
        creator_photo_url: reel.creator_photo_url || (match ? match.photo_url : null),
        creator_slug: match ? match.slug : null,
        celebrity_followers_count: match ? match.followers_count : null
      }
    })

    const sortedMostViewed = (mostViewedData || []).sort((a, b) => {
      const countA = parseCountText(a.views_text)
      const countB = parseCountText(b.views_text)
      if (countA !== countB) {
        return countB - countA
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const mappedMostViewed = sortedMostViewed.map(reel => {
      const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
      const match = celebrityMap[nameKey]
      return {
        ...reel,
        creator_photo_url: reel.creator_photo_url || (match ? match.photo_url : null),
        creator_slug: match ? match.slug : null,
        celebrity_followers_count: match ? match.followers_count : null
      }
    })

    const sortedMostLiked = (indiaMostLikedResult.data || []).sort((a, b) => {
      const countA = parseCountText(a.likes_text)
      const countB = parseCountText(b.likes_text)
      if (countA !== countB) {
        return countB - countA
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const mappedMostLiked = sortedMostLiked.map(post => {
      const nameKey = (post.creator_name || '').replace('@', '').toLowerCase().trim()
      const match = celebrityMap[nameKey]
      return {
        ...post,
        creator_photo_url: post.creator_photo_url || (match ? match.photo_url : null),
        creator_slug: match ? match.slug : null,
        celebrity_followers_count: match ? match.followers_count : null
      }
    })

    const sortedMostLikedReels = (mostLikedReelsResult.data || []).sort((a, b) => {
      const countA = parseCountText(a.likes_text)
      const countB = parseCountText(b.likes_text)
      if (countA !== countB) {
        return countB - countA
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const mappedMostLikedReels = sortedMostLikedReels.map(reel => {
      const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
      const match = celebrityMap[nameKey]
      return {
        ...reel,
        creator_photo_url: reel.creator_photo_url || (match ? match.photo_url : null),
        creator_slug: match ? match.slug : null,
        celebrity_followers_count: match ? match.followers_count : null
      }
    })

    const rawCommentsData = (mostLikedCommentsResult && mostLikedCommentsResult.data) ? mostLikedCommentsResult.data : []
    const sortedMostLikedComments = [...rawCommentsData].sort((a, b) => {
      const countA = parseCountText(a.likes_text)
      const countB = parseCountText(b.likes_text)
      if (countA !== countB) {
        return countB - countA
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const mappedMostLikedComments = sortedMostLikedComments.map(comment => {
      const nameKey = (comment.creator_name || '').replace('@', '').toLowerCase().trim()
      const match = celebrityMap[nameKey]
      return {
        ...comment,
        creator_photo_url: comment.creator_photo_url || (match ? match.photo_url : null),
        creator_slug: match ? match.slug : null,
        celebrity_followers_count: match ? match.followers_count : null
      }
    })

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const responseData = {
      live_date: settingsData?.live_date || currentDate,
      trending_enabled: settingsData?.trending_enabled !== undefined ? settingsData.trending_enabled : true,
      most_followed: proxyProfileImages(profilesData || []),
      viral_reels: proxyProfileImages(mappedReels || []),
      most_viewed_reels: proxyProfileImages(mappedMostViewed || []),
      india_most_liked_posts: proxyProfileImages(mappedMostLiked || []),
      most_liked_reels: proxyProfileImages(mappedMostLikedReels || []),
      most_liked_comments: proxyProfileImages(mappedMostLikedComments || [])
    }

    // Save to server-side memory cache
    liveCache = {
      data: responseData,
      timestamp: now
    }

    // Set Edge CDN and Browser caching headers
    if (isFresh) {
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30')
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    }
    return res.status(200).json(responseData)
  } catch (err) {
    console.error('Public API Live Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch live data' })
  }
}

