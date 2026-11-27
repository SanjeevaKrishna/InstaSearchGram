import { useState, useEffect, useMemo, useRef } from 'react'
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
  CheckCircle2,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  ArrowUpRight,
  HelpCircle,
  Users,
  Search,
  Star,
  Crown,
  Shield
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateMilestones, formatMilestoneLabel, findMilestoneAchievedDate } from '../../lib/milestones'
import OgiveGrowthChart from '../../components/OgiveGrowthChart'
import ComparativePulseTable from '../../components/ComparativePulseTable'
import MilestoneTrophyBadge, { getMilestoneTier, SilverTrophySvg, GoldTrophySvg, BronzeTrophySvg, DiamondTrophySvg, CenturionTrophySvg } from '../../components/MilestoneTrophyBadge'

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

const formatDateLabel = (dateStr) => {
  if (!dateStr) return 'Recent'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  } catch {
    return 'Recent'
  }
}

const getFollowerStats = (history = [], currentCount = 0, createdAt = null) => {
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
  let isSynchronizedOnly = false

  if (sorted.length > 0) {
    const latestRaw = sorted[sorted.length - 1]
    if (latestRaw.status === 'Server Failed' || latestRaw.serverFailed || latestRaw.count === null) {
      isLatestFailed = true
    }
  }

  // Check if this account only has 1 scrape (first scrape value should be Synchronized, not fake delta)
  const createdDateStr = createdAt ? createdAt.split('T')[0] : null
  if (valid.length >= 2) {
    const latest = valid[valid.length - 1]
    const prev = valid[valid.length - 2]
    const isPrevBeforeCreation = createdDateStr && prev.date < createdDateStr
    const isPrevInitial = prev.is_initial || prev.scraped === false
    const isLatestFirstScrape = latest.is_first_scrape

    if (isPrevBeforeCreation || isPrevInitial || isLatestFirstScrape) {
      isSynchronizedOnly = true
      dailyGain = 0
    } else {
      dailyGain = latest.count - prev.count
      const d1 = new Date(latest.date)
      const d2 = new Date(prev.date)
      dailyGainDays = Math.max(1, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)))
    }
  } else if (valid.length === 1) {
    isSynchronizedOnly = true
    dailyGain = 0
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

  return { historyMap, monthlyGain, dailyGain, dailyGainDays, recentVelocity, sorted, valid, isLatestFailed, isSynchronizedOnly }
}

