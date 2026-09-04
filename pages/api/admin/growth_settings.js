import { getAdminClient } from '../../../lib/supabase'
import { getAvailableHistoryDates, calculateGrowthVelocity } from '../../../lib/growthVelocity'

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

    // ── GET: Read live_date, inspect available history dates, and compute summary stats ──
    if (req.method === 'GET') {
      const [settingsRes, p1, p2, p3] = await Promise.all([
        supabase.from('live_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('most_followed').select('id, name, instagram_handle, follower_history').range(0, 999),
        supabase.from('most_followed').select('id, name, instagram_handle, follower_history').range(1000, 1999),
        supabase.from('most_followed').select('id, name, instagram_handle, follower_history').range(2000, 2999),
      ])

      if (settingsRes.error) throw settingsRes.error

      const profiles = (p1.data || []).concat(p2.data || []).concat(p3.data || [])
      const settings = settingsRes.data || { id: 1, live_date: '' }
      const configuredLiveDate = (settings.live_date || '').replace('||AUDIT_OFF', '').trim()

      const availableDates = getAvailableHistoryDates(profiles)
      
      // Count profiles per available date
      const dateStats = availableDates.map(dateStr => {
        const count = profiles.filter(p => 
          Array.isArray(p.follower_history) && 
          p.follower_history.some(h => h.date === dateStr && h.count && h.status !== 'Server Failed')
        ).length
        return { date: dateStr, profile_count: count }
      })

      // Calculate velocity based on configured date
      const velocity = calculateGrowthVelocity(profiles, configuredLiveDate || null)

      return res.status(200).json({
        configured_date: configuredLiveDate || 'auto',
        active_date: velocity.activeDate,
        prev_date: velocity.prevDate,
        is_fallback: velocity.isFallback,
        total_profiles: profiles.length,
        gainers_count: velocity.gainersCount,
        losers_count: velocity.losersCount,
        available_dates: dateStats,
        last_updated: settings.updated_at
      })
    }

    // ── POST: Update live_date snapshot ──
    if (req.method === 'POST') {
      const { live_date } = req.body || {}

      // Fetch existing settings to preserve flags like show_social_audit
      const { data: existing } = await supabase
        .from('live_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      let finalLiveDate = (live_date === 'auto' || !live_date) ? '' : String(live_date).trim()
      
      if (existing?.live_date?.includes('||AUDIT_OFF') && !finalLiveDate.includes('||AUDIT_OFF')) {
        finalLiveDate += '||AUDIT_OFF'
      }

      const { data: updated, error: updateErr } = await supabase
        .from('live_settings')
        .upsert({
          id: 1,
          live_date: finalLiveDate,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (updateErr) throw updateErr

      return res.status(200).json({
        success: true,
        saved_date: finalLiveDate.replace('||AUDIT_OFF', ''),
        message: finalLiveDate ? `Daily growth snapshot date set to ${finalLiveDate}` : 'Daily growth snapshot set to automatic latest date'
      })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    console.error('Growth Settings API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
