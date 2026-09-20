import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import PostCard from '../components/PostCard'
import { supabase } from '../lib/supabase'
import { safeStorage } from '../lib/storage'
import { Lightbulb, Search, Heart, MessageSquare, Eye, Star, ChevronDown, ExternalLink } from 'lucide-react'


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
    const postTypeLabel = post.post_type === 'reel' ? 'Reel' : 'Post';

    let metricLabel = 'Highlights';
    let metricValue = 'Featured';
    let metricIcon = '✨';
    let gradient = 'linear-gradient(135deg, #6366f1, #a855f7)';
    let glowColor = 'rgba(99, 102, 241, 0.3)';
    let accentColor = '#6366f1';
    let badgeText = 'Featured Highlight';

    if (filter === 'most_liked') {
      metricLabel = 'Total Likes';
      metricValue = celebrity.most_liked_count || (post?.like_count ? formatCount(post.like_count) : (celebrity.most_likes ? formatCount(celebrity.most_likes) : 'Verified'));
      metricIcon = '❤️';
      gradient = 'linear-gradient(135deg, #ff2a5f, #e1306c)';
      glowColor = 'rgba(255, 42, 95, 0.32)';
      accentColor = '#ff2a5f';
      badgeText = 'Most Liked Post';
    } else if (filter === 'most_commented') {
      metricLabel = 'Total Comments';
      metricValue = celebrity.most_commented_count || (post?.comment_count ? formatCount(post.comment_count) : 'Verified');
      metricIcon = '💬';
      gradient = 'linear-gradient(135deg, #8b5cf6, #d946ef)';
      glowColor = 'rgba(139, 92, 246, 0.32)';
      accentColor = '#8b5cf6';
      badgeText = 'Most Commented Post';
    } else if (filter === 'most_viewed') {
      metricLabel = 'Total Views';
      metricValue = celebrity.most_viewed_count || (post?.view_count ? formatCount(post.view_count) : 'Verified');
      metricIcon = '👁️';
      gradient = 'linear-gradient(135deg, #ff6b35, #f59e0b)';
      glowColor = 'rgba(255, 107, 53, 0.32)';
      accentColor = '#ff6b35';
      badgeText = 'Most Viewed Reel';
    } else if (filter === 'first_post') {
      metricLabel = 'First Post Date';
      metricValue = post?.post_date ? new Date(post.post_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Archive';
      metricIcon = '⭐';
      gradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
      glowColor = 'rgba(245, 158, 11, 0.32)';
      accentColor = '#f59e0b';
      badgeText = 'First Upload Archive';
    }

    return (
      <div style={{
        marginTop: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(0,0,0,0.03)',
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '50%',
          height: '140%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Top Tag & Context Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', flexWrap: 'wrap', gap: 10 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}0a)`,
            border: `1px solid ${accentColor}33`,
            color: accentColor,
            padding: '5px 12px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.02em'
          }}>
            <span>{metricIcon}</span>
            <span>{badgeText}</span>
          </div>

          {post?.post_date && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              Uploaded {new Date(post.post_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Big Decorative Metric Showcase */}
        <div style={{
          background: `linear-gradient(135deg, ${accentColor}0f, ${accentColor}04)`,
          border: `1px solid ${accentColor}25`,
          borderRadius: 20,
          padding: '26px 20px',
          textAlign: 'center',
          marginBottom: 20,
          position: 'relative',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: accentColor, textTransform: 'uppercase', marginBottom: 6 }}>
            {metricLabel}
          </div>
          <div style={{
            fontSize: 40,
            fontWeight: 900,
            color: accentColor,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            textShadow: `0 0 28px ${glowColor}`,
            fontFamily: 'var(--font-display)',
          }}>
            {metricValue}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8, fontWeight: 600 }}>
            {celebrity.name} · {postTypeLabel}
          </div>
        </div>

        {/* Caption Snippet */}
        {post?.caption && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-dim)',
            lineHeight: 1.55,
            margin: '0 0 20px',
            fontStyle: 'italic',
            position: 'relative',
          }}>
            "{post.caption.substring(0, 160)}{post.caption.length > 160 ? '...' : ''}"
          </p>
        )}

        {/* Direct Link CTA Button */}
        {post?.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: gradient,
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: `0 4px 18px ${glowColor}`,
              transition: 'all 0.2s',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <ExternalLink size={16} />
            <span>Open Post on Instagram</span>
          </a>
        )}
      </div>
    );
  }

  const generateFaqContent = () => {
    if (!celebrity || posts.length === 0) return null;
    const post = posts[0];
    const currentFilterDesc = filter === 'most_liked' ? 'Most Liked Post'
      : filter === 'most_commented' ? 'Most Commented Post'
      : filter === 'most_viewed' ? 'Most Viewed Reel'
      : filter === 'first_post' ? 'Earliest Post'
      : 'Featured Post';

    const faqs = [
      {
        q: `Why is this post highlighted for ${celebrity.name}?`,
        a: `This upload represents ${celebrity.name}'s verified ${currentFilterDesc.toLowerCase()} according to public engagement statistics on Spialr.`
      },
      ...(filter === 'most_liked' ? [{
        q: `How many likes does this post have?`,
        a: `This post has accumulated ${celebrity.most_liked_count || (post?.like_count ? formatCount(post.like_count) : 'millions of')} likes on Instagram.`
      }] : []),
      ...(filter === 'most_commented' ? [{
        q: `How many comments does this post have?`,
        a: `This post recorded ${celebrity.most_commented_count || (post?.comment_count ? formatCount(post.comment_count) : 'thousands of')} comments.`
      }] : []),
      ...(filter === 'most_viewed' ? [{
        q: `How many views did this reel receive?`,
        a: `This viral reel has accumulated ${celebrity.most_viewed_count || (post?.view_count ? formatCount(post.view_count) : 'millions of')} total views.`
      }] : []),
      {
        q: 'How can I view the actual post on Instagram?',
        a: 'Click the "Open Post on Instagram" button or tap the post card to view the official post directly on Instagram.'
      },
      {
        q: 'Are these statistics up to date?',
        a: 'Spialr routinely monitors public engagement data to keep rankings and creator milestones accurate and current.'
      }
    ];

    return (
      <div style={{
        marginTop: 32,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 20px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 15,
          color: 'var(--text)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          ❓ Frequently Asked Questions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
