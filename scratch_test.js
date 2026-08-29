import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CornerUpLeft, TrendingUp, Info, Flame, AlertTriangle, Sparkles } from 'lucide-react'
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

  const { historyMap, monthlyGain, sorted } = getFollowerStats(profile.follower_history || [])
  const last12 = getLast12Months()

  const historyEntries = profile.follower_history || []
  const counts = historyEntries.map(e => e.count || 0)
  const currentCount = profile.followers_count || 0
  const peakFollowers = counts.length > 0 ? Math.max(...counts, currentCount) : currentCount
  const lostFollowers = peakFollowers - currentCount
  const isLosing = lostFollowers > 100

  const [liveFollowers, setLiveFollowers] = useState(0)
  const [changeDir, setChangeDir] = useState(null)
  const [isCountingUp, setIsCountingUp] = useState(true)

  // 1. Initial Odometer Count-Up Animation
  useEffect(() => {
    if (!profile.followers_count) return

    setLiveFollowers(0)
    setIsCountingUp(true)

    const duration = 2400 // 2.4 seconds count up
    const start = 0
    const end = profile.followers_count
    const startTime = performance.now()
    let animationFrame;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = Math.pow(progress, 3.5) // Easing curve: slow start, then super fast acceleration
      const current = Math.floor(start + (end - start) * easeProgress)
      
      setLiveFollowers(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setIsCountingUp(false)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [profile.followers_count])

  // 2. Continuous Micro-Fluctuation simulation (only after initial count-up finishes)
  useEffect(() => {
    if (isCountingUp || !profile.followers_count) return

    // Initialize display count to the database count when counting finishes
    setLiveFollowers(profile.followers_count)

    const monthlyGainNum = monthlyGain || 0
    const gainPerSec = monthlyGainNum / (30 * 24 * 3600)
    
    const interval = setInterval(() => {
      setLiveFollowers((prev) => {
        const jitter = Math.floor(Math.random() * 5) - 2; 
        const drift = gainPerSec * 3;
        
        let change = Math.round(drift + jitter);
        if (change === 0) {
          change = Math.random() > 0.5 ? 1 : -1;
        }

        const nextVal = Math.max(0, prev + change);
        if (nextVal > prev) {
          setChangeDir('up');
        } else if (nextVal < prev) {
          setChangeDir('down');
        }
        
        setTimeout(() => setChangeDir(null), 800);
        return nextVal;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isCountingUp, profile.followers_count, monthlyGain])

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
                  <div style={{ 
                    fontSize: 19, 
                    fontWeight: 800, 
                    color: changeDir === 'up' ? '#10b981' : changeDir === 'down' ? '#ef4444' : '#818cf8', 
                    fontFamily: 'var(--font-display)', 
                    marginBottom: 3,
                    transition: 'color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}>
                    <span>{liveFollowers ? liveFollowers.toLocaleString() : '—'}</span>
                    {changeDir && (
                      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.9 }}>
                        {changeDir === 'up' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
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

          {/* Social Drama & Growth Meter widget */}
          {isLosing ? (
            <div style={{ padding: '8px 4px 20px', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                <Flame size={18} />
                <span>Mass Unfollow Drama Tracker</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 12px' }}>
                People are actively unfollowing this creator due to recent events. This profile has lost <strong style={{ color: '#ef4444' }}>-{formatNumber(lostFollowers)}</strong> followers from their historical peak.
              </p>
              <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Peak Follower Mark:</span> <strong style={{ color: '#f1f5f9' }}>{peakFollowers.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total Lost:</span> <strong style={{ color: '#ef4444' }}>-{formatNumber(lostFollowers)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 4px 20px', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                <TrendingUp size={18} />
                <span>Solid Growth Performance</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 12px' }}>
                This creator is maintaining stable performance at their historical peak! No major unfollow waves detected.
              </p>
              <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Peak Follower Mark:</span> <strong style={{ color: '#f1f5f9' }}>{peakFollowers.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span> <strong style={{ color: '#10b981' }}>🏆 Peak Achieved</strong>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ Daily Growth Tracker — Clean Minimal Edition */}
          {(() => {
            const dailyHistory = sorted.map((item, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : item
              const inc = item.count - prev.count
              return { date: item.date, count: item.count, increment: inc, isFirst: idx === 0 }
            })
            const dailyGains = dailyHistory.slice(-30)

            const nonFirstGains = dailyGains.filter(d => !d.isFirst)
            const netChange = nonFirstGains.reduce((s, d) => s + d.increment, 0)
            const bestDay = nonFirstGains.reduce((best, d) => d.increment > best.increment ? d : best, nonFirstGains[0] || { increment: 0, date: '' })
            const worstDay = nonFirstGains.reduce((worst, d) => d.increment < worst.increment ? d : worst, nonFirstGains[0] || { increment: 0, date: '' })
            let streak = 0, streakType = 'none'
            for (let i = nonFirstGains.length - 1; i >= 0; i--) {
              const inc = nonFirstGains[i].increment
              if (i === nonFirstGains.length - 1) { streakType = inc > 0 ? 'up' : inc < 0 ? 'down' : 'none' }
              if ((streakType === 'up' && inc > 0) || (streakType === 'down' && inc < 0)) streak++
              else break
            }
            const maxAbs = Math.max(...nonFirstGains.map(d => Math.abs(d.increment)), 1)

            const fmtShort = (n) => {
              const abs = Math.abs(n)
              const sign = n > 0 ? '+' : n < 0 ? '-' : ''
              if (abs >= 1000000) return `${sign}${(Math.floor(abs / 100000) / 10)}M`
              if (abs >= 1000) return `${sign}${(Math.floor(abs / 100) / 10)}K`
              return `${sign}${abs}`
            }

            const statItems = [
              { label: '30-Day Net', value: fmtShort(netChange), sub: netChange >= 0 ? 'gained' : 'lost', icon: netChange >= 0 ? '↑' : '↓' },
              { label: 'Best Day', value: bestDay.increment ? fmtShort(bestDay.increment) : '—', sub: bestDay.date ? new Date(bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', icon: '★' },
              { label: 'Worst Day', value: worstDay.increment ? fmtShort(worstDay.increment) : '—', sub: worstDay.date ? new Date(worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', icon: '↓' },
              { label: 'Streak', value: streak > 0 ? `${streak}d` : '—', sub: streakType === 'up' ? 'growing' : streakType === 'down' ? 'dropping' : 'flat', icon: streakType === 'up' ? '▲' : streakType === 'down' ? '▼' : '—' }
            ]

            return (
              <div className="card" style={{
                padding: '24px 20px 20px',
                marginBottom: 24,
                overflow: 'hidden',
                position: 'relative',
                background: 'var(--surface)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6, fontFamily: 'monospace' }}>
                      FOLLOWER ACTIVITY · LAST 30 DAYS
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.03em', fontFamily: 'Georgia, serif' }}>
                      Daily Growth Timeline
                    </h2>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '5px 0 0', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      gains → right &nbsp;|&nbsp; drops ← left
                    </p>
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', marginBottom: 2 }}>Tracking</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>⚡ LIVE</div>
                  </div>
                </div>

                {dailyGains.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontFamily: 'Georgia, serif' }}>No data yet</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontFamily: 'monospace' }}>Nightly scrape runs automatically.</div>
                  </div>
                ) : (
                  <div>
                    {/* ─── 4 Stat Boxes — minimal white bordered ─── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
                      {statItems.map((s, i) => (
                        <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', flexShrink: 0 }}>
                            {s.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', lineHeight: 1, fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>{s.value}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3, fontFamily: 'monospace' }}>{s.label}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontFamily: 'monospace' }}>{s.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ─── Diverging Bar Chart — monochrome ─── */}
                    <div style={{ overflowY: 'auto', maxHeight: 400, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[...dailyGains].reverse().map((day, idx) => {
                          const barPct = day.isFirst ? 0 : Math.min(98, Math.max(4, (Math.abs(day.increment) / maxAbs) * 98))
                          const isGain = day.increment > 0
                          const isLoss = day.increment < 0
                          const dateObj = new Date(day.date)
                          const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                          const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                          const isToday = idx === 0
                          const valueLabel = day.isFirst ? 'BASE' : (isGain ? `+${formatNumber(day.increment)}` : isLoss ? `-${formatNumber(Math.abs(day.increment))}` : '±0')

                          return (
                            <div
                              key={day.date}
                              style={{ display: 'flex', alignItems: 'center', height: 34, borderRadius: 8, transition: 'background 0.12s ease', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                setTooltip({ x: e.clientX, y: e.clientY, date: displayDate, count: day.count, increment: day.increment, hasIncrement: !day.isFirst })
                              }}
                              onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setTooltip(null) }}
                            >
                              {/* Date — left column */}
                              <div style={{ width: 64, flexShrink: 0, paddingLeft: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#ffffff' : 'rgba(255,255,255,0.65)', lineHeight: 1, fontFamily: 'monospace' }}>{label}</div>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{weekday}{isToday ? ' ·NOW' : ''}</div>
                              </div>

                              {/* LEFT — loss bar */}
                              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 3 }}>
                                {isLoss && !day.isFirst && (
                                  <div style={{ width: `${barPct}%`, height: 12, borderRadius: '6px 0 0 6px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRight: 'none' }} />
                                )}
                              </div>

                              {/* CENTER axis */}
                              <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

                              {/* RIGHT — gain bar */}
                              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: 3 }}>
                                {isGain && !day.isFirst && (
                                  <div style={{ width: `${barPct}%`, height: 12, borderRadius: '0 6px 6px 0', background: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', borderLeft: 'none' }} />
                                )}
                                {day.isFirst && (
                                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', paddingLeft: 6, letterSpacing: '0.06em' }}>BASELINE</div>
                                )}
                                {!day.isFirst && day.increment === 0 && (
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', marginLeft: 4 }} />
                                )}
                              </div>

                              {/* Value — right column */}
                              <div style={{ width: 58, textAlign: 'right', paddingRight: 6, flexShrink: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: day.isFirst ? 'rgba(255,255,255,0.2)' : '#ffffff', fontFamily: 'monospace', letterSpacing: isGain ? '0' : '0' }}>
                                  {valueLabel}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* ─── Footer legend — minimal ─── */}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 8, borderRadius: 3, background: '#ffffff', opacity: 0.9 }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontFamily: 'monospace' }}>gained →</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 8, borderRadius: 3, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontFamily: 'monospace' }}>← lost</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto', fontFamily: 'monospace', letterSpacing: '0.04em' }}>hover row for details</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

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

