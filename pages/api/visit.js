import { getAdminClient } from '../../lib/supabase'
import crypto from 'crypto'

export default async function handler(req, res) {
  // Allow POST requests for registering pings
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const supabase = getAdminClient()
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    const today = new Date().toISOString().split('T')[0]

    // Create a secure anonymized SHA256 hash (PII compliant) using IP + date + admin secret salt
    const hash = crypto
      .createHash('sha256')
      .update(ip + today + (process.env.ADMIN_SECRET_CODE || 'default_salt'))
      .digest('hex')

    // Upsert visit into database, ignoring duplicates to only capture daily unique visitors
    await supabase
      .from('visits')
      .upsert(
        { visit_date: today, visitor_hash: hash },
        { onConflict: 'visit_date,visitor_hash', ignoreDuplicates: true }
      )

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Visitor Logging Error:', err)
    // Fail silently to ensure AdSense and user navigation remain completely unaffected
    return res.status(200).json({ success: true })
  }
}
