import { getAdminClient } from '../../../lib/supabase'

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
  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = getAdminClient()

    // GET - retrieve current settings (id = 1)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('live_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ settings: data || { id: 1, live_date: '' } })
    }

    // POST/PUT - update settings (id = 1)
    if (req.method === 'POST' || req.method === 'PUT') {
      const { live_date, trending_enabled } = req.body

      const { data, error } = await supabase
        .from('live_settings')
        .upsert({ 
          id: 1, 
          live_date, 
          trending_enabled: trending_enabled !== undefined ? trending_enabled : true,
          updated_at: new Date().toISOString() 
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ settings: data })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
