import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { TrendingUp, Play, Film, ChevronUp, ChevronDown, Minus, ExternalLink, Users } from 'lucide-react'

// Deterministic trend indicator calculation based on Reel ID/index
const getTrend = (reel, index) => {
  let trendType = 'stable'
  let trendVal = ''
  const hash = (index + (reel.creator_name ? reel.creator_name.length : 0)) % 6
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
  return { trendType, trendVal }
}

const generateReelSlug = (reel) => {
  if (!reel) return ''
  const creatorClean = (reel.creator_name || '')
    .replace('@', '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    
  const titleClean = (reel.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 45)

  const parts = [creatorClean, titleClean].filter(Boolean).join('-').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
  return `${parts || 'watch'}-${reel.id}`
}

function LeaderboardRow({ reel, absoluteRank, isMostViewed }) {
  const router = useRouter()
  const { trendType, trendVal } = getTrend(reel, absoluteRank - 1)
  const initials = (reel.creator_name || 'A').replace('@', '').substring(0, 1).toUpperCase()
  
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (isMostViewed) {
      if (!reel.created_at) return
      try {
        const created = new Date(reel.created_at)
        const formatted = created.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
        setTimeAgo(formatted)
      } catch (err) {
        setTimeAgo('')
      }
      return
    }

    const calculateTimeAgo = () => {
      if (!reel.created_at) return
      const created = new Date(reel.created_at)
      const diffMs = Date.now() - created.getTime()
      const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
      setTimeAgo(`${hours} hour${hours !== 1 ? 's' : ''} ago`)
    }
    calculateTimeAgo()
    const interval = setInterval(calculateTimeAgo, 60000) // update every minute
    return () => clearInterval(interval)
  }, [reel.created_at, isMostViewed])

  const formatFollowers = (n) => {
    if (!n) return null
    const num = Number(n)
    if (isNaN(num)) return n.toString()
    const roundedNum = Number(num.toPrecision(3))
    const formatWithPrec = (value, suffix) => {
      let formatted = Number(value.toPrecision(3)).toString()
      return formatted + suffix
    }
    if (roundedNum >= 1e12) return formatWithPrec(roundedNum / 1e12, 'T')
    if (roundedNum >= 1e9) return formatWithPrec(roundedNum / 1e9, 'B')
    if (roundedNum >= 1e6) return formatWithPrec(roundedNum / 1e6, 'M')
    if (roundedNum >= 1000) return formatWithPrec(roundedNum / 1000, 'K')
    return roundedNum.toString()
  }

  const followersDisplay = reel.followers_text || formatFollowers(reel.celebrity_followers_count)

  return (
    <div 
      className="leaderboard-row"
      onClick={() => {
        if (isMostViewed) {
          router.push(`/reel/${generateReelSlug(reel)}`)
        } else {
          window.open(reel.instagram_link, '_blank', 'noopener,noreferrer')
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '20px 24px',
        gap: 20,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }}
    >
      {/* Rank & Trend badge */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 36,
        flexShrink: 0,
        alignSelf: 'center'
      }}>
        <div style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          lineHeight: 1
        }}>
          #{absoluteRank}
        </div>
        
        {/* Trend Indicator */}
        {!isMostViewed && (
          <div style={{ marginTop: 6 }}>
            {trendType === 'up' && (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#00c853', display: 'flex', alignItems: 'center' }}>
                <ChevronUp size={9} strokeWidth={3} /> {trendVal}
              </span>
            )}
            {trendType === 'down' && (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#ff1744', display: 'flex', alignItems: 'center' }}>
                <ChevronDown size={9} strokeWidth={3} /> {trendVal}
              </span>
            )}
            {trendType === 'new' && (
              <span style={{
                fontSize: 7,
                fontWeight: 900,
                color: '#fff',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                padding: '1px 3px',
                borderRadius: 3,
                lineHeight: 1
              }}>
                NEW
              </span>
            )}
            {trendType === 'stable' && (
              <Minus size={9} strokeWidth={3} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            )}
          </div>
        )}
      </div>

      {/* Creator Avatar with gradient ring */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        padding: 2,
        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #fff',
          background: 'var(--surface2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontWeight: 700,
          fontSize: 15
        }}>
          {reel.creator_photo_url ? (
            <img src={reel.creator_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display='none'}} />
          ) : initials}
        </div>
      </div>

      {/* Video Cover Thumbnail (Portrait Aspect Ratio) */}
      <div className="row-thumbnail" style={{
        width: 88,
        height: 132,
        borderRadius: 12,
        background: '#09090b',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        border: '1px solid var(--border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {reel.photo_url ? (
          <img src={reel.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display='none'}} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Film size={18} />
          </div>
        )}
        <div className="play-overlay" style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <Play size={10} fill="currentColor" style={{ marginLeft: 1 }} />
          </div>
        </div>
      </div>

      {/* Title, Creator, Followers & Date Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Top: Video Caption (reel title) */}
        <h4 className="row-title" style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 650,
          color: 'var(--text)',
          lineHeight: 1.4,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}>
          {reel.title}
        </h4>

        {/* Below that: Creator Name */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
          {reel.creator_name ? (reel.creator_name.startsWith('@') ? reel.creator_name : `@${reel.creator_name}`) : '@anonymous'}
        </div>

        {/* Below that: Follower count & Date beside each other */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 500,
          flexWrap: 'wrap'
        }}>
          {followersDisplay && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} />
              {followersDisplay} followers
            </span>
          )}
          {followersDisplay && timeAgo && <span style={{ opacity: 0.5 }}>•</span>}
          {timeAgo && (
            <span>{timeAgo}</span>
          )}
        </div>
      </div>

      {/* Action Watch Button */}
      <button 
        className="btn row-watch-btn"
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          border: '1px solid var(--border)',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          transition: 'all 0.2s ease',
          alignSelf: 'center'
        }}
      >
        <span>Watch</span>
        <Play size={10} fill="currentColor" />
      </button>
    </div>
  )
}

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState('trending') // 'trending' or 'most_viewed'
  const [hoveredTab, setHoveredTab] = useState(null)
  const [viralReels, setViralReels] = useState([])
  const [mostViewedReels, setMostViewedReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveDate, setLiveDate] = useState('')

  useEffect(() => {
    fetch('/api/live')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch trending data')
        return res.json()
      })
      .then(data => {
        setViralReels(data.viral_reels || [])
        setMostViewedReels(data.most_viewed_reels || [])
        setLiveDate(data.live_date || '')
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const activeReels = activeTab === 'trending' ? viralReels : mostViewedReels

  return (
    <>
      <Head>
        <title>Daily Viral Instagram Reels Leaderboard — Spialr</title>
        <meta name="description" content="Check out the top daily viral trending Instagram reels in order. Visual leaderboard of creator rankings in India." />
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '16px 20px 100px' }}>
        {/* Compact Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 850,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            margin: '0 0 4px 0',
            color: 'var(--text)'
          }}>
            {activeTab === 'trending' ? 'Trending Reels in Last 24 Hours' : 'Most Viewed Reels'}
          </h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 600,
            flexWrap: 'wrap'
          }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>India Trends</span>
            {liveDate && <span>•</span>}
            {liveDate && (
              <span>Leaderboard for {liveDate}</span>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="subtabs-container" style={{
          display: 'flex',
          background: 'var(--surface2)',
          borderRadius: '100px',
          padding: 3,
          marginBottom: 24,
          gap: 4,
          border: '1px solid var(--border)',
          maxWidth: 340,
          margin: '0 auto 24px'
        }}>
          <button
            onClick={() => setActiveTab('trending')}
            onMouseEnter={() => setHoveredTab('trending')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '100px',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'trending' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'trending' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'trending' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transform: hoveredTab === 'trending' && activeTab !== 'trending' ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ marginRight: 6, fontSize: 13 }}>🔥</span>
            Trending Reels
          </button>
          
          <button
            onClick={() => setActiveTab('most_viewed')}
            onMouseEnter={() => setHoveredTab('most_viewed')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '100px',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'most_viewed' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'most_viewed' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'most_viewed' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transform: hoveredTab === 'most_viewed' && activeTab !== 'most_viewed' ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ marginRight: 6, fontSize: 13 }}>👁️</span>
            Most Viewed
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#ff5252', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            Error loading reels: {error}
          </div>
        ) : activeReels.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            No reels listed in this section today. Check back later!
          </div>
        ) : (
          /* Single unified leaderboard list */
          <div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-dim)',
              marginBottom: 16,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> 
              {activeTab === 'trending' ? 'Viral Standings' : 'Most Viewed Standings'}
            </h3>
            
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
            }}>
              {activeReels.map((reel, idx) => {
                const absoluteRank = idx + 1

                return (
                  <div key={reel.id}>
                    <LeaderboardRow 
                      reel={reel}
                      absoluteRank={absoluteRank} 
                      isMostViewed={activeTab === 'most_viewed'}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .leaderboard-row {
          background: transparent !important;
        }
        .leaderboard-row:hover {
          background: var(--surface2) !important;
          box-shadow: inset 4px 0 0 var(--accent);
        }
        .leaderboard-row:hover .row-watch-btn {
          background: var(--gradient) !important;
          color: white !important;
          border-color: transparent !important;
          box-shadow: 0 4px 12px rgba(225, 48, 108, 0.2);
        }
        .leaderboard-row:hover .play-overlay {
          opacity: 1 !important;
        }
        .leaderboard-row:hover .row-thumbnail img {
          transform: scale(1.05);
        }
        .row-thumbnail img {
          transition: transform 0.4s var(--spring);
        }

        @media (max-width: 580px) {
          .leaderboard-row {
            padding: 14px 16px !important;
            gap: 12px !important;
          }
          .row-thumbnail {
            width: 72px !important;
            height: 108px !important;
          }
          .row-title {
            font-size: 13px !important;
          }
          .row-watch-btn {
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </>
  )
}

