import { getAdminClient } from '../../../lib/supabase'
import { getAccountInfo, calculateEffectiveLikes, syncCommentLikesToDB, determineBoostRate } from '../../../lib/commentBoost'

// In-memory rate limiting map (IP -> timestamp)
const ipCooldownMap = new Map()
const COOLDOWN_MS = 15000 // 15 seconds per comment per IP

const URL_REGEX = /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/|discord\.gg\/|[a-zA-Z0-9-]+\.(?:com|org|net|xyz|ru|top|site|io|biz|info)(?:\/[^\s]*)?)/i

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}

async function handleGet(req, res) {
  try {
    const { target_type, target_slug, sort = 'top' } = req.query

    if (!target_type || !target_slug) {
      return res.status(400).json({ error: 'target_type and target_slug are required' })
    }

    const supabase = getAdminClient()

    // Fetch all comments for target
    const { data: allComments, error } = await supabase
      .from('profile_comments')
      .select('id, target_type, target_slug, parent_id, author_name, avatar_emoji, avatar_color, content, likes_count, dislikes_count, created_at')
      .eq('target_type', target_type)
      .eq('target_slug', target_slug)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return res.status(500).json({ error: 'Failed to fetch comments' })
    }

    // Auto-boost daily engagement for direct comments (replies excluded)
    const account = await getAccountInfo(supabase, target_type, target_slug)
    for (const item of (allComments || [])) {
      if (!item.parent_id) {
        const { effectiveLikes, rate } = calculateEffectiveLikes(item, account)
        item.likes_count = effectiveLikes
        item.boost_rate = rate
      }
    }

    // Background sync to database so Supabase permanently stores updated likes
    syncCommentLikesToDB(supabase, allComments, account).catch(e =>
      console.error('Error syncing daily comment likes to DB:', e)
    )

    // Structure into parents and nested replies
    const parentComments = []
    const repliesMap = new Map()

    for (const item of (allComments || [])) {
      if (!item.parent_id) {
        parentComments.push({ ...item, replies: [] })
      } else {
        if (!repliesMap.has(item.parent_id)) {
          repliesMap.set(item.parent_id, [])
        }
        repliesMap.get(item.parent_id).push(item)
      }
    }

    // Attach replies to parents
    for (const parent of parentComments) {
      parent.replies = repliesMap.get(parent.id) || []
    }

    // Sort parent comments (default: 'top' - most liked comments first)
    if (sort === 'newest') {
      parentComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else {
      // 'top': higher net likes (likes - dislikes) first; if tied, newest first
      parentComments.sort((a, b) => {
        const scoreB = (b.likes_count || 0) - (b.dislikes_count || 0)
        const scoreA = (a.likes_count || 0) - (a.dislikes_count || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }

    return res.status(200).json({
      comments: parentComments,
      totalCount: allComments?.length || 0
    })
  } catch (err) {
    console.error('Unexpected comments GET error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePost(req, res) {
  try {
    const {
      target_type,
      target_slug,
      content,
      author_name = 'Anonymous',
      avatar_emoji = '🔥',
      avatar_color = 'linear-gradient(135deg, #6366f1, #a855f7)',
      parent_id = null,
      honeypot = ''
    } = req.body

    // 1. Spambot honeypot trap
    if (honeypot && honeypot.trim().length > 0) {
      // Fake success for bots so they don't retry
      return res.status(200).json({ success: true, message: 'Comment submitted' })
    }

    // 2. Validate target
    if (!target_type || !target_slug) {
      return res.status(400).json({ error: 'Target type and target slug are required.' })
    }

    // 3. Validate content
    const cleanContent = (content || '').trim()
    if (!cleanContent || cleanContent.length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' })
    }
    if (cleanContent.length > 500) {
      return res.status(400).json({ error: 'Comment exceeds maximum allowed length of 500 characters.' })
    }

    // 4. Block spam links & promo URLs
    if (URL_REGEX.test(cleanContent)) {
      return res.status(400).json({ error: 'External links and promotion are not permitted.' })
    }

    // 5. Rate limit check (15 seconds per IP)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const lastPostTime = ipCooldownMap.get(ip)

    if (lastPostTime && (now - lastPostTime < COOLDOWN_MS)) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastPostTime)) / 1000)
      return res.status(429).json({ error: `Please wait ${waitSec}s before posting another comment.` })
    }

    ipCooldownMap.set(ip, now)

    // Clean up old rate limit entries
    if (ipCooldownMap.size > 2000) {
      const expirationTime = now - COOLDOWN_MS
      for (const [key, val] of ipCooldownMap.entries()) {
        if (val < expirationTime) ipCooldownMap.delete(key)
      }
    }

    // 6. Clean author name
    const cleanName = (author_name || 'Anonymous').trim().slice(0, 30) || 'Anonymous'

    // 7. Extract strictly emoji only (rejects non-emoji text/numbers)
    let cleanEmoji = '🔥'
    if (avatar_emoji) {
      const match = String(avatar_emoji).match(/\p{Extended_Pictographic}/u)
      if (match) {
        cleanEmoji = match[0]
      }
    }

    const supabase = getAdminClient()

    const newRow = {
      target_type,
      target_slug,
      parent_id: parent_id || null,
      author_name: cleanName,
      avatar_emoji: cleanEmoji,
      avatar_color: (avatar_color || 'linear-gradient(135deg, #0284c7, #38bdf8)').slice(0, 80),
      content: cleanContent,
      likes_count: 0,
      dislikes_count: 0
    }

    const { data, error } = await supabase
      .from('profile_comments')
      .insert(newRow)
      .select()
      .single()

    if (error) {
      console.error('Error inserting comment:', error)
      return res.status(500).json({ error: 'Failed to post comment. Please try again.' })
    }

    const account = await getAccountInfo(supabase, target_type, target_slug)
    const boostRate = determineBoostRate({ content: cleanContent, parent_id }, account)

    return res.status(201).json({
      success: true,
      comment: {
        ...data,
        boost_rate: boostRate,
        replies: []
      }
    })
  } catch (err) {
    console.error('Unexpected comments POST error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
