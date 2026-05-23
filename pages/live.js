import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'

const getOrdinal = (n) => {
  if (!n) return ''
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function LivePage() {
  const [activeTab, setActiveTab] = useState('most_followed') // 'most_followed' or 'viral_reels'
  const [liveData, setLiveData] = useState({ live_date: '', most_followed: [], viral_reels: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

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

      <Navbar />

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
                }}>📈</span>
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
          maxWidth: 420,
          margin: '0 auto 32px'
        }}>
          <button
            onClick={() => { setActiveTab('most_followed'); setSearchQuery(''); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              background: activeTab === 'most_followed' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'most_followed' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'most_followed' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6, flexShrink: 0 }}>
              <rect x="3" y="12" width="4" height="8" rx="1" fill="#4caf50" />
              <rect x="10" y="7" width="4" height="13" rx="1" fill="#f44336" />
              <rect x="17" y="3" width="4" height="17" rx="1" fill="#2196f3" />
              <line x1="2" y1="21" x2="22" y2="21" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Most Followed
          </button>
          <button
            onClick={() => { setActiveTab('viral_reels'); setSearchQuery(''); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              background: activeTab === 'viral_reels' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'viral_reels' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'viral_reels' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6, flexShrink: 0 }}>
              <path d="M12 2C8 6.5 8 11.5 10 13c.5-.5 1-1.5 1-2.5 1.5 1.5 2 3.5 1.5 5.5-.5 2 1.5 3.5 3.5 3 2.5-.5 4.5-3 3-6.5-1.5-3.5-5-4.5-5-7.5-.5 1.5-1 2.5-2 3.5C11.5 6 12 3.5 12 2z" fill="#ff9800" />
              <path d="M12 14c-1 1-1.5 2-1.5 3s.5 2.5 1.5 2.5 2.5-1.5 2-3.5c-.2-.5-1-1.5-2-2z" fill="#f44336" />
            </svg>
            Viral Reels Today
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

            {/* Category Filter */}
            {liveData.most_followed.length > 0 && (() => {
              const categories = ['All', 'Actor', 'Influencers', 'Creator', 'Singer', 'Sports', 'Politicians', 'Meme Pages']
              // Add any other custom categories from the database dynamically
              liveData.most_followed.forEach(p => {
                if (p.category) {
                  const cleaned = p.category.trim()
                  if (cleaned && !categories.some(c => c.toLowerCase() === cleaned.toLowerCase())) {
                    categories.push(cleaned)
                  }
                }
              })

              return (
                <div className="no-scrollbar" style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  marginBottom: 12,
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {categories.map((cat) => {
                    const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '100px',
                          fontSize: 12,
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                          background: isActive ? 'var(--gradient-subtle)' : 'var(--surface)',
                          color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 2px 6px rgba(225, 48, 108, 0.1)' : 'none'
                        }}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {liveData.most_followed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--surface2)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>📊</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No profiles yet</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Check back later for update ranks.</p>
              </div>
            ) : (() => {
              const filtered = liveData.most_followed.filter(p => {
                const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesCategory = selectedCategory.toLowerCase() === 'all' || 
                  p.category?.toLowerCase() === selectedCategory.toLowerCase()
                return matchesSearch && matchesCategory
              })

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No profiles match the filter criteria
                  </div>
                )
              }
              return (
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    background: 'var(--surface2)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <div style={{ width: 60, textAlign: 'center' }}>Rank</div>
                    <div style={{ flex: 1, paddingLeft: 12 }}>Account</div>
                    <div style={{ width: 140, textAlign: 'right' }}>Followers</div>
                  </div>

                  {/* Table Body */}
                  {filtered.map((profile) => {
                    const rank = liveData.most_followed.findIndex(p => p.id === profile.id) + 1
                    return (
                      <div key={profile.id} className="table-row-hover" style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.2s ease',
                      }}>
                        {/* Rank Position */}
                        <div style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
                          fontFamily: 'var(--font-display)',
                          width: 60,
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          #{rank}
                        </div>

                        {/* Profile Info (Avatar + Name) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                          paddingLeft: 12
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--gradient)',
                            padding: 1.5,
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
                              fontSize: 13,
                              overflow: 'hidden'
                            }}>
                              {profile.photo_url ? (
                                <img src={profile.photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                profile.name?.charAt(0)
                              )}
                            </div>
                          </div>

                          {/* Name & Category tag */}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: 'var(--text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {profile.name}
                            </span>
                            {profile.category && (
                              <span style={{
                                alignSelf: 'flex-start',
                                fontSize: 9,
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                background: 'var(--surface2)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginTop: 2,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {profile.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Followers Count */}
                        <div style={{
                          width: 140,
                          textAlign: 'right',
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          flexShrink: 0
                        }}>
                          {profile.followers_text?.trim() ? profile.followers_text : (profile.followers_count >= 1000000 ? `${(profile.followers_count / 1000000).toFixed(1).replace(/\.0$/, '')}M` : profile.followers_count?.toLocaleString() || '—')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
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
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 16,
                background: 'var(--surface)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div style={{ width: 60, textAlign: 'center' }}>Rank</div>
                  <div style={{ flex: 1, paddingLeft: 12 }}>Reel / Video</div>
                  <div style={{ width: 100, textAlign: 'right' }}>Link</div>
                </div>

                {/* Table Body */}
                {liveData.viral_reels.map((reel, idx) => {
                  const rank = idx + 1
                  return (
                    <a
                      key={reel.id}
                      href={reel.instagram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-row-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.2s ease',
                        textDecoration: 'none'
                      }}
                    >
                      {/* Rank Position */}
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-display)',
                        width: 60,
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        #{rank}
                      </div>

                      {/* Reel Info (Thumbnail + Title/Creator) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: 12
                      }}>
                        {/* Thumbnail */}
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                          position: 'relative',
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
                                background: 'rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <span style={{ fontSize: 10, color: '#ffffff' }}>▶</span>
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: 16 }}>🎬</span>
                          )}
                        </div>

                        {/* Title & Creator Name */}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {reel.title}
                          </span>
                          {reel.creator_name && (
                            <span style={{
                              alignSelf: 'flex-start',
                              fontSize: 10,
                              fontWeight: 500,
                              color: 'var(--text-dim)',
                              marginTop: 2
                            }}>
                              {reel.creator_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Link */}
                      <div style={{
                        width: 100,
                        textAlign: 'right',
                        fontWeight: 600,
                        fontSize: 12,
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-body)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4
                      }}>
                        <span>Watch</span>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        .live-pulse {
          animation: pulse-scale 1.8s infinite;
        }

        .table-row-hover:hover {
          background-color: var(--surface2) !important;
        }

        .table-row-hover:last-child {
          border-bottom: none !important;
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
