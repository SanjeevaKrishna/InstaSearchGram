import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../components/Navbar'
import PostCard from '../../components/PostCard'
import { TrendingUp, Eye, Heart, ThumbsUp, Search, MessageSquare, Star, Tv, Sparkles, Share2, Repeat2 } from 'lucide-react'

export default function CelebrityPage() {
  const router = useRouter()
  const { slug } = router.query

  const [celebrity, setCelebrity] = useState(null)
  const [postsCount, setPostsCount] = useState(0)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // Search states
  const [tagSearch, setTagSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/celebrities/${slug}`)
      .then(r => r.json())
      .then(d => {
        setCelebrity(d.celebrity)
        setPostsCount(d.posts?.length || 0)
        setPosts(d.posts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const goResults = (params) => {
    const query = new URLSearchParams({ slug, ...params })
    router.push(`/results?${query.toString()}`)
  }

  const formatCount = (n) => {
    if (!n) return '—'
    const num = Number(n)
    if (isNaN(num)) return n.toString()

    // Pre-round to 3 significant figures to handle rollovers (e.g. 999900 -> 1000000)
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


  const playlists = {}
  posts.forEach(p => {
    if (p.playlist_name) {
      if (!playlists[p.playlist_name]) playlists[p.playlist_name] = []
      playlists[p.playlist_name].push(p)
    }
  })
  const hasPlaylists = Object.keys(playlists).length > 0

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </>
  )

  if (!celebrity) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Search size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <p style={{ margin: 0 }}>Celebrity not found</p>
        <button onClick={() => router.push('/')} className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to search</button>
      </div>
    </>
  )

  return (
    <>
      <Head>
        <title>{celebrity.name} — Spialr</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: celebrity.hide_search ? 800 : 600, margin: '0 auto', padding: '24px 20px 80px', width: '100%' }}>
        {/* Back */}
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, cursor: 'pointer', padding: 0 }}>
          ← Back to Search
        </button>



        {/* Profile Header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28 }}>
          {/* Avatar (Squircle Shape preserved) */}
          <div style={{
            width: 90, height: 90, borderRadius: 16, background: 'var(--surface2)', border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800,
            overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', flexShrink: 0
          }}>
            {celebrity.photo_url ? (
              <img src={celebrity.photo_url} alt={celebrity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            ) : celebrity.name?.charAt(0).toUpperCase()}
          </div>

          {/* Name, Handle & Metadata */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 4,
              letterSpacing: '-0.02em'
            }}>
              {celebrity.name}
            </h1>
            {celebrity.instagram_handle && (
              <div style={{ 
                fontSize: 15, 
                color: 'var(--text-muted)', 
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                marginBottom: 8 
              }}>
                @{celebrity.instagram_handle}
              </div>
            )}
            {/* Inline Followers & Posts Metadata */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14.5, color: 'var(--text-dim)', fontWeight: 600 }}>
                <strong>{formatCount(celebrity.followers_count)}</strong> followers
              </span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-bright)' }} />
              <span style={{ fontSize: 14.5, color: 'var(--text-dim)', fontWeight: 600 }}>
                <strong>{formatCount(celebrity.posts_count || postsCount)}</strong> posts
              </span>
            </div>
          </div>
        </div>

        {/* Account Insights (Premium Analytics Cards) */}
        {(celebrity.total_reel_views || celebrity.total_reel_likes || celebrity.total_post_likes || celebrity.total_comments || celebrity.total_shares || celebrity.total_reposts) ? (
          <div className="analytics-section">
            <h3 className="analytics-title">
              <TrendingUp size={18} strokeWidth={2.5} /> Account Insights
            </h3>

            <div className="analytics-grid-three">
              {/* Card 1: Reel Views */}
              <div className="analytics-card-compact analytics-card-views">
                <Eye size={20} strokeWidth={2} style={{ color: '#ff6b35', marginBottom: 8 }} />
                <div className="analytics-card-num-compact gradient-text">
                  {formatCount(celebrity.total_reel_views)}
                </div>
                <div className="analytics-card-label-compact">
                  Reel Views
                </div>
              </div>

              {/* Card 2: Reel Likes */}
              <div className="analytics-card-compact analytics-card-reel-likes">
                <Heart size={20} strokeWidth={2} style={{ color: '#ff2a5f', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_reel_likes)}
                </div>
                <div className="analytics-card-label-compact">
                  Reel Likes
                </div>
              </div>

              {/* Card 3: Post Likes */}
              <div className="analytics-card-compact analytics-card-post-likes">
                <ThumbsUp size={20} strokeWidth={2} style={{ color: '#ffa751', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_post_likes)}
                </div>
                <div className="analytics-card-label-compact">
                  Post Likes
                </div>
              </div>

              {/* Card 4: Total Comments */}
              <div className="analytics-card-compact analytics-card-comments">
                <MessageSquare size={20} strokeWidth={2} style={{ color: '#8f00ff', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_comments)}
                </div>
                <div className="analytics-card-label-compact">
                  Total Comments
                </div>
              </div>

              {/* Card 5: Total Shares */}
              <div className="analytics-card-compact analytics-card-shares">
                <Share2 size={20} strokeWidth={2} style={{ color: '#2ec4b6', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_shares)}
                </div>
                <div className="analytics-card-label-compact">
                  Total Shares
                </div>
              </div>

              {/* Card 6: Total Repost */}
              <div className="analytics-card-compact analytics-card-reposts">
                <Repeat2 size={20} strokeWidth={2} style={{ color: '#10b981', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_reposts)}
                </div>
                <div className="analytics-card-label-compact">
                  Total Repost
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tabs Navigation or Beautiful Divider */}
        {celebrity.hide_search ? (
          <div style={{
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
            margin: '24px 0 32px',
            opacity: 0.8
          }} />
        ) : (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <button 
              onClick={() => setActiveTab('posts')}
              style={{ 
                flex: 1, padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: activeTab === 'posts' ? 'var(--text)' : 'var(--text-muted)',
                borderBottom: activeTab === 'posts' ? '2px solid var(--text)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Posts
            </button>
            <button 
              onClick={() => setActiveTab('playlists')}
              style={{ 
                flex: 1, padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: activeTab === 'playlists' ? 'var(--text)' : 'var(--text-muted)',
                borderBottom: activeTab === 'playlists' ? '2px solid var(--text)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Playlists
            </button>
          </div>
        )}


        {activeTab === 'posts' && (
          <div className="fade-in">
            {/* Search within posts */}
            {!celebrity.hide_search && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    className="input-field"
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && tagSearch.trim() && goResults({ search: tagSearch.trim() })}
                    placeholder="Search any key word for Post..."
                    style={{ fontSize: 16, padding: '16px 110px 16px 20px', borderRadius: 16, background: 'var(--surface)', width: '100%' }}
                  />
                  <button
                    onClick={() => tagSearch.trim() && goResults({ search: tagSearch.trim() })}
                    disabled={!tagSearch.trim()}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: tagSearch.trim() ? 'var(--accent)' : 'var(--surface2)',
                      border: 'none',
                      borderRadius: 12,
                      color: tagSearch.trim() ? 'white' : 'var(--text-muted)',
                      padding: '10px 18px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: tagSearch.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: tagSearch.trim() ? '0 4px 12px rgba(225, 48, 108, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      opacity: tagSearch.trim() ? 1 : 0.6,
                    }}
                    onMouseEnter={e => {
                      if (tagSearch.trim()) {
                        e.currentTarget.style.filter = 'brightness(1.1)'
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.filter = 'brightness(1)'
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                    }}
                  >
                    <span>Search</span>
                    <Search size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Highlights Header */}
            <h3 className="analytics-title" style={{ marginTop: 8, marginBottom: 16 }}>
              <Sparkles size={16} strokeWidth={2.5} style={{ color: 'var(--accent)' }} /> Highlights
            </h3>

            {/* Filter Buttons Grid (2x2) */}
            <div className="profile-filter-grid" style={{ marginBottom: celebrity.hide_search ? 0 : 32 }}>
              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'most_liked' })}>
                <div className="profile-filter-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ff416c, #ff4b2b)', boxShadow: '0 4px 10px rgba(255, 65, 108, 0.25)' }}>
                  ❤️
                </div>
                <div className="profile-filter-info">
                  <span className="profile-filter-title">Most Liked</span>
                </div>
              </button>

              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'most_commented' })}>
                <div className="profile-filter-icon-wrapper" style={{ background: 'linear-gradient(135deg, #00b4db, #0083b0)', boxShadow: '0 4px 10px rgba(0, 180, 219, 0.25)' }}>
                  💬
                </div>
                <div className="profile-filter-info">
                  <span className="profile-filter-title">Most Commented</span>
                </div>
              </button>

              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'most_viewed' })}>
                <div className="profile-filter-icon-wrapper" style={{ background: 'linear-gradient(135deg, #e040fb, #651fff)', boxShadow: '0 4px 10px rgba(224, 64, 251, 0.25)' }}>
                  👁️
                </div>
                <div className="profile-filter-info">
                  <span className="profile-filter-title">Most Viewed</span>
                </div>
              </button>

              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'first_post' })}>
                <div className="profile-filter-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ffe259, #ffa751)', boxShadow: '0 4px 10px rgba(255, 167, 81, 0.25)' }}>
                  ⭐
                </div>
                <div className="profile-filter-info">
                  <span className="profile-filter-title">First Post</span>
                </div>
              </button>
            </div>

            {/* Description removed from here, placed at the end below timeline */}

            {!celebrity.hide_search && (
              <>
                <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 32 }} />

                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-display)' }}>Find by Timeline</h3>

                {/* Date Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>Select Specific Date</label>
                    <input type="date" className="input-field" onChange={e => e.target.value && goResults({ date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>Select Month-Year</label>
                    <input type="month" className="input-field" onChange={e => e.target.value && goResults({ month: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12 }} />
                  </div>
                </div>
                
                <div className="card" style={{ padding: '20px', borderRadius: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 16, fontWeight: 600 }}>Search Date Range</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Start Date</label>
                      <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', borderRadius: 8 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>End Date</label>
                      <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', borderRadius: 8 }} />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 8 }}
                    onClick={() => {
                      if (dateFrom || dateTo) goResults({ start: dateFrom, end: dateTo })
                    }}
                    disabled={!dateFrom && !dateTo}
                  >
                    Search Timeline
                  </button>
                </div>
              </>
            )}

            {celebrity.description && (
              <div style={{ marginBottom: 32, width: '100%' }}>
                <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '32px 0 24px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                  About {celebrity.name}
                </h3>
                <p style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>
                  {celebrity.description}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="fade-in">
            {!hasPlaylists ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Tv size={40} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ margin: 0 }}>No playlists available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {Object.entries(playlists).map(([title, pList]) => (
                  <div key={title} style={{ cursor: 'pointer' }} onClick={() => goResults({ playlist: title })}
                    onMouseEnter={e => {
                      const img = e.currentTarget.querySelector('.playlist-img')
                      if (img) img.style.transform = 'scale(1.08)'
                      e.currentTarget.lastElementChild.style.color = 'var(--accent)'
                      e.currentTarget.firstElementChild.style.borderColor = 'var(--border-bright)'
                      e.currentTarget.firstElementChild.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={e => {
                      const img = e.currentTarget.querySelector('.playlist-img')
                      if (img) img.style.transform = 'scale(1)'
                      e.currentTarget.lastElementChild.style.color = 'var(--text)'
                      e.currentTarget.firstElementChild.style.borderColor = 'var(--border)'
                      e.currentTarget.firstElementChild.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Thumbnail box */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      background: 'var(--surface2)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      marginBottom: 16,
                      border: '1px solid var(--border)',
                      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    }}>
                      {/* Gradient or Image Background */}
                      {pList.find(p => p.playlist_cover_url)?.playlist_cover_url ? (
                        <img 
                          className="playlist-img"
                          src={pList.find(p => p.playlist_cover_url).playlist_cover_url} 
                          alt={title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s var(--spring)' }} 
                        />
                      ) : (
                        <div className="playlist-img" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1f1c2c, #928DAB)', transition: 'transform 0.5s var(--spring)' }} />
                      )}
                      
                      {/* Overlay for count */}
                      <div style={{
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0, width: '40%',
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', gap: 8, backdropFilter: 'blur(4px)'
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 700 }}>{pList.length}</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </div>
                    </div>
                    {/* Title and link */}
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)', transition: 'color 0.2s', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>View full playlist</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
