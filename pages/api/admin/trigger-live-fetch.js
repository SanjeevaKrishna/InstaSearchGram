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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = getAdminClient()

  try {
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

    state.batch_job = {
      requested: true,
      requested_at: new Date().toISOString(),
      status: 'queued',
      progress: 0,
      total: 0,
      updated: 0,
      failed: 0,
      last_completed_at: null
    }

    const { error } = await supabase
      .from('live_settings')
      .upsert({
        id: 99,
        live_date: 'live_sync_state',
        instagram_session_id: JSON.stringify(state)
      })

    if (error) throw error

    return res.status(200).json({ success: true, message: 'Live fetch job queued for laptop worker.' })
  } catch (err) {
    console.error('[trigger-live-fetch]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
