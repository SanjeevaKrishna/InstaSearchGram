import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowLeft, Play, Pause, RefreshCw, Eye, Heart, MessageCircle, Film, ExternalLink, ShieldCheck, Activity, Terminal, CheckCircle, Zap, Calendar, SkipForward, Square, AlertTriangle, Layers } from 'lucide-react'

const TOKEN_KEY = 'is_admin_token'
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)

function formatCompact(n) {
  if (!n) return '0'
  const num = Number(n)
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toLocaleString()
}

export default function ScrapeConsole() {
  const router = useRouter()
  const { id: rawId, handle: queryHandle, mode: queryMode } = router.query

  const [isAdmin, setIsAdmin] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchModeType, setBatchModeType] = useState('full') // 'daily' | 'unscraped' | 'full'

  // Batch Queue States
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchPaused, setBatchPaused] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [failedList, setFailedList] = useState([])
  const [successList, setSuccessList] = useState([])
  const [batchCompleted, setBatchCompleted] = useState(false)
  const [pendingRecovery, setPendingRecovery] = useState(null)

  // Current Active Profile States
  const [currentCelebrity, setCurrentCelebrity] = useState(null)
  const [currentHandle, setCurrentHandle] = useState('')
  const [currentCelId, setCurrentCelId] = useState('')
  const [totalPosts, setTotalPosts] = useState(0)
  const [lastScrapedDate, setLastScrapedDate] = useState(null)

  // Lifetime Multi-Run Progress States
  const [scraping, setScraping] = useState(false)
  const [runIndex, setRunIndex] = useState(1)
  const [maxRunsExpected, setMaxRunsExpected] = useState(1)
  const [totalLifetimeScraped, setTotalLifetimeScraped] = useState(0)
  const [segmentProgress, setSegmentProgress] = useState(0)
  const [hasPendingSingle, setHasPendingSingle] = useState(false)
  const [singleCompleted, setSingleCompleted] = useState(false)

  // Delays & Status
  const [statusMessage, setStatusMessage] = useState('')
  const [humanPause, setHumanPause] = useState(false)

  // The 4 Major Raw Values (Live Cumulative)
  const [stats, setStats] = useState({
    processedItems: 0,
    totalPosts: 0,
    totalReels: 0,
    totalReelViews: 0,
    totalReelLikes: 0,
    totalPostLikes: 0,
    totalComments: 0,
    page: 0,
  })

  // Logs
  const [logs, setLogs] = useState([])
  const consoleEndRef = useRef(null)
  const abortControllerRef = useRef(null)
  const isBatchRunningRef = useRef(false)
  const isBatchPausedRef = useRef(false)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
  }

  // Auto-scroll logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // 1. Authenticate & Setup Mode (Single or Batch)
  useEffect(() => {
    if (!router.isReady) return

    const token = getToken()
    if (!token) {
      alert('Access Denied. Please login on the admin panel first.')
      router.push('/admin')
      return
    }
    setIsAdmin(true)

    const isBatch = Boolean(queryMode && ['daily', 'unscraped', 'full'].includes(queryMode))
    setIsBatchMode(isBatch)

    if (isBatch) {
      setBatchModeType(queryMode)
      initBatchQueue(queryMode, token)
    } else {
      initSingleProfile(token)
    }
  }, [router.isReady, queryMode, queryHandle, rawId])

  // Initialize Batch Queue from DB
  const initBatchQueue = async (mode, token) => {
    try {
      addLog('Loading celebrity profiles for Full Lifetime ' + mode.toUpperCase() + ' Depth Scrape...', 'info')
      const res = await fetch('/api/admin/celebrities', {
        headers: { 'x-admin-token': token || '' }
      })
      if (!res.ok) throw new Error('Failed to load celebrities: HTTP ' + res.status)
      const data = await res.json()
      const allCels = data.celebrities || []

      let filtered = allCels.filter(c => c.instagram_handle && c.instagram_handle.trim())

      if (mode === 'unscraped') {
        filtered = filtered.filter(c => (!c.posts_scraped || c.posts_scraped === 0) && (!c.total_reel_views_scraped || c.total_reel_views_scraped === 0))
      }

      if (filtered.length === 0) {
        addLog('No matching profiles found in database.', 'warn')
        alert('No profiles found for ' + mode + ' scrape!')
        return
      }

      const q = filtered.map(c => ({
        id: c.id,
        handle: c.instagram_handle.trim().replace(/^@/, ''),
        name: c.name,
        posts_count: c.posts_count || c.posts_scraped || 0,
        slug: c.slug
      }))

      setQueue(q)
      addLog('Loaded ' + q.length + ' profile(s) in queue for 100% Lifetime Depth Scraping. Ready to start.', 'success')

      // Check if there was saved state in localStorage
      const savedStr = localStorage.getItem('batch_scrape_active_' + mode)
      if (savedStr) {
        try {
          const saved = JSON.parse(savedStr)
          if (saved && saved.currentIndex > 0 && saved.currentIndex < q.length) {
            setPendingRecovery(saved)
          }
        } catch (e) {}
      }
    } catch (err) {
      addLog('Error initializing batch: ' + err.message, 'error')
    }
  }

  // Initialize Single Profile
  const initSingleProfile = async (token) => {
    if (!queryHandle && !rawId) return
    try {
      const res = await fetch('/api/admin/celebrities', {
        headers: { 'x-admin-token': token || '' }
      })
      if (res.ok) {
        const data = await res.json()
        const matched = data.celebrities?.find(c => 
          (rawId && c.id === rawId) || 
          (queryHandle && c.instagram_handle?.toLowerCase() === queryHandle.toLowerCase())
        )
        if (matched) {
          setCurrentCelebrity(matched)
          setCurrentCelId(matched.id)
          setCurrentHandle(matched.instagram_handle)
          const pCount = matched.posts_count || matched.posts_scraped || 0
          if (pCount > 0) {
            setTotalPosts(pCount)
            setMaxRunsExpected(Math.ceil(pCount / 200) || 1)
          }

          setStats(prev => ({
            ...prev,
            totalPosts: pCount,
            totalReelViews: matched.total_reel_views_scraped || matched.total_reel_views || 0,
            totalReelLikes: matched.total_reel_likes_scraped || matched.total_reel_likes || 0,
            totalPostLikes: matched.total_post_likes_scraped || matched.total_post_likes || 0,
            totalComments: matched.total_comments_scraped || matched.total_comments || 0,
          }))
        }
      }

      if (queryHandle) {
        const handleKey = queryHandle.toLowerCase()
        const savedDate = localStorage.getItem('last_scraped_date_' + handleKey)
        if (savedDate) setLastScrapedDate(savedDate)

        const pendingStr = localStorage.getItem('pending_progress_' + handleKey)
        if (pendingStr) {
          try {
            const saved = JSON.parse(pendingStr)
            const processed = saved.initialStats?.processedItems || 0
            if (processed > 0) {
              setHasPendingSingle(true)
              setTotalLifetimeScraped(processed)
              setRunIndex(Math.floor(processed / 200) + 1)
              setStats(prev => ({
                ...prev,
                processedItems: processed,
                totalReelViews: saved.initialStats?.totalReelViews || prev.totalReelViews,
                totalReelLikes: saved.initialStats?.totalReelLikes || prev.totalReelLikes,
                totalPostLikes: saved.initialStats?.totalPostLikes || prev.totalPostLikes,
                totalComments: saved.initialStats?.totalComments || prev.totalComments,
              }))
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to load profile data:', err)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FULL LIFETIME DEPTH MULTI-RUN BATCH RUNNER
  // ─────────────────────────────────────────────────────────────────────────────
  const startBatchExecution = (startIndex = 0, resumeState = null) => {
    if (queue.length === 0) return
    setBatchRunning(true)
    setBatchPaused(false)
    setBatchCompleted(false)
    setPendingRecovery(null)
    isBatchRunningRef.current = true
    isBatchPausedRef.current = false

    const initialFailed = resumeState ? (resumeState.failed || []) : failedList
    const initialSuccess = resumeState ? (resumeState.success || []) : successList

    runBatchLoop(queue, startIndex, batchModeType, initialFailed, initialSuccess)
  }

  const runBatchLoop = async (q, startIdx, mode, fList, sList) => {
    for (let i = startIdx; i < q.length; i++) {
      if (!isBatchRunningRef.current) break

      while (isBatchPausedRef.current) {
        await new Promise(r => setTimeout(r, 1000))
        if (!isBatchRunningRef.current) break
      }
      if (!isBatchRunningRef.current) break

      const item = q[i]
      setCurrentIndex(i)
      setCurrentHandle(item.handle)
      setCurrentCelId(item.id)
      setCurrentCelebrity(item)
      
      const expectedTotalPosts = item.posts_count || 1000
      setTotalPosts(expectedTotalPosts)
      setSegmentProgress(0)
      setTotalLifetimeScraped(0)

      const expectedRuns = mode === 'daily' ? 1 : Math.min(30, Math.ceil(expectedTotalPosts / 200) || 1)
      setMaxRunsExpected(expectedRuns)

      setStats({
        processedItems: 0,
        totalPosts: expectedTotalPosts,
        totalReels: 0,
        totalReelViews: 0,
        totalReelLikes: 0,
        totalPostLikes: 0,
        totalComments: 0,
        page: 0
      })

      addLog('🌊 [Profile ' + (i + 1) + '/' + q.length + '] Starting Full Lifetime Depth Scrape for @' + item.handle + ' (~' + expectedTotalPosts.toLocaleString() + ' total posts across ~' + expectedRuns + ' runs)...', 'info')

      // Save state to localStorage for shutdown recovery
      localStorage.setItem('batch_scrape_active_' + mode, JSON.stringify({
        currentIndex: i,
        mode,
        failed: fList,
        success: sList,
        timestamp: Date.now()
      }))

      // ── Multi-Run Full Depth Loop for This Creator ──
      let profileSuccess = false
      let currentNextMaxId = null
      let accumulatedStats = null
      let runNum = 1

      while (isBatchRunningRef.current) {
        while (isBatchPausedRef.current) {
          await new Promise(r => setTimeout(r, 1000))
          if (!isBatchRunningRef.current) break
        }
        if (!isBatchRunningRef.current) break

        setRunIndex(runNum)
        setSegmentProgress(0)
        addLog('▶️ [@' + item.handle + '] Starting Run ' + runNum + ' of ' + expectedRuns + ' (Collected so far: ' + (accumulatedStats?.processedItems || 0) + '/' + expectedTotalPosts + ' posts)...', 'info')

        try {
          const chunkResult = await scrapeSingleProfileChunkAsync(item.id, item.handle, mode, currentNextMaxId, accumulatedStats)
          if (!chunkResult) break // Paused/aborted

          const finalS = chunkResult.finalStats || {}
          accumulatedStats = finalS
          currentNextMaxId = chunkResult.nextMaxId
          profileSuccess = true

          setTotalLifetimeScraped(finalS.processedItems || 0)
          if (finalS.totalPosts && finalS.totalPosts > expectedTotalPosts) {
            setTotalPosts(finalS.totalPosts)
            setMaxRunsExpected(Math.ceil(finalS.totalPosts / 200) || 1)
          }

          // Check if there are more posts to scrape for this creator
          const hasMore = Boolean(chunkResult.moreAvailable && currentNextMaxId && (finalS.processedItems < (finalS.totalPosts || expectedTotalPosts)))

          if (hasMore && mode !== 'daily' && runNum < 30 && isBatchRunningRef.current && !isBatchPausedRef.current) {
            // Anti-ban pause between 200-post chunks of the SAME creator (12s - 16s)
            const chunkRest = Math.floor(Math.random() * 5) + 12
            for (let cd = chunkRest; cd > 0; cd--) {
              if (!isBatchRunningRef.current || isBatchPausedRef.current) break
              setStatusMessage('🛡️ Anti-Ban Rest: Pausing ' + cd + 's before Run ' + (runNum + 1) + ' for @' + item.handle + '...')
              await new Promise(r => setTimeout(r, 1000))
            }
            runNum++
          } else {
            // Finished 100% of all posts for this creator!
            addLog('🌟 100% Lifetime Depth Completed for @' + item.handle + '! Scraped ' + finalS.processedItems + ' Total Posts | Lifetime Views: ' + formatCompact(finalS.totalReelViews), 'success')
            break
          }
        } catch (err) {
          addLog('❌ Error scraping @' + item.handle + ' on Run ' + runNum + ': ' + err.message, 'error')
          fList.push({ handle: item.handle, name: item.name, error: err.message, time: new Date().toLocaleTimeString() })
          setFailedList([...fList])
          break
        }
      }

      if (profileSuccess) {
        sList.push({ handle: item.handle, name: item.name })
        setSuccessList([...sList])
      }

      // Update state in localStorage after finishing profile
      localStorage.setItem('batch_scrape_active_' + mode, JSON.stringify({
        currentIndex: i + 1,
        mode,
        failed: fList,
        success: sList,
        timestamp: Date.now()
      }))

      // If not the last profile, rest for 25s - 35s natural cooldown between creators
      if (i < q.length - 1 && isBatchRunningRef.current && !isBatchPausedRef.current) {
        const restDuration = Math.floor(Math.random() * 10) + 25
        for (let cd = restDuration; cd > 0; cd--) {
          if (!isBatchRunningRef.current || isBatchPausedRef.current) break
          setCooldownSeconds(cd)
          setStatusMessage('☕ Natural Creator Break: Resting ' + cd + 's before next creator (@' + (q[i + 1]?.handle || '') + ') to protect account...')
          await new Promise(r => setTimeout(r, 1000))
        }
        setCooldownSeconds(0)
      }
    }

    setBatchRunning(false)
    setBatchCompleted(true)
    isBatchRunningRef.current = false
    localStorage.removeItem('batch_scrape_active_' + mode)
    addLog('🎉 All profiles in queue 100% Lifetime Depth Scraped!', 'success')
  }

  // Core single chunk stream runner (200 posts per run)
  const scrapeSingleProfileChunkAsync = async (celId, celHandle, mode = 'full', nextMaxId = null, initialStats = null) => {
    return new Promise(async (resolve, reject) => {
      try {
        abortControllerRef.current = new AbortController()
        const token = getToken()
        const handleKey = celHandle.toLowerCase()
        const dateCutoff = mode === 'daily' ? localStorage.getItem('last_scraped_date_' + handleKey) : null
        const maxPages = mode === 'daily' ? 3 : 17

        setStatusMessage('Connecting to Instagram API for @' + celHandle + '...')

        const res = await fetch('/api/admin/refresh_stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token || '',
          },
          body: JSON.stringify({
            celebrityId: celId,
            instagram_handle: celHandle,
            maxPages,
            nextMaxId,
            initialStats,
            lastScrapedDate: dateCutoff
          }),
          signal: abortControllerRef.current.signal
        })

        if (!res.ok) {
          throw new Error('Server returned HTTP ' + res.status)
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
                setSegmentProgress(Math.min(200, (s.processedItems - (initialStats?.processedItems || 0)) || 0))
                setTotalLifetimeScraped(s.processedItems || 0)
                setStats(prev => ({
                  ...prev,
                  processedItems: s.processedItems || prev.processedItems,
                  totalPosts: s.totalPosts || prev.totalPosts,
                  totalReels: s.totalReels || prev.totalReels,
                  totalReelViews: s.totalReelViews ?? prev.totalReelViews,
                  totalReelLikes: s.totalReelLikes ?? prev.totalReelLikes,
                  totalPostLikes: s.totalPostLikes ?? prev.totalPostLikes,
                  totalComments: s.totalComments ?? prev.totalComments,
                  page: s.page ?? prev.page,
                }))

                if (s.statusMessage) {
                  setStatusMessage(s.statusMessage)
                  if (s.statusMessage.includes('Human') || s.statusMessage.includes('break') || s.statusMessage.includes('pause')) {
                    setHumanPause(true)
                  } else {
                    setHumanPause(false)
                  }
                  addLog(s.statusMessage, 'warn')
                } else {
                  setHumanPause(false)
                  setStatusMessage('Page ' + (s.page || 1) + ': Scraped ' + s.processedItems + ' posts (' + formatCompact(s.totalReelViews) + ' lifetime reel views)')
                  addLog('@' + celHandle + ' | Page ' + (s.page || 1) + ': ' + s.processedItems + ' posts (' + formatCompact(s.totalReelViews) + ' views)', 'success')
                }
              } else if (data.type === 'complete') {
                const resResult = data.result
                const finalS = resResult.finalStats || {}

                // Save latest date for daily mode
                const latestDate = finalS.latestPostDate || resResult.updates?.most_liked_date
                if (latestDate) {
                  localStorage.setItem('last_scraped_date_' + handleKey, latestDate)
                  setLastScrapedDate(latestDate)
                }

                resolve(resResult)
                return
              } else if (data.type === 'error') {
                reject(new Error(data.error))
                return
              }
            }
          }
        }
        resolve(null)
      } catch (err) {
        if (err.name === 'AbortError') {
          setStatusMessage('⏸️ Scraping paused.')
          resolve(null)
        } else {
          reject(err)
        }
      }
    })
  }

  // Single Profile Full Depth Scraping Handler (Manual Click)
  const executeSingleScrape = async (mode = 'full') => {
    if (!currentHandle || !currentCelId) return
    setScraping(true)
    setSegmentProgress(0)
    setSingleCompleted(false)
    setLogs([])

    const handleKey = currentHandle.toLowerCase()
    let currentNextMaxId = null
    let accumulatedStats = null
    let runNum = 1
    const expectedTotal = totalPosts || 1000
    const maxRuns = mode === 'daily' ? 1 : Math.min(30, Math.ceil(expectedTotal / 200) || 1)
    setMaxRunsExpected(maxRuns)

    if (mode === 'fresh') {
      localStorage.removeItem('pending_progress_' + handleKey)
      setHasPendingSingle(false)
      setTotalLifetimeScraped(0)
      setRunIndex(1)
      setStats(prev => ({ ...prev, processedItems: 0 }))
      addLog('Starting Full Lifetime Depth Scrape for @' + currentHandle + '...', 'info')
    }

    try {
      while (runNum <= maxRuns) {
        setRunIndex(runNum)
        addLog('▶️ Run ' + runNum + '/' + maxRuns + ' for @' + currentHandle + ' (Posts ' + (accumulatedStats?.processedItems || 0) + '/' + expectedTotal + ')...', 'info')

        const chunkResult = await scrapeSingleProfileChunkAsync(currentCelId, currentHandle, mode, currentNextMaxId, accumulatedStats)
        if (!chunkResult) break

        const finalS = chunkResult.finalStats || {}
        accumulatedStats = finalS
        currentNextMaxId = chunkResult.nextMaxId

        const hasMore = Boolean(chunkResult.moreAvailable && currentNextMaxId && (finalS.processedItems < (finalS.totalPosts || expectedTotal)))

        if (hasMore && mode !== 'daily' && runNum < maxRuns) {
          const chunkRest = Math.floor(Math.random() * 5) + 12
          for (let cd = chunkRest; cd > 0; cd--) {
            setStatusMessage('🛡️ Safe Anti-Ban Rest: Pausing ' + cd + 's before Run ' + (runNum + 1) + '...')
            await new Promise(r => setTimeout(r, 1000))
          }
          runNum++
        } else {
          addLog('🌟 100% Lifetime Depth Completed for @' + currentHandle + '! Total Posts: ' + finalS.processedItems + ' | Lifetime Views: ' + formatCompact(finalS.totalReelViews), 'success')
          break
        }
      }

      setSingleCompleted(true)
      setScraping(false)
      addLog('Scraping finished for @' + currentHandle + '!', 'success')
    } catch (err) {
      setScraping(false)
      addLog('Error: ' + err.message, 'error')
    }
  }

  const handlePauseBatch = () => {
    isBatchPausedRef.current = true
    setBatchPaused(true)
    if (abortControllerRef.current) abortControllerRef.current.abort()
  }

  const handleResumeBatch = () => {
    isBatchPausedRef.current = false
    setBatchPaused(false)
    startBatchExecution(currentIndex)
  }

  const handleStopBatch = () => {
    isBatchRunningRef.current = false
    isBatchPausedRef.current = false
    if (abortControllerRef.current) abortControllerRef.current.abort()
    setBatchRunning(false)
    setBatchPaused(false)
    addLog('Batch scraper stopped by user.', 'warn')
  }

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: 'white' }}>
        <p>Checking authentication...</p>
      </div>
    )
  }

  const lifetimePercent = totalPosts > 0 ? Math.min(100, Math.round((totalLifetimeScraped / totalPosts) * 100)) : 0
  const chunkPercent = Math.min(100, Math.round((segmentProgress / 200) * 100))
  const batchPercent = queue.length > 0 ? Math.round(((currentIndex) / queue.length) * 100) : 0

  return (
    <>
      <Head>
        <title>{isBatchMode ? ('Lifetime Depth Scraper (' + batchModeType.toUpperCase() + ')') : ('Lifetime Scraper Console | @' + currentHandle)}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'Inter, sans-serif',
        padding: '28px 16px',
      }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
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
              <ArrowLeft size={16} /> Back to Admin
            </button>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#10b981', fontWeight: 800, letterSpacing: '0.05em' }}>
                {isBatchMode ? ('🌊 Full Lifetime Depth Scraper (' + batchModeType.toUpperCase() + ')') : 'Lifetime Instagram Scraper'}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'white' }}>
                {isBatchMode ? ('Queue: ' + queue.length + ' Creators') : ('@' + (currentHandle || 'profile'))}
              </h2>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* BATCH OVERALL PROGRESS BAR (If in Batch Mode) */}
          {/* ────────────────────────────────────────────────────────────── */}
          {isBatchMode && (
            <div style={{
              background: '#131318',
              border: '1px solid #27272a',
              borderRadius: 16,
              padding: '18px 22px',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: batchPaused ? '#f59e0b' : batchRunning ? '#10b981' : '#38bdf8',
                    color: '#09090b',
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 800
                  }}>
                    {batchPaused ? 'PAUSED' : batchRunning ? 'ACTIVE DEPTH QUEUE' : 'READY'}
                  </span>
                  <strong style={{ fontSize: 14, color: 'white' }}>
                    {batchRunning 
                      ? ('Profile ' + (currentIndex + 1) + ' of ' + queue.length + ': @' + currentHandle + ' [Run ' + runIndex + '/' + maxRunsExpected + ']')
                      : (queue.length + ' Creators in Lifetime Scrape Queue')
                    }
                  </strong>
                </div>

                <div style={{ fontSize: 12, display: 'flex', gap: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓ {successList.length} done</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ {failedList.length} failed</span>
                  <span style={{ color: '#a1a1aa' }}>⏳ {Math.max(0, queue.length - (currentIndex + 1))} left</span>
                </div>
              </div>

              {/* Overall Batch Bar */}
              <div style={{ width: '100%', height: 10, background: '#1f1f26', borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ width: (batchPercent + '%'), height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981)', transition: 'width 0.4s ease' }} />
              </div>

              {/* Batch Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                {!batchRunning && !batchCompleted ? (
                  <button 
                    onClick={() => startBatchExecution(0)}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}
                  >
                    <Play size={15} /> Start 100% Lifetime Depth Scraping ({queue.length} Creators)
                  </button>
                ) : batchRunning ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {batchPaused ? (
                      <button 
                        onClick={handleResumeBatch}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        <Play size={14} /> Resume Batch
                      </button>
                    ) : (
                      <button 
                        onClick={handlePauseBatch}
                        style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        <Pause size={14} /> Pause Batch
                      </button>
                    )}
                    <button 
                      onClick={handleStopBatch}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                      <Square size={14} /> Stop
                    </button>
                  </div>
                ) : null}

                {/* Shutdown Recovery Banner */}
                {pendingRecovery && !batchRunning && (
                  <div style={{ fontSize: 12, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Previous session stopped at Profile {pendingRecovery.currentIndex + 1}.</span>
                    <button 
                      onClick={() => startBatchExecution(pendingRecovery.currentIndex, pendingRecovery)}
                      style={{ background: '#38bdf8', color: '#09090b', border: 'none', padding: '5px 12px', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                    >
                      Resume from #{pendingRecovery.currentIndex + 1}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* CURRENT PROFILE FULL LIFETIME DEPTH DASHBOARD */}
          {/* ────────────────────────────────────────────────────────────── */}
          <div style={{ 
            background: '#18181b', 
            border: '1px solid #27272a', 
            borderRadius: 20, 
            padding: 26,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center',
            marginBottom: 20
          }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                <Layers size={13} /> Run {runIndex} of {maxRunsExpected} (100% Lifetime Depth Mode)
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, margin: '2px 0 6px 0', color: 'white' }}>
                @{currentHandle || 'Select a Profile'}
              </h3>
              <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                {totalPosts > 0 ? (totalPosts.toLocaleString() + ' Total Lifetime Posts on Instagram') : 'Ready to scrape'}
              </div>
            </div>

            {/* 1. Lifetime Overall Progress Bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 6 }}>
                <span>Lifetime Posts Progress</span>
                <span style={{ color: '#10b981' }}>{totalLifetimeScraped.toLocaleString()} / {(totalPosts || 0).toLocaleString()} Posts ({lifetimePercent}%)</span>
              </div>
              <div style={{ width: '100%', height: 16, background: '#09090b', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: (lifetimePercent + '%'), height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* 2. Current 200-Post Run Chunk Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#71717a', marginBottom: 4 }}>
                <span>Current Chunk (Run {runIndex})</span>
                <span>{segmentProgress} / 200 posts in this batch</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#09090b', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: (chunkPercent + '%'), height: '100%', background: '#e1306c', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Live Status Message & Human Delay */}
            {statusMessage && (
              <div style={{
                background: humanPause ? 'rgba(251, 191, 36, 0.1)' : 'rgba(16,185,129,0.08)',
                border: '1px solid ' + (humanPause ? 'rgba(251, 191, 36, 0.25)' : 'rgba(16,185,129,0.2)'),
                color: humanPause ? '#fbbf24' : '#34d399',
                padding: '9px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10
              }}>
                <Activity size={14} />
                {statusMessage}
              </div>
            )}

            {/* Single Profile Actions (when not in batch mode) */}
            {!isBatchMode && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {lastScrapedDate && (
                  <button 
                    onClick={() => executeSingleScrape('daily')}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '11px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Zap size={14} /> Daily Scrape (New Posts Only)
                  </button>
                )}
                <button 
                  onClick={() => executeSingleScrape('fresh')}
                  style={{ background: '#e1306c', color: 'white', border: 'none', padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Play size={14} /> Full Lifetime Scrape (All {maxRunsExpected} Runs)
                </button>
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* THE 4 MAJOR REAL LIFETIME METRICS CARDS */}
          {/* ────────────────────────────────────────────────────────────── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 12,
            marginBottom: 20
          }}>
            {/* 1. Total Lifetime Reel Views */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f77737', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <Eye size={16} /> 🎬 Lifetime Reel Views
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>
                {formatCompact(stats.totalReelViews)}
              </div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                {Number(stats.totalReelViews || 0).toLocaleString()} exact lifetime views
              </div>
            </div>

            {/* 2. Total Lifetime Reel Likes */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e1306c', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <Film size={16} /> ❤️ Lifetime Reel Likes
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>
                {formatCompact(stats.totalReelLikes)}
              </div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                {Number(stats.totalReelLikes || 0).toLocaleString()} exact lifetime reel likes
              </div>
            </div>

            {/* 3. Total Lifetime Photo Post Likes */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ec4899', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <Heart size={16} /> 🖼️ Lifetime Photo Likes
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>
                {formatCompact(stats.totalPostLikes)}
              </div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                {Number(stats.totalPostLikes || 0).toLocaleString()} exact lifetime photo likes
              </div>
            </div>

            {/* 4. Total Lifetime Comments */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                <MessageCircle size={16} /> 💬 Lifetime Comments
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>
                {formatCompact(stats.totalComments)}
              </div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                {Number(stats.totalComments || 0).toLocaleString()} exact lifetime comments
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* BATCH SUMMARY REPORT (If Batch Finished) */}
          {/* ────────────────────────────────────────────────────────────── */}
          {batchCompleted && (
            <div style={{
              background: '#18181b',
              border: '1px solid ' + (failedList.length > 0 ? '#f59e0b' : '#10b981'),
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CheckCircle size={22} style={{ color: failedList.length > 0 ? '#f59e0b' : '#10b981' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'white' }}>
                  100% Lifetime Depth Batch Scraping Completed!
                </h3>
              </div>
              <p style={{ fontSize: 13, color: '#a1a1aa', margin: '0 0 12px 0' }}>
                Successfully updated <strong>{successList.length}</strong> creators with true lifetime stats.
                {failedList.length > 0 && <span style={{ color: '#ef4444', marginLeft: 6 }}>({failedList.length} failed).</span>}
              </p>

              {failedList.length > 0 && (
                <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 8, padding: 12, maxHeight: 140, overflowY: 'auto', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>FAILED CREATORS LIST:</div>
                  {failedList.map((f, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: '#f4f4f5', display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span><strong>@{f.handle}</strong>: <span style={{ color: '#a1a1aa' }}>{f.error}</span></span>
                      <span style={{ color: '#71717a', fontSize: 11 }}>{f.time}</span>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => router.push('/admin')}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Return to Admin Panel
              </button>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* TERMINAL ACTIVITY LOG */}
          {/* ────────────────────────────────────────────────────────────── */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 10 }}>
              <Terminal size={14} style={{ color: '#38bdf8' }} /> Lifetime Depth Scraper Activity Log
            </div>

            <div style={{
              background: '#09090c',
              border: '1px solid #1c1c24',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'Consolas, monospace',
              fontSize: 12,
              height: 200,
              overflowY: 'auto',
              color: '#e4e4e7',
              lineHeight: 1.6
            }}>
              {logs.length === 0 ? (
                <div style={{ color: '#52525b', textAlign: 'center', padding: '60px 0' }}>
                  Live scraping output will appear here in real time...
                </div>
              ) : (
                logs.map((log, idx) => {
                  let c = '#e4e4e7'
                  if (log.type === 'info') c = '#38bdf8'
                  if (log.type === 'warn') c = '#fbbf24'
                  if (log.type === 'error') c = '#ef4444'
                  if (log.type === 'success') c = '#34d399'
                  return (
                    <div key={idx} style={{ color: c }}>
                      <span style={{ color: '#52525b', marginRight: 6 }}>[{log.timestamp}]</span>
                      {log.message}
                    </div>
                  )
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
