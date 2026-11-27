import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import BottomNav from '../../components/BottomNav'
import {
  ArrowLeft,
  Calendar,
  Users,
  ExternalLink,
  Heart,
  Eye,
  Film,
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  BarChart2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const parseNumber = (text) => {
  if (!text) return 0
  const cleaned = text.toString().trim().toLowerCase()
  const numMatch = cleaned.match(/^([0-9.]+)/)
  if (!numMatch) return 0
  const num = parseFloat(numMatch[1])
  if (isNaN(num)) return 0
  if (cleaned.includes('b') || cleaned.includes('billion')) return num * 1000000000
  if (cleaned.includes('m') || cleaned.includes('million')) return num * 1000000
  if (cleaned.includes('k') || cleaned.includes('thousand')) return num * 1000
  if (cleaned.includes('crore') || cleaned.includes('cr')) return num * 10000000
  if (cleaned.includes('lakh') || cleaned.includes('l')) return num * 100000
  return num
}

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

  // Performance calculations
  const viewsNum = parseNumber(reel?.views_text)
  const likesNum = parseNumber(reel?.likes_text)
  const engagementRatio = (viewsNum > 0 && likesNum > 0) ? ((likesNum / viewsNum) * 100).toFixed(1) : null

  // Qualitative resonance tier
  const resonanceTier = useMemo(() => {
    if (!engagementRatio) return null
    const r = parseFloat(engagementRatio)
    if (r >= 8) return { label: 'Top 1% Viral Resonance', color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: 'Exceptional like-to-view conversion reflecting deep viral audience appreciation.' }
    if (r >= 4.5) return { label: 'High Viral Efficiency', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', text: 'Strong community engagement surpassing category averages.' }
    return { label: 'Broad Discovery Reach', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', text: 'High-volume algorithmic discovery across Instagram surfaces.' }
  }, [engagementRatio])

  // SEO configuration
  const pageTitle = reel ? `Watch ${reel.creator_name || 'Creator'} Reel (Ranked #${reel.rank} in ${reel.category_name}) — Spialr` : 'Watch Instagram Reel — Spialr'
  const pageDescription = reel ? `Watch this viral reel by ${reel.creator_name || 'creator'} on Spialr. Metrics: ${reel.views_text || 'N/A'} views, ${reel.likes_text || 'N/A'} likes. Currently ranked #${reel.rank} in ${reel.category_name}.` : 'Watch viral reels on Spialr.'
  const canonicalUrl = reel ? `https://spialr.com/reel/${router.query.id || id}` : 'https://spialr.com'

  const hasFollowers = followersDisplay && followersDisplay !== '0'
  const hasViews = reel && reel.views_text && reel.views_text !== '0'
  const hasLikes = reel && reel.likes_text && reel.likes_text !== '0'

  const faqItems = [
    {
      q: `What is this reel's ranking on Spialr?`,
      a: `This post currently holds Rank #${reel?.rank || 1} on Spialr's ${reel?.category_name || 'Instagram'} leaderboard based on verified view counts and community interaction.`
    },
    ...(hasLikes ? [{
      q: `How many likes has this post accumulated?`,
      a: `Public snapshot records confirm ${reel?.likes_text} likes for this post.`
    }] : []),
    ...(hasViews ? [{
      q: `How many views does this reel have?`,
      a: `This reel has achieved ${reel?.views_text} views based on latest indexed public data.`
    }] : []),
    ...(engagementRatio ? [{
      q: `What is the engagement efficiency ratio for this reel?`,
      a: `This reel achieves an engagement ratio of ${engagementRatio}%, meaning approximately 1 out of every ${Math.round(100 / parseFloat(engagementRatio))} viewers liked the post.`
    }] : []),
    {
      q: 'How can I watch the original reel directly on Instagram?',
      a: 'Click the "Open Reel on Instagram" button on this page to view the original video, read user comments, and engage directly.'
    }
  ]

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} key="canonical" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {reel?.photo_url && <meta property="og:image" content={reel.photo_url} />}
        <meta property="og:type" content="video.other" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      </Head>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Back to Leaderboard */}
        <button
          onClick={() => router.push('/trending')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '7px 14px',
            borderRadius: 20,
            marginBottom: 16,
            transition: 'all 0.2s ease'
          }}
          className="back-btn-hover"
        >
          <ArrowLeft size={14} /> Back to Leaderboard
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner" /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#ff5252', padding: 40, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Unable to load</h2>
            <p style={{ fontSize: 14, opacity: 0.8 }}>{error}</p>
          </div>
        ) : !reel ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Reel not found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── CARD 1: VIDEO SHOWCASE HERO ── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '22px 20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Creator row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface2)', border: '2px solid var(--border)', flexShrink: 0 }}>
                  {reel.creator_photo_url
                    ? <img src={reel.creator_photo_url} alt={`${reel.creator_name || 'Creator'} avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{initials}</div>
                  }
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {reel.creator_slug ? (
                    <a href={'/profile/' + reel.creator_slug} style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {reel.creator_name?.startsWith('@') ? reel.creator_name : `@${reel.creator_name || 'anonymous'}`}
                    </a>
                  ) : (
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                      {reel.creator_name?.startsWith('@') ? reel.creator_name : `@${reel.creator_name || 'anonymous'}`}
                    </span>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {reel.category_name || 'Instagram'} · Rank #{reel.rank}
                  </div>
                </div>

                {/* Rank badge */}
                <div style={{
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '5px 12px',
                  borderRadius: 20,
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 10px rgba(99,102,241,0.3)'
                }}>
                  Rank #{reel.rank}
                </div>
              </div>

              {/* Large Video Thumbnail Cover */}
              {reel.photo_url && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  maxHeight: 380,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  marginBottom: 16
                }}>
                  <img
                    src={reel.photo_url}
                    alt={reel.title || 'Trending Instagram Reel'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => e.target.style.display = 'none'}
                  />
                  {/* Play Overlay */}
                  <a
                    href={reel.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.25)',
                      textDecoration: 'none',
                      transition: 'background 0.2s ease'
                    }}
                    className="video-overlay-hover"
                  >
                    <div style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: '2px solid rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(6px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      transition: 'transform 0.2s ease'
                    }}
                    className="play-icon-bounce"
                    >
                      <Play size={22} fill="currentColor" style={{ marginLeft: 3 }} />
                    </div>
                  </a>
                </div>
              )}

              {/* Title & Caption */}
              <h1 style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5, margin: '0 0 16px' }}>
                {reel.title ? `"${reel.title}"` : `${reel.creator_name || 'Creator'} - Instagram Reel #${reel.rank}`}
              </h1>

              {/* CTA: Open Post on Instagram */}
              {reel.instagram_link && (
                <a
                  href={reel.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'linear-gradient(135deg, #e1306c, #fd1d1d, #f77737)',
                    color: '#fff',
                    padding: '13px 20px',
                    borderRadius: 12,
                    fontWeight: 750,
                    fontSize: 14.5,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(225,48,108,0.3)',
                    transition: 'all 0.2s'
                  }}
                  className="watch-reel-cta"
                >
                  <ExternalLink size={16} />
                  <span>Open Reel on Instagram</span>
                </a>
              )}

              {/* Recorded Date */}
              {reel.created_at && (
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Calendar size={12} />
                  <span>Indexed: {getFormattedDate(reel.created_at)}</span>
                </div>
              )}
            </div>

            {/* ── CARD 2: PERFORMANCE & VIRAL RESONANCE SCORECARD ── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '22px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={18} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Viral Resonance &amp; Performance Metrics
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Public metrics recorded on Spialr&apos;s rolling leaderboard
                  </p>
                </div>
              </div>

              {/* Stat Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
                {hasViews && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: '#a855f7', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Eye size={12} /> Total Views
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 850, color: '#c084fc', fontFamily: 'var(--font-display)' }}>
                      {reel.views_text}
                    </div>
                  </div>
                )}
                {hasLikes && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: '#ff2a5f', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Heart size={12} /> Total Likes
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 850, color: '#ff2a5f', fontFamily: 'var(--font-display)' }}>
                      {reel.likes_text}
                    </div>
                  </div>
                )}
                {hasFollowers && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: '#6366f1', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Users size={12} /> Creator Followers
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 850, color: '#818cf8', fontFamily: 'var(--font-display)' }}>
                      {followersDisplay}
                    </div>
                  </div>
                )}
              </div>

              {/* Engagement Efficiency Gauge */}
              {engagementRatio && (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      Like-to-View Efficiency:
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: resonanceTier?.color || 'var(--accent)' }}>
                      {engagementRatio}% Conversion
                    </span>
                  </div>
                  {/* Gauge bar */}
                  <div style={{ width: '100%', height: 7, borderRadius: 10, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${Math.min(100, (parseFloat(engagementRatio) / 12) * 100)}%`,
                      height: '100%',
                      borderRadius: 10,
                      background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)'
                    }} />
                  </div>
                  {resonanceTier && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: resonanceTier.color, background: resonanceTier.bg, padding: '3px 8px', borderRadius: 6 }}>
                        {resonanceTier.label}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {resonanceTier.text}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── CARD 3: CREATOR INTELLIGENCE & SPIALR PROFILE RUNWAY ── */}
            {reel.creator_slug ? (
              <div
                onClick={() => router.push(`/profile/${reel.creator_slug}`)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="creator-card-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface2)', border: '2px solid var(--border)', flexShrink: 0 }}>
                    {reel.creator_photo_url ? (
                      <img src={reel.creator_photo_url} alt={reel.creator_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)' }}>{initials}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{reel.creator_name?.startsWith('@') ? reel.creator_name : `@${reel.creator_name}`}</span>
                      <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                        Creator Profile
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      Inspect historical follower growth, Ogive curve &amp; 30-day velocity →
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--accent)', paddingRight: 4 }}>
                  →
                </div>
              </div>
            ) : null}

            {/* ── CARD 4: FREQUENTLY ASKED QUESTIONS (FAQ) ── */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={17} color="#a855f7" />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                  Questions About This Reel
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {faqItems.map((faq, idx) => (
                  <ReelFAQItem key={idx} faq={faq} />
                ))}
              </div>
            </div>

            {/* ── CARD 5: MORE FROM THIS CREATOR ── */}
            {moreFromCreator.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Film size={16} color="#ec4899" /> More from {reel.creator_name || 'Creator'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 12 }}>
                  {moreFromCreator.map(item => (
                    <a key={item.id} href={`/reel/${generateReelSlug(item)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s' }}
                        className="thumb-card-hover"
                      >
                        <div style={{ height: 160, position: 'relative', background: 'var(--surface2)' }}>
                          <img src={item.photo_url} alt={`${item.title || 'Instagram reel'} thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {item.views_text || item.likes_text}
                          </div>
                        </div>
                        <div style={{ padding: '8px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                          {item.title || 'Watch Reel'}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── CARD 6: TOP IN CATEGORY ── */}
            {topCategoryReels.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔥 Top in {reel.category_name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 12 }}>
                  {topCategoryReels.map(item => (
                    <a key={item.id} href={`/reel/${generateReelSlug(item)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s' }}
                        className="thumb-card-hover"
                      >
                        <div style={{ height: 160, position: 'relative', background: 'var(--surface2)' }}>
                          <img src={item.photo_url} alt={`${item.title || 'Instagram reel'} thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {item.views_text || item.likes_text}
                          </div>
                        </div>
                        <div style={{ padding: '8px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                          {item.title || 'Watch Reel'}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        .back-btn-hover:hover { background: var(--surface3) !important; color: var(--text) !important; }
        .watch-reel-cta:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(225,48,108,0.4) !important; }
        .watch-reel-cta:active { transform: translateY(0); }
        .creator-card-hover:hover { border-color: var(--accent) !important; transform: translateY(-1px); }
        .thumb-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .video-overlay-hover:hover .play-icon-bounce { transform: scale(1.1); background: rgba(225, 48, 108, 0.85) !important; }
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
    } else {
      sortedReels = (tableData || []).sort((a, b) => {
        const countA = parseCountText(a.likes_text)
        const countB = parseCountText(b.likes_text)
        if (countA !== countB) return countB - countA
        return new Date(b.created_at) - new Date(a.created_at)
      })
    }

    const rankVal = sortedReels.findIndex(r => r.id === id) + 1
    const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
    let celebrity = celebrityMap[nameKey] || null

    // If not found in celebrities, check most_followed table
    if (!celebrity) {
      const { data: mfMatch } = await supabase
        .from('most_followed')
        .select('name, instagram_handle, photo_url, followers_count')
        .or(`instagram_handle.ilike.%${nameKey}%,name.ilike.%${nameKey}%`)
        .limit(1)
        .maybeSingle()

      if (mfMatch) {
        celebrity = {
          name: mfMatch.name,
          slug: (mfMatch.instagram_handle || mfMatch.name || '').toLowerCase().trim().replace(/\./g, '-'),
          photo_url: mfMatch.photo_url,
          followers_count: mfMatch.followers_count
        }
      }
    }

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
      .slice(0, 6)
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
      .slice(0, 6)
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
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.2s ease'
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
          padding: '14px 20px',
          background: open ? 'var(--surface2)' : 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span>{faq.q}</span>
        {open ? <ChevronUp size={16} color="var(--accent)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 14px', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          {faq.a}
        </div>
      )}
    </div>
  )
}
