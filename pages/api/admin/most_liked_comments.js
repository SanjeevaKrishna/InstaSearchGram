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

    // GET - list all most liked comments
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('most_liked_comments')
        .select('*')

      if (error) return res.status(500).json({ error: error.message })

      // Sort automatically by parsed likes_text count descending, then created_at descending
      const sorted = (data || []).sort((a, b) => {
        const countA = parseCountText(a.likes_text)
        const countB = parseCountText(b.likes_text)
        if (countA !== countB) {
          return countB - countA
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })

      return res.status(200).json({ comments: sorted, reels: sorted })
    }

    // POST - add a new most liked comment
    if (req.method === 'POST') {
      const { title, photo_url, instagram_link, order_index, creator_name, creator_photo_url, followers_text, likes_text, created_at, description, why_notable } = req.body
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
        likes_text: likes_text || '',
        description: description || '',
        why_notable: why_notable || '',
        ...(created_at ? { created_at } : {})
      }

      const { data, error } = await supabase
        .from('most_liked_comments')
        .insert([payload])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ comment: data, reel: data })
    }

    // PUT - update a most liked comment
    if (req.method === 'PUT') {
      const { id, title, photo_url, instagram_link, order_index, creator_name, creator_photo_url, followers_text, likes_text, created_at, description, why_notable } = req.body
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
        likes_text: likes_text || '',
        description: description || '',
        why_notable: why_notable || '',
        ...(created_at ? { created_at } : {})
      }

      const { data, error } = await supabase
        .from('most_liked_comments')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ comment: data, reel: data })
    }

    // DELETE - remove a most liked comment
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      // Fetch the comment first to clean up its images
      const { data: item } = await supabase
        .from('most_liked_comments')
        .select('photo_url, creator_photo_url')
        .eq('id', id)
        .maybeSingle()

      const { error } = await supabase
        .from('most_liked_comments')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Clean up uploaded files in Supabase Storage
      if (item) {
        const filesToRemove = []
        const p1 = getStoragePathFromUrl(item.photo_url)
        if (p1) filesToRemove.push(p1)
        const p2 = getStoragePathFromUrl(item.creator_photo_url)
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
