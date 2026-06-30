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

export default async function handler(req, res) {
  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = getAdminClient()

    // GET - list all viral reels
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('viral_reels')
        .select('*')

      if (error) return res.status(500).json({ error: error.message })

      // Sort by manual rank (order_index) ascending, then created_at descending
      const sorted = (data || []).sort((a, b) => {
        const rankA = a.order_index || 999999
        const rankB = b.order_index || 999999
        if (rankA !== rankB) {
          return rankA - rankB
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })

      return res.status(200).json({ reels: sorted })
    }

    // POST - add a new viral reel
    if (req.method === 'POST') {
      const { title, photo_url, instagram_link, order_index, creator_name, creator_photo_url } = req.body
      if (!title) return res.status(400).json({ error: 'Title is required' })
      if (!instagram_link) return res.status(400).json({ error: 'Instagram link is required' })

      const payload = {
        title,
        photo_url,
        instagram_link,
        order_index: order_index ? Number(order_index) : 0,
        creator_name: creator_name || '',
        creator_photo_url: creator_photo_url || ''
      }

      const { data, error } = await supabase
        .from('viral_reels')
        .insert([payload])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ reel: data })
    }

    // PUT - update a viral reel
    if (req.method === 'PUT') {
      const { id, title, photo_url, instagram_link, order_index, creator_name, creator_photo_url } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })
      if (!title) return res.status(400).json({ error: 'Title is required' })
      if (!instagram_link) return res.status(400).json({ error: 'Instagram link is required' })

      const payload = {
        title,
        photo_url,
        instagram_link,
        order_index: order_index ? Number(order_index) : 0,
        creator_name: creator_name || '',
        creator_photo_url: creator_photo_url || ''
      }

      const { data, error } = await supabase
        .from('viral_reels')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ reel: data })
    }

    // DELETE - remove a viral reel
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      // Fetch the reel first to clean up its images
      const { data: reel } = await supabase
        .from('viral_reels')
        .select('photo_url, creator_photo_url')
        .eq('id', id)
        .maybeSingle()

      const { error } = await supabase
        .from('viral_reels')
        .delete()
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Clean up uploaded files in Cloudinary
      if (reel) {
        if (reel.photo_url) {
          const publicId = getCloudinaryPublicId(reel.photo_url)
          if (publicId) await cloudinary.uploader.destroy(publicId).catch(console.error)
        }
        if (reel.creator_photo_url) {
          const publicId = getCloudinaryPublicId(reel.creator_photo_url)
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
