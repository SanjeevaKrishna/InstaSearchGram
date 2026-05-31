import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q, featured } = req.query

  try {
    let query = supabase
      .from('celebrities')
      .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index')
      .order('order_index', { ascending: true })
      .order('name')

    if (q && q.trim()) {
      query = query.ilike('name', `%${q.trim()}%`)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true).limit(10)
    } else if (req.query.limit === 'all') {
      // no limit
    } else {
      query = query.limit(20)
    }

    const { data, error } = await query

    if (error) throw error

    res.status(200).json({ celebrities: data || [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch celebrities', celebrities: [] })
  }
}
