import { getAdminClient } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'Celebrity ID is required' })

  try {
    const supabase = getAdminClient()
    
    // Fetch current request count
    const { data: celebrity, error: getError } = await supabase
      .from('celebrities')
      .select('request_count')
      .eq('id', id)
      .single()

    if (getError || !celebrity) {
      return res.status(404).json({ error: 'Celebrity not found' })
    }

    const currentCount = celebrity.request_count || 0

    // Update with incremented count
    const { data, error: updateError } = await supabase
      .from('celebrities')
      .update({ request_count: currentCount + 1 })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.status(200).json({ success: true, request_count: data.request_count })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Server error' })
  }
}
