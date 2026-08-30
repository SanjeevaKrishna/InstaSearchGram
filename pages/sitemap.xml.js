import { supabase } from '../lib/supabase'
import fs from 'fs'
import path from 'path'

const EXTERNAL_DATA_URL = 'https://spialr.com'

const getFileLastMod = (pagePath) => {
  try {
    const fullPath = path.join(process.cwd(), 'pages', pagePath);
    const stat = fs.statSync(fullPath);
    return stat.mtime.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

function generateSiteMap(celebrities = [], profiles = []) {
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
       <changefreq>daily</changefreq>
       <priority>0.85</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/converter</loc>
       <lastmod>${getFileLastMod('converter.js')}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
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

     <!-- Live Creator Follower Tracker Profile URLs -->
     ${profiles
       .map((p) => {
         const slug = p.instagram_handle
           ? p.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
           : p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
         const lastUpdated = p.created_at ? new Date(p.created_at).toISOString() : today
         return `
     <url>
       <loc>${EXTERNAL_DATA_URL}/profile/${encodeURIComponent(slug)}</loc>
       <lastmod>${lastUpdated}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>`
       })
       .join('')}
     
     <!-- Celebrity Analytics URLs -->
     ${celebrities
       .map(({ slug, updated_at, created_at }) => {
         const lastUpdated = updated_at ? new Date(updated_at).toISOString() : created_at ? new Date(created_at).toISOString() : today
         return `
     <url>
       <loc>${EXTERNAL_DATA_URL}/celebrity/${slug}</loc>
       <lastmod>${lastUpdated}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.85</priority>
     </url>`
       })
       .join('')}
   </urlset>
 `
}

export async function getServerSideProps({ res }) {
  // Fetch both celebrity slugs and most_followed creator handles in parallel
  const [
    { data: celebrities },
    { data: mostFollowedProfiles }
  ] = await Promise.all([
    supabase.from('celebrities').select('slug').range(0, 3000),
    supabase.from('most_followed').select('name, instagram_handle, created_at').range(0, 3000)
  ])

  const sitemap = generateSiteMap(celebrities || [], mostFollowedProfiles || [])

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default function SiteMap() {}
