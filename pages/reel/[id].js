import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { ArrowLeft, Calendar, Users, ExternalLink, Heart, Eye, Play } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ReelDetailPage({ initialReel }) {
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

  return (
    <>
      <Head>
        <title>{reel ? `${reel.creator_name || 'Creator'} - Watch Reel — Spialr` : 'Watch Instagram Reel — Spialr'}</title>
        <meta name="description" content={reel ? `Watch this viral reel by ${reel.creator_name || '@anonymous'} on Spialr.` : 'Watch viral reels on Spialr.'} />
      </Head>

      <Navbar />

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '16px 20px 100px' }}>
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

            {/* Left Column: Big Thumbnail Card */}
            {reel.photo_url && (
              <div 
                onClick={() => window.open(reel.instagram_link, '_blank', 'noopener,noreferrer')}
                style={{
                  width: 240,
                  height: 360,
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                  flexShrink: 0,
                  border: '1px solid var(--border)',
                  zIndex: 1
                }}
                className="big-thumbnail-card"
              >
                <img 
                  src={reel.photo_url} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
                  className="big-thumbnail-img"
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} className="big-play-overlay">
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease'
                  }} className="big-play-btn">
                    <Play size={18} fill="currentColor" style={{ marginLeft: 3 }} />
                  </div>
                </div>
              </div>
            )}

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
                {/* Creator Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--surface2)',
                    border: '2px solid var(--border)',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    {reel.creator_photo_url ? (
                      <img src={reel.creator_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>
                        {initials}
                      </div>
                    )}
                  </div>
                  <div>
                    {reel.creator_slug ? (
                      <a href={'/celebrity/' + reel.creator_slug} style={{ textDecoration: 'none' }}>
                        <h2 style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          margin: 0,
                          letterSpacing: '-0.01em',
                          fontFamily: 'var(--font-display)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }} className="creator-link-hover">
                          {reel.creator_name || '@anonymous'}
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: 'rgba(255, 42, 95, 0.08)', color: 'var(--accent)', marginLeft: 4 }}>Creator</span>
                        </h2>
                      </a>
                    ) : (
                      <h2 style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: 'var(--text)',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        fontFamily: 'var(--font-display)'
                      }}>
                        {reel.creator_name || '@anonymous'}
                      </h2>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>Instagram Creator Profile</div>
                  </div>
                </div>

                {/* Caption / Quote Section */}
                <div style={{
                  fontSize: '14.5px',
                  fontWeight: 500,
                  lineHeight: 1.6,
                  color: 'var(--text-dim)',
                  marginBottom: 24,
                  whiteSpace: 'pre-wrap',
                  background: 'var(--surface2)',
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  position: 'relative',
                  fontStyle: 'italic',
                  fontFamily: 'var(--font-body)'
                }}>
                  <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 32, opacity: 0.1, fontFamily: 'serif', lineHeight: 1 }}>“</span>
                  <div style={{ paddingLeft: 6 }}>{reel.title}</div>
                </div>

                {/* Grid Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                  marginBottom: 28
                }}>
                  {followersDisplay && (
                    <div style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{followersDisplay}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Followers</div>
                      </div>
                    </div>
                  )}

                  {reel.views_text && (
                    <div style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(168, 85, 247, 0.08)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Eye size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{reel.views_text}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Total Views</div>
                      </div>
                    </div>
                  )}

                  {reel.likes_text && (
                    <div style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255, 42, 95, 0.08)', color: '#ff2a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Heart size={16} fill="currentColor" />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{reel.likes_text}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Total Likes</div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{getFormattedDate(reel.created_at)}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Published</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action watch reel label */}
              <div>
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '16px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textAlign: 'center'
                  }}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--accent)' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span>Click/Tap on the photo above to watch on Instagram</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
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
        .big-thumbnail-card {
          transition: all 0.3s var(--spring);
        }
        .big-thumbnail-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 48px rgba(0,0,0,0.18) !important;
        }
        .big-thumbnail-card:hover .big-thumbnail-img {
          transform: scale(1.04);
        }
        .big-thumbnail-card:hover .big-play-btn {
          transform: scale(1.1);
          background: #ffffff !important;
          box-shadow: 0 8px 24px rgba(255, 42, 95, 0.3) !important;
        }
        .creator-link-hover:hover {
          color: var(--accent-hover) !important;
        }
        .watch-reel-cta {
          color: white !important;
        }
        .watch-reel-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(255, 42, 95, 0.4) !important;
        }
        .watch-reel-cta:active {
          transform: translateY(0);
        }
        @media (max-width: 680px) {
          .detail-card-container {
            flex-direction: column !important;
            padding: 20px !important;
            gap: 24px !important;
          }
          .big-thumbnail-card {
            width: 100% !important;
            height: 380px !important;
            max-width: 320px;
            margin: 0 auto;
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
    let { data: reel, error } = await supabase
      .from('most_viewed_reels')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error

    if (!reel) {
      const { data: viralReel, error: viralError } = await supabase
        .from('viral_reels')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (viralError) throw viralError
      reel = viralReel
    }

    if (!reel) {
      const { data: likedPost, error: likedError } = await supabase
        .from('most_liked_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (likedError) throw likedError
      reel = likedPost
    }

    if (!reel) {
      const { data: likedReel, error: likedReelError } = await supabase
        .from('most_liked_reels')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (likedReelError) throw likedReelError
      reel = likedReel
    }

    if (!reel) {
      return {
        notFound: true
      }
    }

    const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('name, slug, photo_url, followers_count')
      .ilike('name', nameKey)
      .maybeSingle()

    const enrichedReel = {
      ...reel,
      creator_photo_url: reel.creator_photo_url || celebrity?.photo_url || null,
      creator_slug: celebrity?.slug || null,
      celebrity_followers_count: celebrity?.followers_count || null
    }

    return {
      props: {
        initialReel: enrichedReel
      }
    }
  } catch (err) {
    console.error('getServerSideProps error in reel slug page:', err)
    return {
      notFound: true
    }
  }
}
