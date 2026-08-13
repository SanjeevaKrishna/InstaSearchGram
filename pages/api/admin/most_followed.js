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

      const payload = {
        name,
        photo_url,
        followers_count: calculatedFollowersCount,
        followers_text: followers_text || '',
        order_index: order_index ? Number(order_index) : 0,
        category: category || '',
        language: language || null,
        votes: 0,
        instagram_handle: instagram_handle || null
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
      const { id, name, photo_url, followers_count, followers_text, order_index, category, language, instagram_handle, action, votes } = req.body

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
        const scrapeData = await scraper.fetchFollowers(profile.instagram_handle);

        // 3. Format the count text (e.g. 270M, 1.5M, 500K)
        let formattedText = '';
        const count = scrapeData.followersCount;
        if (count >= 1000000000) {
          formattedText = `${(count / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
        } else if (count >= 1000000) {
          formattedText = `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        } else if (count >= 1000) {
          formattedText = `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
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

        // Align current date to nearest Saturday
        const getSaturdayDate = (dateVal = new Date()) => {
          const result = new Date(dateVal);
          const day = result.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const diff = 6 - day;
          result.setDate(result.getDate() + diff);
          return result.toISOString().split('T')[0];
        };

        const saturdayKey = getSaturdayDate();
        const existingIdx = history.findIndex(h => h.date === saturdayKey);

        if (existingIdx !== -1) {
          history[existingIdx].count = count;
        } else {
          history.push({ date: saturdayKey, count: count });
        }

        // Sort history by date ascending
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Cap to last 52 entries (1 year of weekly records) to keep database storage footprint extremely small (free tier safety)
        if (history.length > 52) {
          history = history.slice(-52);
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
        name,
        photo_url,
        followers_count: calculatedFollowersCount,
        followers_text: followers_text || '',
        order_index: order_index ? Number(order_index) : 0,
        category: category || '',
        language: language || null,
        instagram_handle: instagram_handle || null
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
