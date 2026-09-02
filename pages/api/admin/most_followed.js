import { getAdminClient } from '../../../lib/supabase'
import { recalculateVotingRanks } from '../../../lib/voting'
import { InstagramFollowersScraper } from '../../../lib/followersScraper'

function verifyAdmin(req) {
  const auth = req.headers['x-admin-token']
  if (!auth) return false
  try {
    const decoded = Buffer.from(auth, 'base64').toString('utf8')
    return decoded === process.env.ADMIN_SECRET_CODE + ':admin'
  } catch {
    return false
  }
}

function parseCountText(text) {
  if (!text) return 0;
  const cleaned = text.toString().trim().toLowerCase();
  const numMatch = cleaned.match(/^([0-9.]+)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1]);
  if (isNaN(num)) return 0;
  
  if (cleaned.includes('b') || cleaned.includes('billion')) {
    return num * 1000000000;
  }
  if (cleaned.includes('m') || cleaned.includes('million')) {
    return num * 1000000;
  }
  if (cleaned.includes('k') || cleaned.includes('thousand')) {
    return num * 1000;
  }
  if (cleaned.includes('crore') || cleaned.includes('cr')) {
    return num * 10000000;
  }
  if (cleaned.includes('lakh') || cleaned.includes('l')) {
    return num * 100000;
  }
  return num;
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

function generateRealisticBaselineHistory(currentCount) {
  if (!currentCount || currentCount <= 0) return []
  const delta = getRealisticDelta(currentCount)
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]
  const baselineCount = Math.max(100, currentCount - delta)

  return [
    { date: yesterdayStr, count: baselineCount },
    { date: todayStr, count: currentCount }
  ]
}

