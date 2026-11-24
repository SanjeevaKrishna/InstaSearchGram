import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Trophy, TrendingUp, Users, ArrowUpRight, Flame, ShieldCheck, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { proxyProfileImages } from '../../lib/imageProxy'

const CATEGORY_MAP = {
  'actors': {
    name: 'Actors',
    h1: 'Most Followed Instagram Actors in India',
    title: 'Top Instagram Actors in India - Follower Rankings | Spialr',
    description: 'Explore the most followed actors and film personalities on Instagram in India. Real-time follower counts, daily growth, and verified rankings.'
  },
  'singers': {
    name: 'Singers',
    h1: 'Most Followed Instagram Singers & Musicians',
    title: 'Top Instagram Singers & Musicians - Follower Rankings | Spialr',
    description: 'Discover the most followed vocalists, musicians, and singers on Instagram. Track verified follower statistics and growth velocity.'
  },
  'creators': {
    name: 'Creators',
    h1: 'Top Instagram Content Creators & Video Makers',
    title: 'Top Instagram Creators & Influencers - Follower Rankings | Spialr',
    description: 'Leaderboard of top digital creators, comedy producers, and video makers on Instagram. Verified follower tracking and ranking indexes.'
  },
  'influencers': {
    name: 'Influencers',
    h1: 'Most Followed Instagram Influencers & Models',
    title: 'Top Instagram Influencers - Follower Rankings | Spialr',
    description: 'Explore top lifestyle, fashion, and social media influencers on Instagram with verified follower analytics and momentum scores.'
  },
  'meme-pages': {
    name: 'Meme Pages',
    h1: 'Top Instagram Meme Pages & Communities',
    title: 'Most Followed Instagram Meme Pages - Community Rankings | Spialr',
    description: 'Browse the largest entertainment and meme community handles on Instagram. Track audience reach and daily engagement.'
  },
  'politicians': {
    name: 'Politicians',
    h1: 'Most Followed Politicians & Leaders on Instagram',
    title: 'Top Instagram Politicians & Leaders - Follower Rankings | Spialr',
    description: 'Track the follower reach and growth metrics of prominent political leaders, ministers, and public officials on Instagram.'
  },
  'sports': {
    name: 'Sports',
    h1: 'Most Followed Athletes & Sports Icons on Instagram',
    title: 'Top Instagram Sports Athletes & Icons - Follower Rankings | Spialr',
    description: 'Follower rankings and historical velocity for top cricketers, athletes, and sports personalities on Instagram.'
  },
  'personalities': {
    name: 'Personalities',
    h1: 'Top Public Personalities on Instagram',
    title: 'Most Followed Public Personalities on Instagram | Spialr',
    description: 'Verified follower standings for notable public icons, entrepreneurs, journalists, and personalities on Instagram.'
  },
  'handles': {
    name: 'Handles',
    h1: 'Top Curated Instagram Handles & Media Pages',
    title: 'Top Instagram Handles & Media Brands - Rankings | Spialr',
    description: 'Leaderboard of popular media channels, brand publications, and curated pages on Instagram.'
  }
}

function formatCount(num) {
  if (!num) return '0'
  const n = Number(num)
  if (isNaN(n)) return num.toString()
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString()
}

