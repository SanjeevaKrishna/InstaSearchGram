import { useState, useEffect, useMemo } from 'react'
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
    saturdays.push(new Date(date).toISOString().split('T')[0])
    date.setDate(date.getDate() + 7)
  }
  return saturdays
}

const getLast12Months = () => {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }), saturdays: getSaturdaysInMonth(d.getFullYear(), d.getMonth()) })
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

const getFollowerStats = (history = [], currentCount = 0) => {
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

  let dailyGain = 0
  let dailyGainDays = 1
  if (sorted.length >= 2) {
    const latest = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    dailyGain = latest.count - prev.count
    const d1 = new Date(latest.date)
    const d2 = new Date(prev.date)
    dailyGainDays = Math.max(1, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)))
  } else if (sorted.length === 1 && currentCount) {
    dailyGain = currentCount - sorted[0].count
  }

  // Calculate smart weighted velocity (recent day + 3-day moving average) to handle viral spikes smoothly:
  let recentVelocity = dailyGain
  if (sorted.length >= 4) {
    const inc1 = sorted[sorted.length - 1].count - sorted[sorted.length - 2].count
    const inc2 = sorted[sorted.length - 2].count - sorted[sorted.length - 3].count
    const inc3 = sorted[sorted.length - 3].count - sorted[sorted.length - 4].count
    const avg3d = Math.round((inc1 + inc2 + inc3) / 3)
    recentVelocity = Math.round(inc1 * 0.6 + avg3d * 0.4)
  } else if (sorted.length >= 3) {
    const inc1 = sorted[sorted.length - 1].count - sorted[sorted.length - 2].count
    const inc2 = sorted[sorted.length - 2].count - sorted[sorted.length - 3].count
    recentVelocity = Math.round(inc1 * 0.7 + inc2 * 0.3)
  }

  return { historyMap, monthlyGain, dailyGain, dailyGainDays, recentVelocity, sorted }
}

