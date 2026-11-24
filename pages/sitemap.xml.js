import { supabase } from '../lib/supabase'
import fs from 'fs'
import path from 'path'
import { getAllPosts } from '../data/blogs'

const EXTERNAL_DATA_URL = 'https://spialr.com'

const CATEGORIES = [
  'actors',
  'singers',
  'creators',
  'influencers',
  'meme-pages',
  'politicians',
  'sports',
  'personalities',
  'handles'
]

const getFileLastMod = (pagePath) => {
  try {
    const fullPath = path.join(process.cwd(), 'pages', pagePath)
    const stat = fs.statSync(fullPath)
    return stat.mtime.toISOString()
  } catch (e) {
    return new Date().toISOString()
  }
}

const generateReelSlug = (item) => {
  if (!item) return ''
  const creatorClean = (item.creator_name || '')
    .replace('@', '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')

  const titleClean = (item.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 45)

  const parts = [creatorClean, titleClean].filter(Boolean).join('-').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
  return `${parts || 'watch'}-${item.id}`
}

function generateSiteMap(profiles = [], reels = [], blogPosts = []) {
  const today = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static & Hub URLs -->
     <url>
       <loc>${EXTERNAL_DATA_URL}</loc>
       <lastmod>${getFileLastMod('index.js')}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/live</loc>
       <lastmod>${getFileLastMod('live.js')}</lastmod>
       <changefreq>hourly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/all</loc>
       <lastmod>${getFileLastMod('all.js')}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.85</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/trending</loc>
       <lastmod>${getFileLastMod('trending.js')}</lastmod>
       <changefreq>hourly</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/converter</loc>
       <lastmod>${getFileLastMod('converter.js')}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/blog</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.85</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/methodology</loc>
       <lastmod>${getFileLastMod('methodology.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/about</loc>
       <lastmod>${getFileLastMod('about.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/privacy</loc>
       <lastmod>${getFileLastMod('privacy.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/terms</loc>
       <lastmod>${getFileLastMod('terms.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/disclaimer</loc>
       <lastmod>${getFileLastMod('disclaimer.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/contact</loc>
       <lastmod>${getFileLastMod('contact.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/dmca</loc>
       <lastmod>${getFileLastMod('dmca.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/request</loc>
       <lastmod>${getFileLastMod('request.js')}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.6</priority>
     </url>

     <!-- Category Hub URLs -->
     ${CATEGORIES.map((cat) => `
     <url>
       <loc>${EXTERNAL_DATA_URL}/category/${cat}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.85</priority>
     </url>`).join('')}

     <!-- Blog Articles -->
     ${blogPosts.map((post) => `
     <url>
       <loc>${EXTERNAL_DATA_URL}/blog/${post.slug}</loc>
       <lastmod>${post.publishedAt ? new Date(post.publishedAt).toISOString() : today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>`).join('')}

     <!-- Live Enriched Creator Follower Tracker Profile URLs -->
     ${profiles
       .map((p) => {
         const slug = p.instagram_handle
           ? p.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
           : p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
         const lastUpdated = p.updated_at ? new Date(p.updated_at).toISOString() : today
         return `
     <url>
       <loc>${EXTERNAL_DATA_URL}/profile/${encodeURIComponent(slug)}</loc>
       <lastmod>${lastUpdated}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>`
       })
       .join('')}

     <!-- Trending & Most Viewed Reel URLs -->
     ${reels
       .map((r) => {
         const slug = generateReelSlug(r)
         const lastUpdated = r.created_at ? new Date(r.created_at).toISOString() : today
         return `
     <url>
       <loc>${EXTERNAL_DATA_URL}/reel/${encodeURIComponent(slug)}</loc>
       <lastmod>${lastUpdated}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>`
       })
       .join('')}
   </urlset>
 `
}

export async function getServerSideProps({ res }) {
  async function fetchEnrichedProfiles() {
    let all = []
    let page = 0
    const pageSize = 1000
    while (true) {
      const { data, error } = await supabase
        .from('most_followed')
        .select('name, instagram_handle, followers_count, updated_at')
        .gte('followers_count', 100000)
        .range(page * pageSize, (page + 1) * pageSize - 1)
      if (error || !data || data.length === 0) break
      all = all.concat(data)
      if (data.length < pageSize) break
      page++
    }
    return all
  }

  // Fetch enriched profiles, reels, and blog posts in parallel (excluding redirected /celebrity/ and removed comments)
  const [
    enrichedProfiles,
    { data: mostViewedReels },
    { data: viralReels },
    { data: mostLikedReels }
  ] = await Promise.all([
    fetchEnrichedProfiles(),
    supabase.from('most_viewed_reels').select('id, title, creator_name, created_at').range(0, 500),
    supabase.from('viral_reels').select('id, title, creator_name, created_at').range(0, 500),
    supabase.from('most_liked_reels').select('id, title, creator_name, created_at').range(0, 500)
  ])

  // Deduplicate reels by ID across tables
  const reelMap = new Map()
  ;[...(mostViewedReels || []), ...(viralReels || []), ...(mostLikedReels || [])].forEach((r) => {
    if (r && r.id && !reelMap.has(r.id)) {
      reelMap.set(r.id, r)
    }
  })
  const allReels = Array.from(reelMap.values())

  const sitemap = generateSiteMap(enrichedProfiles || [], allReels, getAllPosts())

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default function SiteMap() {}
