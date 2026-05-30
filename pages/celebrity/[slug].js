import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../components/Navbar'
import PostCard from '../../components/PostCard'

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
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
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
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p>Celebrity not found</p>
        <button onClick={() => router.push('/')} className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to search</button>
      </div>
    </>
  )

  return (
    <>
      <Head>
        <title>{celebrity.name} — InstaSearch</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Back */}
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, cursor: 'pointer', padding: 0 }}>
          ← Back to Search
        </button>



        {/* Profile Header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32, justifyContent: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: 16, background: 'var(--surface2)', border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800,
            overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            {celebrity.photo_url ? (
              <img src={celebrity.photo_url} alt={celebrity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            ) : celebrity.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', borderRadius: 12, minWidth: 90 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{formatCount(celebrity.followers_count)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followers</div>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center', borderRadius: 12, minWidth: 90 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{celebrity.posts_count || postsCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posts-NO</div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
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

        {activeTab === 'posts' && (
          <div className="fade-in">
            {/* Search within posts */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  value={tagSearch}
                  onChange={e => setTagSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && tagSearch.trim() && goResults({ search: tagSearch.trim() })}
                  placeholder="Search any key word for Post and press Enter"
                  style={{ fontSize: 16, padding: '16px 48px 16px 20px', borderRadius: 16, background: 'var(--surface)' }}
                />
                <span style={{ position: 'absolute', right: 20, top: 16, fontSize: 18, color: 'var(--text-muted)' }}>🔍</span>
              </div>
            </div>

            {/* Filter Buttons Grid (2x2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              <button className="btn btn-ghost" onClick={() => goResults({ filter: 'most_liked' })} style={{ justifyContent: 'center', padding: '16px', borderRadius: 12, fontSize: 15, background: 'var(--surface)' }}>❤️ Most liked</button>
              <button className="btn btn-ghost" onClick={() => goResults({ filter: 'most_commented' })} style={{ justifyContent: 'center', padding: '16px', borderRadius: 12, fontSize: 15, background: 'var(--surface)' }}>💬 Most commented</button>
              <button className="btn btn-ghost" onClick={() => goResults({ filter: 'most_viewed' })} style={{ justifyContent: 'center', padding: '16px', borderRadius: 12, fontSize: 15, background: 'var(--surface)' }}>👁 Most viewed</button>
              <button className="btn btn-ghost" onClick={() => goResults({ filter: 'first_post' })} style={{ justifyContent: 'center', padding: '16px', borderRadius: 12, fontSize: 15, background: 'var(--surface)' }}>⭐ First Post</button>
            </div>

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


          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="fade-in">
            {!hasPlaylists ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📺</div>
                No playlists available yet.
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
