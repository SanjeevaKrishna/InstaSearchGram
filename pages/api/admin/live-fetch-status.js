import { getAdminClient } from '../../../lib/supabase.js'

function verifyAdmin(req) {
  const auth = req.headers['x-admin-token']
  if (!auth) return false
  try {
    const decoded = Buffer.from(auth, 'base64').toString('utf8')
    return decoded === process.env.ADMIN_SECRET_CODE + ':admin'
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = getAdminClient()

  try {
    const { data: stateRow, error } = await supabase
      .from('live_settings')
      .select('instagram_session_id')
      .eq('id', 99)
      .maybeSingle()

    if (error) throw error

    let state = { queue: [], batch_job: { status: 'idle', progress: 0, total: 0 } }
    if (stateRow?.instagram_session_id) {
      try {
        state = JSON.parse(stateRow.instagram_session_id)
      } catch {}
    }

    return res.status(200).json({
      success: true,
      job: state.batch_job || { status: 'idle', progress: 0, total: 0 },
      pendingQueueLength: (state.queue || []).filter(q => q.status === 'pending').length
    })
  } catch (err) {
    console.error('[live-fetch-status]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
