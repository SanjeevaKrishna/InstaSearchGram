// ============================================================
// SPIALR LAPTOP LIVE FOLLOWER FETCHER
// Run this on your laptop: node laptop-server/run.mjs
// Keep it running while your laptop is active during the day.
// ============================================================
// Zero data loss:
// - Never deletes any profile or history
// - Only updates today's count and live_at timestamp in follower_history
// - Preserves all existing history and stats
// ============================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kmamqlbtiqmfsngovniw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYW1xbGJ0aXFtZnNuZ292bml3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQyNjM5NywiZXhwIjoyMDk0MDAyMzk3fQ.lJvcaTRDJdB7ptMduso084CVKtiiqn4-W7PgVhHqkKA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const FETCH_DELAY_MS = 2000 // 2s delay between batch scrapes
const POLL_INTERVAL_MS = 3000 // poll queue every 3s

// ─── Headers for Instagram Scraping ──────────────────────────
const PAGE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

const XHR_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-IG-App-ID': '936619743392459',
  'X-IG-WWW-Claim': '0',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
}

const HANDLE_ALIASES = {
  'vidya.balan': 'balanvidya',
  'raj.kumar.rao': 'rajkummar_rao',
  'jayam.ravi': 'jayamravi_official',
  'surya.kumar.yadav': 'surya_14kumar',
  'kolkata.knight.riders': 'kkriders',
  'adah.sharma': 'adah_ki_adah',
  'shikhar.dhawan': 'shikhardofficial',
  'chennai.super.kings': 'chennaiipl',
  'dilijit.dosanjh': 'diljitdosanjh',
  'chinki.minki': 'surabhi.samriddhi',
  'nischay.malhan': 'triggeredinsaan',
  'bharatiya.janata.party': 'bjp4india',
}

function parseCountFromMeta(meta) {
  if (!meta) return 0
  const match = meta.match(/([\d,.]+)([KkMmBb]?)\s+Followers/i)
  if (!match) return 0
  const numStr = match[1].replace(/,/g, '')
  const num = parseFloat(numStr)
  const unit = (match[2] || '').toUpperCase()
  if (unit === 'M') return Math.round(num * 1000000)
  if (unit === 'K') return Math.round(num * 1000)
  if (unit === 'B') return Math.round(num * 1000000000)
  return Math.round(num)
}

function extractNumber(html, field) {
  const patterns = [
    new RegExp(`"${field}"\\s*:\\s*(\\d+)`),
    new RegExp(`'${field}'\\s*:\\s*(\\d+)`),
  ]
  for (const pat of patterns) {
    const m = html.match(pat)
    if (m?.[1]) return parseInt(m[1], 10)
  }
  return 0
}

function parseProfileFromHTML(html, handle) {
  const metaMatch = html.match(
    /<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/i
  )
  const metaFollowers = metaMatch ? parseCountFromMeta(metaMatch[1]) : 0

  if (
    !html.includes('"follower_count"') &&
    !html.includes('"edge_followed_by"') &&
    !metaFollowers
  ) {
    throw new Error(`No follower count found in HTML for @${handle}`)
  }

  const followersCount =
    extractNumber(html, 'follower_count') ||
    (() => {
      const edge = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/)
      return edge?.[1] ? parseInt(edge[1], 10) : 0
    })() ||
    metaFollowers

  return followersCount
}

async function getLiveSettings() {
  const { data } = await supabase.from('live_settings').select('*').eq('id', 1).maybeSingle()
  return data || {}
}

