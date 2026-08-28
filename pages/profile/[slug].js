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
  const [latestDbFollowers, setLatestDbFollowers] = useState(profile.followers_count || 0)

  // 1. Initial Odometer Count-Up Animation & Background API Scrape
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

    // Call live follower count API in the background (1-hour rate limit on server side)
    fetch(`/api/refresh_live_followers?id=${profile.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.followersCount) {
          setLatestDbFollowers(data.followersCount)
        }
      })
      .catch(err => console.error("Error refreshing live followers in background:", err));

    return () => cancelAnimationFrame(animationFrame)
  }, [profile.followers_count, profile.id])

  // 2. Continuous Micro-Fluctuation simulation (only after initial count-up finishes)
  useEffect(() => {
    if (isCountingUp || !latestDbFollowers) return

    // Immediately adjust to any new real-time followers retrieved in background
    setLiveFollowers(prev => {
      const diff = latestDbFollowers - prev;
      if (diff > 0) {
        setChangeDir('up');
        setTimeout(() => setChangeDir(null), 800);
      } else if (diff < 0) {
        setChangeDir('down');
        setTimeout(() => setChangeDir(null), 800);
      }
      return latestDbFollowers;
    })

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
  }, [isCountingUp, latestDbFollowers, monthlyGain])

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

          {/* Daily Follower Pulse Chart - AI Generated Playful Kid/Gen Z style */}
          <div className="card" style={{ 
            padding: '24px 20px 24px', 
            marginBottom: 24, 
            overflow: 'hidden', 
            position: 'relative',
            background: 'rgba(30, 27, 75, 0.4)', // Deep indigo glass base
            border: '2px solid rgba(168, 85, 247, 0.3)', // Violet neon border
            boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.1), inset 0 0 16px rgba(168, 85, 247, 0.05)',
            borderRadius: 24
          }}>
            {/* Background floating tech circles */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -30, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24, position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  <Sparkles size={11} /> AI Pulse Engine v2.0
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.02em' }}>
                  ⚡ Daily Growth Pulse
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Real-time sentiment index & daily milestones mapped over the last 30 days
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 16, textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pulse Standard</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#a7f3d0' }}>📈 Stable Vibe</span>
              </div>
            </div>

            {/* Scrollable Capsule grid of the last 30 days of growth */}
            {(() => {
              const dailyHistory = sorted.map((item, idx) => {
                const prev = idx > 0 ? sorted[idx - 1] : item
                const inc = item.count - prev.count
                return {
                  date: item.date,
                  count: item.count,
                  increment: inc,
                  isFirst: idx === 0
                }
              })
              const dailyGains = dailyHistory.slice(-30)

              if (dailyGains.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '48px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>Awaiting Daily Metrics</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>The next automated daily scrape runs at night. Check back soon!</div>
                  </div>
                )
              }

              const maxInc = Math.max(...dailyGains.map(g => Math.abs(g.increment)), 100)

              return (
                <>
                  <div 
                    style={{ 
                      display: 'flex', 
                      overflowX: 'auto', 
                      gap: 12, 
                      paddingBottom: 16, 
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(168,85,247,0.3) transparent',
                      position: 'relative',
                      WebkitOverflowScrolling: 'touch',
                      alignItems: 'flex-end',
                      height: 160,
                      padding: '10px 4px'
                    }}
                  >
                    {dailyGains.map((day, idx) => {
                      const heightPct = Math.min(100, Math.max(15, (Math.abs(day.increment) / maxInc) * 100))
                      const dateObj = new Date(day.date)
                      const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                      const labelDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                      // Cyberpunk custom styles
                      let barStyle = {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1.5px solid rgba(255,255,255,0.1)',
                        boxShadow: 'none'
                      }
                      let incLabelColor = 'var(--text-muted)'

                      if (day.increment > 0) {
                        barStyle = {
                          background: 'linear-gradient(180deg, rgba(168,85,247,0.4) 0%, rgba(236,72,153,0.4) 100%)',
                          border: '1.5px solid rgba(168,85,247,0.6)',
                          boxShadow: '0 0 14px rgba(236,72,153,0.3)'
                        }
                        incLabelColor = '#f472b6'
                      } else if (day.increment < 0) {
                        barStyle = {
                          background: 'linear-gradient(180deg, rgba(249,115,22,0.4) 0%, rgba(239,68,68,0.4) 100%)',
                          border: '1.5px solid rgba(249,115,22,0.6)',
                          boxShadow: '0 0 14px rgba(249,115,22,0.3)'
                        }
                        incLabelColor = '#fb923c'
                      }

                      return (
                        <div 
                          key={day.date}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 50,
                            height: '100%',
                            justifyContent: 'flex-end',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Daily increment metric bubble */}
                          <div style={{ fontSize: 9, fontWeight: 800, color: incLabelColor, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                            {day.increment > 0 ? `+${formatNumber(day.increment)}` : day.increment < 0 ? `-${formatNumber(Math.abs(day.increment))}` : '0'}
                          </div>

                          {/* Soundwave/Capsule Bar */}
                          <div 
                            style={{
                              width: 20,
                              height: `${heightPct}%`,
                              borderRadius: 10,
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              ...barStyle
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.2)';
                              e.currentTarget.style.filter = 'brightness(1.25)';
                              setTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                date: displayDate,
                                count: day.count,
                                increment: day.increment,
                                hasIncrement: !day.isFirst
                              })
                            }}
                            onMouseMove={(e) => {
                              setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.filter = 'none';
                              setTooltip(null)
                            }}
                          />

                          {/* Date Label */}
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginTop: 12, whiteSpace: 'nowrap' }}>
                            {labelDate}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Playful Emojis Legend */}
                  <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f472b6', boxShadow: '0 0 8px #ec4899' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>🚀 Spark Growth</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fb923c', boxShadow: '0 0 8px #f97316' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>🍊 Red Alert Drop</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>💎 Stable Stand</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', fontStyle: 'italic', opacity: 0.8 }}>
                      ✨ Powered by AI Standings Analyzer
                    </span>
                  </div>
                </>
              )
            })()}
          </div>        </div>

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