export default function ProfilePage({ profile, slug, rank = null, trendingProfiles = [], celebrityData = null, isEnriched = true, initialRivalProfile = null, initialRivalRank = null, initialRivalCelebrity = null }) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('last30')
  const [openFaq, setOpenFaq] = useState(0)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [rivalProfile, setRivalProfile] = useState(initialRivalProfile)
  const [rivalRank, setRivalRank] = useState(initialRivalRank)
  const [rivalCelebrityData, setRivalCelebrityData] = useState(initialRivalCelebrity)

  useEffect(() => {
    setRivalProfile(initialRivalProfile)
    setRivalRank(initialRivalRank)
    setRivalCelebrityData(initialRivalCelebrity)
  }, [initialRivalProfile, initialRivalRank, initialRivalCelebrity])

  useEffect(() => {
    if (!router.query.compare) {
      setRivalProfile(null)
      setRivalRank(null)
      setRivalCelebrityData(null)
    }
  }, [router.query.compare])

  if (router.isFallback) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
        <div className="spinner" />
      </div>
    )
  }

  const { historyMap, monthlyGain, dailyGain, dailyGainDays, recentVelocity, sorted, valid, isLatestFailed, isSynchronizedOnly } = getFollowerStats(profile.follower_history || [], profile.followers_count || 0, profile.created_at)
  const last12 = getLast12Months()

  const historyEntries = profile.follower_history || []
  const counts = historyEntries.map(e => e.count || 0)
  const currentCount = profile.followers_count || 0
  const peakFollowers = counts.length > 0 ? Math.max(...counts, currentCount) : currentCount
  const lostFollowers = peakFollowers - currentCount
  const isLosing = lostFollowers > 100

  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false)
  const achievedMilestones = useMemo(() => generateMilestones(currentCount), [currentCount])
  const reversedMilestones = useMemo(() => [...achievedMilestones].reverse(), [achievedMilestones])

  // Velocity and pacing calculations
  const dailyVelocity = recentVelocity !== 0 ? recentVelocity : dailyGain !== 0 ? dailyGain : Math.round((monthlyGain || 0) / 30)
  const hourlyVelocity = dailyVelocity / 24

  // Calculate daily deltas for unique data-driven narrative
  const dailyDeltas = useMemo(() => {
    const deltas = []
    for (let i = 1; i < valid.length; i++) {
      if (valid[i].count && valid[i - 1].count) {
        deltas.push({ date: valid[i].date, delta: valid[i].count - valid[i - 1].count })
      }
    }
    return deltas
  }, [valid])

  const bestDay = useMemo(() => {
    if (dailyDeltas.length === 0) return null
    return dailyDeltas.reduce((max, cur) => cur.delta > max.delta ? cur : max, dailyDeltas[0])
  }, [dailyDeltas])

  const worstDay = useMemo(() => {
    if (dailyDeltas.length === 0) return null
    return dailyDeltas.reduce((min, cur) => cur.delta < min.delta ? cur : min, dailyDeltas[0])
  }, [dailyDeltas])

  // Growth Grade
  const growthGrade = useMemo(() => {
    if (dailyVelocity >= 15000) return { label: 'Viral Rocket Surge', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', icon: Rocket }
    if (dailyVelocity >= 3000) return { label: 'High Momentum Expansion', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: Flame }
    if (dailyVelocity > 0) return { label: 'Steady Positive Growth', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', icon: Zap }
    if (dailyVelocity === 0) return { label: 'Stable Holding Pattern', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', icon: Activity }
    return { label: 'Follower Correction', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', icon: TrendingDown }
  }, [dailyVelocity])

  // Future milestone targets & estimated dates
  const futureMilestones = useMemo(() => {
    const count = profile.followers_count || 0
    if (!count || count <= 0) return []
    const targets = []
    
    if (count < 100000) {
      const next10k = Math.ceil((count + 1) / 10000) * 10000
      targets.push(next10k)
      targets.push(Math.ceil((next10k + 1) / 25000) * 25000)
      targets.push(100000)
    } else if (count < 1000000) {
      const next50k = Math.ceil((count + 1) / 50000) * 50000
      targets.push(next50k)
      const next100k = Math.ceil((next50k + 1) / 100000) * 100000
      if (!targets.includes(next100k)) targets.push(next100k)
      targets.push(1000000)
    } else if (count < 10000000) {
      const next500k = Math.ceil((count + 1) / 500000) * 500000
      targets.push(next500k)
      const next1m = Math.ceil((next500k + 1) / 1000000) * 1000000
      if (!targets.includes(next1m)) targets.push(next1m)
      targets.push(next1m + 1000000)
    } else if (count < 50000000) {
      const next1m = Math.ceil((count + 1) / 1000000) * 1000000
      targets.push(next1m)
      const next5m = Math.ceil((next1m + 1) / 5000000) * 5000000
      if (!targets.includes(next5m)) targets.push(next5m)
      targets.push(next5m + 5000000)
    } else {
      const next5m = Math.ceil((count + 1) / 5000000) * 5000000
      targets.push(next5m)
      targets.push(next5m + 5000000)
      targets.push(next5m + 10000000)
    }

    const uniqueTargets = [...new Set(targets)].filter(t => t > count).slice(0, 3)

    return uniqueTargets.map(target => {
      const needed = target - count
      let estimatedDays = null
      let estimatedDateStr = null

      if (dailyVelocity && dailyVelocity > 0) {
        estimatedDays = Math.ceil(needed / dailyVelocity)
        const d = new Date()
        d.setDate(d.getDate() + estimatedDays)
        estimatedDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }

      const prevBase = target >= 1000000 ? target - 1000000 : target >= 100000 ? target - 100000 : target - 10000
      const progress = Math.max(5, Math.min(98, Math.round(((count - prevBase) / (target - prevBase)) * 100)))

      return {
        target,
        needed,
        progress,
        estimatedDays,
        estimatedDateStr
      }
    })
  }, [profile.followers_count, dailyVelocity])

  // Comprehensive FAQ list
  const faqs = useMemo(() => [
    {
      q: `How many followers does ${profile.name} have on Instagram?`,
      a: `As of the latest verified record, ${profile.name} (@${profile.instagram_handle || ''}) has approximately ${formatNumber(profile.followers_count)} (${Number(profile.followers_count || 0).toLocaleString()}) followers on Instagram. Spialr benchmarks profile standings using publicly available records updated on a rolling cycle.`
    },
    {
      q: `What is ${profile.name}'s official Instagram handle?`,
      a: `The official Instagram handle for ${profile.name} is @${profile.instagram_handle || 'N/A'}. You can verify their profile directly on Instagram at https://www.instagram.com/${profile.instagram_handle || ''}/.`
    },
    {
      q: `How fast is ${profile.name}'s following growing each day?`,
      a: `${profile.name} is pacing at an estimated ${dailyVelocity >= 0 ? '+' : ''}${formatNumber(dailyVelocity)} followers per day based on recent historical tracking, with a net 30-day movement of ${monthlyGain >= 0 ? '+' : ''}${formatNumber(monthlyGain)} followers.`
    },
    {
      q: `When will ${profile.name} reach their next major follower milestone?`,
      a: futureMilestones.length > 0 && futureMilestones[0].estimatedDateStr
        ? `Estimate based on the last 30 days' average: ${profile.name} is projected to reach ${formatNumber(futureMilestones[0].target)} followers in approximately ${futureMilestones[0].estimatedDays} days (around ${futureMilestones[0].estimatedDateStr}).`
        : `${profile.name} requires ${futureMilestones[0] ? formatNumber(futureMilestones[0].needed) : 'more'} followers to reach their next milestone. Projections update with trailing performance averages.`
    },
    {
      q: `How often is this follower count updated on Spialr?`,
      a: `Spialr records follower standings on a rolling schedule from publicly accessible profile data. Live increments between snapshots reflect estimated pacing based on 30-day trailing averages.`
    },
    ...(rank ? [{
      q: `What is ${profile.name}'s ranking among top creators?`,
      a: `${profile.name} is currently ranked #${rank} among the accounts indexed on the Spialr live leaderboard.`
    }] : [])
  ], [profile.name, profile.instagram_handle, profile.followers_count, dailyVelocity, monthlyGain, futureMilestones, rank])

  // Major milestone trophies & progress
  const milestoneTrophies = useMemo(() => {
    const count = profile.followers_count || 0
    const list = [
      { target: 1000, label: '1K', title: 'Bronze Starter', renderSvg: (s) => <BronzeTrophySvg size={s} /> },
      { target: 10000, label: '10K', title: 'Community Spark', renderSvg: (s) => <Star size={s} color="#6366f1" /> },
      { target: 50000, label: '50K', title: 'Rising Vanguard', renderSvg: (s) => <Star size={s} color="#8b5cf6" /> },
      { target: 100000, label: '100K', title: 'Silver Creator', renderSvg: (s) => <SilverTrophySvg size={s} /> },
      { target: 500000, label: '500K', title: 'Half-Million Titan', renderSvg: (s) => <SilverTrophySvg size={s} /> },
      { target: 1000000, label: '1M', title: 'Gold Millionaire', renderSvg: (s) => <GoldTrophySvg size={s} /> },
      { target: 5000000, label: '5M', title: '5M Supernova', renderSvg: (s) => <GoldTrophySvg size={s} /> },
      { target: 10000000, label: '10M', title: 'Diamond Icon', renderSvg: (s) => <DiamondTrophySvg size={s} /> },
      { target: 50000000, label: '50M', title: '50M Mega Star', renderSvg: (s) => <Crown size={s} color="#ec4899" /> },
      { target: 100000000, label: '100M', title: 'Centurion Legend', renderSvg: (s) => <CenturionTrophySvg size={s} /> }
    ]

    return list.map(t => {
      const isAchieved = count >= t.target
      const progress = isAchieved ? 100 : Math.max(0, Math.min(99, Math.round((count / t.target) * 100)))
      return { ...t, isAchieved, progress }
    })
  }, [profile.followers_count])

  const [liveFollowers, setLiveFollowers] = useState(profile?.followers_count || 0)
  const [changeDir, setChangeDir] = useState(null)
  const [isCountingUp, setIsCountingUp] = useState(true)

  // Current active milestone tier (Bronze, Silver, Gold, Diamond, Centurion)
  const currentTier = useMemo(() => {
    return getMilestoneTier(liveFollowers || profile.followers_count || 0)
  }, [liveFollowers, profile.followers_count])

  // Live follower count from laptop fetch
  const [liveFetchedCount, setLiveFetchedCount] = useState(null) // null = not yet received
  const [isLiveFetched, setIsLiveFetched] = useState(false)      // true = laptop returned fresh data
  const [liveFetchPending, setLiveeFetchPending] = useState(true) // still waiting for laptop

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

  // 1. Initial Odometer Count-Up Animation (Original smooth 3.8s count-up from 0 to stored count)
  useEffect(() => {
    if (!timeAdjustedBase) return

    setLiveFollowers(0)
    setIsCountingUp(true)

    const duration = 3800 // Previous smooth 3.8s count-up
    const start = 0
    const end = timeAdjustedBase
    const startTime = performance.now()
    let animationFrame

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
        setLiveFollowers(end)
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

    const doTick = () => {
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
    }

    // Trigger an immediate subtle live tick shortly after rotation stops so it feels dynamic right away
    const initialTickTimeout = setTimeout(() => {
      doTick()
    }, 900)

    const interval = setInterval(doTick, intervalMs)

    return () => {
      clearTimeout(initialTickTimeout)
      clearInterval(interval)
    }
  }, [isCountingUp, timeAdjustedBase, dailyGain])

  // 3. Live follower fetch: polls /api/live-count → laptop fetches Instagram
  //    Polls every 2.5s while user is on page. When fresh data arrives, smoothly updates to real count.
  useEffect(() => {
    const handle = profile.instagram_handle
    if (!handle) return

    let attempts = 0
    const MAX_ATTEMPTS = 14 // 14 * 2.5s = 35s max polling
    let stopped = false

    async function checkLiveCount() {
      if (stopped) return
      try {
        const res = await fetch(`/api/live-count?handle=${encodeURIComponent(handle)}`)
        if (!res.ok) return
        const data = await res.json()
        const receivedCount = data.count || data.live_count

        if (data.fresh && receivedCount && receivedCount > 0) {
          setLiveFetchedCount(receivedCount)
          setIsLiveFetched(true)
          setLiveeFetchPending(false)
          stopped = true

          // Smoothly glide from current count to newly retrieved live count
          setLiveFollowers((prev) => {
            const current = prev || timeAdjustedBase
            const diff = receivedCount - current
            if (diff === 0) return receivedCount

            setChangeDir(diff > 0 ? 'up' : 'down')
            setTimeout(() => setChangeDir(null), 1200)

            const startTime = performance.now()
            const duration = 700
            const animateUpdate = (now) => {
              if (stopped) return
              const elapsed = now - startTime
              const prog = Math.min(elapsed / duration, 1)
              const ease = 1 - Math.pow(1 - prog, 3)
              setLiveFollowers(Math.floor(current + diff * ease))
              if (prog < 1) requestAnimationFrame(animateUpdate)
              else setLiveFollowers(receivedCount)
            }
            requestAnimationFrame(animateUpdate)
            return prev
          })
          return
        }
      } catch {}

      attempts++
      if (attempts >= MAX_ATTEMPTS) {
        setLiveeFetchPending(false)
      }
    }

    // Check immediately, then poll every 2.5s
    checkLiveCount()
    const interval = setInterval(() => {
      if (stopped || attempts >= MAX_ATTEMPTS) {
        clearInterval(interval)
        return
      }
      checkLiveCount()
    }, 2500)

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [profile.instagram_handle])

  return (
    <>
      <Head>
        <title>{`${profile.name} Instagram — Followers, Handle (@${profile.instagram_handle || profile.name}), Live Count & Growth | Spialr`}</title>
        <meta
          name="description"
          content={`Check ${profile.name}'s Instagram account (@${profile.instagram_handle || ''}): real-time follower count (${formatNumber(profile.followers_count)})${rank ? ` - Ranked #${rank} Most Followed` : ''}, daily follower gains, and 31-day progressive growth on Spialr.`}
        />
        <link rel="canonical" href={`https://spialr.com/profile/${slug || profile.instagram_handle || ''}`} key="canonical" />
        {isEnriched ? (
          <meta name="robots" content="index, follow, max-image-preview:large" />
        ) : (
          <meta name="robots" content="noindex, follow" />
        )}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${profile.name} (@${profile.instagram_handle || ''}) Instagram Followers Live & Stats | Spialr`} />
        <meta property="og:description" content={`Real-time Instagram follower count (${formatNumber(profile.followers_count)})${rank ? ` - Ranked #${rank}` : ''}, live daily gains, and 31-day growth history for ${profile.name} on Spialr.`} />
        <meta property="og:image" content={profile.photo_url || 'https://spialr.com/og-image.jpg'} />
        <meta property="og:url" content={`https://spialr.com/profile/${slug || profile.instagram_handle || ''}`} />
        <meta property="og:site_name" content="Spialr" />
        {profile.instagram_handle && <meta property="profile:username" content={profile.instagram_handle} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${profile.name} (@${profile.instagram_handle || ''}) Instagram Followers Live | Spialr`} />
        <meta name="twitter:description" content={`Live real-time follower count and 31-day growth momentum for ${profile.name}${rank ? ` (Rank #${rank})` : ''} on Spialr.`} />
        <meta name="twitter:image" content={profile.photo_url || 'https://spialr.com/og-image.jpg'} />

        {/* Structured Data: ProfilePage & Person Schema (Google Social Knowledge Graph & Search Snippet) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfilePage",
              "dateCreated": profile.created_at || "2026-08-28T00:00:00Z",
              "url": `https://spialr.com/profile/${slug || profile.instagram_handle || ''}`,
              "name": `${profile.name} Instagram Follower Analytics`,
              "mainEntity": {
                "@type": "Person",
                "name": profile.name,
                "alternateName": [
                  profile.instagram_handle ? `@${profile.instagram_handle}` : null,
                  profile.instagram_handle,
                  profile.name
                ].filter(Boolean),
                "identifier": profile.instagram_handle || slug,
                "url": `https://spialr.com/profile/${slug || profile.instagram_handle || ''}`,
                "image": profile.photo_url || '',
                "sameAs": profile.instagram_handle ? [
                  `https://www.instagram.com/${profile.instagram_handle}/`,
                  `https://instagram.com/${profile.instagram_handle}`
                ] : [],
                "jobTitle": profile.category || "Instagram Content Creator",
                "description": `${profile.name} (@${profile.instagram_handle || ''}) is an Instagram creator with ${formatNumber(profile.followers_count)} followers${rank ? `, ranked #${rank} on Spialr` : ''}.`,
                "interactionStatistic": [
                  {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/FollowAction",
                    "userInteractionCount": profile.followers_count || 0
                  }
                ]
              }
            })
          }}
        />

        {/* Structured Data: FAQPage Schema (Targets Google Search Rich Q&A Snippets & AdSense Quality) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": f.a
                }
              }))
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
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .profile-page-wrapper {
          min-height: 100vh;
          background: var(--background);
          color: var(--text);
          padding: 24px 16px;
        }

                .profile-main-container {
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }

        .profile-content-col {
          min-width: 0;
          width: 100%;
        }

        .profile-sidebar-col {
          display: none;
        }

        @media (min-width: 1024px) {
          .profile-page-wrapper {
            padding: 28px 24px 80px !important;
          }
          .profile-main-container {
            max-width: 1160px !important;
            display: grid !important;
            grid-template-columns: 1fr 340px !important;
            gap: 28px !important;
            align-items: start !important;
          }
          .profile-sidebar-col {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
            position: sticky !important;
            top: 84px !important;
          }
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
              {tooltip.isSynchronized ? (
                <div style={{ color: '#38bdf8', fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} color="#38bdf8" />
                  <span>Status: Synchronized</span>
                </div>
              ) : tooltip.hasIncrement ? (
                <div style={{ color: tooltip.increment > 0 ? '#34d399' : tooltip.increment < 0 ? '#fb7185' : '#64748b' }}>
                  Growth: <span style={{ fontWeight: 700 }}>{tooltip.increment > 0 ? `+${tooltip.increment.toLocaleString()}` : tooltip.increment.toLocaleString()}</span>
                  {tooltip.diffDays > 1 && (
                    <span style={{ fontSize: 9.5, color: '#fbbf24', marginLeft: 5, fontWeight: 700 }}>
                      ({tooltip.diffDays} days accumulated)
                    </span>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      <div className="profile-page-wrapper">
        <div className="profile-main-container">
          <div className="profile-content-col">

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
              {/* Avatar with Floating Milestone Trophy Pin */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <img src={profile.photo_url || '/placeholder-avatar.png'} alt={profile.name}
                  className="profile-avatar"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${currentTier.borderColor}`,
                    boxShadow: `0 0 24px ${currentTier.glowColor}`
                  }}
                />

                {/* Floating Trophy Badge beside profile pic (Top-Right) */}
                <MilestoneTrophyBadge
                  followersCount={liveFollowers || profile.followers_count || 0}
                  mode="avatar-pin"
                  onClick={() => setIsMilestonesModalOpen(true)}
                />
              </div>
              <h1 className="profile-title" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.25 }}>{profile.name}</h1>
              {profile.instagram_handle && (
                <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#a855f7', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: rank ? 8 : 14 }}>
                  <InstagramIcon size={13} />@{profile.instagram_handle}
                </a>
              )}

              {/* Dynamic Live Rank Badge */}
              {rank && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(90deg, rgba(240,148,51,0.12), rgba(220,39,67,0.12))',
                  border: '1px solid rgba(220,39,67,0.25)',
                  borderRadius: 100,
                  padding: '4px 14px',
                  marginBottom: 14,
                  boxShadow: '0 2px 8px rgba(225,48,108,0.06)'
                }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2743', letterSpacing: '0.01em' }}>
                    Rank #{rank} Most Followed Account
                  </span>
                </div>
              )}

              {/* Creator Milestone Trophy Badge Pill */}
              <div style={{ marginBottom: 14 }}>
                <MilestoneTrophyBadge
                  followersCount={liveFollowers || profile.followers_count || 0}
                  mode="hero-pill"
                  onClick={() => setIsMilestonesModalOpen(true)}
                />
              </div>
              <div className="profile-tags-container" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
                {profile.category && (() => {
                  const firstCat = profile.category.split(',')[0].trim();
                  const tagText = firstCat.includes(':') ? firstCat.split(':')[1].trim() : firstCat;
                  return (
                    <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                      {tagText}
                    </span>
                  );
                })()}
                {profile.language && (
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                    {profile.language}
                  </span>
                )}
              </div>

              {/* Responsive Stats Grid */}
              <div className="profile-stats-grid">
                <div className="profile-stat-box profile-stat-box-featured" style={{ background: isLiveFetched ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.07)', border: `1px solid ${isLiveFetched ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.2)'}`, transition: 'background 0.5s ease, border-color 0.5s ease' }}>
                  <div style={{ 
                    fontSize: 20, 
                    fontWeight: 850, 
                    color: isLiveFetched ? '#34d399' : changeDir === 'up' ? '#10b981' : changeDir === 'down' ? '#ef4444' : '#818cf8', 
                    fontFamily: 'var(--font-display)', 
                    marginBottom: 4,
                    transition: 'color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}>
                    <span>{(liveFollowers || profile.followers_count || 0).toLocaleString()}</span>
                    {changeDir && !isLiveFetched && (
                      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.9 }}>
                        {changeDir === 'up' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    {isLiveFetched ? (
                      <>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                        <span style={{ fontSize: 9.5, color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Followers</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated Followers</span>
                    )}
                  </div>
                </div>

                {/* Dynamic Relatable Daily Change Card */}
                {(() => {
                  let badgeLabel = 'Daily Gain'
                  if (isLatestFailed) {
                    badgeLabel = 'Server Failed'
                  } else if (isSynchronizedOnly) {
                    badgeLabel = 'Initial Setup'
                  } else if (dailyGain > 0) {
                    badgeLabel = 'Gained Today'
                  } else if (dailyGain < 0) {
                    badgeLabel = 'Lost Today'
                  } else {
                    badgeLabel = 'Stable Today'
                  }

                  if (!isLatestFailed && !isSynchronizedOnly && dailyGainDays > 1) {
                    badgeLabel = `${badgeLabel} (${dailyGainDays} day follower count)`
                  }

                  return (
                    <div className="profile-stat-box" style={{ 
                      background: isLatestFailed ? 'rgba(239, 68, 68, 0.1)' : isSynchronizedOnly ? 'rgba(56, 189, 248, 0.08)' : dailyGain > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(6,182,212,0.06) 100%)' : dailyGain < 0 ? 'linear-gradient(135deg, rgba(244,63,94,0.14) 0%, rgba(225,29,72,0.06) 100%)' : 'var(--surface2)', 
                      border: `1px solid ${isLatestFailed ? 'rgba(239, 68, 68, 0.4)' : isSynchronizedOnly ? 'rgba(56, 189, 248, 0.35)' : dailyGain > 0 ? 'rgba(52,211,153,0.4)' : dailyGain < 0 ? 'rgba(251,113,133,0.4)' : 'var(--border)'}`,
                      boxShadow: isLatestFailed ? 'none' : isSynchronizedOnly ? 'none' : dailyGain !== 0 ? `0 4px 14px -2px ${dailyGain > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` : 'none'
                    }}>
                      <div style={{ 
                        fontSize: isLatestFailed ? 15 : isSynchronizedOnly ? 15 : 19, 
                        fontWeight: 800, 
                        color: isLatestFailed ? '#f87171' : isSynchronizedOnly ? '#38bdf8' : dailyGain > 0 ? '#34d399' : dailyGain < 0 ? '#fb7185' : 'var(--text-muted)', 
                        fontFamily: 'var(--font-display)', 
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        textShadow: !isLatestFailed && !isSynchronizedOnly && dailyGain !== 0 ? `0 0 10px ${dailyGain > 0 ? '#34d399' : '#fb7185'}44` : 'none'
                      }}>
                        {isLatestFailed ? (
                          <>
                            <AlertTriangle size={15} color="#f87171" />
                            <span>Server Failed</span>
                          </>
                        ) : isSynchronizedOnly ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle2 size={15} color="#38bdf8" />
                            <span>Synchronized</span>
                          </div>
                        ) : (
                          <span>{dailyGain > 0 ? `+${formatNumber(dailyGain)}` : dailyGain < 0 ? `-${formatNumber(Math.abs(dailyGain))}` : '±0'}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 9.5, color: isLatestFailed ? '#fca5a5' : isSynchronizedOnly ? '#7dd3fc' : dailyGain > 0 ? '#6ee7b7' : dailyGain < 0 ? '#fda4af' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.3 }}>
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

              {/* Verified Last Updated Notice */}
              <div style={{
                marginTop: 10,
                textAlign: 'center',
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <Clock size={12} style={{ color: 'var(--accent)' }} />
                <span>
                  Last verified: <strong>{formatDateLabel(profile.last_scraped_at || profile.updated_at || (valid.length > 0 ? valid[valid.length - 1].date : null))}</strong> • Snapshot benchmark
                </span>
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

          {/* 🏆 Milestones Block (Below Active Unfollow Trend / Peak Momentum) */}
          {reversedMilestones.length > 0 && (
            <div className="card info-drama-card" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              padding: '12px 14px',
              marginBottom: 18,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: 13.5,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                flexShrink: 0
              }}>
                <Trophy size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span>Milestones:</span>
              </div>

              {/* Front Screen Chips: Top 3 recent (e.g. 150k, 100k, 75k) + [All] */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0
              }}>
                {reversedMilestones.slice(0, 3).map((m) => {
                  const label = formatMilestoneLabel(m)
                  const targetSlug = slug || profile.instagram_handle || profile.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  const encodedSlug = encodeURIComponent(targetSlug)
                  return (
                    <Link
                      key={m}
                      href={`/milestone/${encodedSlug}/${label.replace('.', '-')}`}
                      style={{
                        padding: '5px 11px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
                        border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#6366f1',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        boxShadow: '0 2px 5px rgba(99,102,241,0.05)'
                      }}
                    >
                      <span>{label}</span>
                    </Link>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setIsMilestonesModalOpen(true)}
                  style={{
                    padding: '5px 11px',
                    background: 'var(--surface2, #f1f5f9)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <span>All</span>
                  <span style={{ fontSize: 10.5, opacity: 0.7 }}>({reversedMilestones.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* All Milestones Modal */}
          {isMilestonesModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'var(--surface, #ffffff)',
                  border: '1px solid var(--border)',
                  borderRadius: 24,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Active Trophy Showcase Spotlight */}
                <div style={{
                  padding: '16px 20px',
                  background: currentTier.pillBg,
                  borderBottom: `1px solid ${currentTier.pillBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: currentTier.bg,
                    border: `1.5px solid ${currentTier.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 14px ${currentTier.shadow}`,
                    flexShrink: 0
                  }}>
                    {currentTier.iconSvg}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: currentTier.textColor }}>
                        {currentTier.title} ({currentTier.label}+)
                      </span>
                      <span style={{ fontSize: 10, background: 'rgba(255, 255, 255, 0.15)', color: currentTier.textColor, padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                        Current Plaque
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {currentTier.desc}
                    </div>
                  </div>
                </div>

                {/* Modal Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Trophy size={20} color="#f59e0b" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                        All Follower Milestones
                      </h3>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                        {profile.name} · {reversedMilestones.length} achievements reached
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMilestonesModalOpen(false)}
                    style={{
                      background: 'var(--surface2, #f1f5f9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Milestones List */}
                <div style={{
                  padding: '14px 20px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  {reversedMilestones.map((m) => {
                    const label = formatMilestoneLabel(m)
                    const dateAchieved = findMilestoneAchievedDate(profile.follower_history || [], m)
                    const targetSlug = slug || profile.instagram_handle || profile.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    const encodedSlug = encodeURIComponent(targetSlug)

                    return (
                      <Link
                        key={m}
                        href={`/milestone/${encodedSlug}/${label.replace('.', '-')}`}
                        onClick={() => setIsMilestonesModalOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: 14,
                          background: 'var(--surface2, #f8fafc)',
                          border: '1px solid var(--border)',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.15))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                          }}>
                            🏆
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                              {label} Followers
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                              {dateAchieved ? `Achieved on ${dateAchieved}` : 'Official Milestone'}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          padding: '6px 14px',
                          borderRadius: 100,
                          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span>Celebrate</span>
                          <span>→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ⚡ Daily Growth Pulse — Comparative Table in Compare Mode, or Solo Pulse */}
          {rivalProfile ? (
            <ComparativePulseTable
              profile={profile}
              rival={rivalProfile}
              profileRank={rank}
              rivalRank={rivalRank}
              onChangeRival={() => router.push(`/all?compare=${slug || profile.instagram_handle || ''}`)}
              onExitComparison={() => {
                const { compare, ...restQuery } = router.query
                router.push({ pathname: `/profile/${slug}`, query: restQuery }, undefined, { shallow: true })
                setRivalProfile(null)
              }}
            />
          ) : (
            (() => {
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
              // Interpolate any gaps between valid scrape dates with daily average values
              const validPoints = sourceList.filter(h => h && h.date && h.count && h.status !== 'Server Failed' && !h.serverFailed);
              validPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
              if (validPoints.length >= 2) {
                for (let i = 0; i < validPoints.length - 1; i++) {
                  const pPrev = validPoints[i];
                  const pNext = validPoints[i + 1];
                  const dP = new Date(pPrev.date + 'T00:00:00Z');
                  const dN = new Date(pNext.date + 'T00:00:00Z');
                  const diffDays = Math.round((dN - dP) / (1000 * 60 * 60 * 24));
                  if (diffDays > 1) {
                    const delta = pNext.count - pPrev.count;
                    const seed = (profile.instagram_handle || profile.name || 'default');
                    let hash = 0;
                    for (let c = 0; c < seed.length; c++) {
                      hash = ((hash << 5) - hash) + seed.charCodeAt(c);
                      hash |= 0;
                    }
                    const rawWeights = [];
                    for (let w = 0; w < diffDays; w++) {
                      const x = Math.sin(hash + (w + 1) * 1337) * 10000;
                      const rnd = x - Math.floor(x);
                      rawWeights.push(0.65 + rnd * 0.70);
                    }
                    const sumRaw = rawWeights.reduce((a, b) => a + b, 0);
                    const normWeights = rawWeights.map(w => w / sumRaw);

                    let runningCount = pPrev.count;
                    for (let step = 1; step < diffDays; step++) {
                      const intDate = new Date(dP.getTime() + step * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      runningCount += Math.round(delta * normWeights[step - 1]);
                      entriesByDate[intDate] = { date: intDate, count: runningCount };
                    }
                  }
                }
              }

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
                  let isSynchronized = isFirst

                  const createdDateStr = profile.created_at ? profile.created_at.split('T')[0] : null
                  const isPrevSynthetic = Boolean(createdDateStr && lastValidDate && lastValidDate < createdDateStr)
                  const isEntryFirstScrape = Boolean(entry.is_first_scrape || entry.is_initial)

                  if (!isFirst && lastValidDate) {
                    const dCur = new Date(dateStr)
                    const dPrev = new Date(lastValidDate)
                    diffDays = Math.max(1, Math.round(Math.abs(dCur - dPrev) / (1000 * 60 * 60 * 24)))
                    if (isPrevSynthetic || isEntryFirstScrape) {
                      isSynchronized = true
                      inc = 0
                    } else {
                      inc = entry.count - lastValidCount
                    }
                  }

                  lastValidCount = entry.count
                  lastValidDate = dateStr

                  dailyHistoryItems.push({
                    date: dateStr,
                    count: entry.count,
                    increment: inc,
                    isFirst,
                    isSynchronized,
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

            const nonFirstGains = filteredDailyGains.filter(d => !d.isFirst && !d.isSynchronized && !d.isFailed)
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
                        padding: '14px 12px 14px 0',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                      }}>
                        <div style={{ minWidth: 620, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 6 }}>
                          {[...filteredDailyGains].reverse().map((day, idx) => {
                            const isSync = day.isFirst || day.isSynchronized
                            const barPct = isSync || day.increment === 0
                              ? 0
                              : Math.min(100, Math.max(6, (Math.abs(day.increment) / maxAbs) * 100))
                            const isGain = !isSync && day.increment > 0
                            const isLoss = !isSync && day.increment < 0
                            const dateObj = new Date(day.date)
                            const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                            const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            const isToday = day.date === new Date().toISOString().split('T')[0]
                            const valueLabel = isSync ? 'Synchronized' : (isGain ? `+${formatNumber(day.increment)}` : isLoss ? `-${formatNumber(Math.abs(day.increment))}` : '±0')

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
                                    hasIncrement: !isSync && !day.isFailed,
                                    isSynchronized: isSync,
                                    diffDays: day.diffDays,
                                    failureDaysCount: day.failureDaysCount,
                                    isFailed: day.isFailed
                                  })
                                }}
                                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setTooltip(null) }}
                              >
                                {/* Date — sticky left column so it stays visible during horizontal scroll */}
                                <div style={{
                                  width: 90,
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 10,
                                  background: 'rgba(10, 14, 26, 0.96)',
                                  backdropFilter: 'blur(8px)',
                                  paddingLeft: 12,
                                  paddingRight: 8,
                                  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                                  boxShadow: '4px 0 10px -2px rgba(0, 0, 0, 0.6)'
                                }}>
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
          })()
        )}

          {/* ─── Rectangular Outlined Head-to-Head Comparison Box (Clean & Professional) ─── */}
          <div
            className="card"
            style={{
              marginTop: 28,
              marginBottom: 32,
              padding: '24px 22px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <ArrowLeftRight size={17} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Comparative Benchmarking
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 750, color: 'var(--text)', margin: '2px 0 0', fontFamily: 'var(--font-display)' }}>
                    {rivalProfile ? `Comparing ${profile.name} vs ${rivalProfile.name}` : `Compare ${profile.name} with Rival Creator`}
                  </h3>
                </div>
              </div>

              {rivalProfile && (
                <button
                  onClick={() => {
                    const { compare, ...restQuery } = router.query
                    router.push({ pathname: `/profile/${slug}`, query: restQuery }, undefined, { shallow: true })
                    setRivalProfile(null)
                  }}
                  style={{
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fb7185',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 650,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <X size={13} />
                  <span>Exit Comparison</span>
                </button>
              )}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, margin: '0 0 18px' }}>
              {rivalProfile
                ? `Currently analyzing verified daily growth rates, live follower gaps, and engagement performance side-by-side between ${profile.name} and ${rivalProfile.name}. Click below to select or switch to another competitor.`
                : `Benchmark verified daily follower growth, live audience lead, and pacing velocities between ${profile.name} and any popular creator or celebrity on Instagram.`}
            </p>

            <button
              onClick={() => router.push(`/all?compare=${slug || profile.instagram_handle || ''}`)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 10,
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text)'
              }}
            >
              <ArrowLeftRight size={15} />
              <span>{rivalProfile ? `Switch Rival Creator (vs ${rivalProfile.name})` : `Select Rival Creator to Compare with ${profile.name}`}</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 0: Unique Multi-Tier Zoomable Ogive Growth Curve & Forecast
              (All-Time, 30-Day, 7-Day & 3-Day Smooth Zoom with Momentum Pulse & Horizons)
          ───────────────────────────────────────────────────────────── */}
          <OgiveGrowthChart
            followerHistory={profile?.follower_history || []}
            currentFollowers={profile?.followers_count || currentCount || 0}
            dailyVelocity={dailyVelocity || 0}
            formatNumber={formatNumber}
          />

          {/* ─────────────────────────────────────────────────────────────
              SECTION 1: Performance & Growth Velocity Scorecard
              (Scroll Moment 2: High-Value Analytics for Users & AdSense)
          ───────────────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: '24px 22px', marginTop: 24, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={19} color="#a855f7" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>Growth Velocity & Analytics Scorecard</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Real-time pace tracking and historical momentum</p>
                </div>
              </div>
              {/* Growth Grade Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: growthGrade.bg, border: `1px solid ${growthGrade.border}`, padding: '6px 14px', borderRadius: 100 }}>
                <growthGrade.icon size={14} color={growthGrade.color} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: growthGrade.color }}>{growthGrade.label}</span>
              </div>
            </div>

            {/* 4-Stat Metric Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {/* Box 1: 30-Day Growth */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>30-Day Net Growth</div>
                <div style={{ fontSize: 19, fontWeight: 850, fontFamily: 'var(--font-display)', color: monthlyGain > 0 ? '#34d399' : monthlyGain < 0 ? '#fb7185' : 'var(--text)' }}>
                  {monthlyGain > 0 ? `+${formatNumber(monthlyGain)}` : formatNumber(monthlyGain)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  {monthlyGain !== 0 && currentCount > 0 ? `${((monthlyGain / currentCount) * 100).toFixed(2)}% net change` : 'Calculated monthly'}
                </div>
              </div>

              {/* Box 2: Daily Velocity */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Daily Average</div>
                <div style={{ fontSize: 19, fontWeight: 850, fontFamily: 'var(--font-display)', color: dailyVelocity > 0 ? '#38bdf8' : dailyVelocity < 0 ? '#fb7185' : 'var(--text)' }}>
                  {dailyVelocity > 0 ? `+${formatNumber(dailyVelocity)}` : formatNumber(dailyVelocity)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  followers / day pace
                </div>
              </div>

              {/* Box 3: Hourly Velocity */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Hourly Momentum</div>
                <div style={{ fontSize: 19, fontWeight: 850, fontFamily: 'var(--font-display)', color: hourlyVelocity > 0 ? '#a855f7' : hourlyVelocity < 0 ? '#fb7185' : 'var(--text)' }}>
                  {hourlyVelocity > 0 ? `~${Math.round(hourlyVelocity)}` : hourlyVelocity < 0 ? `~${Math.round(hourlyVelocity)}` : '0'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  estimated per hour
                </div>
              </div>

              {/* Box 4: Peak Record */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>All-Time Peak</div>
                <div style={{ fontSize: 19, fontWeight: 850, fontFamily: 'var(--font-display)', color: '#fbbf24' }}>
                  {formatNumber(peakFollowers)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  {isLosing ? `-${formatNumber(lostFollowers)} from peak` : 'Current ATH'}
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2: Milestone Forecasting & Projections Roadmap
              (Scroll Moment 3: Forward-Looking Projections)
          ───────────────────────────────────────────────────────────── */}
          {futureMilestones.length > 0 && (
            <div className="card" style={{ padding: '24px 22px', marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(236,72,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Rocket size={19} color="#ec4899" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Upcoming Milestone Forecasts</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    Projected completion dates based on current velocity ({dailyVelocity >= 0 ? '+' : ''}{formatNumber(dailyVelocity)} / day)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {futureMilestones.map((m, idx) => (
                  <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 850, color: '#f1f5f9', fontFamily: 'var(--font-display)' }}>
                          🎯 {formatNumber(m.target)} Milestone
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                          ({m.needed > 0 ? `${formatNumber(m.needed)} to go` : 'Achieved'})
                        </span>
                      </div>
                      <div>
                        {m.estimatedDateStr ? (
                          <span style={{ fontSize: 12, fontWeight: 750, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={12} color="#38bdf8" />
                            {m.estimatedDateStr} (~{m.estimatedDays} days)
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            {dailyVelocity <= 0 ? 'Pacing requires steady positive daily growth' : 'Calculating...'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 7, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${m.progress}%`, height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, #a855f7, #ec4899)', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2.5: Milestone Trophy Showcase & Achievements
              (Visual gamification & milestone history for AdSense depth)
          ───────────────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: '24px 22px', marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.2))', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={19} color="#fbbf24" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Milestone Trophy Showcase
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    Major historical milestones unlocked and upcoming tier objectives
                  </p>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 750, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 12px', borderRadius: 100 }}>
                {milestoneTrophies.filter(m => m.isAchieved).length} of {milestoneTrophies.length} Tiers Unlocked
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {milestoneTrophies.map((tr, idx) => (
                <div
                  key={idx}
                  style={{
                    background: tr.isAchieved ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)',
                    border: `1px solid ${tr.isAchieved ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: 14,
                    padding: '16px 12px',
                    textAlign: 'center',
                    opacity: tr.isAchieved ? 1 : 0.55,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tr.renderSvg ? tr.renderSvg(24) : <Trophy size={20} />}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: tr.isAchieved ? '#f8fafc' : 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    {tr.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{tr.title}</div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 750,
                    color: tr.isAchieved ? '#10b981' : '#f59e0b',
                    background: tr.isAchieved ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    marginTop: 2
                  }}>
                    {tr.isAchieved ? '✓ Unlocked' : `${tr.progress}% Done`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 3: In-Depth Editorial & Trajectory Report
              (Scroll Moment 4: Deep Crawlable Content for Google & AdSense)
          ───────────────────────────────────────────────────────────── */}
          <section className="card" style={{ padding: '24px 22px', marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={19} color="#34d399" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  {profile.name}&apos;s Audience Trajectory & Growth Report
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Comprehensive audience intelligence analysis</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <p style={{ margin: 0 }}>
                Welcome to the verified Instagram follower analytics summary for <strong>{profile.name}</strong> (<a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7', fontWeight: 600, textDecoration: 'none' }}>@{profile.instagram_handle}</a>).
                {rank ? ` Ranked #${rank} among all public profiles indexed on Spialr, ` : ' '}
                <strong>{profile.name}</strong> maintains a tracked follower base of <strong>{formatNumber(profile.followers_count)}</strong> ({Number(profile.followers_count || 0).toLocaleString()} followers).
                {profile.category ? ` Categorized in the ${profile.category} vertical, ` : ' '}
                this account reflects daily baseline changes captured from periodic public snapshots.
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontWeight: 750, color: 'var(--text)', fontSize: 13.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Activity size={15} color="#818cf8" />
                  30-Day Snapshot Performance
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  Over the monitored window, {profile.name}&apos;s profile recorded a net shift of <strong>{monthlyGain >= 0 ? `+${monthlyGain.toLocaleString()}` : monthlyGain.toLocaleString()} followers</strong> with an average daily pace of <strong>{dailyVelocity >= 0 ? `+${dailyVelocity.toLocaleString()}` : dailyVelocity.toLocaleString()} per day</strong>.
                  {bestDay && bestDay.delta > 0 && ` The peak single-day gain registered was +${bestDay.delta.toLocaleString()} on ${formatDateLabel(bestDay.date)}.`}
                  {worstDay && worstDay.delta < 0 && ` The lowest single-day recording recorded a fluctuation of ${worstDay.delta.toLocaleString()} on ${formatDateLabel(worstDay.date)}.`}
                  {celebrityData?.posts_count && ` Spialr indexes ${celebrityData.posts_count} posts for this creator.`}
                </p>
              </div>

              <p style={{ margin: 0 }}>
                Standings and rankings are derived strictly from publicly observable Instagram follower statistics recorded on a rolling schedule. To learn how Spialr collects and calculates these benchmarks, visit our <Link href="/methodology" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Methodology</Link>.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 4: Frequently Asked Questions (FAQ) (SSR-Rendered Semantic HTML)
              (Scroll Moment 5: Semantic Q&A for Complete Crawler Indexing)
          ───────────────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: '24px 22px', marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={19} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  Frequently Asked Questions About {profile.name}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Key answers regarding live stats, update frequencies, and milestone pacing
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  open={idx === 0}
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'border-color 0.25s ease'
                  }}
                >
                  <summary
                    style={{
                      padding: '16px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      fontWeight: 750,
                      color: 'var(--text)',
                      lineHeight: 1.4,
                      listStyle: 'none'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: 'var(--accent)', fontSize: 16, flexShrink: 0, marginLeft: 10 }}>▾</span>
                  </summary>
                  <div style={{ padding: '0 18px 16px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.65, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 5: Explore Other Popular Real-Time Trackers
              (Scroll Moment 6: Internal Discovery & Increased Dwell Time)
          ───────────────────────────────────────────────────────────── */}
          {trendingProfiles && trendingProfiles.length > 0 && (
            <div className="card" style={{ padding: '24px 22px', marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={19} color="#c084fc" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                      Trending Live Trackers on Spialr
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                      Explore real-time live counters for other verified creators
                    </p>
                  </div>
                </div>
                <Link
                  href="/live"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#a855f7',
                    textDecoration: 'none',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    padding: '6px 14px',
                    borderRadius: 100,
                    transition: 'all 0.2s ease'
                  }}
                >
                  View All Live Standings
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Grid of Trending Profiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {trendingProfiles.map((tp) => {
                  const profileSlug = tp.instagram_handle
                    ? tp.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
                    : tp.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')

                  return (
                    <Link
                      key={tp.id}
                      href={`/profile/${profileSlug}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'var(--surface2)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: 14,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                        <img
                          src={tp.photo_url || '/placeholder-avatar.png'}
                          alt={tp.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(168, 85, 247, 0.5)'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '2px solid #0f172a'
                          }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tp.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={11} color="var(--text-muted)" />
                          <span>{formatNumber(tp.followers_count)} followers</span>
                        </div>
                      </div>
                      <ArrowUpRight size={14} color="#64748b" style={{ flexShrink: 0 }} />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          </div>

          <aside className="profile-sidebar-col">
            {/* 1. Quick Creator Search */}
            <div className="card" style={{ padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={15} color="var(--accent)" /> Quick Creator Search
              </div>
              <form onSubmit={(e) => {
                e.preventDefault()
                if (sidebarSearch.trim()) router.push(`/results?q=${encodeURIComponent(sidebarSearch.trim())}`)
              }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Search name or @handle..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      fontSize: 13,
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  />
                </div>
              </form>
            </div>

            {/* 2. Creator Intelligence Dossier */}
            <div className="card" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="#ec4899" /> Velocity Intelligence
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Standing Rank</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: rank ? 'var(--accent)' : 'var(--text)' }}>
                    {rank ? `#${rank} on Leaderboard` : 'Indexed Profile'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Daily Velocity</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: dailyVelocity >= 0 ? '#10b981' : '#f43f5e' }}>
                    {dailyVelocity >= 0 ? `+${formatNumber(dailyVelocity)}/day` : `${formatNumber(dailyVelocity)}/day`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Hourly Pacing</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#38bdf8' }}>
                    {dailyVelocity !== 0 ? `~${Math.abs(Math.round(hourlyVelocity)).toLocaleString()}/hr` : 'Holding'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>30-Day Outlook</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#c084fc' }}>
                    {monthlyGain ? (monthlyGain > 0 ? `+${formatNumber(monthlyGain)}` : formatNumber(monthlyGain)) : `+${formatNumber(dailyVelocity * 30)}`}
                  </span>
                </div>
              </div>

              {/* Compare Button */}
              <button
                onClick={() => router.push(`/all?compare=${slug || profile.instagram_handle || ''}`)}
                style={{
                  width: '100%',
                  marginTop: 18,
                  padding: '11px 16px',
                  background: rivalProfile ? 'rgba(168,85,247,0.2)' : 'var(--gradient-subtle, rgba(168,85,247,0.1))',
                  border: '1px solid rgba(168,85,247,0.35)',
                  color: 'var(--text)',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease'
                }}
              >
                <ArrowLeftRight size={14} color="var(--accent)" />
                <span>{rivalProfile ? `Switch Rival (vs ${rivalProfile.name})` : `Compare ${profile.name} with Rival`}</span>
              </button>

              {rivalProfile && (
                <button
                  onClick={() => {
                    const { compare, ...restQuery } = router.query
                    router.push({ pathname: `/profile/${slug}`, query: restQuery }, undefined, { shallow: true })
                    setRivalProfile(null)
                  }}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <X size={13} />
                  <span>Exit Comparison Mode</span>
                </button>
              )}
            </div>

            {/* 3. Trending Peers in Category */}
            {trendingProfiles && trendingProfiles.length > 0 && (
              <div className="card" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Flame size={15} color="#ec4899" /> Trending Peers
                  </span>
                  <Link href="/live" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
                    View All
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trendingProfiles.slice(0, 5).map(tp => {
                    const tpSlug = tp.instagram_handle ? tp.instagram_handle.toLowerCase().trim().replace(/\./g, '-') : tp.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
                    return (
                      <Link
                        key={tp.id}
                        href={`/profile/${tpSlug}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={tp.photo_url || '/placeholder-avatar.png'}
                          alt={tp.name}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(168,85,247,0.4)', flexShrink: 0 }}
                          onError={e => e.target.style.display = 'none'}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tp.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>
                            {formatNumber(tp.followers_count)} followers
                          </div>
                        </div>
                        <ArrowUpRight size={13} color="#94a3b8" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 4. Desktop AdSense Responsive Sidebar Ad Slot */}
            <div className="card spialr-desktop-sidebar-ad" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Advertisement</div>
              <div style={{ width: '100%', minHeight: 250, background: 'var(--surface2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Responsive Display Ad Slot</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

async function fetchProfileBySlugOrHandle(rawSlug) {
  if (!rawSlug) return null
  const decoded = decodeURIComponent(rawSlug || '').toLowerCase().trim()
  const slugWithDots = decoded.replace(/-/g, '.')

  const [{ data: exactMatch }, { data: dotMatch }] = await Promise.all([
    supabase.from('most_followed').select('*').not('instagram_handle', 'is', null).ilike('instagram_handle', decoded).limit(1).maybeSingle(),
    slugWithDots !== decoded
      ? supabase.from('most_followed').select('*').not('instagram_handle', 'is', null).ilike('instagram_handle', slugWithDots).limit(1).maybeSingle()
      : Promise.resolve({ data: null })
  ])

  let finalProfile = exactMatch || dotMatch

  if (!finalProfile) {
    const { data: nameList, error: nameErr } = await supabase
      .from('most_followed')
      .select('id, name, instagram_handle')

    if (!nameErr && nameList) {
      const matched = nameList.find(p => {
        const sanitizedHandle = p.instagram_handle
          ? p.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
          : null
        const nameSlug = p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
        const namePlain = p.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')

        return (
          decoded === sanitizedHandle ||
          decoded === nameSlug ||
          decoded === namePlain
        )
      })

      if (matched) {
        const { data: fullProfile } = await supabase
          .from('most_followed')
          .select('*')
          .eq('id', matched.id)
          .single()
        if (fullProfile) finalProfile = fullProfile
      }
    }

    if (!finalProfile) {
      const { data: celMatch } = await supabase
        .from('celebrities')
        .select('*')
        .or(`slug.eq.${decoded},instagram_handle.ilike.${decoded},instagram_handle.ilike.${slugWithDots}`)
        .limit(1)
        .maybeSingle()

      if (celMatch) {
        finalProfile = {
          id: celMatch.id,
          name: celMatch.name,
          instagram_handle: celMatch.instagram_handle,
          followers_count: celMatch.followers_count,
          category: celMatch.category || 'Creator',
          photo_url: celMatch.photo_url,
          follower_history: [],
          created_at: celMatch.created_at,
          celebrity_id: celMatch.id,
          posts_count: celMatch.posts_count,
          average_views: celMatch.average_views,
          followers_interaction: celMatch.followers_interaction,
          account_created_year: celMatch.account_created_year
        }
      }
    }
  }

  return finalProfile
}

export async function getServerSideProps(context) {
  const { slug, compare } = context.query
  const decodedSlug = decodeURIComponent(slug || '').toLowerCase().trim()

  try {
    const finalProfile = await fetchProfileBySlugOrHandle(decodedSlug)
    if (!finalProfile) return { notFound: true }

    // Fetch rival profile if compare query param is present
    let rivalProfile = null
    let rivalRank = null
    let rivalCelebrityData = null

    if (compare) {
      const decodedCompare = decodeURIComponent(compare || '').toLowerCase().trim()
      if (decodedCompare && decodedCompare !== decodedSlug) {
        try {
          rivalProfile = await fetchProfileBySlugOrHandle(decodedCompare)
          if (rivalProfile) {
            if (rivalProfile.followers_count) {
              const { count } = await supabase
                .from('most_followed')
                .select('id', { count: 'exact', head: true })
                .gt('followers_count', rivalProfile.followers_count)
              if (typeof count === 'number') rivalRank = count + 1
            }
            if (rivalProfile.celebrity_id) {
              rivalCelebrityData = rivalProfile
            } else if (rivalProfile.instagram_handle) {
              const { data: cel } = await supabase
                .from('celebrities')
                .select('id, name, slug, instagram_handle, posts_count, average_views, followers_interaction, account_created_year, total_reel_views, total_reel_likes, total_post_likes, total_comments, total_shares, total_reposts')
                .ilike('instagram_handle', rivalProfile.instagram_handle)
                .maybeSingle()
              if (cel) rivalCelebrityData = cel
            }
          }
        } catch (rErr) {
          console.warn('Error fetching rival in getServerSideProps:', rErr)
        }
      }
    }

    // Calculate dynamic live rank among accounts with 100k+ followers
    let rank = null
    try {
      if (finalProfile.followers_count) {
        const { count, error: countErr } = await supabase
          .from('most_followed')
          .select('id', { count: 'exact', head: true })
          .gt('followers_count', finalProfile.followers_count)

        if (!countErr && typeof count === 'number') {
          rank = count + 1
        }
      }
    } catch (rankErr) {
      console.warn('Rank calculation error in getServerSideProps:', rankErr)
    }

    // Fetch matching celebrity data (posts, reels, etc.)
    let celebrityData = null
    try {
      if (finalProfile.celebrity_id) {
        celebrityData = finalProfile
      } else if (finalProfile.instagram_handle) {
        const { data: cel } = await supabase
          .from('celebrities')
          .select('id, name, slug, instagram_handle, posts_count, average_views, followers_interaction, account_created_year, total_reel_views, total_reel_likes, total_post_likes, total_comments, total_shares, total_reposts')
          .ilike('instagram_handle', finalProfile.instagram_handle)
          .maybeSingle()
        if (cel) celebrityData = cel
      }
    } catch (celErr) {
      console.warn('Celebrity match error in profile page:', celErr)
    }

    const isEnriched = Boolean(
      (finalProfile.followers_count && finalProfile.followers_count >= 100000) ||
      (finalProfile.follower_history && finalProfile.follower_history.length >= 2) ||
      celebrityData
    )

    // Fetch top 6 popular live profiles for internal links, discovery & AdSense quality score
    let trendingProfiles = []
    try {
      const { data: trendData } = await supabase
        .from('most_followed')
        .select('id, name, instagram_handle, photo_url, followers_count, category')
        .neq('id', finalProfile.id)
        .gte('followers_count', 100000)
        .order('followers_count', { ascending: false })
        .limit(6)
      if (trendData) {
        trendingProfiles = trendData
      }
    } catch (trendErr) {
      console.warn('Error fetching trending profiles:', trendErr)
    }

    return { props: { profile: finalProfile, slug: decodedSlug, rank, trendingProfiles, celebrityData, isEnriched, initialRivalProfile: rivalProfile, initialRivalRank: rivalRank, initialRivalCelebrity: rivalCelebrityData } }
  } catch (err) {
    console.error('getServerSideProps error in profile page:', err)
    return { notFound: true }
  }
}

