import { refreshInstagramStats } from '../../../lib/instagramStats'
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { 
    celebrityId, 
    instagram_handle, 
    sessionId: bodySessionId, 
    csrfToken: bodyCsrfToken,
    maxPages = 17,
    nextMaxId = null,
    initialStats = null,
    lastScrapedDate = null
  } = req.body

  if (!celebrityId || !instagram_handle) {
    return res.status(400).json({ error: 'celebrityId and instagram_handle are required' })
  }

  // Load cookies from body if provided, otherwise fallback to Supabase live_settings
  let sessionId = bodySessionId || null;
  let csrfToken = bodyCsrfToken || null;

  if (!sessionId) {
    try {
      const supabase = getAdminClient();
      const { data: settings } = await supabase
        .from('live_settings')
        .select('instagram_session_id, instagram_csrf_token')
        .eq('id', 1)
        .single();

      if (settings?.instagram_session_id) {
        sessionId = settings.instagram_session_id;
        csrfToken = settings.instagram_csrf_token || null;
      }
    } catch (settingsErr) {
      console.warn('[refresh_stats] Could not load live_settings:', settingsErr.message);
    }
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  try {
    const result = await refreshInstagramStats(
      celebrityId, 
      instagram_handle, 
      sessionId, 
      csrfToken,
      maxPages ? parseInt(maxPages, 10) : 17,
      (stats) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', stats })}\n\n`);
      },
      nextMaxId,
      initialStats,
      lastScrapedDate
    )
    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Scraper Error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Failed to refresh statistics' })}\n\n`);
    res.end();
  }
}
