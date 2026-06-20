import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { TrendingUp, Flame, Calendar, AlertTriangle, Search, BarChart3, Film, Play, ChevronDown, Pin } from 'lucide-react'

const getOrdinal = (n) => {
  if (!n) return ''
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const parseCategoryAndTag = (rawCategory) => {
  const raw = (rawCategory || '').trim();
  if (raw.includes(':')) {
    const parts = raw.split(':');
    return {
      tabCategory: parts[0].trim(),
      describingTag: parts[1].trim()
    };
  }
  const cat = raw.toLowerCase();
  let tabCategory = 'Creators';
  let describingTag = raw || 'Creator';

  if (cat.includes('actor') || cat.includes('actress')) {
    tabCategory = 'Actors';
  } else if (cat.includes('influencer') || cat.includes('model')) {
    tabCategory = 'Influencers';
  } else if (cat.includes('singer')) {
    tabCategory = 'Singers';
  } else if (cat.includes('creator') || cat.includes('artist')) {
    tabCategory = 'Creators';
  } else if (cat.includes('meme')) {
    tabCategory = 'Meme Pages';
  } else if (cat.includes('personalit')) {
    tabCategory = 'Personalities';
  } else if (cat.includes('handle') || cat.includes('page')) {
    tabCategory = 'Handles';
  } else if (cat.includes('sport') || cat.includes('cricket')) {
    tabCategory = 'Sports';
  } else if (cat.includes('politician')) {
    tabCategory = 'Politicians';
  }

  return { tabCategory, describingTag };
};

const getCategoryStyle = (tabCategory) => {
  const cat = (tabCategory || '').toLowerCase().trim()
  let baseColor = 'var(--text-muted)'
  let bgColor = 'var(--surface2)'
  let borderColor = 'var(--border)'

  if (cat.includes('actor')) {
    baseColor = '#8b5cf6' // Purple
    bgColor = 'rgba(139, 92, 246, 0.08)'
    borderColor = 'rgba(139, 92, 246, 0.25)'
  } else if (cat.includes('singer')) {
    baseColor = '#ec4899' // Pink/Rose
    bgColor = 'rgba(236, 72, 153, 0.08)'
    borderColor = 'rgba(236, 72, 153, 0.25)'
  } else if (cat.includes('creator') || cat.includes('artist')) {
    baseColor = '#10b981' // Emerald
    bgColor = 'rgba(16, 185, 129, 0.08)'
    borderColor = 'rgba(16, 185, 129, 0.25)'
  } else if (cat.includes('sports')) {
    baseColor = '#3b82f6' // Blue
    bgColor = 'rgba(59, 130, 246, 0.08)'
    borderColor = 'rgba(59, 130, 246, 0.25)'
  } else if (cat.includes('politician')) {
    baseColor = '#f59e0b' // Amber
    bgColor = 'rgba(245, 158, 11, 0.08)'
    borderColor = 'rgba(245, 158, 11, 0.25)'
  } else if (cat.includes('influencer')) {
    baseColor = '#f43f5e' // Rose
    bgColor = 'rgba(244, 63, 94, 0.08)'
    borderColor = 'rgba(244, 63, 94, 0.25)'
  } else if (cat.includes('meme')) {
    baseColor = '#06b6d4' // Cyan
    bgColor = 'rgba(6, 180, 212, 0.08)'
    borderColor = 'rgba(6, 180, 212, 0.25)'
  } else if (cat.includes('personalit')) {
    baseColor = '#dc2626' // Premium Red
    bgColor = 'rgba(220, 38, 38, 0.08)'
    borderColor = 'rgba(220, 38, 38, 0.25)'
  } else if (cat.includes('handle')) {
    baseColor = '#14b8a6' // Teal
    bgColor = 'rgba(20, 184, 166, 0.08)'
    borderColor = 'rgba(20, 184, 166, 0.25)'
  }

  return {
    color: baseColor,
    background: bgColor,
    borderColor: borderColor,
    border: `1px solid ${borderColor}`,
  }
}

const playSound = (type) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'fav') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'unfav') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(493.88, now + 0.08);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'dragStart') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'swap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'drop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.08);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    console.error('AudioContext sound failed:', e);
  }
}

