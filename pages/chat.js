import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { Send, MessageSquare, User, Clock, AlertCircle, Sparkles, Users, Globe, Hash, CornerUpLeft, Copy, Trash2, X, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Fun nickname generators to make anonymous chats readable
const adjectives = ['Swift', 'Bright', 'Jolly', 'Clever', 'Wild', 'Silent', 'Cool', 'Epic', 'Fiery', 'Gentle', 'Happy', 'Mystic', 'Brave', 'Loyal', 'Quick']
const nouns = ['Panda', 'Tiger', 'Falcon', 'Dolphin', 'Koala', 'Fox', 'Dragon', 'Eagle', 'Wolf', 'Otter', 'Cheetah', 'Lion', 'Phoenix', 'Bear', 'Rabbit']

const generateAnonymousProfile = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return { name: `${adj}${noun}#${num}`, id }
}

export default function ChatPage() {
  const router = useRouter()
  const [room, setRoom] = useState('all')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [profile, setProfile] = useState({ name: '', id: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Interactive UI States
  const [replyingTo, setReplyingTo] = useState(null) // { id, sender_name, message }
  const [activeMenuMessage, setActiveMenuMessage] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  // Nickname customizer states
  const [isNameLocked, setIsNameLocked] = useState(false)
  const [showEditNameModal, setShowEditNameModal] = useState(false)
  const [tempName, setTempName] = useState('')
  const [roomBackgrounds, setRoomBackgrounds] = useState({})

  // Swiping State
  const [swipingMessageId, setSwipingMessageId] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const messagesEndRef = useRef(null)

  // Gesture and interaction refs
  const swipeStartXRef = useRef(0)
  const swipeStartYRef = useRef(0)
  const swipeDirectionLockedRef = useRef(null)

  const longPressTimerRef = useRef(null)
  const longPressStartPosRef = useRef({ x: 0, y: 0 })
  const longPressTriggeredRef = useRef(false)

  // Chill vibes theme color definitions (Indigo-Blue palette)
  const chillGradient = 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' // Violet-Blue
  const chillSubtle = 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'
  const chillAccent = '#6366f1' // Violet
  const chillShadow = '0 8px 20px rgba(99, 102, 241, 0.22)'

  const roomsList = [
    { id: 'all', label: 'All Languages', icon: Globe },
    { id: 'hindi', label: 'Hindi', icon: Hash },
    { id: 'telugu', label: 'Telugu', icon: Hash },
    { id: 'tamil', label: 'Tamil', icon: Hash },
    { id: 'kannada', label: 'Kannada', icon: Hash },
    { id: 'malayalam', label: 'Malayalam', icon: Hash }
  ]

  // Initialize profile (nickname and ID) and check 24-hour expiration
  useEffect(() => {
    let savedName = localStorage.getItem('spialr_chat_name')
    let savedId = localStorage.getItem('spialr_chat_id')
    let createdAt = localStorage.getItem('spialr_chat_name_created_at')
    let isCustom = localStorage.getItem('spialr_chat_name_customized') === 'true'

    const now = Date.now()
    const twentyFourHoursMs = 24 * 60 * 60 * 1000

    let shouldReset = false
    if (createdAt) {
      const createdTime = new Date(createdAt).getTime()
      if (now - createdTime >= twentyFourHoursMs) {
        shouldReset = true
      }
    }

    if (!savedName || !savedId || shouldReset) {
      const newProfile = generateAnonymousProfile()
      localStorage.setItem('spialr_chat_name', newProfile.name)
      localStorage.setItem('spialr_chat_id', newProfile.id)
      localStorage.setItem('spialr_chat_name_created_at', new Date().toISOString())
      localStorage.removeItem('spialr_chat_name_customized') // reset custom flag
      savedName = newProfile.name
      savedId = newProfile.id
      isCustom = false
    }

    setIsNameLocked(isCustom)
    setProfile({ name: savedName, id: savedId })
  }, [])

  // Fetch custom backgrounds on mount
  useEffect(() => {
    fetch('/api/chat_backgrounds')
      .then(res => res.json())
      .then(data => {
        if (data.backgrounds) {
          setRoomBackgrounds(data.backgrounds)
        }
      })
      .catch(err => console.error('Error fetching chat backgrounds:', err))
  }, [])

  // Sync room with URL parameter if present, otherwise fallback to localStorage last selected language
  useEffect(() => {
    if (router.isReady) {
      if (router.query.room) {
        const queryRoom = router.query.room.toString().toLowerCase()
        const isValid = roomsList.some(r => r.id === queryRoom)
        if (isValid) {
          setRoom(queryRoom)
          localStorage.setItem('spialr_last_language', queryRoom)
        }
      } else {
        const savedRoom = localStorage.getItem('spialr_last_language')
        if (savedRoom && roomsList.some(r => r.id === savedRoom)) {
          setRoom(savedRoom)
        }
      }
    }
  }, [router.isReady, router.query.room])

  // Fetch messages helper
  const fetchMessages = async (currentRoom, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/chat?room=${currentRoom}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(data.messages || [])
      setError(null)
    } catch (err) {
      console.error('Fetch chat error:', err)
      setError('Failed to fetch messages. Please check your internet connection.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Subscribe to real-time chat messages and load initial messages
  useEffect(() => {
    fetchMessages(room)

    if (!supabase) return

    const channel = supabase
      .channel(`chat_messages:${room}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room=eq.${room}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to bottom when messages list change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Notification Toast Helper
  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => {
      setToast({ show: false, message: '' })
    }, 2000)
  }

  // Swipe-to-reply gesture handlers
  const handleSwipeStart = (e, msgId, clientX, clientY) => {
    if (activeMenuMessage) return
    setSwipingMessageId(msgId)
    setSwipeOffset(0)
    setIsSwiping(true)
    swipeStartXRef.current = clientX
    swipeStartYRef.current = clientY
    swipeDirectionLockedRef.current = null
  }

  const handleSwipeMove = (e, clientX, clientY) => {
    if (!swipingMessageId || !isSwiping) return

    const deltaX = clientX - swipeStartXRef.current
    const deltaY = clientY - swipeStartYRef.current

    if (swipeDirectionLockedRef.current === null) {
      if (Math.abs(deltaY) > 8) {
        swipeDirectionLockedRef.current = 'vertical'
        setSwipingMessageId(null)
        setIsSwiping(false)
        return
      }
      if (deltaX > 8) {
        swipeDirectionLockedRef.current = 'horizontal'
      }
    }

    if (swipeDirectionLockedRef.current === 'horizontal') {
      if (e.cancelable) e.preventDefault()
      const offset = Math.max(0, Math.min(100, deltaX))
      setSwipeOffset(offset)
    }
  }

  const handleSwipeEnd = (msg) => {
    if (!swipingMessageId) return
    if (swipeOffset >= 60) {
      setReplyingTo({
        id: msg.id,
        sender_name: msg.sender_name,
        message: msg.message
      })
      if (navigator.vibrate) {
        navigator.vibrate(15)
      }
    }
    setSwipeOffset(0)
    setSwipingMessageId(null)
    setIsSwiping(false)
    swipeDirectionLockedRef.current = null
  }

  // Long-press gesture handlers
  const handleLongPressStart = (msg, clientX, clientY) => {
    longPressStartPosRef.current = { x: clientX, y: clientY }
    longPressTriggeredRef.current = false
    
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      if (navigator.vibrate) navigator.vibrate(20)
      setActiveMenuMessage(msg)
    }, 600)
  }

  const handleLongPressMove = (clientX, clientY) => {
    if (longPressTriggeredRef.current) return
    
    const diffX = Math.abs(clientX - longPressStartPosRef.current.x)
    const diffY = Math.abs(clientY - longPressStartPosRef.current.y)

    if (diffX > 8 || diffY > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Secure DELETE message handler
  const handleDeleteMessage = async (msgId) => {
    if (!confirm('Are you sure you want to delete this message? This cannot be undone.')) return

    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          sender_id: profile.id
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => prev.filter(m => m.id !== msgId))
      showToast('Message deleted')
    } catch (err) {
      console.error('Delete message error:', err)
      showToast('Could not delete message. Please try again.')
    }
  }

  // Tap quoted original message scroll handler
  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight-flash')
      setTimeout(() => {
        el.classList.remove('highlight-flash')
      }, 1500)
    } else {
      showToast('Original message has expired or is unavailable')
    }
  }

  const handleSaveCustomName = () => {
    const trimmed = tempName.trim()
    if (!trimmed || trimmed === profile.name) return

    // Save in local storage
    localStorage.setItem('spialr_chat_name', trimmed)
    localStorage.setItem('spialr_chat_name_created_at', new Date().toISOString())
    localStorage.setItem('spialr_chat_name_customized', 'true')

    // Update state
    setProfile(prev => ({ ...prev, name: trimmed }))
    setIsNameLocked(true)
    setShowEditNameModal(false)
    showToast('Name customized and locked!')
  }

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !profile.id || !profile.name || submitting) return

    setSubmitting(true)
    const pendingMsg = newMessage
    setNewMessage('') // Clear input immediately for snappy feel

    const replyData = replyingTo ? {
      reply_to_id: replyingTo.id,
      reply_to_name: replyingTo.sender_name,
      reply_to_message: replyingTo.message
    } : {}
    setReplyingTo(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          message: pendingMsg,
          sender_name: profile.name,
          sender_id: profile.id,
          ...replyData
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Add to messages locally to display immediately before next poll
      setMessages(prev => [...prev, data.message])
    } catch (err) {
      console.error('Send message error:', err)
      setError('Could not send your message. Please try again.')
      setNewMessage(pendingMsg) // Restore typed message on failure
      if (replyData.reply_to_id) {
        setReplyingTo({
          id: replyData.reply_to_id,
          sender_name: replyData.reply_to_name,
          message: replyData.reply_to_message
        })
      }
    } finally {
      setSubmitting(false)
      setTimeout(scrollToBottom, 50)
    }
  }

  // Generate avatar initials from name
  const getInitials = (name) => {
    if (!name) return 'AN'
    const cleanName = name.split('#')[0]
    // Get uppercase letters
    const uppercaseOnly = cleanName.replace(/[^A-Z]/g, '')
    if (uppercaseOnly.length >= 2) return uppercaseOnly.substring(0, 2)
    return cleanName.substring(0, 2).toUpperCase()
  }

  // Generate avatar color hash from ID
  const getAvatarBg = (id) => {
    if (!id) return chillAccent
    const colors = [
      '#6366f1', '#3b82f6', '#10b981', '#f59e0b', 
      '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6'
    ]
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash % colors.length)
    return colors[index]
  }

  const currentRoomInfo = roomsList.find(r => r.id === room) || roomsList[0]

  const menuActionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 16px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  }

  return (
    <>
      <Head>
        <title>SpiAlr Discussion Rooms - Chat & Connect</title>
        <meta name="description" content="Join real-time discussions for Indian cinema, creators, actors, and trends. No login required. Chats disappear every 24 hours." />
      </Head>

      <Navbar />

      <main className="chat-layout" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, height: 'calc(100vh - 60px)' }}>
        
        {/* Left Panel: Rooms list */}
        <section className="rooms-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'hidden' }}>
          <div className="card shadow-premium" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              <Users size={18} style={{ color: chillAccent }} /> Discussion Rooms
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {roomsList.map((r) => {
                const isActive = room === r.id
                const RoomIcon = r.icon
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRoom(r.id)
                      localStorage.setItem('spialr_last_language', r.id)
                      router.push({ pathname: '/chat', query: { room: r.id } }, undefined, { shallow: true })
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 16px',
                      borderRadius: 14,
                      border: 'none',
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 600,
                      background: isActive ? chillGradient : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-dim)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
                      width: '100%',
                      boxShadow: isActive ? chillShadow : 'none',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)'
                    }}
                    className={isActive ? '' : 'dropdown-item'}
                  >
                    <RoomIcon size={16} style={{ opacity: isActive ? 1 : 0.7 }} />
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Profile Card */}
          <div className="card shadow-premium" style={{ padding: 18, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: chillGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: `0 4px 10px rgba(99, 102, 241, 0.15)`
              }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Anonymous Nickname</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.name || 'Generating...'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Unlimited Chat Interface (Frame-free redesign) */}
        <section className="chat-container" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', position: 'relative' }}>
          {/* Pinned Compact Welcome Header */}
          <div className="pinned-welcome-bar" style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            gap: 16,
            zIndex: 4,
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '75%', justifyContent: 'center' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: chillSubtle,
                color: chillAccent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 10px rgba(99, 102, 241, 0.08)`
              }}>
                <Sparkles size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h2 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 800, 
                  fontSize: 14, 
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0, 
                  lineHeight: 1.2 
                }}>
                  Welcome to {currentRoomInfo.label} Community
                </h2>
                <p 
                  style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, margin: 0, marginTop: 2, lineHeight: 1.3 }} 
                  className="welcome-subtitle"
                >
                  Let us know if we missed any profiles or if you have suggestions. We review and implement feedback daily.{' '}
                  <span style={{ color: '#f97316', fontWeight: 700 }}>Chats will expire in 24 hours.</span>{' '}
                  <strong style={{ color: '#ec4899', fontWeight: 800 }}>Chat with others!</strong>
                </p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              right: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: '100px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              flexShrink: 0
            }} className="auto-delete-badge">
              <Clock size={11} style={{ color: chillAccent }} />
              <span>24h Auto-delete</span>
            </div>
          </div>

          {/* Messages Feed Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 24px 90px', // space bottom for input
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            background: roomBackgrounds[room]
              ? `linear-gradient(rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.84)), url(${roomBackgrounds[room]}) center/cover no-repeat`
              : 'rgba(99, 102, 241, 0.018)', // Chill soft indigo pastel background
            scrollbarWidth: 'thin'
          }}>

            {/* Message Feed list */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', gap: 12 }}>
                <div className="spinner" />
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Loading messages...</span>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#ff5252', gap: 8, padding: 20, textAlign: 'center' }}>
                <AlertCircle size={32} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{error}</span>
              </div>
            ) : messages.length === 0 ? (
              /* Premium Empty State */
              <div className="empty-state-container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                textAlign: 'center',
                flex: 1
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.02) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                  border: `1px solid rgba(99, 102, 241, 0.15)`,
                  boxShadow: `0 10px 30px rgba(99, 102, 241, 0.05)`
                }}>
                  <MessageSquare size={36} style={{ color: chillAccent, strokeWidth: 1.8 }} />
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Start the Conversation
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, maxWidth: 300 }}>
                  Be the first member to post in this room.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === profile.id
                
                // Grouping by Date separator
                const msgDate = new Date(msg.created_at).toLocaleDateString()
                const prevMsgDate = index > 0 ? new Date(messages[index - 1].created_at).toLocaleDateString() : null
                const showDateSeparator = msgDate !== prevMsgDate

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {showDateSeparator && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '12px 0 6px',
                      }}>
                        <span style={{
                          background: 'rgba(0,0,0,0.05)',
                          color: 'var(--text-dim)',
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '4px 12px',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    <div 
                      id={`msg-${msg.id}`} 
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        width: '100%',
                        borderRadius: 16,
                        transition: 'background-color 0.5s ease'
                      }}
                      className="msg-bubble"
                    >
                      <div style={{
                        maxWidth: '75%',
                        display: 'flex',
                        gap: 10,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        width: '100%'
                      }}>
                        {/* Avatar initials (only for others) */}
                        {!isMe && (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: getAvatarBg(msg.sender_id),
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
                            marginTop: 4
                          }}>
                            {getInitials(msg.sender_name)}
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          width: '100%',
                          position: 'relative'
                        }}>
                          {/* Sender Nickname */}
                          {!isMe && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              marginBottom: 4,
                              marginLeft: 4
                            }}>
                              {msg.sender_name}
                            </span>
                          )}

                          {/* Message Bubble Container with Swipe back-icon */}
                          <div style={{ 
                            position: 'relative', 
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%', 
                            justifyContent: isMe ? 'flex-end' : 'flex-start' 
                          }}>
                            {/* Slide-in Reply Icon behind the bubble */}
                            {swipingMessageId === msg.id && swipeOffset > 0 && (
                              <div style={{
                                position: 'absolute',
                                left: -28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: chillSubtle,
                                color: chillAccent,
                                opacity: Math.min(1, swipeOffset / 50),
                                transform: `scale(${Math.min(1.1, 0.5 + swipeOffset / 100)})`,
                                pointerEvents: 'none',
                                zIndex: 1
                              }}>
                                <CornerUpLeft size={14} />
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div 
                              onTouchStart={(e) => {
                                handleSwipeStart(e, msg.id, e.touches[0].clientX, e.touches[0].clientY);
                                handleLongPressStart(msg, e.touches[0].clientX, e.touches[0].clientY);
                              }}
                              onTouchMove={(e) => {
                                handleSwipeMove(e, e.touches[0].clientX, e.touches[0].clientY);
                                handleLongPressMove(e.touches[0].clientX, e.touches[0].clientY);
                              }}
                              onTouchEnd={() => {
                                handleSwipeEnd(msg);
                                handleLongPressEnd();
                              }}
                              onMouseDown={(e) => {
                                handleSwipeStart(e, msg.id, e.clientX, e.clientY);
                                handleLongPressStart(msg, e.clientX, e.clientY);
                              }}
                              onMouseMove={(e) => {
                                handleSwipeMove(e, e.clientX, e.clientY);
                                handleLongPressMove(e.clientX, e.clientY);
                              }}
                              onMouseUp={() => {
                                handleSwipeEnd(msg);
                                handleLongPressEnd();
                              }}
                              onMouseLeave={() => {
                                handleSwipeEnd(msg);
                                handleLongPressEnd();
                              }}
                              style={{
                                padding: '12px 18px',
                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                background: isMe ? chillGradient : 'var(--surface)',
                                color: isMe ? '#ffffff' : 'var(--text)',
                                border: isMe ? 'none' : '1px solid var(--border)',
                                fontSize: 14,
                                lineHeight: 1.5,
                                boxShadow: isMe ? `0 4px 15px rgba(99, 102, 241, 0.14)` : '0 2px 8px rgba(0, 0, 0, 0.01)',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                position: 'relative',
                                transform: swipingMessageId === msg.id ? `translateX(${swipeOffset}px)` : 'none',
                                transition: (swipingMessageId === msg.id && isSwiping) ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.25)',
                                cursor: 'grab',
                                userSelect: 'none',
                                WebkitUserSelect: 'none'
                              }}
                            >
                              {/* Quoted original message preview */}
                              {msg.reply_to_id && (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent opening long press menu
                                    scrollToMessage(msg.reply_to_id);
                                  }}
                                  style={{
                                    background: isMe ? 'rgba(255, 255, 255, 0.16)' : 'var(--surface2)',
                                    borderLeft: `3px solid ${isMe ? '#ffffff' : chillAccent}`,
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    marginBottom: 8,
                                    cursor: 'pointer',
                                    fontSize: 12.5,
                                    textAlign: 'left',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    overflow: 'hidden'
                                  }}
                                  className="quoted-msg-hover"
                                >
                                  <span style={{ 
                                    fontWeight: 800, 
                                    color: isMe ? '#ffffff' : chillAccent,
                                    fontSize: 11
                                  }}>
                                    {msg.reply_to_name}
                                  </span>
                                  <span style={{ 
                                    color: isMe ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-dim)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'block'
                                  }}>
                                    {msg.reply_to_message}
                                  </span>
                                </div>
                              )}

                              {msg.message}
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <div style={{
                            fontSize: 10,
                            fontWeight: 600,
                            marginTop: 4,
                            color: 'var(--text-muted)',
                            marginRight: isMe ? 4 : 0,
                            marginLeft: !isMe ? 4 : 0
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Glassmorphism Input Bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: replyingTo ? '12px 20px 20px' : '16px 20px 20px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(228, 228, 231, 0.4)',
            zIndex: 5,
            flexShrink: 0,
            transition: 'all 0.25s ease'
          }}>
            {/* User Nickname display & Edit Name option */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 6px 10px',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--text-dim)',
              maxWidth: 900,
              margin: '0 auto'
            }}>
              <span>
                Chatting as <strong style={{ color: chillAccent }}>{profile.name}</strong>
              </span>
              
              {isNameLocked ? (
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={13} style={{ color: '#10b981' }} /> Name locked for 24h
                </span>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    setTempName(profile.name)
                    setShowEditNameModal(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: chillAccent,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  className="edit-name-hover"
                >
                  <Sparkles size={12} /> Edit Name
                </button>
              )}
            </div>
            {/* Reply Preview */}
            {replyingTo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(99, 102, 241, 0.04)',
                borderLeft: `4px solid ${chillAccent}`,
                borderRadius: '8px 8px 0 0',
                marginBottom: 12,
                marginTop: 8,
                animation: 'slideUp 0.2s ease-out'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, marginRight: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: chillAccent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Replying to {replyingTo.sender_name}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {replyingTo.message}
                  </span>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  className="close-reply-hover"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              maxWidth: 900,
              margin: '0 auto'
            }}>
              <div style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Share your thoughts..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    border: '1px solid var(--border)',
                    borderRadius: '100px',
                    padding: '12px 24px',
                    fontSize: 14,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none',
                    height: 48,
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
                  }}
                  className="chat-input-focus"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !newMessage.trim()}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: chillGradient,
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  opacity: (!newMessage.trim() || submitting) ? 0.6 : 1,
                  boxShadow: (!newMessage.trim() || submitting) ? 'none' : `0 6px 16px rgba(99, 102, 241, 0.3)`,
                  transform: (!newMessage.trim() || submitting) ? 'scale(1)' : 'scale(1)',
                  flexShrink: 0
                }}
                className="send-button-hover"
              >
                <Send size={18} style={{ marginLeft: 2 }} />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Long Press Actions Bottom Sheet / Popup Menu */}
      {activeMenuMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setActiveMenuMessage(null)}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 360,
            padding: '24px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transform: 'scale(1)',
            animation: 'menuPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Title / Message details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Message from</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: chillAccent }}>{activeMenuMessage.sender_name}</span>
              <span style={{ fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 6, fontStyle: 'italic' }}>
                "{activeMenuMessage.message}"
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => {
                setReplyingTo({
                  id: activeMenuMessage.id,
                  sender_name: activeMenuMessage.sender_name,
                  message: activeMenuMessage.message
                })
                setActiveMenuMessage(null)
              }} style={menuActionStyle}>
                <CornerUpLeft size={16} style={{ color: chillAccent }} />
                <span>Reply</span>
              </button>

              <button onClick={() => {
                navigator.clipboard.writeText(activeMenuMessage.message)
                showToast('Copied to clipboard!')
                setActiveMenuMessage(null)
              }} style={menuActionStyle}>
                <Copy size={16} style={{ color: chillAccent }} />
                <span>Copy Message</span>
              </button>

              {activeMenuMessage.sender_id === profile.id && (
                <button onClick={() => {
                  handleDeleteMessage(activeMenuMessage.id)
                  setActiveMenuMessage(null)
                }} style={{ ...menuActionStyle, color: '#ef4444' }}>
                  <Trash2 size={16} style={{ color: '#ef4444' }} />
                  <span>Delete Message</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Glass Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '100px',
          padding: '10px 24px',
          color: '#ffffff',
          fontSize: 13.5,
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 2000,
          animation: 'toastFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {toast.message}
        </div>
      )}

      {/* Customize Nickname Modal */}
      {showEditNameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setShowEditNameModal(false)}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 360,
            padding: '24px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'menuPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            
            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800, 
              fontSize: 18, 
              color: 'var(--text)',
              marginBottom: 8 
            }}>
              Customize Nickname
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
              You can set a custom name once. Once set, it will be locked for **24 hours**.
            </p>

            <input 
              type="text"
              placeholder="Enter nickname..."
              value={tempName}
              onChange={e => setTempName(e.target.value.slice(0, 20))}
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                background: 'var(--surface2)',
                color: 'var(--text)',
                outline: 'none',
                marginBottom: 16,
                fontWeight: 600
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowEditNameModal(false)}
                className="btn btn-ghost"
                style={{ padding: '10px 16px', fontSize: 13, borderRadius: 10 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCustomName}
                disabled={!tempName.trim() || tempName.trim() === profile.name}
                className="btn"
                style={{ 
                  padding: '10px 20px', 
                  fontSize: 13, 
                  borderRadius: 10,
                  background: chillGradient,
                  color: '#fff',
                  border: 'none',
                  opacity: (!tempName.trim() || tempName.trim() === profile.name) ? 0.6 : 1,
                  cursor: 'pointer'
                }}
              >
                Save & Lock
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Message fade-in slide animation */
        @keyframes messageFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes menuPop {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes toastFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 15px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes highlightFlashAnim {
          0% {
            background-color: rgba(99, 102, 241, 0.25);
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
          }
          50% {
            background-color: rgba(99, 102, 241, 0.25);
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
          }
          100% {
            background-color: transparent;
            box-shadow: none;
          }
        }

        .highlight-flash {
          animation: highlightFlashAnim 1.5s ease-out forwards;
        }

        .quoted-msg-hover:hover {
          opacity: 0.9;
        }

        .close-reply-hover:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
          color: #ef4444 !important;
        }

        .msg-bubble {
          animation: messageFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .chat-input-focus:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
        }

        .send-button-hover:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.05) !important;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4) !important;
        }
        .send-button-hover:active:not(:disabled) {
          transform: translateY(1px) scale(0.97) !important;
        }

        .shadow-premium {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.03) !important;
          border: 1px solid rgba(228, 228, 231, 0.8) !important;
        }
        .shadow-premium-lg {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.04) !important;
        }

        /* Media queries for mobile responsive chat */
        @media (max-width: 768px) {
          .chat-layout {
            grid-template-columns: 1fr !important;
            height: calc(100vh - 125px) !important; /* adjust for bottom nav */
            padding: 12px 12px 10px !important;
            gap: 12px !important;
          }
          .rooms-sidebar {
            display: none !important; /* hide rooms sidebar on mobile */
          }
          .chat-container {
            border-radius: 0px !important;
          }
          .pinned-welcome-bar {
            padding: 10px 16px !important;
          }
          .auto-delete-badge {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
