import { refreshInstagramStats } from '../../../lib/instagramStats'

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

  const { celebrityId, instagram_handle, sessionId, csrfToken } = req.body

  if (!celebrityId || !instagram_handle) {
    return res.status(400).json({ error: 'celebrityId and instagram_handle are required' })
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
      (stats) => {
        res.write(`data: ${JSON.stringify({ type: 'progress', stats })}\n\n`);
      }
    )
    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Scraper Error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Failed to refresh statistics' })}\n\n`);
    res.end();
  }
}
