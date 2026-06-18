import { getAdminClient } from '../../lib/supabase'

export default async function handler(req, res) {
  const supabase = getAdminClient()

  // 1. Transient Cleanup (run on every request to keep database clean and below free limit)
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('chat_messages')
      .delete()
      .lt('created_at', oneDayAgo)
  } catch (cleanErr) {
    console.error('Chat cleanup error:', cleanErr)
  }

  // 2. GET messages
  if (req.method === 'GET') {
    const { room = 'all' } = req.query
    const validRooms = ['all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam']
    
    const selectedRoom = validRooms.includes(room.toLowerCase()) ? room.toLowerCase() : 'all'

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room', selectedRoom)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      return res.status(200).json({ messages: data || [] })
    } catch (err) {
      console.error('Fetch chat error:', err)
      return res.status(500).json({ error: 'Failed to fetch chat messages' })
    }
  }

  // 3. POST new message
  if (req.method === 'POST') {
    const { room = 'all', message, sender_name, sender_id } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' })
    }
    if (!sender_name || !sender_id) {
      return res.status(400).json({ error: 'Sender name and ID are required' })
    }

    const validRooms = ['all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam']
    const selectedRoom = validRooms.includes(room.toLowerCase()) ? room.toLowerCase() : 'all'

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          room: selectedRoom,
          message: message.trim().slice(0, 1000), // Limit length to prevent spam
          sender_name: sender_name.trim(),
          sender_id: sender_id.trim()
        }])
        .select()
        .single()

      if (error) throw error
      return res.status(201).json({ message: data })
    } catch (err) {
      console.error('Post chat error:', err)
      return res.status(500).json({ error: 'Failed to send message' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
