import { getAdminClient } from '../../../lib/supabase'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { slug } = req.body

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' })
    }

    const supabase = getAdminClient()

    // Use the postgres sql function or simply read then write, since we only need simple tracking.
    // The service role key is required to bypass RLS for updates if it's strictly read-only for public.
    // Easiest is to fetch the current views, then update.
    const { data: currentNews, error: fetchError } = await supabase
      .from('news')
      .select('id, views')
      .eq('slug', slug)
      .single()

    if (fetchError || !currentNews) {
      return res.status(404).json({ error: 'News not found' })
    }

    const { error: updateError } = await supabase
      .from('news')
      .update({ views: (currentNews.views || 0) + 1 })
      .eq('id', currentNews.id)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
