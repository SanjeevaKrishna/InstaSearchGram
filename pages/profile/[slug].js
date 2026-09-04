import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  CornerUpLeft,
  TrendingUp,
  TrendingDown,
  Info,
  Flame,
  Snowflake,
  AlertTriangle,
  Sparkles,
  Zap,
  Calendar,
  BarChart3,
  Activity,
  ArrowLeftRight,
  Rocket,
  HeartCrack,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import CommentSection from '../../components/CommentSection'

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
  // Systematic tracking begins from Aug 28 or 29 (2026-08-28). Remove old pre-Aug 28 test dates.
  const postAug28 = history.filter(h => h && h.date && h.date >= '2026-08-28')
  const activeHistory = postAug28.length > 0 ? postAug28 : history
  const sorted = [...activeHistory].sort((a, b) => new Date(a.date) - new Date(b.date))
  const historyMap = {}
  for (let i = 0; i < sorted.length; i++) {
    const isFailed = sorted[i].status === 'Server Failed' || sorted[i].serverFailed || sorted[i].count === null || sorted[i].count === 0
    historyMap[sorted[i].date] = {
      count: isFailed ? null : sorted[i].count,
      serverFailed: isFailed,
      increment: i > 0 && !isFailed && sorted[i - 1].count ? sorted[i].count - sorted[i - 1].count : 0
    }
  }

  // Filter valid entries with positive follower count
  const valid = sorted.filter(e => e.count !== null && e.count > 0 && e.status !== 'Server Failed' && !e.serverFailed)

  let monthlyGain = 0
  if (valid.length > 0) {
    const latest = valid[valid.length - 1]
    const ld = new Date(latest.date)
    const yr = ld.getFullYear(), mo = ld.getMonth()
    const thisMonth = valid.filter(e => { const d = new Date(e.date); return d.getFullYear() === yr && d.getMonth() === mo })
    if (thisMonth.length > 0) {
      const firstIdx = valid.findIndex(e => e.date === thisMonth[0].date)
      const base = firstIdx > 0 ? valid[firstIdx - 1] : thisMonth[0]
      monthlyGain = thisMonth[thisMonth.length - 1].count - base.count
    }
  }

  let dailyGain = 0
  let dailyGainDays = 1
  let isLatestFailed = false
  if (sorted.length > 0) {
    const latestRaw = sorted[sorted.length - 1]
    if (latestRaw.status === 'Server Failed' || latestRaw.serverFailed || latestRaw.count === null) {
      isLatestFailed = true
    }
  }

  if (valid.length >= 2) {
    const latest = valid[valid.length - 1]
    const prev = valid[valid.length - 2]
    dailyGain = latest.count - prev.count
    const d1 = new Date(latest.date)
    const d2 = new Date(prev.date)
    dailyGainDays = Math.max(1, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)))
  } else if (valid.length === 1 && currentCount) {
    dailyGain = currentCount - valid[0].count
  }

  // Calculate smart weighted velocity (recent day + 3-day moving average) to handle viral spikes smoothly:
  let recentVelocity = dailyGain
  if (valid.length >= 4) {
    const inc1 = valid[valid.length - 1].count - valid[valid.length - 2].count
    const inc2 = valid[valid.length - 2].count - valid[valid.length - 3].count
    const inc3 = valid[valid.length - 3].count - valid[valid.length - 4].count
    const avg3d = Math.round((inc1 + inc2 + inc3) / 3)
    recentVelocity = Math.round(inc1 * 0.6 + avg3d * 0.4)
  } else if (valid.length >= 3) {
    const inc1 = valid[valid.length - 1].count - valid[valid.length - 2].count
    const inc2 = valid[valid.length - 2].count - valid[valid.length - 3].count
    recentVelocity = Math.round(inc1 * 0.7 + inc2 * 0.3)
  }

  return { historyMap, monthlyGain, dailyGain, dailyGainDays, recentVelocity, sorted, valid, isLatestFailed }
}

