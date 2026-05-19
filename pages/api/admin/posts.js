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

    // GET - list posts (optionally by celebrity)
    if (req.method === 'GET') {
      const { celebrity_id } = req.query
      let query = supabase.from('posts').select('*').order('post_date', { ascending: false })
      if (celebrity_id) query = query.eq('celebrity_id', celebrity_id)
      const { data, error } = await query
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ posts: data })
    }

    // POST - add new post
    if (req.method === 'POST') {
      const {
        celebrity_id, post_url, post_type, caption, post_date,
        tags, is_most_liked, is_most_commented, is_most_viewed, is_first_post,
        playlist_name, playlist_cover_url
      } = req.body

      if (!celebrity_id || !post_url) {
        return res.status(400).json({ error: 'celebrity_id and post_url are required' })
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{
          celebrity_id,
          post_url,
          post_type: post_type || 'post',
          caption,
          post_date,
          tags: tags || [],
          is_most_liked: is_most_liked || false,
          is_most_commented: is_most_commented || false,
          is_most_viewed: is_most_viewed || false,
          is_first_post: is_first_post || false,
          playlist_name: playlist_name || null,
          playlist_cover_url: playlist_cover_url || null,
        }])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ post: data })
    }

    // PUT - update post
    if (req.method === 'PUT') {
      const {
        id, post_url, post_type, caption, post_date,
        tags, is_most_liked, is_most_commented, is_most_viewed, is_first_post,
        playlist_name, playlist_cover_url
      } = req.body

      if (!id) return res.status(400).json({ error: 'id required' })

      const { data, error } = await supabase
        .from('posts')
        .update({
          post_url, post_type, caption, post_date,
          tags: tags || [],
          is_most_liked, is_most_commented, is_most_viewed, is_first_post,
          playlist_name: playlist_name || null,
          playlist_cover_url: playlist_cover_url || null
        })
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ post: data })
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'id required' })
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
