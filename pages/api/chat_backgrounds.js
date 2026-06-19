import { getAdminClient } from '../../lib/supabase'

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
  const supabase = getAdminClient()

  // 1. GET: Publicly read all chat backgrounds (no auth required)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('chat_backgrounds')
        .select('*')

      if (error) throw error

      // Convert array to a room key-value map for easier frontend consumption
      const backgroundsMap = {}
      if (data) {
        data.forEach(bg => {
          backgroundsMap[bg.room] = bg.image_url
        })
      }

      return res.status(200).json({ backgrounds: backgroundsMap })
    } catch (err) {
      console.error('Fetch chat backgrounds error:', err)
      return res.status(500).json({ error: 'Failed to fetch chat backgrounds' })
    }
  }

  // Admin-only endpoints below
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. POST: Save / update background image for a room
  if (req.method === 'POST') {
    const { room, image_url } = req.body

    if (!room || !image_url) {
      return res.status(400).json({ error: 'Room and Image URL are required' })
    }

    const validRooms = ['all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam']
    if (!validRooms.includes(room.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid room specified' })
    }

    try {
      const { data, error } = await supabase
        .from('chat_backgrounds')
        .upsert([{ room: room.toLowerCase(), image_url }], { onConflict: 'room' })
        .select()

      if (error) throw error
      return res.status(200).json({ success: true, background: data[0] })
    } catch (err) {
      console.error('Upsert chat background error:', err)
      return res.status(500).json({ error: 'Failed to save chat background' })
    }
  }

  // 3. DELETE: Remove background image for a room
  if (req.method === 'DELETE') {
    const { room } = req.body

    if (!room) {
      return res.status(400).json({ error: 'Room is required' })
    }

    try {
      const { data, error } = await supabase
        .from('chat_backgrounds')
        .delete()
        .eq('room', room.toLowerCase())
        .select()

      if (error) throw error
      return res.status(200).json({ success: true, deleted: data })
    } catch (err) {
      console.error('Delete chat background error:', err)
      return res.status(500).json({ error: 'Failed to delete chat background' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
