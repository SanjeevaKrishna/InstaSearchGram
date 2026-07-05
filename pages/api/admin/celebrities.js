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
  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = getAdminClient()

    // GET - list all celebrities (paginated to fetch all, bypassing 1000-row limit)
    if (req.method === 'GET') {
      let celebritiesData = []
      let from = 0
      let to = 999
      while (true) {
        const { data, error } = await supabase
          .from('celebrities')
          .select('*')
          .order('order_index', { ascending: true })
          .order('name')
          .range(from, to)

        if (error) return res.status(500).json({ error: error.message })
        celebritiesData = celebritiesData.concat(data || [])
        if (!data || data.length < 1000) break
        from += 1000
        to += 1000
      }
      return res.status(200).json({ celebrities: celebritiesData })
    }

    // POST - add new celebrity
    if (req.method === 'POST') {
      const { name, instagram_handle, followers_count, posts_count, photo_url, is_featured, has_full_details, order_index, total_reel_views, total_reel_likes, total_post_likes, total_comments, total_shares, total_reposts, hide_search, description, average_views, average_reel_likes, average_post_likes, followers_interaction, most_likes } = req.body
      if (!name) return res.status(400).json({ error: 'Name is required' })

      // Auto generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('celebrities')
        .insert([{
          name, slug, instagram_handle, photo_url,
          followers_count, posts_count,
          is_featured: is_featured || false,
          has_full_details: has_full_details || false,
          request_count: 0,
          order_index: order_index ? Number(order_index) : 0,
          total_reel_views: total_reel_views ? Number(total_reel_views) : 0,
          total_reel_likes: total_reel_likes ? Number(total_reel_likes) : 0,
          total_post_likes: total_post_likes ? Number(total_post_likes) : 0,
          total_comments: total_comments ? Number(total_comments) : 0,
          total_shares: total_shares ? Number(total_shares) : 0,
          total_reposts: total_reposts ? Number(total_reposts) : 0,
          most_likes: most_likes ? Number(most_likes) : 0,
          average_views: average_views ? Number(average_views) : 0,
          average_reel_likes: average_reel_likes ? Number(average_reel_likes) : 0,
          average_post_likes: average_post_likes ? Number(average_post_likes) : 0,
          followers_interaction: followers_interaction ? Number(followers_interaction) : 0,
          hide_search: hide_search || false,
          description: description || ''
        }])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ celebrity: data })
    }

    // PUT - update celebrity
    if (req.method === 'PUT') {
      const { id, name, instagram_handle, followers_count, posts_count, photo_url, is_featured, has_full_details, request_count, order_index, total_reel_views, total_reel_likes, total_post_likes, total_comments, total_shares, total_reposts, hide_search, description, average_views, average_reel_likes, average_post_likes, followers_interaction, most_likes } = req.body
      if (!id) return res.status(400).json({ error: 'ID required' })

      const { data, error } = await supabase
        .from('celebrities')
        .update({
          name, instagram_handle, photo_url,
          followers_count, posts_count,
          is_featured,
          has_full_details: has_full_details || false,
          request_count: request_count || 0,
          order_index: order_index ? Number(order_index) : 0,
          total_reel_views: total_reel_views ? Number(total_reel_views) : 0,
          total_reel_likes: total_reel_likes ? Number(total_reel_likes) : 0,
          total_post_likes: total_post_likes ? Number(total_post_likes) : 0,
          total_comments: total_comments ? Number(total_comments) : 0,
          total_shares: total_shares ? Number(total_shares) : 0,
          total_reposts: total_reposts ? Number(total_reposts) : 0,
          most_likes: most_likes !== undefined ? Number(most_likes) : 0,
          average_views: average_views !== undefined ? Number(average_views) : 0,
          average_reel_likes: average_reel_likes !== undefined ? Number(average_reel_likes) : 0,
          average_post_likes: average_post_likes !== undefined ? Number(average_post_likes) : 0,
          followers_interaction: followers_interaction !== undefined ? Number(followers_interaction) : 0,
          hide_search: hide_search || false,
          description: description !== undefined ? description : ''
        })
        .eq('id', id)
        .select()
        .single()


      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ celebrity: data })
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID required' })

      // Delete all posts first
      await supabase.from('posts').delete().eq('celebrity_id', id)
      const { error } = await supabase.from('celebrities').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
