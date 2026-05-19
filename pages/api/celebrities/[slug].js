import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { slug } = req.query

  try {
    // Get celebrity
    const { data: celebrity, error: celError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', slug)
      .single()

    if (celError || !celebrity) {
      return res.status(404).json({ error: 'Celebrity not found' })
    }

    // Get all posts for this celebrity
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .order('post_date', { ascending: false })

    if (postsError) throw postsError

    res.status(200).json({ celebrity, posts: posts || [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}
