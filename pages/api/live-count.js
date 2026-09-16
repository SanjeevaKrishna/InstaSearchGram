import { getAdminClient } from '../../lib/supabase.js'

// Returns live follower count for a given instagram_handle
// - If today's follower_history entry has live_at < 5 min ago: returns cached live_count immediately
// - If stale (> 5 min): queues handle in live_settings (id: 99) for the laptop script to fetch
// - Frontend polls this endpoint while animation is running

const FIVE_MINUTES_MS = 5 * 60 * 1000

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { handle } = req.query
  if (!handle) return res.status(400).json({ error: 'Missing handle param' })

  const cleanHandle = handle.toLowerCase().trim().replace(/^@/, '')
  const supabase = getAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const now = Date.now()

  try {
    // 1. Fetch profile with follower_history
    const { data: profile, error: profileErr } = await supabase
      .from('most_followed')
      .select('id, instagram_handle, followers_count, followers_text, follower_history')
      .ilike('instagram_handle', cleanHandle)
      .maybeSingle()

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const history = Array.isArray(profile.follower_history) ? profile.follower_history : []
    const todayEntry = history.find(h => h && h.date === today)
    const liveAt = todayEntry?.live_at ? Number(todayEntry.live_at) : 0
    const isFresh = liveAt > 0 && (now - liveAt) < FIVE_MINUTES_MS

    if (isFresh) {
      return res.status(200).json({
        fresh: true,
        count: todayEntry.count || profile.followers_count,
        live_at: liveAt,
        fallback_count: profile.followers_count
      })
    }

    // 2. Not fresh: add to pending queue in live_settings (id: 99)
    const { data: stateRow } = await supabase
      .from('live_settings')
      .select('instagram_session_id')
      .eq('id', 99)
      .maybeSingle()

    let state = { queue: [], batch_job: { status: 'idle', progress: 0, total: 0 } }
    if (stateRow?.instagram_session_id) {
      try {
        state = JSON.parse(stateRow.instagram_session_id)
      } catch {}
    }

    const queue = Array.isArray(state.queue) ? state.queue : []
    const alreadyQueued = queue.some(item => item.handle === cleanHandle && item.status === 'pending')

    if (!alreadyQueued) {
      // Keep queue bounded to last 50 items
      const updatedQueue = [
        ...queue.filter(item => item.handle !== cleanHandle),
        { handle: cleanHandle, requested_at: now, status: 'pending' }
      ].slice(-50)

      state.queue = updatedQueue

      await supabase
        .from('live_settings')
        .upsert({
          id: 99,
          live_date: 'live_sync_state',
          instagram_session_id: JSON.stringify(state)
        })
    }

    return res.status(200).json({
      fresh: false,
      count: profile.followers_count,
      queued: true,
      live_at: liveAt || null,
      fallback_count: profile.followers_count
    })

  } catch (err) {
    console.error('[live-count] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
