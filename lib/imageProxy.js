/**
 * Supabase Storage Image Proxy Utility
 * 
 * Rewrites Supabase Storage public URLs to route through /api/img/[...path]
 * so that Vercel's Edge CDN caches the images. This eliminates repeated
 * Supabase Storage Cached Egress (which counts toward the Free Plan's 5 GB limit
 * even on Cloudflare cache hits).
 *
 * With s-maxage=2592000 (30 days) on the proxy response, each image is fetched
 * from Supabase exactly ONCE per 30 days, then served from Vercel CDN for free.
 */

const SUPABASE_STORAGE_PREFIX = 'https://kmamqlbtiqmfsngovniw.supabase.co/storage/v1/object/public/'

/**
 * Rewrites a single Supabase Storage URL to go through the Vercel CDN proxy.
 * Non-Supabase URLs are returned unchanged.
 */
export function proxyImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return '/api/img/' + url.slice(SUPABASE_STORAGE_PREFIX.length)
  }
  return url
}

/**
 * Applies image proxying to an array of profile objects.
 * Rewrites photo_url and creator_photo_url fields.
 */
export function proxyProfileImages(profiles) {
  if (!Array.isArray(profiles)) return profiles
  return profiles.map(p => {
    if (!p || typeof p !== 'object') return p
    const copy = { ...p }
    if (copy.photo_url !== undefined) {
      copy.photo_url = proxyImageUrl(copy.photo_url)
    }
    if (copy.creator_photo_url !== undefined) {
      copy.creator_photo_url = proxyImageUrl(copy.creator_photo_url)
    }
    if (copy.profile_pic_url !== undefined) {
      copy.profile_pic_url = proxyImageUrl(copy.profile_pic_url)
    }
    if (copy.avatar_url !== undefined) {
      copy.avatar_url = proxyImageUrl(copy.avatar_url)
    }
    return copy
  })
}
