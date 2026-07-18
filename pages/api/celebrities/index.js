import { supabase } from '../../../lib/supabase'

// 2-minute memory cache for featured homepage query to eliminate database network delay for visitors
let featuredCache = {
  data: null,
  timestamp: 0
}
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q, featured } = req.query

  // Check cache for homepage featured query
  if (featured === 'true' && (!q || !q.trim())) {
    const now = Date.now()
    if (featuredCache.data && (now - featuredCache.timestamp < CACHE_DURATION)) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600')
      return res.status(200).json({ celebrities: featuredCache.data })
    }
  }

  try {
    let data = []
    let error = null

    if (featured === 'true') {
      let query = supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index, account_created_year')
        .order('order_index', { ascending: true })
        .order('name')
        .eq('is_featured', true)
        .neq('hide_search', true)
        .limit(10)
      if (q && q.trim()) {
        query = query.ilike('name', `%${q.trim()}%`)
      }
      const res = await query
      data = res.data
      error = res.error

      // Save to memory cache if query succeeds and no search filter is active
      if (!error && (!q || !q.trim())) {
        featuredCache = {
          data: data || [],
          timestamp: Date.now()
        }
      }
    } else if (req.query.limit === 'all') {
      let from = 0
      let to = 999
      while (true) {
        let query = supabase
          .from('celebrities')
          .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index, account_created_year')
          .order('order_index', { ascending: true })
          .order('name')
          .neq('hide_search', true)
          .range(from, to)
        if (q && q.trim()) {
          query = query.ilike('name', `%${q.trim()}%`)
        }
        const { data: pageData, error: pageError } = await query
        if (pageError) {
          error = pageError
          break
        }
        data = data.concat(pageData || [])
        if (!pageData || pageData.length < 1000) break
        from += 1000
        to += 1000
      }
    } else {
      let query = supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index, account_created_year')
        .order('order_index', { ascending: true })
        .order('name')
        .neq('hide_search', true)
        .limit(20)
      if (q && q.trim()) {
        query = query.ilike('name', `%${q.trim()}%`)
      }
      const res = await query
      data = res.data
      error = res.error
    }

    if (error) throw error

    // Set Cache-Control headers on featured homepage query
    if (featured === 'true' && (!q || !q.trim())) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600')
    }

    res.status(200).json({ celebrities: data || [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch celebrities', celebrities: [] })
  }
}

