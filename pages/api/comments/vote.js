import { getAdminClient } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const { comment_id, action } = req.body

    if (!comment_id) {
      return res.status(400).json({ error: 'comment_id is required' })
    }

    const validActions = ['like', 'unlike', 'dislike', 'undislike', 'switch_to_like', 'switch_to_dislike']
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid vote action' })
    }

    const supabase = getAdminClient()

    let likeDelta = 0
    let dislikeDelta = 0

    if (action === 'like') likeDelta = 1
    else if (action === 'unlike') likeDelta = -1
    else if (action === 'dislike') dislikeDelta = 1
    else if (action === 'undislike') dislikeDelta = -1
    else if (action === 'switch_to_like') {
      likeDelta = 1
      dislikeDelta = -1
    } else if (action === 'switch_to_dislike') {
      likeDelta = -1
      dislikeDelta = 1
    }

    let rpcSucceeded = false
    try {
      const promises = []
      if (likeDelta !== 0) {
        promises.push(supabase.rpc('increment_comment_like', { comment_id, amount: likeDelta }))
      }
      if (dislikeDelta !== 0) {
        promises.push(supabase.rpc('increment_comment_dislike', { comment_id, amount: dislikeDelta }))
      }
      const results = await Promise.all(promises)
      if (!results.some(r => r.error)) {
        rpcSucceeded = true
      }
    } catch (e) {
      rpcSucceeded = false
    }

    // Fallback if RPC wasn't found or errored
    if (!rpcSucceeded) {
      const { data: current } = await supabase
        .from('profile_comments')
        .select('likes_count, dislikes_count')
        .eq('id', comment_id)
        .single()

      if (current) {
        const nextLikes = Math.max(0, (current.likes_count || 0) + likeDelta)
        const nextDislikes = Math.max(0, (current.dislikes_count || 0) + dislikeDelta)
        await supabase
          .from('profile_comments')
          .update({ likes_count: nextLikes, dislikes_count: nextDislikes })
          .eq('id', comment_id)
      }
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Comment vote error:', err)
    return res.status(500).json({ error: 'Failed to process vote' })
  }
}
