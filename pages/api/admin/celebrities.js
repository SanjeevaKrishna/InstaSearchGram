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

    // GET - list all celebrities
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('celebrities')
        .select('*')
        .order('name')
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ celebrities: data })
    }

    // POST - add new celebrity
    if (req.method === 'POST') {
      const { name, instagram_handle, followers_count, posts_count, photo_url, is_featured } = req.body
      if (!name) return res.status(400).json({ error: 'Name is required' })

      // Auto generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('celebrities')
        .insert([{ name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured: is_featured || false }])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ celebrity: data })
    }

    // PUT - update celebrity
    if (req.method === 'PUT') {
      const { id, name, instagram_handle, followers_count, posts_count, photo_url, is_featured } = req.body
      if (!id) return res.status(400).json({ error: 'ID required' })

      const { data, error } = await supabase
        .from('celebrities')
        .update({ name, instagram_handle, followers_count, posts_count, photo_url, is_featured })
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
