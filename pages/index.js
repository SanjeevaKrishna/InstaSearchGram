import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import CelebrityCard from '../components/CelebrityCard'
import Navbar from '../components/Navbar'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [featured, setFeatured] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    // Load featured celebrities on mount
    setLoadingFeatured(true)
    fetch('/api/celebrities?featured=true')
      .then(r => r.json())
      .then(d => {
        setFeatured(d.celebrities || [])
        setLoadingFeatured(false)
      })
      .catch(() => {
        setLoadingFeatured(false)
      })
  }, [])

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/celebrities?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.celebrities || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.trim().length >= 1) {
      debounceRef.current = setTimeout(() => handleSearch(val), 300)
      setShowSuggestions(true)
    } else {
      setResults([])
      setShowSuggestions(false)
    }
  }

  return (
    <>
      <Head>
        <title>Spialr - Most Followed Instagram Accounts in India.</title>
        <meta name="description" content="Discover 1000s of top Instagram accounts ordered by followers count. Search and find Instagram posts, reels, and trending profiles in India and globally — without endless scrolling." />
        <meta name="keywords" content="top 100 instagram accounts in india, most followed instagram accounts, top instagram creators, spialr, instagram follower rankings, famous instagram profiles, search instagram reels, list of top instagram accounts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        {/* Hero */}
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'var(--gradient-subtle)',
            border: '1px solid rgba(224,64,251,0.3)',
            fontSize: 13,
            color: 'var(--accent)',
            marginBottom: 24,
            fontWeight: 500,
          }}>
            ✨ Find any creator's best posts instantly
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 7vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}>
            Stop Scrolling.<br />
            <span className="gradient-text">Start Finding.</span>
          </h1>

          <p style={{
            fontSize: 17,
            color: 'var(--text-dim)',
            maxWidth: 520,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Search for any celebrity or creator, search to find specific posts, or discover their most liked, most commented, or timeline-ordered posts.
          </p>

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border-bright)',
              borderRadius: 14,
              padding: '4px 4px 4px 16px',
              gap: 8,
              transition: 'border-color 0.2s',
            }}
            onFocus={() => {}} 
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
              <input
                ref={searchRef}
                className="input-field"
                value={query}
                onChange={handleInput}
                placeholder="Search Virat Kohli, Deepika Padukone..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  flex: 1,
                  padding: '10px 0',
                }}
                onFocus={() => query && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {loading && <div className="spinner" style={{ flexShrink: 0, marginRight: 8 }} />}
              {query && !loading && (
                <button
                  onClick={() => { setQuery(''); setResults([]); setShowSuggestions(false) }}
                  style={{
                    background: 'var(--surface2)',
                    border: 'none',
                    color: 'var(--text-muted)',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    fontSize: 16,
                    flexShrink: 0,
                    marginRight: 4,
                  }}
                >×</button>
              )}
            </div>

            {/* Results dropdown / list */}
            {showSuggestions && results.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border-bright)',
                borderRadius: 12,
                overflow: 'hidden',
                zIndex: 50,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              }}>
                {results.map(cel => (
                  <a key={cel.id} href={`/celebrity/${cel.slug}`} style={{ display: 'block' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        transition: 'background 0.15s',
                        borderBottom: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 16,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}>
                        {cel.photo_url ? (
                          <img src={cel.photo_url} alt={cel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                        ) : (
                          cel.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{cel.name}</div>
                        {cel.instagram_handle && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{cel.instagram_handle}</div>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>View →</span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {showSuggestions && query.trim() && !loading && results.length === 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
                zIndex: 50,
              }}>
                No celebrity found for "{query}"
              </div>
            )}
          </div>
        </div>

        {/* Loading state - loading featured */}
        {loadingFeatured && !query && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: 16
          }}>
            <div className="spinner" />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Please wait, data is loading...</div>
          </div>
        )}

        {/* Featured Celebrities */}
        {!loadingFeatured && !query && featured.length > 0 && (
          <div className="fade-in">
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
              color: 'var(--text-dim)',
              letterSpacing: '-0.01em',
            }}>
              Popular 🔥
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featured.map(c => <CelebrityCard key={c.id} celebrity={c} />)}
            </div>
          </div>
        )}

        {/* Empty state - no featured */}
        {!loadingFeatured && featured.length === 0 && !query && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 15 }}>No celebrities added yet.<br />Add some from the admin panel!</p>
          </div>
        )}
      </main>
    </>
  )
}
