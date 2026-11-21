import { supabase } from '../../../lib/supabase'
import { getFeaturedLiveIds } from '../../../lib/liveFeatured'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q, featured } = req.query

  try {
    let data = []
    let liveData = []
    let error = null

    if (featured === 'true') {
      let query = supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index, account_created_year')
        .order('order_index', { ascending: true })
        .order('name')
        .eq('is_featured', true)
        .neq('hide_search', true)
        .limit(10)
      if (q && q.trim()) {
        query = query.ilike('name', `%${q.trim()}%`)
      }
      const resData = await query
      data = resData.data
      error = resData.error

      // Also get featured live profiles
      try {
        const featuredLiveIds = await getFeaturedLiveIds(supabase)
        if (featuredLiveIds && featuredLiveIds.length > 0) {
          let liveQuery = supabase
            .from('most_followed')
            .select('id, name, instagram_handle, followers_count, photo_url')
            .in('id', featuredLiveIds)
            .limit(10)
          if (q && q.trim()) {
            liveQuery = liveQuery.ilike('name', `%${q.trim()}%`)
          }
          const { data: matchedFeaturedLive } = await liveQuery
          if (matchedFeaturedLive) {
            liveData = matchedFeaturedLive.map(item => ({
              ...item,
              slug: item.instagram_handle
                ? item.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
                : (item.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
              is_live: true
            }))
          }
        }
      } catch (err) {
        console.warn('Failed to load featured live profiles:', err.message)
      }
    } else if (req.query.limit === 'all') {
      let from = 0
      let to = 999
      while (true) {
        let query = supabase
          .from('celebrities')
          .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index, account_created_year')
          .order('order_index', { ascending: true })
          .order('name')
          .neq('hide_search', true)
          .range(from, to)
        if (q && q.trim()) {
          query = query.ilike('name', `%${q.trim()}%`)
        }
        const { data: pageData, error: pageError } = await query
        if (pageError) {
          error = pageError
          break
        }
        data = data.concat(pageData || [])
        if (!pageData || pageData.length < 1000) break
        from += 1000
        to += 1000
      }
    } else {
      let query = supabase
        .from('celebrities')
        .select('id, name, slug, instagram_handle, followers_count, posts_count, photo_url, is_featured, order_index, account_created_year')
        .order('order_index', { ascending: true })
        .order('name')
        .neq('hide_search', true)
        .limit(20)
      if (q && q.trim()) {
        const cleanQ = q.trim()
        query = query.or(`name.ilike.%${cleanQ}%,instagram_handle.ilike.%${cleanQ}%`)
      }
      const resData = await query
      data = resData.data
      error = resData.error

      // Search matching Live Profiles from most_followed table
      if (q && q.trim()) {
        try {
          const cleanQ = q.trim().toLowerCase().replace(/^@/, '')
          const { data: matchedLive } = await supabase
            .from('most_followed')
            .select('id, name, instagram_handle, followers_count, photo_url')
            .or(`name.ilike.%${cleanQ}%,instagram_handle.ilike.%${cleanQ}%`)
            .limit(10)

          if (matchedLive && matchedLive.length > 0) {
            liveData = matchedLive.map(item => ({
              ...item,
              slug: item.instagram_handle
                ? item.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
                : (item.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
              is_live: true
            }))
          }
        } catch (liveErr) {
          console.warn('Failed to search live profiles:', liveErr.message)
        }
      }
    }

    if (error) throw error

    // Set Cache-Control headers to allow Edge CDN caching
    if (!q || !q.trim()) {
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    }

    res.status(200).json({ celebrities: data || [], liveProfiles: liveData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch celebrities', celebrities: [], liveProfiles: [] })
  }
}