export default function CategoryPage({ categoryKey, categoryInfo, profiles = [], stats }) {
  const router = useRouter()

  if (router.isFallback) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  const canonicalUrl = `https://spialr.com/category/${categoryKey}`

  return (
    <>
      <Head>
        <title>{categoryInfo.title}</title>
        <meta name="description" content={categoryInfo.description} />
        <link rel="canonical" href={canonicalUrl} key="canonical" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={categoryInfo.title} />
        <meta property="og:description" content={categoryInfo.description} />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '36px 20px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={13} />
          <Link href="/live" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Leaderboard</Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{categoryInfo.name}</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 4.5vw, 36px)',
            fontWeight: 850,
            letterSpacing: '-0.02em',
            margin: '0 0 14px 0',
            color: 'var(--text)'
          }}>
            {categoryInfo.h1}
          </h1>

          {/* Real data-driven editorial description */}
          <p style={{
            fontSize: 14.5,
            color: 'var(--text-dim)',
            lineHeight: 1.7,
            margin: '0 0 20px 0'
          }}>
            Welcome to Spialr&apos;s verified index for <strong>{categoryInfo.name}</strong> on Instagram. 
            This curated directory tracks <strong>{stats.count} indexed profiles</strong> within this category, representing an aggregated community reach of over <strong>{formatCount(stats.totalFollowers)} followers</strong>. 
            Leading the leaderboard is <strong>{stats.topName}</strong>{stats.topHandle ? ` (@${stats.topHandle})` : ''} with approximately <strong>{formatCount(stats.topFollowers)} followers</strong>. 
            All standings are benchmarked from public Instagram data on a rolling schedule without private API scraping. 
            To learn more about our calculation criteria and data integrity standards, inspect our transparent <Link href="/methodology" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Data Methodology</Link>.
          </p>

          {/* Highlights KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginBottom: 28
          }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                Profiles Tracked
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                {stats.count} accounts
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                Category Leader
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats.topName || 'N/A'}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                Combined Reach
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                {formatCount(stats.totalFollowers)}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                Verification
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={16} style={{ color: '#10b981' }} /> Public Snapshots
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Table / List */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 36
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface2)'
          }}>
            <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ranked by Verified Followers
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {profiles.length} profiles
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {profiles.map((p, idx) => {
              const targetSlug = p.instagram_handle
                ? p.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
                : (p.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')

              return (
                <Link
                  key={p.id}
                  href={`/profile/${targetSlug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: idx < profiles.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--surface2)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 38,
                    fontSize: idx < 3 ? 15 : 13.5,
                    fontWeight: 800,
                    color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)',
                    fontFamily: 'monospace',
                    flexShrink: 0
                  }}>
                    #{idx + 1}
                  </div>

                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', marginRight: 14, flexShrink: 0, background: 'var(--surface2)', border: '1.5px solid var(--border)' }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                        {p.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name & Handle */}
                  <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 750, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    {p.instagram_handle && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        @{p.instagram_handle}
                      </div>
                    )}
                  </div>

                  {/* Follower Count */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 850, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                      {formatCount(p.followers_count)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      followers
                    </div>
                  </div>

                  <ArrowUpRight size={15} style={{ color: 'var(--text-muted)', marginLeft: 12, flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Explore Other Categories Hub */}
        <section style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: '24px 20px',
          marginBottom: 30
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 14px 0' }}>
            Browse Other Creator Categories
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(CATEGORY_MAP).map(([key, item]) => {
              const isCurrent = key === categoryKey
              return (
                <Link
                  key={key}
                  href={`/category/${key}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 100,
                    fontSize: 12.5,
                    fontWeight: 650,
                    textDecoration: 'none',
                    border: '1px solid',
                    borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                    background: isCurrent ? 'var(--gradient-subtle)' : 'var(--surface2)',
                    color: isCurrent ? 'var(--accent)' : 'var(--text-dim)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}

export async function getServerSideProps(context) {
  const { category } = context.params
  const categoryKey = (category || '').toLowerCase().trim()

  const categoryInfo = CATEGORY_MAP[categoryKey]
  if (!categoryInfo) {
    return { notFound: true }
  }

  try {
    // Query profiles in this category from most_followed table
    const { data: rawProfiles, error } = await supabase
      .from('most_followed')
      .select('id, name, instagram_handle, photo_url, followers_count, category, order_index')
      .ilike('category', `%${categoryInfo.name}%`)
      .order('followers_count', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching category profiles:', error)
      return { notFound: true }
    }

    const profiles = proxyProfileImages(rawProfiles || [])
    const totalFollowers = profiles.reduce((sum, p) => sum + (Number(p.followers_count) || 0), 0)
    const topAccount = profiles[0] || null

    const stats = {
      count: profiles.length,
      totalFollowers,
      topName: topAccount ? topAccount.name : 'N/A',
      topHandle: topAccount ? topAccount.instagram_handle : null,
      topFollowers: topAccount ? topAccount.followers_count : 0
    }

    return {
      props: {
        categoryKey,
        categoryInfo,
        profiles,
        stats
      }
    }
  } catch (err) {
    console.error('Category getServerSideProps error:', err)
    return { notFound: true }
  }
}
