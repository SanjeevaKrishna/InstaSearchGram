import { useState, useRef } from 'react'
import Head from 'next/head'
import CelebrityCard from '../components/CelebrityCard'
import { Sparkles, Search, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Home({ featured = [], profileCount = 'thousands of' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const searchRef = useRef(null)

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/celebrities?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.celebrities || [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
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
        <meta name="description" content={`Discover ${featured.length > 0 ? profileCount : 'verified'} top Instagram accounts ordered by followers count. Search and find Instagram posts, reels, and trending profiles in India and globally — without endless scrolling.`} />
        <meta name="keywords" content="top 100 instagram accounts in india, most followed instagram accounts, top instagram creators, spialr, instagram follower rankings, famous instagram profiles, search instagram reels, list of top instagram accounts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>

      
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
            <Sparkles size={14} /> Find any creator's best posts instantly
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
            Find any celebrity or creator dashboard, and discover their most liked, most commented, or timeline-ordered posts.
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
            }}>
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
              {searching && <div className="spinner" style={{ flexShrink: 0, marginRight: 8 }} />}
              {query && !searching && (
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

            {/* Search results dropdown */}
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

            {showSuggestions && query.trim() && !searching && results.length === 0 && (
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
                No celebrity found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Featured Celebrities — rendered from real server-side data */}
        {!query && featured.length > 0 && (
          <div className="fade-in">
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              margin: '32px 0 16px',
              color: 'var(--text-dim)',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              Popular <Flame size={18} style={{ color: '#ff6b35' }} />
            </h2>
            
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text-dim)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img 
                  src="/logo.png" 
                  alt="Spialr Logo" 
                  style={{ 
                    width: 22, 
                    height: 22, 
                    borderRadius: 5, 
                    flexShrink: 0,
                    border: '1px solid var(--border)'
                  }} 
                />
                <span style={{ 
                  fontWeight: 800, 
                  fontSize: 15, 
                  color: 'var(--text)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em'
                }}>
                  Spi<span style={{ color: 'var(--accent)' }}>alr</span>
                </span>
              </div>
              <p style={{ margin: 0 }}>
                Spialr tracks lifetime performance insights across verified creator profiles. Unlike other directories that rely on official APIs or automated scraping with 90-day limitations, <strong>our data is meticulously compiled manually</strong>. We hand-count likes, views, comments, and reposts across thousands of posts per profile to provide an unrestricted, lifetime view of digital influence.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featured.map(c => <CelebrityCard key={c.id} celebrity={c} />)}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

// Server-side: fetch real featured creators from Supabase so the HTML source
// already contains all profile cards and real photo_url values.
// No loading state, no useEffect, no client-side fetch for this list.
export async function getServerSideProps() {
  try {
    if (!supabase) {
      return { props: { featured: [] } }
    }

    const [{ data, error }, { count }] = await Promise.all([
      supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url')
        .neq('hide_search', true)
        .order('order_index', { ascending: true })
        .order('followers_count', { ascending: false })
        .limit(12),
      supabase
        .from('celebrities')
        .select('id', { count: 'exact', head: true })
        .neq('hide_search', true)
    ])

    if (error) {
      console.error('Homepage getServerSideProps error:', error)
      return { props: { featured: [] } }
    }

    return { props: { featured: data || [], profileCount: count || 'thousands of' } }
  } catch (err) {
    console.error('Homepage getServerSideProps exception:', err)
    return { props: { featured: [] } }
  }
}
