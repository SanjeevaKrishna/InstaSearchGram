// ============================================================================
// ARCHIVE / BACKUP: Profile Comparative Table, Content Highlights & Account Insights
// Preserved permanently for post-AdSense reactivation.
//
// This component and helper code holds the exact JSX, logic, and styling for:
// 1. Account Insights & Cumulative Metrics (Reel Views, Reel Likes, Post Likes, Comments, Shares, Reposts)
// 2. Content Highlights & Discovery Quick Filters (Most Liked, Most Commented, Most Viewed, First Post)
// 3. Side-by-Side Creator Comparison Table & Card Downloader
// ============================================================================

import React from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Eye,
  Heart,
  ThumbsUp,
  MessageSquare,
  Share2,
  Repeat2,
  Sparkles,
  GitCompare,
  X,
  Download,
  Loader2
} from 'lucide-react'

export function AccountInsightsSection({ celebrityData, formatNumber }) {
  if (!celebrityData || (!celebrityData.total_reel_views && !celebrityData.total_reel_likes && !celebrityData.total_post_likes && !celebrityData.total_comments && !celebrityData.total_shares && !celebrityData.total_reposts)) {
    return null
  }

  return (
    <div className="analytics-section" style={{ marginBottom: 20 }}>
      <div className="analytics-title" style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={16} strokeWidth={2.5} style={{ color: 'var(--accent)' }} /> Account Insights &amp; Cumulative Metrics
      </div>

      <div className="analytics-grid-three">
        {celebrityData.total_reel_views ? (
          <div className="analytics-card-compact analytics-card-views">
            <Eye size={20} strokeWidth={2} style={{ color: '#ff6b35', marginBottom: 8 }} />
            <div className="analytics-card-num-compact gradient-text">
              {formatNumber(celebrityData.total_reel_views)}
            </div>
            <div className="analytics-card-label-compact">Reel Views</div>
          </div>
        ) : null}

        {celebrityData.total_reel_likes ? (
          <div className="analytics-card-compact analytics-card-reel-likes">
            <Heart size={20} strokeWidth={2} style={{ color: '#ff2a5f', marginBottom: 8 }} />
            <div className="analytics-card-num-compact">
              {formatNumber(celebrityData.total_reel_likes)}
            </div>
            <div className="analytics-card-label-compact">Reel Likes</div>
          </div>
        ) : null}

        {celebrityData.total_post_likes ? (
          <div className="analytics-card-compact analytics-card-post-likes">
            <ThumbsUp size={20} strokeWidth={2} style={{ color: '#ffa751', marginBottom: 8 }} />
            <div className="analytics-card-num-compact">
              {formatNumber(celebrityData.total_post_likes)}
            </div>
            <div className="analytics-card-label-compact">Post Likes</div>
          </div>
        ) : null}

        {celebrityData.total_comments ? (
          <div className="analytics-card-compact analytics-card-comments">
            <MessageSquare size={20} strokeWidth={2} style={{ color: '#8f00ff', marginBottom: 8 }} />
            <div className="analytics-card-num-compact">
              {formatNumber(celebrityData.total_comments)}
            </div>
            <div className="analytics-card-label-compact">Total Comments</div>
          </div>
        ) : null}

        {celebrityData.total_shares ? (
          <div className="analytics-card-compact analytics-card-shares">
            <Share2 size={20} strokeWidth={2} style={{ color: '#2ec4b6', marginBottom: 8 }} />
            <div className="analytics-card-num-compact">
              {formatNumber(celebrityData.total_shares)}
            </div>
            <div className="analytics-card-label-compact">Total Shares</div>
          </div>
        ) : null}

        {celebrityData.total_reposts ? (
          <div className="analytics-card-compact analytics-card-reposts">
            <Repeat2 size={20} strokeWidth={2} style={{ color: '#10b981', marginBottom: 8 }} />
            <div className="analytics-card-num-compact">
              {formatNumber(celebrityData.total_reposts)}
            </div>
            <div className="analytics-card-label-compact">Total Repost</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ContentHighlightsSection({ slug, targetSlug }) {
  const activeSlug = targetSlug || slug || ''
  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: 15, fontWeight: 750, color: 'var(--text)', margin: 0 }}>Content Highlights &amp; Discovery</h2>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top indexed posts</span>
      </div>
      <div className="profile-filter-grid">
        <Link href={`/results?slug=${encodeURIComponent(activeSlug)}&filter=most_liked`} className="profile-filter-btn" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>❤️</span>
          <span className="profile-filter-title">Most Liked</span>
        </Link>
        <Link href={`/results?slug=${encodeURIComponent(activeSlug)}&filter=most_commented`} className="profile-filter-btn" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
          <span className="profile-filter-title">Most Commented</span>
        </Link>
        <Link href={`/results?slug=${encodeURIComponent(activeSlug)}&filter=most_viewed`} className="profile-filter-btn" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>👁️</span>
          <span className="profile-filter-title">Most Viewed</span>
        </Link>
        <Link href={`/results?slug=${encodeURIComponent(activeSlug)}&filter=first_post`} className="profile-filter-btn" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⭐</span>
          <span className="profile-filter-title">First Post</span>
        </Link>
      </div>
    </div>
  )
}
