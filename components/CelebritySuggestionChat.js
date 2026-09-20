import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, X, ThumbsUp, Sparkles, User, Smile, Check, ChevronDown, Flame } from 'lucide-react'

const EMOJI_OPTIONS = ['⭐', '🔥', '👑', '🎬', '💎', '🚀', '✨', '⚡', '🌟', '🎯', '❤️', '🏆', '🎉', '🕶️', '🍿', '🎸']

// ─── Section Config ───────────────────────────────────────────────────────────
// Each category has: slug (DB key), bannerText, subtitle, header, welcomeMsg,
// placeholder, emptyMsg, chips, icon
const SECTION_CONFIG = {
  Sports: {
    slug: 'featured_sports',
    icon: '🏅',
    bannerText: 'Enter your favourite player to get featured',
    subtitle: '• Suggest athletes & sports stars you want tracked',
    header: 'Sports Requests',
    welcomeMsg: "Can't find your favourite player? Type their name or Instagram handle below. Suggest athletes you want tracked on Spialr!",
    placeholder: 'Type player name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a sports star you want featured on Spialr!',
    chips: ['🏏 Cricket', '⚽ Football', '🎾 Tennis', '🏸 Badminton', '🤼 Wrestling', '🏊 Other Sport'],
    bannerColor: '#059669',
    bannerBg: 'rgba(5, 150, 105, 0.08)',
    bannerBorder: '#d1fae5',
  },
  Creators: {
    slug: 'featured_creators',
    icon: '📱',
    bannerText: 'Enter your favourite creator to get featured',
    subtitle: '• Suggest content creators & influencers you want tracked',
    header: 'Creator Requests',
    welcomeMsg: "Can't find your favourite creator? Type their name or Instagram handle below. Suggest creators you want tracked on Spialr!",
    placeholder: 'Type creator name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a creator you want featured on Spialr!',
    chips: ['📱 Reels Creator', '🎮 Gaming', '😂 Comedy', '🍳 Food', '✈️ Travel', '💄 Beauty'],
    bannerColor: '#7c3aed',
    bannerBg: 'rgba(124, 58, 237, 0.08)',
    bannerBorder: '#ede9fe',
  },
  Influencers: {
    slug: 'featured_influencers',
    icon: '✨',
    bannerText: 'Enter your favourite influencer to get featured',
    subtitle: '• Suggest influencers & models you want tracked',
    header: 'Influencer Requests',
    welcomeMsg: "Can't find your favourite influencer? Type their name or Instagram handle below. Suggest influencers you want tracked on Spialr!",
    placeholder: 'Type influencer name or Instagram handle...',
    emptyMsg: 'Be the first to suggest an influencer you want featured on Spialr!',
    chips: ['💄 Fashion', '💪 Fitness', '🌿 Lifestyle', '🍕 Foodie', '🎨 Art', '📸 Photography'],
    bannerColor: '#db2777',
    bannerBg: 'rgba(219, 39, 119, 0.08)',
    bannerBorder: '#fce7f3',
  },
  Actors: {
    slug: 'featured_actors',
    icon: '🎬',
    bannerText: 'Enter your favourite actor/actress to get featured',
    subtitle: '• Suggest Bollywood & regional film stars you want tracked',
    header: 'Actor / Actress Requests',
    welcomeMsg: "Can't find your favourite actor or actress? Type their name or Instagram handle below. Suggest film stars you want tracked on Spialr!",
    placeholder: 'Type actor/actress name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a film star you want featured on Spialr!',
    chips: ['🎬 Bollywood', '🎭 Hindi', '🌟 Telugu', '🌺 Tamil', '🎪 Kannada', '🎵 Malayalam'],
    bannerColor: '#b45309',
    bannerBg: 'rgba(180, 83, 9, 0.08)',
    bannerBorder: '#fef3c7',
  },
  Singers: {
    slug: 'featured_singers',
    icon: '🎤',
    bannerText: 'Enter your favourite singer to get featured',
    subtitle: '• Suggest singers & musicians you want tracked',
    header: 'Singer / Musician Requests',
    welcomeMsg: "Can't find your favourite singer? Type their name or Instagram handle below. Suggest musicians you want tracked on Spialr!",
    placeholder: 'Type singer name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a singer you want featured on Spialr!',
    chips: ['🎤 Bollywood Singer', '🎸 Band', '🎵 Indie', '🎼 Classical', '🎧 Rapper', '🎹 Composer'],
    bannerColor: '#0891b2',
    bannerBg: 'rgba(8, 145, 178, 0.08)',
    bannerBorder: '#cffafe',
  },
  Politicians: {
    slug: 'featured_politicians',
    icon: '🏛️',
    bannerText: 'Enter your favourite leader to get featured',
    subtitle: '• Suggest political leaders & public figures you want tracked',
    header: 'Leader / Politician Requests',
    welcomeMsg: "Can't find your favourite political leader? Type their name or Instagram handle below. Suggest leaders you want tracked on Spialr!",
    placeholder: 'Type leader name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a political figure you want featured on Spialr!',
    chips: ['🏛️ National Leader', '🗳️ State Leader', '🌐 International', '📢 Activist', '🏙️ Local Leader', '📰 Journalist'],
    bannerColor: '#dc2626',
    bannerBg: 'rgba(220, 38, 38, 0.08)',
    bannerBorder: '#fee2e2',
  },
  Personalities: {
    slug: 'featured_personalities',
    icon: '🌟',
    bannerText: 'Enter your favourite personality to get featured',
    subtitle: '• Suggest public figures & personalities you want tracked',
    header: 'Personality Requests',
    welcomeMsg: "Can't find your favourite personality? Type their name or Instagram handle below. Suggest public figures you want tracked on Spialr!",
    placeholder: 'Type personality name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a personality you want featured on Spialr!',
    chips: ['🎙️ Podcaster', '📚 Author', '💼 Entrepreneur', '🎤 Stand-up', '🧘 Motivator', '🎥 Film Maker'],
    bannerColor: '#7c3aed',
    bannerBg: 'rgba(124, 58, 237, 0.08)',
    bannerBorder: '#ede9fe',
  },
  'Meme Pages': {
    slug: 'featured_meme_pages',
    icon: '😂',
    bannerText: 'Enter your favourite meme page to get featured',
    subtitle: '• Suggest funny pages & meme accounts you want tracked',
    header: 'Meme Page Requests',
    welcomeMsg: "Can't find your favourite meme page? Type their Instagram handle below. Suggest funny accounts you want tracked on Spialr!",
    placeholder: 'Type meme page name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a meme page you want featured on Spialr!',
    chips: ['😂 Desi Memes', '🎭 Bollywood Memes', '🏏 Cricket Memes', '🌍 Relatable', '🐈 Animal Memes', '😆 Roast Page'],
    bannerColor: '#06b6d4',
    bannerBg: 'rgba(6, 182, 212, 0.08)',
    bannerBorder: '#cffafe',
  },
  Handles: {
    slug: 'featured_handles',
    icon: '📌',
    bannerText: 'Enter your favourite page to get featured',
    subtitle: '• Suggest interesting Instagram pages you want tracked',
    header: 'Handle / Page Requests',
    welcomeMsg: "Can't find your favourite page or handle? Type their name or Instagram handle below. Suggest accounts you want tracked on Spialr!",
    placeholder: 'Type page name or Instagram handle...',
    emptyMsg: 'Be the first to suggest a page you want featured on Spialr!',
    chips: ['📰 News Page', '📚 Educational', '🏢 Brand', '🏥 Health', '🎓 Educational Inst.', '🌐 Community'],
    bannerColor: '#14b8a6',
    bannerBg: 'rgba(20, 184, 166, 0.08)',
    bannerBorder: '#ccfbf1',
  },
  // Default / All
  All: {
    slug: 'featured_celebrities',
    icon: '✨',
    bannerText: 'Enter your favourite celebrities to get featured',
    subtitle: '• Suggest stars or creators you want tracked',
    header: 'Celebrity Requests',
    welcomeMsg: "Can't find your favourite celebrity? Type their name or Instagram handle below. Suggest stars you want tracked on Spialr!",
    placeholder: 'Type message or celebrity name here...',
    emptyMsg: 'Be the first to suggest a celebrity or creator you want featured on Spialr!',
    chips: ['🎬 Actor / Actress', '🎤 Singer / Musician', '🏏 Sports / Athlete', '📱 Creator / Influencer', '🎙️ Standup / Host'],
    bannerColor: '#0e71eb',
    bannerBg: 'rgba(14, 113, 235, 0.08)',
    bannerBorder: '#dbeafe',
  },
}

