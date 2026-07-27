import { useState, useRef } from 'react'
import Head from 'next/head'
import CelebrityCard from '../components/CelebrityCard'
import Navbar from '../components/Navbar'
import { Sparkles, Search, Flame } from 'lucide-react'

const STATIC_FEATURED = [
  {
    id: "027bbe3a-5bb4-4b78-b68c-db7168be7762",
    name: "Virat Kohli",
    slug: "virat-kohli",
    instagram_handle: "virat.kohli",
    followers_count: 273000000,
    posts_count: 1050,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1779636125/insta_search_celebrities/e3peepd1uzfwztqlx7dp.jpg"
  },
  {
    id: "0798e19c-aefc-4c9d-a4de-c8ba60fe352d",
    name: "Narendra Modi",
    slug: "narendra-modi",
    instagram_handle: "narendramodi",
    followers_count: 104000000,
    posts_count: 1000,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1779890253/insta_search_celebrities/aibrzfxxxqpxqnnwpdxz.jpg"
  },
  {
    id: "shraddha-kapoor-static",
    name: "Shraddha Kapoor",
    slug: "shraddha-kapoor",
    instagram_handle: "shraddhakapoor",
    followers_count: 94500000,
    posts_count: 2050,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780060940/insta_search_celebrities/r6rpfuowqbx9uypvwyk2.jpg"
  },
  {
    id: "21e911e1-feb1-4801-a08a-d8621806b722",
    name: "Priyanka Chopra",
    slug: "priyanka-chopra",
    instagram_handle: "priyankachopra",
    followers_count: 92900000,
    posts_count: 4063,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780047989/insta_search_celebrities/idindrsvqjnjzzuy26wi.jpg"
  },
  {
    id: "70945bdb-142f-4750-8de4-11981fb4539b",
    name: "Alia Bhatt",
    slug: "alia-bhatt",
    instagram_handle: "aliabhatt",
    followers_count: 85600000,
    posts_count: 2231,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780061010/insta_search_celebrities/v0pdtzczf12ynrz7jyph.jpg"
  },
  {
    id: "katrina-kaif-static",
    name: "Katrina Kaif",
    slug: "katrina-kaif",
    instagram_handle: "katrinakaif",
    followers_count: 80400000,
    posts_count: 1100,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780060959/insta_search_celebrities/e0wz8sifjtzspuox1d2q.jpg"
  },
  {
    id: "deepika-padukone-static",
    name: "Deepika Padukone",
    slug: "deepika-padukone",
    instagram_handle: "deepikapadukone",
    followers_count: 80000000,
    posts_count: 1200,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780060993/insta_search_celebrities/bivk8yzn0uuhq8m8n9n6.jpg"
  },
  {
    id: "2577f8c2-dc39-4ba3-b705-90e1ba0037c4",
    name: "Salman Khan",
    slug: "salman-khan",
    instagram_handle: "beingsalmankhan",
    followers_count: 72100000,
    posts_count: 1604,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780046255/insta_search_celebrities/kdkigwcnyc1n8u5m5szd.jpg"
  },
  {
    id: "urvashi-rautela-static",
    name: "Urvashi Rautela",
    slug: "urvashi-rautela",
    instagram_handle: "urvashirautela",
    followers_count: 71800000,
    posts_count: 1800,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780061044/insta_search_celebrities/zhyphv0pdtzczf12ynrz.jpg"
  },
  {
    id: "jacqueline-fernandez-static",
    name: "Jacqueline Fernandez",
    slug: "jacqueline-fernandez",
    instagram_handle: "jacquelinef143",
    followers_count: 70500000,
    posts_count: 1500,
    photo_url: "https://res.cloudinary.com/dpbzdndia/image/upload/v1780061028/insta_search_celebrities/u5m5szdkdkigwcnyc1n8.jpg"
  }
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" type="image/png" />
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
            }}
            onFocus={() => {}} 
            >
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

        {/* Featured Celebrities */}
        {!query && STATIC_FEATURED.length > 0 && (
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
              {STATIC_FEATURED.map(c => <CelebrityCard key={c.id} celebrity={c} />)}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
