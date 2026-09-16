import dns from "dns/promises"
import { getAdminClient } from "../../../lib/supabase.js"
import { InstagramFollowersScraper } from "../../../lib/followersScraper.js"

async function checkInternetConnectivity() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    await fetch("https://1.1.1.1", { method: "HEAD", signal: controller.signal, cache: "no-store" })
    clearTimeout(timeout)
    return true
  } catch (e) {
    try {
      await dns.lookup("instagram.com")
      return true
    } catch {
      try {
        await dns.lookup("google.com")
        return true
      } catch {
        return false
      }
    }
  }
}

function verifyAdmin(req) {
  const auth = req.headers["x-admin-token"]
  if (!auth) return false
  try {
    const decoded = Buffer.from(auth, "base64").toString("utf8")
    return decoded === process.env.ADMIN_SECRET_CODE + ":admin"
  } catch {
    return false
  }
}

function formatFollowersText(count) {
  if (count >= 1000000000) return `${(Math.floor(count / 100000000) / 10).toString().replace(/\.0$/, "")}B`
  if (count >= 1000000) return `${(Math.floor(count / 100000) / 10).toString().replace(/\.0$/, "")}M`
  if (count >= 1000) return `${(Math.floor(count / 100) / 10).toString().replace(/\.0$/, "")}K`
  return count.toString()
}

function getRealisticDelta(count) {
  if (!count || count <= 0) return 50
  if (count >= 100000000) return Math.floor(15000 + Math.random() * 25000)
  if (count >= 50000000) return Math.floor(8000 + Math.random() * 15000)
  if (count >= 20000000) return Math.floor(4000 + Math.random() * 10000)
  if (count >= 5000000) return Math.floor(1500 + Math.random() * 4000)
  if (count >= 1000000) return Math.floor(500 + Math.random() * 1500)
  if (count >= 300000) return Math.floor(150 + Math.random() * 450)
  if (count >= 100000) return Math.floor(50 + Math.random() * 180)
  return Math.floor(15 + Math.random() * 60)
}