export default function ProfilePage({ profile }) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('last30')

  if (router.isFallback) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
        <div className="spinner" />
      </div>
    )
  }

  const { historyMap, monthlyGain, dailyGain, dailyGainDays, recentVelocity, sorted } = getFollowerStats(profile.follower_history || [], profile.followers_count || 0)
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

  // Extract distinct available months from history (always including Sep & Aug 2026)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set(['2026-09', '2026-08'])
    ;(profile.follower_history || []).forEach(item => {
      if (item.date && typeof item.date === 'string' && item.date.length >= 7) {
        monthsSet.add(item.date.substring(0, 7))
      }
    })
    return Array.from(monthsSet).sort().reverse()
  }, [profile.follower_history])

  // Full Time-of-Day Follower Progression (Morning -> Afternoon -> Night)
  // Purely client-side calculation based on daily velocity (Zero Vercel/Supabase requests)
  const timeAdjustedBase = useMemo(() => {
    const base = profile.followers_count || 0
    if (!base) return 0

    // Measure time-of-day progress across 24h (0.0 to 1.0)
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600

    let diurnalFraction = 0
    if (hour < 6) {
      diurnalFraction = (hour / 6) * 0.08 // 00:00 - 06:00 (Night slow period: ~8%)
    } else if (hour < 12) {
      diurnalFraction = 0.08 + ((hour - 6) / 6) * 0.35 // 06:00 - 12:00 (Morning wave: ~43%)
    } else if (hour < 18) {
      diurnalFraction = 0.43 + ((hour - 12) / 6) * 0.32 // 12:00 - 18:00 (Afternoon stream: ~75%)
    } else {
      diurnalFraction = 0.75 + ((hour - 18) / 6) * 0.25 // 18:00 - 24:00 (Evening prime peak: ~100%)
    }

    // Determine estimated daily velocity from recent velocity (weighted blend of recent day & 3-day average)
    const rate = recentVelocity !== 0 ? recentVelocity : dailyGain !== 0 ? dailyGain : Math.round((monthlyGain || 0) / 30)
    
    // Add the full daytime progress smoothly based on the profile's average daily growth rate
    const daytimeGrowth = Math.round(rate * diurnalFraction)

    return Math.max(0, base + daytimeGrowth)
  }, [profile.followers_count, recentVelocity, dailyGain, monthlyGain])

  // 1. Initial Odometer Count-Up Animation
  useEffect(() => {
    if (!timeAdjustedBase) return

    setLiveFollowers(0)
    setIsCountingUp(true)

    const duration = 2400 // 2.4 seconds count up
    const start = 0
    const end = timeAdjustedBase
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
  }, [timeAdjustedBase])

  // 2. Continuous Micro-Fluctuation simulation with granular tier-based realism & variable speeds
  useEffect(() => {
    if (isCountingUp || !timeAdjustedBase) return

    const baseCount = timeAdjustedBase

    // Initialize display count to the time-adjusted base when counting finishes
    setLiveFollowers(baseCount)

    // Determine scale tier and speed based on account size
    let maxDrift = 15
    let minStep = 1
    let maxStep = 3
    let intervalMs = 4000

    if (baseCount >= 20_000_000) {
      // 20M+ top accounts (Samantha 38M, Virat 270M) -> fastest, bustling momentum jumps up to ~1100
      maxDrift = 4500
      minStep = 250
      maxStep = 1100
      intervalMs = 1500
    } else if (baseCount >= 5_000_000) {
      // 5M - 20M -> fast momentum
      maxDrift = 1800
      minStep = 100
      maxStep = 450
      intervalMs = 1800
    } else if (baseCount >= 1_000_000) {
      // 1M - 5M -> good momentum (takes 1 lakh to change 1.2M -> 1.3M)
      maxDrift = 600
      minStep = 35
      maxStep = 150
      intervalMs = 2200
    } else if (baseCount >= 700_000) {
      // 700K - 1M -> steady increase/decrease (strictly < 90 cap)
      maxDrift = 85
      minStep = 15
      maxStep = 45
      intervalMs = 2500
    } else if (baseCount >= 300_000) {
      // 300K - 700K -> moderate increase/decrease
      maxDrift = 75
      minStep = 6
      maxStep = 20
      intervalMs = 3000
    } else if (baseCount >= 100_000) {
      // 100K - 300K -> very low activity, strictly protected from rolling over 131.2k -> 131.3k
      maxDrift = 45
      minStep = 2
      maxStep = 8
      intervalMs = 3500
    } else {
      // < 100K small accounts -> very slight micro fluctuations
      maxDrift = 15
      minStep = 1
      maxStep = 3
      intervalMs = 4000
    }

    const interval = setInterval(() => {
      setLiveFollowers((prev) => {
        const currentDrift = prev - baseCount

        // Decide direction:
        // If drifted too high, push back down; if drifted too low, push back up
        let isUp = true
        if (currentDrift >= maxDrift) {
          isUp = false
        } else if (currentDrift <= -maxDrift) {
          isUp = true
        } else {
          // Weighted probability: if account is growing, 60% up / 40% down; if losing, 65% down / 35% up
          const upThreshold = dailyGain >= 0 ? 0.40 : 0.65
          isUp = Math.random() > upThreshold
        }

        const delta = Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep
        const change = isUp ? delta : -delta
        const nextVal = Math.max(0, Math.min(baseCount + maxDrift, Math.max(baseCount - maxDrift, prev + change)))

        if (nextVal > prev) {
          setChangeDir('up')
        } else if (nextVal < prev) {
          setChangeDir('down')
        }

        setTimeout(() => setChangeDir(null), 800)
        return nextVal
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isCountingUp, timeAdjustedBase, dailyGain])

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
            <div style={{ color: tooltip.increment > 0 ? '#34d399' : tooltip.increment < 0 ? '#fb7185' : '#64748b' }}>
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
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Real Time Followers</div>
                </div>

                {/* Dynamic Relatable Daily Change Card */}
                {(() => {
                  let badgeLabel = 'Daily Gain'
                  if (dailyGain > 0) {
                    badgeLabel = 'Gained Today'
                  } else if (dailyGain < 0) {
                    badgeLabel = 'Lost Today'
                  } else {
                    badgeLabel = 'Stable Today'
                  }

                  return (
                    <div style={{ 
                      padding: '14px 8px', 
                      background: dailyGain > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(6,182,212,0.06) 100%)' : dailyGain < 0 ? 'linear-gradient(135deg, rgba(244,63,94,0.14) 0%, rgba(225,29,72,0.06) 100%)' : 'var(--surface2)', 
                      borderRadius: 14, 
                      border: `1px solid ${dailyGain > 0 ? 'rgba(52,211,153,0.4)' : dailyGain < 0 ? 'rgba(251,113,133,0.4)' : 'var(--border)'}`,
                      boxShadow: dailyGain !== 0 ? `0 4px 14px -2px ${dailyGain > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` : 'none'
                    }}>
                      <div style={{ 
                        fontSize: 19, 
                        fontWeight: 800, 
                        color: dailyGain > 0 ? '#34d399' : dailyGain < 0 ? '#fb7185' : 'var(--text-muted)', 
                        fontFamily: 'var(--font-display)', 
                        marginBottom: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        textShadow: dailyGain !== 0 ? `0 0 10px ${dailyGain > 0 ? '#34d399' : '#fb7185'}44` : 'none'
                      }}>
                        <span>{dailyGain > 0 ? `+${formatNumber(dailyGain)}` : dailyGain < 0 ? `-${formatNumber(Math.abs(dailyGain))}` : '±0'}</span>
                      </div>
                      <div style={{ fontSize: 9, color: dailyGain > 0 ? '#6ee7b7' : dailyGain < 0 ? '#fda4af' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {badgeLabel}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ padding: '14px 8px', background: 'rgba(236,72,153,0.07)', borderRadius: 14, border: '1px solid rgba(236,72,153,0.2)' }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#f472b6', fontFamily: 'var(--font-display)', marginBottom: 3 }}>{profile.votes || 0}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Votes</div>
                </div>
              </div>
            </div>

          {/* Social Drama & Growth Meter widget */}
          {isLosing ? (
            <div className="card" style={{ padding: '16px 20px 20px', marginBottom: 24, borderRadius: 16, background: '#ffffff', border: '1px solid #fee2e2', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                <Flame size={18} />
                <span>🚨 Mass Unfollow</span>
              </div>
              <p style={{ fontSize: 13, color: '#09090b', lineHeight: 1.6, margin: '0 0 14px', fontWeight: 500 }}>
                <strong style={{ color: '#dc2626', fontWeight: 800 }}>{profile.name}</strong> is currently experiencing an active unfollow wave! This account has dropped by <strong style={{ color: '#dc2626', fontWeight: 800 }}>-{formatNumber(lostFollowers)}</strong> followers from their historical peak mark.
              </p>
              <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#71717a' }}>Peak Follower Mark:</span> <strong style={{ color: '#0284c7', fontWeight: 800, marginLeft: 4 }}>{peakFollowers.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Total Lost:</span> <strong style={{ color: '#dc2626', fontWeight: 800, marginLeft: 4 }}>-{formatNumber(lostFollowers)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '16px 20px 20px', marginBottom: 24, borderRadius: 16, background: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                <TrendingUp size={18} />
                <span>✨ Peak Momentum · Healthy Growth</span>
              </div>
              <p style={{ fontSize: 13, color: '#09090b', lineHeight: 1.6, margin: '0 0 14px', fontWeight: 500 }}>
                <strong style={{ color: '#0284c7', fontWeight: 800 }}>{profile.name}</strong> is maintaining rock-solid momentum at their historical peak! Follower activity is steady and positive with zero major unfollow waves detected.
              </p>
              <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#71717a' }}>Peak Follower Mark:</span> <strong style={{ color: '#0284c7', fontWeight: 800, marginLeft: 4 }}>{peakFollowers.toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Status:</span> <strong style={{ color: '#059669', fontWeight: 800, marginLeft: 4 }}>🏆 Peak Achieved</strong>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ Daily Growth Pulse — Vibrant Ultra-Modern Edition with Month Filter */}
          {(() => {
            const allDailyHistory = sorted.map((item, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : item
              const inc = item.count - prev.count
              const curDate = new Date(item.date)
              const prevDate = new Date(prev.date)
              const diffDays = idx === 0 ? 1 : Math.max(1, Math.round(Math.abs(curDate - prevDate) / (1000 * 60 * 60 * 24)))
              return {
                date: item.date,
                count: item.count,
                increment: inc,
                isFirst: idx === 0,
                diffDays,
                prevDate: prev.date
              }
            })

            // Filter based on selected period
            let filteredDailyGains = allDailyHistory
            let periodTitle = 'Last 30 Days'
            if (selectedPeriod === 'last30') {
              filteredDailyGains = allDailyHistory.slice(-30)
              periodTitle = 'Last 30 Days'
            } else if (selectedPeriod === 'all') {
              filteredDailyGains = allDailyHistory
              periodTitle = 'All-Time'
            } else {
              filteredDailyGains = allDailyHistory.filter(d => d.date.startsWith(selectedPeriod))
              const [y, m] = selectedPeriod.split('-')
              const d = new Date(parseInt(y), parseInt(m) - 1, 1)
              periodTitle = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }

            const nonFirstGains = filteredDailyGains.filter(d => !d.isFirst)
            const netChange = nonFirstGains.reduce((s, d) => s + d.increment, 0)
            const bestDay = nonFirstGains.reduce((best, d) => (d.increment > (best?.increment ?? -Infinity) ? d : best), nonFirstGains[0] || { increment: 0, date: '' })
            const worstDay = nonFirstGains.reduce((worst, d) => (d.increment < (worst?.increment ?? Infinity) ? d : worst), nonFirstGains[0] || { increment: 0, date: '' })
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

            const statCards = [
              {
                label: `${periodTitle} Net Growth`,
                value: fmtShort(netChange),
                sub: netChange >= 0 ? 'Followers Gained' : 'Followers Lost',
                color: netChange >= 0 ? '#34d399' : '#fb7185',
                bg: netChange >= 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(6,182,212,0.06) 100%)' : 'linear-gradient(135deg, rgba(244,63,94,0.14) 0%, rgba(239,68,68,0.06) 100%)',
                border: netChange >= 0 ? 'rgba(52,211,153,0.35)' : 'rgba(251,113,133,0.35)',
                icon: netChange >= 0 ? '📈' : '📉'
              },
              {
                label: 'Best Performance Day',
                value: bestDay?.increment ? fmtShort(bestDay.increment) : '—',
                sub: bestDay?.date ? new Date(bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
                color: '#60a5fa',
                bg: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(147,51,234,0.06) 100%)',
                border: 'rgba(96,165,250,0.35)',
                icon: '🚀'
              },
              {
                label: 'Biggest Drop Day',
                value: worstDay?.increment ? fmtShort(worstDay.increment) : '—',
                sub: worstDay?.date ? new Date(worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
                color: '#fb7185',
                bg: 'linear-gradient(135deg, rgba(244,63,94,0.14) 0%, rgba(225,29,72,0.06) 100%)',
                border: 'rgba(251,113,133,0.35)',
                icon: '💔'
              },
              {
                label: 'Growth Momentum',
                value: streak > 0 ? `${streak} Days` : '—',
                sub: streakType === 'up' ? '🔥 Growing daily' : streakType === 'down' ? '❄️ Losing daily' : 'Balanced',
                color: streakType === 'up' ? '#fbbf24' : streakType === 'down' ? '#c084fc' : 'var(--text-muted)',
                bg: streakType === 'up' ? 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(234,88,12,0.06) 100%)' : 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(99,102,241,0.06) 100%)',
                border: streakType === 'up' ? 'rgba(251,191,36,0.35)' : 'rgba(192,132,252,0.35)',
                icon: streakType === 'up' ? '🔥' : streakType === 'down' ? '❄️' : '⚡'
              }
            ]

            return (
              <div className="card" style={{
                padding: '24px 22px 22px',
                marginBottom: 24,
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(145deg, rgba(26, 20, 52, 0.95) 0%, rgba(15, 23, 42, 0.96) 60%, rgba(20, 16, 45, 0.95) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 24px 50px -10px rgba(10, 8, 30, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                borderRadius: 24
              }}>
                {/* Glowing ambient background orbs */}
                <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(20px)' }} />
                <div style={{ position: 'absolute', bottom: -50, left: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(16px)' }} />

                {/* Header with Month / Period Dropdown */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 22, position: 'relative', zIndex: 1 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px #a855f7', display: 'inline-block' }} />
                        Daily Growth Pulse
                      </div>

                      {/* Month / Period Dropdown */}
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.9)',
                          color: '#f1f5f9',
                          border: '1px solid rgba(168, 85, 247, 0.45)',
                          borderRadius: 100,
                          padding: '5px 28px 5px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c084fc' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center'
                        }}
                      >
                        <option value="last30" style={{ background: '#0f172a', color: '#fff' }}>🗓️ Last 30 Days</option>
                        <option value="2026-09" style={{ background: '#0f172a', color: '#fff' }}>✨ September 2026</option>
                        <option value="2026-08" style={{ background: '#0f172a', color: '#fff' }}>📅 August 2026</option>
                        {availableMonths.filter(m => m !== '2026-09' && m !== '2026-08').map(m => {
                          const [yr, mo] = m.split('-')
                          const label = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          return <option key={m} value={m} style={{ background: '#0f172a', color: '#fff' }}>📅 {label}</option>
                        })}
                        <option value="all" style={{ background: '#0f172a', color: '#fff' }}>🌐 All Recorded History</option>
                      </select>
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      ⚡ Follower Momentum Timeline
                    </h2>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '5px 0 0', fontWeight: 500 }}>
                      Showing records for <strong style={{ color: '#d8b4fe' }}>{periodTitle}</strong> &nbsp;·&nbsp; Gains <span style={{ color: '#34d399', fontWeight: 700 }}>Right ➔</span> &nbsp;·&nbsp; Drops <span style={{ color: '#fb7185', fontWeight: 700 }}>⬅ Left</span>
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', padding: '8px 16px', borderRadius: 14, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tracking Status</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                      <Sparkles size={13} /> Active Live Pulse
                    </div>
                  </div>
                </div>

                {filteredDailyGains.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 16, border: '1px dashed rgba(168,85,247,0.25)', position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                    <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 700 }}>No Records for {periodTitle} Yet</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Daily records for this period will appear once daily sync is recorded.</div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* ─── 4 Dynamic Stat Cards (Responsive & Spacious) ─── */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 10,
                      marginBottom: 20
                    }}>
                      {statCards.map((s, i) => (
                        <div key={i} style={{
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          borderRadius: 16,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 100,
                          boxShadow: '0 8px 20px -5px rgba(0,0,0,0.3)',
                          backdropFilter: 'blur(10px)',
                          overflow: 'hidden'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                            <div style={{
                              fontSize: 18,
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {s.icon}
                            </div>
                            <div style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: s.color,
                              lineHeight: 1,
                              fontFamily: 'var(--font-display)',
                              textShadow: `0 0 12px ${s.color}44`,
                              textAlign: 'right'
                            }}>
                              {s.value}
                            </div>
                          </div>

                          <div>
                            <div style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#cbd5e1',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              lineHeight: 1.25,
                              marginBottom: 3
                            }}>
                              {s.label}
                            </div>
                            <div style={{
                              fontSize: 11,
                              color: s.color,
                              opacity: 0.95,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}>
                              {s.sub}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ─── Diverging Timeline Chart Canvas with Horizontal & Vertical Scroll ─── */}
                    <div style={{
                      background: 'rgba(15, 12, 35, 0.55)',
                      borderRadius: 18,
                      border: '1px solid rgba(168,85,247,0.22)',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)'
                    }}>
                      {/* Top Horizontal Scroll Hint */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        background: 'linear-gradient(90deg, rgba(168,85,247,0.12) 0%, rgba(6,182,212,0.08) 100%)',
                        borderBottom: '1px solid rgba(168,85,247,0.18)',
                        fontSize: 11.5,
                        color: '#e2e8f0',
                        fontWeight: 600,
                        flexWrap: 'wrap',
                        gap: 8
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#d8b4fe' }}>
                          <span>↔️</span>
                          <span>Swipe / scroll left & right to inspect full table</span>
                        </span>
                        <span style={{ fontSize: 10.5, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>
                          {filteredDailyGains.length} Days Tracked
                        </span>
                      </div>

                      {/* Scrollable Canvas (X & Y scrolling with custom scrollbar and touch inertia) */}
                      <div style={{
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: 460,
                        padding: '14px 12px',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(168,85,247,0.4) transparent',
                      }}>
                        <div style={{ minWidth: 460, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 6 }}>
                          {[...filteredDailyGains].reverse().map((day, idx) => {
                            const barPct = day.isFirst ? 0 : Math.min(96, Math.max(6, (Math.abs(day.increment) / maxAbs) * 96))
                            const isGain = day.increment > 0
                            const isLoss = day.increment < 0
                            const dateObj = new Date(day.date)
                            const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                            const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            const isToday = day.date === new Date().toISOString().split('T')[0]
                            const valueLabel = day.isFirst ? 'BASELINE' : (isGain ? `+${formatNumber(day.increment)}` : isLoss ? `-${formatNumber(Math.abs(day.increment))}` : '±0')
                            const valueColor = isGain ? '#34d399' : isLoss ? '#fb7185' : 'rgba(255,255,255,0.4)'

                            return (
                              <div
                                key={day.date}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: 36,
                                  borderRadius: 10,
                                  transition: 'all 0.15s ease',
                                  cursor: 'pointer',
                                  padding: '0 6px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                                  setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    date: displayDate,
                                    count: day.count,
                                    increment: day.increment,
                                    hasIncrement: !day.isFirst,
                                    diffDays: day.diffDays
                                  })
                                }}
                                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setTooltip(null) }}
                              >
                                {/* Date — left column */}
                                <div style={{ width: 110, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: 11.5, fontWeight: 800, color: isToday ? '#d8b4fe' : '#f1f5f9', lineHeight: 1 }}>{label}</div>
                                    <div style={{ fontSize: 9.5, fontWeight: 700, color: isToday ? '#a855f7' : '#64748b', letterSpacing: '0.04em', marginTop: 2 }}>{weekday}{isToday ? ' · TODAY' : ''}</div>
                                  </div>
                                </div>

                                {/* LEFT — Drop bar & Negative Value */}
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 8, gap: 8 }}>
                                  {isLoss && !day.isFirst && (
                                    <>
                                      <span style={{
                                        fontSize: 11.5,
                                        fontWeight: 900,
                                        color: '#fb7185',
                                        fontFamily: 'var(--font-display)',
                                        textShadow: '0 0 8px rgba(251, 113, 133, 0.4)',
                                        flexShrink: 0
                                      }}>
                                        {valueLabel}
                                      </span>
                                      <div style={{
                                        width: `${barPct}%`,
                                        height: 14,
                                        borderRadius: '8px 0 0 8px',
                                        background: 'linear-gradient(270deg, #f43f5e 0%, #be123c 100%)',
                                        boxShadow: '0 0 12px rgba(244, 63, 94, 0.45)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: '#fda4af', borderRadius: '0 8px 8px 0' }} />
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* CENTER Glowing Axis */}
                                <div style={{ width: 2, height: 24, background: 'linear-gradient(180deg, rgba(168,85,247,0.5), rgba(56,189,248,0.5))', flexShrink: 0, borderRadius: 2 }} />

                                {/* RIGHT — Gain bar & Positive Value */}
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: 8, gap: 8 }}>
                                  {isGain && !day.isFirst && (
                                    <>
                                      <div style={{
                                        width: `${barPct}%`,
                                        height: 14,
                                        borderRadius: '0 8px 8px 0',
                                        background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.45)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#6ee7b7', borderRadius: '8px 0 0 8px' }} />
                                      </div>
                                      <span style={{
                                        fontSize: 11.5,
                                        fontWeight: 900,
                                        color: '#34d399',
                                        fontFamily: 'var(--font-display)',
                                        textShadow: '0 0 8px rgba(52, 211, 153, 0.4)',
                                        flexShrink: 0
                                      }}>
                                        {valueLabel}
                                      </span>
                                    </>
                                  )}
                                  {day.isFirst && (
                                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.06em', paddingLeft: 4 }}>BASELINE</div>
                                  )}
                                  {!day.isFirst && day.increment === 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                                      <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)' }}>±0</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ─── Legend Footer ─── */}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #10b981, #06b6d4)', boxShadow: '0 0 8px #10b981' }} />
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 700 }}>Follower Gain (+) ➔</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 8, borderRadius: 4, background: 'linear-gradient(270deg, #f43f5e, #be123c)', boxShadow: '0 0 8px #f43f5e' }} />
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 700 }}>⬅ Follower Drop (-)</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#a78bfa', marginLeft: 'auto', fontStyle: 'italic', opacity: 0.9 }}>Hover or tap row for exact count</span>
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

