import { getAdminClient } from '../../../lib/supabase'
import { InstagramReelScraper, formatNumberText } from '../../../lib/reelScraper'

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { table = 'viral_reels', sortBy = 'score' } = req.body || {}

  const supabase = getAdminClient()

  // 1. Fetch credentials from live_settings table
  const { data: settingsData } = await supabase
    .from('live_settings')
    .select('instagram_session_id, instagram_csrf_token')
    .eq('id', 1)
    .maybeSingle()

  const sessionId = settingsData?.instagram_session_id || process.env.INSTAGRAM_SESSION_ID || ''
  const csrfToken = settingsData?.instagram_csrf_token || process.env.INSTAGRAM_CSRF_TOKEN || ''

  // 2. Fetch all reels in the selected table
  const { data: reels, error: fetchErr } = await supabase
    .from(table)
    .select('*')
    .order('order_index', { ascending: true })

  if (fetchErr) {
    return res.status(500).json({ error: fetchErr.message })
  }

  if (!reels || reels.length === 0) {
    return res.status(200).json({ message: 'No reels found to refresh.', total: 0, updated: 0, failed: 0 })
  }

  // 3. Set SSE streaming headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  })

  const scraper = new InstagramReelScraper(sessionId, csrfToken)
  let updated = 0
  let failed = 0
  const failures = []
  const scoredReels = []

  // Send start event
  res.write(`data: ${JSON.stringify({
    type: 'start',
    total: reels.length,
    table
  })}\n\n`)

  // 4. Sequentially scrape and update each reel
  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i]
    const currentOldRank = reel.order_index || (i + 1)

    if (i > 0) await sleep(2500)

    try {
      if (!reel.instagram_link) {
        throw new Error('No Instagram link provided')
      }

      const scraped = await scraper.fetchReel(reel.instagram_link)

      const updates = {}

      if (table === 'most_viewed_reels') {
        if (scraped.viewsText && scraped.viewsText !== '—') updates.views_text = scraped.viewsText
      } else if (table === 'most_liked_reels' || table === 'most_liked_posts') {
        if (scraped.likesText && scraped.likesText !== '—') updates.likes_text = scraped.likesText
      } else {
        // viral_reels (trending)
        if (scraped.viewsText && scraped.viewsText !== '—') updates.views_text = scraped.viewsText
      }

      // Save real Instagram upload timestamp if available
      if (scraped.takenAt && (!reel.created_at || new Date(scraped.takenAt) > new Date('2020-01-01'))) {
        updates.created_at = scraped.takenAt
      }

      // Fill in creator/thumbnail metadata if empty
      if (!reel.creator_name && scraped.creatorName) updates.creator_name = scraped.creatorName
      if (!reel.creator_photo_url && scraped.creatorPhotoUrl) updates.creator_photo_url = scraped.creatorPhotoUrl
      if (!reel.photo_url && scraped.thumbnailUrl) updates.photo_url = scraped.thumbnailUrl

      if (Object.keys(updates).length > 0) {
        await supabase
          .from(table)
          .update(updates)
          .eq('id', reel.id)
      }

      updated++
      scoredReels.push({
        ...reel,
        ...updates,
        scrapedViews: scraped.viewsCount,
        scrapedLikes: scraped.likesCount,
        scrapedComments: scraped.commentsCount,
        score: scraped.score,
        oldRank: currentOldRank
      })

      console.log(`[BatchRefresh] OK [${i + 1}/${reels.length}] (${table}) "${reel.title}" -> Views: ${scraped.viewsText}, Likes: ${scraped.likesText}`)

      // Stream progress
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: i + 1,
        total: reels.length,
        percent: Math.round(((i + 1) / reels.length) * 100),
        id: reel.id,
        title: reel.title,
        creator: reel.creator_name || scraped.creatorName,
        viewsText: scraped.viewsText,
        likesText: scraped.likesText,
        commentsText: scraped.commentsText,
        status: 'success',
        updated,
        failed
      })}\n\n`)

    } catch (err) {
      failed++
      failures.push({ id: reel.id, title: reel.title, link: reel.instagram_link, error: err.message })
      console.warn(`[BatchRefresh] FAIL [${i + 1}/${reels.length}] (${table}) "${reel.title}" -> ${err.message}`)

      scoredReels.push({
        ...reel,
        score: 0,
        oldRank: currentOldRank
      })

      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: i + 1,
        total: reels.length,
        percent: Math.round(((i + 1) / reels.length) * 100),
        id: reel.id,
        title: reel.title,
        status: 'failed',
        error: err.message,
        updated,
        failed
      })}\n\n`)
    }
  }

  // 5. Sort items based on table mode
  scoredReels.sort((a, b) => {
    if (table === 'most_viewed_reels') {
      return (b.scrapedViews || 0) - (a.scrapedViews || 0)
    }
    if (table === 'most_liked_reels' || table === 'most_liked_posts') {
      return (b.scrapedLikes || 0) - (a.scrapedLikes || 0)
    }
    // Default viral_reels: sort by viral momentum score
    return (b.score || 0) - (a.score || 0)
  })

  // 6. Update new order_index in database
  for (let rank = 0; rank < scoredReels.length; rank++) {
    const item = scoredReels[rank]
    const newRank = rank + 1
    item.newRank = newRank
    item.rankDiff = item.oldRank - newRank

    await supabase
      .from(table)
      .update({ order_index: newRank })
      .eq('id', item.id)
  }

  // 7. Send complete event
  res.write(`data: ${JSON.stringify({
    type: 'complete',
    total: reels.length,
    updated,
    failed,
    failures,
    reorderedReels: scoredReels
  })}\n\n`)

  res.end()
}
