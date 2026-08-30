import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import BottomNav from '../../components/BottomNav'
import { ArrowLeft, ExternalLink, Award } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function CommentDetailPage({ initialComment }) {
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
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {comment?.photo_url && <meta property="og:image" content={comment.photo_url} />}
      </Head>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 18px 100px' }}>
        {/* Back Button */}
        <div style={{ marginBottom: 20 }}>
          <button 
            onClick={() => router.push('/trending')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 20,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface3)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Leaderboard</span>
          </button>
        </div>

        {/* 1. Ranking Number Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--gradient-subtle)',
            border: '1px solid rgba(225, 48, 108, 0.25)',
            color: 'var(--accent)',
            padding: '8px 18px',
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(225, 48, 108, 0.08)'
          }}>
            <Award size={16} />
            <span>Rank #{rank} on Trending Comments</span>
          </div>
        </div>

        {/* 2. Comment Image (Above) */}
        {comment?.photo_url && (
          <div style={{
            width: '100%',
            borderRadius: 16,
            overflow: 'hidden',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            marginBottom: 20,
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
                maxHeight: 520
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        {/* 3. View in Instagram Button */}
        {comment?.instagram_link && (
          <div style={{ marginBottom: 24 }}>
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
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(225, 48, 108, 0.25)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <span>View in Instagram</span>
              <ExternalLink size={16} />
            </a>
          </div>
        )}

        {/* 4. Mini Essay About the Position */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '22px 24px',
          lineHeight: 1.8,
          fontSize: 14.5,
          color: 'var(--text)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: 12,
            letterSpacing: '-0.01em'
          }}>
            About Rank #{rank} Position
          </h2>

          <p style={{ marginBottom: 14, color: 'var(--text-dim)' }}>
            This comment by <strong>{authorName}</strong> currently holds the <strong>#{rank} position</strong> on Spialr\'s Daily Trending Comments Leaderboard. With an impressive milestone of <strong>{likesText} likes</strong>, it stands out as one of the most widely appreciated and shared community interactions on Instagram.
          </p>

          {comment?.why_notable ? (
            <p style={{ marginBottom: 14, color: 'var(--text-dim)' }}>
              <strong>Why this position is notable:</strong> {comment.why_notable}
            </p>
          ) : (
            <p style={{ marginBottom: 14, color: 'var(--text-dim)' }}>
              Securing the #{rank} spot reflects exceptional resonance across social media, where timing, wit, and cultural relevance sparked thousands of replies, shares, and reactions directly beneath the original video.
            </p>
          )}

          {comment?.description && comment?.description !== comment?.title && (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13.5, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              "{comment.description}"
            </p>
          )}
        </div>
      </main>

      <BottomNav />
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

    return {
      props: {
        initialComment: enrichedComment
      }
    }
  } catch (err) {
    console.error('getServerSideProps error in comment detail page:', err)
    return { notFound: true }
  }
}