async function fetchFollowerCount(username) {
  let handle = username.trim().replace(/^@/, '').replace(/\s+/g, '').toLowerCase()
  if (HANDLE_ALIASES[handle]) handle = HANDLE_ALIASES[handle]

  const profileUrl = `https://www.instagram.com/${handle}/`

  // Strategy 1: Fast unauthenticated fetch
  try {
    const res = await fetch(profileUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
      headers: { ...PAGE_HEADERS, Referer: 'https://www.instagram.com/' },
    })
    if (res.ok) {
      const html = await res.text()
      const count = parseProfileFromHTML(html, handle)
      if (count > 0) return count
    }
  } catch (err) {
    // fall through to strategy 2
  }

  // Strategy 2: Authenticated fallback with session cookies
  const settings = await getLiveSettings()
  const rawSession = settings.instagram_session_id || ''
  const rawCsrf = settings.instagram_csrf_token || ''

  if (rawSession) {
    let cookieHeader = rawSession
    if (!cookieHeader.includes('sessionid=')) {
      cookieHeader = `sessionid=${rawSession}; csrftoken=${rawCsrf}`
    }

    const infoUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`
    const res = await fetch(infoUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(9000),
      headers: {
        ...XHR_HEADERS,
        Origin: 'https://www.instagram.com',
        Referer: `https://www.instagram.com/${handle}/`,
        Cookie: cookieHeader,
        ...(rawCsrf ? { 'X-CSRFToken': rawCsrf } : {}),
      },
    })

    if (res.ok) {
      const json = await res.json()
      const count = json?.data?.user?.edge_followed_by?.count || 0
      if (count > 0) return count
    }
  }

  throw new Error(`Failed to scrape live count for @${handle}`)
}

