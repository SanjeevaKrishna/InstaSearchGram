import { getAdminClient } from '../../../lib/supabase'

const getUuidFromSlug = (slugStr) => {
  if (!slugStr) return ''
  if (slugStr.length >= 36) {
    const possibleUuid = slugStr.slice(-36)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(possibleUuid)) {
      return possibleUuid
    }
  }
  return slugStr
}

export default async function handler(req, res) {
  const { id: rawId } = req.query
  if (!rawId) return res.status(400).json({ error: 'ID is required' })
  const id = getUuidFromSlug(rawId)

  try {
    const supabase = getAdminClient()
    
    // 1. Try fetching from most_viewed_reels
    let { data: reel, error } = await supabase
      .from('most_viewed_reels')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error

    // 2. If not found, fallback to viral_reels
    if (!reel) {
      const { data: viralReel, error: viralError } = await supabase
        .from('viral_reels')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (viralError) throw viralError
      reel = viralReel
    }

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' })
    }

    // Match celebrity database for followersFallback / avatar if empty
    const nameKey = (reel.creator_name || '').replace('@', '').toLowerCase().trim()
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('name, slug, photo_url, followers_count')
      .ilike('name', nameKey)
      .maybeSingle()

    const enrichedReel = {
      ...reel,
      creator_photo_url: reel.creator_photo_url || celebrity?.photo_url || null,
      creator_slug: celebrity?.slug || null,
      celebrity_followers_count: celebrity?.followers_count || null
    }

    return res.status(200).json({ reel: enrichedReel })
  } catch (err) {
    console.error('Fetch Single Reel API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
