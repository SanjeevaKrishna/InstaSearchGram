import { getAdminClient } from '../../../lib/supabase'

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

export default async function handler(req, res) {
  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = getAdminClient()

    // GET - list all celebrities (paginated to fetch all, bypassing 1000-row limit)
    if (req.method === 'GET') {
      let celebritiesData = []
      let from = 0
      let to = 999
      while (true) {
        const { data, error } = await supabase
          .from('celebrities')
          .select('*')
          .order('order_index', { ascending: true })
          .order('name')
          .range(from, to)

        if (error) return res.status(500).json({ error: error.message })
        celebritiesData = celebritiesData.concat(data || [])
        if (!data || data.length < 1000) break
        from += 1000
        to += 1000
      }
      return res.status(200).json({ celebrities: celebritiesData })
    }

    // POST - add new celebrity
    if (req.method === 'POST') {
      const { name, instagram_handle, followers_count, posts_count, photo_url, is_featured, has_full_details, order_index, total_reel_views, total_reel_likes, total_post_likes, total_comments, total_shares, total_reposts, hide_search, description, average_views, average_reel_likes, average_post_likes, followers_interaction, most_likes, account_created_year, most_liked_count, most_commented_count, most_viewed_count, most_liked_date, most_commented_date, most_viewed_date } = req.body

      const cleanHandle = instagram_handle ? instagram_handle.trim().toLowerCase().replace(/^@/, '') : ''
      let finalName = name ? name.trim() : ''

      if (!finalName && !cleanHandle) {
        return res.status(400).json({ error: 'Please provide either a Name or an Instagram Handle' })
      }

      if (!finalName) {
        // Auto-generate clean display name from handle until scraped
        finalName = cleanHandle.replace(/[\._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }

      // Auto generate slug from name or handle
      const baseSlug = (name ? name.trim() : cleanHandle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const slug = baseSlug || cleanHandle || ('celebrity-' + Date.now())

      const manualFields = {
        name_manual: name && name.trim() ? name.trim() : null,
        description_manual: description || null,
        followers_manual: followers_count ? Number(followers_count) : null,
        posts_manual: posts_count ? Number(posts_count) : null,
        total_reel_views_manual: total_reel_views ? Number(total_reel_views) : null,
        total_reel_likes_manual: total_reel_likes ? Number(total_reel_likes) : null,
        total_post_likes_manual: total_post_likes ? Number(total_post_likes) : null,
        total_comments_manual: total_comments ? Number(total_comments) : null,
        average_views_manual: average_views ? Number(average_views) : null,
        average_reel_likes_manual: average_reel_likes ? Number(average_reel_likes) : null,
        average_post_likes_manual: average_post_likes ? Number(average_post_likes) : null,
        followers_interaction_manual: followers_interaction ? Number(followers_interaction) : null,
        most_likes_manual: most_likes ? Number(most_likes) : null,
        most_liked_count_manual: most_liked_count || null,
        most_commented_count_manual: most_commented_count || null,
        most_viewed_count_manual: most_viewed_count || null,
        most_liked_date_manual: most_liked_date || null,
        most_commented_date_manual: most_commented_date || null,
        most_viewed_date_manual: most_viewed_date || null,
      }

      const { data, error } = await supabase
        .from('celebrities')
        .insert([{
          ...manualFields,
          // computed fields (since it's a new row, manual is all we have)
          name: manualFields.name_manual,
          description: manualFields.description_manual || '',
          followers_count: manualFields.followers_manual || 0,
          posts_count: manualFields.posts_manual || 0,
          total_reel_views: manualFields.total_reel_views_manual || 0,
          total_reel_likes: manualFields.total_reel_likes_manual || 0,
          total_post_likes: manualFields.total_post_likes_manual || 0,
          total_comments: manualFields.total_comments_manual || 0,
          average_views: manualFields.average_views_manual || 0,
          average_reel_likes: manualFields.average_reel_likes_manual || 0,
          average_post_likes: manualFields.average_post_likes_manual || 0,
          followers_interaction: manualFields.followers_interaction_manual || 0,
          most_likes: manualFields.most_likes_manual || 0,
          most_liked_count: manualFields.most_liked_count_manual || null,
          most_commented_count: manualFields.most_commented_count_manual || null,
          most_viewed_count: manualFields.most_viewed_count_manual || null,
          most_liked_date: manualFields.most_liked_date_manual || null,
          most_commented_date: manualFields.most_commented_date_manual || null,
          most_viewed_date: manualFields.most_viewed_date_manual || null,

          // purely manual fields
          slug, instagram_handle, photo_url,
          is_featured: is_featured || false,
          has_full_details: has_full_details || false,
          request_count: 0,
          order_index: order_index ? Number(order_index) : 0,
          total_shares: total_shares ? Number(total_shares) : 0,
          total_reposts: total_reposts ? Number(total_reposts) : 0,
          hide_search: hide_search || false,
          account_created_year: account_created_year ? Number(account_created_year) : null,
        }])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ celebrity: data })
    }

    // PUT - update celebrity
    if (req.method === 'PUT') {
      const { id, name, instagram_handle, followers_count, posts_count, photo_url, is_featured, has_full_details, request_count, order_index, total_reel_views, total_reel_likes, total_post_likes, total_comments, total_shares, total_reposts, hide_search, description, average_views, average_reel_likes, average_post_likes, followers_interaction, most_likes, account_created_year, most_liked_count, most_commented_count, most_viewed_count, most_liked_date, most_commented_date, most_viewed_date } = req.body
      if (!id) return res.status(400).json({ error: 'ID required' })

      const { data: existing, error: fetchError } = await supabase.from('celebrities').select('*').eq('id', id).single()
      if (fetchError) return res.status(500).json({ error: fetchError.message })

      const manualFields = {
        name_manual: name || null,
        description_manual: description !== undefined ? (description || null) : existing.description_manual,
        followers_manual: followers_count !== undefined && followers_count !== '' && followers_count !== null ? Number(followers_count) : null,
        posts_manual: posts_count !== undefined && posts_count !== '' && posts_count !== null ? Number(posts_count) : null,
        total_reel_views_manual: total_reel_views !== undefined && total_reel_views !== '' && total_reel_views !== null ? Number(total_reel_views) : null,
        total_reel_likes_manual: total_reel_likes !== undefined && total_reel_likes !== '' && total_reel_likes !== null ? Number(total_reel_likes) : null,
        total_post_likes_manual: total_post_likes !== undefined && total_post_likes !== '' && total_post_likes !== null ? Number(total_post_likes) : null,
        total_comments_manual: total_comments !== undefined && total_comments !== '' && total_comments !== null ? Number(total_comments) : null,
        average_views_manual: average_views !== undefined && average_views !== '' && average_views !== null ? Number(average_views) : null,
        average_reel_likes_manual: average_reel_likes !== undefined && average_reel_likes !== '' && average_reel_likes !== null ? Number(average_reel_likes) : null,
        average_post_likes_manual: average_post_likes !== undefined && average_post_likes !== '' && average_post_likes !== null ? Number(average_post_likes) : null,
        followers_interaction_manual: followers_interaction !== undefined && followers_interaction !== '' && followers_interaction !== null ? Number(followers_interaction) : null,
        most_likes_manual: most_likes !== undefined && most_likes !== '' && most_likes !== null ? Number(most_likes) : null,
        most_liked_count_manual: most_liked_count !== undefined && most_liked_count !== '' ? most_liked_count : null,
        most_commented_count_manual: most_commented_count !== undefined && most_commented_count !== '' ? most_commented_count : null,
        most_viewed_count_manual: most_viewed_count !== undefined && most_viewed_count !== '' ? most_viewed_count : null,
        most_liked_date_manual: most_liked_date !== undefined && most_liked_date !== '' ? most_liked_date : null,
        most_commented_date_manual: most_commented_date !== undefined && most_commented_date !== '' ? most_commented_date : null,
        most_viewed_date_manual: most_viewed_date !== undefined && most_viewed_date !== '' ? most_viewed_date : null,
      }

      const { data, error } = await supabase
        .from('celebrities')
        .update({
          ...manualFields,
          // compute fields: manual ?? scraped
          name: manualFields.name_manual || existing.name_scraped || manualFields.name_manual,
          description: manualFields.description_manual || existing.description_scraped || (manualFields.description_manual || ''),
          followers_count: manualFields.followers_manual || existing.followers_scraped || (manualFields.followers_manual || 0),
          posts_count: manualFields.posts_manual || existing.posts_scraped || (manualFields.posts_manual || 0),
          total_reel_views: manualFields.total_reel_views_manual || existing.total_reel_views_scraped || (manualFields.total_reel_views_manual || 0),
          total_reel_likes: manualFields.total_reel_likes_manual || existing.total_reel_likes_scraped || (manualFields.total_reel_likes_manual || 0),
          total_post_likes: manualFields.total_post_likes_manual || existing.total_post_likes_scraped || (manualFields.total_post_likes_manual || 0),
          total_comments: manualFields.total_comments_manual || existing.total_comments_scraped || (manualFields.total_comments_manual || 0),
          average_views: manualFields.average_views_manual || existing.average_views_scraped || (manualFields.average_views_manual || 0),
          average_reel_likes: manualFields.average_reel_likes_manual || existing.average_reel_likes_scraped || (manualFields.average_reel_likes_manual || 0),
          average_post_likes: manualFields.average_post_likes_manual || existing.average_post_likes_scraped || (manualFields.average_post_likes_manual || 0),
          followers_interaction: manualFields.followers_interaction_manual || existing.followers_interaction_scraped || (manualFields.followers_interaction_manual || 0),
          most_likes: manualFields.most_likes_manual || existing.most_likes_scraped || (manualFields.most_likes_manual || 0),
          most_liked_count: manualFields.most_liked_count_manual || existing.most_liked_count_scraped || manualFields.most_liked_count_manual,
          most_commented_count: manualFields.most_commented_count_manual || existing.most_commented_count_scraped || manualFields.most_commented_count_manual,
          most_viewed_count: manualFields.most_viewed_count_manual || existing.most_viewed_count_scraped || manualFields.most_viewed_count_manual,
          most_liked_date: manualFields.most_liked_date_manual || existing.most_liked_date_scraped || manualFields.most_liked_date_manual,
          most_commented_date: manualFields.most_commented_date_manual || existing.most_commented_date_scraped || manualFields.most_commented_date_manual,
          most_viewed_date: manualFields.most_viewed_date_manual || existing.most_viewed_date_scraped || manualFields.most_viewed_date_manual,
          
          // purely manual fields
          instagram_handle, photo_url,
          is_featured,
          has_full_details: has_full_details || false,
          request_count: request_count || 0,
          order_index: order_index ? Number(order_index) : 0,
          total_shares: total_shares ? Number(total_shares) : 0,
          total_reposts: total_reposts ? Number(total_reposts) : 0,
          hide_search: hide_search || false,
          account_created_year: account_created_year !== undefined ? (account_created_year ? Number(account_created_year) : null) : null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ celebrity: data })
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID required' })

      // Delete all posts first
      await supabase.from('posts').delete().eq('celebrity_id', id)
      const { error } = await supabase.from('celebrities').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
