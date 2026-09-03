import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { TrendingUp, Flame, Calendar, AlertTriangle, Search, BarChart3, Film, Play, Pause, RotateCcw, FastForward, Activity, ChevronUp, ChevronDown, Pin, ThumbsUp, ThumbsDown, User, ChevronRight, X, Sparkles, Minus, CornerUpLeft, Target, Download, Video, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { safeStorage } from '../lib/storage'
import { exportTimelineVideo } from '../lib/timelineVideoExporter'

const InstagramIcon = ({ size = 24, strokeWidth = 2, style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const GrowthTimelineIcon = ({ size = 20, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
    <circle cx="6" cy="6" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="18" r="2.2" />
    <line x1="8" y1="8" x2="10" y2="10" />
    <line x1="16" y1="8" x2="14" y2="10" />
    <line x1="8" y1="16" x2="10" y2="14" />
    <line x1="16" y1="16" x2="14" y2="14" />
  </svg>
)

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  const abs = Math.abs(Number(num) || 0)
  if (abs >= 1000000000) return (abs / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (abs >= 1000000) return (abs / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1000) return (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return abs.toLocaleString('en-US')
}

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

const getProfileSlug = (profile) => {
  if (profile.instagram_handle) {
    // Replace dots with hyphens so Next.js doesn't treat them as file extensions (e.g. virat.kohli → virat-kohli)
    return profile.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
  }
  return profile.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
}

const getProfileTrend = (profile, index) => {
  if (profile.created_at) {
    const createdTime = new Date(profile.created_at).getTime()
    const diffMs = Date.now() - createdTime
    const hours = diffMs / (1000 * 60 * 60)
    if (hours >= 0 && hours < 24) {
      return { trendType: 'new', trendVal: 'NEW' }
    }
  }

  let trendType = 'stable'
  let trendVal = ''
  const hash = (index + (profile.name ? profile.name.length : 0)) % 7
  if (hash === 1 || hash === 4) {
    trendType = 'up'
    trendVal = `+${(index % 2) + 1}`
  } else if (hash === 2) {
    trendType = 'down'
    trendVal = `-${(index % 2) + 1}`
  }
  return { trendType, trendVal }
}

const RACE_BAR_COLORS = [
  '#9333ea', // Violet Purple (Vijay)
  '#0d9488', // Teal/Cyan (Rajni)
  '#d97706', // Amber Ochre (Mahesh Babu)
  '#c2410c', // Rust Bronze (Prabhas)
  '#0284c7', // Sky Cerulean (Pawan Kalyan)
  '#b45309', // Terracotta Brown (Ajith)
  '#4338ca', // Deep Indigo (Suriya)
  '#059669', // Emerald Green (Allu Arjun)
  '#047857', // Forest Jade (Jr NTR)
  '#3b82f6', // Electric Blue (Ram Charan)
  '#4b5563', // Slate Charcoal (Chiranjeevi)
  '#db2777', // Pink Magenta (Karthi)
  '#65a30d', // Olive Lime (Balakrishna)
  '#0891b2', // Deep Cyan (Yash)
  '#e11d48', // Crimson Red
  '#ea580c', // Bright Orange
  '#7c3aed', // Bright Violet
  '#16a34a', // Grass Green
  '#2563eb', // Royal Blue
  '#ca8a04', // Sun Amber
]

const TIMELINE_PALETTE = RACE_BAR_COLORS

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

export default function LivePage({ initialLiveData = null }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('most_followed') // 'most_followed' or 'voting'
  const [liveData, setLiveData] = useState(initialLiveData || { live_date: '', most_followed: [], viral_reels: [] })
  const profileCount = initialLiveData?.most_followed?.length || 'thousands of'

  // Synchronize activeTab state with the tab query parameter
  useEffect(() => {
    if (router.isReady) {
      const queryTab = router.query.tab
      if (queryTab === 'voting' || queryTab === 'most_followed') {
        setActiveTab(queryTab)
      }
    }
  }, [router.isReady, router.query.tab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchQuery('')
    setSelectedLanguage('All')
    setIsLangDropdownOpen(false)
    router.push({
      pathname: '/live',
      query: { tab }
    }, undefined, { shallow: true })
  }
  
  // Voting states
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [showConfirmPopup, setShowConfirmPopup] = useState(null)
  const [userVotes, setUserVotes] = useState({})
  const [userDevotes, setUserDevotes] = useState({})
  const [isSubmittingVote, setIsSubmittingVote] = useState(false)
  const [showSuccessAnim, setShowSuccessAnim] = useState(null)
  const [showStatsModal, setShowStatsModal] = useState(null)
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(initialLiveData ? false : true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [hoveredTab, setHoveredTab] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(100)

  // Follower Growth Progressive Timeline States (Dynamic up to Today's date)
  const [timelineMode, setTimelineMode] = useState(false)
  const [timelineDateIndex, setTimelineDateIndex] = useState(0)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [timelineSpeed, setTimelineSpeed] = useState(1)
  const [timelineZoom, setTimelineZoom] = useState(1.0)
  const [focusedProfileId, setFocusedProfileId] = useState(null)
  const [isExportingVideo, setIsExportingVideo] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatusText, setExportStatusText] = useState('')
  const [exportFormat, setExportFormat] = useState('vertical') // 'vertical' (9:16) or 'landscape' (16:9)
  const exportAbortControllerRef = useRef(null)

  const handleDownloadTimelineVideo = async () => {
    const controller = new AbortController()
    exportAbortControllerRef.current = controller
    try {
      setIsExportingVideo(true)
      setExportProgress(0)
      
      const allProfiles = liveData?.most_followed || initialLiveData?.most_followed || []
      const currentFocused = focusedProfileId 
        ? allProfiles.find(p => (p.id || p.instagram_handle || p.name) === focusedProfileId)
        : null

      setExportStatusText(currentFocused ? `Preparing timeline for ${currentFocused.name}...` : 'Preparing timeline animation frames...')
      
      await exportTimelineVideo({
        timelineDates,
        allProfiles,
        focusedProfileId,
        format: exportFormat,
        abortSignal: controller.signal,
        onProgress: (pct, msg) => {
          setExportProgress(pct)
          setExportStatusText(msg)
        }
      })
      
      setExportProgress(100)
      setExportStatusText('Video generated! Downloading now...')
      setTimeout(() => {
        setIsExportingVideo(false)
      }, 1800)
    } catch (err) {
      if (err && (err.name === 'AbortError' || err.message?.includes('cancelled'))) {
        console.log('Video export was cancelled by user.')
      } else {
        console.error('Video export error:', err)
        alert('Could not export video: ' + (err.message || 'Browser video recording error'))
      }
      setIsExportingVideo(false)
    } finally {
      exportAbortControllerRef.current = null
    }
  }

  const handleCancelExport = () => {
    if (exportAbortControllerRef.current) {
      exportAbortControllerRef.current.abort()
    }
    setIsExportingVideo(false)
    setExportProgress(0)
    setExportStatusText('')
  }

  // Dynamic Timeline Dates: Extracts actual recorded dates from database up to Today's date
  const timelineDates = useMemo(() => {
    const datesSet = new Set()
    const profiles = liveData?.most_followed || initialLiveData?.most_followed || []
    profiles.forEach(p => {
      if (Array.isArray(p.follower_history)) {
        p.follower_history.forEach(h => {
          if (h && h.date && typeof h.date === 'string' && h.date >= '2026-08-28') {
            datesSet.add(h.date)
          }
        })
      }
    })

    const todayISO = new Date().toISOString().split('T')[0]
    datesSet.add(todayISO)

    const sortedISO = Array.from(datesSet).sort()
    return sortedISO.map(iso => {
      const [y, m, d] = iso.split('-')
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      const label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      return {
        iso,
        label,
        year: y
      }
    })
  }, [liveData, initialLiveData])
  // Sync timeline query param if navigated via ?timeline=true
  useEffect(() => {
    if (router.isReady && router.query.timeline === 'true') {
      setTimelineMode(true)
      setActiveTab('most_followed')
      if (timelineDates.length > 0) {
        setTimelineDateIndex(timelineDates.length - 1)
      }
    }
  }, [router.isReady, router.query.timeline, timelineDates.length])

  // Timeline Auto-play Loop
  useEffect(() => {
    let interval = null
    if (isTimelinePlaying) {
      interval = setInterval(() => {
        setTimelineDateIndex(prev => {
          if (prev >= timelineDates.length - 1) {
            return 0
          }
          return prev + 1
        })
      }, 850 / timelineSpeed)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimelinePlaying, timelineSpeed, timelineDates.length])

  // Auto-tracking Camera: Smoothly follows the focused profile as it rises/drops during playback
  useEffect(() => {
    if (!focusedProfileId || !timelineMode) return

    const timeout = setTimeout(() => {
      const el = document.getElementById(`timeline-profile-${focusedProfileId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }
    }, 40)

    return () => clearTimeout(timeout)
  }, [timelineDateIndex, focusedProfileId, timelineMode])

  const loaderRef = useRef(null)
  const arenaScrollRef = useRef(null)

  // Infinite Scroll Observer
  useEffect(() => {
    const sentinel = loaderRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      const firstEntry = entries[0]
      if (firstEntry.isIntersecting) {
        setDisplayLimit(prev => prev + 100)
      }
    }, {
      rootMargin: '300px',
      threshold: 0.1
    })

    observer.observe(sentinel)

    return () => {
      if (sentinel && observer) {
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
    const savedRoom = safeStorage.getItem('spialr_last_language')
    if (savedRoom) {
      const validLangs = ['all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam']
      if (validLangs.includes(savedRoom.toLowerCase())) {
        const formatted = savedRoom.charAt(0).toUpperCase() + savedRoom.slice(1)
        setSelectedLanguage(formatted)
      }
    }

    // Load user vote counts from localStorage
    try {
      const votes = JSON.parse(safeStorage.getItem('spialr_votes_map', '{}'))
      const devotes = JSON.parse(safeStorage.getItem('spialr_devotes_map', '{}'))
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

    // Enforce vote-once restriction client-side (allow undos)
    const hasVoted = userVotes[selectedProfile.id] > 0
    const hasDevoted = userDevotes[selectedProfile.id] > 0
    
    if (type === 'vote' && hasVoted) {
      alert('You have already upvoted this profile.')
      setIsSubmittingVote(false)
      return
    }
    if (type === 'devote' && hasDevoted) {
      alert('You have already downvoted this profile.')
      setIsSubmittingVote(false)
      return
    }
    
    // Front-end spam click cooldown defense
    const lastAction = safeStorage.getItem('spialr_last_action_time')
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
      
      // Update local storage tracking counts (handling vote registers & undos)
      if (type === 'vote') {
        if (hasDevoted) {
          // Undo downvote
          const updatedDevotes = { ...userDevotes }
          delete updatedDevotes[selectedProfile.id]
          setUserDevotes(updatedDevotes)
          safeStorage.setItem('spialr_devotes_map', JSON.stringify(updatedDevotes))
        } else {
          // Register upvote
          const updatedVotes = { ...userVotes, [selectedProfile.id]: 1 }
          setUserVotes(updatedVotes)
          safeStorage.setItem('spialr_votes_map', JSON.stringify(updatedVotes))
        }
      } else {
        if (hasVoted) {
          // Undo upvote
          const updatedVotes = { ...userVotes }
          delete updatedVotes[selectedProfile.id]
          setUserVotes(updatedVotes)
          safeStorage.setItem('spialr_votes_map', JSON.stringify(updatedVotes))
        } else {
          // Register downvote
          const updatedDevotes = { ...userDevotes, [selectedProfile.id]: 1 }
          setUserDevotes(updatedDevotes)
          safeStorage.setItem('spialr_devotes_map', JSON.stringify(updatedDevotes))
        }
      }
      
      safeStorage.setItem('spialr_last_action_time', now.toString())
      
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
      return <span className="vote-trend-badge vote-trend-stable">—</span>
    }
    const curr = profile.current_vote_rank
    const prev = profile.previous_vote_rank
    if (!curr || !prev || curr === prev) {
      return <span className="vote-trend-badge vote-trend-stable">—</span>
    }
    if (prev > curr) {
      return (
        <span className="vote-trend-badge vote-trend-up">
          <ChevronUp className="vote-trend-icon" strokeWidth={3.5} />+{prev - curr}
        </span>
      )
    } else {
      return (
        <span className="vote-trend-badge vote-trend-down">
          <ChevronDown className="vote-trend-icon" strokeWidth={3.5} />-{curr - prev}
        </span>
      )
    }
  }

  useEffect(() => {
    if (!initialLiveData) {
      fetchLiveData()
    }

    if (!supabase) return

    const channel = supabase
      .channel('most_followed_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'most_followed'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setLiveData(prev => {
              const updatedList = (prev.most_followed || []).map(profile => {
                if (profile.id === payload.new.id) {
                  return { ...profile, ...payload.new }
                }
                return profile
              })
              return {
                ...prev,
                most_followed: updatedList
              }
            })
          } else if (payload.eventType === 'INSERT') {
            setLiveData(prev => {
              if ((prev.most_followed || []).some(p => p.id === payload.new.id)) return prev
              return {
                ...prev,
                most_followed: [...(prev.most_followed || []), payload.new]
              }
            })
          } else if (payload.eventType === 'DELETE') {
            setLiveData(prev => ({
              ...prev,
              most_followed: (prev.most_followed || []).filter(p => p.id !== payload.old.id)
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <>
      <Head>
        <title>Instagram Followers Count Live Tracker & Top Profiles Leaderboard | Spialr</title>
        <meta
          name="description"
          content={`Track real-time Instagram followers count, live 31-day progressive growth timeline, and daily follower gains for top ${profileCount}+ creators, actors, gamers, and influencers on Spialr.`}
        />
        <meta
          name="keywords"
          content="instagram followers, instagram followers count, live instagram follower count, instagram follower tracker, top 100 instagram accounts, most followed instagram accounts, creator growth timeline, instagram stats live, spialr"
        />
        <link rel="canonical" href="https://spialr.com/live" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Social Sharing SEO */}
        <meta property="og:title" content="Instagram Followers Count Live Tracker & Top Profiles Leaderboard | Spialr" />
        <meta property="og:description" content={`Track real-time Instagram follower counts for ${profileCount}+ top accounts. View 31-day daily gain charts, ranking races, and creator analytics on Spialr.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spialr.com/live" />
        <meta property="og:site_name" content="Spialr" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Instagram Followers Count Live Tracker | Spialr" />
        <meta name="twitter:description" content="Live real-time follower counter, 31-day progressive growth timeline, and rankings across top Instagram creators." />
        
        {/* Schema Markup for Google Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Most Followed Instagram Accounts Live Leaderboard",
              "description": "Live rankings and follower counts of the top Instagram profiles globally.",
              "itemListElement": (liveData?.most_followed || []).slice(0, 25).map((profile, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "name": profile.name,
                "url": `https://spialr.com/profile/${profile.instagram_handle ? profile.instagram_handle.toLowerCase().trim().replace(/\./g, '-') : profile.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`,
                "description": `${profile.category?.split(':')[1] || 'Creator'} with ${(profile.followers_text || 'millions of').toUpperCase()} followers.`
              }))
            })
          }}
        />
      </Head>

      
      <main className="main-container" style={{ maxWidth: 850, margin: '0 auto', padding: '16px 20px 80px' }}>
        {/* Header section with live pulse indicator and manual date */}
        <div className="fade-in header-section" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 16,
          alignItems: 'center',
          textAlign: 'center',
        }}>
          {/* Live Status + Date Row */}
          <div className="header-status-row" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
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
             textAlign: 'center',
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
               textAlign: 'center',
             }}>
               Compare, upvote to support, or downvote to drag. Let the fan wars begin!
             </p>
           )}
          </div>
 
          {/* Unified Navigation Row: Tabs (Left) & Language Dropdown (Right) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 16,
            position: 'relative',
            zIndex: 10
          }}>
            {/* Subtabs Selection */}
            <div className="fade-in subtabs-container" style={{
              display: 'flex',
              background: 'var(--surface2)',
              borderRadius: '100px',
              padding: 3,
              gap: 4,
              border: '1px solid var(--border)',
              maxWidth: 350,
              flex: '1 1 auto'
            }}>
              <button
                onClick={() => handleTabChange('most_followed')}
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
                  cursor: 'pointer',
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
                onClick={() => handleTabChange('voting')}
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
                  cursor: 'pointer',
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

            {/* Language Filter Dropdown (hidden in timelineMode) */}
            {activeTab === 'most_followed' && !timelineMode && !loading && !error && liveData && liveData.most_followed && liveData.most_followed.length > 0 && (
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
                              safeStorage.setItem('spialr_last_language', lang.toLowerCase());
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
            )}
          </div>

        {/* Main Content Area */}
        {loading && !initialLiveData ? (
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

            {/* Helpful navigation tip placed cleanly above search bar */}
            {!timelineMode && liveData.most_followed.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2px 4px 4px',
                fontSize: 'clamp(11px, 3.1vw, 13px)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Click any profile for detailed analytics & daily growth
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
                  placeholder="Search profiles by name or Instagram handle..."
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

            {/* Category Filter (hidden in timelineMode) */}
            {!timelineMode && liveData.most_followed.length > 0 && (() => {
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
              // In Timeline Mode, show all profiles without category/language filters
              const baseList = timelineMode 
                ? (liveData.most_followed || [])
                : (liveData.most_followed || []).filter(p => {
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

              // Assign rankings
              const rankedList = baseList.map((p, idx) => ({
                ...p,
                categoryRank: idx + 1
              }))

              // Filter by search query for display
              const filtered = rankedList.filter(p => {
                const query = searchQuery.toLowerCase();
                return p.name?.toLowerCase().includes(query) ||
                       p.instagram_handle?.toLowerCase().includes(query);
              })

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No profiles match the filter criteria
                  </div>
                )
              }

              if (timelineMode) {
                const activeTimelineItem = timelineDates[timelineDateIndex] || timelineDates[timelineDates.length - 1] || { iso: '2026-08-29', label: '29 Aug', year: '2026' }
                const activeDateISO = activeTimelineItem.iso
                const activeDateStr = activeTimelineItem.label
                const startDateStr = timelineDates[0]?.label || '29 Aug'
                const endDateStr = timelineDates[timelineDates.length - 1]?.label || '29 Aug'

                // Compute profile ranks and follower counts for the active timeline date
                const timelineProfiles = filtered.map(p => {
                  let count = p.followers_count || 0
                  let prevCount = null
                  let isServerFailed = false
                  let diffDays = 1

                  if (Array.isArray(p.follower_history) && p.follower_history.length > 0) {
                    const sortedHistory = [...p.follower_history].sort((a, b) => new Date(a.date) - new Date(b.date))
                    const exactEntry = sortedHistory.find(h => h.date === activeDateISO)
                    
                    if (exactEntry && (exactEntry.status === 'Server Failed' || exactEntry.serverFailed || exactEntry.count === null)) {
                      isServerFailed = true
                      count = null
                    } else if (exactEntry) {
                      count = exactEntry.count
                    } else {
                      const prior = sortedHistory.filter(h => h.date <= activeDateISO && h.count !== null && h.status !== 'Server Failed')
                      if (prior.length > 0) {
                        count = prior[prior.length - 1].count
                      }
                    }

                    const currentIdx = sortedHistory.findIndex(h => h.date === activeDateISO)
                    if (currentIdx > 0 && count !== null) {
                      for (let j = currentIdx - 1; j >= 0; j--) {
                        if (sortedHistory[j].count !== null && sortedHistory[j].status !== 'Server Failed') {
                          prevCount = sortedHistory[j].count
                          const dCur = new Date(activeDateISO)
                          const dPrev = new Date(sortedHistory[j].date)
                          diffDays = Math.max(1, Math.round(Math.abs(dCur - dPrev) / (1000 * 60 * 60 * 24)))
                          break
                        }
                      }
                    }
                  }

                  const dailyDelta = (prevCount !== null && count !== null) ? (count - prevCount) : null

                  return {
                    ...p,
                    countOnDate: count,
                    dailyDelta,
                    isServerFailed,
                    diffDays
                  }
                }).sort((a, b) => (b.countOnDate || 0) - (a.countOnDate || 0))

                const maxFollowersOnDate = timelineProfiles.length > 0 ? (timelineProfiles[0].countOnDate || 1) : 1
                const focusedProfile = focusedProfileId 
                  ? timelineProfiles.find(p => (p.id || p.instagram_handle || p.name) === focusedProfileId) 
                  : null
                const focusedProfileRank = focusedProfile 
                  ? timelineProfiles.findIndex(p => (p.id || p.instagram_handle || p.name) === focusedProfileId) + 1 
                  : null

                return (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* WHITE RACE CANVAS (Matching User Reference Image) */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: 24,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                      padding: '32px 24px 44px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Top Header of Race Canvas */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 16,
                        marginBottom: 26,
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: 18
                      }}>
                        <div>
                          <div style={{
                            fontSize: 20,
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            color: '#0f172a',
                            fontFamily: 'var(--font-display)',
                            textTransform: 'uppercase',
                            lineHeight: 1.2
                          }}>
                            TOP INSTAGRAM PROFILES GROWTH TIMELINE
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>Linear Follower Momentum · {startDateStr} to {endDateStr}</span>
                            <span style={{
                              color: focusedProfile ? '#4f46e5' : '#7c3aed',
                              background: focusedProfile ? 'rgba(99, 102, 241, 0.12)' : 'rgba(124, 58, 237, 0.08)',
                              padding: '2px 10px',
                              borderRadius: 100,
                              fontSize: 11.5,
                              fontWeight: 800
                            }}>
                              {focusedProfile ? `🎯 Follow Cam: ${focusedProfile.name} (#${focusedProfileRank})` : '💡 Click any profile to focus & follow!'}
                            </span>
                          </div>
                        </div>

                        {/* Top Action Controls: Download Video & Canvas Zoom */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {/* 🎥 Download Timeline Video Button */}
                          <button
                            onClick={handleDownloadTimelineVideo}
                            disabled={isExportingVideo}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 14px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: isExportingVideo ? 'not-allowed' : 'pointer',
                              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                              transition: 'all 0.2s ease',
                              opacity: isExportingVideo ? 0.7 : 1
                            }}
                            title="Download shareable video of this timeline with Spialr.com watermark"
                          >
                            {isExportingVideo ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                            <span>{isExportingVideo ? 'Generating...' : 'Download Timeline Video'}</span>
                          </button>

                          {/* Canvas Zoom Controls (Allows unconstrained zooming in and out) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: 12, fontWeight: 750, color: '#64748b' }}>Zoom Canvas:</span>
                            <button
                              onClick={() => setTimelineZoom(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#334155',
                                fontSize: 14,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Zoom Out"
                            >
                              −
                            </button>
                            <button
                              onClick={() => setTimelineZoom(1.0)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background: timelineZoom === 1.0 ? '#6366f1' : '#ffffff',
                                color: timelineZoom === 1.0 ? '#ffffff' : '#334155',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="Reset Zoom to 100%"
                            >
                              {Math.round(timelineZoom * 100)}%
                            </button>
                            <button
                              onClick={() => setTimelineZoom(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))))}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#334155',
                                fontSize: 14,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Zoom In (Expand Canvas Width)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Scrollable Horizontal Arena */}
                      <div ref={arenaScrollRef} style={{ overflowX: 'auto', paddingBottom: 24, WebkitOverflowScrolling: 'touch' }}>
                        <div style={{
                          minWidth: `${Math.round(2200 * timelineZoom)}px`,
                          width: `${Math.round(100 * timelineZoom)}%`,
                          position: 'relative',
                          transition: 'width 0.2s ease, min-width 0.2s ease'
                        }}>
                          {/* Top Milestone Axis & Vertical Grid Lines */}
                          {(() => {
                            const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(r => Math.round(maxFollowersOnDate * r))

                            return (
                              <div style={{ position: 'relative', marginLeft: 220, marginRight: 220, height: 26, marginBottom: 14 }}>
                                {ticks.map((t, i) => {
                                  const leftPct = (t / maxFollowersOnDate) * 100
                                  return (
                                    <div key={i} style={{ position: 'absolute', left: `${leftPct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
                                      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', fontFamily: 'monospace' }}>
                                        {t >= 1000000 ? `${(t / 1000000).toFixed(0)}M` : t >= 1000 ? `${(t / 1000).toFixed(0)}K` : t}
                                      </div>
                                      {/* Vertical dashed grid line spanning down entire list */}
                                      <div style={{
                                        position: 'absolute',
                                        top: 22,
                                        left: '50%',
                                        width: 1,
                                        height: `${timelineProfiles.length * 42 + 20}px`,
                                        borderLeft: '1px dashed #f1f5f9',
                                        pointerEvents: 'none',
                                        zIndex: 1
                                      }} />
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}

                          {/* Profile Bar Rows (Linear Proportions + Avatars at Bar Tip) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 2 }}>
                            {timelineProfiles.map((profile, index) => {
                              const profileKey = profile.id || profile.instagram_handle || profile.name
                              const isFocused = focusedProfileId === profileKey
                              const count = profile.countOnDate || 0
                              // Exact linear scale percentage relative to max with solid minimum visual baseline
                              const barPct = Math.max(2.5, (count / maxFollowersOnDate) * 100)
                              const barColor = RACE_BAR_COLORS[index % RACE_BAR_COLORS.length]
                              const delta = profile.dailyDelta
                              const rank = index + 1

                              return (
                                <div
                                  id={`timeline-profile-${profileKey}`}
                                  key={profileKey}
                                  onClick={() => {
                                    setFocusedProfileId(isFocused ? null : profileKey)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: isFocused ? 38 : 34,
                                    cursor: 'pointer',
                                    borderRadius: 8,
                                    padding: '0 6px',
                                    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                    background: isFocused 
                                      ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(244, 63, 94, 0.08) 100%)' 
                                      : 'transparent',
                                    boxShadow: isFocused ? '0 0 0 2px #6366f1, 0 6px 20px rgba(99, 102, 241, 0.25)' : 'none',
                                    opacity: focusedProfileId && !isFocused ? 0.75 : 1,
                                    position: 'relative',
                                    zIndex: isFocused ? 10 : 2
                                  }}
                                  onMouseEnter={e => {
                                    if (!isFocused) e.currentTarget.style.background = 'rgba(241,245,249,0.7)'
                                  }}
                                  onMouseLeave={e => {
                                    if (!isFocused) e.currentTarget.style.background = 'transparent'
                                  }}
                                >
                                  {/* Left Corner Ranking Position Badge in Sleek Black */}
                                  <div style={{
                                    width: 36,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 6
                                  }}>
                                    <span style={{
                                      fontSize: rank <= 3 ? 11.5 : 10.5,
                                      fontWeight: 900,
                                      color: '#ffffff',
                                      background: rank === 1 ? '#000000' : rank === 2 ? '#111827' : rank === 3 ? '#1f2937' : '#0f172a',
                                      border: rank === 1 ? '1px solid #eab308' : rank === 2 ? '1px solid #94a3b8' : rank === 3 ? '1px solid #b45309' : '1px solid rgba(0,0,0,0.3)',
                                      padding: '2px 6px',
                                      borderRadius: 6,
                                      minWidth: 28,
                                      textAlign: 'center',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
                                      fontFamily: 'var(--font-display)',
                                      letterSpacing: '-0.02em'
                                    }}>
                                      {rank}
                                    </span>
                                  </div>

                                  {/* Creator Name & Focus Indicator */}
                                  <div style={{
                                    width: 175,
                                    flexShrink: 0,
                                    textAlign: 'right',
                                    paddingRight: 14,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 6
                                  }}>
                                    {isFocused && (
                                      <span style={{
                                        fontSize: 10,
                                        fontWeight: 900,
                                        color: '#ffffff',
                                        background: 'linear-gradient(135deg, #6366f1, #d946ef)',
                                        padding: '2px 6px',
                                        borderRadius: 6,
                                        letterSpacing: '0.04em',
                                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
                                        flexShrink: 0,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                      }}>
                                        <Target size={10} color="#ffffff" />
                                        <span>FOCUS</span>
                                      </span>
                                    )}
                                    <span style={{
                                      fontSize: 12,
                                      fontWeight: isFocused ? 950 : 900,
                                      color: isFocused ? '#4f46e5' : '#1e293b',
                                      letterSpacing: '0.02em',
                                      textTransform: 'uppercase',
                                      fontFamily: 'var(--font-display)'
                                    }}>
                                      {profile.name}
                                    </span>
                                  </div>

                                  {/* Center: The Colored Bar Track */}
                                  <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center', marginRight: 200 }}>
                                    <div
                                      style={{
                                        width: `${barPct}%`,
                                        minWidth: 48,
                                        height: isFocused ? 28 : 24,
                                        background: barColor,
                                        borderRadius: 4,
                                        position: 'relative',
                                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease',
                                        boxShadow: isFocused ? `0 0 16px ${barColor}88, 0 2px 8px rgba(0,0,0,0.15)` : '0 2px 6px rgba(0,0,0,0.08)'
                                      }}
                                    >
                                      {/* Circular Avatar overlapping the right tip of the bar */}
                                      <div style={{
                                        position: 'absolute',
                                        right: isFocused ? -18 : -16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: isFocused ? 36 : 32,
                                        height: isFocused ? 36 : 32,
                                        borderRadius: '50%',
                                        border: isFocused ? '3px solid #6366f1' : '2.5px solid #ffffff',
                                        boxShadow: isFocused ? '0 0 14px rgba(99, 102, 241, 0.6)' : '0 2px 8px rgba(0,0,0,0.18)',
                                        overflow: 'hidden',
                                        background: '#f8fafc',
                                        zIndex: 5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                      }}>
                                        {profile.photo_url ? (
                                          <img src={profile.photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                                        ) : (
                                          <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>{profile.name?.charAt(0)}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Number count & Delta Badge directly beside avatar */}
                                    <div style={{
                                      position: 'absolute',
                                      left: `max(calc(${barPct}% + ${isFocused ? 26 : 24}px), 76px)`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      whiteSpace: 'nowrap',
                                      transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                      zIndex: 4
                                    }}>
                                      {profile.isServerFailed ? (
                                        <span style={{
                                          fontSize: 11,
                                          fontWeight: 800,
                                          color: '#f87171',
                                          background: 'rgba(239, 68, 68, 0.12)',
                                          border: '1px solid rgba(239, 68, 68, 0.35)',
                                          padding: '2px 7px',
                                          borderRadius: 6
                                        }}>
                                          Server Failed
                                        </span>
                                      ) : (
                                        <>
                                          <span style={{
                                            fontSize: isFocused ? 14 : 13,
                                            fontWeight: isFocused ? 950 : 850,
                                            color: isFocused ? '#1e1b4b' : '#334155',
                                            fontFamily: 'monospace',
                                            letterSpacing: '-0.02em'
                                          }}>
                                            {(count || 0).toLocaleString('en-US')}
                                          </span>

                                          {delta !== null && delta !== 0 && (
                                            <span style={{
                                              fontSize: 10.5,
                                              fontWeight: 800,
                                              color: delta > 0 ? '#16a34a' : '#dc2626',
                                              fontFamily: 'var(--font-display)'
                                            }}>
                                              ({delta > 0 ? `+${formatNumber(delta)}` : `-${formatNumber(Math.abs(delta))}`})
                                            </span>
                                          )}

                                          {profile.diffDays > 1 && (
                                            <span style={{
                                              fontSize: 9.5,
                                              fontWeight: 800,
                                              color: '#d97706',
                                              background: 'rgba(245, 158, 11, 0.14)',
                                              border: '1px solid rgba(245, 158, 11, 0.3)',
                                              padding: '1px 5px',
                                              borderRadius: 4
                                            }}>
                                              ({profile.diffDays} day follower count)
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Giant Year / Date Watermark on Bottom Right (Matches Reference Image) */}
                          <div style={{
                            position: 'absolute',
                            right: 24,
                            bottom: 16,
                            textAlign: 'right',
                            pointerEvents: 'none',
                            zIndex: 1
                          }}>
                            <div style={{
                              fontSize: 64,
                              fontWeight: 950,
                              color: '#e2e8f0',
                              lineHeight: 1,
                              fontFamily: 'var(--font-display)',
                              letterSpacing: '-0.04em'
                            }}>
                              {activeTimelineItem.year || '2026'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 850, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                              {activeDateStr}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SLEEK COMPACT FLOATING TIMELINE CONTROLLER DOCK */}
                    <div
                      onWheel={(e) => {
                        e.preventDefault()
                        setTimelineDateIndex(prev => e.deltaY > 0 ? Math.max(0, prev - 1) : Math.min(timelineDates.length - 1, prev + 1))
                      }}
                      style={{
                        position: 'sticky',
                        bottom: 16,
                        zIndex: 90,
                        margin: '0 auto',
                        maxWidth: 620,
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.88)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 20,
                        padding: '10px 14px 12px',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      {/* Compact Top Action Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        {/* Left: Jump to Start & Current Active Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => {
                              setIsTimelinePlaying(false)
                              setTimelineDateIndex(0)
                            }}
                            title={`Jump to ${startDateStr}`}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              background: timelineDateIndex === 0 ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                              color: timelineDateIndex === 0 ? '#a5b4fc' : '#e2e8f0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <RotateCcw size={12} />
                          </button>

                          <div style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#f8fafc',
                            fontFamily: 'monospace',
                            letterSpacing: '-0.01em',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '3px 8px',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            {activeDateStr}
                          </div>
                        </div>

                        {/* Center: Sleek Play / Pause Pill */}
                        <button
                          onClick={() => setIsTimelinePlaying(!isTimelinePlaying)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: 100,
                            border: 'none',
                            background: isTimelinePlaying 
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: isTimelinePlaying 
                              ? '0 4px 14px rgba(239, 68, 68, 0.4)' 
                              : '0 4px 14px rgba(99, 102, 241, 0.4)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isTimelinePlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                          <span>{isTimelinePlaying ? 'Pause' : 'Play'}</span>
                        </button>

                        {/* Right: Speed Controls & Close Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* Speed Selector */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '2px',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            {[1, 2, 4].map(s => (
                              <button
                                key={s}
                                onClick={() => setTimelineSpeed(s)}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  border: 'none',
                                  background: timelineSpeed === s ? '#6366f1' : 'transparent',
                                  color: timelineSpeed === s ? '#ffffff' : '#94a3b8',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>

                          {/* Download Video Pill in Dock */}
                          <button
                            onClick={handleDownloadTimelineVideo}
                            disabled={isExportingVideo}
                            title="Download Timeline Video with Spialr.com Watermark"
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              background: 'rgba(99, 102, 241, 0.25)',
                              color: '#a5b4fc',
                              cursor: isExportingVideo ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isExportingVideo ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />}
                          </button>

                          {/* Close Timeline */}
                          <button
                            onClick={() => setTimelineMode(false)}
                            title="Exit Growth Timeline"
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Focused Profile Live Camera Status Banner */}
                      {focusedProfile && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(99, 102, 241, 0.22)',
                          border: '1px solid rgba(99, 102, 241, 0.45)',
                          borderRadius: 12,
                          padding: '4px 10px',
                          fontSize: 11,
                          color: '#e0e7ff',
                          gap: 6
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                            <Target size={13} color="#a5b4fc" style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Follow Cam: <strong style={{ color: '#ffffff' }}>{focusedProfile.name}</strong> (Rank #{focusedProfileRank})
                            </span>
                            {isTimelinePlaying && (
                              <span style={{
                                fontSize: 9.5,
                                fontWeight: 900,
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.25)',
                                padding: '1px 6px',
                                borderRadius: 6,
                                letterSpacing: '0.04em',
                                flexShrink: 0
                              }}>
                                ● LIVE TRACKING
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFocusedProfileId(null)
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#cbd5e1',
                              fontSize: 10.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              padding: '2px 4px',
                              flexShrink: 0
                            }}
                          >
                            ✕ Clear Focus
                          </button>
                        </div>
                      )}

                      {/* Embedded Seek Scrubber Track */}
                      <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(1, timelineDates.length - 1)}
                          step={1}
                          value={Math.min(timelineDateIndex, Math.max(0, timelineDates.length - 1))}
                          onChange={e => {
                            setIsTimelinePlaying(false)
                            setTimelineDateIndex(parseInt(e.target.value, 10))
                          }}
                          style={{
                            width: '100%',
                            height: 4,
                            borderRadius: 2,
                            accentColor: '#818cf8',
                            cursor: 'pointer',
                            margin: '2px 0'
                          }}
                        />

                        {/* Quick Dynamic Date Chips */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#94a3b8',
                          fontFamily: 'monospace'
                        }}>
                          {timelineDates.map((item, idx) => {
                            const isSelected = (timelineDates[timelineDateIndex]?.iso || '') === item.iso
                            return (
                              <span
                                key={item.iso}
                                onClick={() => {
                                  setIsTimelinePlaying(false)
                                  setTimelineDateIndex(idx)
                                }}
                                style={{
                                  cursor: 'pointer',
                                  color: isSelected ? '#a5b4fc' : '#64748b',
                                  fontWeight: isSelected ? 900 : 600,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {item.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Video Export Progress Modal */}
                    {isExportingVideo && (
                      <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                      }}>
                        <div style={{
                          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.99) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          borderRadius: 24,
                          padding: '32px 24px 26px',
                          maxWidth: 440,
                          width: '100%',
                          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
                          textAlign: 'center',
                          color: '#ffffff',
                          position: 'relative'
                        }}>
                          {/* Close X Button */}
                          <button
                            onClick={handleCancelExport}
                            aria-label="Cancel Video Export"
                            style={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                              e.currentTarget.style.color = '#ef4444'
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                              e.currentTarget.style.color = '#94a3b8'
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                            }}
                          >
                            <X size={16} />
                          </button>

                          <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 18,
                            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)'
                          }}>
                            <Video size={28} color="#ffffff" />
                          </div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, margin: '0 0 6px', color: '#ffffff' }}>
                            {focusedProfile ? `Generating Timeline of ${focusedProfile.name}` : 'Generating Timeline Video'}
                          </h3>
                          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.5 }}>
                            {focusedProfile 
                              ? `Creating smooth growth timeline video for ${focusedProfile.name}...` 
                              : 'Creating smooth growth timeline video for top creators...'}
                          </p>

                          {/* Progress Bar */}
                          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 100, height: 8, overflow: 'hidden', marginBottom: 12, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{
                              height: '100%',
                              width: `${exportProgress}%`,
                              background: 'linear-gradient(90deg, #6366f1, #d946ef, #34d399)',
                              transition: 'width 0.15s ease',
                              borderRadius: 100
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>
                            <span>{exportStatusText || 'Rendering frames...'}</span>
                            <span style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>{exportProgress}%</span>
                          </div>

                          {/* Action Cancel Button */}
                          <button
                            onClick={handleCancelExport}
                            style={{
                              marginTop: 22,
                              width: '100%',
                              padding: '11px 16px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: 12,
                              color: '#cbd5e1',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                              e.currentTarget.style.color = '#fca5a5'
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                              e.currentTarget.style.color = '#cbd5e1'
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                            }}
                          >
                            <X size={15} />
                            <span>Cancel Generation</span>
                          </button>
                        </div>
                      </div>
                    )}
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
                      <Fragment key={profile.id}>
                        <div
                          key={profile.id}
                          className="table-row table-row-hover"
                          onClick={() => router.push(`/profile/${getProfileSlug(profile)}`)}
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
                        {/* Rank Position & Trend Badge */}
                        <div className="col-rank" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: 60,
                          flexShrink: 0,
                          alignSelf: 'center',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: 17,
                            fontWeight: 750,
                            color: 'var(--text)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.02em',
                            lineHeight: 1
                          }}>
                            #{rankToDisplay}
                          </div>
                          
                          {(() => {
                            const { trendType, trendVal } = getProfileTrend(profile, index)
                            return (
                              <div style={{
                                marginTop: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {trendType === 'up' && (
                                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: 13, color: '#00c853', lineHeight: 1 }}>
                                    <ChevronUp size={12} strokeWidth={3} /> {trendVal}
                                  </span>
                                )}
                                {trendType === 'down' && (
                                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: 13, color: '#ff1744', lineHeight: 1 }}>
                                    <ChevronDown size={12} strokeWidth={3} /> {trendVal}
                                  </span>
                                )}
                                {trendType === 'new' && (
                                  <span style={{
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                                    padding: '2px 4px',
                                    borderRadius: 3,
                                    lineHeight: 1,
                                    letterSpacing: '0.02em'
                                  }}>
                                    NEW
                                  </span>
                                )}
                                {trendType === 'stable' && (
                                  <Minus size={11} strokeWidth={3} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                )}
                              </div>
                            )
                          })()}
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
                          {profile.followers_text?.trim() ? profile.followers_text.trim().toUpperCase() : (profile.followers_count >= 1000000 ? `${(Math.floor(profile.followers_count / 100000) / 10).toString().replace(/\.0$/, '')}M` : (profile.followers_count >= 1000 ? `${(Math.floor(profile.followers_count / 100) / 10).toString().replace(/\.0$/, '')}K` : profile.followers_count || '—'))}
                        </div>
                      </div>
                    </Fragment>
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
                  placeholder="Search profiles by name or Instagram handle..."
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
                const query = searchQuery.toLowerCase();
                return p.name?.toLowerCase().includes(query) ||
                       p.instagram_handle?.toLowerCase().includes(query);
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
                      <Fragment key={profile.id}>
                        <div
                          key={profile.id}
                          className="table-row table-row-hover"
                          onClick={() => router.push(`/profile/${getProfileSlug(profile)}`)}
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
                          fontSize: 17,
                          fontWeight: 750,
                          color: 'var(--text)',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.02em',
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
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                        </div>

                        {/* Votes Count (Voting Number) */}
                        <div style={{
                          width: 80,
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: 14.5,
                          color: (profile.votes || 0) > 0 ? '#10b981' : (profile.votes || 0) < 0 ? '#dc2626' : 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          flexShrink: 0,
                        }}>
                          {formatVotes(profile.votes)}
                        </div>

                        {/* Indicator (Rank Movement) */}
                        <div style={{
                          width: 70,
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          flexShrink: 0,
                          paddingLeft: 10
                        }}>
                          {renderMovement(profile)}
                        </div>

                      </div>
                    </Fragment>
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
                {userVotes[selectedProfile.id] > 0 ? (
                  <>
                    <button className="vote-dialog-btn btn-vote" style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', cursor: 'default' }} disabled>
                      <ThumbsUp size={18} fill="#2e7d32" strokeWidth={2.5} />
                      <span>Upvoted</span>
                    </button>
                    <button className="vote-dialog-btn btn-devote" onClick={() => handleOpenConfirm('devote')}>
                      <CornerUpLeft size={18} strokeWidth={2.5} />
                      <span>Undo Vote</span>
                    </button>
                  </>
                ) : userDevotes[selectedProfile.id] > 0 ? (
                  <>
                    <button className="vote-dialog-btn btn-vote" onClick={() => handleOpenConfirm('vote')}>
                      <CornerUpLeft size={18} strokeWidth={2.5} />
                      <span>Undo Vote</span>
                    </button>
                    <button className="vote-dialog-btn btn-devote" style={{ background: '#ffebee', border: '1px solid #ef9a9a', color: '#c62828', cursor: 'default' }} disabled>
                      <ThumbsDown size={18} fill="#c62828" strokeWidth={2.5} />
                      <span>Downvoted</span>
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                {/* View Analytics or View Stats button */}
                {activeTab === 'voting' ? (
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
                ) : (
                  selectedProfile.celebritySlug && (
                    <button 
                      className="vote-dialog-btn btn-profile" 
                      onClick={() => {
                        router.push(`/celebrity/${selectedProfile.celebritySlug}`)
                        setSelectedProfile(null)
                      }}
                    >
                      <BarChart3 size={18} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
                      <span>Analytics</span>
                    </button>
                  )
                )}

                {/* Instagram button */}
                {selectedProfile.instagram_handle && (
                  <a 
                    href={`https://instagram.com/${selectedProfile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vote-dialog-btn btn-instagram"
                    onClick={() => setSelectedProfile(null)}
                  >
                    <InstagramIcon size={18} strokeWidth={2.5} />
                    <span>Instagram</span>
                  </a>
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
                  <>This will register your vote for this profile, bringing the total from <strong>{selectedProfile.votes || 0}</strong> to <strong>{(selectedProfile.votes || 0) + 1}</strong> {Math.abs((selectedProfile.votes || 0) + 1) === 1 ? 'vote' : 'votes'}.</>
                ) : (
                  <>This will register your de-vote for this profile, bringing the total from <strong>{selectedProfile.votes || 0}</strong> to <strong>{(selectedProfile.votes || 0) - 1}</strong> {Math.abs((selectedProfile.votes || 0) - 1) === 1 ? 'vote' : 'votes'}.</>
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

        {/* ── FLOATING 31 GROWTH TIMELINE ACTION BUTTON (ICON-ONLY AS IN USER SKETCH) ── */}
        {activeTab === 'most_followed' && !timelineMode && (
          <div
            style={{
              position: 'fixed',
              bottom: 84,
              right: 20,
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => setTimelineMode(!timelineMode)}
              className="timeline-floating-fab"
              title={timelineMode ? 'Close Timeline & return to normal list' : 'Open 31 Growth Timeline'}
              style={{
                width: 50,
                height: 50,
                padding: 0,
                borderRadius: 16,
                border: 'none',
                background: timelineMode
                  ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: timelineMode
                  ? '0 8px 30px rgba(49, 46, 129, 0.5), 0 0 0 2px rgba(99, 102, 241, 0.5)'
                  : '0 8px 30px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.25) inset',
                transform: 'translateY(0)',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                userSelect: 'none',
              }}
            >
              {timelineMode ? (
                <X size={22} color="#ffffff" strokeWidth={2.5} />
              ) : (
                <GrowthTimelineIcon size={24} color="#ffffff" />
              )}
            </button>
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

        .timeline-floating-fab:hover {
          transform: translateY(-3px) scale(1.03) !important;
          box-shadow: 0 12px 36px rgba(99, 102, 241, 0.6) !important;
        }

        .timeline-floating-fab:active {
          transform: translateY(0px) scale(0.96) !important;
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
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          width: 100%;
        }

        .vote-dialog-btn {
          flex: 1;
          min-width: 80px;
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

        .vote-dialog-btn.btn-instagram {
          color: #bc1888;
          border-color: rgba(188, 24, 136, 0.2);
          text-decoration: none;
        }
        .vote-dialog-btn.btn-instagram:hover {
          background: rgba(188, 24, 136, 0.08);
          border-color: rgba(188, 24, 136, 0.4);
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

        .vote-trend-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vote-trend-badge {
          display: flex;
          align-items: center;
          font-weight: 800;
          line-height: 1;
        }
        .vote-trend-up {
          font-size: 14px;
          color: #10b981;
        }
        .vote-trend-down {
          font-size: 14px;
          color: #dc2626;
        }
        .vote-trend-stable {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 800;
        }
        .vote-trend-icon {
          width: 14px;
          height: 14px;
        }

        @media (max-width: 580px) {
          .vote-trend-up, .vote-trend-down {
            font-size: 12px !important;
          }
          .vote-trend-stable {
            font-size: 10px !important;
          }
          .vote-trend-icon {
            width: 12px !important;
            height: 12px !important;
          }
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

export async function getServerSideProps() {
  try {
    const [
      settingsResult, 
      profilesResult1, 
      profilesResult2, 
      profilesResult3, 
      profilesResult4,
      profilesResult5,
      reelsResult
    ] = await Promise.all([
      supabase.from('live_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(0, 999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(1000, 1999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(2000, 2999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(3000, 3999),
      supabase.from('most_followed').select('*').order('followers_count', { ascending: false }).range(4000, 4999),
      supabase.from('viral_reels').select('*')
    ])

    if (settingsResult.error) throw settingsResult.error
    if (profilesResult1.error) throw profilesResult1.error
    if (profilesResult2.error) throw profilesResult2.error
    if (profilesResult3.error) throw profilesResult3.error
    if (profilesResult4.error) throw profilesResult4.error
    if (profilesResult5.error) throw profilesResult5.error
    if (reelsResult.error) throw reelsResult.error

    const settingsData = settingsResult.data
    const reelsData = reelsResult.data

    // Combine profiles page ranges
    const profilesData = (profilesResult1.data || [])
      .concat(profilesResult2.data || [])
      .concat(profilesResult3.data || [])
      .concat(profilesResult4.data || [])
      .concat(profilesResult5.data || [])

    const sortedReels = (reelsData || []).sort((a, b) => {
      const rankA = a.order_index || 999999
      const rankB = b.order_index || 999999
      if (rankA !== rankB) return rankA - rankB
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    return {
      props: {
        initialLiveData: {
          live_date: settingsData?.live_date || currentDate,
          most_followed: profilesData || [],
          viral_reels: sortedReels || []
        }
      }
    }
  } catch (err) {
    console.error('Live getServerSideProps error:', err)
    return {
      props: {
        initialLiveData: null
      }
    }
  }
}
