import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import { ArrowLeft, Instagram, Calendar, Users, ExternalLink } from 'lucide-react'
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
            padding: '24px 30px'
          }}>
            {/* 1. First Title: Creator Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                flexShrink: 0
              }}>
                {reel.creator_photo_url ? (
                  <img src={reel.creator_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>👤</div>
                )}
              </div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 850,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-display)'
              }}>
                {reel.creator_name || '@anonymous'}
              </h1>
            </div>

            {/* 2. Reel Caption / Caption Text */}
            <div style={{
              fontSize: '15px',
              fontWeight: 500,
              lineHeight: 1.5,
              color: 'var(--text-dim)',
              marginBottom: 28,
              whiteSpace: 'pre-wrap',
              background: 'var(--surface2)',
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid var(--border)',
            }}>
              {reel.title}
            </div>

            {/* 3. Bottom Row: Video link & beside it followers count, date, image */}
            <div className="bottom-split-container" style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Left column: Video Link (CTA Button) */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <button
                  onClick={() => window.open(reel.instagram_link, '_blank', 'noopener,noreferrer')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'var(--gradient)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '14px 20px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(225, 48, 108, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                  className="watch-reel-cta"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Watch Reel on Instagram
                  <ExternalLink size={14} />
                </button>
              </div>

              {/* Right column: Followers, Date, Image */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexShrink: 0
              }}>
                {/* Text Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {followersDisplay && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} style={{ color: 'var(--accent)' }} />
                      <span>{followersDisplay} Followers</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} style={{ color: 'var(--accent)' }} />
                    <span>{getFormattedDate(reel.created_at)}</span>
                  </div>
                </div>

                {/* Cover Image Thumbnail */}
                {reel.photo_url && (
                  <div 
                    onClick={() => window.open(reel.instagram_link, '_blank', 'noopener,noreferrer')}
                    style={{
                      width: 60,
                      height: 90,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      flexShrink: 0
                    }}
                    className="thumbnail-container"
                  >
                    <img 
                      src={reel.photo_url} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                      className="thumbnail-img"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .back-btn-hover:hover {
          background: var(--surface2) !important;
          color: var(--text) !important;
        }
        .watch-reel-cta {
          color: white !important;
        }
        .watch-reel-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(225, 48, 108, 0.3) !important;
        }
        .watch-reel-cta:active {
          transform: translateY(0);
        }
        .thumbnail-container:hover .thumbnail-img {
          transform: scale(1.06);
        }
        @media (max-width: 580px) {
          .bottom-split-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
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
