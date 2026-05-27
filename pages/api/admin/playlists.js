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

    // GET - list playlists (by celebrity)
    if (req.method === 'GET') {
      const { celebrity_id } = req.query
      if (!celebrity_id) {
        return res.status(400).json({ error: 'celebrity_id is required' })
      }

      // 1. Fetch current playlists
      const { data: playlists, error: plError } = await supabase
        .from('playlists')
        .select('*')
        .eq('celebrity_id', celebrity_id)
        .order('name')

      if (plError) return res.status(500).json({ error: plError.message })

      // 2. Fetch distinct playlists from posts to perform automatic migration
      const { data: postsPlaylists, error: postsPlError } = await supabase
        .from('posts')
        .select('playlist_name, playlist_cover_url')
        .eq('celebrity_id', celebrity_id)

      if (postsPlError) return res.status(500).json({ error: postsPlError.message })

      // 3. Compare and auto-migrate missing playlists
      const currentList = playlists || []
      const plNameSet = new Set(currentList.map(p => p.name.toLowerCase().trim()))
      const uniquePostPlaylists = []

      if (postsPlaylists) {
        postsPlaylists.forEach(p => {
          if (p.playlist_name && p.playlist_name.trim()) {
            const norm = p.playlist_name.toLowerCase().trim()
            if (!plNameSet.has(norm)) {
              plNameSet.add(norm)
              uniquePostPlaylists.push({
                celebrity_id,
                name: p.playlist_name.trim(),
                cover_url: p.playlist_cover_url || null
              })
            }
          }
        })
      }

      if (uniquePostPlaylists.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('playlists')
          .insert(uniquePostPlaylists)
          .select()

        if (!insertError && inserted) {
          currentList.push(...inserted)
        }
      }

      return res.status(200).json({ playlists: currentList })
    }

    // POST - add new playlist
    if (req.method === 'POST') {
      const { celebrity_id, name, cover_url } = req.body

      if (!celebrity_id || !name) {
        return res.status(400).json({ error: 'celebrity_id and name are required' })
      }

      // Check if it already exists
      const { data: existing, error: checkError } = await supabase
        .from('playlists')
        .select('id')
        .eq('celebrity_id', celebrity_id)
        .eq('name', name.trim())
        .maybeSingle()

      if (existing) {
        return res.status(400).json({ error: 'A playlist with this name already exists for this profile.' })
      }

      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          celebrity_id,
          name: name.trim(),
          cover_url: cover_url || null,
        }])
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ playlist: data })
    }

    // DELETE - delete playlist and clear columns in posts
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'id required' })

      // Fetch playlist name and celebrity ID to clean up posts
      const { data: playlist, error: fetchError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !playlist) {
        return res.status(404).json({ error: 'Playlist not found' })
      }

      // 1. Clear playlist_name and playlist_cover_url from posts referencing this name
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          playlist_name: null,
          playlist_cover_url: null
        })
        .eq('celebrity_id', playlist.celebrity_id)
        .eq('playlist_name', playlist.name)

      if (updateError) return res.status(500).json({ error: updateError.message })

      // 2. Delete the playlist
      const { error: deleteError } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)

      if (deleteError) return res.status(500).json({ error: deleteError.message })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Playlists API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
