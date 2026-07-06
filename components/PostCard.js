import { useState, useEffect } from 'react'
import { Calendar, Heart, MessageSquare, Eye, Star, ExternalLink, Bookmark } from 'lucide-react'

export default function PostCard({ post }) {
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]')
      if (saved.some(p => p.id === post.id)) {
        setIsSaved(true)
      }
    } catch {}
  }, [post.id])

  const toggleSave = (e) => {
    e.stopPropagation()
    try {
      const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]')
      if (isSaved) {
        const newSaved = saved.filter(p => p.id !== post.id)
        localStorage.setItem('saved_posts', JSON.stringify(newSaved))
        setIsSaved(false)
        window.dispatchEvent(new Event('saved_posts_updated'))
      } else {
        saved.push(post)
        localStorage.setItem('saved_posts', JSON.stringify(saved))
        setIsSaved(true)
      }
    } catch {}
  }

  const handleClick = () => {
    window.open(post.post_url, '_blank', 'noopener,noreferrer')
  }

  const typeColor = {
    'reel': '#e040fb',
    'post': '#00e5ff',
    'video': '#ff6b35',
  }

  return (
    <div
      className="card"
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {post.celebrity && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/celebrity/${post.celebrity.slug}`;
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 10,
            cursor: 'pointer'
          }}
        >
          {post.celebrity.photo_url ? (
            <img src={post.celebrity.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
              {post.celebrity.name?.charAt(0)}
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {post.celebrity.name}
          </span>
        </div>
      )}
      {/* Type badge */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 14,
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: typeColor[post.post_type] || '#888',
        color: '#000',
        zIndex: 10,
      }}>
        {post.post_type || 'post'}
      </div>

      {/* Date */}
      {post.post_date && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'inline-flex', alignItems: 'center' }}>
          <Calendar size={13} style={{ marginRight: 6 }} /> {new Date(post.post_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <p style={{
          fontSize: 14,
          color: 'var(--text-dim)',
          marginBottom: 14,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.caption}
        </p>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {post.is_most_liked && (
          <span style={{ fontSize: 12, color: '#ff6b35', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
            <Heart size={13} style={{ marginRight: 4, fill: 'currentColor' }} /> Most Liked
          </span>
        )}
        {post.is_most_commented && (
          <span style={{ fontSize: 12, color: '#00e5ff', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
            <MessageSquare size={13} style={{ marginRight: 4, fill: 'currentColor' }} /> Most Commented
          </span>
        )}
        {post.is_most_viewed && (
          <span style={{ fontSize: 12, color: '#e040fb', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
            <Eye size={13} style={{ marginRight: 4 }} /> Most Viewed
          </span>
        )}
        {post.is_first_post && (
          <span style={{ fontSize: 12, color: '#ffeb3b', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
            <Star size={13} style={{ marginRight: 4, fill: 'currentColor' }} /> First Post
          </span>
        )}
      </div>



      {/* Open link CTA & Save */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          <span>Open on Instagram</span>
          <ExternalLink size={13} />
        </div>
        
        <button 
          onClick={toggleSave}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          title={isSaved ? "Remove from Saved" : "Save Post"}
        >
          {isSaved ? <Bookmark size={20} style={{ fill: 'currentColor' }} /> : <Heart size={20} />}
        </button>
      </div>
    </div>
  )
}
