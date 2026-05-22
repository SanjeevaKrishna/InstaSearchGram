import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function LivePage() {
  const [activeTab, setActiveTab] = useState('most_followed') // 'most_followed' or 'viral_reels'
  const [liveData, setLiveData] = useState({ live_date: '', most_followed: [], viral_reels: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/live')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load live data')
        return res.json()
      })
      .then((data) => {
        setLiveData({
          live_date: data.live_date || '',
          most_followed: data.most_followed || [],
          viral_reels: data.viral_reels || [],
        })
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Head>
        <title>Social Standings — InstaSearch</title>
        <meta name="description" content="Check out the live leaderboards of most followed accounts and trending viral reels today, updated regularly." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={{ maxWidth: 850, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header section with live pulse indicator and manual date */}
        <div className="fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 32,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            {/* Title with Pulse Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 5vw, 36px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Social <span className="gradient-text">Standings</span>
              </h1>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(225, 48, 108, 0.1)',
                padding: '4px 10px',
                borderRadius: '100px',
                border: '1px solid rgba(225, 48, 108, 0.2)'
              }}>
                <span className="live-pulse" style={{
                  fontSize: 13,
                  display: 'inline-block',
                }}>⚡</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Live</span>
              </div>
            </div>

            {/* Date Badge */}
            {liveData.live_date && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-dim)',
              }}>
                <span>📅</span>
                <span>{liveData.live_date}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            List of most followed Instagram accounts
          </p>
        </div>

        {/* Subtabs Selection */}
        <div className="fade-in" style={{
          display: 'flex',
          background: 'var(--surface2)',
          borderRadius: '14px',
          padding: 4,
          marginBottom: 32,
          gap: 4,
          border: '1px solid var(--border)',
        }}>
          <button
            onClick={() => { setActiveTab('most_followed'); setSearchQuery(''); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              background: activeTab === 'most_followed' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'most_followed' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'most_followed' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>📊</span> Most Followed
          </button>
          <button
            onClick={() => { setActiveTab('viral_reels'); setSearchQuery(''); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              background: activeTab === 'viral_reels' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'viral_reels' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'viral_reels' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🔥</span> Viral Reels Today
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div className="spinner" />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Fetching latest live updates...</div>
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(255,82,82,0.05)',
            border: '1px solid rgba(255,82,82,0.15)',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            color: '#d32f2f',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Unable to Load Live Data</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{error}</p>
          </div>
        ) : activeTab === 'most_followed' ? (
          /* MOST FOLLOWED TAB */
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search Input */}
            {liveData.most_followed.length > 0 && (
              <div style={{
                position: 'relative',
                marginBottom: 4,
              }}>
                <span style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search profiles by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{
                    paddingLeft: 44,
                    width: '100%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 14,
                    height: 46,
                    color: 'var(--text)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 0
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {liveData.most_followed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--surface2)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>📊</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No profiles yet</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Check back later for update ranks.</p>
              </div>
            ) : (() => {
              const filtered = liveData.most_followed.filter(p =>
                p.name?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No profiles match "{searchQuery}"
                  </div>
                )
              }
              return filtered.map((profile) => {
                const rank = liveData.most_followed.findIndex(p => p.id === profile.id) + 1
                return (
                  <div key={profile.id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 24px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Rank Position */}
                    <div style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-display)',
                      width: 32,
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      #{rank}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--gradient)',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 20,
                        overflow: 'hidden'
                      }}>
                        {profile.photo_url ? (
                          <img src={profile.photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          profile.name?.charAt(0)
                        )}
                      </div>
                    </div>

                    {/* Name details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 16,
                        color: 'var(--text)',
                        marginBottom: 0
                      }}>{profile.name}</h3>
                    </div>

                    {/* Followers Count Badge */}
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '30px',
                      background: 'var(--gradient-subtle)',
                      border: '1px solid rgba(225, 48, 108, 0.15)',
                      color: 'var(--accent)',
                      fontWeight: 800,
                      fontSize: 14,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.02em',
                      boxShadow: '0 2px 8px rgba(225, 48, 108, 0.05)'
                    }}>
                      {profile.followers_text || `${(profile.followers_count / 1000000).toFixed(1)}M`}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        ) : (
          /* VIRAL REELS TAB */
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {liveData.viral_reels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--surface2)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🔥</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No viral reels today</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Trending video links will update here.</p>
              </div>
            ) : (
              liveData.viral_reels.map((reel, idx) => {
                const rank = idx + 1
                return (
                  <a
                    key={reel.id}
                    href={reel.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 18,
                      padding: 16,
                      textDecoration: 'none',
                      transition: 'all 0.2s var(--spring)',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Rank Number */}
                    <div style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-display)',
                      width: 32,
                      textAlign: 'center'
                    }}>
                      #{rank}
                    </div>

                    {/* Reel Cover / Thumbnail with overlay play icon */}
                    <div style={{
                      position: 'relative',
                      width: 68,
                      height: 68,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {reel.photo_url ? (
                        <>
                          <img src={reel.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 18, color: '#ffffff' }}>▶</span>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 24 }}>🎬</span>
                      )}
                    </div>

                    {/* Reel Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--text)',
                        lineHeight: 1.4,
                        marginBottom: 4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {reel.title}
                      </h3>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}>
                        <span>Watch on Instagram</span>
                        <span>↗</span>
                      </div>
                    </div>
                  </a>
                )
              })
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
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
      `}</style>
    </>
  )
}
