import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, ThumbsUp, ThumbsDown, CornerDownRight, Send, AlertCircle, Sparkles, X, Shuffle, Smile, ChevronDown } from 'lucide-react'

const POPULAR_EMOJIS = [
  '🔥', '⚡', '👑', '🚀', '💎', '🎯', '🌟', '🦾',
  '😎', '🤩', '🦁', '🏆', '💯', '💖', '🍿', '🎮',
  '🎸', '⚽', '🤖', '🦄', '🐱', '🐶', '🍕', '☕'
]

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff5e62, #ff9966)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #0284c7, #38bdf8)',
  'linear-gradient(135deg, #0d9488, #2dd4bf)',
  'linear-gradient(135deg, #e11d48, #fb7185)',
  'linear-gradient(135deg, #4f46e5, #818cf8)',
  'linear-gradient(135deg, #10b981, #34d399)'
]

function getRandomAvatar() {
  const emoji = POPULAR_EMOJIS[Math.floor(Math.random() * POPULAR_EMOJIS.length)]
  const bg = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)]
  return { emoji, bg }
}

function timeAgo(dateString) {
  if (!dateString) return 'just now'
  const now = new Date()
  const past = new Date(dateString)
  const diffSec = Math.floor((now - past) / 1000)

  if (diffSec < 45) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CommentSection({ targetType, targetSlug, targetName }) {
  const [comments, setComments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  // By default, show most liked / top comments first!
  const [sort, setSort] = useState('top')

  // Main input state
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar())
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [customEmojiInput, setCustomEmojiInput] = useState('')
  const [emojiInputError, setEmojiInputError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef(null)

  // Reply state
  const [replyToId, setReplyToId] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyAuthorName, setReplyAuthorName] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [expandedReplies, setExpandedReplies] = useState({}) // { [commentId]: boolean }

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  // Honeypot for spambots (invisible)
  const [honeypot, setHoneypot] = useState('')

  // User vote tracking from localStorage { [commentId]: 'like' | 'dislike' }
  const [userVotes, setUserVotes] = useState({})

  // Load user info & votes on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('spialr_comment_user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        if (parsed.authorName) {
          setAuthorName(parsed.authorName)
          setReplyAuthorName(parsed.authorName)
        }
        if (parsed.avatar && parsed.avatar.emoji) {
          setSelectedAvatar(parsed.avatar)
        }
      } else {
        // By default assign random emoji
        const initialRandom = getRandomAvatar()
        setSelectedAvatar(initialRandom)
      }

      const savedVotes = localStorage.getItem('spialr_comment_votes')
      if (savedVotes) {
        setUserVotes(JSON.parse(savedVotes))
      }
    } catch (e) {
      console.warn('LocalStorage error:', e)
    }
  }, [])

  // Fetch comments
  useEffect(() => {
    if (!targetType || !targetSlug) return
    let isCancelled = false

    async function fetchComments() {
      try {
        setLoading(true)
        const res = await fetch(`/api/comments?target_type=${encodeURIComponent(targetType)}&target_slug=${encodeURIComponent(targetSlug)}&sort=${sort}`)
        if (!res.ok) throw new Error('Failed to load comments')
        const data = await res.json()
        if (!isCancelled) {
          setComments(data.comments || [])
          setTotalCount(data.totalCount || 0)
        }
      } catch (err) {
        console.error('Error fetching comments:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchComments()
    return () => { isCancelled = true }
  }, [targetType, targetSlug, sort])

  const saveUserPreference = (name, avatar) => {
    try {
      localStorage.setItem('spialr_comment_user', JSON.stringify({
        authorName: name,
        avatar
      }))
    } catch (e) {}
  }

  // Handle custom emoji typing or pasting
  const handleCustomEmojiChange = (val) => {
    setCustomEmojiInput(val)
    setEmojiInputError('')
    if (!val) return

    // Extract first valid emoji using Unicode Extended_Pictographic
    const match = val.match(/\p{Extended_Pictographic}/u)
    if (match) {
      const newEmoji = match[0]
      const updated = {
        emoji: newEmoji,
        bg: selectedAvatar.bg || AVATAR_GRADIENTS[0]
      }
      setSelectedAvatar(updated)
      saveUserPreference(authorName, updated)
      setCustomEmojiInput(newEmoji)
      setEmojiInputError('')
    } else {
      setEmojiInputError('Only emojis are allowed!')
    }
  }

  // Handle Main Comment Submission
  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setErrorMessage('')

    if (content.trim().length > 500) {
      setErrorMessage('Comment cannot exceed 500 characters.')
      return
    }

    setIsSubmitting(true)
    const finalName = authorName.trim() || 'Anonymous'
    saveUserPreference(finalName, selectedAvatar)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_slug: targetSlug,
          content: content.trim(),
          author_name: finalName,
          avatar_emoji: selectedAvatar.emoji,
          avatar_color: selectedAvatar.bg,
          honeypot
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post comment')
      }

      if (data.comment) {
        // If sorting by top, newly posted comment with 0 likes goes in place or at top optimistically
        setComments(prev => [data.comment, ...prev])
        setTotalCount(prev => prev + 1)
      }

      setContent('')
      setShowAvatarPicker(false)
      setIsExpanded(false)
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Reply Submission
  const handleSubmitReply = async (parentId) => {
    if (!replyContent.trim()) return
    setReplyError('')

    if (replyContent.trim().length > 500) {
      setReplyError('Reply cannot exceed 500 characters.')
      return
    }

    setIsReplying(true)
    const finalName = replyAuthorName.trim() || authorName.trim() || 'Anonymous'
    saveUserPreference(finalName, selectedAvatar)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_slug: targetSlug,
          parent_id: parentId,
          content: replyContent.trim(),
          author_name: finalName,
          avatar_emoji: selectedAvatar.emoji,
          avatar_color: selectedAvatar.bg,
          honeypot
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post reply')
      }

      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), data.comment]
          }
        }
        return c
      }))
      setTotalCount(prev => prev + 1)
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }))

      setReplyToId(null)
      setReplyContent('')
    } catch (err) {
      setReplyError(err.message || 'Failed to post reply.')
    } finally {
      setIsReplying(false)
    }
  }

  // Handle Voting (Like / Dislike)
  const handleVote = async (commentId, type) => {
    const currentVote = userVotes[commentId]
    let action = ''

    if (type === 'like') {
      if (currentVote === 'like') action = 'unlike'
      else if (currentVote === 'dislike') action = 'switch_to_like'
      else action = 'like'
    } else {
      if (currentVote === 'dislike') action = 'undislike'
      else if (currentVote === 'like') action = 'switch_to_dislike'
      else action = 'dislike'
    }

    const newVote = (action === 'unlike' || action === 'undislike') ? null : type
    const updatedVotes = { ...userVotes }
    if (newVote) updatedVotes[commentId] = newVote
    else delete updatedVotes[commentId]
    setUserVotes(updatedVotes)
    try {
      localStorage.setItem('spialr_comment_votes', JSON.stringify(updatedVotes))
    } catch (e) {}

    const updateInTree = (list) => {
      return list.map(item => {
        if (item.id === commentId) {
          let likes = item.likes_count || 0
          let dislikes = item.dislikes_count || 0

          if (action === 'like') likes += 1
          else if (action === 'unlike') likes = Math.max(0, likes - 1)
          else if (action === 'dislike') dislikes += 1
          else if (action === 'undislike') dislikes = Math.max(0, dislikes - 1)
          else if (action === 'switch_to_like') {
            likes += 1
            dislikes = Math.max(0, dislikes - 1)
          } else if (action === 'switch_to_dislike') {
            likes = Math.max(0, likes - 1)
            dislikes += 1
          }

          return { ...item, likes_count: likes, dislikes_count: dislikes }
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: updateInTree(item.replies) }
        }
        return item
      })
    }

    setComments(prev => updateInTree(prev))

    try {
      await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, action })
      })
    } catch (e) {
      console.warn('Vote background update failed:', e)
    }
  }

  return (
    <section style={{
      marginTop: 28,
      background: '#ffffff',
      border: '1px solid #e4e4e7',
      borderRadius: 18,
      padding: '18px 20px',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      position: 'relative',
      color: '#09090b',
      fontFamily: 'var(--font-body)'
    }}>
      {/* ─── Header: Compact YouTube Style (Comments Count & Sort) ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }}>
            Comments
          </h3>
          <span style={{
            background: '#f4f4f5',
            color: '#52525b',
            padding: '1px 8px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700
          }}>
            {totalCount}
          </span>
        </div>

        {/* Compact Sort Selector: Defaults to 'top' (Most Liked) */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#52525b',
            fontSize: 12,
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
            padding: '2px 4px'
          }}
        >
          <option value="top">Top comments</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {/* ─── Ultra-Compact YouTube Style Enter Bar ─── */}
      <form onSubmit={handleSubmitComment} style={{ marginTop: 14 }}>
        {/* Honeypot trap */}
        <input
          type="text"
          name="website_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />

        {/* 1. COLLAPSED SLIM ENTER BAR (Compact YouTube size) */}
        {!isExpanded && !content && (
          <div
            onClick={() => {
              setIsExpanded(true)
              setTimeout(() => textareaRef.current?.focus(), 50)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            {/* Compact Avatar */}
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: selectedAvatar.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              {selectedAvatar.emoji}
            </div>

            {/* Slim YouTube-like single label */}
            <div style={{
              flex: 1,
              height: 30,
              background: '#f4f4f5',
              border: '1px solid #e4e4e7',
              borderRadius: 100,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              color: '#71717a',
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.15s ease',
              userSelect: 'none'
            }}>
              Add a comment...
            </div>
          </div>
        )}

        {/* 2. EXPANDED COMPOSER (Appears when clicked) */}
        {(isExpanded || content) && (
          <div style={{
            background: '#fafafa',
            border: '1.5px solid #2563eb',
            borderRadius: 14,
            padding: '10px 12px',
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.08)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}>
            {/* Top row: Avatar Picker + Nickname */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                title="Click to customize your emoji avatar"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: selectedAvatar.bg,
                  border: '1.5px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {selectedAvatar.emoji}
              </button>

              <span style={{ fontSize: 11, color: '#71717a', cursor: 'pointer' }} onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                Edit emoji
              </span>

              {/* ─── RICH EMOJI EDITOR MODAL / POPOVER ─── */}
              {showAvatarPicker && (
                <div style={{
                  position: 'absolute',
                  top: 36,
                  left: 0,
                  zIndex: 60,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 14,
                  boxShadow: '0 12px 30px -4px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  width: 280,
                  maxWidth: '92vw'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#09090b' }}>
                      <Smile size={15} color="#2563eb" />
                      <span>Choose Avatar Emoji</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Current Avatar Big Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: '#f8fafc', borderRadius: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: selectedAvatar.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      flexShrink: 0
                    }}>
                      {selectedAvatar.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#09090b' }}>Your Emoji Avatar</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>Pick below or type any emoji</div>
                    </div>
                  </div>

                  {/* Custom Emoji Input (ONLY Emojis Allowed) */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#52525b', marginBottom: 4 }}>
                      Type or paste ANY emoji:
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 🦁, 🦄, ⚽, 🍕"
                      value={customEmojiInput}
                      onChange={(e) => handleCustomEmojiChange(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: emojiInputError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: '#09090b',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {emojiInputError ? (
                      <span style={{ fontSize: 11, color: '#ef4444', display: 'block', marginTop: 3 }}>
                        {emojiInputError}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, color: '#a1a1aa', display: 'block', marginTop: 3 }}>
                        Works with any keyboard emoji!
                      </span>
                    )}
                  </div>

                  {/* Popular Quick-Select Emojis */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#52525b', marginBottom: 6 }}>
                    Quick Select:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: 6,
                    marginBottom: 12
                  }}>
                    {POPULAR_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const updated = { emoji, bg: selectedAvatar.bg }
                          setSelectedAvatar(updated)
                          saveUserPreference(authorName, updated)
                          setCustomEmojiInput('')
                          setEmojiInputError('')
                        }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: selectedAvatar.emoji === emoji ? '#eff6ff' : '#f8fafc',
                          border: selectedAvatar.emoji === emoji ? '2px solid #2563eb' : '1px solid #e4e4e7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Footer Actions: Randomize + Done */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const nextRandom = getRandomAvatar()
                        setSelectedAvatar(nextRandom)
                        saveUserPreference(authorName, nextRandom)
                        setCustomEmojiInput('')
                        setEmojiInputError('')
                      }}
                      style={{
                        background: '#f4f4f5',
                        border: 'none',
                        borderRadius: 8,
                        padding: '5px 10px',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: '#3f3f46',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <Shuffle size={12} />
                      <span>Random</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      style={{
                        background: '#09090b',
                        border: 'none',
                        borderRadius: 8,
                        padding: '5px 14px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              <input
                type="text"
                maxLength={30}
                placeholder="Name (optional)"
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value)
                  setReplyAuthorName(e.target.value)
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: '#09090b',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                  width: 140,
                  marginLeft: 'auto'
                }}
              />
            </div>

            {/* Comment input textarea */}
            <textarea
              ref={textareaRef}
              rows={2}
              maxLength={500}
              placeholder={`Add a comment for ${targetName || 'this profile'}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#09090b',
                fontSize: 13.5,
                lineHeight: 1.45,
                resize: 'none',
                minHeight: 44,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />

            {/* Action buttons & character counter */}
            <div style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <span style={{
                fontSize: 11,
                color: content.length > 450 ? '#ef4444' : '#a1a1aa'
              }}>
                {content.length}/500
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {errorMessage && (
                  <span style={{ color: '#dc2626', fontSize: 11.5 }}>{errorMessage}</span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setContent('')
                    setIsExpanded(false)
                    setShowAvatarPicker(false)
                    setErrorMessage('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#71717a',
                    borderRadius: 100,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  style={{
                    background: isSubmitting || !content.trim() ? '#e4e4e7' : '#09090b',
                    color: isSubmitting || !content.trim() ? '#a1a1aa' : '#ffffff',
                    border: 'none',
                    borderRadius: 100,
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isSubmitting || !content.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Send size={11} />
                  <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ─── Comments Thread List (Reddit / YouTube Styled) ─── */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#a1a1aa', fontSize: 13 }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '28px 16px',
            background: '#fafafa',
            border: '1px dashed #e4e4e7',
            borderRadius: 14
          }}>
            <Sparkles size={20} color="#a1a1aa" style={{ margin: '0 auto 6px', display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#27272a' }}>No comments yet</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
              Be the first to share your thoughts on this profile!
            </div>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} style={{
              background: '#ffffff',
              border: '1px solid #f1f5f9',
              borderRadius: 14,
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              {/* Top-level comment */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* User Avatar */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: comment.avatar_color || 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  border: '1.5px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  {comment.avatar_emoji || '🔥'}
                </div>

                {/* Main Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Author Name + Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 750, color: '#09090b' }}>
                      {comment.author_name || 'Anonymous'}
                    </span>
                    <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>
                      • {timeAgo(comment.created_at)}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <div style={{
                    marginTop: 4,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: '#27272a',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line'
                  }}>
                    {comment.content}
                  </div>

                  {/* Reaction Bar */}
                  <div style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap'
                  }}>
                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(comment.id, 'like')}
                      title="Upvote"
                      style={{
                        background: userVotes[comment.id] === 'like' ? '#fff7ed' : '#f4f4f5',
                        border: userVotes[comment.id] === 'like' ? '1px solid #fdba74' : '1px solid transparent',
                        borderRadius: 100,
                        padding: '3px 8px',
                        color: userVotes[comment.id] === 'like' ? '#ea580c' : '#52525b',
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <ThumbsUp size={12} color={userVotes[comment.id] === 'like' ? '#ea580c' : '#71717a'} />
                      <span>{comment.likes_count || 0}</span>
                    </button>

                    {/* Downvote Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(comment.id, 'dislike')}
                      title="Downvote"
                      style={{
                        background: userVotes[comment.id] === 'dislike' ? '#eff6ff' : '#f4f4f5',
                        border: userVotes[comment.id] === 'dislike' ? '1px solid #bfdbfe' : '1px solid transparent',
                        borderRadius: 100,
                        padding: '3px 8px',
                        color: userVotes[comment.id] === 'dislike' ? '#2563eb' : '#52525b',
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <ThumbsDown size={12} color={userVotes[comment.id] === 'dislike' ? '#2563eb' : '#71717a'} />
                      <span>{comment.dislikes_count || 0}</span>
                    </button>

                    {/* Reply Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        if (replyToId === comment.id) {
                          setReplyToId(null)
                          setReplyContent('')
                        } else {
                          setReplyToId(comment.id)
                          setReplyContent('')
                          setReplyError('')
                        }
                      }}
                      style={{
                        background: replyToId === comment.id ? '#f4f4f5' : 'transparent',
                        border: 'none',
                        borderRadius: 100,
                        color: replyToId === comment.id ? '#09090b' : '#71717a',
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        padding: '3px 8px'
                      }}
                    >
                      <CornerDownRight size={12} />
                      <span>{replyToId === comment.id ? 'Cancel' : 'Reply'}</span>
                    </button>
                  </div>

                  {/* Inline Reply Input Box */}
                  {replyToId === comment.id && (
                    <div style={{
                      marginTop: 10,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 10
                    }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input
                          type="text"
                          maxLength={30}
                          placeholder="Name (optional)"
                          value={replyAuthorName}
                          onChange={(e) => setReplyAuthorName(e.target.value)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '3px 8px',
                            color: '#0f172a',
                            fontSize: 11.5,
                            fontWeight: 600,
                            outline: 'none',
                            width: 140
                          }}
                        />
                      </div>

                      <textarea
                        rows={2}
                        maxLength={500}
                        placeholder={`Reply to @${comment.author_name || 'Anonymous'}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '6px 8px',
                          color: '#0f172a',
                          fontSize: 12.5,
                          lineHeight: 1.4,
                          resize: 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                      />

                      <div style={{
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6
                      }}>
                        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                          {replyContent.length}/500
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {replyError && (
                            <span style={{ fontSize: 11, color: '#ef4444' }}>{replyError}</span>
                          )}

                          <button
                            type="button"
                            onClick={() => setReplyToId(null)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              fontSize: 11.5,
                              cursor: 'pointer',
                              padding: '3px 8px'
                            }}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={isReplying || !replyContent.trim()}
                            onClick={() => handleSubmitReply(comment.id)}
                            style={{
                              background: isReplying || !replyContent.trim() ? '#e2e8f0' : '#2563eb',
                              color: isReplying || !replyContent.trim() ? '#94a3b8' : '#ffffff',
                              border: 'none',
                              borderRadius: 100,
                              padding: '4px 12px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: isReplying || !replyContent.trim() ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Send size={10} />
                            <span>{isReplying ? 'Sending...' : 'Reply'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Toggle Replies Button (Hidden by default, shown when user clicks) */}
                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleReplies(comment.id)}
                      style={{
                        marginTop: 8,
                        background: 'transparent',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer',
                        padding: '3px 4px',
                        borderRadius: 6
                      }}
                    >
                      <ChevronDown
                        size={14}
                        style={{
                          transform: expandedReplies[comment.id] ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                      <span>
                        {expandedReplies[comment.id]
                          ? `Hide ${comment.replies.length === 1 ? 'reply' : `${comment.replies.length} replies`}`
                          : `View ${comment.replies.length === 1 ? '1 reply' : `${comment.replies.length} replies`}`}
                      </span>
                    </button>
                  )}

                  {/* Nested Replies Thread (Hidden by default) */}
                  {expandedReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                    <div style={{
                      marginTop: 8,
                      paddingLeft: 12,
                      borderLeft: '2px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {/* Nested Avatar */}
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: reply.avatar_color || 'linear-gradient(135deg, #0284c7, #38bdf8)',
                            border: '1px solid #ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}>
                            {reply.avatar_emoji || '🔥'}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, fontWeight: 750, color: '#09090b' }}>
                                {reply.author_name || 'Anonymous'}
                              </span>
                              <span style={{ fontSize: 10.5, color: '#a1a1aa' }}>
                                • {timeAgo(reply.created_at)}
                              </span>
                            </div>

                            <div style={{
                              marginTop: 2,
                              fontSize: 12.5,
                              lineHeight: 1.45,
                              color: '#27272a',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-line'
                            }}>
                              {reply.content}
                            </div>

                            {/* Like / Dislike for Reply */}
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <button
                                type="button"
                                onClick={() => handleVote(reply.id, 'like')}
                                style={{
                                  background: userVotes[reply.id] === 'like' ? '#fff7ed' : '#f4f4f5',
                                  border: userVotes[reply.id] === 'like' ? '1px solid #fdba74' : '1px solid transparent',
                                  borderRadius: 100,
                                  padding: '2px 6px',
                                  color: userVotes[reply.id] === 'like' ? '#ea580c' : '#52525b',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  cursor: 'pointer'
                                }}
                              >
                                <ThumbsUp size={10} color={userVotes[reply.id] === 'like' ? '#ea580c' : '#71717a'} />
                                <span>{reply.likes_count || 0}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleVote(reply.id, 'dislike')}
                                style={{
                                  background: userVotes[reply.id] === 'dislike' ? '#eff6ff' : '#f4f4f5',
                                  border: userVotes[reply.id] === 'dislike' ? '1px solid #bfdbfe' : '1px solid transparent',
                                  borderRadius: 100,
                                  padding: '2px 6px',
                                  color: userVotes[reply.id] === 'dislike' ? '#2563eb' : '#52525b',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  cursor: 'pointer'
                                }}
                              >
                                <ThumbsDown size={10} color={userVotes[reply.id] === 'dislike' ? '#2563eb' : '#71717a'} />
                                <span>{reply.dislikes_count || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
