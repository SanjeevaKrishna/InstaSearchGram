import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PostCard from '../components/PostCard'
import { supabase } from '../lib/supabase'
import { safeStorage } from '../lib/storage'
import { Lightbulb, Search, Heart, MessageSquare, Eye, Star, ChevronDown } from 'lucide-react'


export default function ResultsPage({ initialCelebrity = null, initialPosts = [], initialVotingInfo = null }) {
  const router = useRouter()
  const { slug, search, filter, date, month, start, end, playlist } = router.query

  const [celebrity, setCelebrity] = useState(initialCelebrity)
  const [posts, setPosts] = useState(initialCelebrity ? initialPosts : [])
  const [loading, setLoading] = useState(initialCelebrity ? false : true)

  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

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

  const formatCount = formatFollowers;

  const generateDynamicContent = () => {
    if (!celebrity || posts.length === 0) return null;
    const post = posts[0];
    const postTypeLabel = post.post_type === 'reel' ? 'Instagram Reel' : 'Instagram Post';
    const tagListText = post.tags && post.tags.length > 0 ? post.tags.slice(0, 5).join(', ') : '';

    // Create a deterministic index from the celebrity name to select sentence variations
    const seed = (celebrity.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectVariation = (arr) => arr[seed % arr.length];

    // Bio Integration (injects 100% unique text)
    const bioText = celebrity.description 
      ? `As one of the prominent figures in the industry, ${celebrity.name} has built a massive footprint. Our database highlights: "${celebrity.description.trim()}" This background explains the massive scale of public interest in their social updates.`
      : `${celebrity.name} has cultivated a highly active audience online. Their posts draw massive engagement due to their high visibility in the entertainment space.`;

    // Intro Paragraph Variations
    const introVariations = {
      most_liked: [
        `This section presents a deep-dive analysis of the highest-rated upload by ${celebrity.name} on Instagram, which has achieved the absolute peak of user likes. With a massive following of ${celebrity.followers_text || formatFollowers(celebrity.followers_count) || 'millions'}, this specific ${postTypeLabel} stands out as a primary benchmark for audience approval.`,
        `Analyzing the performance metrics of ${celebrity.name}, we highlight their most liked Instagram update. Given their influence over ${celebrity.followers_text || formatFollowers(celebrity.followers_count)} fans, this content represents the pinnacle of viewer satisfaction and digital engagement.`,
        `Here we spotlight the most liked post by ${celebrity.name}. Securing maximum positive reactions across their feed, this ${postTypeLabel} offers crucial benchmarking data for creators studying high-performance social media positioning.`
      ],
      most_commented: [
        `Comments represent the most active form of audience participation. This page examines the most commented post by ${celebrity.name}, which generated the highest level of community discussions and user dialogue.`,
        `We explore ${celebrity.name}'s most conversational update, which has accumulated the peak number of comments. With an audience of ${celebrity.followers_text || 'millions'}, this post serves as a primary hub for fan debates and interactions.`,
        `Highlighting the most commented content from ${celebrity.name}, this analysis looks at why this specific upload triggered such high conversational interest among fans and followers.`
      ],
      most_viewed: [
        `Views are a direct indicator of algorithmic reach and virality. This page analyzes the most viewed video post by ${celebrity.name}, demonstrating outstanding public reach beyond their immediate follower base.`,
        `We examine the most viewed content uploaded by ${celebrity.name}. Achieving stellar impressions, this specific video reel indicates strong viewer retention and explore-page distribution.`,
        `This spotlight focuses on ${celebrity.name}'s highest-viewed Instagram update, highlighting the visual cues and hooks that enabled it to achieve such broad digital circulation.`
      ],
      first_post: [
        `Taking a look back, we highlight the earliest recorded post of ${celebrity.name} in our benchmarking archive. Tracking a creator's history shows their creative development over time.`,
        `This page showcases the initial content update archived for ${celebrity.name}. Analyzing early posts offers a valuable perspective on how their overall brand and aesthetic evolved.`,
        `We review the earliest archived post by ${celebrity.name}, tracing the baseline of their engagement metrics and visual storytelling style before reaching their current scale.`
      ],
      default: [
        `This collection displays curated public content from ${celebrity.name}'s feed matching your search filter. Spialr indexes these statistics to assist in creator benchmarking.`,
        `We list verified content updates from ${celebrity.name}'s profile. These highlights serve as benchmarks for analyzing digital engagement trends over a timeline.`,
        `Explore matching Instagram updates from ${celebrity.name}'s feed, providing clean tracking metrics for marketing analysis.`
      ]
    };

    // Engagement Paragraph Variations
    const engagementVariations = {
      most_liked: [
        `Securing peak engagement requires an alignment of content timing and audience sentiment. Across ${celebrity.name}'s catalog of ${celebrity.posts_count || 'several'} updates, this item secured the highest approval rating, indicating a highly successful content hook.`,
        `Among their total of ${celebrity.posts_count || 'many'} posts, this specific upload represents the maximum positive sentiment. Marketers study these top-performing posts to evaluate successful brand collaboration placements.`,
        `This post showcases the standard of digital reach for ${celebrity.name}. The high count of likes indicates that the creative layout and caption structure resonated exceptionally well.`
      ],
      most_commented: [
        `Posts that trigger heavy discussion often address highly relatable or trending topics. For ${celebrity.name}, this upload sparked the most active debate, making it a valuable case study in audience engagement.`,
        `Analyzing why this caption or visual prompted so many of their ${celebrity.followers_text || 'fans'} to write reveals key content hooks that drive user feedback and commentary.`,
        `This high-comment post indicates strong emotional resonance. It stands out in their feed as a major point of community interaction.`
      ],
      most_viewed: [
        `Virality is driven by high watch-time metrics and loops. For ${celebrity.name}, this video captured the highest attention span, illustrating effective viewer retention.`,
        `This video achieved maximum viral distribution, breaking through standard feed limitations. It illustrates how the initial hooks captured search algorithm recommendations.`,
        `Strong reach metrics indicate that this content was widely shared. It represents the highest scale of brand impressions in their catalog.`
      ],
      first_post: [
        `Comparing early content to current updates shows a significant shift in production quality and audience targeting, illustrating how ${celebrity.name} scaled their presence.`,
        `Every large account started with a single upload. This post serves as a benchmarking baseline, illustrating how creative consistency builds long-term success.`,
        `This baseline archive shows early content formats, illustrating how audience demographics and engagement rates evolved over subsequent years.`
      ],
      default: [
        `Analyzing these search highlights provides a clear overview of how engagement rates fluctuate depending on the publication date and hashtags used.`,
        `These filtered metrics represent a valuable data set for competitive analysis, outlining standard performance margins for top-tier creators.`,
        `By tracking these specific updates, marketers can build realistic KPIs for campaigns based on historical content trends.`
      ]
    };

    // Content Paragraph Variations
    const contentParagraphs = [
      post.caption 
        ? `The upload features a structured caption starting with: "${post.caption.substring(0, 80).trim()}...". This textual context, combined with visual hooks, contributed significantly to its high rank.`
        : `This content relies on high-impact visual media without a heavy text description. The premium visual framing drove immediate viewer retention and action.`,
      tagListText
        ? `Categorized using key tags such as [${tagListText}], the post successfully indexed itself within trending topic pages, capturing organic search queries.`
        : `The publication strategy focused on direct creator branding, relying on high feed authority and visual placement rather than heavy hashtag categorization.`,
      `Published on ${new Date(post.post_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, the timing aligned with active user hours to maximize immediate interaction during the first critical hours.`
    ];

    const introPara = selectVariation(introVariations[filter] || introVariations.default);
    const engagementPara = selectVariation(engagementVariations[filter] || engagementVariations.default);
    const contentPara = selectVariation(contentParagraphs);
    const valuePara = `At Spialr, we compile these metrics as part of our social benchmarking toolset. This enables content creators, marketers, and agencies to audit public performances, identify high-performing content patterns, and make data-driven decisions.`;

    const filterTitle = filter === 'most_liked' ? `Analysis of ${celebrity.name}'s Most Liked ${postTypeLabel}`
                      : filter === 'most_commented' ? `Engagement Analysis: ${celebrity.name}'s Most Commented ${postTypeLabel}`
                      : filter === 'most_viewed' ? `Viral Analytics: ${celebrity.name}'s Most Viewed ${postTypeLabel}`
                      : filter === 'first_post' ? `Archive Spotlight: ${celebrity.name}'s Earliest Post`
                      : `Curated Highlights for ${celebrity.name}`;

    // Determine metric value & label
    let metricLabel = '';
    let metricValue = '';
    let metricIcon = null;

    if (filter === 'most_liked') {
      metricLabel = 'Total Likes';
      metricValue = celebrity.most_liked_count || (post?.like_count ? formatCount(post.like_count) : (celebrity.most_likes ? formatCount(celebrity.most_likes) : 'Pending Audit'));
      metricIcon = <Heart size={20} style={{ color: '#ff2a5f' }} />;
    } else if (filter === 'most_commented') {
      metricLabel = 'Total Comments';
      metricValue = celebrity.most_commented_count || (post?.comment_count ? formatCount(post.comment_count) : 'Pending Audit');
      metricIcon = <MessageSquare size={20} style={{ color: '#8f00ff' }} />;
    } else if (filter === 'most_viewed') {
      metricLabel = 'Total Views';
      metricValue = celebrity.most_viewed_count || (post?.view_count ? formatCount(post.view_count) : 'Pending Audit');
      metricIcon = <Eye size={20} style={{ color: '#ff6b35' }} />;
    } else if (filter === 'first_post') {
      metricLabel = 'First Upload Date';
      metricValue = post?.post_date ? new Date(post.post_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending Audit';
      metricIcon = <Star size={20} style={{ color: '#ffa751' }} />;
    }

    return (
      <div style={{
        marginTop: 40,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '32px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.03)',
        color: 'var(--text)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 20,
          color: 'var(--accent)',
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12
        }}>
          {filterTitle}
        </h2>

        {/* 📊 High-impact Metric Banner */}
        {metricLabel && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}>
              {metricIcon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                {metricLabel}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1.2, marginTop: 2 }}>
                {metricValue}
              </div>
            </div>
          </div>
        )}

        <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 16 }}>
          📊 Analytical Report
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Executive Overview */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📝</span> Executive Overview
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-dim)', margin: 0 }}>{introPara} {bioText}</p>
          </div>

          {/* Card 2: Engagement Insights */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📈</span> Engagement Dynamics & Reach
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-dim)', margin: 0 }}>{engagementPara}</p>
          </div>

          {/* Card 3: Creative & Formatting Strategy */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✍️</span> Content & Formatting Strategy
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-dim)', margin: 0 }}>{contentPara}</p>
          </div>

          {/* Card 4: Platform Benchmarks */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🌐</span> Platform Benchmarks
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-dim)', margin: 0 }}>{valuePara}</p>
          </div>
        </div>
      </div>
    );
  }

  const generateFaqContent = () => {
    if (!celebrity || posts.length === 0) return null;
    const faqs = [
      {
        q: 'Why is this specific post highlighted by Spialr?',
        a: `Spialr tracks public engagement metrics for major profiles. This post is highlighted because it mathematically represents the highest score for the selected filter (${filterDesc}) across the celebrity's recorded uploads.`
      },
      {
        q: 'How can creators use these insights?',
        a: `By examining the hashtags, caption structures, and media formats of ${celebrity.name}'s top posts, other creators can identify successful patterns, hooks, and content structures to test on their own accounts.`
      },
      {
        q: 'Are these statistics updated in real-time?',
        a: `Social media metrics fluctuate constantly. Spialr updates engagement statistics periodically. To view the current real-time counts, likes, and comments, you can click the "Watch" button on the card to navigate directly to the official post on Instagram.`
      }
    ];

    return (
      <div style={{
        marginTop: 40,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '32px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.03)',
        color: 'var(--text)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 16,
          color: 'var(--text)',
          marginBottom: 16
        }}>
          ❓ Frequently Asked Questions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, idx) => (
            <ResultsFAQItem key={idx} faq={faq} />
          ))}
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (celebrity?.id) {
      const alreadyRequested = safeStorage.getItem(`requested_${celebrity.id}`)
      if (alreadyRequested === 'true') {
        setRequested(true)
      }
    }
  }, [celebrity])

  const handleRequestFullDetails = async () => {
    if (!celebrity?.id) return
    setRequesting(true)
    try {
      const res = await fetch('/api/celebrities/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: celebrity.id })
      })
      const data = await res.json()
      if (data.success) {
        setRequested(true)
        safeStorage.setItem(`requested_${celebrity.id}`, 'true')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRequesting(false)
    }
  }

  useEffect(() => {
    if (initialCelebrity && initialCelebrity.slug === slug) {
      let result = initialPosts || []

      if (filter === 'most_liked') result = result.filter(p => p.is_most_liked)
      else if (filter === 'most_commented') result = result.filter(p => p.is_most_commented)
      else if (filter === 'most_viewed') result = result.filter(p => p.is_most_viewed)
      else if (filter === 'first_post') result = result.filter(p => p.is_first_post)

      if (search) {
        const s = search.toLowerCase()
        result = result.filter(p =>
          (p.caption || '').toLowerCase().includes(s) ||
          (p.tags || []).some(t => t.toLowerCase().includes(s))
        )
      }

      if (date) {
        result = result.filter(p => p.post_date === date)
      }

      if (month) {
        result = result.filter(p => p.post_date && p.post_date.startsWith(month))
      }

      if (start) result = result.filter(p => p.post_date && p.post_date >= start)
      if (end) result = result.filter(p => p.post_date && p.post_date <= end)

      if (playlist) {
        result = result.filter(p => p.playlist_name === playlist)
      }

      setPosts(result)
      setLoading(false)
      return
    }

    if (!slug) return
    setLoading(true)
    fetch(`/api/celebrities/${slug}`)
      .then(r => r.json())
      .then(d => {
        setCelebrity(d.celebrity)
        
        // Filter posts client-side
        let result = d.posts || []

        if (filter === 'most_liked') result = result.filter(p => p.is_most_liked)
        else if (filter === 'most_commented') result = result.filter(p => p.is_most_commented)
        else if (filter === 'most_viewed') result = result.filter(p => p.is_most_viewed)
        else if (filter === 'first_post') result = result.filter(p => p.is_first_post)

        if (search) {
          const s = search.toLowerCase()
          result = result.filter(p =>
            (p.caption || '').toLowerCase().includes(s) ||
            (p.tags || []).some(t => t.toLowerCase().includes(s))
          )
        }

        if (date) {
          result = result.filter(p => p.post_date === date)
        }

        if (month) {
          result = result.filter(p => p.post_date && p.post_date.startsWith(month))
        }

        if (start) result = result.filter(p => p.post_date && p.post_date >= start)
        if (end) result = result.filter(p => p.post_date && p.post_date <= end)

        if (playlist) {
          result = result.filter(p => p.playlist_name === playlist)
        }

        setPosts(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug, search, filter, date, month, start, end, playlist, initialCelebrity, initialPosts])
 
  if (!slug) {
    if (router.isReady) {
      return (
        <>
                    <main style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>No Profile Selected</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Please select a celebrity profile from our home listings to view insights.</p>
            <button className="btn btn-primary" onClick={() => router.push('/')} style={{ padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
              Go to Homepage
            </button>
          </main>
        </>
      )
    }
    return (
      <>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </>
    )
  }

  if (loading) return (
    <>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </>
  )

  let filterDesc = 'All posts'
  if (filter === 'most_liked') filterDesc = 'Most Liked Post'
  else if (filter === 'most_commented') filterDesc = 'Most Commented Post'
  else if (filter === 'most_viewed') filterDesc = 'Most Viewed Post'
  else if (filter === 'first_post') filterDesc = 'First Post'
  else if (search) filterDesc = `Search: "${search}"`
  else if (date) filterDesc = `Date: ${new Date(date).toLocaleDateString()}`
  else if (month) filterDesc = `Month: ${month}`
  else if (start || end) filterDesc = `Timeline: ${start || 'Any'} to ${end || 'Any'}`
  else if (playlist) filterDesc = `Playlist: ${playlist}`

  return (
    <>
      <Head>
        <title>{celebrity ? `${celebrity.name} Search Results & Posts — Spialr` : 'Search Results — Spialr'}</title>
        <meta name="description" content={celebrity ? `Search results and filtered post archive for ${celebrity.name} on Spialr.` : 'Search results for Instagram creators and posts on Spialr.'} />
        <meta name="robots" content="noindex, follow" />
      </Head>

      
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 80px' }}>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              router.back()
            } else if (slug) {
              router.push(`/celebrity/${slug}`)
            } else {
              router.push('/')
            }
          }} 
          style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, cursor: 'pointer', padding: 0 }}
        >
          ← Back to Profile
        </button>

        <div className="card fade-in" style={{ marginBottom: 32, padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {celebrity?.photo_url ? (
            <img src={celebrity.photo_url} alt={celebrity.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
              {celebrity?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 2 }}>
              {filterDesc}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Found {posts.length} result{posts.length !== 1 ? 's' : ''} for {celebrity?.name}
            </div>
          </div>
        </div>

        {celebrity && !celebrity.has_full_details && search && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-bright)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 32,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <Lightbulb size={24} style={{ color: 'var(--accent)' }} />
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 4, color: 'var(--accent)' }}>
                Note!
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
                Right now, we only have the top 4 featured posts loaded for <strong>{celebrity?.name || 'this celebrity'}</strong>. Want to see their complete Instagram Posts and playlists? Tap <strong>Request</strong> below, and we will load all their posts within 2 days! 🚀 Until then check <a href="/live" style={{ color: 'var(--accent)', fontWeight: 600 }}>live Creator Rankings</a> and <a href="/live" style={{ color: 'var(--accent)', fontWeight: 600 }}>Most Viral Reels Today</a>.
              </p>
            </div>
            {requested ? (
              <div style={{
                color: '#00c853',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0, 200, 83, 0.08)',
                padding: '6px 16px',
                borderRadius: '100px'
              }}>
                ✓ Requested successfully!
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleRequestFullDetails}
                disabled={requesting}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 4
                }}
              >
                {requesting ? 'Requesting...' : 'Request'}
              </button>
            )}
          </div>
        )}

        {posts.length > 0 ? (
          <>
            {generateDynamicContent()}
            
            <div style={{
              marginTop: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: 0,
                marginTop: 8
              }}>
                🔗 Featured Post Reference
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>

            {generateFaqContent()}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Search size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <p style={{ margin: 0, marginBottom: 16 }}>No posts match your filters.</p>
            <button className="btn btn-ghost" onClick={() => router.back()}>
              Try another search
            </button>
          </div>
        )}
      </main>
    </>
  )
}

