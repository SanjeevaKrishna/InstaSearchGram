import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import BottomNav from '../../components/BottomNav'
import { ArrowLeft, Calendar, Users, ExternalLink, Heart, Eye, Film, Play, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ReelDetailPage({ initialReel, moreFromCreator = [], topCategoryReels = [], celebrityProfile }) {
  const router = useRouter()
  const { id } = router.query

  const [reel, setReel] = useState(initialReel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setReel(initialReel)
  }, [initialReel])

  const formatFollowers = (n) => {
    if (!n) return null
    const num = Number(n)
    if (isNaN(num)) return n.toString()
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

  const generateReelSlug = (item) => {
    if (!item) return ''
    const creatorClean = (item.creator_name || '')
      .replace('@', '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      
    const titleClean = (item.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 45)

    const parts = [creatorClean, titleClean].filter(Boolean).join('-').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
    return `${parts || 'watch'}-${item.id}`
  }

  const followersDisplay = reel ? (reel.followers_text || formatFollowers(reel.celebrity_followers_count)) : ''

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const initials = reel && reel.creator_name ? (reel.creator_name.replace('@', '').substring(0, 1).toUpperCase()) : 'A'

  // Determine if this is "thin content" (missing major engagement stats and details) to avoid indexing placeholder nodes
  const isThinContent = !reel || (!reel.views_text && !reel.likes_text && !reel.title && !reel.description);

  // SEO configuration
  const pageTitle = reel ? `Watch ${reel.creator_name || 'Creator'} Reel (Ranked #${reel.rank} in ${reel.category_name}) — Spialr` : 'Watch Instagram Reel — Spialr'
  const pageDescription = reel ? `Watch this popular reel by ${reel.creator_name || 'creator'} on Spialr. Metrics: ${reel.views_text || 'N/A'} views, ${reel.likes_text || 'N/A'} likes. Currently ranked #${reel.rank} in the ${reel.category_name} category.` : 'Watch viral reels on Spialr.'
  const canonicalUrl = reel ? `https://spialr.com/reel/${router.query.id || id}` : 'https://spialr.com'

  const hasFollowers = followersDisplay && followersDisplay !== '0'
  const hasViews = reel && reel.views_text && reel.views_text !== '0'
  const hasLikes = reel && reel.likes_text && reel.likes_text !== '0'

  // Dynamic statistics phrasing for the insights text
  let statsPart = ''
  if (hasViews && hasLikes) {
    statsPart = `, with <strong>${reel.views_text}</strong> views and <strong>${reel.likes_text}</strong> likes`
  } else if (hasViews) {
    statsPart = `, with <strong>${reel.views_text}</strong> views`
  } else if (hasLikes) {
    statsPart = `, with <strong>${reel.likes_text}</strong> likes`
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} key="canonical" />
        {isThinContent && <meta name="robots" content="noindex, follow" />}
      </Head>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 10px', borderRadius: 20, marginLeft: -10, marginBottom: 16 }}
          className="back-btn-hover"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner" /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#ff5252', padding: 40, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Unable to load</h2>
            <p style={{ fontSize: 14, opacity: 0.8 }}>{error}</p>
          </div>
        ) : !reel ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Not found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── HERO CARD ── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '24px 20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* bg glow */}
              <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '55%', height: '120%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

              {/* Creator row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface2)', border: '2px solid var(--border)', flexShrink: 0 }}>
                  {reel.photo_url
                    ? <img src={reel.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{initials}</div>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  {reel.creator_slug
                    ? <a href={'/celebrity/' + reel.creator_slug} style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reel.creator_name?.startsWith('@') ? reel.creator_name : `@${reel.creator_name || 'anonymous'}`}</a>
                    : <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{reel.creator_name?.startsWith('@') ? reel.creator_name : `@${reel.creator_name || 'anonymous'}`}</span>
                  }
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{reel.category_name || 'Instagram'} · Rank #{reel.rank}</div>
                </div>
                {/* Rank badge */}
                <div style={{ marginLeft: 'auto', flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.04em', boxShadow: '0 2px 10px rgba(99,102,241,0.35)' }}>
                  #{reel.rank}
                </div>
              </div>

              {/* Big stat number(s) */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, position: 'relative' }}>
                {hasLikes && (
                  <div style={{ flex: 1, minWidth: 130, background: 'linear-gradient(135deg,rgba(255,42,95,0.07),rgba(255,42,95,0.03))', border: '1px solid rgba(255,42,95,0.18)', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#ff2a5f', textTransform: 'uppercase', marginBottom: 4 }}>❤️ Total Likes</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#ff2a5f', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 0 24px rgba(255,42,95,0.28)' }}>{reel.likes_text}</div>
                  </div>
                )}
                {hasViews && (
                  <div style={{ flex: 1, minWidth: 130, background: 'linear-gradient(135deg,rgba(168,85,247,0.07),rgba(168,85,247,0.03))', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#a855f7', textTransform: 'uppercase', marginBottom: 4 }}>👁️ Total Views</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#a855f7', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 0 24px rgba(168,85,247,0.28)' }}>{reel.views_text}</div>
                  </div>
                )}
                {hasFollowers && (
                  <div style={{ flex: 1, minWidth: 130, background: 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(99,102,241,0.03))', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 }}>👤 Followers</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#6366f1', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 0 24px rgba(99,102,241,0.28)' }}>{followersDisplay}</div>
                  </div>
                )}
              </div>

              {/* Title */}
              {reel.title && (
                <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 20px', fontStyle: 'italic', position: 'relative' }}>
                  "{reel.title}"
                </p>
              )}

              {/* CTA */}
              <a
                href={reel.instagram_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#e1306c,#fd1d1d,#f77737)', color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(225,48,108,0.35)', transition: 'all 0.2s', position: 'relative' }}
                className="watch-reel-cta"
              >
                <ExternalLink size={16} />
                Open Post on Instagram
              </a>

              {/* Date */}
              {reel.created_at && (
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' }}>
                  <Calendar size={11} />
                  {getFormattedDate(reel.created_at)}
                </div>
              )}
            </div>

            {/* ── FAQ SECTION ── */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>❓ Quick Questions</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  {
                    q: `What is ${reel.creator_name || 'this creator'}'s rank?`,
                    a: `This post is currently ranked #${reel.rank} in the ${reel.category_name} category on Spialr.`
                  },
                  ...(hasLikes ? [{
                    q: `How many likes does this post have?`,
                    a: `This post has ${reel.likes_text} likes as recorded by Spialr.`
                  }] : []),
                  ...(hasViews ? [{
                    q: `How many views does this reel have?`,
                    a: `This reel has ${reel.views_text} views based on the latest public metrics.`
                  }] : []),
                  {
                    q: 'How do I view this post on Instagram?',
                    a: 'Click the "Open Post on Instagram" button above to open the official post directly.'
                  },
                  {
                    q: `Which category does this belong to?`,
                    a: `This post is listed under the ${reel.category_name || 'Instagram'} category on Spialr, which tracks top-performing content in this niche.`
                  }
                ].map((faq, idx) => (
                  <ReelFAQItem key={idx} faq={faq} />
                ))}
              </div>
            </div>

            {/* ── MORE FROM CREATOR ── */}
            {moreFromCreator.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎥 More from {reel.creator_name || 'Creator'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                  {moreFromCreator.map(item => (
                    <a key={item.id} href={`/reel/${generateReelSlug(item)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                        <div style={{ height: 160, position: 'relative', background: 'var(--surface2)' }}>
                          <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{item.views_text || item.likes_text}</div>
                        </div>
                        <div style={{ padding: '8px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{item.title || 'Watch'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── TOP IN CATEGORY ── */}
            {topCategoryReels.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔥 Top in {reel.category_name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                  {topCategoryReels.map(item => (
                    <a key={item.id} href={`/reel/${generateReelSlug(item)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                        <div style={{ height: 160, position: 'relative', background: 'var(--surface2)' }}>
                          <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{item.views_text || item.likes_text}</div>
                        </div>
                        <div style={{ padding: '8px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{item.title || 'Watch'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── VIEW FULL PROFILE ── */}
            {reel.creator_slug && (
              <div
                onClick={() => router.push(`/celebrity/${reel.creator_slug}`)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>View Full Profile</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Follower growth & stats for {reel.creator_name || 'this creator'}</div>
                </div>
                <span style={{ fontSize: 18, color: 'var(--accent)' }}>→</span>
              </div>
            )}

          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .back-btn-hover:hover { background: var(--surface2) !important; color: var(--text) !important; }
        .watch-reel-cta:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(225,48,108,0.45) !important; }
        .watch-reel-cta:active { transform: translateY(0); }
      `}</style>
    </>
  )
}

const getUuidFromSlug = (slugStr) => {
  if (!slugStr) return ''
  if (slugStr.length >= 36) {
    const possibleUuid = slugStr.slice(-36)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(possibleUuid)) {
      return possibleUuid
    }
  }
  return slugStr
}

export async function getServerSideProps(context) {
  const { id: rawId } = context.query
  const id = getUuidFromSlug(rawId)

  try {
    const { data: allCelebrities } = await supabase
      .from('celebrities')
      .select('name, slug, photo_url, followers_count')

    const celebrityMap = {}
    if (allCelebrities) {
      allCelebrities.forEach(c => {
        if (c.name && c.slug) {
          celebrityMap[c.name.toLowerCase().trim()] = c
        }
      })
    }

    let reel = null
    let categoryName = ''
    let matchedTable = ''

    // 1. Try most_viewed_reels
    const { data: mvReel } = await supabase
      .from('most_viewed_reels')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (mvReel) {
      reel = mvReel
      categoryName = 'Most Viewed Reels'
      matchedTable = 'most_viewed_reels'
    }

    // 2. Try viral_reels
    if (!reel) {
      const { data: vReel } = await supabase
        .from('viral_reels')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (vReel) {
        reel = vReel
        categoryName = 'Viral Reels'
        matchedTable = 'viral_reels'
      }
    }

    // 3. Try most_liked_posts
    if (!reel) {
      const { data: mlPost } = await supabase
        .from('most_liked_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (mlPost) {
        reel = mlPost
        categoryName = 'Most Liked Posts'
        matchedTable = 'most_liked_posts'
      }
    }

    // 4. Try most_liked_reels
    if (!reel) {
      const { data: mlReel } = await supabase
        .from('most_liked_reels')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (mlReel) {
        reel = mlReel
        categoryName = 'Most Liked Reels'
        matchedTable = 'most_liked_reels'
      }
    }

    // 5. Try most_liked_comments
    if (!reel) {
      const { data: mlComment } = await supabase
        .from('most_liked_comments')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (mlComment) {
        reel = mlComment
        categoryName = 'Most Liked Comments'
        matchedTable = 'most_liked_comments'
      }
    }

    if (!reel) {
      return {
        notFound: true
      }
    }

    // Fetch all records from the matched table to compute rank & related lists
    const { data: tableData } = await supabase
      .from(matchedTable)
      .select('*')

    const parseCountText = (text) => {
      if (!text) return 0;
      const cleaned = text.toString().trim().toLowerCase();
      const numMatch = cleaned.match(/^([0-9.]+)/);
      if (!numMatch) return 0;
      const num = parseFloat(numMatch[1]);
      if (isNaN(num)) return 0;
      if (cleaned.includes('b') || cleaned.includes('billion')) return num * 1000000000;
      if (cleaned.includes('m') || cleaned.includes('million')) return num * 1000000;
      if (cleaned.includes('k') || cleaned.includes('thousand')) return num * 1000;
      if (cleaned.includes('crore') || cleaned.includes('cr')) return num * 10000000;
      if (cleaned.includes('lakh') || cleaned.includes('l')) return num * 100000;
      return num;
    }

    // Sort according to live API logic
    let sortedReels = []
    if (matchedTable === 'viral_reels') {
      sortedReels = (tableData || []).sort((a, b) => {
        const rankA = a.order_index || 999999
        const rankB = b.order_index || 999999
        if (rankA !== rankB) return rankA - rankB
        return new Date(b.created_at) - new Date(a.created_at)
      })
    } else if (matchedTable === 'most_viewed_reels') {
      sortedReels = (tableData || []).sort((a, b) => {
        const countA = parseCountText(a.views_text)
        const countB = parseCountText(b.views_text)
        if (countA !== countB) return countB - countA
        return new Date(b.created_at) - new Date(a.created_at)
      })
    } else { // most_liked_posts or most_liked_reels
      sortedReels = (tableData || []).sort((a, b) => {
        const countA = parseCountText(a.likes_text)
        const countB = parseCountText(b.likes_text)
        if (countA !== countB) return countB - countA
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }

    const rankVal = sortedReels.findIndex(r => r.id === id) + 1
    const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
    const celebrity = celebrityMap[nameKey] || null

    const enrichedReel = {
      ...reel,
      creator_photo_url: reel.creator_photo_url || celebrity?.photo_url || null,
      creator_slug: celebrity?.slug || null,
      celebrity_followers_count: celebrity?.followers_count || null,
      rank: rankVal,
      category_name: categoryName
    }

    // Top Category Reels (excluding current)
    const topCategoryReels = sortedReels
      .filter(r => r.id !== id)
      .slice(0, 5)
      .map(r => {
        const rNameKey = (r.creator_name || '').replace('@', '').toLowerCase().trim()
        const rMatch = celebrityMap[rNameKey]
        return {
          ...r,
          creator_photo_url: r.creator_photo_url || rMatch?.photo_url || null,
          creator_slug: rMatch?.slug || null
        }
      })

    // More from this creator
    const moreFromCreator = sortedReels
      .filter(r => r.id !== id && (r.creator_name || '').replace('@', '').toLowerCase().trim() === nameKey)
      .slice(0, 5)
      .map(r => {
        const rNameKey = (r.creator_name || '').replace('@', '').toLowerCase().trim()
        const rMatch = celebrityMap[rNameKey]
        return {
          ...r,
          creator_photo_url: r.creator_photo_url || rMatch?.photo_url || null,
          creator_slug: rMatch?.slug || null
        }
      })

    return {
      props: {
        initialReel: enrichedReel,
        moreFromCreator,
        topCategoryReels,
        celebrityProfile: celebrity
      }
    }
  } catch (err) {
    console.error('getServerSideProps error in reel slug page:', err)
    return {
      notFound: true
    }
  }
}

function ReelFAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: 'var(--surface2)',
      borderRadius: 12,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text)',
          fontSize: 14,
          fontWeight: 700
        }}
      >
        <span>{faq.q}</span>
        <span style={{
          color: 'var(--accent)',
          display: 'inline-flex',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          flexShrink: 0
        }}>
          <ChevronDown size={18} />
        </span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 16px',
          fontSize: 13,
          color: 'var(--text-dim)',
          lineHeight: 1.65,
          borderTop: '1px solid var(--border)',
          paddingTop: 12
        }}>
          {faq.a}
        </div>
      )}
    </div>
  )
}
