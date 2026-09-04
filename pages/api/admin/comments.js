import { getAdminClient } from '../../../lib/supabase'
import { getAccountInfo, calculateEffectiveLikes, determineBoostRate } from '../../../lib/commentBoost'

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

    if (req.method === 'GET') {
      const { action, target_type, target_slug } = req.query

      // 1. Get summary count per slug
      if (action === 'summary') {
        const { data, error } = await supabase
          .from('profile_comments')
          .select('target_type, target_slug')

        if (error) return res.status(500).json({ error: error.message })

        const counts = {}
        for (const row of (data || [])) {
          const key = `${row.target_type}:${row.target_slug}`
          counts[key] = (counts[key] || 0) + 1
          counts[row.target_slug] = (counts[row.target_slug] || 0) + 1
        }
        return res.status(200).json({ counts, totalAllComments: data?.length || 0 })
      }

      // 2. Get comments for specific slug
      if (target_slug) {
        let query = supabase
          .from('profile_comments')
          .select('*')
          .eq('target_slug', target_slug)

        if (target_type) {
          query = query.eq('target_type', target_type)
        }

        const { data, error } = await query.order('created_at', { ascending: true })

        if (error) return res.status(500).json({ error: error.message })

        // Structure parents + replies
        const account = await getAccountInfo(supabase, target_type || 'profile', target_slug)
        const parents = []
        const repliesMap = new Map()

        for (const c of (data || [])) {
          const rate = determineBoostRate(c, account)
          c.boost_rate = rate
          if (!c.parent_id) {
            const { effectiveLikes } = calculateEffectiveLikes(c, account)
            c.likes_count = effectiveLikes
            parents.push({ ...c, replies: [] })
          } else {
            if (!repliesMap.has(c.parent_id)) repliesMap.set(c.parent_id, [])
            repliesMap.get(c.parent_id).push(c)
          }
        }

        for (const p of parents) {
          p.replies = repliesMap.get(p.id) || []
        }

        // Newest top-level first
        parents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        return res.status(200).json({ comments: parents, totalCount: data?.length || 0 })
      }

      // 3. Fallback: recent comments across site (or filtered by target_type)
      let query = supabase.from('profile_comments').select('*')
      if (target_type) {
        query = query.eq('target_type', target_type)
      }
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(150)

      if (error) return res.status(500).json({ error: error.message })

      // Enrich recent comments with boost rates
      const enriched = await Promise.all(
        (data || []).map(async (c) => {
          const acc = await getAccountInfo(supabase, c.target_type, c.target_slug)
          const rate = determineBoostRate(c, acc)
          const { effectiveLikes } = calculateEffectiveLikes(c, acc)
          return {
            ...c,
            boost_rate: rate,
            likes_count: effectiveLikes
          }
        })
      )

      return res.status(200).json({ comments: enriched, totalCount: data?.length || 0 })
    }

    if (req.method === 'PUT') {
      const { id, content, author_name, likes_count, dislikes_count } = req.body
      if (!id) return res.status(400).json({ error: 'Comment id is required' })

      const updates = {}
      if (content !== undefined) updates.content = String(content).trim()
      if (author_name !== undefined) updates.author_name = String(author_name).trim()
      if (likes_count !== undefined) updates.likes_count = Math.max(0, parseInt(likes_count, 10) || 0)
      if (dislikes_count !== undefined) updates.dislikes_count = Math.max(0, parseInt(dislikes_count, 10) || 0)

      const { data, error } = await supabase
        .from('profile_comments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true, comment: data })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query.id ? req.query : req.body
      if (!id) return res.status(400).json({ error: 'Comment id is required' })

      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    console.error('Admin comments API error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
