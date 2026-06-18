import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { Send, MessageSquare, User, Clock, AlertCircle, Sparkles, Users, Globe, Hash } from 'lucide-react'

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

  const messagesEndRef = useRef(null)

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

  // Initialize profile (nickname and ID)
  useEffect(() => {
    let savedName = localStorage.getItem('spialr_chat_name')
    let savedId = localStorage.getItem('spialr_chat_id')

    if (!savedName || !savedId) {
      const newProfile = generateAnonymousProfile()
      localStorage.setItem('spialr_chat_name', newProfile.name)
      localStorage.setItem('spialr_chat_id', newProfile.id)
      savedName = newProfile.name
      savedId = newProfile.id
    }

    setProfile({ name: savedName, id: savedId })
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

  // Poll for messages every 3 seconds
  useEffect(() => {
    fetchMessages(room)

    const interval = setInterval(() => {
      fetchMessages(room, true)
    }, 3000)

    return () => clearInterval(interval)
  }, [room])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to bottom when messages list change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !profile.id || !profile.name || submitting) return

    setSubmitting(true)
    const pendingMsg = newMessage
    setNewMessage('') // Clear input immediately for snappy feel

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          message: pendingMsg,
          sender_name: profile.name,
          sender_id: profile.id
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
            background: 'rgba(99, 102, 241, 0.018)', // Chill soft indigo pastel background
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

                    <div style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                    className="msg-bubble"
                    >
                      <div style={{
                        maxWidth: '75%',
                        display: 'flex',
                        gap: 10,
                        flexDirection: 'row',
                        alignItems: 'flex-start'
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
                          alignItems: isMe ? 'flex-end' : 'flex-start'
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

                          {/* Message Bubble */}
                          <div style={{
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
                            position: 'relative'
                          }}>
                            {msg.message}
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
            padding: '16px 20px 20px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(228, 228, 231, 0.4)',
            zIndex: 5,
            flexShrink: 0
          }}>
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
