import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import BottomNav from '../../components/BottomNav'
import { ArrowLeft, Calendar, Users, ExternalLink, Heart, Eye, Film, Play } from 'lucide-react'
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
        <link rel="canonical" href={canonicalUrl} />
        {isThinContent && <meta name="robots" content="noindex, follow" />}
      </Head>

      
      <main style={{ maxWidth: 850, margin: '0 auto', padding: '24px 20px 100px' }}>
        {/* Back Navigation */}
        <div style={{ marginBottom: 16 }}>
          <button 
            onClick={() => router.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 20,
              transition: 'all 0.2s',
              marginLeft: -12
            }}
            className="back-btn-hover"
          >
            <ArrowLeft size={14} />
            Back to Leaderboard
          </button>
        </div>

        {/* Content Card */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#ff5252', 
            padding: 40, 
            background: 'var(--surface)', 
            borderRadius: 20, 
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Unable to load Reel</h2>
            <p style={{ fontSize: 14, opacity: 0.8 }}>{error}</p>
          </div>
        ) : !reel ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'var(--text-muted)', 
            padding: 40, 
            background: 'var(--surface)', 
            borderRadius: 20, 
            border: '1px solid var(--border)'
          }}>
            Reel not found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{
              display: 'flex',
              gap: 32,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              boxShadow: '0 16px 48px rgba(0,0,0,0.04)',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
            }} className="detail-card-container">
              {/* Background Decorative Blur */}
              <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 80%)',
                filter: 'blur(60px)',
                opacity: 0.15,
                pointerEvents: 'none',
                zIndex: 0
              }} />

              {/* Left Column: Small Thumbnail Card */}
              <div 
                style={{
                  width: 88,
                  height: 132,
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#09090b',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  flexShrink: 0,
                  border: '1px solid var(--border)',
                  zIndex: 1
                }}
              >
                {reel.photo_url ? (
                  <>
                    <img src={reel.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => {e.target.style.display='none'}} />
                    <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '9px', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px', fontWeight: 600 }}>via Instagram</div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Film size={18} />
                  </div>
                )}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Play size={10} fill="currentColor" style={{ marginLeft: 1 }} />
                  </div>
                </div>
              </div>

              {/* Right Column: Title, Creator, Metadata & CTA */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                zIndex: 1,
                minWidth: 0
              }}>
                <div>
                  {/* Title and Creator (Replaces old avatar header and quote box) */}
                  <div style={{ marginBottom: 24 }}>
                    {reel.title && (
                      <h1 style={{
                        fontSize: '15px',
                        fontWeight: 650,
                        color: 'var(--text)',
                        margin: '0 0 8px 0',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {reel.title}
                      </h1>
                    )}
                    
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                      {reel.creator_slug ? (
                        <a href={'/celebrity/' + reel.creator_slug} style={{ color: 'inherit', textDecoration: 'none' }} className="creator-link-hover">
                          {reel.creator_name ? (reel.creator_name.startsWith('@') ? reel.creator_name : `@${reel.creator_name}`) : '@anonymous'}
                        </a>
                      ) : (
                        <span>{reel.creator_name ? (reel.creator_name.startsWith('@') ? reel.creator_name : `@${reel.creator_name}`) : '@anonymous'}</span>
                      )}
                    </div>
                  </div>

                  {/* Inline Clean Metrics */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px 28px',
                    marginBottom: 28,
                    padding: '4px 0'
                  }}>
                    {hasFollowers && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Users size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{followersDisplay}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.25 }}>Followers</div>
                        </div>
                      </div>
                    )}

                    {hasViews && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div style={{ color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Eye size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{reel.views_text}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.25 }}>Total Views</div>
                        </div>
                      </div>
                    )}

                    {hasLikes && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div style={{ color: '#ff2a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Heart size={16} fill="currentColor" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{reel.likes_text}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.25 }}>Total Likes</div>
                        </div>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{getFormattedDate(reel.created_at)}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.25 }}>Published</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Watch on Instagram Call to Action Button */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <a 
                    href={reel.instagram_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border-bright)',
                      color: 'var(--text)',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      textDecoration: 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: 'none'
                    }}
                    className="watch-reel-cta"
                  >
                    <ExternalLink size={15} />
                    Watch Reel on Instagram
                  </a>
                </div>
              </div>
            </div>

            {/* ABOUT THIS REEL SECTION */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: '28px 32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{
                fontSize: 17,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                📖 About this Reel
              </h3>
              <p style={{
                fontSize: '14.5px',
                lineHeight: 1.7,
                color: 'var(--text-dim)',
                margin: 0
              }}>
                {reel.description || `This viral reel is created by the popular digital content creator ${reel.creator_name || '@anonymous'}. It is benchmarked inside the ${reel.category_name || 'Instagram'} category on Spialr, which tracks and charts top-performing creators in this niche based on views and engagement levels. Marketers and other creators can analyze this performance to understand successful video hooks, layout pacing, and formatting setups.`}
              </p>

              {reel.why_notable && (
                <div style={{ 
                  marginTop: 18, 
                  paddingTop: 16, 
                  borderTop: '1px dashed var(--border)', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 8, 
                  fontSize: '13.5px', 
                  color: 'var(--text-dim)' 
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>⭐</span>
                  <div>
                    <strong>Why Notable:</strong> {reel.why_notable}
                  </div>
                </div>
              )}
            </div>

            {/* REEL INSIGHTS SECTION */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: '28px 32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{
                fontSize: 17,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                📊 Reel Insights
              </h3>
              <p style={{
                fontSize: '14.5px',
                lineHeight: 1.7,
                color: 'var(--text-dim)',
                margin: 0
              }} dangerouslySetInnerHTML={{
                __html: `This reel by <strong>${reel.creator_name || '@anonymous'}</strong> currently ranks <strong>#${reel.rank}</strong> in Spialr’s <strong>${reel.category_name}</strong>${statsPart} based on the latest recorded public metrics.`
              }} />
            </div>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: '28px 32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{
                fontSize: 17,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                ❓ Frequently Asked Questions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
                    What category does this reel belong to?
                  </h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                    This reel is benchmarked inside the <strong>{reel.category_name}</strong> category on Spialr, which tracks and charts top-performing creators in this niche.
                  </p>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
                    How can I view the actual reel on Instagram?
                  </h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                    You can click the <strong>"Watch Reel on Instagram"</strong> button on this page, which will open a secure link directly to the official post on the Instagram platform.
                  </p>
                </div>
              </div>
            </div>

            {/* RANKING CONTEXT METHODOLOGY */}
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '24px 30px',
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6, fontSize: 13.5 }}>Ranking Context & Stats</div>
              Rankings are based on publicly observed social-media metrics recorded by Spialr and may change as engagement increases. We collect public data from current viral cycles to offer benchmarking services for content creators and marketers.
              {reel.created_at && (
                <div style={{ marginTop: 10, fontSize: 11, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Last Updated: {getFormattedDate(reel.created_at)}
                </div>
              )}
            </div>

            {/* RELATED CONTENT SECTIONS */}
            {moreFromCreator.length > 0 && (
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 16, color: 'var(--text)' }}>
                  🎥 More Reels by {reel.creator_name || 'Creator'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                  {moreFromCreator.map(item => (
                    <a key={item.id} href={`/reel/${generateReelSlug(item)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                      }} onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'
                      }} onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ height: 180, position: 'relative', background: 'var(--surface2)' }}>
                          <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {item.views_text || item.likes_text}
                          </div>
                        </div>
                        <div style={{ padding: '10px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 38, lineHeight: 1.4 }}>
                          {item.title || 'Watch Reel'}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {topCategoryReels.length > 0 && (
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 16, color: 'var(--text)' }}>
                  🔥 Top Trending in {reel.category_name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                  {topCategoryReels.map(item => (
                    <a key={item.id} href={`/reel/${generateReelSlug(item)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                      }} onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'
                      }} onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ height: 180, position: 'relative', background: 'var(--surface2)' }}>
                          <img src={item.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {item.views_text || item.likes_text}
                          </div>
                        </div>
                        <div style={{ padding: '10px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 38, lineHeight: 1.4 }}>
                          {item.title || 'Watch Reel'}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Creator Spialr Profile Banner */}
            {reel.creator_slug && (
              <div 
                onClick={() => router.push(`/celebrity/${reel.creator_slug}`)}
                style={{
                  background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '24px 30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  marginTop: 8
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <div style={{ paddingRight: 16 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>
                    Looking for full social analytics?
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                    Explore the complete benchmark details, metrics, and content monitors of <strong>{reel.creator_name || 'this creator'}</strong> on their dedicated Spialr Profile.
                  </p>
                </div>
                <div style={{
                  fontSize: 13.5,
                  fontWeight: 750,
                  color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  View Profile →
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .back-btn-hover:hover {
          background: var(--surface2) !important;
          color: var(--text) !important;
        }
        .detail-card-container {
          flex-direction: row;
        }
        .creator-link-hover:hover {
          color: var(--accent-hover) !important;
        }
        .watch-reel-cta:hover {
          background-color: var(--surface2) !important;
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          transform: translateY(-1px);
        }
        .watch-reel-cta:active {
          transform: translateY(0);
        }
        @media (max-width: 680px) {
          .detail-card-container {
            flex-direction: row !important;
            padding: 16px !important;
            gap: 16px !important;
            align-items: flex-start !important;
          }
        }
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
