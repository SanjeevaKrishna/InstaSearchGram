import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    // 1. Fetch live date settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('live_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (settingsError) throw settingsError

    // 2. Fetch most followed profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('most_followed')
      .select('*')
      .order('followers_count', { ascending: false })

    if (profilesError) throw profilesError

    // 3. Fetch viral reels today
    const { data: reelsData, error: reelsError } = await supabase
      .from('viral_reels')
      .select('*')

    if (reelsError) throw reelsError

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
    return res.status(200).json({
      live_date: settingsData?.live_date || currentDate,
      most_followed: profilesData || [],
      viral_reels: sortedReels
    })
  } catch (err) {
    console.error('Public API Live Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch live data' })
  }
}
