import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowLeft, Cookie, Terminal, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react'

const TOKEN_KEY = 'is_admin_token'
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)

export default function ScrapeConsole() {
  const router = useRouter()
  const { id: celebrityId, handle } = router.query

  const [isAdmin, setIsAdmin] = useState(false)
  const [celebrity, setCelebrity] = useState(null)
  
  // Credentials
  const [sessionId, setSessionId] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  
  // Scraper State
  const [scraping, setScraping] = useState(false)
  const [runIndex, setRunIndex] = useState(1)
  const [segmentProgress, setSegmentProgress] = useState(0) // 0 to 200
  const [totalPosts, setTotalPosts] = useState(0)
  
  // Segment Tracker State
  const [hasPending, setHasPending] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [hasIncremental, setHasIncremental] = useState(false)
  const [isFullyCompleted, setIsFullyCompleted] = useState(false)
  const [showFinishedOptions, setShowFinishedOptions] = useState(false)
  
  // UI Display Toggles
  const [showCookies, setShowCookies] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState([])
  
  const consoleEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  // 1. Authenticate, fetch celebrity profile count, and load credentials
  useEffect(() => {
    if (!router.isReady) return
    
    const token = getToken()
    if (!token) {
      alert('Access Denied. Please login on the admin panel first.')
      router.push('/admin')
      return
    }
    setIsAdmin(true)

    // Load credentials from database live_settings API (fallback to localStorage)
    const loadCredentials = async () => {
      try {
        const res = await fetch('/api/admin/live_settings', {
          headers: {
            'x-admin-token': token || '',
          }
        })
        if (res.ok) {
          const data = await res.json()
          const dbSessionId = data.settings?.instagram_session_id || ''
          const dbCsrfToken = data.settings?.instagram_csrf_token || ''
          
          setSessionId(dbSessionId || localStorage.getItem('instagram_session_id') || '')
          setCsrfToken(dbCsrfToken || localStorage.getItem('instagram_csrf_token') || '')
        } else {
          setSessionId(localStorage.getItem('instagram_session_id') || '')
          setCsrfToken(localStorage.getItem('instagram_csrf_token') || '')
        }
      } catch (e) {
        setSessionId(localStorage.getItem('instagram_session_id') || '')
        setCsrfToken(localStorage.getItem('instagram_csrf_token') || '')
      }
    }

    loadCredentials()

    // Fetch celebrity profile metadata from DB to get the posts count
    const fetchCelebrityData = async () => {
      try {
        const res = await fetch('/api/admin/celebrities', {
          headers: {
            'x-admin-token': token || '',
          }
        })
        if (res.ok) {
          const data = await res.json()
          const matched = data.celebrities?.find(c => c.id === celebrityId || c.instagram_handle?.toLowerCase() === handle?.toLowerCase())
          if (matched) {
            setCelebrity(matched)
            const pCount = matched.posts_count || 0
            setTotalPosts(pCount)
          }
        }
      } catch (err) {
        console.error('Failed to load celebrity posts count:', err)
      }
    }

    fetchCelebrityData()

    if (handle) {
      const handleKey = handle.toLowerCase()
      
      // Check segment progress
      const pendingDataStr = localStorage.getItem(`pending_progress_${handleKey}`)
      if (pendingDataStr) {
        try {
          const saved = JSON.parse(pendingDataStr)
          const processed = saved.initialStats?.processedItems || saved.stats?.processedItems || 0
          if (processed > 0) {
            setHasPending(true)
            setPendingCount(processed)
            setRunIndex(Math.floor(processed / 200) + 1)
          } else {
            localStorage.removeItem(`pending_progress_${handleKey}`)
          }
        } catch (e) {
          localStorage.removeItem(`pending_progress_${handleKey}`)
        }
      }

      // Check daily refresh (incremental) status
      const incDate = localStorage.getItem(`last_scraped_date_${handleKey}`)
      if (incDate) {
        setHasIncremental(true)
        // If we have completed scraping the profile, show options
        if (!pendingDataStr) {
          setShowFinishedOptions(true)
        }
      }
    }
  }, [router.isReady, handle, celebrityId])

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (showLogs) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, showLogs])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
  }

  // Calculate runs variables
  const totalRuns = Math.ceil(totalPosts / 200) || 1

  const handleSessionIdChange = (val) => {
    setSessionId(val)
    localStorage.setItem('instagram_session_id', val)
  }

  const handleCsrfTokenChange = (val) => {
    setCsrfToken(val)
    localStorage.setItem('instagram_csrf_token', val)
  }

  // 2. Scraping handler
  const executeScrape = async (mode) => {
    if (!handle || !celebrityId) return

    setScraping(true)
    setSegmentProgress(0)
    setLogs([])
    setIsFullyCompleted(false)
    addLog(`Starting scrape run. Mode: [${mode.toUpperCase()}]`, 'info')

    const handleKey = handle.toLowerCase()
    let nextMaxId = null
    let initialStats = null
    let lastScrapedDate = null
    let lastReportedStats = null

    if (mode === 'resume') {
      const pendingDataStr = localStorage.getItem(`pending_progress_${handleKey}`)
      if (pendingDataStr) {
        try {
          const saved = JSON.parse(pendingDataStr)
          nextMaxId = saved.nextMaxId
          initialStats = saved.initialStats || saved.stats
        } catch (e) {
          addLog('Failed to load saved progress.', 'warn')
        }
      }
    } else if (mode === 'incremental') {
      lastScrapedDate = localStorage.getItem(`last_scraped_date_${handleKey}`)
      addLog(`Daily Refresh: Fetching new posts since ${new Date(lastScrapedDate).toLocaleDateString()}`, 'info')
    } else if (mode === 'fresh') {
      // Discard saved progress to start from scratch
      localStorage.removeItem(`pending_progress_${handleKey}`)
      setHasPending(false)
      setPendingCount(0)
      setRunIndex(1)
    }

    // Standard chunk is 200 posts (17 pages of 12 items)
    const maxPages = mode === 'incremental' ? 2 : 17

    try {
      abortControllerRef.current = new AbortController()
      const token = getToken()
      
      const res = await fetch('/api/admin/refresh_stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || '',
        },
        body: JSON.stringify({
          celebrityId,
          instagram_handle: handle,
          sessionId,
          csrfToken,
          maxPages,
          nextMaxId,
          initialStats,
          lastScrapedDate
        }),
        signal: abortControllerRef.current.signal
      })

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'progress') {
              const s = data.stats
              lastReportedStats = s
              
              // Calculate segment progress (how many scraped in the current run out of 200)
              const scrapedInThisRun = mode === 'resume' 
                ? (s.processedItems - (initialStats?.processedItems || 0))
                : s.processedItems
              
              setSegmentProgress(Math.min(200, scrapedInThisRun))
              setPendingCount(s.processedItems)
              
              if (s.statusMessage) {
                addLog(s.statusMessage, 'warn')
              } else {
                addLog(`Processed ${s.processedItems} posts (${s.totalReels} reels, ${s.skippedPosts} skipped).`, 'success')
              }
            } else if (data.type === 'complete') {
              const resResult = data.result
              setScraping(false)

              if (resResult.moreAvailable && resResult.nextMaxId) {
                // Save progress for the next chunk
                const nextStats = {
                  processedItems: resResult.processedItems,
                  skippedPosts: resResult.finalStats?.skippedPosts || 0,
                  totalReelViews: resResult.finalStats?.totalReelViews || 0,
                  totalReelLikes: resResult.finalStats?.totalReelLikes || 0,
                  totalPostLikes: resResult.finalStats?.totalPostLikes || 0,
                  totalComments: resResult.finalStats?.totalComments || 0,
                  totalReelsCount: resResult.finalStats?.totalReelsCount || 0,
                  totalPostsCount: resResult.finalStats?.totalPostsCount || 0,
                  topPostLikes: resResult.finalStats?.topPostLikes?.count || 0,
                  topPostLikesDate: resResult.finalStats?.topPostLikes?.date || null,
                  topPostComments: resResult.finalStats?.topPostComments?.count || 0,
                  topPostCommentsDate: resResult.finalStats?.topPostComments?.date || null,
                  topReelViews: resResult.finalStats?.topReelViews?.count || 0,
                  topReelViewsDate: resResult.finalStats?.topReelViews?.date || null,
                  latestItemsEngagement: resResult.finalStats?.latestItemsEngagement || 0,
                  latestItemsCount: resResult.finalStats?.latestItemsCount || 0,
                  latestPostDate: resResult.finalStats?.latestPostDate || null
                }
                
                localStorage.setItem(`pending_progress_${handleKey}`, JSON.stringify({
                  nextMaxId: resResult.nextMaxId,
                  initialStats: nextStats
                }))
                
                setHasPending(true)
                setPendingCount(resResult.processedItems)
                // Set index for the next segment
                setRunIndex(Math.floor(resResult.processedItems / 200) + 1)
                
                addLog(`Run ${runIndex} finished! Completed ${resResult.processedItems} posts overall.`, 'success')
              } else {
                // Scrape fully complete!
                localStorage.removeItem(`pending_progress_${handleKey}`)
                setHasPending(false)
                setIsFullyCompleted(true)
                setShowFinishedOptions(true)
                setRunIndex(1)
                setPendingCount(0)

                const dateToSave = resResult.finalStats?.latestPostDate || resResult.updates?.most_liked_date
                if (dateToSave) {
                  localStorage.setItem(`last_scraped_date_${handleKey}`, dateToSave)
                  setHasIncremental(true)
                }
                
                addLog(`Full Scrape Complete! Reached the end of the feed.`, 'success')
              }
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          }
        }
      }
    } catch (err) {
      setScraping(false)
      
      // Save last reported progress on error/abort
      if (lastReportedStats && lastReportedStats.nextMaxId) {
        const nextStats = {
          processedItems: lastReportedStats.processedItems,
          skippedPosts: lastReportedStats.skippedPosts || 0,
          totalReelViews: lastReportedStats.totalReelViews || 0,
          totalReelLikes: lastReportedStats.totalReelLikes || 0,
          totalPostLikes: lastReportedStats.totalPostLikes || 0,
          totalComments: lastReportedStats.totalComments || 0,
          totalReelsCount: lastReportedStats.totalReelsCount || 0,
          totalPostsCount: lastReportedStats.totalPostsCount || 0,
          topPostLikes: lastReportedStats.topPostLikes?.count || 0,
          topPostLikesDate: lastReportedStats.topPostLikes?.date || null,
          topPostComments: lastReportedStats.topPostComments?.count || 0,
          topPostCommentsDate: lastReportedStats.topPostComments?.date || null,
          topReelViews: lastReportedStats.topReelViews?.count || 0,
          topReelViewsDate: lastReportedStats.topReelViews?.date || null,
          latestItemsEngagement: lastReportedStats.latestItemsEngagement || 0,
          latestItemsCount: lastReportedStats.latestItemsCount || 0,
          latestPostDate: lastReportedStats.latestPostDate || null
        }
        localStorage.setItem(`pending_progress_${handleKey}`, JSON.stringify({
          nextMaxId: lastReportedStats.nextMaxId,
          initialStats: nextStats
        }))
        setHasPending(true)
        setPendingCount(lastReportedStats.processedItems)
        setRunIndex(Math.floor(lastReportedStats.processedItems / 200) + 1)
      }

      if (err.name === 'AbortError') {
        addLog(`Scraping paused by user.`, 'warn')
      } else {
        addLog(`Error: ${err.message}`, 'error')
        if (err.message.includes('400')) {
          addLog(`⚠️ Instagram returned HTTP 400. You are temporarily rate-limited. Please wait 10-15 minutes.`, 'error')
        }
      }
    }
  }

  const handlePause = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: 'white' }}>
        <p>Checking authentication...</p>
      </div>
    )
  }

  // Segment Progress Percentage
  const progressPercent = Math.round((segmentProgress / 200) * 100)

  return (
    <>
      <Head>
        <title>Scraper Console | @{handle || 'Instagram'}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'Inter, sans-serif',
        padding: '32px 16px',
      }}>
        <div style={{ maxWidth: 650, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <button 
              onClick={() => router.push('/admin')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#a1a1aa',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#71717a', fontWeight: 800, letterSpacing: '0.05em' }}>
                Instagram Scraper
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                @{handle || 'profile'}
              </h2>
            </div>
          </div>

          {/* Collapsible Cookie Manager */}
          <div style={{ 
            background: '#18181b', 
            border: '1px solid #27272a', 
            borderRadius: 16, 
            padding: '16px 20px', 
            marginBottom: 24 
          }}>
            <div 
              onClick={() => setShowCookies(!showCookies)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>
                <Cookie size={16} style={{ color: '#e1306c' }} /> Verify Instagram Cookies
              </span>
              <span style={{ fontSize: 12, color: '#71717a' }}>{showCookies ? 'Hide ▴' : 'Show ▾'}</span>
            </div>

            {showCookies && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#71717a', marginBottom: 6, fontWeight: 700 }}>
                  FULL INSTAGRAM COOKIE STRING
                </label>
                <textarea
                  value={sessionId}
                  onChange={(e) => handleSessionIdChange(e.target.value)}
                  placeholder="Paste full Cookie string (e.g., mid=...; ig_did=...; datr=...; sessionid=...)"
                  style={{
                    width: '100%',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: 8,
                    color: 'white',
                    padding: 10,
                    fontSize: 12,
                    outline: 'none',
                    fontFamily: 'monospace',
                    minHeight: 60,
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
          </div>

          {/* Main Scraper Dashboard Panel */}
          <div style={{ 
            background: '#18181b', 
            border: '1px solid #27272a', 
            borderRadius: 20, 
            padding: 30,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            
            {/* 1. If Active Scraping is Running */}
            {scraping ? (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: 'white' }}>
                  Scraping Run {runIndex} of {totalRuns}
                </h3>
                
                {/* Progress Bar Container */}
                <div style={{ width: '100%', height: 16, background: '#09090b', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', background: '#e1306c', transition: 'width 0.4s ease' }} />
                </div>

                <div style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>
                  <strong>{segmentProgress} / 200</strong> posts collected in this run
                  <span style={{ color: '#71717a', display: 'block', marginTop: 4, fontSize: 12 }}>
                    (Overall Progress: {pendingCount} / {totalPosts} posts scraped)
                  </span>
                </div>

                <button 
                  onClick={handlePause}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Pause Scraper
                </button>
              </div>
            ) : showFinishedOptions ? (
              /* 2. Finished Scrape State: Show Daily Refresh & Start Over Only */
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <CheckCircle size={48} style={{ color: '#10b981' }} />
                </div>
                
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                  Feed Scraping Complete
                </h3>
                
                <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 28px 0', lineHeight: 1.5 }}>
                  This celebrity profile has been fully scraped to your database. Use the options below to maintain it.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
                  <button 
                    onClick={() => executeScrape('incremental')}
                    style={{
                      background: '#10b981', // green
                      color: 'white',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 15,
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}
                  >
                    Daily Refresh (Fetch New Posts)
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to scrape everything from the beginning? This will discard your current progress.')) {
                        setShowFinishedOptions(false)
                        executeScrape('fresh')
                      }
                    }}
                    style={{
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      color: '#f4f4f5',
                      padding: '12px 28px',
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Scrape From Beginning (Start Over)
                  </button>
                </div>
              </div>
            ) : (
              /* 3. Pre-Scrape / Segment Complete State */
              <div>
                <div style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 20, lineHeight: 1.6 }}>
                  <strong>@{handle}</strong> has <strong>{totalPosts.toLocaleString()}</strong> posts on Instagram.
                  <div style={{ color: '#71717a', marginTop: 4 }}>
                    With a 200-post limit, this will require <strong>{totalRuns} runs</strong> to scrape completely.
                  </div>
                </div>

                {hasPending ? (
                  <div style={{ background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: '#f4f4f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4, color: '#e1306c', fontWeight: 700 }}>
                      <CheckCircle size={16} /> Run {runIndex - 1} Completed
                    </div>
                    Processed {pendingCount} posts so far. Ready for <strong>Run {runIndex} of {totalRuns}</strong>.
                  </div>
                ) : null}

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  {hasPending ? (
                    <button 
                      onClick={() => executeScrape('resume')}
                      style={{
                        background: '#e1306c',
                        color: 'white',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 15,
                        boxShadow: '0 4px 15px rgba(225,48,108,0.3)'
                      }}
                    >
                      Resume Scrape (Run {runIndex} of {totalRuns})
                    </button>
                  ) : (
                    <button 
                      onClick={() => executeScrape('fresh')}
                      style={{
                        background: '#e1306c',
                        color: 'white',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 15,
                        boxShadow: '0 4px 15px rgba(225,48,108,0.3)'
                      }}
                    >
                      Start Scraping (Run 1 of {totalRuns})
                    </button>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Toggle Debug Logs at the bottom */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span 
              onClick={() => setShowLogs(!showLogs)}
              style={{
                fontSize: 12,
                color: '#71717a',
                cursor: 'pointer',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Terminal size={12} /> {showLogs ? 'Hide Detailed Scraping Logs' : 'Show Detailed Scraping Logs'}
            </span>

            {showLogs && (
              <div style={{
                marginTop: 16,
                background: '#020205',
                border: '1px solid #18181b',
                borderRadius: 12,
                padding: 16,
                fontFamily: 'Consolas, monospace',
                fontSize: 12,
                textAlign: 'left',
                height: 250,
                overflowY: 'auto',
                color: '#39ff14', // matrix green
                lineHeight: 1.5
              }}>
                {logs.length === 0 ? (
                  <div style={{ color: '#71717a', textAlign: 'center', padding: '50px 0' }}>
                    Log is empty. Start a scrape to see output here.
                  </div>
                ) : (
                  logs.map((log, idx) => {
                    let c = '#39ff14'
                    if (log.type === 'info') c = '#38bdf8'
                    if (log.type === 'warn') c = '#fbbf24'
                    if (log.type === 'error') c = '#ef4444'
                    return (
                      <div key={idx} style={{ marginBottom: 4, color: c }}>
                        <span style={{ color: '#71717a', marginRight: 6 }}>[{log.timestamp}]</span>
                        {log.message}
                      </div>
                    )
                  })
                )}
                <div ref={consoleEndRef} />
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
