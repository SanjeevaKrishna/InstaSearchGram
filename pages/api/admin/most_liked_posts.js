import { getAdminClient } from '../../../lib/supabase'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getCloudinaryPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null
  try {
    const parts = url.split('/image/upload/')
    if (parts.length < 2) return null
    
    let path = parts[1]
    const pathParts = path.split('/')
    if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
      pathParts.shift()
      path = pathParts.join('/')
    }
    
    const lastDot = path.lastIndexOf('.')
    if (lastDot !== -1) {
      path = path.substring(0, lastDot)
    }
    return path
  } catch (err) {
    console.error('Error parsing Cloudinary URL:', err)
    return null
  }
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

    // GET - list all most liked posts
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('most_liked_posts')
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

      return res.status(200).json({ posts: sorted })
    }

    // POST - add a new most liked post
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
        .from('most_liked_posts')
        .insert([payload])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ post: data })
    }

    // PUT - update a most liked post
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
        .from('most_liked_posts')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ post: data })
    }

    // DELETE - remove a most liked post
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      // Fetch the post first to clean up its images
      const { data: post } = await supabase
        .from('most_liked_posts')
        .select('photo_url, creator_photo_url')
        .eq('id', id)
        .maybeSingle()

      const { error } = await supabase
        .from('most_liked_posts')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Clean up uploaded files in Cloudinary
      if (post) {
        if (post.photo_url) {
          const publicId = getCloudinaryPublicId(post.photo_url)
          if (publicId) await cloudinary.uploader.destroy(publicId).catch(console.error)
        }
        if (post.creator_photo_url) {
          const publicId = getCloudinaryPublicId(post.creator_photo_url)
          if (publicId) await cloudinary.uploader.destroy(publicId).catch(console.error)
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
