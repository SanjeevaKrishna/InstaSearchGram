import { getAdminClient } from '../../../lib/supabase'
function getStoragePathFromUrl(url) {
  if (!url) return null
  const marker = '/storage/v1/object/public/profile-images/'
  if (url.includes(marker)) {
    return decodeURIComponent(url.split(marker)[1])
  }
  return null
}

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

    // GET - list all most viewed reels
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('most_viewed_reels')
        .select('*')

      if (error) return res.status(500).json({ error: error.message })

      // Sort automatically by parsed views_text count descending, then created_at descending
      const sorted = (data || []).sort((a, b) => {
        const countA = parseCountText(a.views_text)
        const countB = parseCountText(b.views_text)
        if (countA !== countB) {
          return countB - countA
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })

      return res.status(200).json({ reels: sorted })
    }

    // POST - add a new most viewed reel
    if (req.method === 'POST') {
      const { title, photo_url, instagram_link, order_index, creator_name, creator_photo_url, followers_text, views_text, created_at, description, why_notable, show_in_original, show_in_all_reels } = req.body
      if (!title) return res.status(400).json({ error: 'Title is required' })
      if (!instagram_link) return res.status(400).json({ error: 'Instagram link is required' })

      const payload = {
        title,
        photo_url,
        instagram_link,
        order_index: order_index ? Number(order_index) : 0,
        creator_name: creator_name || '',
        creator_photo_url: creator_photo_url || '',
        followers_text: followers_text || '',
        views_text: views_text || '',
        description: description || '',
        why_notable: why_notable || '',
        show_in_original: show_in_original !== undefined ? !!show_in_original : false,
        show_in_all_reels: show_in_all_reels !== undefined ? !!show_in_all_reels : true,
        ...(created_at ? { created_at } : {})
      }

      const { data, error } = await supabase
        .from('most_viewed_reels')
        .insert([payload])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ reel: data })
    }

    // PUT - update a most viewed reel
    if (req.method === 'PUT') {
      const { id, title, photo_url, instagram_link, order_index, creator_name, creator_photo_url, followers_text, views_text, created_at, description, why_notable, show_in_original, show_in_all_reels } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })
      if (!title) return res.status(400).json({ error: 'Title is required' })
      if (!instagram_link) return res.status(400).json({ error: 'Instagram link is required' })

      const payload = {
        title,
        photo_url,
        instagram_link,
        order_index: order_index ? Number(order_index) : 0,
        creator_name: creator_name || '',
        creator_photo_url: creator_photo_url || '',
        followers_text: followers_text || '',
        views_text: views_text || '',
        description: description || '',
        why_notable: why_notable || '',
        show_in_original: show_in_original !== undefined ? !!show_in_original : false,
        show_in_all_reels: show_in_all_reels !== undefined ? !!show_in_all_reels : true,
        ...(created_at ? { created_at } : {})
      }

      const { data, error } = await supabase
        .from('most_viewed_reels')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ reel: data })
    }

    // DELETE - remove a most viewed reel
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      // Fetch the reel first to clean up its images
      const { data: reel } = await supabase
        .from('most_viewed_reels')
        .select('photo_url, creator_photo_url')
        .eq('id', id)
        .maybeSingle()

      const { error } = await supabase
        .from('most_viewed_reels')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Clean up uploaded files in Supabase Storage
      if (reel) {
        const filesToRemove = []
        const p1 = getStoragePathFromUrl(reel.photo_url)
        if (p1) filesToRemove.push(p1)
        const p2 = getStoragePathFromUrl(reel.creator_photo_url)
        if (p2) filesToRemove.push(p2)
        if (filesToRemove.length > 0) {
          await supabase.storage.from('profile-images').remove(filesToRemove).catch(console.error)
        }
      }

      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
