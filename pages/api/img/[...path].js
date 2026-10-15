/**
 * Supabase Storage → Vercel CDN Image Proxy
 * 
 * Proxies Supabase Storage public image requests through Vercel's Edge CDN.
 * Sets aggressive s-maxage (30 days) so each image is fetched from Supabase
 * exactly ONCE per month, then served from Vercel CDN (zero Supabase egress).
 * 
 * Route: /api/img/profile-images/insta_search_celebrities/example.jpg
 * Proxies: https://kmamqlbtiqmfsngovniw.supabase.co/storage/v1/object/public/profile-images/insta_search_celebrities/example.jpg
 */

const SUPABASE_STORAGE_BASE = 'https://kmamqlbtiqmfsngovniw.supabase.co/storage/v1/object/public/'

export default async function handler(req, res) {
  const { path } = req.query
  if (!path || !Array.isArray(path) || path.length === 0) {
    return res.status(400).send('Missing image path')
  }

  const imagePath = path.join('/')
  const supabaseUrl = SUPABASE_STORAGE_BASE + imagePath

  try {
    const response = await fetch(supabaseUrl, {
      headers: {
        'Accept': 'image/*'
      }
    })

    if (!response.ok) {
      // Pass through 404s with short cache to avoid hammering Supabase
      res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=300')
      return res.status(response.status).send('Image not found')
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())

    res.setHeader('Content-Type', contentType)
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Aggressive Vercel Edge CDN caching: 30 days on CDN, 7 days in browser
    // stale-while-revalidate allows serving stale content while revalidating in background
    res.setHeader('Cache-Control', 'public, s-maxage=2592000, max-age=604800, stale-while-revalidate=2592000')

    return res.send(buffer)
  } catch (err) {
    console.error('[img-proxy] Error:', err.message)
    res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=30')
    return res.status(500).send('Failed to fetch image')
  }
}
