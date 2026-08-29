import { getAdminClient } from '../../../lib/supabase'
import { InstagramReelScraper } from '../../../lib/reelScraper'

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

  const { instagram_link } = req.body || {}
  if (!instagram_link) {
    return res.status(400).json({ error: 'instagram_link is required' })
  }

  try {
    const supabase = getAdminClient()
    const { data: settingsData } = await supabase
      .from('live_settings')
      .select('instagram_session_id, instagram_csrf_token')
      .eq('id', 1)
      .maybeSingle()

    const sessionId = settingsData?.instagram_session_id || process.env.INSTAGRAM_SESSION_ID || ''
    const csrfToken = settingsData?.instagram_csrf_token || process.env.INSTAGRAM_CSRF_TOKEN || ''

    const scraper = new InstagramReelScraper(sessionId, csrfToken)
    const result = await scraper.fetchReel(instagram_link)

    return res.status(200).json({ success: true, reel: result })
  } catch (err) {
    console.error('Fetch Reel Info Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch reel details' })
  }
}
