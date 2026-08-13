import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CornerUpLeft, TrendingUp, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const InstagramIcon = ({ size = 24, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const formatNumber = (n) => {
  if (n === null || n === undefined) return '—'
  const absN = Math.abs(n)
  let formatted = ''
  if (absN >= 1_000_000_000) formatted = `${(absN / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  else if (absN >= 1_000_000) formatted = `${(absN / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  else if (absN >= 1_000) formatted = `${(absN / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  else formatted = absN.toLocaleString()
  return n < 0 ? `-${formatted}` : formatted
}

const getSaturdaysInMonth = (year, month) => {
  const saturdays = []
  const date = new Date(year, month, 1)
  while (date.getDay() !== 6) date.setDate(date.getDate() + 1)
  while (date.getMonth() === month) {
    saturdays.push(new Date(date))
    date.setDate(date.getDate() + 7)
  }
  return saturdays
}

const getLast12Months = () => {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return months
}

const getSquareColor = (increment, hasData) => {
  if (!hasData) return { bg: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.08)', shadow: 'none', glow: false }
  if (increment === 0) return { bg: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', shadow: 'none', glow: false }
  if (increment < 0) return { bg: 'rgba(249, 115, 22, 0.25)', border: '1.5px solid rgba(249,115,22,0.4)', shadow: '0 0 6px rgba(249,115,22,0.2)', glow: false }
  if (increment < 10_000) return { bg: 'rgba(99, 102, 241, 0.25)', border: '1.5px solid rgba(99,102,241,0.45)', shadow: '0 0 8px rgba(99,102,241,0.2)', glow: false }
  if (increment < 50_000) return { bg: 'rgba(168, 85, 247, 0.4)', border: '1.5px solid rgba(168,85,247,0.6)', shadow: '0 0 10px rgba(168,85,247,0.3)', glow: false }
  if (increment < 200_000) return { bg: 'rgba(236, 72, 153, 0.55)', border: '1.5px solid rgba(236,72,153,0.75)', shadow: '0 0 14px rgba(236,72,153,0.4)', glow: false }
  return { bg: 'linear-gradient(135deg, #ec4899, #a855f7)', border: '1.5px solid #f472b6', shadow: '0 0 18px rgba(236,72,153,0.7), 0 0 6px rgba(168,85,247,0.5)', glow: true }
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const getFollowerStats = (history = []) => {
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
  const historyMap = {}
  for (let i = 0; i < sorted.length; i++) {
    historyMap[sorted[i].date] = { count: sorted[i].count, increment: i > 0 ? sorted[i].count - sorted[i - 1].count : 0 }
  }

  let monthlyGain = 0
  if (sorted.length > 0) {
    const latest = sorted[sorted.length - 1]
    const ld = new Date(latest.date)
    const yr = ld.getFullYear(), mo = ld.getMonth()
    const thisMonth = sorted.filter(e => { const d = new Date(e.date); return d.getFullYear() === yr && d.getMonth() === mo })
    if (thisMonth.length > 0) {
      const firstIdx = sorted.findIndex(e => e.date === thisMonth[0].date)
      const base = firstIdx > 0 ? sorted[firstIdx - 1] : thisMonth[0]
      monthlyGain = thisMonth[thisMonth.length - 1].count - base.count
    }
  }

  return { historyMap, monthlyGain, sorted }
}

export default function ProfilePage({ profile }) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState(null)

  if (router.isFallback) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
        <div className="spinner" />
      </div>
    )
  }

  const { historyMap, monthlyGain } = getFollowerStats(profile.follower_history || [])
  const last12 = getLast12Months()

  return (
    <>
      <Head>
        <title>{`${profile.name} Instagram Follower Count & Growth Stats - Spialr`}</title>
        <meta name="description" content={`Track live follower count, weekly growth calendar, and community votes of ${profile.name} (${profile.instagram_handle ? `@${profile.instagram_handle}` : 'Instagram profile'}) on Spialr.`} />
        <meta name="keywords" content={`${profile.name}, ${profile.instagram_handle || ''}, instagram followers, live follower count, growth stats, weekly growth, spialr`} />
        <meta property="og:title" content={`${profile.name} Instagram Follower Count & Growth Stats - Spialr`} />
        <meta property="og:description" content={`Track live follower count, weekly growth calendar, and community votes of ${profile.name} on Spialr.`} />
        <meta property="og:image" content={profile.photo_url || ''} />
      </Head>

      <style>{`
        .grid-square { transition: transform 0.15s ease, filter 0.15s ease; cursor: pointer; }
        .grid-square:hover { transform: scale(1.35); filter: brightness(1.25); z-index: 10; position: relative; }
        .tooltip-box {
          position: fixed;
          background: rgba(15, 15, 30, 0.95);
          border: 1px solid rgba(168, 85, 247, 0.4);
          backdrop-filter: blur(16px);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #f1f5f9;
          pointer-events: none;
          z-index: 9999;
          white-space: nowrap;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(168,85,247,0.2);
        }
      `}</style>

      {tooltip && (
        <div className="tooltip-box" style={{ left: tooltip.x + 14, top: tooltip.y - 60 }}>
          <div style={{ fontWeight: 700, marginBottom: 2, color: '#e2e8f0' }}>{tooltip.date}</div>
          <div style={{ color: '#94a3b8', marginBottom: 2 }}>Followers: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{tooltip.count?.toLocaleString() || '—'}</span></div>
          {tooltip.hasIncrement && (
            <div style={{ color: tooltip.increment > 0 ? '#c084fc' : tooltip.increment < 0 ? '#fb923c' : '#64748b' }}>
              Growth: <span style={{ fontWeight: 700 }}>{tooltip.increment > 0 ? `+${tooltip.increment.toLocaleString()}` : tooltip.increment.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text)', padding: '24px 16px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <Link href="/live" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, color: 'var(--text)', cursor: 'pointer', textDecoration: 'none' }}>
              <CornerUpLeft size={18} />
            </Link>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Back to Live Standings</span>
          </div>

          {/* Profile Card */}
          <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ marginBottom: 20 }}>
                <img src={profile.photo_url || '/placeholder-avatar.png'} alt={profile.name}
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 4px', lineHeight: 1.2 }}>{profile.name}</h1>
              {profile.instagram_handle && (
                <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#a855f7', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                  <InstagramIcon size={13} />@{profile.instagram_handle}
                </a>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
                {profile.category?.split(',').map((cat, idx) => (
                  <span key={idx} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', padding: '3px 11px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                    {cat.includes(':') ? cat.split(':')[1].trim() : cat.trim()}
                  </span>
                ))}
                {profile.language && (
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '3px 11px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                    {profile.language}
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <div style={{ padding: '14px 8px', background: 'rgba(99,102,241,0.07)', borderRadius: 14, border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-display)', marginBottom: 3 }}>{profile.followers_text || formatNumber(profile.followers_count)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Followers</div>
                </div>
                <div style={{ padding: '14px 8px', background: monthlyGain > 0 ? 'rgba(168,85,247,0.08)' : monthlyGain < 0 ? 'rgba(249,115,22,0.08)' : 'var(--surface2)', borderRadius: 14, border: `1px solid ${monthlyGain > 0 ? 'rgba(168,85,247,0.25)' : monthlyGain < 0 ? 'rgba(249,115,22,0.25)' : 'var(--border)'}` }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: monthlyGain > 0 ? '#c084fc' : monthlyGain < 0 ? '#fb923c' : 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
                    {monthlyGain > 0 ? '+' : ''}{formatNumber(monthlyGain)}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month Gain</div>
                </div>
                <div style={{ padding: '14px 8px', background: 'rgba(236,72,153,0.07)', borderRadius: 14, border: '1px solid rgba(236,72,153,0.2)' }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#f472b6', fontFamily: 'var(--font-display)', marginBottom: 3 }}>{profile.votes || 0}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Votes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Calendar Card */}
          <div className="card" style={{ padding: '24px 20px 20px', marginBottom: 24, overflow: 'hidden', position: 'relative' }}>
            {/* Decorative blurred orbs */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 2px' }}>📈 Follower Growth Calendar</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Saturdays only · Last 12 months</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 8, padding: '4px 10px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Gain</span>
                {[
                  { bg: 'rgba(255,255,255,0.07)', label: '' },
                  { bg: 'rgba(99,102,241,0.35)', label: '' },
                  { bg: 'rgba(168,85,247,0.55)', label: '' },
                  { bg: 'rgba(236,72,153,0.7)', label: '' },
                  { bg: 'linear-gradient(135deg,#ec4899,#a855f7)', label: '' },
                ].map((c, i) => (
                  <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: c.bg, border: '1px solid rgba(255,255,255,0.08)' }} />
                ))}
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>Viral</span>
              </div>
            </div>

            {/* Months Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, position: 'relative' }}>
              {last12.map(({ year, month }) => {
                const saturdays = getSaturdaysInMonth(year, month)
                return (
                  <div key={`${year}-${month}`} style={{ minWidth: 70 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      {MONTH_NAMES[month]} {year !== new Date().getFullYear() ? year : ''}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {saturdays.map((sat) => {
                        const dateStr = sat.toISOString().split('T')[0]
                        const entry = historyMap[dateStr]
                        const hasData = !!entry
                        const increment = hasData ? entry.increment : 0
                        const isFirstEntry = hasData && entry.increment === 0 && Object.keys(historyMap)[0] === dateStr
                        const colors = getSquareColor(increment, hasData)
                        const displayDate = sat.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

                        return (
                          <div
                            key={dateStr}
                            className="grid-square"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: colors.bg,
                              border: colors.border,
                              boxShadow: colors.shadow,
                            }}
                            onMouseEnter={(e) => {
                              if (!hasData) return
                              setTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                date: displayDate,
                                count: entry.count,
                                increment: entry.increment,
                                hasIncrement: !isFirstEntry
                              })
                            }}
                            onMouseMove={(e) => {
                              if (!hasData) return
                              setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Loss indicator legend */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ width: 13, height: 13, borderRadius: 3, background: 'rgba(249,115,22,0.3)', border: '1px solid rgba(249,115,22,0.5)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Follower Loss</span>
              <div style={{ width: 13, height: 13, borderRadius: 3, background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.1)', marginLeft: 8 }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>No data yet</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', fontStyle: 'italic' }}>Hover to inspect</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  const { slug } = context.query

  // Decode URL-encoded slug (handles dots, underscores, etc.)
  const decodedSlug = decodeURIComponent(slug || '').toLowerCase().trim()

  try {
    // Step 1: Try direct handle match — two attempts in parallel
    // a) slug as-is (handles without dots, e.g. narendramodi)
    // b) slug with hyphens→dots restored (handles with dots sanitized, e.g. virat-kohli → virat.kohli)
    const slugWithDots = decodedSlug.replace(/-/g, '.')

    const [{ data: exactMatch }, { data: dotMatch }] = await Promise.all([
      supabase.from('most_followed').select('*').not('instagram_handle', 'is', null).ilike('instagram_handle', decodedSlug).limit(1).maybeSingle(),
      slugWithDots !== decodedSlug
        ? supabase.from('most_followed').select('*').not('instagram_handle', 'is', null).ilike('instagram_handle', slugWithDots).limit(1).maybeSingle()
        : Promise.resolve({ data: null })
    ])

    const byHandle = exactMatch || dotMatch
    if (byHandle) {
      return { props: { profile: byHandle } }
    }

    // Step 2: Fallback — lightweight fetch of id/name/handle only, then full fetch by id
    const { data: nameList, error: nameErr } = await supabase
      .from('most_followed')
      .select('id, name, instagram_handle')

    if (nameErr || !nameList) return { notFound: true }

    const matched = nameList.find(p => {
      // Build the URL-safe slug the same way live.js does (dots→hyphens in handles)
      const sanitizedHandle = p.instagram_handle
        ? p.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
        : null
      const nameSlug = p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      const namePlain = p.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')

      return (
        decodedSlug === sanitizedHandle ||
        decodedSlug === nameSlug ||
        decodedSlug === namePlain
      )
    })

    if (!matched) {
      console.error(`[profile 404] No match for slug="${decodedSlug}". Tried handle exact, dots, name-slug, name-plain.`)
      return { notFound: true }
    }

    // Step 3: Fetch full profile by id
    const { data: fullProfile, error: fullErr } = await supabase
      .from('most_followed')
      .select('*')
      .eq('id', matched.id)
      .single()

    if (fullErr || !fullProfile) return { notFound: true }

    return { props: { profile: fullProfile } }
  } catch (err) {
    console.error('getServerSideProps error in profile page:', err)
    return { notFound: true }
  }
}