export default async function handler(req, res) {
  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = getAdminClient()

    // GET - list all most followed accounts (paginated to fetch all, bypassing 1000-row limit)
    if (req.method === 'GET') {
      let profilesData = []
      let from = 0
      let to = 999
      while (true) {
        const { data, error } = await supabase
          .from('most_followed')
          .select('*')
          .order('followers_count', { ascending: false })
          .range(from, to)

        if (error) return res.status(500).json({ error: error.message })
        profilesData = profilesData.concat(data || [])
        if (!data || data.length < 1000) break
        from += 1000
        to += 1000
      }
      return res.status(200).json({ profiles: profilesData })
    }

    // POST - add a new profile
    if (req.method === 'POST') {
      const { name, photo_url, followers_text, order_index, category, language, instagram_handle } = req.body
      if (!name) return res.status(400).json({ error: 'Name is required' })

      const calculatedFollowersCount = parseCountText(followers_text)
      const initialHistory = generateRealisticBaselineHistory(calculatedFollowersCount)

      const payload = {
        name,
        photo_url,
        followers_count: calculatedFollowersCount,
        followers_text: followers_text || '',
        order_index: order_index ? Number(order_index) : 0,
        category: category || '',
        language: language || null,
        votes: 0,
        instagram_handle: instagram_handle || null,
        follower_history: initialHistory
      }

      const { data, error } = await supabase
        .from('most_followed')
        .insert([payload])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })

      // Trigger ranking recalculation
      await recalculateVotingRanks()

      return res.status(201).json({ profile: data })
    }

    // PUT - update a profile or trigger auto-reordering
    if (req.method === 'PUT') {
      const { id, name, photo_url, followers_count, followers_text, order_index, category, language, instagram_handle, action, votes, follower_history } = req.body

      // Sub-action: Reorder profiles by followers count descending
      if (action === 'reorder') {
        // 1. Fetch all records (paginated to load all)
        let allProfiles = []
        let from = 0
        let to = 999
        while (true) {
          const { data, error: fetchErr } = await supabase
            .from('most_followed')
            .select('*')
            .range(from, to)

          if (fetchErr) return res.status(500).json({ error: fetchErr.message })
          allProfiles = allProfiles.concat(data || [])
          if (!data || data.length < 1000) break
          from += 1000
          to += 1000
        }

        // 2. Sort by followers_count desc
        const sorted = [...allProfiles].sort((a, b) => {
          const countA = Number(a.followers_count || 0)
          const countB = Number(b.followers_count || 0)
          return countB - countA
        })

        // 3. Update order_index sequentially
        for (let i = 0; i < sorted.length; i++) {
          const profile = sorted[i]
          const { error: updateErr } = await supabase
            .from('most_followed')
            .update({ order_index: i + 1 })
            .eq('id', profile.id)

          if (updateErr) return res.status(500).json({ error: updateErr.message })
        }

        // 4. Return the refreshed ordered list (paginated to fetch all)
        let updatedProfiles = []
        let finalFrom = 0
        let finalTo = 999
        while (true) {
          const { data: pageData, error: finalErr } = await supabase
            .from('most_followed')
            .select('*')
            .order('followers_count', { ascending: false })
            .range(finalFrom, finalTo)

          if (finalErr) return res.status(500).json({ error: finalErr.message })
          updatedProfiles = updatedProfiles.concat(pageData || [])
          if (!pageData || pageData.length < 1000) break
          finalFrom += 1000
          finalTo += 1000
        }
        return res.status(200).json({ profiles: updatedProfiles, success: true })
      }
      
      // Sub-action: Set votes and recalculate ranks
      if (action === 'set_votes') {
        if (!id) return res.status(400).json({ error: 'ID is required' })

        const { error: updateErr } = await supabase
          .from('most_followed')
          .update({ votes: Number(votes || 0) })
          .eq('id', id)

        if (updateErr) return res.status(500).json({ error: updateErr.message })

        // Recalculate ranks instantly
        await recalculateVotingRanks()

        return res.status(200).json({ success: true })
      }

      // Sub-action: Scrape Instagram followers and update the count
      if (action === 'scrape_followers') {
        if (!id) return res.status(400).json({ error: 'ID is required' })

        // 1. Fetch the profile to get the instagram_handle
        const { data: profile, error: fetchErr } = await supabase
          .from('most_followed')
          .select('instagram_handle, name, follower_history')
          .eq('id', id)
          .single()

        if (fetchErr || !profile) {
          return res.status(404).json({ error: 'Profile not found' })
        }

        if (!profile.instagram_handle) {
          return res.status(400).json({ error: 'Instagram handle is missing for this profile' })
        }

        // Retrieve cookies from live_settings database table first, fallback to .env.local
        const { data: settingsData } = await supabase
          .from('live_settings')
          .select('instagram_session_id, instagram_csrf_token')
          .eq('id', 1)
          .maybeSingle()

        const sessionId = settingsData?.instagram_session_id || process.env.INSTAGRAM_SESSION_ID || "";
        const csrfToken = settingsData?.instagram_csrf_token || process.env.INSTAGRAM_CSRF_TOKEN || "";

        // 2. Run scraper on server side
        const scraper = new InstagramFollowersScraper(sessionId, csrfToken);
        let scrapeData;
        try {
          scrapeData = await scraper.fetchFollowers(profile.instagram_handle);
        } catch (scrapeErr) {
          if (scrapeErr.message.includes('404') || scrapeErr.message.includes('does not exist') || scrapeErr.message.includes('No follower_count')) {
            return res.status(400).json({ error: `Instagram profile "@${profile.instagram_handle}" does not exist or was renamed on Instagram (404). Please check the username or update it to a valid handle.` });
          }
          return res.status(500).json({ error: `Scrape error for "@${profile.instagram_handle}": ${scrapeErr.message}` });
        }

        // 3. Format the count text (e.g. 270M, 1.5M, 500K)
        let formattedText = '';
        const count = scrapeData.followersCount;
        if (count >= 1000000000) {
          formattedText = `${(Math.floor(count / 100000000) / 10).toString().replace(/\.0$/, '')}B`;
        } else if (count >= 1000000) {
          formattedText = `${(Math.floor(count / 100000) / 10).toString().replace(/\.0$/, '')}M`;
        } else if (count >= 1000) {
          formattedText = `${(Math.floor(count / 100) / 10).toString().replace(/\.0$/, '')}K`;
        } else {
          formattedText = count.toString();
        }

        // 4. Update followers count and append/update history in the DB
        let history = [];
        try {
          history = Array.isArray(profile.follower_history) ? profile.follower_history : [];
        } catch (e) {
          history = [];
        }

        // Record exact calendar date for daily growth pulse (with 12 AM - 6 AM grace period)
        const now = new Date();
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffsetMs);
        const istHour = istDate.getUTCHours();
        let targetDate = istDate.toISOString().split('T')[0];
        if (istHour < 6) {
          const yesterday = new Date(istDate.getTime() - 24 * 60 * 60 * 1000);
          targetDate = yesterday.toISOString().split('T')[0];
        }

        const existingIdx = history.findIndex(h => h.date === targetDate);
        if (existingIdx !== -1) {
          history[existingIdx].count = count;
        } else {
          history.push({ date: targetDate, count: count });
        }

        // If newly added profile with only 1 history date, automatically seed yesterday's baseline
        if (history.length === 1) {
          const delta = getRealisticDelta(count);
          const parsedTarget = new Date(targetDate);
          const priorDate = new Date(parsedTarget.getTime() - 24 * 60 * 60 * 1000);
          const priorDateStr = priorDate.toISOString().split('T')[0];
          history.unshift({ date: priorDateStr, count: Math.max(100, count - delta) });
        }

        // Sort history by date ascending
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Keep up to 365 daily records
        if (history.length > 365) {
          history = history.slice(-365);
        }

        const { data: updatedProfile, error: updateErr } = await supabase
          .from('most_followed')
          .update({
            followers_count: count,
            followers_text: formattedText,
            follower_history: history
          })
          .eq('id', id)
          .select()
          .single()

        if (updateErr) return res.status(500).json({ error: updateErr.message })

        // Recalculate ranks instantly after updating count
        await recalculateVotingRanks()

        return res.status(200).json({ profile: updatedProfile })
      }

      // Normal single record update
      if (!id) return res.status(400).json({ error: 'ID is required' })

      const calculatedFollowersCount = parseCountText(followers_text)

      const payload = {
        ...(name !== undefined ? { name } : {}),
        ...(photo_url !== undefined ? { photo_url } : {}),
        ...(followers_count !== undefined ? { followers_count: Number(followers_count) } : (followers_text ? { followers_count: calculatedFollowersCount } : {})),
        ...(followers_text !== undefined ? { followers_text } : {}),
        ...(order_index !== undefined ? { order_index: Number(order_index) } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(language !== undefined ? { language } : {}),
        ...(instagram_handle !== undefined ? { instagram_handle } : {}),
        ...(follower_history !== undefined ? { follower_history } : {})
      }

      const { data, error } = await supabase
        .from('most_followed')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ profile: data })
    }

    // DELETE - remove a profile
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      const { error } = await supabase
        .from('most_followed')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Recalculate ranks instantly after deleting
      await recalculateVotingRanks()

      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
