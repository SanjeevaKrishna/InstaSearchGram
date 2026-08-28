import { getAdminClient } from '../../lib/supabase.js'
import { InstagramCollector } from '../../lib/instagramScraper.js'

// In-memory cache to rate limit updates to once per hour per profile id (from most_followed table)
const lastRefreshCache = new Map()

export default async function handler(req, res) {
  const supabase = getAdminClient()
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Missing profile ID' })
  }

  // 1. Rate Limit check (5 minutes)
  const now = Date.now()
  const lastRefresh = lastRefreshCache.get(id) || 0
  if (now - lastRefresh < 300 * 1000) {
    return res.json({ cached: true, message: 'Rate limited to once per 5 minutes' })
  }

  try {
    // Fetch profile details from most_followed table (which powers profile details page)
    const { data: profile, error: fetchError } = await supabase
      .from('most_followed')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const handle = profile.instagram_handle
    if (!handle) {
      return res.status(400).json({ error: 'Profile has no instagram handle' })
    }

    // Fetch live_settings to get the session ID
    const { data: settings } = await supabase
      .from('live_settings')
      .select('*')
      .single()
    const sessionId = settings?.instagram_session_id || ''

    // Update rate limit cache immediately to prevent parallel requests
    lastRefreshCache.set(id, now)

    // Use modular InstagramCollector getProfileInfo method
    const collector = new InstagramCollector(sessionId, '')
    const profileData = await collector.getProfileInfo(handle)

    if (!profileData || !profileData.followersCount) {
      throw new Error(`Failed to parse follower count for @${handle}`)
    }

    const parsedFollowers = profileData.followersCount

    // Prepare history updates
    const todayStr = new Date().toISOString().split('T')[0]
    let history = Array.isArray(profile.follower_history) ? [...profile.follower_history] : []
    
    // Check if today's entry exists
    const todayIdx = history.findIndex(e => e.date === todayStr)
    if (todayIdx !== -1) {
      history[todayIdx].count = parsedFollowers
    } else {
      history.push({ date: todayStr, count: parsedFollowers })
    }

    // Keep history sorted
    history.sort((a, b) => new Date(a.date) - new Date(b.date))

    const followersText = parsedFollowers >= 1000000 
      ? `${(Math.floor(parsedFollowers / 100000) / 10).toFixed(1).replace(/\.0$/, '')}M` 
      : parsedFollowers >= 1000 
        ? `${(Math.floor(parsedFollowers / 100) / 10).toFixed(1).replace(/\.0$/, '')}K` 
        : parsedFollowers.toString();


    // Update most_followed table (powers profile details page)
    const { data: updatedData, error: updateError } = await supabase
      .from('most_followed')
      .update({
        followers_count: parsedFollowers,
        follower_history: history,
        followers_text: followersText
      })
      .eq('id', id)
      .select('*')

    if (updateError) {
      throw updateError
    }

    const updatedProfile = updatedData?.[0]

    // Keep celebrities table in sync if matching handle exists
    try {
      await supabase
        .from('celebrities')
        .update({
          followers_count: parsedFollowers
        })
        .eq('instagram_handle', handle)
    } catch (syncErr) {
      console.warn(`Sync warning: could not update celebrities table for handle ${handle}:`, syncErr)
    }

    return res.json({
      cached: false,
      followersCount: parsedFollowers,
      followerHistory: history,
      profile: updatedProfile
    })

  } catch (err) {
    console.error(`refresh_live_followers error:`, err)
    // Clear cache entry on error so they can retry
    lastRefreshCache.delete(id)
    return res.status(500).json({ error: err.message })
  }
}
