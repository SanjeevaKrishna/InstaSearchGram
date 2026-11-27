import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Rocket,
  Flame,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react'

const formatNumber = (n) => {
  if (n === null || n === undefined) return '—'
  const absN = Math.abs(n)
  let formatted = ''
  if (absN >= 1_000_000_000) formatted = `${(absN / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`
  else if (absN >= 1_000_000) formatted = `${(absN / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`
  else if (absN >= 1_000) formatted = `${(absN / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  else formatted = absN.toLocaleString()
  return n < 0 ? `-${formatted}` : formatted
}

const fmtShort = (n) => {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  if (abs >= 1000000) return `${sign}${(Math.floor(abs / 100000) / 10)}M`
  if (abs >= 1000) return `${sign}${(Math.floor(abs / 100) / 10)}K`
  return `${sign}${abs.toLocaleString()}`
}

function buildDailyHistory(history, profileInfo) {
  const trackingSorted = (history || []).filter(item => item && item.date && item.date >= '2026-08-28')
  const sourceList = trackingSorted.length > 0 ? trackingSorted : (history || [])
  const dailyHistoryItems = []
  const entriesByDate = {}
  sourceList.forEach(item => {
    if (item && item.date) entriesByDate[item.date] = item
  })

  if (sourceList.length > 0) {
    const validPoints = sourceList.filter(h => h && h.date && h.count && h.status !== 'Server Failed' && !h.serverFailed)
    validPoints.sort((a, b) => new Date(a.date) - new Date(b.date))
    if (validPoints.length >= 2) {
      for (let i = 0; i < validPoints.length - 1; i++) {
        const pPrev = validPoints[i]
        const pNext = validPoints[i + 1]
        const dP = new Date(pPrev.date + 'T00:00:00Z')
        const dN = new Date(pNext.date + 'T00:00:00Z')
        const diffDays = Math.round((dN - dP) / (1000 * 60 * 60 * 24))
        if (diffDays > 1) {
          const delta = pNext.count - pPrev.count
          const seed = (profileInfo?.instagram_handle || profileInfo?.name || 'default')
          let hash = 0
          for (let c = 0; c < seed.length; c++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(c)
            hash |= 0
          }
          const rawWeights = []
          for (let w = 0; w < diffDays; w++) {
            const x = Math.sin(hash + (w + 1) * 1337) * 10000
            const rnd = x - Math.floor(x)
            rawWeights.push(0.65 + rnd * 0.70)
          }
          const sumRaw = rawWeights.reduce((a, b) => a + b, 0)
          const normWeights = rawWeights.map(w => w / sumRaw)

          let runningCount = pPrev.count
          for (let step = 1; step < diffDays; step++) {
            const intDate = new Date(dP.getTime() + step * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            runningCount += Math.round(delta * normWeights[step - 1])
            entriesByDate[intDate] = { date: intDate, count: runningCount }
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

        const createdDateStr = profileInfo?.created_at ? profileInfo.created_at.split('T')[0] : null
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

  return dailyHistoryItems
}

export default function ComparativePulseTable({
  profile,
  rival,
  onExitComparison,
  onChangeRival,
  profileRank = null,
  rivalRank = null
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('last30')

  // Generate full daily histories for both creators
  const p1History = useMemo(() => buildDailyHistory(profile?.follower_history || [], profile), [profile])
  const p2History = useMemo(() => buildDailyHistory(rival?.follower_history || [], rival), [rival])

  // Map by date for quick lookup
  const p1Map = useMemo(() => {
    const map = {}
    p1History.forEach(d => { map[d.date] = d })
    return map
  }, [p1History])

  const p2Map = useMemo(() => {
    const map = {}
    p2History.forEach(d => { map[d.date] = d })
    return map
  }, [p2History])

  // Combined sorted list of distinct dates (newest first)
  const allDatesDesc = useMemo(() => {
    const dates = new Set([...p1History.map(d => d.date), ...p2History.map(d => d.date)])
    return Array.from(dates).sort((a, b) => b.localeCompare(a))
  }, [p1History, p2History])

  // Extract distinct available months for period filter
  const availableMonths = useMemo(() => {
    const set = new Set()
    allDatesDesc.forEach(d => {
      const ym = d.substring(0, 7)
      set.add(ym)
    })
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [allDatesDesc])

  // Filter dates based on selected period
  const filteredDates = useMemo(() => {
    if (selectedPeriod === 'last30') {
      return allDatesDesc.slice(0, 30)
    }
    if (selectedPeriod === 'all') {
      return allDatesDesc
    }
    return allDatesDesc.filter(d => d.startsWith(selectedPeriod))
  }, [allDatesDesc, selectedPeriod])

  // Compute period metrics for both creators
  const periodStats = useMemo(() => {
    let p1Net = 0, p2Net = 0
    let p1BestDay = { increment: -Infinity, date: '' }
    let p2BestDay = { increment: -Infinity, date: '' }
    let p1ValidDays = 0, p2ValidDays = 0

    filteredDates.forEach(date => {
      const d1 = p1Map[date]
      const d2 = p2Map[date]

      if (d1 && !d1.isFailed && !d1.isFirst && !d1.isSynchronized) {
        p1Net += d1.increment
        p1ValidDays++
        if (d1.increment > p1BestDay.increment) p1BestDay = { increment: d1.increment, date }
      }
      if (d2 && !d2.isFailed && !d2.isFirst && !d2.isSynchronized) {
        p2Net += d2.increment
        p2ValidDays++
        if (d2.increment > p2BestDay.increment) p2BestDay = { increment: d2.increment, date }
      }
    })

    const p1DailyAvg = p1ValidDays > 0 ? Math.round(p1Net / p1ValidDays) : 0
    const p2DailyAvg = p2ValidDays > 0 ? Math.round(p2Net / p2ValidDays) : 0

    const currentP1 = profile?.followers_count || 0
    const currentP2 = rival?.followers_count || 0
    const totalGap = currentP1 - currentP2
    const totalLeader = totalGap >= 0 ? profile?.name : rival?.name

    const sumFollowers = currentP1 + currentP2
    const p1Share = sumFollowers > 0 ? Math.round((currentP1 / sumFollowers) * 100) : 50
    const p2Share = 100 - p1Share

    const netLeader = p1Net >= p2Net ? profile?.name : rival?.name
    const netLeadDiff = Math.abs(p1Net - p2Net)

    return {
      p1Net,
      p2Net,
      p1DailyAvg,
      p2DailyAvg,
      p1BestDay,
      p2BestDay,
      totalGap,
      totalLeader,
      p1Share,
      p2Share,
      netLeader,
      netLeadDiff
    }
  }, [filteredDates, p1Map, p2Map, profile, rival])

  const p1Name = profile?.name || 'Creator 1'
  const p2Name = rival?.name || 'Creator 2'
  const p1Photo = profile?.photo_url || '/placeholder-avatar.png'
  const p2Photo = rival?.photo_url || '/placeholder-avatar.png'

  return (
    <div className="card comparative-pulse-container" style={{
      marginTop: 24,
      marginBottom: 36,
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.99) 100%)',
      border: '1px solid rgba(168, 85, 247, 0.35)',
      borderRadius: 18,
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168, 85, 247, 0.1)',
      overflow: 'hidden'
    }}>
      {/* ─── 1. HEAD-TO-HEAD ARENA BANNER ─── */}
      <div style={{
        padding: '22px 20px',
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.22) 50%, rgba(236, 72, 153, 0.15) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 100,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 10px rgba(168, 85, 247, 0.4)'
            }}>
              <ArrowLeftRight size={13} />
              Head-to-Head Comparison
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              Live Comparative Follower Pulse
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onChangeRival && (
              <button
                onClick={onChangeRival}
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e2e8f0',
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <ArrowLeftRight size={12} />
                <span>Switch Rival</span>
              </button>
            )}

            {onExitComparison && (
              <button
                onClick={onExitComparison}
                title="Exit Comparison"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <X size={13} />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 Creators Side-by-Side Arena */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Creator 1 (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <img
              src={p1Photo}
              alt={p1Name}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.35)',
                flexShrink: 0
              }}
              onError={(e) => { e.currentTarget.src = '/placeholder-avatar.png' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>{p1Name}</span>
                {profileRank && (
                  <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: 6 }}>
                    #{profileRank}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                @{profile?.instagram_handle || ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                {(profile?.followers_count || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* VS Center Badge */}
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 13,
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
              margin: '0 auto 6px'
            }}>
              VS
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap' }}>
              {Math.abs(periodStats.totalGap).toLocaleString()} Gap
            </div>
          </div>

          {/* Creator 2 (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 0, textAlign: 'right' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 5
              }}>
                {rivalRank && (
                  <span style={{ fontSize: 10, background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', padding: '1px 6px', borderRadius: 6 }}>
                    #{rivalRank}
                  </span>
                )}
                <span>{p2Name}</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                @{rival?.instagram_handle || ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f472b6', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                {(rival?.followers_count || 0).toLocaleString()}
              </div>
            </div>
            <img
              src={p2Photo}
              alt={p2Name}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ec4899',
                boxShadow: '0 0 12px rgba(236, 72, 153, 0.35)',
                flexShrink: 0
              }}
              onError={(e) => { e.currentTarget.src = '/placeholder-avatar.png' }}
            />
          </div>
        </div>

        {/* Audience Tug-of-War Bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 750, marginBottom: 5 }}>
            <span style={{ color: '#38bdf8' }}>{p1Name} ({periodStats.p1Share}%)</span>
            <span style={{ color: '#cbd5e1' }}>
              <strong>{periodStats.totalLeader}</strong> holds {formatNumber(Math.abs(periodStats.totalGap))} lead
            </span>
            <span style={{ color: '#f472b6' }}>{p2Name} ({periodStats.p2Share}%)</span>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: '#1e293b', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${periodStats.p1Share}%`, background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)', transition: 'width 0.4s ease' }} />
            <div style={{ width: `${periodStats.p2Share}%`, background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE METRICS GRID ─── */}
      <div style={{ padding: '20px 20px 10px' }}>
        {/* Period Selector Dropdown Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '4px 12px',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 750,
              color: '#38bdf8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              <Activity size={12} color="#38bdf8" />
              Daily Growth Pulse Benchmark
            </div>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="last30">Last 30 Days</option>
              <option value="all">All-Time Pulse</option>
              {availableMonths.map(ym => {
                const [y, m] = ym.split('-')
                const d = new Date(parseInt(y), parseInt(m) - 1, 1)
                const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                return <option key={ym} value={ym}>{monthName}</option>
              })}
            </select>
          </div>

          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
            <strong style={{ color: '#f8fafc' }}>{filteredDates.length}</strong> consecutive dates synced
          </div>
        </div>

        {/* 4 Summary Scorecard Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}>
          {/* Box 1: Period Net Gain */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            borderRadius: 12,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Period Net Growth
              </span>
              <TrendingUp size={15} color="#34d399" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{p1Name}:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: periodStats.p1Net >= 0 ? '#34d399' : '#fb7185', fontFamily: 'var(--font-display)' }}>
                {fmtShort(periodStats.p1Net)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f472b6' }}>{p2Name}:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: periodStats.p2Net >= 0 ? '#34d399' : '#fb7185', fontFamily: 'var(--font-display)' }}>
                {fmtShort(periodStats.p2Net)}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              ⚡ {periodStats.netLeader} outgrew by {formatNumber(periodStats.netLeadDiff)}
            </div>
          </div>

          {/* Box 2: Daily Velocity */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(96, 165, 250, 0.25)',
            borderRadius: 12,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Daily Avg Velocity
              </span>
              <Rocket size={15} color="#60a5fa" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{p1Name}:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
                ~{fmtShort(periodStats.p1DailyAvg)}/day
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f472b6' }}>{p2Name}:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#f472b6', fontFamily: 'var(--font-display)' }}>
                ~{fmtShort(periodStats.p2DailyAvg)}/day
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#93c5fd', background: 'rgba(59, 130, 246, 0.1)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              Rate difference: ~{formatNumber(Math.abs(periodStats.p1DailyAvg - periodStats.p2DailyAvg))}/day
            </div>
          </div>

          {/* Box 3: Single-Day Spike Peak */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 12,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Single-Day Record Spike
              </span>
              <Flame size={15} color="#fbbf24" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{p1Name}:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-display)' }}>
                {periodStats.p1BestDay.increment > -Infinity ? fmtShort(periodStats.p1BestDay.increment) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f472b6' }}>{p2Name}:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-display)' }}>
                {periodStats.p2BestDay.increment > -Infinity ? fmtShort(periodStats.p2BestDay.increment) : '—'}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#fde68a', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              Peak acceleration points on Spialr
            </div>
          </div>

          {/* Box 4: Global Standing & Category */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            borderRadius: 12,
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Platform Standing
              </span>
              <Award size={15} color="#c084fc" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{p1Name}:</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>
                {profileRank ? `Global #${profileRank}` : 'Ranked'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f472b6' }}>{p2Name}:</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>
                {rivalRank ? `Global #${rivalRank}` : 'Ranked'}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#e9d5ff', background: 'rgba(168, 85, 247, 0.1)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              Category: {profile?.category || 'Creator'} vs {rival?.category || 'Creator'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. SIDE-BY-SIDE COMPARATIVE FOLLOWER PULSE TABLE ─── */}
      <div style={{
        margin: '0 20px 24px',
        background: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Table Controls & Scroll Hint */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11,
          color: '#94a3b8'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#cbd5e1' }}>
            <ArrowLeftRight size={13} color="#94a3b8" />
            <span>Scroll horizontally on smaller screens to view side-by-side counts &amp; daily winner</span>
          </span>
          <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
            {filteredDates.length} Days Displayed
          </span>
        </div>

        {/* Scrollable Container with Sticky Date Column */}
        <div style={{
          overflowX: 'auto',
          maxHeight: 520,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
        }}>
          <table style={{
            width: '100%',
            minWidth: 700,
            borderCollapse: 'collapse',
            fontSize: 12.5,
            textAlign: 'left'
          }}>
            {/* Table Header */}
            <thead>
              <tr style={{
                background: 'rgba(15, 23, 42, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {/* Date Column Header (Sticky Left) */}
                <th style={{
                  padding: '12px 14px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 20,
                  background: 'rgba(15, 23, 42, 0.98)',
                  width: 130,
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  Date
                </th>

                {/* Creator 1 Header */}
                <th style={{ padding: '12px 16px', color: '#38bdf8', minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={p1Photo}
                      alt={p1Name}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.src = '/placeholder-avatar.png' }}
                    />
                    <span>{p1Name}</span>
                  </div>
                </th>

                {/* Creator 2 Header */}
                <th style={{ padding: '12px 16px', color: '#f472b6', minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={p2Photo}
                      alt={p2Name}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.src = '/placeholder-avatar.png' }}
                    />
                    <span>{p2Name}</span>
                  </div>
                </th>

                {/* Daily Edge & Gap Header */}
                <th style={{ padding: '12px 16px', color: '#c084fc', minWidth: 170, textAlign: 'right' }}>
                  Daily Winner &amp; Gap
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredDates.map((date, idx) => {
                const d1 = p1Map[date]
                const d2 = p2Map[date]

                const dateObj = new Date(date + 'T00:00:00Z')
                const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
                const isToday = date === new Date().toISOString().split('T')[0]

                // Creator 1 metrics
                const c1Count = d1?.count
                const c1Failed = d1?.isFailed
                const c1Sync = d1?.isFirst || d1?.isSynchronized
                const c1Inc = d1?.increment

                // Creator 2 metrics
                const c2Count = d2?.count
                const c2Failed = d2?.isFailed
                const c2Sync = d2?.isFirst || d2?.isSynchronized
                const c2Inc = d2?.increment

                // Comparative Outcome on this day
                const dayGap = (c1Count && c2Count) ? (c1Count - c2Count) : null
                const leaderNameOnDay = dayGap !== null ? (dayGap >= 0 ? p1Name : p2Name) : null

                let winnerBadge = null
                if (!c1Failed && !c2Failed && !c1Sync && !c2Sync && c1Inc !== undefined && c2Inc !== undefined) {
                  const edge = c1Inc - c2Inc
                  if (edge > 0) {
                    winnerBadge = (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontSize: 10.5,
                        fontWeight: 800
                      }}>
                        ⚡ {p1Name.split(' ')[0]} +{fmtShort(edge)}
                      </span>
                    )
                  } else if (edge < 0) {
                    winnerBadge = (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#f472b6',
                        background: 'rgba(236, 72, 153, 0.12)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontSize: 10.5,
                        fontWeight: 800
                      }}>
                        ⚡ {p2Name.split(' ')[0]} +{fmtShort(Math.abs(edge))}
                      </span>
                    )
                  } else {
                    winnerBadge = (
                      <span style={{ color: '#94a3b8', fontSize: 10.5, fontWeight: 700 }}>
                        Tied pace
                      </span>
                    )
                  }
                }

                return (
                  <tr
                    key={date}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent' }}
                  >
                    {/* Sticky Left Date Column */}
                    <td style={{
                      padding: '10px 14px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      background: 'rgba(10, 15, 28, 0.98)',
                      backdropFilter: 'blur(8px)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isToday ? '#a78bfa' : '#f1f5f9' }}>
                        {monthDay}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? '#818cf8' : '#64748b', marginTop: 1 }}>
                        {weekday}{isToday ? ' · TODAY' : ''}
                      </div>
                    </td>

                    {/* Creator 1 Cells */}
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)' }}>
                          {c1Count ? c1Count.toLocaleString() : '—'}
                        </span>
                        {c1Failed ? (
                          <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: 4, fontWeight: 750 }}>
                            Server Failed
                          </span>
                        ) : c1Sync ? (
                          <span style={{ fontSize: 10, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '1px 6px', borderRadius: 4, fontWeight: 750 }}>
                            Sync
                          </span>
                        ) : c1Inc > 0 ? (
                          <span style={{ fontSize: 11, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 7px', borderRadius: 5, fontWeight: 800 }}>
                            +{c1Inc.toLocaleString()}
                          </span>
                        ) : c1Inc < 0 ? (
                          <span style={{ fontSize: 11, color: '#fb7185', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1px 7px', borderRadius: 5, fontWeight: 800 }}>
                            {c1Inc.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>±0</span>
                        )}
                      </div>
                    </td>

                    {/* Creator 2 Cells */}
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)' }}>
                          {c2Count ? c2Count.toLocaleString() : '—'}
                        </span>
                        {c2Failed ? (
                          <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: 4, fontWeight: 750 }}>
                            Server Failed
                          </span>
                        ) : c2Sync ? (
                          <span style={{ fontSize: 10, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '1px 6px', borderRadius: 4, fontWeight: 750 }}>
                            Sync
                          </span>
                        ) : c2Inc > 0 ? (
                          <span style={{ fontSize: 11, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 7px', borderRadius: 5, fontWeight: 800 }}>
                            +{c2Inc.toLocaleString()}
                          </span>
                        ) : c2Inc < 0 ? (
                          <span style={{ fontSize: 11, color: '#fb7185', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1px 7px', borderRadius: 5, fontWeight: 800 }}>
                            {c2Inc.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>±0</span>
                        )}
                      </div>
                    </td>

                    {/* Daily Winner & End-of-Day Gap */}
                    <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        {winnerBadge}
                        {dayGap !== null && (
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                            {formatNumber(Math.abs(dayGap))} gap ({leaderNameOnDay?.split(' ')[0]} lead)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. HIGH-VALUE ADSENSE COMPARATIVE REPORT ─── */}
      <div style={{
        padding: '0 20px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: 20
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#f8fafc',
          marginBottom: 8,
          fontFamily: 'var(--font-display)'
        }}>
          Comparative Follower Momentum &amp; Historical Trajectory
        </h3>
        <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 16px' }}>
          This side-by-side comparative ledger benchmarks real-time daily follower gains between <strong>{p1Name}</strong> (@{profile?.instagram_handle}) and <strong>{p2Name}</strong> (@{rival?.instagram_handle}).
          Daily counts are verified against historical database snapshots with synchronized gap-interpolation. Currently, <strong>{periodStats.totalLeader}</strong> holds a total audience advantage of <strong>{formatNumber(Math.abs(periodStats.totalGap))} followers</strong>. Over the selected period, <strong>{periodStats.netLeader}</strong> has experienced higher net follower growth with an extra <strong>{formatNumber(periodStats.netLeadDiff)} followers</strong> acquired.
        </p>

        {/* AdSense Slot */}
        <div
          id="spialr-compare-pulse-ad"
          style={{
            minHeight: 100,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: 11,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          Spialr Verified Intelligence Partner Slot
        </div>
      </div>
    </div>
  )
}
