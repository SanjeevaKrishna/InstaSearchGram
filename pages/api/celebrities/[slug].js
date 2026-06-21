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

    // Fetch voting stats from most_followed table matching the celebrity name (trimmed and exact queries)
    let votingInfo = null
    if (celebrity.name) {
      const { data: exactMatch } = await supabase
        .from('most_followed')
        .select('votes, current_vote_rank, highest_vote_rank, lowest_vote_rank')
        .eq('name', celebrity.name)
        .maybeSingle()

      if (exactMatch) {
        votingInfo = exactMatch
      } else {
        const trimmedName = celebrity.name.trim()
        const { data: ilikeMatch } = await supabase
          .from('most_followed')
          .select('votes, current_vote_rank, highest_vote_rank, lowest_vote_rank')
          .ilike('name', `${trimmedName}%`)
          .maybeSingle()
        votingInfo = ilikeMatch
      }
    }

    res.status(200).json({ celebrity, posts: posts || [], votingInfo: votingInfo || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}
