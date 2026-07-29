import { supabase } from '../lib/supabase'

const EXTERNAL_DATA_URL = 'https://spialr.com'

function generateSiteMap(celebrities) {
  const today = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Static URLs -->
     <url>
       <loc>${EXTERNAL_DATA_URL}/</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/all</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/live</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/trending</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/about</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/privacy</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/terms</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/disclaimer</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/contact</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/dmca</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/request</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.6</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/converter</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/methodology</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     
     <!-- Dynamic Creator Profile URLs -->
      ${celebrities
        .map(({ slug, updated_at }) => {
          return `
      <url>
        <loc>${EXTERNAL_DATA_URL}/celebrity/${slug}</loc>
        <lastmod>${updated_at ? new Date(updated_at).toISOString() : today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
        })
       .join('')}
   </urlset>
 `;
}

export async function getServerSideProps({ res }) {
  // Fetch all celebrity slugs from Supabase
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('slug, updated_at')

  // We generate the XML sitemap with the celebrities data
  const sitemap = generateSiteMap(celebrities || [])

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default function SiteMap() {}