// Returns config for a given category string (handles case-insensitivity & fallback)
function getSectionConfig(category) {
  if (!category || category === 'All') return SECTION_CONFIG['All']
  // Exact match first
  if (SECTION_CONFIG[category]) return SECTION_CONFIG[category]
  // Case-insensitive match
  const key = Object.keys(SECTION_CONFIG).find(
    k => k.toLowerCase() === category.toLowerCase()
  )
  return key ? SECTION_CONFIG[key] : SECTION_CONFIG['All']
}

// ─── Banner Component ─────────────────────────────────────────────────────────
export function CelebritySuggestionBanner({ onOpenChat, category = 'All', style = {} }) {
  const cfg = getSectionConfig(category)
  return (
    <div
      onClick={() => onOpenChat()}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        margin: '18px 0 10px',
        padding: '12px 18px',
        borderRadius: 12,
        background: 'var(--surface, #ffffff)',
        border: `1px solid ${cfg.bannerBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = cfg.bannerColor
        e.currentTarget.style.background = cfg.bannerBg
        e.currentTarget.style.boxShadow = `0 3px 12px ${cfg.bannerColor}22`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = cfg.bannerBorder
        e.currentTarget.style.background = 'var(--surface, #ffffff)'
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.03)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: cfg.bannerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          flexShrink: 0
        }}>
          {cfg.icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text, #0f172a)',
            letterSpacing: '-0.01em'
          }}>
            {cfg.bannerText}
          </span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted, #64748b)',
            fontWeight: 500
          }}>
            {cfg.subtitle}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onOpenChat()
        }}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          background: cfg.bannerColor,
          color: '#ffffff',
          border: 'none',
          fontSize: 12,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
          boxShadow: `0 2px 6px ${cfg.bannerColor}44`
        }}
      >
        <MessageSquare size={13} strokeWidth={2.4} />
        <span>Suggest {category === 'All' ? 'Celebrity' : (category === 'Meme Pages' ? 'Page' : category.replace(/s$/, ''))}</span>
      </button>
    </div>
  )
}

// ─── Empty Search Card ────────────────────────────────────────────────────────
export function CelebrityEmptySearchCard({ searchQuery, onOpenChat, category = 'All', style = {} }) {
  const cfg = getSectionConfig(category)
  return (
    <div style={{
      textAlign: 'center',
      padding: '24px 16px',
      background: 'var(--surface, #ffffff)',
      border: '1px dashed var(--border, #cbd5e1)',
      borderRadius: 12,
      margin: '16px auto',
      maxWidth: 520,
      ...style
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
      <div style={{ fontSize: 14, fontWeight: 750, color: 'var(--text, #0f172a)', marginBottom: 3 }}>
        No profiles found for &ldquo;{searchQuery}&rdquo;
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', marginBottom: 12 }}>
        Can&apos;t find this {category === 'All' ? 'celebrity' : category.toLowerCase().replace(/s$/, '')}? Suggest them to get featured!
      </div>
      <button
        type="button"
        onClick={() => onOpenChat(`Please feature: ${searchQuery}`)}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          background: cfg.bannerColor,
          color: '#ffffff',
          border: 'none',
          fontSize: 12,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          boxShadow: `0 2px 6px ${cfg.bannerColor}44`,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <MessageSquare size={12} strokeWidth={2.4} />
        <span>Enter &ldquo;{searchQuery}&rdquo; to get featured</span>
      </button>
    </div>
  )
}

// ─── Main Chat Drawer ─────────────────────────────────────────────────────────
export default function CelebritySuggestionChat({ isOpen, onClose, initialPrefill = '', category = 'All' }) {
  const cfg = getSectionConfig(category)

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('Anonymous')
  const [avatarEmoji, setAvatarEmoji] = useState('⭐')
  const [showIdentityEditor, setShowIdentityEditor] = useState(false)
  const [votedIds, setVotedIds] = useState(new Set())
  const [errorMessage, setErrorMessage] = useState('')

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load saved name and emoji from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('spialr_sugg_name')
      const savedEmoji = localStorage.getItem('spialr_sugg_emoji')
      if (savedName) setAuthorName(savedName)
      if (savedEmoji) setAvatarEmoji(savedEmoji)

      const savedVotes = localStorage.getItem('spialr_sugg_votes')
      if (savedVotes) {
        try {
          setVotedIds(new Set(JSON.parse(savedVotes)))
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  // Fetch comments for this section's target slug
  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/comments?target_type=suggestion&target_slug=${cfg.slug}&sort=top`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.comments || [])
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch whenever chat opens or category changes
  useEffect(() => {
    if (isOpen) {
      setMessages([])
      if (initialPrefill) {
        setContent(initialPrefill)
      }
      fetchSuggestions()
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus()
      }, 250)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPrefill, cfg.slug])

  // Scroll to bottom on new message or open
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, isOpen])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Submit new suggestion / chat message
  const handleSend = async (e) => {
    if (e) e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setErrorMessage('')

    const payload = {
      target_type: 'suggestion',
      target_slug: cfg.slug,
      content: trimmed,
      author_name: authorName.trim() || 'Anonymous',
      avatar_emoji: avatarEmoji || '⭐',
      avatar_color: `linear-gradient(135deg, ${cfg.bannerColor}, ${cfg.bannerColor}bb)`
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send suggestion')
      }

      if (data.comment) {
        setMessages(prev => [...prev, data.comment])
        setContent('')
        if (chatEndRef.current) {
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle upvoting
  const handleVote = async (commentId) => {
    if (votedIds.has(commentId)) return

    // Optimistic update
    setMessages(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, likes_count: (c.likes_count || 0) + 1 }
      }
      return c
    }))

    const updated = new Set(votedIds)
    updated.add(commentId)
    setVotedIds(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('spialr_sugg_votes', JSON.stringify(Array.from(updated)))
    }

    try {
      await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, action: 'like' })
      })
    } catch (err) {
      console.error('Error recording upvote:', err)
    }
  }

  // Save identity to localStorage
  const handleSaveIdentity = (newName, newEmoji) => {
    setAuthorName(newName)
    setAvatarEmoji(newEmoji)
    if (typeof window !== 'undefined') {
      localStorage.setItem('spialr_sugg_name', newName)
      localStorage.setItem('spialr_sugg_emoji', newEmoji)
    }
    setShowIdentityEditor(false)
  }

  // Format timestamp
  const formatZoomTime = (dateStr) => {
    if (!dateStr) return 'Just now'
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      if (isToday) return timeStr
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`
    } catch {
      return 'Just now'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @keyframes zoomFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'zoomFadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        {/* ─── CHAT DRAWER WINDOW ─── */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 440,
            height: '100%',
            background: '#ffffff',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #e2e8f0',
            position: 'relative',
            animation: 'zoomSlideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* ─── 1. HEADER BAR ─── */}
          <div style={{
            padding: '14px 18px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: cfg.bannerColor,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${cfg.bannerColor}55`,
                fontSize: 16
              }}>
                {cfg.icon}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    fontFamily: 'var(--font-display)'
                  }}>
                    Chat
                  </h2>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#059669',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                    Live
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
                  {cfg.header} &amp; Feedback
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={onClose}
                title="Close Chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.color = '#0f172a'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }}
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* ─── 2. PINNED WELCOME BANNER ─── */}
          <div style={{
            padding: '10px 16px',
            background: cfg.bannerBg,
            borderBottom: `1px solid ${cfg.bannerBorder}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            flexShrink: 0
          }}>
            <Sparkles size={16} color={cfg.bannerColor} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.45 }}>
              <strong>{cfg.welcomeMsg.split('?')[0]}?</strong>
              {' '}{cfg.welcomeMsg.split('?')[1] || ''}
            </div>
          </div>

          {/* ─── 3. SCROLLABLE MESSAGE STREAM ─── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: '#ffffff'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 10,
                color: '#64748b',
                padding: '40px 0'
              }}>
                <div className="spinner" style={{ width: 22, height: 22 }} />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Loading community suggestions...</span>
              </div>
            ) : messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 12
                }}>
                  💬
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 750, color: '#0f172a' }}>
                  No suggestions yet
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 280, lineHeight: 1.45 }}>
                  {cfg.emptyMsg}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const hasVoted = votedIds.has(msg.id)
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    {/* Sender Line */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      lineHeight: 1.2
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14 }}>{msg.avatar_emoji || '⭐'}</span>
                        <span style={{ fontWeight: 800, color: cfg.bannerColor }}>
                          {msg.author_name || 'Anonymous'}
                        </span>
                      </div>

                      <span style={{ color: '#94a3b8', fontSize: 10.5, flexShrink: 0 }}>
                        {formatZoomTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div style={{
                      fontSize: 13.5,
                      color: '#1e293b',
                      lineHeight: 1.45,
                      paddingLeft: 22,
                      wordBreak: 'break-word',
                      marginTop: 2
                    }}>
                      {msg.content}
                    </div>

                    {/* Upvote Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 22, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleVote(msg.id)}
                        disabled={hasVoted}
                        title={hasVoted ? 'You already upvoted this' : 'Upvote this suggestion'}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 100,
                          fontSize: 11.5,
                          fontWeight: 700,
                          border: '1px solid',
                          borderColor: hasVoted ? cfg.bannerColor : '#e2e8f0',
                          background: hasVoted ? `${cfg.bannerColor}14` : '#ffffff',
                          color: hasVoted ? cfg.bannerColor : '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: hasVoted ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ThumbsUp size={11} strokeWidth={2.4} fill={hasVoted ? cfg.bannerColor : 'none'} />
                        <span>{msg.likes_count || 0}</span>
                        {hasVoted && <span style={{ fontSize: 10.5, color: cfg.bannerColor }}>• Upvoted</span>}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ─── 4. QUICK SUGGESTION CHIPS ─── */}
          <div style={{
            padding: '6px 14px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }} className="no-scrollbar">
            {cfg.chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContent(prev => prev ? `${prev} (${chip})` : `Please feature: [Name] (${chip})`)
                  if (inputRef.current) inputRef.current.focus()
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#475569',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '3px 8px',
                  borderRadius: 100,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = cfg.bannerColor
                  e.currentTarget.style.color = cfg.bannerColor
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.color = '#475569'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ─── 5. IDENTITY MODAL ─── */}
          {showIdentityEditor && (
            <div style={{
              padding: '12px 16px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Your Chat Profile</span>
                <button
                  type="button"
                  onClick={() => setShowIdentityEditor(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value.slice(0, 30))}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSaveIdentity(authorName, avatarEmoji)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: cfg.bannerColor,
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>

              {/* Emoji Selection */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAvatarEmoji(em)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: avatarEmoji === em ? cfg.bannerColor : '#e2e8f0',
                      background: avatarEmoji === em ? `${cfg.bannerColor}18` : '#ffffff',
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── 6. BOTTOM INPUT DOCK ─── */}
          <div style={{
            padding: '12px 16px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            {/* Sender Identifier */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8
            }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span>Live Chat</span>
              </span>

              <button
                type="button"
                onClick={() => setShowIdentityEditor(!showIdentityEditor)}
                title="Change your chat display name & emoji"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 11.5,
                  color: '#64748b',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <span>From:</span>
                <span>{avatarEmoji}</span>
                <strong style={{ color: '#0f172a' }}>{authorName}</strong>
                <span style={{ color: cfg.bannerColor, textDecoration: 'underline' }}>Edit</span>
              </button>
            </div>

            {/* Textarea & Send Button */}
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: 12,
                padding: '6px 8px',
                gap: 8,
                transition: 'border-color 0.15s ease',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}
              onFocusCapture={e => e.currentTarget.style.borderColor = cfg.bannerColor}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <textarea
                  ref={inputRef}
                  value={content}
                  onChange={e => setContent(e.target.value.slice(0, 500))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={cfg.placeholder}
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13.5,
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'none',
                    lineHeight: 1.4,
                    padding: '2px 4px'
                  }}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: content.trim() && !submitting ? cfg.bannerColor : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: content.trim() && !submitting ? 'pointer' : 'default',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Send size={15} strokeWidth={2.4} />
                </button>
              </div>

              {/* Error message if any */}
              {errorMessage && (
                <div style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 600 }}>
                  {errorMessage}
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#94a3b8'
              }}>
                <span>Press <strong>Enter</strong> to send</span>
                <span>{content.length}/500</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
