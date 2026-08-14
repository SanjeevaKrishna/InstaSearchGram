import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PostCard from '../../components/PostCard'
import Logo from '../../components/Logo'
import { TrendingUp, Eye, Heart, ThumbsUp, Search, MessageSquare, Star, Tv, Sparkles, Share2, Repeat2, GitCompare, X, Percent, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const normalizeBioText = (text) => {
  if (!text) return text;
  return text
    .replace(/\bPowerful Acting\b/g, 'powerful acting')
    .replace(/\bBold Personality\b/g, 'bold personality')
    .replace(/\bUnique Style\b/g, 'unique style')
    .replace(/\bDynamic Presence\b/g, 'dynamic presence')
    .replace(/\bEngaging Content\b/g, 'engaging content')
    .replace(/\bStrong Screen Presence\b/g, 'strong screen presence')
    .replace(/\bExceptional Talent\b/g, 'exceptional talent');
}

// ─── Data-driven profile narrative generator ────────────────────────────────
// Produces structurally different text for each follower tier, account age,
// and posting behaviour. Deterministic: same inputs → same output every render.
function generateProfileNarrative(cel, liveRank, postsCount, posts = []) {
  const name = cel.name || 'This creator'
  const followers = Number(cel.followers_count || 0)
  const postsNum = Number(cel.posts_count || postsCount || 0)
  const year = cel.account_created_year ? Number(cel.account_created_year) : null
  const currentYear = 2026
  const age = year ? currentYear - year : null
  const handle = cel.instagram_handle ? `@${cel.instagram_handle}` : null
  const avgViews = Number(cel.average_views || 0)
  const engagement = Number(cel.followers_interaction || 0)

  const fmt = (n) => {
    if (!n) return null
    if (n >= 1e9) return `${(Math.floor(n / 1e8) / 10).toString().replace(/\.0$/, '')}B`
    if (n >= 1e6) return `${(Math.floor(n / 1e5) / 10).toString().replace(/\.0$/, '')}M`
    if (n >= 1e3) return `${(Math.floor(n / 1e2) / 10).toString().replace(/\.0$/, '')}K`
    return n.toString()
  }

  const parts = []



  // ── Paragraph 2: account age & posting context — varies by age ─────────────
  if (age && postsNum) {
    const postsPerYear = Math.round(postsNum / age)
    if (age >= 10) {
      parts.push(
        `The account dates back to ${year}, making it over a decade old. Across that time, ${name} has published around ${fmt(postsNum)} posts` +
        ` — an average of roughly ${postsPerYear.toLocaleString()} posts per year. This level of longevity on the platform signals sustained audience investment rather than a short-term viral spike.`
      )
    } else if (age >= 5) {
      parts.push(
        `Active since ${year} (${age} years on the platform), ${name} has built up a library of approximately ${fmt(postsNum)} posts,` +
        ` averaging around ${postsPerYear.toLocaleString()} per year. This steady publishing cadence suggests deliberate, consistent content strategy rather than purely reactive posting.`
      )
    } else if (age >= 2) {
      parts.push(
        `The account was established in ${year}, giving ${name} roughly ${age} years to grow their ${fmt(followers)}-follower base through ${fmt(postsNum)} posts.` +
        ` Achieving this audience size in a relatively short window points to strong content momentum and audience resonance.`
      )
    } else if (age === 1) {
      parts.push(
        `Having joined Instagram in ${year}, ${name} is a relatively recent entrant who has already accumulated ${fmt(followers)} followers and ${fmt(postsNum)} posts.` +
        ` That rate of audience growth within a single year is a notable indicator of early traction.`
      )
    }
  } else if (postsNum) {
    parts.push(
      `The profile shows ${fmt(postsNum)} total posts indexed on Spialr. ` +
      (postsNum > 2000
        ? `This high post volume suggests a long-standing, prolific content history.`
        : postsNum > 500
        ? `This moderate post count reflects a steady, consistent publishing approach.`
        : `A focused post count like this can indicate selective, quality-over-quantity publishing.`)
    )
  }

  // ── Paragraph 3: engagement or views context ────────────────────────────────
  if (avgViews && avgViews > 0) {
    const viewsVsFollowers = followers > 0 ? ((avgViews / followers) * 100).toFixed(1) : null
    if (Number(viewsVsFollowers) >= 50) {
      parts.push(
        `Reels from ${name} average ${fmt(avgViews)} views each — a reach that represents ${viewsVsFollowers}% of the follower base per video, indicating unusually strong content spread beyond existing followers.`
      )
    } else if (Number(viewsVsFollowers) >= 10) {
      parts.push(
        `With an average of ${fmt(avgViews)} views per reel, ${name}'s video content consistently reaches a broad slice of their audience, pointing to solid algorithmic distribution.`
      )
    } else {
      parts.push(
        `Spialr tracks an average of ${fmt(avgViews)} views per reel for ${name}. At this scale of followers, even a fraction of the audience represents millions of individual views per video.`
      )
    }
  } else if (engagement && engagement > 0) {
    const engLabel = engagement >= 5 ? 'high' : engagement >= 2 ? 'healthy' : 'measured'
    parts.push(
      `${name} records a ${engLabel} followers-interaction rate of ${Number(engagement).toFixed(2)}% — a metric Spialr calculates as average post interactions divided by total followers. A ${engLabel} rate at this follower scale is a meaningful signal of genuine audience connection.`
    )
  }

  // ── Paragraph 4: Post-level dynamics ───────────────────────────────────────
  if (posts && posts.length > 0) {
    const sortedPosts = [...posts].sort((a, b) => new Date(a.post_date) - new Date(b.post_date))
    const recentPosts = sortedPosts.slice(-10)
    const oldPosts = sortedPosts.slice(0, 10)
    
    if (recentPosts.length > 5 && oldPosts.length > 5) {
      const recentAvgViews = recentPosts.reduce((acc, p) => acc + (Number(p.views) || 0), 0) / recentPosts.length
      const oldAvgViews = oldPosts.reduce((acc, p) => acc + (Number(p.views) || 0), 0) / oldPosts.length
      
      const recentAvgReposts = recentPosts.reduce((acc, p) => acc + (Number(p.reposts) || 0), 0) / recentPosts.length
      const oldAvgReposts = oldPosts.reduce((acc, p) => acc + (Number(p.reposts) || 0), 0) / oldPosts.length

      let dynamicInsight = ''
      if (recentAvgViews > oldAvgViews * 1.5) {
        dynamicInsight += ` Recent content shows a significant surge in reach, with views trending upward compared to earlier posts.`
      } else if (recentAvgViews && oldAvgViews) {
        dynamicInsight += ` Viewership has remained remarkably consistent across the indexed timeline.`
      }

      if (recentAvgReposts > oldAvgReposts * 1.2) {
        dynamicInsight += ` Additionally, there is a clear upward trend in repost growth rate, indicating that newer content is highly shareable.`
      }

      if (dynamicInsight) {
        parts.push(`An analysis of manually compiled post-level data reveals shifting engagement dynamics.` + dynamicInsight)
      }
    }
  }

  // ── Paragraph 5: ranking methodology note ──────────────────────────────────
  parts.push(
    `Spialr ranks profiles by verified follower count sourced from public Instagram data, updated on a rolling basis. ` +
    `${name}'s position on the leaderboard reflects their standing at the time of the most recent data refresh. ` +
    `All engagement figures — views, likes, comments, shares — are aggregated from posts manually indexed in Spialr's database (not scraped via API) and do not include data from private or archived posts.`
  )

  return parts
}
// ────────────────────────────────────────────────────────────────────────────

export default function CelebrityPage({ initialCelebrity, initialPosts, initialCompareCelebrity, otherCelebrities = [], liveRank = null, compareLiveRank = null }) {
  const router = useRouter()
  const { slug, compare } = router.query

  const [celebrity, setCelebrity] = useState(initialCelebrity)
  const [postsCount, setPostsCount] = useState(initialPosts?.length || 0)
  const [posts, setPosts] = useState(initialPosts || [])
  const [loading, setLoading] = useState(false)

  // Search states
  const [tagSearch, setTagSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  // Compare states
  const [compareCelebrity, setCompareCelebrity] = useState(initialCompareCelebrity)
  const [loadingCompare, setLoadingCompare] = useState(false)

  const getWinner = (val1, val2) => {
    const n1 = Number(val1 || 0)
    const n2 = Number(val2 || 0)
    if (n1 === 0 && n2 === 0) return { cel1: false, cel2: false }
    if (n1 > n2) return { cel1: true, cel2: false }
    if (n2 > n1) return { cel1: false, cel2: true }
    return { cel1: false, cel2: false }
  }

  useEffect(() => {
    setCelebrity(initialCelebrity)
    setPostsCount(initialPosts?.length || 0)
    setPosts(initialPosts || [])
    setCompareCelebrity(initialCompareCelebrity)
  }, [initialCelebrity, initialPosts, initialCompareCelebrity])

  const goResults = (params) => {
    const query = new URLSearchParams({ slug, ...params })
    router.push(`/results?${query.toString()}`)
  }

  const formatCount = (n) => {
    if (!n) return '—'
    const num = Number(n)
    if (isNaN(num)) return n.toString()

    if (num >= 1e12) return `${(Math.floor(num / 1e11) / 10).toString().replace(/\.0$/, '')}T`
    if (num >= 1e9) return `${(Math.floor(num / 1e8) / 10).toString().replace(/\.0$/, '')}B`
    if (num >= 1e6) return `${(Math.floor(num / 1e5) / 10).toString().replace(/\.0$/, '')}M`
    if (num >= 1000) return `${(Math.floor(num / 100) / 10).toString().replace(/\.0$/, '')}K`
    return num.toString()
  }


  const playlists = {}
  posts.forEach(p => {
    if (p.playlist_name) {
      if (!playlists[p.playlist_name]) playlists[p.playlist_name] = []
      playlists[p.playlist_name].push(p)
    }
  })
  const hasPlaylists = Object.keys(playlists).length > 0

  if (loading) return (
    <>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </>
  )

  if (!celebrity) return (
    <>
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Search size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <p style={{ margin: 0 }}>Celebrity not found</p>
        <button onClick={() => router.push('/')} className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to search</button>
      </div>
    </>
  )

  if (loadingCompare) return (
    <>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </>
  )

  if (compareCelebrity) {
    const cel1Followers = Number(celebrity.followers_count || 0)
    const cel2Followers = Number(compareCelebrity.followers_count || 0)

    const cel1Posts = Number(celebrity.posts_count || postsCount || 0)
    const cel2Posts = Number(compareCelebrity.posts_count || 0)

    const followersWinner = getWinner(cel1Followers, cel2Followers)
    const postsWinner = getWinner(cel1Posts, cel2Posts)
    const reelViewsWinner = getWinner(celebrity.total_reel_views, compareCelebrity.total_reel_views)
    const reelLikesWinner = getWinner(celebrity.total_reel_likes, compareCelebrity.total_reel_likes)
    const postLikesWinner = getWinner(celebrity.total_post_likes, compareCelebrity.total_post_likes)
    const commentsWinner = getWinner(celebrity.total_comments, compareCelebrity.total_comments)
    const sharesWinner = getWinner(celebrity.total_shares, compareCelebrity.total_shares)
    const repostsWinner = getWinner(celebrity.total_reposts, compareCelebrity.total_reposts)
    const avgViewsWinner = getWinner(celebrity.average_views, compareCelebrity.average_views)
    const avgReelLikesWinner = getWinner(celebrity.average_reel_likes, compareCelebrity.average_reel_likes)
    const avgPostLikesWinner = getWinner(celebrity.average_post_likes, compareCelebrity.average_post_likes)
    const followersInteractionWinner = getWinner(celebrity.followers_interaction, compareCelebrity.followers_interaction)
    const mostLikesWinner = getWinner(celebrity.most_likes, compareCelebrity.most_likes)

    const renderMetricComparison = (label, icon, val1, val2, winnerObj, cardClass, isPercent = false) => {
      const formattedVal1 = isPercent ? (val1 ? Number(val1).toFixed(2) + '%' : '0.00%') : formatCount(val1)
      const formattedVal2 = isPercent ? (val2 ? Number(val2).toFixed(2) + '%' : '0.00%') : formatCount(val2)

      return (
        <div style={{ marginBottom: 12 }}>
          {/* Metric Label Header */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: 11, 
            fontWeight: 800, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}>
            {icon}
            <span>{label}</span>
          </div>
          
          {/* Split Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Left Card */}
            <div className={`analytics-card-compact ${cardClass}`} style={{ position: 'relative', width: '100%', border: '1px solid var(--border)' }}>
              {winnerObj.cel1 && (
                <div style={{ 
                  position: 'absolute', 
                  top: 6, 
                  right: 6, 
                  background: 'var(--accent)', 
                  color: '#fff', 
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(225, 48, 108, 0.25)'
                }}>
                  <TrendingUp size={10} strokeWidth={3} />
                </div>
              )}
              <div className="analytics-card-num-compact" style={{ fontSize: 20 }}>
                {formattedVal1}
              </div>
            </div>

            {/* Right Card */}
            <div className={`analytics-card-compact ${cardClass}`} style={{ position: 'relative', width: '100%', border: '1px solid var(--border)' }}>
              {winnerObj.cel2 && (
                <div style={{ 
                  position: 'absolute', 
                  top: 6, 
                  right: 6, 
                  background: 'var(--accent)', 
                  color: '#fff', 
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(225, 48, 108, 0.25)'
                }}>
                  <TrendingUp size={10} strokeWidth={3} />
                </div>
              )}
              <div className="analytics-card-num-compact" style={{ fontSize: 20 }}>
                {formattedVal2}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        <Head>
          <title>{`${celebrity.name?.trim()} vs ${compareCelebrity.name?.trim()} — Spialr`}</title>
        </Head>

        
        <main style={{ maxWidth: 850, margin: '0 auto', padding: '24px 20px 80px', width: '100%' }} className="fade-in">
          {/* Back Button */}
          <button 
            onClick={() => router.push(`/celebrity/${slug}`)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 13, 
              color: 'var(--text-muted)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 4, 
              marginBottom: 24, 
              cursor: 'pointer', 
              padding: 0 
            }}
          >
            ← Back to Profile
          </button>

          {/* Profile Split Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28, position: 'relative' }}>
            
            {/* VS Divider badge */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '35px',
              transform: 'translateX(-50%)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(225, 48, 108, 0.3)',
              zIndex: 10
            }}>
              VS
            </div>

            {/* Left Celebrity Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{
                width: 70, height: 70, borderRadius: 14, background: 'var(--surface2)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800,
                overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', flexShrink: 0, marginBottom: 12
              }}>
                {celebrity.photo_url ? (
                  <img src={celebrity.photo_url} alt={celebrity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                ) : celebrity.name?.charAt(0).toUpperCase()}
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 2,
                textAlign: 'center',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {celebrity.name}
              </h2>
              {celebrity.instagram_handle && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{celebrity.instagram_handle}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>
                  {celebrity.followers_count ? formatCount(celebrity.followers_count) : '—'} followers
                </span>
                {celebrity.account_created_year && (
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
                    Joined: {celebrity.account_created_year}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                  {formatCount(celebrity.posts_count || postsCount)} posts
                </span>
                {liveRank && (
                  <span style={{ fontSize: 11.5, color: '#e1306c', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                    Ranked #{liveRank} Most Followed
                  </span>
                )}
              </div>
            </div>

            {/* Right Celebrity Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{
                width: 70, height: 70, borderRadius: 14, background: 'var(--surface2)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800,
                overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', flexShrink: 0, marginBottom: 12
              }}>
                {compareCelebrity.photo_url ? (
                  <img src={compareCelebrity.photo_url} alt={compareCelebrity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                ) : compareCelebrity.name?.charAt(0).toUpperCase()}
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 2,
                textAlign: 'center',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {compareCelebrity.name}
              </h2>
              {compareCelebrity.instagram_handle && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{compareCelebrity.instagram_handle}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>
                  {compareCelebrity.followers_count ? formatCount(compareCelebrity.followers_count) : '—'} followers
                </span>
                {compareCelebrity.account_created_year && (
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
                    Joined: {compareCelebrity.account_created_year}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                  {formatCount(compareCelebrity.posts_count)} posts
                </span>
                {compareLiveRank && (
                  <span style={{ fontSize: 11.5, color: '#e1306c', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                    Ranked #{compareLiveRank} Most Followed
                  </span>
                )}
              </div>
            </div>

          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: '24px 0 20px' }} />

          {/* Account Insights Section */}
          <h3 className="analytics-title" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <TrendingUp size={18} strokeWidth={2.5} /> Comparative Insights
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {renderMetricComparison('Reel Views', <Eye size={14} style={{ color: '#ff6b35' }} />, celebrity.total_reel_views, compareCelebrity.total_reel_views, reelViewsWinner, 'analytics-card-views')}
            {renderMetricComparison('Reel Likes', <Heart size={14} style={{ color: '#ff2a5f' }} />, celebrity.total_reel_likes, compareCelebrity.total_reel_likes, reelLikesWinner, 'analytics-card-reel-likes')}
            {renderMetricComparison('Post Likes', <ThumbsUp size={14} style={{ color: '#ffa751' }} />, celebrity.total_post_likes, compareCelebrity.total_post_likes, postLikesWinner, 'analytics-card-post-likes')}
            {renderMetricComparison('Total Comments', <MessageSquare size={14} style={{ color: '#8f00ff' }} />, celebrity.total_comments, compareCelebrity.total_comments, commentsWinner, 'analytics-card-comments')}
            {renderMetricComparison('Total Shares', <Share2 size={14} style={{ color: '#2ec4b6' }} />, celebrity.total_shares, compareCelebrity.total_shares, sharesWinner, 'analytics-card-shares')}
            {renderMetricComparison('Total Repost', <Repeat2 size={14} style={{ color: '#10b981' }} />, celebrity.total_reposts, compareCelebrity.total_reposts, repostsWinner, 'analytics-card-reposts')}
            {renderMetricComparison('Average Views', <Eye size={14} style={{ color: '#ff6b35' }} />, celebrity.average_views, compareCelebrity.average_views, avgViewsWinner, 'analytics-card-views')}
            {renderMetricComparison('Average Reel Likes', <Heart size={14} style={{ color: '#ff2a5f' }} />, celebrity.average_reel_likes, compareCelebrity.average_reel_likes, avgReelLikesWinner, 'analytics-card-reel-likes')}
            {renderMetricComparison('Average Post Likes', <ThumbsUp size={14} style={{ color: '#ffa751' }} />, celebrity.average_post_likes, compareCelebrity.average_post_likes, avgPostLikesWinner, 'analytics-card-post-likes')}
            {renderMetricComparison('Followers Interaction', <Percent size={14} style={{ color: '#e1306c' }} />, celebrity.followers_interaction, compareCelebrity.followers_interaction, followersInteractionWinner, 'analytics-card-comments', true)}
            {renderMetricComparison('Most Likes', <Heart size={14} style={{ color: '#ff2a5f' }} />, celebrity.most_likes, compareCelebrity.most_likes, mostLikesWinner, 'analytics-card-reel-likes')}
          </div>
          
          <div 
            className="gradient-text"
            style={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 24,
              fontStyle: 'italic',
              letterSpacing: '0.02em'
            }}
          >
            Your View, Your Like, Your Comment, Your Repost Counts
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{`${celebrity.name?.trim()} Instagram Stats & Follower Count — Spialr`}</title>
        <meta
          name="description"
          content={`${celebrity.name} has ${formatCount(celebrity.followers_count)} Instagram followers${celebrity.account_created_year ? `, active since ${celebrity.account_created_year}` : ''}${celebrity.posts_count ? ` with ${formatCount(celebrity.posts_count)} posts` : ''}. View live follower rankings, reel stats, post analytics and more on Spialr.`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": celebrity.name,
              "url": `https://spialr.com/celebrity/${celebrity.slug}`,
              "image": celebrity.photo_url || '',
              "interactionStatistic": [
                {
                  "@type": "InteractionCounter",
                  "interactionType": "https://schema.org/FollowAction",
                  "userInteractionCount": celebrity.followers_count
                }
              ]
            })
          }}
        />
      </Head>

      
      <main style={{ maxWidth: 850, margin: '0 auto', padding: '24px 20px 80px', width: '100%' }}>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              router.back()
            } else {
              router.push('/')
            }
          }} 
          style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, cursor: 'pointer', padding: 0 }}
        >
          ← Back to Search
        </button>



        {/* Profile Header — matches All Profiles list card style */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>

          {/* Circle avatar with gradient story ring — same as All Profiles */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--gradient)',
            padding: 3,
            flexShrink: 0,
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--surface)',
              padding: 2,
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                color: 'white',
                overflow: 'hidden',
              }}>
                {celebrity.photo_url ? (
                  <img
                    src={celebrity.photo_url}
                    alt={celebrity.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : celebrity.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Name, Handle & Metadata */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}>
                {celebrity.name}
              </h1>
              {celebrity.instagram_handle && (
                <div style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  marginBottom: 8
                }}>
                  @{celebrity.instagram_handle}
                </div>
              )}
              {/* Followers · Posts · Joined — same info as All Profiles row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 600 }}>
                  <strong>{celebrity.followers_count ? formatCount(celebrity.followers_count) : '—'}</strong> followers
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  <strong>{formatCount(celebrity.posts_count || postsCount)}</strong> posts
                </span>
                {celebrity.account_created_year && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                    Joined: <strong>{celebrity.account_created_year}</strong>
                  </span>
                )}
                {liveRank && (
                  <span style={{ fontSize: 13, color: '#e1306c', fontWeight: 700, marginTop: 2 }}>
                    Ranked #{liveRank} Most Followed
                  </span>
                )}
              </div>
            </div>

            {/* Compare Button */}
            <button
              onClick={() => router.push(`/all?compare=${slug}`)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(225, 48, 108, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Compare
            </button>
          </div>
        </div>


        {/* Account Insights (Premium Analytics Cards) */}
        {(celebrity.total_reel_views || celebrity.total_reel_likes || celebrity.total_post_likes || celebrity.total_comments || celebrity.total_shares || celebrity.total_reposts) ? (
          <div className="analytics-section">
            <h3 className="analytics-title">
              <TrendingUp size={18} strokeWidth={2.5} /> Account Insights
            </h3>

            <div className="analytics-grid-three">
              {/* Card 1: Reel Views */}
              <div className="analytics-card-compact analytics-card-views">
                <Eye size={20} strokeWidth={2} style={{ color: '#ff6b35', marginBottom: 8 }} />
                <div className="analytics-card-num-compact gradient-text">
                  {formatCount(celebrity.total_reel_views)}
                </div>
                <div className="analytics-card-label-compact">
                  Reel Views
                </div>
              </div>

              {/* Card 2: Reel Likes */}
              <div className="analytics-card-compact analytics-card-reel-likes">
                <Heart size={20} strokeWidth={2} style={{ color: '#ff2a5f', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_reel_likes)}
                </div>
                <div className="analytics-card-label-compact">
                  Reel Likes
                </div>
              </div>

              {/* Card 3: Post Likes */}
              <div className="analytics-card-compact analytics-card-post-likes">
                <ThumbsUp size={20} strokeWidth={2} style={{ color: '#ffa751', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_post_likes)}
                </div>
                <div className="analytics-card-label-compact">
                  Post Likes
                </div>
              </div>

              {/* Card 4: Total Comments */}
              <div className="analytics-card-compact analytics-card-comments">
                <MessageSquare size={20} strokeWidth={2} style={{ color: '#8f00ff', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_comments)}
                </div>
                <div className="analytics-card-label-compact">
                  Total Comments
                </div>
              </div>

              {/* Card 5: Total Shares */}
              <div className="analytics-card-compact analytics-card-shares">
                <Share2 size={20} strokeWidth={2} style={{ color: '#2ec4b6', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_shares)}
                </div>
                <div className="analytics-card-label-compact">
                  Total Shares
                </div>
              </div>

              {/* Card 6: Total Repost */}
              <div className="analytics-card-compact analytics-card-reposts">
                <Repeat2 size={20} strokeWidth={2} style={{ color: '#10b981', marginBottom: 8 }} />
                <div className="analytics-card-num-compact">
                  {formatCount(celebrity.total_reposts)}
                </div>
                <div className="analytics-card-label-compact">
                  Total Repost
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 20,
              padding: '12px 16px',
              background: 'var(--surface2)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--text-dim)',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
              <span>Manually verified as of {new Date(celebrity.updated_at || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, across <strong>{formatCount(celebrity.posts_count || postsCount)}</strong> posts.</span>
            </div>
          </div>
        ) : null}



        {/* Tabs Navigation or Beautiful Divider */}
        {!celebrity.has_full_details ? (
          <div style={{
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
            margin: '24px 0 32px',
            opacity: 0.8
          }} />
        ) : (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <button 
              onClick={() => setActiveTab('posts')}
              style={{ 
                flex: 1, padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: activeTab === 'posts' ? 'var(--text)' : 'var(--text-muted)',
                borderBottom: activeTab === 'posts' ? '2px solid var(--text)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Posts
            </button>
            <button 
              onClick={() => setActiveTab('playlists')}
              style={{ 
                flex: 1, padding: '16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, color: activeTab === 'playlists' ? 'var(--text)' : 'var(--text-muted)',
                borderBottom: activeTab === 'playlists' ? '2px solid var(--text)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Playlists
            </button>
          </div>
        )}


        {activeTab === 'posts' && (
          <div className="fade-in">
            {/* Search within posts */}
            {celebrity.has_full_details && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    className="input-field"
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && tagSearch.trim() && goResults({ search: tagSearch.trim() })}
                    placeholder="Search any key word for Post..."
                    style={{ fontSize: 16, padding: '16px 110px 16px 20px', borderRadius: 16, background: 'var(--surface)', width: '100%' }}
                  />
                  <button
                    onClick={() => tagSearch.trim() && goResults({ search: tagSearch.trim() })}
                    disabled={!tagSearch.trim()}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: tagSearch.trim() ? 'var(--accent)' : 'var(--surface2)',
                      border: 'none',
                      borderRadius: 12,
                      color: tagSearch.trim() ? 'white' : 'var(--text-muted)',
                      padding: '10px 18px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: tagSearch.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: tagSearch.trim() ? '0 4px 12px rgba(225, 48, 108, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      opacity: tagSearch.trim() ? 1 : 0.6,
                    }}
                    onMouseEnter={e => {
                      if (tagSearch.trim()) {
                        e.currentTarget.style.filter = 'brightness(1.1)'
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.filter = 'brightness(1)'
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                    }}
                  >
                    <span>Search</span>
                    <Search size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Highlights Header */}
            <h3 className="analytics-title" style={{ marginTop: 8, marginBottom: 16 }}>
              <Sparkles size={16} strokeWidth={2.5} style={{ color: 'var(--accent)' }} /> Highlights
            </h3>

            {/* Filter Buttons Grid (2x2) */}
            <div className="profile-filter-grid" style={{ marginBottom: !celebrity.has_full_details ? 0 : 32 }}>
              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'most_liked' })}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>❤️</span>
                <span className="profile-filter-title">Most Liked</span>
              </button>

              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'most_commented' })}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
                <span className="profile-filter-title">Most Commented</span>
              </button>

              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'most_viewed' })}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>👁️</span>
                <span className="profile-filter-title">Most Viewed</span>
              </button>

              <button className="profile-filter-btn" onClick={() => goResults({ filter: 'first_post' })}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⭐</span>
                <span className="profile-filter-title">First Post</span>
              </button>
            </div>

            {/* Description removed from here, placed at the end below timeline */}

            {celebrity.has_full_details && (
              <>
                <div style={{ width: '100%', height: 1, background: 'var(--border)', marginBottom: 32 }} />

                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-display)' }}>Find by Timeline</h3>

                {/* Date Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>Select Specific Date</label>
                    <input type="date" className="input-field" onChange={e => e.target.value && goResults({ date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>Select Month-Year</label>
                    <input type="month" className="input-field" onChange={e => e.target.value && goResults({ month: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 12 }} />
                  </div>
                </div>
                
                <div className="card" style={{ padding: '20px', borderRadius: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 16, fontWeight: 600 }}>Search Date Range</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Start Date</label>
                      <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', borderRadius: 8 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>End Date</label>
                      <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', borderRadius: 8 }} />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 8 }}
                    onClick={() => {
                      if (dateFrom || dateTo) goResults({ start: dateFrom, end: dateTo })
                    }}
                    disabled={!dateFrom && !dateTo}
                  >
                    Search Timeline
                  </button>
                </div>
              </>
            )}


            {/* About & Social Media Insights (AdSense / SEO Compliance) */}
            <div style={{ marginBottom: 32, width: '100%' }}>
              <div style={{
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
                margin: '32px 0 24px',
                opacity: 0.8
              }} />
              
              {celebrity.description && (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>
                    About {celebrity.name}
                  </h3>
                  <p style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 20, wordBreak: 'break-word' }}>
                    {normalizeBioText(celebrity.description)}
                  </p>
                  
                  {/* Pink-Red divider line */}
                  <div style={{
                    width: '100%',
                    height: '1.5px',
                    background: 'linear-gradient(90deg, var(--accent) 0%, transparent 100%)',
                    margin: '24px 0 28px',
                    opacity: 0.7
                  }} />
                </>
              )}

            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="fade-in">
            {!hasPlaylists ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Tv size={40} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ margin: 0 }}>No playlists available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {Object.entries(playlists).map(([title, pList]) => (
                  <div key={title} style={{ cursor: 'pointer' }} onClick={() => goResults({ playlist: title })}
                    onMouseEnter={e => {
                      const img = e.currentTarget.querySelector('.playlist-img')
                      if (img) img.style.transform = 'scale(1.08)'
                      e.currentTarget.lastElementChild.style.color = 'var(--accent)'
                      e.currentTarget.firstElementChild.style.borderColor = 'var(--border-bright)'
                      e.currentTarget.firstElementChild.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={e => {
                      const img = e.currentTarget.querySelector('.playlist-img')
                      if (img) img.style.transform = 'scale(1)'
                      e.currentTarget.lastElementChild.style.color = 'var(--text)'
                      e.currentTarget.firstElementChild.style.borderColor = 'var(--border)'
                      e.currentTarget.firstElementChild.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Thumbnail box */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      background: 'var(--surface2)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      marginBottom: 16,
                      border: '1px solid var(--border)',
                      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    }}>
                      {/* Gradient or Image Background */}
                      {pList.find(p => p.playlist_cover_url)?.playlist_cover_url ? (
                        <img 
                          className="playlist-img"
                          src={pList.find(p => p.playlist_cover_url).playlist_cover_url} 
                          alt={title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s var(--spring)' }} 
                        />
                      ) : (
                        <div className="playlist-img" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1f1c2c, #928DAB)', transition: 'transform 0.5s var(--spring)' }} />
                      )}
                      
                      {/* Overlay for count */}
                      <div style={{
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0, width: '40%',
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', gap: 8, backdropFilter: 'blur(4px)'
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 700 }}>{pList.length}</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </div>
                    </div>
                    {/* Title and link */}
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)', transition: 'color 0.2s', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>View full playlist</span>
                  </div>
                ))}
              </div>
            )}
            {/* OTHER FEATURED CREATORS SECTION */}
            {otherCelebrities && otherCelebrities.length > 0 && (
              <div style={{
                marginTop: 48,
                borderTop: '1px solid var(--border)',
                paddingTop: 32,
              }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text)',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  ✨ View Other Creator Profiles
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 16
                }}>
                  {otherCelebrities.map((cel) => (
                    <a 
                      key={cel.id} 
                      href={`/celebrity/${cel.slug}`} 
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'var(--border-bright)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                      }}
                      >
                        {cel.photo_url ? (
                          <img 
                            src={cel.photo_url} 
                            alt={cel.name} 
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '2px solid var(--border)', display: 'block', margin: '0 auto 12px auto' }} 
                          />
                        ) : (
                          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, margin: '0 auto 12px auto' }}>
                            {cel.name?.charAt(0)}
                          </div>
                        )}
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cel.name}
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


    </>
  )
}

