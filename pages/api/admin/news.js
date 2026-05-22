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

    if (req.method === 'GET') {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ news })
    }

    if (req.method === 'POST') {
      const { id, title, image_url, content } = req.body
      
      // Generate a simple slug from the title
      let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      // Add random string to ensure uniqueness if creating
      if (!id) slug += '-' + Math.random().toString(36).substr(2, 5)

      const payload = {
        title,
        image_url,
        content,
      }
      if (!id) payload.slug = slug

      let result
      if (id) {
        result = await supabase.from('news').update(payload).eq('id', id).select().single()
      } else {
        result = await supabase.from('news').insert([payload]).select().single()
      }

      if (result.error) return res.status(400).json({ error: result.error.message })
      return res.status(200).json({ news: result.data })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      const { error } = await supabase.from('news').delete().eq('id', id)
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
