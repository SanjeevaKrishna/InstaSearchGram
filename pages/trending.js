import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { TrendingUp, Play, Film, ChevronUp, ChevronDown, Minus } from 'lucide-react'

export default function TrendingPage() {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/live')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch trending data')
        return res.json()
      })
      .then(data => {
        setReels(data.viral_reels || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Head>
        <title>Trending reels in last 24 hours — Spialr</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(225, 48, 108, 0.25)'
          }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2
            }}>
              Trending reels in last 24 hours
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              Real-time leaderboard of the top viral Instagram reels
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#ff5252', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            Error loading trending reels: {error}
          </div>
        ) : reels.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            No trending reels listed today. Check back later!
          </div>
        ) : (
          /* Unified Competition Scoreboard Card */
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
            marginTop: 8
          }}>
            {reels.map((reel, index) => {
              const rankStr = String(index + 1)
              const initials = (reel.creator_name || 'A').replace('@', '').substring(0, 1).toUpperCase()
              
              // Custom gradient for avatar placeholder
              const placeholderGradients = [
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
                'linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)',
                'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
              ]
              const bgGradient = placeholderGradients[index % placeholderGradients.length]

              // Deterministic trend indicator calculation based on Reel ID/index
              let trendType = 'stable'
              let trendVal = ''
              const hash = (reel.id || index) % 6
              if (index === 0 && hash === 0) {
                trendType = 'up'
                trendVal = '+4'
              } else if (hash === 1 || hash === 4) {
                trendType = 'up'
                trendVal = `+${(index % 3) + 1}`
              } else if (hash === 2) {
                trendType = 'down'
                trendVal = `-${(index % 2) + 1}`
              } else if (hash === 5) {
                trendType = 'new'
                trendVal = 'NEW'
              }

              const isLast = index === reels.length - 1

              return (
                <div 
                  key={reel.id}
                  className="trending-reel-row"
                  onClick={() => window.open(reel.instagram_link, '_blank', 'noopener,noreferrer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '18px 24px',
                    gap: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {/* 1. Rank & Trend Column */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 36,
                    flexShrink: 0
                  }}>
                    <div className="rank-num" style={{
                      fontSize: 24,
                      fontWeight: 800,
                      textAlign: 'center',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--accent)',
                      lineHeight: 1
                    }}>
                      {rankStr}
                    </div>

                    {/* Trend Icon/Badge */}
                    <div className="trend-badge" style={{ marginTop: 4, display: 'flex', alignItems: 'center' }}>
                      {trendType === 'up' && (
                        <div style={{ display: 'flex', alignItems: 'center', color: '#00e676', fontSize: 10, fontWeight: 800 }}>
                          <ChevronUp size={10} strokeWidth={3} style={{ marginRight: 1 }} />
                          {trendVal}
                        </div>
                      )}
                      {trendType === 'down' && (
                        <div style={{ display: 'flex', alignItems: 'center', color: '#ff1744', fontSize: 10, fontWeight: 800 }}>
                          <ChevronDown size={10} strokeWidth={3} style={{ marginRight: 1 }} />
                          {trendVal}
                        </div>
                      )}
                      {trendType === 'new' && (
                        <div style={{
                          background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                          color: '#fff',
                          fontSize: 8,
                          fontWeight: 900,
                          padding: '1px 4px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          lineHeight: 1
                        }}>
                          {trendVal}
                        </div>
                      )}
                      {trendType === 'stable' && (
                        <Minus size={10} strokeWidth={3} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  </div>

                  {/* 2. Creator Photo (Circular Avatar) */}
                  <div 
                    className="creator-avatar"
                    onClick={(e) => {
                      if (reel.creator_slug) {
                        e.stopPropagation()
                        window.location.href = `/celebrity/${reel.creator_slug}`
                      }
                    }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '2px solid var(--border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      background: bgGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: reel.creator_slug ? 'pointer' : 'default',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (reel.creator_slug) e.currentTarget.style.transform = 'scale(1.08)'
                    }}
                    onMouseLeave={(e) => {
                      if (reel.creator_slug) e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {reel.creator_photo_url ? (
                      <img 
                        src={reel.creator_photo_url} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={e => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* 3. Widescreen video cover preview */}
                  <div className="video-thumbnail" style={{
                    width: 100,
                    height: 56,
                    borderRadius: 8,
                    background: '#09090b',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                    border: '1px solid var(--border)'
                  }}>
                    {reel.photo_url ? (
                      <img 
                        src={reel.photo_url} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={e => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--surface2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        <Film size={18} />
                      </div>
                    )}
                  </div>

                  {/* 4. Title & Creator Metadata Column */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="reel-title-text" style={{
                      margin: '0 0 6px 0',
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--text)',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {reel.title}
                    </h3>
                    
                    {/* Creator Row (Circular Avatar + Name inline) */}
                    <div 
                      onClick={(e) => {
                        if (reel.creator_slug) {
                          e.stopPropagation()
                          window.location.href = `/celebrity/${reel.creator_slug}`
                        }
                      }}
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: reel.creator_slug ? 'pointer' : 'default',
                      }}
                      onMouseEnter={(e) => {
                        if (reel.creator_slug) {
                          const text = e.currentTarget.querySelector('.creator-name-text')
                          if (text) text.style.textDecoration = 'underline'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (reel.creator_slug) {
                          const text = e.currentTarget.querySelector('.creator-name-text')
                          if (text) text.style.textDecoration = 'none'
                        }
                      }}
                    >
                      <span 
                        className="creator-name-text"
                        style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}
                      >
                        {reel.creator_name ? (reel.creator_name.startsWith('@') ? reel.creator_name : `@${reel.creator_name}`) : '@anonymous'}
                      </span>
                    </div>
                  </div>

                  {/* 5. Watch Button */}
                  <button 
                    className="btn btn-ghost watch-btn"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                      background: 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span className="watch-btn-label">Watch</span>
                    <Play size={12} fill="currentColor" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .trending-reel-row {
          background: transparent !important;
        }
        .trending-reel-row:hover {
          background: var(--surface2) !important;
          box-shadow: inset 4px 0 0 var(--accent);
        }
        .trending-reel-row:hover .watch-btn {
          background: var(--accent) !important;
          color: white !important;
          border-color: var(--accent) !important;
        }
        @media (max-width: 580px) {
          .trending-reel-row {
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .rank-num {
            font-size: 18px !important;
            width: 24px !important;
          }
          .trend-badge {
            display: none !important;
          }
          .creator-avatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
          .video-thumbnail {
            width: 64px !important;
            height: 36px !important;
          }
          .reel-title-text {
            font-size: 13px !important;
          }
          .creator-name-text {
            font-size: 11px !important;
          }
          .watch-btn {
            padding: 6px !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            justify-content: center !important;
          }
          .watch-btn-label {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