function formatFollowersText(count) {
  if (count >= 1000000000) return `${(Math.floor(count / 100000000) / 10).toString().replace(/\.0$/, '')}B`
  if (count >= 1000000) return `${(Math.floor(count / 100000) / 10).toString().replace(/\.0$/, '')}M`
  if (count >= 1000) return `${(Math.floor(count / 100) / 10).toString().replace(/\.0$/, '')}K`
  return count.toString()
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// ─── Update Profile in Supabase ──────────────────────────────
async function saveLiveCount(handle, liveCount) {
  const cleanHandle = handle.toLowerCase().trim().replace(/^@/, '')
  const today = todayISO()
  const nowMs = Date.now()

  // 1. Fetch current profile
  const { data: profile, error } = await supabase
    .from('most_followed')
    .select('id, instagram_handle, followers_count, followers_text, follower_history')
    .ilike('instagram_handle', cleanHandle)
    .maybeSingle()

  if (error || !profile) {
    console.warn(`[save] Profile @${cleanHandle} not found in database`)
    return false
  }

  // 2. Safely update follower_history for today
  let history = Array.isArray(profile.follower_history) ? [...profile.follower_history] : []
  const todayIdx = history.findIndex((h) => h && h.date === today)

  if (todayIdx >= 0) {
    history[todayIdx] = {
      ...history[todayIdx],
      count: liveCount,
      live_at: nowMs,
    }
  } else {
    history.push({
      date: today,
      count: liveCount,
      live_at: nowMs,
    })
  }

  // Ensure chronological order
  history.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const followersText = formatFollowersText(liveCount)

  // 3. Update database row
  const { error: updateErr } = await supabase
    .from('most_followed')
    .update({
      followers_count: liveCount,
      followers_text: followersText,
      follower_history: history,
    })
    .eq('id', profile.id)

  if (updateErr) {
    console.error(`[save] Error updating @${cleanHandle}:`, updateErr.message)
    return false
  }

  return true
}

// ─── Queue Polling Loop ───────────────────────────────────────
let isProcessingQueue = false

async function checkQueue() {
  if (isProcessingQueue) return
  isProcessingQueue = true

  try {
    const { data: stateRow } = await supabase
      .from('live_settings')
      .select('instagram_session_id')
      .eq('id', 99)
      .maybeSingle()

    if (!stateRow?.instagram_session_id) {
      isProcessingQueue = false
      return
    }

    let state
    try {
      state = JSON.parse(stateRow.instagram_session_id)
    } catch {
      isProcessingQueue = false
      return
    }

    const queue = Array.isArray(state.queue) ? state.queue : []
    const pendingItems = queue.filter((item) => item.status === 'pending')

    if (pendingItems.length > 0) {
      console.log(`\n📥 Found ${pendingItems.length} pending live profile request(s)...`)

      for (const item of pendingItems) {
        console.log(`[Queue] Fetching @${item.handle}...`)
        try {
          const count = await fetchFollowerCount(item.handle)
          const saved = await saveLiveCount(item.handle, count)
          if (saved) {
            console.log(`  ✅ @${item.handle}: ${count.toLocaleString()} (saved to DB)`)
            item.status = 'done'
            item.count = count
            item.finished_at = Date.now()
          } else {
            item.status = 'failed'
          }
        } catch (err) {
          console.error(`  ❌ @${item.handle} failed:`, err.message)
          item.status = 'failed'
          item.error = err.message
        }

        // Save progress back to state
        await supabase
          .from('live_settings')
          .upsert({
            id: 99,
            live_date: 'live_sync_state',
            instagram_session_id: JSON.stringify(state),
          })

        await sleep(1000)
      }
    }

    // Check Batch Job
    if (state.batch_job?.requested === true && state.batch_job?.status !== 'running') {
      await runBatchJob(state)
    }
  } catch (err) {
    console.error('[checkQueue] Error:', err.message)
  } finally {
    isProcessingQueue = false
  }
}

// ─── Batch Job Runner (All Profiles) ──────────────────────────
async function runBatchJob(state) {
  console.log('\n🚀 Starting Batch Live Fetch for ALL Profiles...')
  state.batch_job.status = 'running'
  state.batch_job.requested = false
  state.batch_job.progress = 0

  await supabase.from('live_settings').upsert({
    id: 99,
    live_date: 'live_sync_state',
    instagram_session_id: JSON.stringify(state),
  })

  // Fetch all profiles from most_followed
  let allProfiles = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('most_followed')
      .select('id, instagram_handle')
      .order('followers_count', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error || !data || data.length === 0) break
    allProfiles = allProfiles.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

  const total = allProfiles.length
  state.batch_job.total = total
  console.log(`[Batch] Found ${total} profiles to scrape.`)

  let updated = 0
  let failed = 0

  for (let i = 0; i < allProfiles.length; i++) {
    const p = allProfiles[i]
    const handle = p.instagram_handle
    if (!handle) continue

    process.stdout.write(`[Batch ${i + 1}/${total}] @${handle}... `)
    try {
      const count = await fetchFollowerCount(handle)
      await saveLiveCount(handle, count)
      updated++
      process.stdout.write(`✅ ${count.toLocaleString()}\n`)
    } catch (err) {
      failed++
      process.stdout.write(`❌ ${err.message}\n`)
    }

    state.batch_job.progress = i + 1
    state.batch_job.updated = updated
    state.batch_job.failed = failed
    state.batch_job.last_handle = handle

    // Persist batch progress every 5 accounts
    if ((i + 1) % 5 === 0 || i === allProfiles.length - 1) {
      await supabase.from('live_settings').upsert({
        id: 99,
        live_date: 'live_sync_state',
        instagram_session_id: JSON.stringify(state),
      })
    }

    await sleep(FETCH_DELAY_MS)
  }

  state.batch_job.status = 'done'
  state.batch_job.last_completed_at = new Date().toISOString()
  await supabase.from('live_settings').upsert({
    id: 99,
    live_date: 'live_sync_state',
    instagram_session_id: JSON.stringify(state),
  })

  console.log(`\n🎉 Batch Job Finished! ✅ ${updated} updated, ❌ ${failed} failed.\n`)
}

// ─── Start Polling ────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('⚡ Spialr Laptop Live Follower Worker is Active!')
console.log(`   Polling Supabase every ${POLL_INTERVAL_MS / 1000}s for live profile visits...`)
console.log('   Batch scrapes run safely at 1 profile per 2 seconds.')
console.log('   Press Ctrl+C to stop.')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

checkQueue()
setInterval(checkQueue, POLL_INTERVAL_MS)
