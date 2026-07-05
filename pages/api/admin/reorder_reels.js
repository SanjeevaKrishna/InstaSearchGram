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

    const { orders, table = 'viral_reels' } = req.body
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders array is required' })
    }

    const allowedTables = ['viral_reels', 'most_viewed_reels']
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table specified' })
    }

    const supabase = getAdminClient()

    // Run reordering queries concurrently
    const promises = orders.map(({ id, order_index }) => 
      supabase
        .from(table)
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
