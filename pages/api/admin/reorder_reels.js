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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { orders } = req.body
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders array is required' })
    }

    const supabase = getAdminClient()

    // Run reordering queries concurrently
    const promises = orders.map(({ id, order_index }) => 
      supabase
        .from('viral_reels')
        .update({ order_index: Number(order_index) })
        .eq('id', id)
    )

    const results = await Promise.all(promises)
    for (const r of results) {
      if (r.error) throw r.error
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Reorder API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
