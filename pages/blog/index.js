import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { BookOpen, Search, ArrowRight, Clock, Calendar, User, Sparkles, Tag, TrendingUp } from 'lucide-react'
import { getAllPosts, getAllCategories } from '../../data/blogs'

export default function BlogIndex({ posts, categories }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch = searchQuery.trim() === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const featuredPost = posts[0]

  return (
    <>
      <Head>
        <title>Spialr Blog &amp; Insights — Social Media Analytics, Growth &amp; Algorithm Guides</title>
        <meta 
          name="description" 
          content="Explore data-backed articles, creator economy guides, engagement rate benchmarks, and Instagram algorithm analyses written by the Spialr research team." 
        />
        <link rel="canonical" href="https://spialr.com/blog" key="canonical" />

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spialr.com/blog" key="og:url" />
        <meta property="og:title" content="Spialr Blog & Insights — Social Media Analytics & Creator Guides" />
        <meta property="og:description" content="Explore data-backed articles, creator economy guides, engagement rate benchmarks, and Instagram algorithm analyses." />
        <meta property="og:site_name" content="Spialr" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spialr Blog & Insights — Social Media Analytics & Creator Guides" />
        <meta name="twitter:description" content="Explore data-backed articles, creator economy guides, engagement rate benchmarks, and Instagram algorithm analyses." />

        {/* Schema.org Blog JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: 'Spialr Blog & Insights',
              description: 'In-depth social media analytics, creator benchmarking, and algorithmic research.',
              url: 'https://spialr.com/blog',
              publisher: {
                '@type': 'Organization',
                name: 'Spialr Analytics',
                url: 'https://spialr.com/',
                logo: 'https://spialr.com/favicon.png'
              }
            })
          }}
        />
      </Head>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header Hero */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 100,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 16
          }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span>Spialr Editorial &amp; Research</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 16,
            color: 'var(--text)'
          }}>
            Social Analytics &amp; <span className="gradient-text">Creator Insights</span>
          </h1>

          <p style={{
            fontSize: 17,
            color: 'var(--text-dim)',
            lineHeight: 1.6,
            margin: '0 auto'
          }}>
            In-depth guides, empirical algorithm analyses, engagement rate benchmarks, and strategic frameworks designed for creators, marketers, and social data analysts.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search 20+ guides by keyword, topic, or tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Categories Pill List */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none'
          }}>
            {categories.map(cat => {
              const active = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-dim)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Featured Hero Article (shown when no active search) */}
        {!searchQuery && selectedCategory === 'All' && featuredPost && (
          <div style={{ marginBottom: 48 }}>
            <Link href={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none' }}>
              <div 
                className="card"
                style={{
                  padding: 'clamp(24px, 4vw, 40px)',
                  borderRadius: 20,
                  cursor: 'pointer',
                  border: '1px solid var(--border-bright, var(--border))',
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(225, 48, 108, 0.1)',
                    color: 'var(--accent)'
                  }}>
                    Featured Article · {featuredPost.category}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /> {featuredPost.readTime}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> {featuredPost.publishedAt}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
                  fontWeight: 800,
                  color: 'var(--text)',
                  lineHeight: 1.25,
                  margin: 0
                }}>
                  {featuredPost.title}
                </h2>

                <p style={{
                  fontSize: 16,
                  color: 'var(--text-dim)',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {featuredPost.excerpt}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} /> By {featuredPost.author.name}
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    Read Full Guide <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Article Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24
        }}>
          {filteredPosts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{
                  height: '100%',
                  padding: 24,
                  borderRadius: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: 'var(--surface2)',
                      color: 'var(--accent)'
                    }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {post.readTime}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text)',
                    lineHeight: 1.35,
                    marginBottom: 10
                  }}>
                    {post.title}
                  </h3>

                  <p style={{
                    fontSize: 13.5,
                    color: 'var(--text-dim)',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {post.description}
                  </p>
                </div>

                <div style={{
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {post.publishedAt}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    Read Article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state if search finds nothing */}
        {filteredPosts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16
          }}>
            <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              No guides match your search
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
              Try searching with a different keyword or select "All" categories to view all 20 guides.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}
              className="btn btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Bottom Benchmarking CTA Box */}
        <div style={{
          marginTop: 64,
          padding: '36px 32px',
          borderRadius: 20,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(225, 48, 108, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <TrendingUp size={24} />
          </div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0
          }}>
            Explore Real-Time Social Media Leaderboards
          </h3>
          <p style={{
            fontSize: 15,
            color: 'var(--text-dim)',
            maxWidth: 600,
            lineHeight: 1.6,
            margin: 0
          }}>
            Put theory into practice. Benchmark live follower growth velocity, explore 24-hour viral reels, and search thousands of indexed creator profiles.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/live">
              <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                View Live Standings
              </button>
            </Link>
            <Link href="/trending">
              <button className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: 14 }}>
                View Trending Reels
              </button>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const posts = getAllPosts()
  const categories = getAllCategories()

  return {
    props: {
      posts,
      categories
    }
  }
}
