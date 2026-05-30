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

    // Fetch daily visits from the database, grouped client-side for absolute simplicity and compatibility
    const { data: visitsData, error } = await supabase
      .from('visits')
      .select('visit_date')
      .order('visit_date', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    // Aggregate counts per date
    const counts = {}
    ;(visitsData || []).forEach(row => {
      const d = row.visit_date
      counts[d] = (counts[d] || 0) + 1
    })

    const visitsList = Object.entries(counts).map(([date, count]) => ({
      visit_date: date,
      unique_visitors: count
    }))

    return res.status(200).json({ visits: visitsList })
  } catch (err) {
    console.error('Visits API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
