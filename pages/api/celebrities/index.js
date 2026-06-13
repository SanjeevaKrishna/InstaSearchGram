import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q, featured } = req.query

  try {
    let data = []
    let error = null

    if (featured === 'true') {
      let query = supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index')
        .order('order_index', { ascending: true })
        .order('name')
        .eq('is_featured', true)
        .limit(10)
      if (q && q.trim()) {
        query = query.ilike('name', `%${q.trim()}%`)
      }
      const res = await query
      data = res.data
      error = res.error
    } else if (req.query.limit === 'all') {
      let from = 0
      let to = 999
      while (true) {
        let query = supabase
          .from('celebrities')
          .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index')
          .order('order_index', { ascending: true })
          .order('name')
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
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index')
        .order('order_index', { ascending: true })
        .order('name')
        .limit(20)
      if (q && q.trim()) {
        query = query.ilike('name', `%${q.trim()}%`)
      }
      const res = await query
      data = res.data
      error = res.error
    }

    if (error) throw error

    res.status(200).json({ celebrities: data || [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch celebrities', celebrities: [] })
  }
}
