import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import { TrendingUp, Play, Film, ChevronUp, ChevronDown, Minus, ExternalLink, Users, Eye, Heart } from 'lucide-react'
import PostCard from '../components/PostCard'

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
      if (hours < 24) {
        setTimeAgo(`${hours} hour${hours !== 1 ? 's' : ''} ago`)
      } else {
        const days = Math.floor(hours / 24)
        setTimeAgo(`${days} day${days !== 1 ? 's' : ''} ago`)
      }
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
    >
      {/* Rank & Trend badge */}
      <div className="row-rank-container">
        <div className="row-rank-num">
          #{absoluteRank}
        </div>
        
        {!isMostViewed && (
          <div className="row-trend-container">
            {trendType === 'up' && (
              <span className="row-trend-badge trend-up">
                <ChevronUp className="trend-icon" strokeWidth={3} /> {trendVal}
              </span>
            )}
            {trendType === 'down' && (
              <span className="row-trend-badge trend-down">
                <ChevronDown className="trend-icon" strokeWidth={3} /> {trendVal}
              </span>
            )}
            {trendType === 'new' && (
              <span className="row-trend-badge trend-new">
                NEW
              </span>
            )}
            {trendType === 'stable' && (
              <Minus className="trend-icon trend-stable" strokeWidth={3} />
            )}
          </div>
        )}
      </div>

      {/* Creator Avatar with gradient ring */}
      <div className="row-avatar-container">
        <div className="row-avatar-inner">
          {reel.creator_photo_url ? (
            <img src={reel.creator_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display='none'}} />
          ) : initials}
        </div>
      </div>

      {/* Video Cover Thumbnail (Portrait Aspect Ratio) */}
      <div className="row-thumbnail">
        {reel.photo_url ? (
          <img src={reel.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display='none'}} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Film size={18} />
          </div>
        )}
        <div className="play-overlay">
          <div className="play-overlay-icon">
            <Play size={10} fill="currentColor" style={{ marginLeft: 1 }} />
          </div>
        </div>
      </div>

      {/* Title, Creator, Followers & Date Column */}
      <div className="row-details-container">
        {/* Top: Video Caption (reel title) */}
        <h4 className="row-title">
          {reel.title}
        </h4>

        {/* Below that: Creator Name */}
        <div className="row-creator-name">
          {reel.creator_name ? (reel.creator_name.startsWith('@') ? reel.creator_name : `@${reel.creator_name}`) : '@anonymous'}
        </div>

        {/* Below that: Follower count / views / likes & Date beside each other */}
        <div className="row-meta-container">
          {!isMostViewed && followersDisplay ? (
            <span className="row-meta-followers">
              <Users size={12} />
              {followersDisplay} followers
            </span>
          ) : isMostViewed && reel.likes_text ? (
            <span className="row-meta-followers" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Heart size={12} style={{ color: '#ff2a5f', fill: '#ff2a5f', flexShrink: 0 }} />
              <span style={{ background: 'linear-gradient(135deg, #ff2a5f 0%, #ff6b35 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 850 }}>
                {reel.likes_text} likes
              </span>
            </span>
          ) : isMostViewed && reel.views_text ? (
            <span className="row-meta-followers" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Eye size={12} style={{ color: '#6366f1', flexShrink: 0 }} />
              <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 850 }}>
                {reel.views_text} views
              </span>
            </span>
          ) : null}
          
          {((!isMostViewed && followersDisplay) || isMostViewed) && (reel.views_text || reel.likes_text || timeAgo) && <span className="row-meta-dot desktop-only-dot">•</span>}
          
          <div className="row-meta-subrow">
            {reel.views_text && !isMostViewed && (
              <span className="row-meta-views">
                <Eye size={12} />
                {reel.views_text} views
              </span>
            )}
            {timeAgo && (
              <span className="row-meta-time">{timeAgo}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Watch Button */}
      <button className="btn row-watch-btn">
        <span>Watch</span>
        <Play size={10} fill="currentColor" />
      </button>
    </div>
  )
}

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState('most_viewed') // 'trending' or 'most_viewed'
  const [hoveredTab, setHoveredTab] = useState(null)
  const [viralReels, setViralReels] = useState([])
  const [mostViewedReels, setMostViewedReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveDate, setLiveDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [activeSubTab, setActiveSubTab] = useState('reels') // 'reels' or 'posts'
  const [hoveredSubTab, setHoveredSubTab] = useState(null)
  const [indiaMostLikedPosts, setIndiaMostLikedPosts] = useState([])

  useEffect(() => {
    // Generate real-time automatic updated date system locally
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    setLiveDate(today)

    fetch('/api/live')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch trending data')
        return res.json()
      })
      .then(data => {
        setViralReels(data.viral_reels || [])
        setMostViewedReels(data.most_viewed_reels || [])
        setIndiaMostLikedPosts(data.india_most_liked_posts || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setCurrentTime(timeStr)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const activeReels = activeTab === 'trending' 
    ? viralReels 
    : (activeSubTab === 'reels' ? mostViewedReels : indiaMostLikedPosts)

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
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{activeTab === 'trending' ? 'Viral Standings' : 'Most Viewed Standings'}</span>
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
            onClick={() => { setActiveTab('trending'); setActiveSubTab('reels'); }}
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
            onClick={() => { setActiveTab('most_viewed'); setActiveSubTab('reels'); }}
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

        {/* Sub-tab Selection (Only when Most Viewed is active) */}
        {activeTab === 'most_viewed' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            marginBottom: 28,
            marginTop: 4
          }}>
            <button
              onClick={() => setActiveSubTab('reels')}
              onMouseEnter={() => setHoveredSubTab('reels')}
              onMouseLeave={() => setHoveredSubTab(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                color: activeSubTab === 'reels' 
                  ? 'var(--accent)' 
                  : (hoveredSubTab === 'reels' ? 'var(--text)' : 'var(--text-muted)'),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 4px',
                transition: 'all 0.25s ease',
                transform: hoveredSubTab === 'reels' && activeSubTab !== 'reels' ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 13 }}>🎬</span>
              Most Viewed Reel in India
            </button>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'var(--border)' }} />
            <button
              onClick={() => setActiveSubTab('posts')}
              onMouseEnter={() => setHoveredSubTab('posts')}
              onMouseLeave={() => setHoveredSubTab(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                color: activeSubTab === 'posts' 
                  ? 'var(--accent)' 
                  : (hoveredSubTab === 'posts' ? 'var(--text)' : 'var(--text-muted)'),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 4px',
                transition: 'all 0.25s ease',
                transform: hoveredSubTab === 'posts' && activeSubTab !== 'posts' ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 13 }}>❤️</span>
              Most Liked Posts in India
            </button>
          </div>
        )}

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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-dim)',
                letterSpacing: '0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: 0
              }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> 
                {activeTab === 'trending' 
                  ? 'India Trends' 
                  : (activeSubTab === 'reels' ? 'Most Viewed Reel in India' : 'Most Liked Posts in India')}
              </h3>
              {currentTime && activeTab === 'trending' && (
                <div style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <svg 
                    viewBox="0 0 24 24" 
                    width="15" 
                    height="15" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{ color: 'var(--accent)', flexShrink: 0 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    {/* Hour Hand */}
                    <line x1="12" y1="12" x2="15" y2="12" />
                    {/* Minute Hand */}
                    <line x1="12" y1="12" x2="12" y2="6" className="minute-hand" />
                  </svg>
                  <span>{currentTime}</span>
                </div>
              )}
            </div>
            
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
        @keyframes spin-minute-hand {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .minute-hand {
          transform-origin: 12px 12px;
          animation: spin-minute-hand 8s linear infinite;
        }
        .live-pulse {
          animation: pulse-scale 1.8s infinite;
        }
        @keyframes pulse-scale {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
        }
        .leaderboard-row {
          display: flex;
          align-items: flex-start;
          padding: 20px 24px;
          gap: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--border);
          position: relative;
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
        .row-rank-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 36px;
          flex-shrink: 0;
          align-self: center;
        }
        .row-rank-num {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-muted);
          font-family: var(--font-display);
          line-height: 1;
        }
        .row-trend-container {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .row-trend-badge {
          display: flex;
          align-items: center;
          font-weight: 800;
          line-height: 1;
        }
        .trend-up {
          font-size: 14px;
          color: #00c853;
        }
        .trend-down {
          font-size: 14px;
          color: #ff1744;
        }
        .trend-new {
          font-size: 11px;
          font-weight: 900;
          color: #fff;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          padding: 2px 5px;
          border-radius: 3px;
        }
        .trend-icon {
          width: 14px;
          height: 14px;
        }
        .trend-stable {
          color: var(--text-muted);
          opacity: 0.5;
          width: 12px;
          height: 12px;
        }
        .row-avatar-container {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .row-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #fff;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 15px;
        }
        .row-thumbnail {
          width: 88px;
          height: 132px;
          border-radius: 12px;
          background: #09090b;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .row-thumbnail img {
          transition: transform 0.4s var(--spring);
        }
        .play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .play-overlay-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .row-details-container {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .row-title {
          margin: 0;
          font-size: 15px;
          font-weight: 650;
          color: var(--text);
          line-height: 1.4;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .row-creator-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
        }
        .row-meta-container {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
          flex-wrap: wrap;
        }
        .row-meta-followers {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .row-meta-subrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .row-meta-views {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .row-meta-dot {
          opacity: 0.5;
        }
        .row-meta-time {
          white-space: nowrap;
        }
        .row-watch-btn {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid var(--border);
          background: transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          align-self: center;
        }

        @media (max-width: 580px) {
          .leaderboard-row {
            padding: 12px 10px !important;
            gap: 8px !important;
          }
          .row-rank-container {
            width: 28px !important;
          }
          .row-rank-num {
            font-size: 16px !important;
          }
          .trend-up, .trend-down {
            font-size: 12px !important;
          }
          .trend-icon {
            width: 12px !important;
            height: 12px !important;
          }
          .trend-new {
            font-size: 9px !important;
            padding: 1px 4px !important;
          }
          .trend-stable {
            width: 10px !important;
            height: 10px !important;
          }
          .row-avatar-container {
            width: 36px !important;
            height: 36px !important;
          }
          .row-avatar-inner {
            font-size: 12px !important;
          }
          .row-thumbnail {
            width: 68px !important;
            height: 102px !important;
            border-radius: 8px !important;
          }
          .row-title {
            font-size: 13px !important;
            line-height: 1.3 !important;
          }
          .row-creator-name {
            font-size: 12px !important;
          }
          .row-meta-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            font-size: 11px !important;
          }
          .row-meta-followers {
            gap: 3px !important;
          }
          .desktop-only-dot {
            display: none !important;
          }
          .row-meta-subrow {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            width: 100% !important;
          }
          .row-meta-views {
            gap: 3px !important;
          }
          .row-meta-dot {
            display: inline !important;
            opacity: 0.5 !important;
            margin: 0 2px !important;
          }
          .row-watch-btn {
            padding: 6px 8px !important;
            font-size: 11px !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </>
  )
}