export async function getServerSideProps(context) {
  const { slug, compare } = context.query

  try {
    const { data: celebrity, error: celError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', slug)
      .single()

    if (celError || !celebrity || celebrity.hide_search) {
      return {
        notFound: true
      }
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .order('post_date', { ascending: false })

    if (postsError) throw postsError

    let compareCelebrity = null
    if (compare) {
      const { data: compData } = await supabase
        .from('celebrities')
        .select('*')
        .eq('slug', compare)
        .single()
      if (compData && !compData.hide_search) {
        compareCelebrity = compData
      }
    }

    // Fetch leaderboard data for rank calculations (highly robust, ignores case, spaces, and punctuation)
    const { data: leaderboardData } = await supabase
      .from('most_followed')
      .select('name, followers_count, instagram_handle')
      .order('followers_count', { ascending: false })

    let liveRank = null
    if (leaderboardData) {
      const matchIndex = leaderboardData.findIndex(item => {
        // 1. Match by unique instagram_handle first
        if (item.instagram_handle && celebrity.instagram_handle) {
          return item.instagram_handle.toLowerCase().trim() === celebrity.instagram_handle.toLowerCase().trim()
        }
        // 2. Fallback to robust name matching
        const cleanCelName = celebrity.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const cleanItemName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        return cleanItemName === cleanCelName || cleanItemName.includes(cleanCelName)
      })
      if (matchIndex !== -1) {
        liveRank = matchIndex + 1
      }
    }

    let compareLiveRank = null
    if (compareCelebrity && leaderboardData) {
      const matchIndex = leaderboardData.findIndex(item => {
        // 1. Match by unique instagram_handle first
        if (item.instagram_handle && compareCelebrity.instagram_handle) {
          return item.instagram_handle.toLowerCase().trim() === compareCelebrity.instagram_handle.toLowerCase().trim()
        }
        // 2. Fallback to robust name matching
        const cleanCompName = compareCelebrity.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const cleanItemName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        return cleanItemName === cleanCompName || cleanItemName.includes(cleanCompName)
      })
      if (matchIndex !== -1) {
        compareLiveRank = matchIndex + 1
      }
    }

    // Fetch 4 other celebrities for internal linking and Adsense thin page prevention
    const { data: otherCelebrities } = await supabase
      .from('celebrities')
      .select('id, name, slug, photo_url')
      .eq('hide_search', false)
      .neq('id', celebrity.id)
      .limit(4)

    return {
      props: {
        initialCelebrity: celebrity,
        initialPosts: posts || [],
        initialCompareCelebrity: compareCelebrity,
        otherCelebrities: otherCelebrities || [],
        liveRank,
        compareLiveRank,
      }
    }
  } catch (err) {
    console.error('getServerSideProps error in celebrity slug page:', err)
    return {
      notFound: true
    }
  }
}
