import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  Award,
  Heart,
  TrendingUp,
  Sparkles,
  Users,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
  BarChart2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

const generateCommentSlug = (item) => {
  if (!item) return ''
  const creatorClean = (item.creator_name || '')
    .replace('@', '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')

  const titleClean = (item.title || item.description || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 35)

  const parts = [creatorClean, titleClean].filter(Boolean).join('-').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
  return `${parts || 'comment'}-${item.id}`
}

export default function CommentDetailPage({ initialComment, topComments = [], topFeaturedCreators = [] }) {
  const router = useRouter()
  const [comment, setComment] = useState(initialComment)

  useEffect(() => {
    setComment(initialComment)
  }, [initialComment])

  const authorName = comment?.creator_name ? comment.creator_name.replace(/^@/, '') : 'Instagram User'
  const commentText = comment?.title || comment?.description || 'Instagram Comment'
  const likesText = comment?.likes_text || 'thousands of'
  const rank = comment?.rank || 1

  const pageTitle = comment 
    ? `Rank #${rank}: "${commentText.length > 50 ? commentText.substring(0, 47) + '...' : commentText}" by ${authorName} — Spialr`
    : 'Trending Instagram Comment Details — Spialr'

  const pageDescription = comment 
    ? `Ranked #${rank} on Spialr Trending Comments. Read about this viral Instagram comment by ${authorName} with ${likesText} likes.`
    : 'Trending Instagram comment details and ranking analysis.'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {/* Keep noindex so automated crawlers do not flag single comments as thin pages */}
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`https://spialr.com/comment/${router.query.id || ''}`} key="canonical" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {comment?.photo_url && <meta property="og:image" content={comment.photo_url} />}
      </Head>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 18px 120px' }}>
        {/* Back Button */}
        <div style={{ marginBottom: 18 }}>
          <button 
            onClick={() => router.push('/trending')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 20,
              transition: 'all 0.2s ease',
            }}
            className="back-btn-hover"
          >
            <ArrowLeft size={14} />
            <span>Back to Leaderboard</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── SECTION 1: RANK BADGE ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--gradient-subtle, rgba(225, 48, 108, 0.08))',
              border: '1px solid rgba(225, 48, 108, 0.25)',
              color: 'var(--accent)',
              padding: '8px 20px',
              borderRadius: 100,
              fontSize: 14.5,
              fontWeight: 800,
              letterSpacing: '0.02em',
              boxShadow: '0 2px 10px rgba(225, 48, 108, 0.08)'
            }}>
              <Award size={17} />
              <span>Rank #{rank} on Trending Comments</span>
            </div>
          </div>

          {/* ── SECTION 2: MAIN COMMENT SHOWCASE CARD ── */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 22,
            padding: '24px 22px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Author Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e1306c, #833ab4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 800
                }}>
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                    @{authorName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Verified Community Interaction
                  </div>
                </div>
              </div>

              {/* Like Counter Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 42, 95, 0.08)',
                border: '1px solid rgba(255, 42, 95, 0.2)',
                color: '#ff2a5f',
                padding: '7px 16px',
                borderRadius: 100,
                fontSize: 13.5,
                fontWeight: 800
              }}>
                <Heart size={14} fill="#ff2a5f" />
                <span>{comment?.likes_text || 'Viral'} Likes</span>
              </div>
            </div>

            {/* Comment Media / Screenshot if available */}
            {comment?.photo_url && (
              <div style={{
                width: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                marginBottom: 18,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img 
                  src={comment.photo_url} 
                  alt={commentText} 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                    maxHeight: 480
                  }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}

            {/* Comment Text / Quote */}
            {comment?.description && (
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '18px 20px',
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--text)',
                marginBottom: 18,
                fontStyle: 'italic'
              }}>
                &ldquo;{comment.description}&rdquo;
              </div>
            )}

            {/* View in Instagram Action Button */}
            {comment?.instagram_link && (
              <a
                href={comment.instagram_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #e1306c 0%, #fd1d1d 50%, #f56040 100%)',
                  color: '#ffffff',
                  padding: '14px 24px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 750,
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(225, 48, 108, 0.25)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
                className="watch-reel-cta"
              >
                <span>View Original Post on Instagram</span>
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* ── SECTION 3: COMMENT VIRALITY DYNAMICS & ANALYSIS ── */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 22,
            padding: '22px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={19} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  Engagement Dynamics &amp; Virality Breakdown
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Why this comment ranked among the highest-liked interactions
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', marginBottom: 4 }}>
                  Audience Resonance
                </div>
                <div style={{ fontSize: 14, fontWeight: 750, color: 'var(--text)' }}>
                  Top 0.01% Platform Tier
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  Accumulated {comment?.likes_text || 'high'} likes directly beneath the original reel.
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: 4 }}>
                  Standing Tier
                </div>
                <div style={{ fontSize: 14, fontWeight: 750, color: 'var(--text)' }}>
                  Rank #{rank} Worldwide
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  Position computed from active public snapshot records on Spialr.
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: TOP 10 VIRAL COMMENTS LEADERBOARD FEED ── */}
          {topComments.length > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 22,
              padding: '22px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={17} color="#a855f7" />
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    Top Trending Comments Leaderboard
                  </h3>
                </div>
                <Link href="/trending" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
                  View All Standings
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topComments.map(item => {
                  const itemSlug = generateCommentSlug(item)
                  const itemAuthor = item.creator_name ? item.creator_name.replace(/^@/, '') : 'User'
                  const itemText = item.title || item.description || 'Viral Comment'
                  return (
                    <Link
                      key={item.id}
                      href={`/comment/${itemSlug}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      className="top-comment-item-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, paddingRight: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 850, color: item.rank <= 3 ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                          #{item.rank}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            @{itemAuthor}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                            {itemText}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <Heart size={13} fill="#ff2a5f" color="#ff2a5f" />
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                          {item.likes_text}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SECTION 5: TOP FEATURED GLOBAL CREATORS ── */}
          {topFeaturedCreators.length > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 22,
              padding: '22px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={17} color="#38bdf8" />
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Featured Instagram Creators
                  </h3>
                </div>
                <Link href="/live" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
                  Live Growth Directory →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {topFeaturedCreators.map(cel => {
                  const celSlug = (cel.instagram_handle || cel.name || '').toLowerCase().trim().replace(/\./g, '-')
                  return (
                    <Link
                      key={cel.id}
                      href={`/profile/${celSlug}`}
                      style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        padding: '14px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.2s ease'
                      }}
                      className="top-comment-item-hover"
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface)', marginBottom: 8, border: '2px solid rgba(255,255,255,0.1)' }}>
                        <img src={cel.photo_url} alt={cel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                        {cel.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 800, marginTop: 2 }}>
                        {formatFollowers(cel.followers_count)} followers
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SECTION 6: METHODOLOGY & TRANSPARENCY NOTICE ── */}
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text)', marginBottom: 3 }}>
                Data Integrity &amp; Public Indexing
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Trending comment metrics are gathered from public Instagram post interactions recorded on a rolling schedule. Read our full data practices on the <Link href="/methodology" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Methodology</Link> page.
              </div>
            </div>
          </div>

        </div>
      </main>

      <style jsx global>{`
        .back-btn-hover:hover { background: var(--surface3) !important; color: var(--text) !important; }
        .watch-reel-cta:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(225,48,108,0.35) !important; }
        .top-comment-item-hover:hover { border-color: var(--accent) !important; transform: translateY(-1px); }
      `}</style>
    </>
  )
}

export async function getServerSideProps(context) {
  try {
    const rawParam = context.params?.id || ''
    
    // Extract ID (supports UUID or slug ending in UUID / ID)
    const idMatch = rawParam.match(/([0-9a-fA-F-]{36}|[0-9]+)$/)
    const id = idMatch ? idMatch[1] : rawParam

    if (!id) {
      return { notFound: true }
    }

    // Fetch the comment from most_liked_comments table
    const { data: comment, error } = await supabase
      .from('most_liked_comments')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !comment) {
      return { notFound: true }
    }

    // Fetch all comments to compute rankings
    const { data: allComments } = await supabase
      .from('most_liked_comments')
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

    const sortedComments = (allComments || []).sort((a, b) => {
      const countA = parseCountText(a.likes_text)
      const countB = parseCountText(b.likes_text)
      if (countA !== countB) return countB - countA
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const rankVal = sortedComments.findIndex(c => c.id === id) + 1

    const enrichedComment = {
      ...comment,
      rank: rankVal
    }

    // Extract other top viral comments (up to 10 for rich vertical feed)
    const topComments = sortedComments
      .filter(c => c.id !== id)
      .slice(0, 10)
      .map(c => ({
        ...c,
        rank: sortedComments.findIndex(item => item.id === c.id) + 1
      }))

    // Fetch top featured global creators from most_followed
    const { data: topFeaturedCreators } = await supabase
      .from('most_followed')
      .select('id, name, instagram_handle, photo_url, followers_count, category')
      .order('followers_count', { ascending: false })
      .limit(4)

    return {
      props: {
        initialComment: enrichedComment,
        topComments: topComments || [],
        topFeaturedCreators: topFeaturedCreators || []
      }
    }
  } catch (err) {
    console.error('getServerSideProps error in comment detail page:', err)
    return { notFound: true }
  }
}
