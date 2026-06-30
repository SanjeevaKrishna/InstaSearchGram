import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { TrendingUp, Flame, Calendar, AlertTriangle, Search, BarChart3, Film, Play, ChevronDown, Pin, ThumbsUp, ThumbsDown, User, ChevronRight, X, Sparkles } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('most_followed') // 'most_followed' or 'voting'
  const [liveData, setLiveData] = useState({ live_date: '', most_followed: [], viral_reels: [] })
  
  // Voting states
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [showConfirmPopup, setShowConfirmPopup] = useState(null)
  const [userVotes, setUserVotes] = useState({})
  const [userDevotes, setUserDevotes] = useState({})
  const [isSubmittingVote, setIsSubmittingVote] = useState(false)
  const [showSuccessAnim, setShowSuccessAnim] = useState(null)
  const [showStatsModal, setShowStatsModal] = useState(null)
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [hoveredTab, setHoveredTab] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(50)

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

    // Load user vote counts from localStorage
    try {
      const votes = JSON.parse(localStorage.getItem('spialr_votes_map') || '{}')
      const devotes = JSON.parse(localStorage.getItem('spialr_devotes_map') || '{}')
      setUserVotes(votes)
      setUserDevotes(devotes)
    } catch (e) {
      console.error(e)
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

  const fetchLiveDataFresh = () => {
    setLoading(true)
    setError(null)
    fetch('/api/live?fresh=true')
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

  const handleOpenConfirm = (type) => {
    setShowConfirmPopup(type)
  }

  const handleConfirmVoteAction = async () => {
    if (!selectedProfile || !showConfirmPopup) return
    setIsSubmittingVote(true)
    const type = showConfirmPopup === 'vote' ? 'vote' : 'devote'
    
    // Front-end spam click cooldown defense
    const lastAction = localStorage.getItem('spialr_last_action_time')
    const now = Date.now()
    if (lastAction && (now - Number(lastAction) < 1000)) {
      alert('Please wait a moment between actions.')
      setIsSubmittingVote(false)
      return
    }
    
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          type
        })
      })
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote')
      }
      
      // Update local storage tracking counts
      if (type === 'vote') {
        const updatedVotes = { ...userVotes, [selectedProfile.id]: (userVotes[selectedProfile.id] || 0) + 1 }
        setUserVotes(updatedVotes)
        localStorage.setItem('spialr_votes_map', JSON.stringify(updatedVotes))
      } else {
        const updatedDevotes = { ...userDevotes, [selectedProfile.id]: (userDevotes[selectedProfile.id] || 0) + 1 }
        setUserDevotes(updatedDevotes)
        localStorage.setItem('spialr_devotes_map', JSON.stringify(updatedDevotes))
      }
      
      localStorage.setItem('spialr_last_action_time', now.toString())
      
      // Show success animation overlay
      setShowSuccessAnim({ name: selectedProfile.name, type })
      setTimeout(() => {
        setShowSuccessAnim(null)
      }, 1500)
      
      // Close popups
      setShowConfirmPopup(null)
      setSelectedProfile(null)
      
      // Refetch fresh live data to update the rankings
      fetchLiveDataFresh()
      
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmittingVote(false)
    }
  }

  const formatVotes = (votes) => {
    const v = votes || 0
    if (v > 0) return `+${v}`
    return v.toString()
  }

  const renderMovement = (profile) => {
    // If a profile has 0 votes, force no rank movement percentage (display a dash)
    if (!(profile.votes || 0)) {
      return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>—</span>
    }
    const curr = profile.current_vote_rank
    const prev = profile.previous_vote_rank
    if (!curr || !prev || curr === prev) {
      return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>—</span>
    }
    if (prev > curr) {
      return <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>↑ {prev - curr}</span>
    } else {
      return <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>↓ {curr - prev}</span>
    }
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
          gap: 16,
          marginBottom: 32,
        }}>
          {/* Live Status + Date Row */}
          <div className="header-status-row" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            {/* Live Refresh Button */}
            <button 
              onClick={fetchLiveData}
              className="live-badge-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(225, 48, 108, 0.08)',
                padding: '6px 12px',
                borderRadius: '100px',
                border: '1px solid rgba(225, 48, 108, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              title="Click to refresh data"
            >
              <span className="live-pulse" style={{
                display: 'inline-flex',
                alignItems: 'center',
              }}>{activeTab === 'most_followed' ? <TrendingUp size={13} style={{ color: 'var(--accent)' }} /> : <ThumbsUp size={13} style={{ color: 'var(--accent)' }} />}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>{activeTab === 'most_followed' ? 'Live' : 'Voting'}</span>
            </button>
 
             {/* Separator Dot */}
             <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>•</span>
 
             {/* Date Display */}
             {currentDate && (
               <div style={{
                 display: 'inline-flex',
                 alignItems: 'center',
                 gap: 6,
                 fontSize: 13,
                 fontWeight: 600,
                 color: 'var(--text-dim)',
               }}>
                 <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                 <span>Updated {currentDate}</span>
               </div>
             )}
           </div>
 
           {/* Heading */}
           <h1 className="live-title-h1" style={{
             fontFamily: 'var(--font-display)',
             fontSize: 'clamp(28px, 5vw, 38px)',
             fontWeight: 800,
             letterSpacing: '-0.02em',
             lineHeight: 1.15,
             margin: 0,
           }}>
             {activeTab === 'most_followed' ? (
               <>Most Followed <span className="gradient-text">Instagram Accounts</span></>
             ) : (
               <>Vote Your <span className="gradient-text">Favourites</span></>
             )}
           </h1>
           {activeTab === 'voting' && (
             <p style={{
               fontSize: 'clamp(11px, 3.2vw, 13px)',
               color: 'var(--text-dim)',
               marginTop: 6,
               marginBottom: 0,
               fontWeight: 500,
               lineHeight: 1.4,
               letterSpacing: '0.01em',
             }}>
               Compare, upvote to support, or downvote to drag. Let the fan wars begin!
             </p>
           )}
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
             onClick={() => { setActiveTab('voting'); setSearchQuery(''); setSelectedLanguage('All'); setIsLangDropdownOpen(false); }}
             onMouseEnter={() => setHoveredTab('voting')}
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
               background: activeTab === 'voting' ? 'var(--surface)' : 'transparent',
               color: activeTab === 'voting' ? 'var(--text)' : 'var(--text-muted)',
               boxShadow: activeTab === 'voting' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
               transform: hoveredTab === 'voting' && activeTab !== 'voting' ? 'scale(1.02)' : 'scale(1)',
               transition: 'all 0.2s ease',
             }}
           >
             <span style={{ marginRight: 6, fontSize: 14, flexShrink: 0, opacity: activeTab === 'voting' ? 1 : 0.6 }}>
                👥
              </span>
             Voting
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
              const categories = ['All', 'Creators', 'Influencers', 'Actors', 'Meme Pages', 'Personalities', 'Sports', 'Politicians', 'Handles', 'Singers']

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
              // 1. Filter by category and language first
              const categoryFiltered = (liveData.most_followed || []).filter(p => {
                let matchesCategory = false
                if (selectedCategory.toLowerCase() === 'all') {
                  matchesCategory = true
                } else {
                  matchesCategory = p.category && p.category.split(',').some(catStr => {
                    const parsed = parseCategoryAndTag(catStr)
                    return parsed.tabCategory.toLowerCase() === selectedCategory.toLowerCase()
                  })
                }

                const matchesLanguage = selectedLanguage === 'All' || 
                  (p.language && p.language.split(',').map(l => l.trim().toLowerCase()).includes(selectedLanguage.toLowerCase()))
                return matchesCategory && matchesLanguage
              })

              // 2. Assign category-specific rankings
              const rankedCategoryList = categoryFiltered.map((p, idx) => ({
                ...p,
                categoryRank: idx + 1
              }))

              // 3. Filter by search query for display
              const filtered = rankedCategoryList.filter(p => {
                return p.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
                  border: 'none',
                  borderRadius: 0,
                  background: 'transparent',
                  overflow: 'hidden',
                }}>
                  {/* Table Body */}
                  {filtered.slice(0, displayLimit).map((profile, index) => {
                    const rankToDisplay = profile.categoryRank
                    return (
                      <div
                        key={profile.id}
                        className="table-row table-row-hover"
                        onClick={() => setSelectedProfile(profile)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 20px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          transition: 'background-color 0.2s ease',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Rank Position */}
                        <div className="col-rank" style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: 'var(--accent)',
                          fontFamily: 'var(--font-display)',
                          width: 60,
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          #{rankToDisplay}
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
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          flexShrink: 0,
                        }}>
                          {profile.followers_text?.trim() ? profile.followers_text : (profile.followers_count >= 1000000 ? `${(profile.followers_count / 1000000).toFixed(1).replace(/\.0$/, '')}M` : profile.followers_count?.toLocaleString() || '—')}
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
          /* VOTING TAB */
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search Input */}
            {liveData.most_followed.length > 0 && (
              <div style={{ position: 'relative', marginBottom: 4 }}>
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

            {(() => {
              // 1. Filter by language (Voting leaderboard is a single category-agnostic leaderboard)
              const categoryFiltered = (liveData.most_followed || []).filter(p => {
                const matchesCategory = true
                const matchesLanguage = selectedLanguage === 'All' || 
                  (p.language && p.language.split(',').map(l => l.trim().toLowerCase()).includes(selectedLanguage.toLowerCase()))
                return matchesCategory && matchesLanguage
              })

              // 2. Sort by votes desc, then by followers desc, then by name asc
              const sortedVotingList = [...categoryFiltered].sort((a, b) => {
                const votesA = a.votes || 0
                const votesB = b.votes || 0
                if (votesA !== votesB) return votesB - votesA
                
                const followersA = a.followers_count || 0
                const followersB = b.followers_count || 0
                if (followersA !== followersB) return followersB - followersA
                
                return (a.name || '').localeCompare(b.name || '')
              })

              // 3. Assign category-specific rankings
              const rankedVotingList = sortedVotingList.map((p, idx) => ({
                ...p,
                categoryRank: idx + 1
              }))

              // 4. Filter by search query for display
              const filtered = rankedVotingList.filter(p => {
                return p.name?.toLowerCase().includes(searchQuery.toLowerCase())
              })

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No profiles match the filter criteria
                  </div>
                )
              }
              return (
                <div style={{ border: 'none', borderRadius: 0, background: 'transparent', overflow: 'hidden' }}>
                  {filtered.slice(0, displayLimit).map((profile, index) => {
                    const rankToDisplay = profile.categoryRank
                    return (
                      <div
                        key={profile.id}
                        className="table-row table-row-hover"
                        onClick={() => setSelectedProfile(profile)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 20px',
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          transition: 'background-color 0.2s ease',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Rank Position */}
                        <div className="col-rank" style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: 'var(--accent)',
                          fontFamily: 'var(--font-display)',
                          width: 60,
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          #{rankToDisplay}
                        </div>

                        {/* Profile Info (Avatar + Name) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingLeft: 12 }}>
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

                          {/* Name */}
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
                        </div>

                        {/* Votes Count */}
                        <div style={{
                          width: 90,
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: 14.5,
                          color: (profile.votes || 0) > 0 ? '#10b981' : (profile.votes || 0) < 0 ? '#dc2626' : 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          flexShrink: 0,
                        }}>
                          {formatVotes(profile.votes)}
                        </div>

                        {/* Rank Movement */}
                        <div style={{ width: 70, textAlign: 'right', fontSize: 14, flexShrink: 0 }}>
                          {renderMovement(profile)}
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
        )}
        {/* ── VOTING ACTION DIALOG MODAL ────────────────────────────────── */}
        {selectedProfile && (
          <div className="vote-dialog-backdrop" onClick={() => setSelectedProfile(null)}>
            <div className="vote-dialog-card" onClick={e => e.stopPropagation()}>
              <div className="vote-dialog-header">
                <h3 className="vote-dialog-title">
                  {selectedProfile.name}
                </h3>
                <button className="vote-dialog-close" onClick={() => setSelectedProfile(null)}>
                  <X size={16} />
                </button>
              </div>

              <div className="vote-dialog-buttons">
                {/* Vote button */}
                <button className="vote-dialog-btn btn-vote" onClick={() => handleOpenConfirm('vote')}>
                  <ThumbsUp size={18} strokeWidth={2.5} />
                  <span>Vote</span>
                </button>

                {/* De-vote button */}
                <button className="vote-dialog-btn btn-devote" onClick={() => handleOpenConfirm('devote')}>
                  <ThumbsDown size={18} strokeWidth={2.5} />
                  <span>De-vote</span>
                </button>

                {/* View Profile button */}
                {activeTab === 'voting' && (
                  <button 
                    className="vote-dialog-btn btn-profile" 
                    onClick={() => {
                      setShowStatsModal(selectedProfile)
                      setSelectedProfile(null)
                    }}
                  >
                    <User size={18} strokeWidth={2.5} />
                    <span>View Prof</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VOTING STATISTICS MODAL ────────────────────────────────────── */}
        {showStatsModal && (
          <div className="popup-backdrop" onClick={() => setShowStatsModal(null)}>
            <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: 0 }}>
                  {showStatsModal.name}
                </h3>
                <button
                  onClick={() => setShowStatsModal(null)}
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, marginTop: -12 }}>
                Live Community Standing & Statistics
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 8
              }}>
                {/* Card 1: Current Vote Rank */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  transition: 'transform 0.2s ease'
                }}>
                  <TrendingUp size={22} strokeWidth={2} style={{ color: 'var(--accent)', marginBottom: 10 }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                    #{showStatsModal.current_vote_rank || '—'}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    Current Rank
                  </div>
                </div>

                {/* Card 2: Current Votes */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  transition: 'transform 0.2s ease'
                }}>
                  <ThumbsUp size={22} strokeWidth={2} style={{ color: (showStatsModal.votes || 0) > 0 ? '#10b981' : (showStatsModal.votes || 0) < 0 ? '#dc2626' : 'var(--text-muted)', marginBottom: 10 }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: (showStatsModal.votes || 0) > 0 ? '#10b981' : (showStatsModal.votes || 0) < 0 ? '#dc2626' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {(showStatsModal.votes || 0) > 0 ? '+' : ''}{showStatsModal.votes || 0}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    Current Votes
                  </div>
                </div>

                {/* Card 3: Highest Vote Rank */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  transition: 'transform 0.2s ease'
                }}>
                  <Sparkles size={22} strokeWidth={2} style={{ color: '#10b981', marginBottom: 10 }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>
                    #{showStatsModal.highest_vote_rank || '—'}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    Highest Rank
                  </div>
                </div>

                {/* Card 4: Lowest Vote Rank */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  transition: 'transform 0.2s ease'
                }}>
                  <TrendingUp size={22} strokeWidth={2} style={{ color: '#f59e0b', marginBottom: 10, transform: 'rotate(180deg)' }} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>
                    #{showStatsModal.lowest_vote_rank || '—'}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    Lowest Rank
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIRMATION POPUP ────────────────────────────────────────── */}
        {showConfirmPopup && (
          <div className="popup-backdrop" onClick={() => setShowConfirmPopup(null)}>
            <div className="popup-card" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
                {showConfirmPopup === 'vote' ? `Vote for ${selectedProfile.name}?` : 'Remove Vote?'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.5 }}>
                {showConfirmPopup === 'vote' ? (
                  <>This will become your <strong>{getOrdinal((userVotes[selectedProfile.id] || 0) + 1)}</strong> vote for this profile, bringing the total from <strong>{selectedProfile.votes || 0}</strong> to <strong>{(selectedProfile.votes || 0) + 1}</strong> {Math.abs((selectedProfile.votes || 0) + 1) === 1 ? 'vote' : 'votes'}.</>
                ) : (
                  <>This will become your <strong>{getOrdinal((userDevotes[selectedProfile.id] || 0) + 1)}</strong> de-vote for this profile, bringing the total from <strong>{selectedProfile.votes || 0}</strong> to <strong>{(selectedProfile.votes || 0) - 1}</strong> {Math.abs((selectedProfile.votes || 0) - 1) === 1 ? 'vote' : 'votes'}.</>
                )}
              </p>
              
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowConfirmPopup(null)}>Cancel</button>
                <button
                  className={showConfirmPopup === 'vote' ? 'btn btn-primary' : 'btn btn-danger'}
                  onClick={handleConfirmVoteAction}
                  disabled={isSubmittingVote}
                >
                  {isSubmittingVote ? 'Processing...' : (showConfirmPopup === 'vote' ? 'Vote' : 'Remove Vote')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS ANIMATION OVERLAY ─────────────────────────────────── */}
        {showSuccessAnim && (
          <div className="success-overlay">
            <div className="success-badge" style={{
              borderColor: showSuccessAnim.type === 'vote' ? '#10b981' : '#dc2626',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              {showSuccessAnim.type === 'vote' ? (
                <ThumbsUp size={44} style={{ color: '#10b981' }} className="live-pulse" />
              ) : (
                <ThumbsUp size={44} style={{ color: '#dc2626', transform: 'rotate(180deg)' }} className="live-pulse" />
              )}
              <span style={{ fontSize: 13, fontWeight: 800, color: showSuccessAnim.type === 'vote' ? '#10b981' : '#dc2626' }}>
                {showSuccessAnim.type === 'vote' ? '+1 Vote' : '-1 Vote'}
              </span>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
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
            margin-bottom: 20px !important;
            gap: 12px !important;
            align-items: center !important;
            text-align: center !important;
          }
          .header-status-row {
            justify-content: center !important;
          }
          .live-title-h1 {
            text-align: center !important;
            font-size: clamp(22px, 5.5vw, 28px) !important;
            line-height: 1.2 !important;
            white-space: normal !important;
            width: 100% !important;
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

        /* Bottom Sheet Backdrop */
        .bottom-sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Centered Dialog Modal */
        .vote-dialog-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease forwards;
        }

        .vote-dialog-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          padding: 24px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          position: relative;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .vote-dialog-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
        }

        .vote-dialog-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 19px;
          color: var(--text);
          margin: 0;
          text-align: center;
          padding: 0 30px;
        }

        .vote-dialog-close {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vote-dialog-close:hover {
          background: var(--border);
          color: var(--text);
        }

        .vote-dialog-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          width: 100%;
        }

        .vote-dialog-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px 10px;
          border-radius: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text);
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vote-dialog-btn:hover {
          background: var(--border);
          transform: translateY(-2px);
        }

        .vote-dialog-btn:active {
          transform: scale(0.96);
          background: var(--border-bright);
        }

        .vote-dialog-btn.btn-vote {
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.2);
        }
        .vote-dialog-btn.btn-vote:hover {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.4);
        }

        .vote-dialog-btn.btn-devote {
          color: #dc2626;
          border-color: rgba(220, 38, 38, 0.2);
        }
        .vote-dialog-btn.btn-devote:hover {
          background: rgba(220, 38, 38, 0.08);
          border-color: rgba(220, 38, 38, 0.4);
        }

        .vote-dialog-btn.btn-profile {
          color: var(--accent);
          border-color: rgba(225, 48, 108, 0.2);
        }
        .vote-dialog-btn.btn-profile:hover {
          background: rgba(225, 48, 108, 0.08);
          border-color: rgba(225, 48, 108, 0.4);
        }

        /* Confirmation Popup */
        .popup-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease forwards;
        }

        .popup-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          padding: 24px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Success Animation Overlay */
        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(6px);
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease forwards;
        }

        .success-badge {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 50%;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}
