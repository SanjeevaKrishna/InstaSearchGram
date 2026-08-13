import { InstagramFollowersScraper } from '../../lib/followersScraper'
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const { username, token } = req.query

  // 1. Authenticate using the admin API token
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    return res.status(401).json({ success: false, error: "Unauthorized" })
  }

  // 2. Validate input parameters
  if (!username) {
    return res.status(400).json({ success: false, error: "Missing username parameter" })
  }

  try {
    // 3. Retrieve auth cookies from database, fallback to server-side environment variables
    const { data: settingsData } = await supabase
      .from('live_settings')
      .select('instagram_session_id, instagram_csrf_token')
      .eq('id', 1)
      .maybeSingle();

    const sessionId = settingsData?.instagram_session_id || process.env.INSTAGRAM_SESSION_ID || "";
    const csrfToken = settingsData?.instagram_csrf_token || process.env.INSTAGRAM_CSRF_TOKEN || "";

    // 4. Initialize scraper and fetch followers count
    const scraper = new InstagramFollowersScraper(sessionId, csrfToken);
    const data = await scraper.fetchFollowers(username);

    // 5. Return stats payload
    return res.status(200).json({
      success: true,
      username: data.username,
      displayName: data.displayName,
      followersCount: data.followersCount,
      isVerified: data.isVerified,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[API Error] Failed to scrape followers for @${username}:`, err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to scrape profile"
    });
  }
}