export default function ProfilePage({ profile, slug }) {
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

  const { historyMap, monthlyGain, dailyGain, dailyGainDays, recentVelocity, sorted, valid, isLatestFailed } = getFollowerStats(profile.follower_history || [], profile.followers_count || 0)
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

  // Full Time-of-Day & Multi-Day Progressive Follower Progression (Morning -> Afternoon -> Night -> Next Day)
  // Purely client-side calculation based on daily velocity (Zero Vercel/Supabase requests)
  const timeAdjustedBase = useMemo(() => {
    const base = profile.followers_count || 0
    if (!base) return 0

    // Measure time-of-day progress across 24h (0.0 to 1.0)
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600

    let diurnalFraction = 0
    if (hour < 7) {
      // Midnight 12:00 AM to 07:00 AM: constant (0% diurnal gain during sleeping hours)
      diurnalFraction = 0
    } else if (hour < 12) {
      // 07:00 AM to 12:00 PM: Morning wave (0% -> 35%)
      diurnalFraction = ((hour - 7) / 5) * 0.35
    } else if (hour < 18) {
      // 12:00 PM to 18:00 (6 PM): Afternoon stream (35% -> 73%)
      diurnalFraction = 0.35 + ((hour - 12) / 6) * 0.38
    } else {
      // 18:00 (6 PM) to 24:00 (12 AM): Evening prime peak (73% -> 100%)
      diurnalFraction = 0.73 + ((hour - 18) / 6) * 0.27
    }

    // Determine estimated daily velocity from recent velocity (weighted blend of recent day & 3-day average)
    const rate = recentVelocity !== 0 ? recentVelocity : dailyGain !== 0 ? dailyGain : Math.round((monthlyGain || 0) / 30)

    // Check if multiple days elapsed since the latest recorded history date in the database
    const historyEntries = (profile.follower_history || []).filter(e => e && e.date && e.count > 0 && !e.serverFailed && e.status !== 'Server Failed')
    let elapsedDays = 0
    if (historyEntries.length > 0) {
      const sortedHistory = [...historyEntries].sort((a, b) => new Date(a.date) - new Date(b.date))
      const latestDateStr = sortedHistory[sortedHistory.length - 1].date
      const latestDate = new Date(latestDateStr + 'T00:00:00Z')
      const todayDate = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z')
      const diffMs = todayDate.getTime() - latestDate.getTime()
      elapsedDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)))
    }

    // Past full days accumulated growth + today's daytime progress (from morning to night)
    const pastDaysGrowth = elapsedDays * rate
    const daytimeGrowth = Math.round(rate * diurnalFraction)

    return Math.max(0, base + pastDaysGrowth + daytimeGrowth)
  }, [profile.followers_count, profile.follower_history, recentVelocity, dailyGain, monthlyGain])

  // 1. Initial Odometer Count-Up Animation (Gracefully paced, smooth ease-out)
  useEffect(() => {
    if (!timeAdjustedBase) return

    setLiveFollowers(0)
    setIsCountingUp(true)

    const duration = 3800 // Paced at 3.8 seconds for a smooth, relaxed count-up
    const start = 0
    const end = timeAdjustedBase
    const startTime = performance.now()
    let animationFrame;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Smooth cubic ease-out: starts smoothly, runs steadily, and decelerates gently to exact value
      const easeProgress = 1 - Math.pow(1 - progress, 3)
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

  // 2. Continuous Micro-Fluctuation simulation with night-time freeze and relaxed realistic speeds
  useEffect(() => {
    if (isCountingUp || !timeAdjustedBase) return

    const baseCount = timeAdjustedBase

    // Initialize display count to the time-adjusted base when counting finishes
    setLiveFollowers(baseCount)

    // Check time of day: 12:00 AM (00:00) to 07:00 AM is sleeping/night hours
    const now = new Date()
    const currentHour = now.getHours() + now.getMinutes() / 60
    const isNight = currentHour >= 0 && currentHour < 7

    // Night Rule:
    // 1) For accounts < 500k followers: ZERO up or down from midnight 12 to morning 7 (completely constant)
    if (isNight && baseCount < 500_000) {
      return
    }

    // Determine scale tier and speed based on account size & time of day
    let maxDrift = 12
    let minStep = 1
    let maxStep = 2
    let intervalMs = 10000

    if (isNight) {
      // 2) For accounts >= 500k during midnight to morning 7:
      // Very subtle up/down (±1 to ±2 max) with slow 12-second intervals
      maxDrift = 2
      minStep = 1
      maxStep = 2
      intervalMs = 12000
    } else {
      // Daytime realistic relaxed speeds (slower and steadier)
      if (baseCount >= 20_000_000) {
        maxDrift = 2500
        minStep = 100
        maxStep = 400
        intervalMs = 4500
      } else if (baseCount >= 5_000_000) {
        maxDrift = 1200
        minStep = 50
        maxStep = 200
        intervalMs = 5000
      } else if (baseCount >= 1_000_000) {
        maxDrift = 400
        minStep = 15
        maxStep = 60
        intervalMs = 6000
      } else if (baseCount >= 700_000) {
        maxDrift = 75
        minStep = 5
        maxStep = 20
        intervalMs = 7000
      } else if (baseCount >= 300_000) {
        maxDrift = 50
        minStep = 2
        maxStep = 10
        intervalMs = 8000
      } else if (baseCount >= 100_000) {
        maxDrift = 30
        minStep = 1
        maxStep = 4
        intervalMs = 9000
      } else {
        maxDrift = 12
        minStep = 1
        maxStep = 2
        intervalMs = 10000
      }
    }

    const interval = setInterval(() => {
      // Dynamically check if night status changes during a long session
      const checkNow = new Date()
      const liveHour = checkNow.getHours() + checkNow.getMinutes() / 60
      if (liveHour >= 0 && liveHour < 7 && baseCount < 500_000) {
        setLiveFollowers(baseCount)
        return
      }

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
        <title>{`${profile.name} (@${profile.instagram_handle || profile.name}) Instagram Followers Live - Real-Time Count & Stats | Spialr`}</title>
        <meta
          name="description"
          content={`Track ${profile.name} (@${profile.instagram_handle || ''}) live Instagram follower count (${formatNumber(profile.followers_count)}). View real-time daily follower gains, 31-day growth history, weekly breakdown, and live rankings on Spialr.`}
        />
        <meta
          name="keywords"
          content={`${profile.name}, ${profile.name} instagram followers, ${profile.name} instagram followers count, ${profile.name} followers on instagram, ${profile.name} insta followers, ${profile.instagram_handle || ''} followers, live instagram follower count, instagram follower tracker, growth stats, spialr`}
        />
        <link rel="canonical" href={`https://spialr.com/profile/${slug || profile.instagram_handle || ''}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${profile.name} (@${profile.instagram_handle || ''}) Instagram Followers Live - Real-Time Count & Stats | Spialr`} />
        <meta property="og:description" content={`Track ${profile.name} (@${profile.instagram_handle || ''}) real-time Instagram follower count (${formatNumber(profile.followers_count)}), live daily gains, and 31-day growth history on Spialr.`} />
        <meta property="og:image" content={profile.photo_url || 'https://spialr.com/og-image.jpg'} />
        <meta property="og:url" content={`https://spialr.com/profile/${slug || profile.instagram_handle || ''}`} />
        <meta property="og:site_name" content="Spialr" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${profile.name} Instagram Followers Count Live | Spialr`} />
        <meta name="twitter:description" content={`Live real-time follower count and 31-day growth stats for ${profile.name} (@${profile.instagram_handle || ''}).`} />
        <meta name="twitter:image" content={profile.photo_url || 'https://spialr.com/og-image.jpg'} />

        {/* Structured Data: Person Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": profile.name,
              "alternateName": profile.instagram_handle ? `@${profile.instagram_handle}` : profile.name,
              "url": `https://spialr.com/profile/${slug || profile.instagram_handle || ''}`,
              "image": profile.photo_url || '',
              "sameAs": profile.instagram_handle ? `https://www.instagram.com/${profile.instagram_handle}/` : undefined,
              "interactionStatistic": [
                {
                  "@type": "InteractionCounter",
                  "interactionType": "https://schema.org/FollowAction",
                  "userInteractionCount": profile.followers_count || 0
                }
              ]
            })
          }}
        />

        {/* Structured Data: FAQPage Schema (Targets Google Q&A Rich Snippets) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": `How many followers does ${profile.name} have on Instagram?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `As of today, ${profile.name} (@${profile.instagram_handle || ''}) has approximately ${formatNumber(profile.followers_count)} followers on Instagram, tracked in real-time with live updates on Spialr.`
                  }
                },
                {
                  "@type": "Question",
                  "name": `How fast is ${profile.name}'s Instagram account growing?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `${profile.name} gains approximately ${dailyGain >= 0 ? '+' + formatNumber(dailyGain) : formatNumber(dailyGain)} followers per day with an estimated 30-day growth of ${monthlyGain >= 0 ? '+' + formatNumber(monthlyGain) : formatNumber(monthlyGain)} followers.`
                  }
                },
                {
                  "@type": "Question",
                  "name": `What is ${profile.name}'s official Instagram handle?`,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `The official Instagram handle for ${profile.name} is @${profile.instagram_handle || 'N/A'}. You can track live real-time follower counts, rankings, and historical momentum on Spialr.`
                  }
                }
              ]
            })
          }}
        />

        {/* Structured Data: BreadcrumbList Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://spialr.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Live Followers",
                  "item": "https://spialr.com/live"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": `${profile.name}`,
                  "item": `https://spialr.com/profile/${slug || profile.instagram_handle || ''}`
                }
              ]
            })
          }}
        />
      </Head>

      <style>{`
        .grid-square { transition: transform 0.15s ease, filter 0.15s ease; cursor: pointer; }
        .grid-square:hover { transform: scale(1.35); filter: brightness(1.25); z-index: 10; position: relative; }
        
        .profile-page-wrapper {
          min-height: 100vh;
          background: var(--background);
          color: var(--text);
          padding: 24px 16px;
        }

        .profile-main-container {
          max-width: 680px;
          margin: 0 auto;
        }

        .profile-hero-card {
          padding: 28px;
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
          border-radius: 20px;
        }

        .profile-stats-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
        }

        .profile-stat-box {
          padding: 14px 10px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
        }

        .info-drama-card {
          padding: 18px 20px;
          margin-bottom: 24px;
          border-radius: 16px;
        }

        .info-drama-stats {
          display: flex;
          gap: 14px;
          font-size: 12px;
          flex-wrap: wrap;
        }

        .info-drama-stat-item {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 12px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .pulse-card {
          padding: 22px 20px;
          margin-bottom: 24px;
          overflow: hidden;
          position: relative;
          border-radius: 20px;
        }

        .pulse-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .pulse-header-left {
          flex: 1;
          min-width: 260px;
        }

        .pulse-header-status {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 14px;
          border-radius: 12px;
          text-align: right;
          flex-shrink: 0;
        }

        .momentum-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .momentum-stat-card {
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 86px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          box-sizing: border-box;
        }

        .timeline-row {
          display: flex;
          align-items: center;
          min-height: 38px;
          height: auto;
          border-radius: 8px;
          transition: background 0.15s ease;
          cursor: pointer;
          padding: 3px 6px;
          margin: 1px 0;
        }

        .timeline-bar-track {
          width: 130px;
          height: 14px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .timeline-bar-track-left {
          justify-content: flex-end;
        }

        .timeline-bar-track-right {
          justify-content: flex-start;
        }

        @media (min-width: 768px) {
          .timeline-bar-track {
            width: 180px;
          }
        }

        /* ─── Mobile View Enhancements (Max-Width 640px) ─── */
        @media (max-width: 640px) {
          .profile-page-wrapper {
            padding: 14px 10px !important;
          }
          
          .profile-hero-card {
            padding: 20px 14px !important;
            margin-bottom: 18px !important;
            border-radius: 16px !important;
          }

          .profile-avatar {
            width: 86px !important;
            height: 86px !important;
          }

          .profile-title {
            font-size: 20px !important;
            margin-bottom: 6px !important;
          }

          .profile-tags-container {
            gap: 5px !important;
            margin-bottom: 18px !important;
          }

          /* Featured 2-Row Stats on Mobile: Real-Time Followers takes full width, other 2 share row */
          .profile-stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            padding-top: 18px !important;
          }

          .profile-stat-box-featured {
            grid-column: 1 / -1 !important;
            padding: 14px 12px !important;
          }

          .profile-stat-box {
            padding: 12px 8px !important;
          }

          .info-drama-card {
            padding: 16px 14px !important;
            margin-bottom: 18px !important;
            border-radius: 14px !important;
          }

          .info-drama-sentence {
            font-size: 12.5px !important;
            line-height: 1.65 !important;
            margin-bottom: 14px !important;
          }

          .info-drama-stats {
            flex-direction: column !important;
            gap: 8px !important;
          }

          .info-drama-stat-item {
            width: 100% !important;
            box-sizing: border-box !important;
            justifyContent: space-between !important;
            padding: 8px 12px !important;
          }

          .pulse-card {
            padding: 16px 12px !important;
            margin-bottom: 18px !important;
            border-radius: 16px !important;
          }

          .pulse-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }

          .pulse-header-left {
            min-width: unset !important;
          }

          .pulse-header-status {
            text-align: left !important;
            align-self: flex-start !important;
            width: 100% !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 8px 12px !important;
          }

          .momentum-stat-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
          }

          .momentum-stat-card {
            padding: 10px 10px !important;
            min-height: 80px !important;
            border-radius: 12px !important;
          }

          .timeline-row {
            height: 42px !important;
            padding: 0 8px !important;
            margin: 2px 0 !important;
          }
        }

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
          {tooltip.isFailed ? (
            <div style={{ color: '#f87171', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <AlertTriangle size={13} color="#f87171" />
              <span>Server Failed</span>
              <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 4, fontWeight: 800 }}>
                ({tooltip.failureDaysCount || 2} days follower count)
              </span>
            </div>
          ) : (
            <>
              <div style={{ color: '#94a3b8', marginBottom: 2 }}>
                Followers: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{tooltip.count?.toLocaleString() || '—'}</span>
                {tooltip.diffDays > 1 && (
                  <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 5, fontWeight: 800 }}>
                    ({tooltip.diffDays} day follower count)
                  </span>
                )}
              </div>
              {tooltip.hasIncrement && (
                <div style={{ color: tooltip.increment > 0 ? '#34d399' : tooltip.increment < 0 ? '#fb7185' : '#64748b' }}>
                  Growth: <span style={{ fontWeight: 700 }}>{tooltip.increment > 0 ? `+${tooltip.increment.toLocaleString()}` : tooltip.increment.toLocaleString()}</span>
                  {tooltip.diffDays > 1 && (
                    <span style={{ fontSize: 9.5, color: '#fbbf24', marginLeft: 5, fontWeight: 700 }}>
                      ({tooltip.diffDays} days accumulated)
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="profile-page-wrapper">
        <div className="profile-main-container">

          {/* Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Link href="/live" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, color: 'var(--text)', cursor: 'pointer', textDecoration: 'none' }}>
              <CornerUpLeft size={18} />
            </Link>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Back to Live Standings</span>
          </div>

          {/* Profile Hero Card */}
          <div className="card profile-hero-card">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ marginBottom: 18 }}>
                <img src={profile.photo_url || '/placeholder-avatar.png'} alt={profile.name}
                  className="profile-avatar"
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(168,85,247,0.4)', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }} />
              </div>
              <h1 className="profile-title" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.25 }}>{profile.name}</h1>
              {profile.instagram_handle && (
                <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#a855f7', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                  <InstagramIcon size={13} />@{profile.instagram_handle}
                </a>
              )}
              <div className="profile-tags-container" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
                {profile.category?.split(',').map((cat, idx) => (
                  <span key={idx} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                    {cat.includes(':') ? cat.split(':')[1].trim() : cat.trim()}
                  </span>
                ))}
                {profile.language && (
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                    {profile.language}
                  </span>
                )}
              </div>

              {/* Responsive Stats Grid */}
              <div className="profile-stats-grid">
                <div className="profile-stat-box profile-stat-box-featured" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ 
                    fontSize: 20, 
                    fontWeight: 850, 
                    color: changeDir === 'up' ? '#10b981' : changeDir === 'down' ? '#ef4444' : '#818cf8', 
                    fontFamily: 'var(--font-display)', 
                    marginBottom: 4,
                    transition: 'color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}>
                    <span>{liveFollowers ? liveFollowers.toLocaleString() : '—'}</span>
                    {changeDir && (
                      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.9 }}>
                        {changeDir === 'up' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Real Time Followers</div>
                </div>

                {/* Dynamic Relatable Daily Change Card */}
                {(() => {
                  let badgeLabel = 'Daily Gain'
                  if (isLatestFailed) {
                    badgeLabel = 'Server Failed'
                  } else if (dailyGain > 0) {
                    badgeLabel = 'Gained Today'
                  } else if (dailyGain < 0) {
                    badgeLabel = 'Lost Today'
                  } else {
                    badgeLabel = 'Stable Today'
                  }

                  if (!isLatestFailed && dailyGainDays > 1) {
                    badgeLabel = `${badgeLabel} (${dailyGainDays} day follower count)`
                  }

                  return (
                    <div className="profile-stat-box" style={{ 
                      background: isLatestFailed ? 'rgba(239, 68, 68, 0.1)' : dailyGain > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(6,182,212,0.06) 100%)' : dailyGain < 0 ? 'linear-gradient(135deg, rgba(244,63,94,0.14) 0%, rgba(225,29,72,0.06) 100%)' : 'var(--surface2)', 
                      border: `1px solid ${isLatestFailed ? 'rgba(239, 68, 68, 0.4)' : dailyGain > 0 ? 'rgba(52,211,153,0.4)' : dailyGain < 0 ? 'rgba(251,113,133,0.4)' : 'var(--border)'}`,
                      boxShadow: isLatestFailed ? 'none' : dailyGain !== 0 ? `0 4px 14px -2px ${dailyGain > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` : 'none'
                    }}>
                      <div style={{ 
                        fontSize: isLatestFailed ? 15 : 19, 
                        fontWeight: 800, 
                        color: isLatestFailed ? '#f87171' : dailyGain > 0 ? '#34d399' : dailyGain < 0 ? '#fb7185' : 'var(--text-muted)', 
                        fontFamily: 'var(--font-display)', 
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        textShadow: !isLatestFailed && dailyGain !== 0 ? `0 0 10px ${dailyGain > 0 ? '#34d399' : '#fb7185'}44` : 'none'
                      }}>
                        {isLatestFailed ? (
                          <>
                            <AlertTriangle size={15} color="#f87171" />
                            <span>Server Failed</span>
                          </>
                        ) : (
                          <span>{dailyGain > 0 ? `+${formatNumber(dailyGain)}` : dailyGain < 0 ? `-${formatNumber(Math.abs(dailyGain))}` : '±0'}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 9.5, color: isLatestFailed ? '#fca5a5' : dailyGain > 0 ? '#6ee7b7' : dailyGain < 0 ? '#fda4af' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.3 }}>
                        {badgeLabel}
                      </div>
                    </div>
                  )
                })()}

                <div className="profile-stat-box" style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.2)' }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#f472b6', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{profile.votes || 0}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Votes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Drama & Growth Meter widget */}
          {isLosing ? (
            <div className="card info-drama-card" style={{ background: 'var(--surface)', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 10 }}>
                <Flame size={18} />
                <span>Active Unfollow Trend</span>
              </div>
              <p className="info-drama-sentence" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, margin: '0 0 16px', fontWeight: 500 }}>
                <strong style={{ color: '#ef4444', fontWeight: 800 }}>{profile.name}</strong> is currently experiencing an active unfollow wave, dropping <strong style={{ color: '#ef4444', fontWeight: 800 }}>-{formatNumber(lostFollowers)}</strong> followers from their historical peak.
              </p>
              <div className="info-drama-stats">
                <div className="info-drama-stat-item">
                  <span style={{ color: 'var(--text-muted)' }}>Peak Mark:</span> <strong style={{ color: '#38bdf8', fontWeight: 800, marginLeft: 4 }}>{peakFollowers.toLocaleString()}</strong>
                </div>
                <div className="info-drama-stat-item">
                  <span style={{ color: 'var(--text-muted)' }}>Total Dropped:</span> <strong style={{ color: '#ef4444', fontWeight: 800, marginLeft: 4 }}>-{formatNumber(lostFollowers)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="card info-drama-card" style={{ background: 'var(--surface)', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 10 }}>
                <TrendingUp size={18} />
                <span>Peak Follower Momentum</span>
              </div>
              <p className="info-drama-sentence" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, margin: '0 0 16px', fontWeight: 500 }}>
                <strong style={{ color: '#38bdf8', fontWeight: 800 }}>{profile.name}</strong> is maintaining steady momentum at their historical peak with positive daily activity.
              </p>
              <div className="info-drama-stats">
                <div className="info-drama-stat-item">
                  <span style={{ color: 'var(--text-muted)' }}>Peak Mark:</span> <strong style={{ color: '#38bdf8', fontWeight: 800, marginLeft: 4 }}>{peakFollowers.toLocaleString()}</strong>
                </div>
                <div className="info-drama-stat-item">
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span> <strong style={{ color: '#10b981', fontWeight: 800, marginLeft: 4 }}>Peak Achieved</strong>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ Daily Growth Pulse — Vibrant Ultra-Modern Edition with Month Filter */}
          {(() => {
            // Build full chronological day-by-day history filling any missing dates with 'Server Failed'
            // Tracking officially starts on Aug 28 or Aug 29. Never generate Server Failed for pre-Aug 28 test dates.
            const trackingSorted = sorted.filter(item => item && item.date && item.date >= '2026-08-28')
            const sourceList = trackingSorted.length > 0 ? trackingSorted : sorted

            const dailyHistoryItems = []
            const entriesByDate = {}
            sourceList.forEach(item => {
              if (item && item.date) entriesByDate[item.date] = item
            })

            if (sourceList.length > 0) {
              const firstDateStr = sourceList[0].date
              const lastDateStr = sourceList[sourceList.length - 1].date
              const cur = new Date(firstDateStr)
              const end = new Date(lastDateStr)

              let lastValidCount = null
              let lastValidDate = null

              while (cur <= end) {
                const dateStr = cur.toISOString().split('T')[0]
                const entry = entriesByDate[dateStr]

                const isFailed = !entry || entry.status === 'Server Failed' || entry.serverFailed || entry.count === null || entry.count === 0

                if (isFailed) {
                  dailyHistoryItems.push({
                    date: dateStr,
                    count: null,
                    increment: 0,
                    isFirst: false,
                    isFailed: true,
                    diffDays: 1,
                    status: 'Server Failed'
                  })
                } else {
                  let diffDays = 1
                  let inc = 0
                  const isFirst = lastValidCount === null
                  if (!isFirst && lastValidDate) {
                    const dCur = new Date(dateStr)
                    const dPrev = new Date(lastValidDate)
                    diffDays = Math.max(1, Math.round(Math.abs(dCur - dPrev) / (1000 * 60 * 60 * 24)))
                    inc = entry.count - lastValidCount
                  }
                  lastValidCount = entry.count
                  lastValidDate = dateStr

                  dailyHistoryItems.push({
                    date: dateStr,
                    count: entry.count,
                    increment: inc,
                    isFirst,
                    isFailed: false,
                    diffDays,
                    lastValidDate
                  })
                }

                cur.setDate(cur.getDate() + 1)
              }
            }

            // Calculate failureDaysCount for each failed day:
            // When server fails, how many days does the subsequent sync represent? (e.g. 2 days or 3 days)
            for (let i = 0; i < dailyHistoryItems.length; i++) {
              if (dailyHistoryItems[i].isFailed) {
                let nextValid = null
                for (let j = i + 1; j < dailyHistoryItems.length; j++) {
                  if (!dailyHistoryItems[j].isFailed) {
                    nextValid = dailyHistoryItems[j]
                    break
                  }
                }
                if (nextValid && nextValid.diffDays > 1) {
                  dailyHistoryItems[i].failureDaysCount = nextValid.diffDays
                } else {
                  let prevValid = null
                  for (let j = i - 1; j >= 0; j--) {
                    if (!dailyHistoryItems[j].isFailed) {
                      prevValid = dailyHistoryItems[j]
                      break
                    }
                  }
                  if (prevValid) {
                    const dCur = new Date(dailyHistoryItems[i].date)
                    const dPrev = new Date(prevValid.date)
                    const days = Math.max(2, Math.round(Math.abs(dCur - dPrev) / (1000 * 60 * 60 * 24)) + 1)
                    dailyHistoryItems[i].failureDaysCount = days
                  } else {
                    dailyHistoryItems[i].failureDaysCount = 2
                  }
                }
              }
            }

            const allDailyHistory = dailyHistoryItems

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

            const nonFirstGains = filteredDailyGains.filter(d => !d.isFirst && !d.isFailed)
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
                bg: 'rgba(255, 255, 255, 0.03)',
                border: netChange >= 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 113, 133, 0.25)',
                iconBg: netChange >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                icon: netChange >= 0 ? <TrendingUp size={16} color="#34d399" /> : <TrendingDown size={16} color="#fb7185" />
              },
              {
                label: 'Best Performance',
                value: bestDay?.increment ? fmtShort(bestDay.increment) : '—',
                sub: bestDay?.date ? new Date(bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No data',
                color: '#60a5fa',
                bg: 'rgba(255, 255, 255, 0.03)',
                border: 'rgba(96, 165, 250, 0.25)',
                iconBg: 'rgba(59, 130, 246, 0.12)',
                icon: <Rocket size={16} color="#60a5fa" />
              },
              {
                label: 'Biggest Drop',
                value: worstDay?.increment ? fmtShort(worstDay.increment) : '—',
                sub: worstDay?.date ? new Date(worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No data',
                color: '#fb7185',
                bg: 'rgba(255, 255, 255, 0.03)',
                border: 'rgba(251, 113, 133, 0.25)',
                iconBg: 'rgba(244, 63, 94, 0.12)',
                icon: <HeartCrack size={16} color="#fb7185" />
              },
              {
                label: 'Growth Momentum',
                value: streak > 0 ? `${streak} Days` : '—',
                sub: streakType === 'up' ? 'Growing daily' : streakType === 'down' ? 'Losing daily' : 'Stable trajectory',
                color: streakType === 'up' ? '#fbbf24' : streakType === 'down' ? '#c084fc' : '#94a3b8',
                bg: 'rgba(255, 255, 255, 0.03)',
                border: streakType === 'up' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(192, 132, 252, 0.25)',
                iconBg: streakType === 'up' ? 'rgba(245, 158, 11, 0.12)' : streakType === 'down' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                icon: streakType === 'up' ? <Flame size={16} color="#fbbf24" /> : streakType === 'down' ? <Snowflake size={16} color="#c084fc" /> : <Activity size={16} color="#94a3b8" />
              }
            ]

            return (
              <div className="card pulse-card" style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 28, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Header with Month / Period Dropdown */}
                <div className="pulse-header">
                  <div className="pulse-header-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 750, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <Activity size={12} color="#c084fc" />
                        Daily Growth Pulse
                      </div>

                      {/* Month / Period Dropdown */}
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.9)',
                          color: '#f1f5f9',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 100,
                          padding: '5px 28px 5px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center'
                        }}
                      >
                        <option value="last30" style={{ background: '#0f172a', color: '#fff' }}>Last 30 Days</option>
                        <option value="2026-09" style={{ background: '#0f172a', color: '#fff' }}>September 2026</option>
                        <option value="2026-08" style={{ background: '#0f172a', color: '#fff' }}>August 2026</option>
                        {availableMonths.filter(m => m !== '2026-09' && m !== '2026-08').map(m => {
                          const [yr, mo] = m.split('-')
                          const label = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          return <option key={m} value={m} style={{ background: '#0f172a', color: '#fff' }}>{label}</option>
                        })}
                        <option value="all" style={{ background: '#0f172a', color: '#fff' }}>All Recorded History</option>
                      </select>
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3 }}>
                      <BarChart3 size={20} color="#a78bfa" />
                      Follower Momentum Timeline
                    </h2>
                    <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '6px 0 0', fontWeight: 500, lineHeight: 1.5 }}>
                      Daily performance breakdown for <strong style={{ color: '#e2e8f0' }}>{periodTitle}</strong>
                    </p>
                  </div>

                  <div className="pulse-header-status">
                    <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tracking Status</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <CheckCircle2 size={12} color="#34d399" /> Active Daily Pulse
                    </div>
                  </div>
                </div>

                {filteredDailyGains.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 16, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                    <BarChart3 size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 700 }}>No Records for {periodTitle} Yet</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Daily records will appear once daily sync is recorded.</div>
                  </div>
                ) : (
                  <div>
                    {/* ─── 4 Dynamic Stat Cards (Responsive: 2x2 on mobile, 4-col on desktop) ─── */}
                    <div className="momentum-stat-grid">
                      {statCards.map((s, i) => (
                        <div key={i} className="momentum-stat-card" style={{
                          background: s.bg,
                          border: `1px solid ${s.border}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: s.iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {s.icon}
                            </div>
                            <div style={{
                              fontSize: 16,
                              fontWeight: 900,
                              color: s.color,
                              lineHeight: 1,
                              fontFamily: 'var(--font-display)',
                              textAlign: 'right',
                              whiteSpace: 'nowrap'
                            }}>
                              {s.value}
                            </div>
                          </div>

                          <div>
                            <div style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              lineHeight: 1.2,
                              marginBottom: 2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {s.label}
                            </div>
                            <div style={{
                              fontSize: 10.5,
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
                      background: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: 16,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {/* Top Horizontal Scroll Hint */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: 11,
                        color: '#94a3b8',
                        fontWeight: 600,
                        flexWrap: 'wrap',
                        gap: 8
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
                          <ArrowLeftRight size={13} color="#94a3b8" />
                          <span>Scroll horizontally to inspect full timeline</span>
                        </span>
                        <span style={{ fontSize: 10.5, color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: 8 }}>
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
                        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                      }}>
                        <div style={{ minWidth: 600, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 6 }}>
                          {[...filteredDailyGains].reverse().map((day, idx) => {
                            const barPct = day.isFirst || day.increment === 0
                              ? 0
                              : Math.min(100, Math.max(6, (Math.abs(day.increment) / maxAbs) * 100))
                            const isGain = day.increment > 0
                            const isLoss = day.increment < 0
                            const dateObj = new Date(day.date)
                            const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                            const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            const isToday = day.date === new Date().toISOString().split('T')[0]
                            const valueLabel = day.isFirst ? 'BASELINE' : (isGain ? `+${formatNumber(day.increment)}` : isLoss ? `-${formatNumber(Math.abs(day.increment))}` : '±0')

                            return (
                              <div
                                key={day.date}
                                className="timeline-row"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                  setTooltip({
                                    x: e.clientX,
                                    y: e.clientY,
                                    date: displayDate,
                                    count: day.count,
                                    increment: day.increment,
                                    hasIncrement: !day.isFirst && !day.isFailed,
                                    diffDays: day.diffDays,
                                    failureDaysCount: day.failureDaysCount,
                                    isFailed: day.isFailed
                                  })
                                }}
                                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setTooltip(null) }}
                              >
                                {/* Date — left column */}
                                <div style={{ width: 110, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: 11.5, fontWeight: 800, color: isToday ? '#a78bfa' : '#f1f5f9', lineHeight: 1 }}>{label}</div>
                                    <div style={{ fontSize: 9.5, fontWeight: 600, color: isToday ? '#818cf8' : '#64748b', letterSpacing: '0.04em', marginTop: 2 }}>{weekday}{isToday ? ' · TODAY' : ''}</div>
                                  </div>
                                </div>

                                {/* LEFT — Drop Area / Server Failed */}
                                <div style={{
                                  flex: 1,
                                  display: 'flex',
                                  justifyContent: day.isFailed ? 'flex-start' : 'flex-end',
                                  alignItems: 'center',
                                  paddingLeft: day.isFailed ? 8 : 0,
                                  paddingRight: day.isFailed ? 0 : 8,
                                  gap: 8,
                                  minWidth: 0
                                }}>
                                  {day.isFailed ? (
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '3px 10px',
                                      borderRadius: 6,
                                      background: 'rgba(239, 68, 68, 0.12)',
                                      border: '1px solid rgba(239, 68, 68, 0.35)',
                                      color: '#f87171',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: '0.03em',
                                      flexShrink: 0
                                    }}>
                                      <AlertTriangle size={12} color="#f87171" />
                                      <span>Server Failed</span>
                                    </div>
                                  ) : isLoss && !day.isFirst ? (
                                    <>
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        gap: 2
                                      }}>
                                        <span style={{
                                          fontSize: 11.5,
                                          fontWeight: 900,
                                          color: '#fb7185',
                                          fontFamily: 'var(--font-display)',
                                          lineHeight: 1.1,
                                          flexShrink: 0
                                        }}>
                                          {valueLabel}
                                        </span>
                                        {day.diffDays > 1 && (
                                          <span style={{
                                            fontSize: 9,
                                            fontWeight: 800,
                                            color: '#f59e0b',
                                            background: 'rgba(245, 158, 11, 0.14)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            padding: '0.5px 5px',
                                            borderRadius: 4,
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.2,
                                            flexShrink: 0
                                          }}>
                                            ({day.diffDays} days follower count)
                                          </span>
                                        )}
                                      </div>
                                      <div className="timeline-bar-track timeline-bar-track-left">
                                        <div style={{
                                          width: `${barPct}%`,
                                          height: 14,
                                          borderRadius: '6px 0 0 6px',
                                          background: 'linear-gradient(270deg, #f43f5e 0%, #be123c 100%)',
                                          position: 'relative',
                                          overflow: 'hidden',
                                          boxShadow: '0 0 8px rgba(244, 63, 94, 0.3)'
                                        }}>
                                          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: '#fda4af' }} />
                                        </div>
                                      </div>
                                    </>
                                  ) : null}
                                </div>

                                {/* CENTER Hairline Axis */}
                                <div style={{ width: 1, height: 22, background: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }} />

                                {/* RIGHT — Gain Area */}
                                <div style={{
                                  flex: 1,
                                  display: 'flex',
                                  justifyContent: 'flex-start',
                                  alignItems: 'center',
                                  paddingLeft: 8,
                                  gap: 8,
                                  minWidth: 0
                                }}>
                                  {!day.isFailed && (
                                    <>
                                      {isGain && !day.isFirst && (
                                        <>
                                          <div className="timeline-bar-track timeline-bar-track-right">
                                            <div style={{
                                              width: `${barPct}%`,
                                              height: 14,
                                              borderRadius: '0 6px 6px 0',
                                              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                              position: 'relative',
                                              overflow: 'hidden',
                                              boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
                                            }}>
                                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#6ee7b7' }} />
                                            </div>
                                          </div>
                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            gap: 2
                                          }}>
                                            <span style={{
                                              fontSize: 11.5,
                                              fontWeight: 900,
                                              color: '#34d399',
                                              fontFamily: 'var(--font-display)',
                                              lineHeight: 1.1,
                                              flexShrink: 0
                                            }}>
                                              {valueLabel}
                                            </span>
                                            {day.diffDays > 1 && (
                                              <span style={{
                                                fontSize: 9,
                                                fontWeight: 800,
                                                color: '#f59e0b',
                                                background: 'rgba(245, 158, 11, 0.14)',
                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                padding: '0.5px 5px',
                                                borderRadius: 4,
                                                whiteSpace: 'nowrap',
                                                lineHeight: 1.2,
                                                flexShrink: 0
                                              }}>
                                                ({day.diffDays} days follower count)
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      )}
                                      {day.isFirst && (
                                        <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', paddingLeft: 4 }}>BASELINE</div>
                                      )}
                                      {!day.isFirst && day.increment === 0 && (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'flex-start',
                                          justifyContent: 'center',
                                          paddingLeft: 4,
                                          gap: 2
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)' }} />
                                            <span style={{ fontSize: 11, fontWeight: 750, color: '#64748b', fontFamily: 'var(--font-display)' }}>±0</span>
                                          </div>
                                          {day.diffDays > 1 && (
                                            <span style={{
                                              fontSize: 9,
                                              fontWeight: 800,
                                              color: '#f59e0b',
                                              background: 'rgba(245, 158, 11, 0.14)',
                                              border: '1px solid rgba(245, 158, 11, 0.3)',
                                              padding: '0.5px 5px',
                                              borderRadius: 4,
                                              whiteSpace: 'nowrap',
                                              lineHeight: 1.2,
                                              flexShrink: 0
                                            }}>
                                              ({day.diffDays} days follower count)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ─── Clean Professional Legend Footer ─── */}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>Follower Gain (+)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} />
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>Follower Drop (-)</span>
                      </div>
                      <span style={{ fontSize: 10.5, color: '#64748b', marginLeft: 'auto' }}>Hover or tap row for detailed stats</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Community Comments Section */}
          <CommentSection
            targetType="profile"
            targetSlug={profile.instagram_handle || slug}
            targetName={profile.name || profile.instagram_handle}
          />

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
      return { props: { profile: byHandle, slug: decodedSlug } }
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

    return { props: { profile: fullProfile, slug: decodedSlug } }
  } catch (err) {
    console.error('getServerSideProps error in profile page:', err)
    return { notFound: true }
  }
}