export async function getServerSideProps(context) {
  const { slug } = context.query
  if (!slug) {
    return {
      props: {
        initialCelebrity: null,
        initialPosts: [],
        initialVotingInfo: null
      }
    }
  }

  try {
    const { data: celebrity, error: celError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', slug)
      .single()

    if (celError || !celebrity) {
      return {
        props: {
          initialCelebrity: null,
          initialPosts: [],
          initialVotingInfo: null
        }
      }
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .order('post_date', { ascending: false })

    if (postsError) throw postsError

    let votingInfo = null
    if (celebrity.name) {
      const { data: exactMatch } = await supabase
        .from('most_followed')
        .select('votes, current_vote_rank, highest_vote_rank, lowest_vote_rank')
        .eq('name', celebrity.name)
        .maybeSingle()

      if (exactMatch) {
        votingInfo = exactMatch
      } else {
        const trimmedName = celebrity.name.trim()
        const { data: ilikeMatch } = await supabase
          .from('most_followed')
          .select('votes, current_vote_rank, highest_vote_rank, lowest_vote_rank')
          .ilike('name', `${trimmedName}%`)
          .maybeSingle()
        votingInfo = ilikeMatch
      }
    }

    return {
      props: {
        initialCelebrity: celebrity,
        initialPosts: posts || [],
        initialVotingInfo: votingInfo || null
      }
    }
  } catch (err) {
    console.error('Results getServerSideProps error:', err)
    return {
      props: {
        initialCelebrity: null,
        initialPosts: [],
        initialVotingInfo: null
      }
    }
  }
}

function ResultsFAQItem({ faq }) {
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
