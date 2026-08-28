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
    return res.status(200).json({ message: "No profiles with instagram handles found.", updated: 0, failed: 0 })
  }

  const scraper = new InstagramFollowersScraper(sessionId, csrfToken)
  const todayStr = new Date().toISOString().split("T")[0]

  let updated = 0
  let failed = 0
  const failures = []

  for (let i = 0; i < allProfiles.length; i++) {
    const profile = allProfiles[i]

    if (i > 0) await sleep(4000)

    try {
      const result = await scraper.fetchFollowers(profile.instagram_handle)
      const count = result.followersCount

      if (!count || count === 0) throw new Error(`Zero follower count for @${profile.instagram_handle}`)

      const formattedText = formatFollowersText(count)

      let history = Array.isArray(profile.follower_history) ? [...profile.follower_history] : []
      const todayIdx = history.findIndex(h => h.date === todayStr)
      if (todayIdx !== -1) {
        history[todayIdx].count = count
      } else {
        history.push({ date: todayStr, count })
      }
      history.sort((a, b) => new Date(a.date) - new Date(b.date))
      if (history.length > 365) history = history.slice(-365)

      await supabase
        .from("most_followed")
        .update({ followers_count: count, followers_text: formattedText, follower_history: history })
        .eq("id", profile.id)

      updated++
      console.log(`[BatchScrape] OK ${i + 1}/${allProfiles.length} @${profile.instagram_handle} -> ${formattedText}`)
    } catch (err) {
      failed++
      failures.push({ handle: profile.instagram_handle, error: err.message })
      console.warn(`[BatchScrape] FAIL ${i + 1}/${allProfiles.length} @${profile.instagram_handle} -> ${err.message}`)
    }
  }

  return res.status(200).json({ total: allProfiles.length, updated, failed, failures: failures.slice(0, 50) })
}
