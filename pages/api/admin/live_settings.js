import { getAdminClient } from '../../../lib/supabase'
// Fields stored in live_settings row id=1:
//   live_date, trending_enabled, show_social_audit

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
      
      let settings = data || { id: 1, live_date: '' }
      let liveDateStr = settings.live_date || ''
      let showSocialAudit = true
      
      if (liveDateStr.includes('||AUDIT_OFF')) {
        showSocialAudit = false
        liveDateStr = liveDateStr.replace('||AUDIT_OFF', '')
      }
      
      settings.live_date = liveDateStr
      settings.show_social_audit = showSocialAudit

      return res.status(200).json({ settings })
    }

    // POST/PUT - update settings (id = 1)
    if (req.method === 'POST' || req.method === 'PUT') {
      const { live_date, trending_enabled, show_social_audit } = req.body

      let finalLiveDate = (live_date || '').replace('||AUDIT_OFF', '')
      if (show_social_audit === false) {
        finalLiveDate += '||AUDIT_OFF'
      }

      const { data, error } = await supabase
        .from('live_settings')
        .upsert({ 
          id: 1, 
          live_date: finalLiveDate, 
          trending_enabled: trending_enabled !== undefined ? trending_enabled : true,
          updated_at: new Date().toISOString() 
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
        
      let settings = data
      let liveDateStr = settings.live_date || ''
      let returnedAudit = true
      if (liveDateStr.includes('||AUDIT_OFF')) {
        returnedAudit = false
        liveDateStr = liveDateStr.replace('||AUDIT_OFF', '')
      }
      settings.live_date = liveDateStr
      settings.show_social_audit = returnedAudit

      return res.status(200).json({ settings })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
