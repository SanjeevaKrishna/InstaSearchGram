import { useState, useRef, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import CelebrityCard from '../components/CelebrityCard'
import { Sparkles, Search, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { proxyProfileImages } from '../lib/imageProxy'
import { getFeaturedLiveIds } from '../lib/liveFeatured'

export default function Home({ featured = [], profileCount = 'thousands of' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [liveResults, setLiveResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const searchRef = useRef(null)

  const allSearchResults = useMemo(() => {
    const combined = [...results, ...liveResults]
    const seen = new Set()
    return combined.filter(item => {
      const handle = (item.instagram_handle || item.slug || '').toLowerCase().trim()
      if (!handle || seen.has(handle)) return false
      seen.add(handle)
      return true
    })
  }, [results, liveResults])

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setResults([])
      setLiveResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/celebrities?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.celebrities || [])
      setLiveResults(data.liveProfiles || [])
    } catch {
      setResults([])
      setLiveResults([])
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
      setLiveResults([])
      setShowSuggestions(false)
    }
  }

  return (
    <>
      <Head>
        <title>Spialr - Most Followed Instagram Accounts in India</title>
        <meta name="description" content={`Discover ${featured.length > 0 ? profileCount : 'verified'} top Instagram accounts ordered by followers count. Search and find Instagram posts, reels, and trending profiles in India and globally — without endless scrolling.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://spialr.com" key="canonical" />
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
                  onClick={() => { setQuery(''); setResults([]); setLiveResults([]); setShowSuggestions(false) }}
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
            {showSuggestions && allSearchResults.length > 0 && (
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
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                maxHeight: 480,
                overflowY: 'auto',
              }}>
                {allSearchResults.map(cel => {
                  const slug = (cel.instagram_handle || cel.slug || '').toLowerCase().trim().replace(/\./g, '-')
                  return (
                    <Link key={cel.id + '_' + slug} href={`/profile/${slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
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
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: 'var(--gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 16,
                          flexShrink: 0,
                          overflow: 'hidden',
                          padding: 2,
                        }}>
                          {cel.photo_url ? (
                            <img src={cel.photo_url} alt={cel.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
                          ) : (
                            cel.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cel.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                            {cel.instagram_handle && <span>@{cel.instagram_handle}</span>}
                            {cel.followers_count ? <span>• {Number(cel.followers_count).toLocaleString()} followers</span> : null}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>View →</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {showSuggestions && query.trim() && !searching && results.length === 0 && liveResults.length === 0 && (
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
                No profiles found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Featured Celebrities & Live Profiles — rendered from real server-side data */}
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
            

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featured.map(c => <CelebrityCard key={c.id || c.slug || c.instagram_handle} celebrity={c} />)}
            </div>
          </div>
        )}

        {/* How Rankings Work Section */}
        <section style={{
          marginTop: 48,
          padding: '28px 24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text)',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em'
          }}>
            How Spialr Rankings Work
          </h2>
          <p style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            margin: '0 0 16px 0'
          }}>
            Spialr organizes public digital performance metrics across popular Instagram creators, actors, and digital personalities. Profile leaderboards are computed transparently based on total verified public follower standings, refreshed on a rolling schedule. We do not use private APIs or estimated follower counts for ranking. To inspect our data collection criteria and verification standards, read our full <Link href="/methodology" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>Methodology</Link>.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/live" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              View Live Leaderboard →
            </Link>
            <span style={{ color: 'var(--border)' }}>•</span>
            <Link href="/trending" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Explore Trending Content →
            </Link>
            <span style={{ color: 'var(--border)' }}>•</span>
            <Link href="/methodology" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Read Data Methodology →
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

// Server-side: fetch real featured creators and live profiles from Supabase so the HTML source
// already contains all profile cards and real photo_url values.
export async function getServerSideProps({ res }) {
  if (res) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  }
  try {
    if (!supabase) {
      return { props: { featured: [] } }
    }

    // 1. Fetch featured celebrities where is_featured = true
    let { data: featuredCelebs, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index')
      .neq('hide_search', true)
      .eq('is_featured', true)
      .order('order_index', { ascending: true })
      .order('followers_count', { ascending: false })
      .limit(10)

    // Fallback if none are marked is_featured
    if (!featuredCelebs || featuredCelebs.length === 0) {
      const fallback = await supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index')
        .neq('hide_search', true)
        .order('order_index', { ascending: true })
        .order('followers_count', { ascending: false })
        .limit(5)
      featuredCelebs = fallback.data || []
    }

    // 2. Fetch featured live profiles
    let featuredLive = []
    try {
      const liveIds = await getFeaturedLiveIds(supabase)
      if (liveIds && liveIds.length > 0) {
        const { data: liveData } = await supabase
          .from('most_followed')
          .select('id, name, instagram_handle, followers_count, photo_url, order_index')
          .in('id', liveIds)
          .limit(10)

        if (liveData) {
          featuredLive = liveData.map(item => ({
            ...item,
            slug: item.instagram_handle
              ? item.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
              : (item.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
          }))
        }
      }
    } catch (e) {
      console.warn('Live featured fetch error:', e.message)
    }

    // Combine featured items deduplicated by handle
    const seenHandles = new Set()
    const combinedFeatured = []
    for (const c of [...(featuredCelebs || []), ...featuredLive]) {
      const handle = (c.instagram_handle || c.slug || '').toLowerCase().trim()
      if (handle && !seenHandles.has(handle)) {
        seenHandles.add(handle)
        combinedFeatured.push(c)
      }
    }

    const [{ count }] = await Promise.all([
      supabase
        .from('celebrities')
        .select('id', { count: 'exact', head: true })
        .neq('hide_search', true)
    ])

    return { props: { featured: proxyProfileImages(combinedFeatured), profileCount: count || 'thousands of' } }
  } catch (err) {
    console.error('Homepage getServerSideProps exception:', err)
    return { props: { featured: [] } }
  }
}
