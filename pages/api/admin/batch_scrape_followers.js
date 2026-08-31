import { getAdminClient } from "../../../lib/supabase.js"
import { InstagramFollowersScraper } from "../../../lib/followersScraper.js"

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" })
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
  if (req.socket) req.socket.setTimeout(0);
  if (res.socket) res.socket.setKeepAlive(true);

  // Set up Server-Sent Events (SSE) headers for real-time progress streaming
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  })

  const safeWrite = (data) => {
    try {
      res.write(data);
    } catch (e) {
      // Client may have disconnected or tab closed
    }
  };

  const scraper = new InstagramFollowersScraper(sessionId, csrfToken)

  // Smart Midnight Grace Period: If between 12:00 AM and 6:00 AM (IST), attribute to yesterday unless explicitly specified
  let todayStr = req.body?.targetDate || req.query?.targetDate
  if (!todayStr) {
    const now = new Date()
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const istDate = new Date(now.getTime() + istOffsetMs)
    const istHour = istDate.getUTCHours()

    if (istHour < 6) {
      // Midnight to 6 AM: attribute to yesterday
      const yesterday = new Date(istDate.getTime() - 24 * 60 * 60 * 1000)
      todayStr = yesterday.toISOString().split("T")[0]
    } else {
      todayStr = istDate.toISOString().split("T")[0]
    }
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

  const chunkSize = 4
  for (let i = 0; i < allProfiles.length; i += chunkSize) {
    const chunk = allProfiles.slice(i, i + chunkSize)

    await Promise.all(chunk.map(async (profile) => {
      try {
        const cleanHandle = profile.instagram_handle.trim().toLowerCase().replace(/^@/, '')
        const result = await scraper.fetchFollowers(cleanHandle)
        const count = result.followersCount

        if (!count || count === 0) {
          throw new Error(`Zero follower count returned for @${profile.instagram_handle}`)
        }

        const formattedText = formatFollowersText(count)

        let history = Array.isArray(profile.follower_history) ? [...profile.follower_history] : []
        const todayIdx = history.findIndex(h => h.date === todayStr)
        if (todayIdx !== -1) {
          history[todayIdx].count = count
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
        failed++
        processed++
        const failureItem = {
          id: profile.id,
          name: profile.name,
          handle: profile.instagram_handle,
          error: err.message || "Failed to fetch follower count"
        }
        failures.push(failureItem)
        console.warn(`[BatchScrape] FAIL [${processed}/${allProfiles.length}] @${profile.instagram_handle} -> ${err.message}`)

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
          error: err.message || "Unknown error",
          updated,
          failed
        })}\n\n`)
      }
    }))

    if (i + chunkSize < allProfiles.length) {
      await sleep(1000)
    }
  }

  // Send final complete event
  safeWrite(`data: ${JSON.stringify({
    type: "complete",
    total: allProfiles.length,
    updated,
    failed,
    failures
  })}\n\n`)

  try { res.end(); } catch (e) {}
}