export default function LivePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('most_followed') // 'most_followed' or 'viral_reels'
  const [liveData, setLiveData] = useState({ live_date: '', most_followed: [], viral_reels: [] })
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [hoveredTab, setHoveredTab] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(50)

  // Favorites and Reordering State Management
  const [profilesList, setProfilesList] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [favoritesInitialized, setFavoritesInitialized] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [justDroppedId, setJustDroppedId] = useState(null)

  const longPressTimeout = useRef(null)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const isDraggingActive = useRef(false)
  const loaderRef = useRef(null)

  // Infinite Scroll Observer
  useEffect(() => {
    const sentinel = loaderRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      const firstEntry = entries[0]
      if (firstEntry.isIntersecting) {
        setDisplayLimit(prev => prev + 50)
      }
    }, {
      rootMargin: '150px',
      threshold: 0.1
    })

    observer.observe(sentinel)

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [loading, searchQuery, selectedCategory, selectedLanguage, activeTab])

  // Initialize Favorites and Profiles List (run only once after live data is fetched)
  useEffect(() => {
    if (liveData.most_followed.length > 0 && !favoritesInitialized) {
      try {
        const stored = localStorage.getItem('spialr_favorites_ids')
        let idsSet = new Set()
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            idsSet = new Set(parsed)
            setFavoriteIds(idsSet)
          }
        }
        
        // Favorites float to the top of the initial list
        const starred = liveData.most_followed.filter(p => idsSet.has(p.id))
        const unstarred = liveData.most_followed.filter(p => !idsSet.has(p.id))
        setProfilesList([...starred, ...unstarred])
        setFavoritesInitialized(true)
      } catch (e) {
        console.error('Error loading favorites from localStorage:', e)
        setProfilesList(liveData.most_followed)
        setFavoritesInitialized(true)
      }
    }
  }, [liveData.most_followed, favoritesInitialized])

  // Toggle favorite status
  const toggleFavorite = (profile) => {
    const newFavoriteIds = new Set(favoriteIds)
    const isAdding = !newFavoriteIds.has(profile.id)

    if (isAdding) {
      playSound('fav')
      newFavoriteIds.add(profile.id)
      setProfilesList(prev => {
        const list = prev.filter(p => p.id !== profile.id)
        // Find where the first non-starred profile is to insert at the end of the starred group
        const firstNonStarredIdx = list.findIndex(p => !newFavoriteIds.has(p.id))
        if (firstNonStarredIdx === -1) {
          return [profile, ...list]
        } else {
          list.splice(firstNonStarredIdx, 0, profile)
          return list
        }
      })
    } else {
      playSound('unfav')
      newFavoriteIds.delete(profile.id)
      setProfilesList(prev => {
        const list = prev.filter(p => p.id !== profile.id)
        // Sort unstarred profiles by their original rank
        const sortedUnstarred = list.filter(p => !newFavoriteIds.has(p.id)).sort((a, b) => {
          const idxA = liveData.most_followed.findIndex(p => p.id === a.id)
          const idxB = liveData.most_followed.findIndex(p => p.id === b.id)
          return idxA - idxB
        })
        const officialIdx = liveData.most_followed.findIndex(p => p.id === profile.id)
        
        let insertIdx = sortedUnstarred.findIndex(p => {
          const idxP = liveData.most_followed.findIndex(item => item.id === p.id)
          return idxP > officialIdx
        })
        if (insertIdx === -1) {
          sortedUnstarred.push(profile)
        } else {
          sortedUnstarred.splice(insertIdx, 0, profile)
        }
        
        const starred = list.filter(p => newFavoriteIds.has(p.id))
        return [...starred, ...sortedUnstarred]
      })
    }
    setFavoriteIds(newFavoriteIds)
    localStorage.setItem('spialr_favorites_ids', JSON.stringify(Array.from(newFavoriteIds)))
  }

  // Refs for stable state access in global window listeners
  const draggedIdRef = useRef(null)
  const isLongPressingRef = useRef(false)

  const setDraggedIdState = (id) => {
    draggedIdRef.current = id
    setDraggedId(id)
  }

  const setIsLongPressingState = (val) => {
    isLongPressingRef.current = val
    setIsLongPressing(val)
  }

  // Global window listeners for drag movement & release to prevent pointer capture loss bugs
  const handleGlobalPointerMove = (e) => {
    if (longPressTimeout.current && !isDraggingActive.current) {
      const diffY = Math.abs(e.clientY - touchStartY.current)
      const diffX = Math.abs(e.clientX - touchStartX.current)
      if (diffY > 8 || diffX > 8) {
        clearTimeout(longPressTimeout.current)
        longPressTimeout.current = null
        cleanupGlobalListeners()
      }
    }

    if (isDraggingActive.current && draggedIdRef.current) {
      if (e.cancelable) {
        e.preventDefault()
      }

      const element = document.elementFromPoint(e.clientX, e.clientY)
      if (!element) return

      const targetItem = element.closest('[data-profile-id]')
      if (targetItem) {
        const targetId = targetItem.getAttribute('data-profile-id')
        const targetIdNum = isNaN(Number(targetId)) ? targetId : Number(targetId)
        
        if (targetIdNum !== draggedIdRef.current) {
          playSound('swap')
          setProfilesList(prev => {
            const list = [...prev]
            const draggedIdx = list.findIndex(p => p.id === draggedIdRef.current)
            const targetIdx = list.findIndex(p => p.id === targetIdNum)
            
            if (draggedIdx !== -1 && targetIdx !== -1) {
              const [removed] = list.splice(draggedIdx, 1)
              list.splice(targetIdx, 0, removed)
            }
            return list
          })
        }
      }
    }
  }

  const handleGlobalPointerUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }

    if (draggedIdRef.current && isDraggingActive.current) {
      playSound('drop')
      setJustDroppedId(draggedIdRef.current)
      setTimeout(() => {
        setJustDroppedId(null)
      }, 1000)
    }

    cleanupGlobalListeners()
    setIsLongPressingState(false)
    setDraggedIdState(null)
    isDraggingActive.current = false
  }

  const cleanupGlobalListeners = () => {
    window.removeEventListener('pointermove', handleGlobalPointerMove)
    window.removeEventListener('pointerup', handleGlobalPointerUp)
    window.removeEventListener('pointercancel', handleGlobalPointerUp)
  }

  // Pointer-event based unified drag & drop reordering (supports long-press on both desktop & mobile)
  const handlePointerDown = (e, id) => {
    // Ignore button clicks (like the star favorite toggle button)
    if (e.target.closest('button')) return
    
    // Only left click drag for mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return

    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
    }

    touchStartY.current = e.clientY
    touchStartX.current = e.clientX
    isDraggingActive.current = false

    // Attach global listeners immediately to track moves and releases anywhere, even if DOM re-orders
    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: false })
    window.addEventListener('pointerup', handleGlobalPointerUp)
    window.addEventListener('pointercancel', handleGlobalPointerUp)

    longPressTimeout.current = setTimeout(() => {
      playSound('dragStart')
      setIsLongPressingState(true)
      setDraggedIdState(id)
      isDraggingActive.current = true

      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 400)
  }

  // Reset display limit when filter state changes to optimize initial load & render speed
  useEffect(() => {
    setDisplayLimit(50)
  }, [searchQuery, selectedCategory, selectedLanguage, activeTab])

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))
    
    // Restore last selected language filter from localStorage
    const savedRoom = localStorage.getItem('spialr_last_language')
    if (savedRoom) {
      const validLangs = ['all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam']
      if (validLangs.includes(savedRoom.toLowerCase())) {
        const formatted = savedRoom.charAt(0).toUpperCase() + savedRoom.slice(1)
        setSelectedLanguage(formatted)
      }
    }
  }, [])

  const fetchLiveData = () => {
    setLoading(true)
    setError(null)
    fetch('/api/live')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load live data')
        return res.json()
      })
      .then((data) => {
        setLiveData({
          live_date: data.live_date || '',
          most_followed: data.most_followed || [],
          viral_reels: data.viral_reels || [],
        })
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchLiveData()
  }, [])

  return (
    <>
      <Head>
        <title>Most Followed Instagram Accounts Live Standings — Spialr</title>
        <meta name="description" content="Check real-time follower counts of 1000s of the most followed Instagram accounts globally and in India. Live standings of top 100 Instagram accounts, top creators, actors, athletes, and influencers ordered by followers." />
        <meta name="keywords" content="top 100 instagram accounts in india, most followed instagram accounts, most followed actors on instagram, top creators on instagram, top instagram influencers, live instagram follower counts, sports stars instagram followers, top meme pages, most followed politicians, instagram follower rankings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Social Sharing SEO */}
        <meta property="og:title" content="Most Followed Instagram Accounts (Live Rankings) — Spialr" />
        <meta property="og:description" content="Track real-time follower counts of 1000s of the most followed Instagram accounts globally and in India. View top-ranked actors, creators, influencers, athletes, and politicians ordered by followers." />
        <meta property="og:type" content="website" />
        
        {/* Schema Markup for Google Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Most Followed Instagram Accounts Live Leaderboard",
              "description": "Live rankings and follower counts of the top Instagram profiles globally.",
              "itemListElement": (liveData?.most_followed || []).slice(0, 15).map((profile, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "name": profile.name,
                "description": `${profile.category?.split(':')[1] || 'Creator'} with ${profile.followers_text || 'millions of'} followers.`
              }))
            })
          }}
        />
      </Head>

      <Navbar />

      <main className="main-container" style={{ maxWidth: 850, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header section with live pulse indicator and manual date */}
        <div className="fade-in header-section" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 32,
        }}>
          <div className="header-top-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <h1 className="live-title-h1" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 4.5vw, 36px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              {activeTab === 'most_followed' ? (
                <>Most Followed <span className="gradient-text">Instagram Accounts</span></>
              ) : (
                <>Most Viral <span className="gradient-text">Instagram Reels</span></>
              )}
            </h1>
            {/* Date Badge */}
            {currentDate && (
              <div className="date-badge" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-dim)',
              }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <span>{currentDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subtabs Selection */}
        <div className="fade-in subtabs-container" style={{
          display: 'flex',
          background: 'var(--surface2)',
          borderRadius: '100px',
          padding: 3,
          marginBottom: 32,
          gap: 4,
          border: '1px solid var(--border)',
          maxWidth: 350,
          margin: '0 auto 32px'
        }}>
          <button
            onClick={() => { setActiveTab('most_followed'); setSearchQuery(''); setSelectedLanguage('All'); setIsLangDropdownOpen(false); }}
            onMouseEnter={() => setHoveredTab('most_followed')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '100px',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              background: activeTab === 'most_followed' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'most_followed' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'most_followed' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transform: hoveredTab === 'most_followed' && activeTab !== 'most_followed' ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6, flexShrink: 0 }}>
              <rect x="3" y="12" width="4" height="8" rx="1" fill="#4caf50" />
              <rect x="10" y="7" width="4" height="13" rx="1" fill="#f44336" />
              <rect x="17" y="3" width="4" height="17" rx="1" fill="#2196f3" />
              <line x1="2" y1="21" x2="22" y2="21" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Most Followed
          </button>
          <button
            onClick={() => { setActiveTab('viral_reels'); setSearchQuery(''); setSelectedLanguage('All'); setIsLangDropdownOpen(false); }}
            onMouseEnter={() => setHoveredTab('viral_reels')}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '100px',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              background: activeTab === 'viral_reels' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'viral_reels' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === 'viral_reels' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transform: hoveredTab === 'viral_reels' && activeTab !== 'viral_reels' ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6, flexShrink: 0 }}>
              <path d="M12 2C8 6.5 8 11.5 10 13c.5-.5 1-1.5 1-2.5 1.5 1.5 2 3.5 1.5 5.5-.5 2 1.5 3.5 3.5 3 2.5-.5 4.5-3 3-6.5-1.5-3.5-5-4.5-5-7.5-.5 1.5-1 2.5-2 3.5C11.5 6 12 3.5 12 2z" fill="#ff9800" />
              <path d="M12 14c-1 1-1.5 2-1.5 3s.5 2.5 1.5 2.5 2.5-1.5 2-3.5c-.2-.5-1-1.5-2-2z" fill="#f44336" />
            </svg>
            Viral Reels Today
          </button>
        </div>

        {/* Badges / Controls Row */}
        <div className="badges-control-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginBottom: 24,
          marginTop: -16,
        }}>
          {/* Live Button */}
          <button 
            onClick={fetchLiveData}
            className="live-badge-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(225, 48, 108, 0.1)',
              padding: '6px 12px',
              borderRadius: '100px',
              border: '1px solid rgba(225, 48, 108, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            title="Click to refresh data"
          >
            <span className="live-pulse" style={{
              display: 'inline-flex',
              alignItems: 'center',
            }}>{activeTab === 'most_followed' ? <TrendingUp size={13} style={{ color: 'var(--accent)' }} /> : <Flame size={13} style={{ color: '#ff6b35' }} />}</span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>{activeTab === 'most_followed' ? 'Live' : 'Trending'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div className="spinner" />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Fetching latest live updates...</div>
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(255,82,82,0.05)',
            border: '1px solid rgba(255,82,82,0.15)',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            color: '#d32f2f',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <AlertTriangle size={32} style={{ color: '#ffa751' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Unable to Load Live Data</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{error}</p>
          </div>
        ) : activeTab === 'most_followed' ? (
          /* MOST FOLLOWED TAB */
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Language Filter Dropdown */}
            {liveData.most_followed.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginBottom: 4,
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '100px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{selectedLanguage}</span>
                    <ChevronDown size={14} style={{
                      transform: isLangDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)'
                    }} />
                  </button>

                  {isLangDropdownOpen && (
                    <>
                      {/* Click outside backdrop */}
                      <div 
                        onClick={() => setIsLangDropdownOpen(false)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 99,
                          background: 'transparent'
                        }}
                      />
                      {/* Dropdown Menu */}
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 6,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                        zIndex: 100,
                        minWidth: 160,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '4px 0',
                      }}>
                        {['All', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'].map((lang) => {
                          const isSelected = selectedLanguage === lang;
                          return (
                            <button
                              key={lang}
                              onClick={() => {
                                setSelectedLanguage(lang);
                                setIsLangDropdownOpen(false);
                                localStorage.setItem('spialr_last_language', lang.toLowerCase());
                              }}
                              className={`lang-dropdown-item ${isSelected ? 'active' : ''}`}
                            >
                              {lang}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Search Input */}
            {liveData.most_followed.length > 0 && (
              <div style={{
                position: 'relative',
                marginBottom: 4,
              }}>
                <Search size={16} style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  placeholder="Search profiles by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{
                    paddingLeft: 44,
                    width: '100%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 14,
                    height: 46,
                    color: 'var(--text)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 0
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Category Filter */}
            {liveData.most_followed.length > 0 && (() => {
              const categories = ['All', 'Creators', 'Influencers', 'Actors', 'Meme Pages', 'Personalities', 'Sports', 'Politicians', 'Handles', 'Singers', 'Favorites']

              return (
                <div className="no-scrollbar category-filter-container" style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  marginBottom: 12,
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {categories.map((cat) => {
                    const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '100px',
                          fontSize: 12,
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                          background: isActive ? 'var(--gradient-subtle)' : 'var(--surface)',
                          color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 2px 6px rgba(225, 48, 108, 0.1)' : 'none'
                        }}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {liveData.most_followed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--surface2)', borderRadius: 20, border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={36} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No profiles yet</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Check back later for update ranks.</p>
              </div>
            ) : (() => {
              const filtered = profilesList.filter(p => {
                const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase())
                
                let matchesCategory = false
                if (selectedCategory.toLowerCase() === 'all') {
                  matchesCategory = true
                } else if (selectedCategory.toLowerCase() === 'favorites') {
                  matchesCategory = favoriteIds.has(p.id)
                } else {
                  matchesCategory = p.category && p.category.split(',').some(catStr => {
                    const parsed = parseCategoryAndTag(catStr)
                    return parsed.tabCategory.toLowerCase() === selectedCategory.toLowerCase()
                  })
                }

                const matchesLanguage = selectedLanguage === 'All' || 
                  (p.language && p.language.split(',').map(l => l.trim().toLowerCase()).includes(selectedLanguage.toLowerCase()))
                return matchesSearch && matchesCategory && matchesLanguage
              })

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No profiles match the filter criteria
                  </div>
                )
              }
              return (
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                }}>
                  {/* Table Header */}
                  <div className="table-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    background: 'var(--surface2)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {/* Grip space */}
                    <div style={{ width: 24, marginRight: 4 }} />
                    <div className="col-rank">Rank</div>
                    <div style={{ flex: 1, paddingLeft: 12 }}>Account</div>
                    <div className="col-followers">Followers</div>
                  </div>

                  {/* Table Body */}
                  {filtered.slice(0, displayLimit).map((profile, index) => {
                    const officialRank = liveData.most_followed.findIndex(p => p.id === profile.id) + 1
                    const isDragged = draggedId === profile.id
                    return (
                      <div
                        key={profile.id}
                        data-profile-id={profile.id}
                        draggable="false"
                        onPointerDown={(e) => handlePointerDown(e, profile.id)}
                        className={`table-row table-row-hover ${profile.id === justDroppedId ? 'dropped-flash' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 20px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: isDragged ? 'var(--surface2)' : 'var(--surface)',
                          transition: 'background-color 0.2s ease, transform 0.15s ease',
                          opacity: isDragged ? 0.6 : 1,
                          transform: isDragged ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: isDragged ? '0 8px 24px rgba(0, 0, 0, 0.12)' : 'none',
                          outline: isDragged ? '1px solid var(--accent)' : 'none',
                          cursor: isLongPressing && draggedId === profile.id ? 'grabbing' : 'default',
                          zIndex: isDragged ? 10 : 1,
                          position: 'relative',
                          pointerEvents: isDragged ? 'none' : 'auto',
                          touchAction: isDragged ? 'none' : 'auto',
                        }}
                      >
                        {/* Grip Handle */}
                        <div style={{
                          width: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          marginRight: 4,
                          cursor: isLongPressing && draggedId === profile.id ? 'grabbing' : 'grab',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="9" cy="5" r="1.5" fill="currentColor"/>
                            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
                            <circle cx="15" cy="5" r="1.5" fill="currentColor"/>
                            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="15" cy="19" r="1.5" fill="currentColor"/>
                          </svg>
                        </div>

                        {/* Rank Position */}
                        <div className="col-rank" style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          fontFamily: 'var(--font-display)',
                          width: 60,
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          #{officialRank}
                        </div>

                        {/* Profile Info (Avatar + Name) */}
                        <div className="col-account-info" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                          paddingLeft: 12
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--gradient)',
                            padding: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <div style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: 'var(--surface)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                              overflow: 'hidden'
                            }}>
                              {profile.photo_url ? (
                                <img src={profile.photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                profile.name?.charAt(0)
                              )}
                            </div>
                          </div>

                          {/* Name & Category tag */}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className="profile-name" style={{
                                fontWeight: 700,
                                fontSize: 16,
                                color: 'var(--text)',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                              }}>
                                {profile.name}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(profile);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px 6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: favoriteIds.has(profile.id) ? '#f59e0b' : 'var(--text-muted)',
                                  transition: 'transform 0.2s ease, color 0.2s ease',
                                  outline: 'none',
                                }}
                                title={favoriteIds.has(profile.id) ? "Remove from Favorites" : "Pin to Top (Favorite)"}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill={favoriteIds.has(profile.id) ? "#f59e0b" : "none"} stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              </button>
                            </div>
                            {profile.category && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                {profile.category.split(',').map((catStr, cIdx) => {
                                  const parsed = parseCategoryAndTag(catStr);
                                  if (!parsed.describingTag) return null;
                                  const style = getCategoryStyle(parsed.tabCategory);
                                  return (
                                    <span key={cIdx} style={{
                                      alignSelf: 'flex-start',
                                      fontFamily: "'Caveat', cursive, sans-serif",
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      padding: '0px 7px',
                                      borderRadius: '100px',
                                      lineHeight: '1.25',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: style.color,
                                      background: style.background,
                                      border: 'none',
                                    }}>
                                      <span style={{
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: style.color,
                                        display: 'inline-block',
                                        flexShrink: 0
                                      }} />
                                      {parsed.describingTag}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Followers Count */}
                        <div className="col-followers" style={{
                          width: 140,
                          textAlign: 'right',
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          flexShrink: 0,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          overflow: 'visible'
                        }}>
                          {favoriteIds.has(profile.id) && (
                            <span className="glass-pin-badge fade-in" style={{
                              position: 'absolute',
                              right: '-8px',
                              top: '50%',
                              transform: 'translateY(-50%) rotate(45deg)',
                              color: '#10b981',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 2,
                              pointerEvents: 'none'
                            }} title="Pinned to Top">
                              <Pin size={22} style={{ fill: '#10b981' }} />
                            </span>
                          )}
                          <span style={{
                            marginRight: favoriteIds.has(profile.id) ? '20px' : '0px',
                            transition: 'margin-right 0.2s ease'
                          }}>
                            {profile.followers_text?.trim() ? profile.followers_text : (profile.followers_count >= 1000000 ? `${(profile.followers_count / 1000000).toFixed(1).replace(/\.0$/, '')}M` : profile.followers_count?.toLocaleString() || '—')}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {filtered.length > displayLimit && (
                    <div ref={loaderRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', gap: 8 }}>
                      <div className="spinner" style={{ width: 18, height: 18 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading more profiles...</span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        ) : (
          /* VIRAL REELS TAB */
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {liveData.viral_reels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--surface2)', borderRadius: 20, border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={36} style={{ color: '#ff6b35', marginBottom: 16 }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No viral reels today</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Trending video links will update here.</p>
              </div>
            ) : (
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 16,
                background: 'var(--surface)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div style={{ width: 60, textAlign: 'center' }}>Rank</div>
                  <div style={{ flex: 1, paddingLeft: 12 }}>Reel / Video</div>
                  <div style={{ width: 100, textAlign: 'right' }}>Link</div>
                </div>

                {/* Table Body */}
                {liveData.viral_reels.map((reel, idx) => {
                  const rank = idx + 1
                  return (
                    <a
                      key={reel.id}
                      href={reel.instagram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-row-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.2s ease',
                        textDecoration: 'none'
                      }}
                    >
                      {/* Rank Position */}
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-display)',
                        width: 60,
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        #{rank}
                      </div>

                      {/* Reel Info (Thumbnail + Title/Creator) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: 12
                      }}>
                        {/* Thumbnail */}
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {reel.photo_url ? (
                            <>
                              <img src={reel.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Play size={10} style={{ fill: '#ffffff', color: '#ffffff' }} />
                              </div>
                            </>
                          ) : (
                            <Film size={16} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>

                        {/* Title & Creator Name */}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {reel.title}
                          </span>
                          {reel.creator_name && (
                            <span style={{
                              alignSelf: 'flex-start',
                              fontSize: 10,
                              fontWeight: 500,
                              color: 'var(--text-dim)',
                              marginTop: 2
                            }}>
                              {reel.creator_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Link */}
                      <div style={{
                        width: 100,
                        textAlign: 'right',
                        fontWeight: 600,
                        fontSize: 12,
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-body)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4
                      }}>
                        <span>Watch</span>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        .favorite-row {
          transition: transform 0.15s ease, background-color 0.2s ease;
        }

        .favorite-row:hover {
          background-color: var(--surface2) !important;
        }

        .favorite-row:last-child {
          border-bottom: none !important;
        }

        .live-pulse {
          animation: pulse-scale 1.8s infinite;
        }

        .live-badge-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .live-badge-btn:hover {
          background-color: rgba(225, 48, 108, 0.18) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(225, 48, 108, 0.15);
        }

        .live-badge-btn:active {
          transform: translateY(0px) scale(0.97);
          box-shadow: 0 2px 6px rgba(225, 48, 108, 0.1);
        }

        .table-row-hover:hover {
          background-color: var(--surface2) !important;
        }

        .table-row-hover:last-child {
          border-bottom: none !important;
        }

        @keyframes dropped-flash {
          0% {
            background-color: rgba(245, 158, 11, 0.18) !important;
            box-shadow: inset 0 0 15px rgba(245, 158, 11, 0.25);
          }
          100% {
            background-color: var(--surface) !important;
            box-shadow: none;
          }
        }

        .dropped-flash {
          animation: dropped-flash 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .col-rank {
          width: 60px;
          text-align: center;
          flex-shrink: 0;
        }

        .col-followers {
          width: 140px;
          text-align: right;
          flex-shrink: 0;
        }

        @media (max-width: 600px) {
          .main-container {
            padding: 12px 12px 60px !important;
          }
          .header-section {
            margin-bottom: 12px !important;
            gap: 8px !important;
          }
          .header-top-row {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
            gap: 8px !important;
          }
          .live-title-h1 {
            text-align: center !important;
            font-size: clamp(19px, 5.2vw, 26px) !important;
            line-height: 1.2 !important;
            white-space: normal !important;
            width: 100% !important;
          }
          .date-badge {
            margin: 0 auto !important;
          }
          .badges-control-row {
            margin-bottom: 16px !important;
            margin-top: -12px !important;
          }
          .subtabs-container {
            margin: 0 auto 12px !important;
          }
          .category-filter-container {
            margin-bottom: 8px !important;
          }
          .table-header {
            padding: 14px 10px !important;
          }
          .table-row {
            padding: 12px 10px !important;
          }
          .col-rank {
            width: 42px !important;
          }
          .col-followers {
            width: 85px !important;
          }
          .col-account-info {
            padding-left: 6px !important;
            gap: 8px !important;
          }
          .profile-name {
            font-size: 15px !important;
          }
        }

        @keyframes pulse-scale {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  )
}
