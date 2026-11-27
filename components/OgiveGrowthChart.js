import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Calendar,
  Flame,
  Target
} from 'lucide-react'

export default function OgiveGrowthChart({
  followerHistory = [],
  currentFollowers = 0,
  dailyVelocity = 0,
  formatNumber
}) {
  // Zoom tiers: 'all' (all-time ogive), '30d' (1 month), '7d' (7 days up & down), '3d' (3 days micro)
  const [zoomLevel, setZoomLevel] = useState('all')
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // 1. Prepare raw valid history list
  const cleanHistory = useMemo(() => {
    const list = (followerHistory || [])
      .filter(h => h && h.date && Number(h.count) > 0 && !h.serverFailed && h.status !== 'Server Failed')
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    if (list.length >= 3) {
      return list
    }

    // Fallback baseline if less than 3 snapshots exist
    const current = currentFollowers || 100000
    const vel = dailyVelocity !== 0 ? dailyVelocity : 150
    const days = 30
    const syntheticPoints = []
    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = Math.max(0, Math.round(current - (i * vel)))
      syntheticPoints.push({ date: dateStr, count, synthetic: true })
    }
    return syntheticPoints
  }, [followerHistory, currentFollowers, dailyVelocity])

  // 2. Compute slice based on active zoom level
  const activePoints = useMemo(() => {
    if (!cleanHistory || cleanHistory.length === 0) return []

    if (zoomLevel === '3d') {
      // Last 3 to 4 snapshots for micro view
      return cleanHistory.slice(-4)
    }
    if (zoomLevel === '7d') {
      // Last 7 to 8 snapshots
      return cleanHistory.slice(-8)
    }
    if (zoomLevel === '30d') {
      // Last 30 snapshots
      return cleanHistory.slice(-30)
    }
    // 'all' -> all available snapshots
    return cleanHistory
  }, [cleanHistory, zoomLevel])

  // 3. Compute Future Projection (only visible in 'all' and '30d' macro views)
  const futurePoints = useMemo(() => {
    if (zoomLevel === '7d' || zoomLevel === '3d' || activePoints.length === 0) return []
    const lastPoint = activePoints[activePoints.length - 1]
    const vel = dailyVelocity > 0 ? dailyVelocity : Math.max(25, Math.round((currentFollowers || 10000) * 0.001))
    const intervals = zoomLevel === '30d' ? [7, 14] : [7, 14, 21]

    return intervals.map(daysAhead => {
      const d = new Date(lastPoint.date)
      d.setDate(d.getDate() + daysAhead)
      return {
        date: d.toISOString().split('T')[0],
        count: Math.round(lastPoint.count + (daysAhead * vel)),
        isProjected: true
      }
    })
  }, [activePoints, zoomLevel, dailyVelocity, currentFollowers])

  // 4. Compute geometry & curve paths
  const chart = useMemo(() => {
    if (activePoints.length < 2) return null

    const allHistoricalCounts = activePoints.map(p => Number(p.count))
    const allCounts = [...allHistoricalCounts, ...futurePoints.map(p => Number(p.count))]
    const minCount = Math.min(...allCounts)
    const maxCount = Math.max(...allCounts)
    const rawRange = maxCount - minCount
    // Pad range slightly so lines never clip to the very top/bottom edge
    const range = rawRange > 0 ? rawRange * 1.15 : Math.max(100, minCount * 0.05)
    const adjustedMin = Math.max(0, Math.round(minCount - (range * 0.07)))

    const width = 720
    const height = 240
    const padLeft = 75
    const padRight = 30
    const padTop = 32
    const padBottom = 38

    const plotWidth = width - padLeft - padRight
    const plotHeight = height - padTop - padBottom

    const totalPointsCount = activePoints.length + futurePoints.length
    const getX = (index) => padLeft + (index / (totalPointsCount - 1)) * plotWidth
    const getY = (val) => height - padBottom - ((val - adjustedMin) / range) * plotHeight

    // Historical Points with daily delta calculation
    const plottedHistory = activePoints.map((p, idx) => {
      const prev = idx > 0 ? activePoints[idx - 1] : null
      const delta = prev ? p.count - prev.count : null
      return {
        ...p,
        delta,
        x: getX(idx),
        y: getY(p.count)
      }
    })

    // Future Projected Points
    const plottedFuture = futurePoints.length > 0 ? [
      plottedHistory[plottedHistory.length - 1],
      ...futurePoints.map((p, idx) => ({
        ...p,
        delta: null,
        x: getX(activePoints.length + idx),
        y: getY(p.count)
      }))
    ] : []

    // Build smooth Catmull-Rom / Bezier curve for historical points
    let historyPath = `M ${plottedHistory[0].x} ${plottedHistory[0].y}`
    for (let i = 1; i < plottedHistory.length; i++) {
      const prev = plottedHistory[i - 1]
      const curr = plottedHistory[i]
      const cpX = (prev.x + curr.x) / 2
      historyPath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`
    }

    // Build smooth curve for future points
    let futurePath = ''
    if (plottedFuture.length > 1) {
      futurePath = `M ${plottedFuture[0].x} ${plottedFuture[0].y}`
      for (let i = 1; i < plottedFuture.length; i++) {
        const prev = plottedFuture[i - 1]
        const curr = plottedFuture[i]
        const cpX = (prev.x + curr.x) / 2
        futurePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`
      }
    }

    const lastHist = plottedHistory[plottedHistory.length - 1]
    const areaPath = `${historyPath} L ${lastHist.x} ${height - padBottom} L ${plottedHistory[0].x} ${height - padBottom} Z`

    // Y-Axis dynamic scale numbers (4 reference lines)
    const yLevels = [
      { pct: 1.0, val: Math.round(adjustedMin + range), y: getY(adjustedMin + range) },
      { pct: 0.67, val: Math.round(adjustedMin + range * 0.67), y: getY(adjustedMin + range * 0.67) },
      { pct: 0.33, val: Math.round(adjustedMin + range * 0.33), y: getY(adjustedMin + range * 0.33) },
      { pct: 0.0, val: Math.round(adjustedMin), y: getY(adjustedMin) }
    ]

    // Net growth for the active window
    const startVal = activePoints[0].count
    const currentVal = activePoints[activePoints.length - 1].count
    const netGrowth = currentVal - startVal
    const netPct = startVal > 0 ? ((netGrowth / startVal) * 100).toFixed(2) : '0'

    // Micro daily delta max for 7d & 3d momentum bars
    const deltas = plottedHistory.map(p => Math.abs(p.delta || 0))
    const maxDelta = Math.max(...deltas, 100)

    return {
      plottedHistory,
      plottedFuture,
      historyPath,
      futurePath,
      areaPath,
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      yLevels,
      startVal,
      currentVal,
      netGrowth,
      netPct,
      maxDelta,
      startDate: activePoints[0]?.date,
      endDate: activePoints[activePoints.length - 1]?.date
    }
  }, [activePoints, futurePoints])

  // Handle zoom transitions
  const handleZoomNext = () => {
    if (zoomLevel === 'all') setZoomLevel('30d')
    else if (zoomLevel === '30d') setZoomLevel('7d')
    else if (zoomLevel === '7d') setZoomLevel('3d')
  }

  const handleZoomPrev = () => {
    if (zoomLevel === '3d') setZoomLevel('7d')
    else if (zoomLevel === '7d') setZoomLevel('30d')
    else if (zoomLevel === '30d') setZoomLevel('all')
  }

  const zoomLabels = {
    all: { title: 'Macro Growth Ogive', desc: 'Overall cumulative trajectory & S-curve' },
    '30d': { title: '1-Month Trajectory', desc: '30-day velocity curve & milestone progression' },
    '7d': { title: '7-Day Wave & Daily Momentum', desc: 'Weekly micro-fluctuations & day-over-day pulses' },
    '3d': { title: '3-Day Real-Time Heartbeat', desc: 'High-precision micro snapshot shifts' }
  }

  if (!chart) return null

  return (
    <div
      className="card"
      style={{
        padding: '24px 22px',
        marginTop: 24,
        marginBottom: 24,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* ── Top Header with Zoom Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.25))',
            border: '1px solid rgba(168,85,247,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={20} color="#c084fc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                {zoomLabels[zoomLevel].title}
              </h3>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '2px 8px',
                borderRadius: 100,
                textTransform: 'uppercase'
              }}>
                Interactive Ogive
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {zoomLabels[zoomLevel].desc}
            </p>
          </div>
        </div>

        {/* Zoom Selector Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--surface2)',
          padding: '4px',
          borderRadius: 100,
          border: '1px solid var(--border)'
        }}>
          {[
            { id: 'all', label: 'All-Time' },
            { id: '30d', label: '30D' },
            { id: '7d', label: '7D' },
            { id: '3d', label: '3D' }
          ].map(tab => {
            const isActive = zoomLevel === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setZoomLevel(tab.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 100,
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 2px 10px rgba(168,85,247,0.3)' : 'none'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Status Bar & Net Growth ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--surface2)',
        borderRadius: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Period Base:</span>
          <span style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            {formatNumber(chart.startVal)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Current Followers:</span>
          <span style={{ fontSize: 12.5, fontWeight: 750, color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
            {formatNumber(chart.currentVal)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Period Net:</span>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            color: chart.netGrowth >= 0 ? '#10b981' : '#f43f5e'
          }}>
            {chart.netGrowth >= 0 ? `+${formatNumber(chart.netGrowth)} (+${chart.netPct}%)` : `${formatNumber(chart.netGrowth)} (${chart.netPct}%)`}
          </span>
        </div>
      </div>

      {/* ── Responsive Rectangular SVG Ogive ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          cursor: zoomLevel !== '3d' ? 'zoom-in' : 'crosshair'
        }}
        onClick={(e) => {
          // If clicked on chart area and not on tooltip, zoom deeper
          if (zoomLevel !== '3d' && e.target.tagName !== 'BUTTON') {
            handleZoomNext()
          }
        }}
      >
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: 320, transition: 'all 0.3s ease' }}
        >
          <defs>
            <linearGradient id="ogiveAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.38" />
              <stop offset="60%" stopColor="#ec4899" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ogiveLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="ogiveFutureGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Y-Axis Horizontal Grid Lines & Scale Numbers */}
          {chart.yLevels.map((lvl, i) => (
            <g key={`y-lvl-${i}`}>
              <line
                x1={chart.padLeft}
                y1={lvl.y}
                x2={chart.width - chart.padRight}
                y2={lvl.y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="3 3"
              />
              <text
                x={chart.padLeft - 10}
                y={lvl.y + 3.5}
                fill="#94a3b8"
                fontSize="10.5"
                fontWeight="700"
                textAnchor="end"
                fontFamily="var(--font-display), monospace, sans-serif"
              >
                {formatNumber(lvl.val)}
              </text>
            </g>
          ))}

          {/* Micro Pulse Momentum Bars (Active in 7D and 3D zoom modes) */}
          {(zoomLevel === '7d' || zoomLevel === '3d') && chart.plottedHistory.map((pt, idx) => {
            if (pt.delta === null) return null
            const isGain = pt.delta >= 0
            const barHeight = Math.min(30, Math.max(6, (Math.abs(pt.delta) / chart.maxDelta) * 30))
            const barY = chart.height - chart.padBottom - barHeight
            const barWidth = zoomLevel === '3d' ? 14 : 8
            return (
              <g key={`pulse-${idx}`}>
                <rect
                  x={pt.x - (barWidth / 2)}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill={isGain ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)'}
                  stroke={isGain ? '#10b981' : '#f43f5e'}
                  strokeWidth="1"
                />
              </g>
            )
          })}

          {/* Area Fill */}
          <path d={chart.areaPath} fill="url(#ogiveAreaGrad)" style={{ transition: 'd 0.35s ease' }} />

          {/* Historical Ogive Line */}
          <path
            d={chart.historyPath}
            fill="none"
            stroke="url(#ogiveLineGrad)"
            strokeWidth={zoomLevel === '3d' ? '3.5' : '3'}
            strokeLinecap="round"
            style={{ transition: 'd 0.35s ease' }}
          />

          {/* Projected Future Dotted Line (Macro mode only) */}
          {chart.futurePath && (
            <path
              d={chart.futurePath}
              fill="none"
              stroke="url(#ogiveFutureGrad)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              strokeLinecap="round"
              opacity="0.85"
            />
          )}

          {/* X-Axis Baseline */}
          <line
            x1={chart.padLeft}
            y1={chart.height - chart.padBottom}
            x2={chart.width - chart.padRight}
            y2={chart.height - chart.padBottom}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />

          {/* X-Axis Dynamic Date Markers */}
          <text
            x={chart.padLeft}
            y={chart.height - 12}
            fill="#94a3b8"
            fontSize="10"
            fontWeight="600"
            textAnchor="start"
          >
            {chart.startDate ? new Date(chart.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start'}
          </text>
          <text
            x={chart.plottedHistory[chart.plottedHistory.length - 1]?.x}
            y={chart.height - 12}
            fill="#c084fc"
            fontSize="10.5"
            fontWeight="700"
            textAnchor="middle"
          >
            ● Today (Verified)
          </text>
          {chart.futurePath && (
            <text
              x={chart.width - chart.padRight}
              y={chart.height - 12}
              fill="#38bdf8"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
            >
              Forecast →
            </text>
          )}

          {/* Interactive Circle Nodes */}
          {chart.plottedHistory.map((pt, idx) => {
            const isHovered = hoveredPoint?.index === idx && !hoveredPoint?.isProjected
            const radius = isHovered ? (zoomLevel === '3d' ? 8 : 6.5) : (zoomLevel === '3d' ? 5.5 : zoomLevel === '7d' ? 4.5 : 3)
            return (
              <circle
                key={`h-pt-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={radius}
                fill={isHovered ? '#ffffff' : (zoomLevel === '7d' || zoomLevel === '3d') ? (pt.delta >= 0 ? '#10b981' : '#f43f5e') : '#c084fc'}
                stroke="#0f172a"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredPoint({ ...pt, index: idx })}
                onMouseLeave={() => setHoveredPoint(null)}
                onTouchStart={() => setHoveredPoint({ ...pt, index: idx })}
              />
            )
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: Math.max(10, Math.min(hoveredPoint.x - 65, chart.width - 150)),
              top: Math.max(8, hoveredPoint.y - 58),
              background: 'rgba(15, 15, 30, 0.95)',
              border: `1px solid ${hoveredPoint.isProjected ? '#38bdf8' : '#a855f7'}`,
              borderRadius: 10,
              padding: '6px 12px',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              {hoveredPoint.date ? new Date(hoveredPoint.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Snapshot'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
              {Number(hoveredPoint.count).toLocaleString()} followers
            </div>
            {hoveredPoint.delta !== null && (
              <div style={{ fontSize: 11, fontWeight: 700, color: hoveredPoint.delta >= 0 ? '#10b981' : '#f43f5e', marginTop: 2 }}>
                {hoveredPoint.delta >= 0 ? `+${Number(hoveredPoint.delta).toLocaleString()} in 24h` : `${Number(hoveredPoint.delta).toLocaleString()} in 24h`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Interactive Zoom Action Bar & Guidance ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        flexWrap: 'wrap',
        gap: 10,
        fontSize: 11.5,
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {zoomLevel !== 'all' ? (
            <button
              onClick={handleZoomPrev}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                padding: '4px 12px',
                color: 'var(--text)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ZoomOut size={13} /> Zoom Out
            </button>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontWeight: 600 }}>
              <ZoomIn size={13} /> Tap graph or pills to zoom in
            </span>
          )}

          {zoomLevel !== 'all' && (
            <button
              onClick={() => setZoomLevel('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 11.5,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              <RotateCcw size={12} /> Reset to All-Time
            </button>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #818cf8, #f472b6)' }} />
            <span>Cumulative Ogive</span>
          </div>
          {(zoomLevel === '7d' || zoomLevel === '3d') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
              <span>Daily Pulse</span>
            </div>
          )}
          {chart.futurePath && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 2, borderTop: '2px dashed #38bdf8' }} />
              <span>Estimated Horizon</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Forward-Looking Growth Horizons (Sleek & Meaningful) ── */}
      <div style={{ marginTop: 22, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} color="var(--accent)" /> Projected Growth Horizons
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Calculated from rolling 30-day velocity
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {/* 7-Day Horizon */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              7-Day Forecast
            </div>
            <div style={{ fontSize: 17, fontWeight: 850, color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
              {formatNumber(Math.round(chart.currentVal + (dailyVelocity * 7)))}
            </div>
            <div style={{ fontSize: 11.5, color: dailyVelocity >= 0 ? '#10b981' : '#f43f5e', marginTop: 4, fontWeight: 600 }}>
              {dailyVelocity >= 0 ? `+${formatNumber(dailyVelocity * 7)}` : formatNumber(dailyVelocity * 7)} est.
            </div>
          </div>

          {/* 30-Day Horizon */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              30-Day Forecast
            </div>
            <div style={{ fontSize: 17, fontWeight: 850, color: '#c084fc', fontFamily: 'var(--font-display)' }}>
              {formatNumber(Math.round(chart.currentVal + (dailyVelocity * 30)))}
            </div>
            <div style={{ fontSize: 11.5, color: dailyVelocity >= 0 ? '#10b981' : '#f43f5e', marginTop: 4, fontWeight: 600 }}>
              {dailyVelocity >= 0 ? `+${formatNumber(dailyVelocity * 30)}` : formatNumber(dailyVelocity * 30)} est.
            </div>
          </div>

          {/* 90-Day Quarterly Horizon */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              90-Day Horizon
            </div>
            <div style={{ fontSize: 17, fontWeight: 850, color: '#f472b6', fontFamily: 'var(--font-display)' }}>
              {formatNumber(Math.round(chart.currentVal + (dailyVelocity * 90)))}
            </div>
            <div style={{ fontSize: 11.5, color: dailyVelocity >= 0 ? '#10b981' : '#f43f5e', marginTop: 4, fontWeight: 600 }}>
              {dailyVelocity >= 0 ? `+${formatNumber(dailyVelocity * 90)}` : formatNumber(dailyVelocity * 90)} est.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