function interruptibleSleep(ms) {
  return new Promise(resolve => {
    let timer
    const cleanup = () => {
      clearTimeout(timer)
      global._batchScrapeInterruptSleep = null
      resolve()
    }
    global._batchScrapeInterruptSleep = cleanup
    timer = setTimeout(cleanup, ms)
  })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const action = req.query?.action || req.body?.action

  // Handle Skip Action: Skips the currently active account/chunk immediately
  if (action === "skip") {
    if (global._batchScrapeActiveController) {
      console.log(`[BatchScrape] Admin requested skip of current active account/chunk`)
      global._batchScrapeActiveController.abort("Skipped manually by admin")
      if (global._batchScrapeInterruptSleep) {
        global._batchScrapeInterruptSleep()
      }
      return res.status(200).json({ success: true, message: "Skipped active account" })
    }
    if (global._batchScrapeInterruptSleep) {
      global._batchScrapeInterruptSleep()
      return res.status(200).json({ success: true, message: "Skipped inter-chunk delay" })
    }
    return res.status(200).json({ success: true, message: "No active scrape in-flight to skip" })
  }

  // Handle Stop Action: Stops the entire batch run
  if (action === "stop") {
    if (global._batchScrapeStopController) {
      global._batchScrapeStopController.abort()
    }
    if (global._batchScrapeActiveController) {
      global._batchScrapeActiveController.abort("Batch stopped by admin")
    }
    if (global._batchScrapeInterruptSleep) {
      global._batchScrapeInterruptSleep()
    }
    return res.status(200).json({ success: true, message: "Batch scrape stopped" })
  }

  const supabase = getAdminClient()

  const { data: settingsData } = await supabase
    .from("live_settings")
    .select("instagram_session_id, instagram_csrf_token")
    .eq("id", 1)
    .maybeSingle()

  const sessionId = settingsData?.instagram_session_id || process.env.INSTAGRAM_SESSION_ID || ""
  const csrfToken = settingsData?.instagram_csrf_token || process.env.INSTAGRAM_CSRF_TOKEN || ""

  let allProfiles = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("most_followed")
      .select("id, name, instagram_handle, follower_history")
      .not("instagram_handle", "is", null)
      .neq("instagram_handle", "")
      .range(from, from + 999)

    if (error) return res.status(500).json({ error: error.message })
    allProfiles = allProfiles.concat(data || [])
    if (!data || data.length < 1000) break
    from += 1000
  }

  if (allProfiles.length === 0) {
    return res.status(200).json({ message: "No profiles with instagram handles found.", total: 0, updated: 0, failed: 0, failures: [] })
  }

  // Disable socket timeout for long-running batch streaming
  if (req.socket) req.socket.setTimeout(0)
  if (res.socket) res.socket.setKeepAlive(true)

  // Set up Server-Sent Events (SSE) headers for real-time progress streaming
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  })

  let isStreamOpen = true
  const safeWrite = (data) => {
    if (!isStreamOpen) return
    try {
      res.write(data)
    } catch (e) {
      isStreamOpen = false
    }
  }

  // Send SSE keep-alive heartbeat ping every 8 seconds to prevent browser/proxy connection dropouts
  const heartbeatInterval = setInterval(() => {
    safeWrite(": ping\n\n")
  }, 8000)

  const stopController = new AbortController()
  global._batchScrapeStopController = stopController

  req.on("close", () => {
    isStreamOpen = false
    clearInterval(heartbeatInterval)
  })

  const scraper = new InstagramFollowersScraper(sessionId, csrfToken)

  // Smart Midnight Grace Period: If between 12:00 AM and 6:00 AM (IST), attribute to yesterday unless explicitly specified
  let todayStr = req.body?.targetDate || req.query?.targetDate
  if (!todayStr) {
    const now = new Date()
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const istDate = new Date(now.getTime() + istOffsetMs)
    const istHour = istDate.getUTCHours()

    if (istHour < 6) {
      const yesterday = new Date(istDate.getTime() - 24 * 60 * 60 * 1000)
      todayStr = yesterday.toISOString().split("T")[0]
    } else {
      todayStr = istDate.toISOString().split("T")[0]
    }
  }

  // Filter only missing profiles if requested or default when resuming
  if (req.body?.onlyMissing || req.query?.onlyMissing) {
    allProfiles = allProfiles.filter(p => !Array.isArray(p.follower_history) || !p.follower_history.some(h => h.date === todayStr && h.count))
    console.log(`[BatchScrape] Filtered to ${allProfiles.length} missing profiles for ${todayStr}`)
  }

  let updated = 0
  let failed = 0
  const failures = []
  let processed = 0

  // Send initial start event
  safeWrite(`data: ${JSON.stringify({
    type: "start",
    total: allProfiles.length,
    targetDate: todayStr
  })}\n\n`)

  const chunkSize = 2
  for (let i = 0; i < allProfiles.length; i += chunkSize) {
    if (stopController.signal.aborted || !isStreamOpen) {
      console.log(`[BatchScrape] Batch loop stopped early at index ${i}`)
      break
    }

    const chunk = allProfiles.slice(i, i + chunkSize)
    const chunkController = new AbortController()
    global._batchScrapeActiveController = chunkController

    let chunkHadInternetLoss = false

    await Promise.all(chunk.map(async (profile) => {
      try {
        const cleanHandle = profile.instagram_handle.trim().toLowerCase().replace(/^@/, '')
        const result = await scraper.fetchFollowers(cleanHandle, {
          signal: chunkController.signal,
          timeoutMs: 9000
        })
        const count = result.followersCount

        if (!count || count === 0) {
          throw new Error(`Zero follower count returned for @${profile.instagram_handle}`)
        }

        const formattedText = formatFollowersText(count)

        let history = Array.isArray(profile.follower_history) ? [...profile.follower_history] : []
        const todayIdx = history.findIndex(h => h.date === todayStr)
        if (todayIdx !== -1) {
          history[todayIdx].count = count
          delete history[todayIdx].status
        } else {
          history.push({ date: todayStr, count })
        }

        // If newly added profile with only 1 history date, automatically seed yesterday's baseline
        if (history.length === 1) {
          const delta = getRealisticDelta(count)
          const targetDateObj = new Date(todayStr)
          const priorDate = new Date(targetDateObj.getTime() - 24 * 60 * 60 * 1000)
          const priorDateStr = priorDate.toISOString().split("T")[0]
          history.unshift({ date: priorDateStr, count: Math.max(100, count - delta) })
        }

        // Interpolate any multi-day gaps between valid scrape dates with daily average values
        const valid = history.filter(h => h && h.date && h.count && h.status !== 'Server Failed');
        valid.sort((a, b) => new Date(a.date) - new Date(b.date));
        if (valid.length >= 2) {
          const byDate = new Map();
          valid.forEach(h => byDate.set(h.date, { date: h.date, count: h.count }));
          for (let i = 0; i < valid.length - 1; i++) {
            const prev = valid[i];
            const next = valid[i + 1];
            const dPrev = new Date(prev.date + 'T00:00:00Z');
            const dNext = new Date(next.date + 'T00:00:00Z');
            const diffDays = Math.round((dNext - dPrev) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
              const delta = next.count - prev.count;
              const seed = (profile.instagram_handle || profile.name || 'default');
              let hash = 0;
              for (let c = 0; c < seed.length; c++) {
                hash = ((hash << 5) - hash) + seed.charCodeAt(c);
                hash |= 0;
              }
              const rawWeights = [];
              for (let w = 0; w < diffDays; w++) {
                const x = Math.sin(hash + (w + 1) * 1337) * 10000;
                const rnd = x - Math.floor(x);
                rawWeights.push(0.65 + rnd * 0.70);
              }
              const sumRaw = rawWeights.reduce((a, b) => a + b, 0);
              const normWeights = rawWeights.map(w => w / sumRaw);

              let runningCount = prev.count;
              for (let step = 1; step < diffDays; step++) {
                const intermediate = new Date(dPrev.getTime() + step * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                runningCount += Math.round(delta * normWeights[step - 1]);
                byDate.set(intermediate, { date: intermediate, count: runningCount });
              }
            }
          }
          history = Array.from(byDate.values());
        }

        history.sort((a, b) => new Date(a.date) - new Date(b.date))
        if (history.length > 365) history = history.slice(-365)

        await supabase
          .from("most_followed")
          .update({ followers_count: count, followers_text: formattedText, follower_history: history })
          .eq("id", profile.id)

        updated++
        processed++
        console.log(`[BatchScrape] OK [${processed}/${allProfiles.length}] @${cleanHandle} -> ${formattedText}`)

        // Stream successful progress to client
        safeWrite(`data: ${JSON.stringify({
          type: "progress",
          current: processed,
          total: allProfiles.length,
          percent: Math.round((processed / allProfiles.length) * 100),
          id: profile.id,
          name: profile.name,
          handle: cleanHandle,
          status: "success",
          count,
          formattedText,
          updated,
          failed
        })}\n\n`)

      } catch (err) {
        // Check if this error is due to complete loss of internet connectivity
        const isNetworkErr = err.message === 'fetch failed' ||
                             err.code === 'ENOTFOUND' ||
                             err.code === 'EAI_AGAIN' ||
                             err.code === 'ECONNREFUSED' ||
                             err.code === 'ETIMEDOUT' ||
                             err.message?.includes('fetch failed')

        if (isNetworkErr) {
          const isOnline = await checkInternetConnectivity()
          if (!isOnline) {
            console.warn(`[BatchScrape] ⚠️ No internet connection detected during attempt for @${profile.instagram_handle}`)
            chunkHadInternetLoss = true
            return // Do NOT mark as failed or save failure to DB!
          }
        }

        failed++
        processed++
        const isSkipped = err.message?.includes("Skipped") || err.name === "AbortError" || chunkController.signal.aborted
        const errorMsg = isSkipped ? "Skipped manually by admin" : (err.message || "Failed to fetch follower count")

        const failureItem = {
          id: profile.id,
          name: profile.name,
          handle: profile.instagram_handle,
          error: errorMsg
        }
        failures.push(failureItem)
        console.warn(`[BatchScrape] ${isSkipped ? 'SKIP' : 'FAIL'} [${processed}/${allProfiles.length}] @${profile.instagram_handle} -> ${errorMsg}`)

        // Record Server Failed / Skipped status in follower_history for todayStr
        try {
          let history = Array.isArray(profile.follower_history) ? [...profile.follower_history] : []
          const todayIdx = history.findIndex(h => h.date === todayStr)
          const statusText = isSkipped ? 'Skipped by Admin' : 'Server Failed'
          if (todayIdx !== -1) {
            if (!history[todayIdx].count) {
              history[todayIdx] = { date: todayStr, count: null, status: statusText }
            }
          } else {
            history.push({ date: todayStr, count: null, status: statusText })
          }
          history.sort((a, b) => new Date(a.date) - new Date(b.date))
          await supabase
            .from("most_followed")
            .update({ follower_history: history })
            .eq("id", profile.id)
        } catch (dbErr) {
          console.warn(`[BatchScrape] Could not record status in DB for @${profile.instagram_handle}:`, dbErr.message)
        }

        // Stream failed progress to client
        safeWrite(`data: ${JSON.stringify({
          type: "progress",
          current: processed,
          total: allProfiles.length,
          percent: Math.round((processed / allProfiles.length) * 100),
          id: profile.id,
          name: profile.name,
          handle: profile.instagram_handle,
          status: "failed",
          error: errorMsg,
          updated,
          failed
        })}\n\n`)
      }
    }))

    global._batchScrapeActiveController = null

    // If internet was lost during this chunk, pause and wait for reconnection!
    if (chunkHadInternetLoss) {
      console.warn(`[BatchScrape] Internet lost! Pausing batch and waiting for internet to recover...`)
      safeWrite(`data: ${JSON.stringify({
        type: "connection_lost",
        message: "⚠️ Internet connection lost! Scraper paused. Waiting for connection to restore...",
        current: processed,
        total: allProfiles.length
      })}\n\n`)

      let offlineSeconds = 0
      const MAX_OFFLINE_SECONDS = 300 // Wait up to 5 minutes
      let isRestored = false

      while (!stopController.signal.aborted && isStreamOpen) {
        await interruptibleSleep(4000)
        offlineSeconds += 4

        const isBackOnline = await checkInternetConnectivity()
        if (isBackOnline) {
          console.log(`[BatchScrape] 🌐 Internet restored after ${offlineSeconds}s! Resuming current chunk...`)
          safeWrite(`data: ${JSON.stringify({
            type: "connection_restored",
            message: "🌐 Internet connection restored! Resuming scraper...",
            current: processed,
            total: allProfiles.length
          })}\n\n`)
          isRestored = true
          break
        }

        if (offlineSeconds >= MAX_OFFLINE_SECONDS) {
          console.warn(`[BatchScrape] Internet was down for >${MAX_OFFLINE_SECONDS}s. Halting batch cleanly.`)
          safeWrite(`data: ${JSON.stringify({
            type: "stopped_no_internet",
            message: `Internet connection was down for ${Math.round(MAX_OFFLINE_SECONDS / 60)} minutes. Batch has paused safely to preserve remaining accounts. You can resume anytime!`,
            current: processed,
            total: allProfiles.length
          })}\n\n`)
          stopController.abort("No internet connection")
          break
        }
      }

      if (isRestored) {
        // Step back so this exact chunk is retried with the restored internet!
        i -= chunkSize
        continue
      } else {
        // Outage timed out or user stopped
        break
      }
    }

    if (i + chunkSize < allProfiles.length && !stopController.signal.aborted && isStreamOpen) {
      await interruptibleSleep(3500)
    }
  }

  clearInterval(heartbeatInterval)
  global._batchScrapeActiveController = null
  global._batchScrapeStopController = null

  // Send final complete event
  safeWrite(`data: ${JSON.stringify({
    type: "complete",
    total: allProfiles.length,
    updated,
    failed,
    failures
  })}\n\n`)

  try { res.end() } catch (e) {}
}
