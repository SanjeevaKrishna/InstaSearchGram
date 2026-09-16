const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
for (const line of env.split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i < 0) continue
  const k = t.slice(0, i).trim()
  let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function classify(url) {
  if (!url) return 'empty'
  if (url.includes('cloudinary')) return 'cloudinary'
  if (url.includes('supabase.co/storage')) return 'supabase'
  return 'other'
}

async function listAll(bucket, prefix) {
  const files = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset })
    if (error) throw error
    if (!data || !data.length) break
    for (const item of data) {
      if (item.id) files.push(prefix ? `${prefix}/${item.name}` : item.name)
    }
    if (data.length < 1000) break
    offset += data.length
  }
  return files
}

;(async () => {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw error
  console.log(
    'BUCKETS',
    JSON.stringify(buckets.map((b) => ({ name: b.name, public: b.public })))
  )

  for (const b of buckets) {
    const root = await supabase.storage.from(b.name).list('', { limit: 100 })
    console.log('ROOT', b.name, (root.data || []).map((x) => x.name).join(', ') || '(empty)')
  }

  const profileFiles = await listAll('profile-images', 'insta_search_celebrities')
  console.log('profile-images/insta_search_celebrities files:', profileFiles.length)

  const mediaFiles = await listAll('media', '')
  const mediaMigrated = await listAll('media', 'migrated-from-cloudinary')
  console.log('media root files:', mediaFiles.length, 'migrated-from-cloudinary:', mediaMigrated.length)

  const tables = [
    ['celebrities', 'photo_url'],
    ['news', 'image_url'],
    ['most_followed', 'photo_url'],
    ['viral_reels', 'photo_url'],
    ['viral_reels', 'creator_photo_url'],
    ['most_liked_posts', 'photo_url'],
    ['most_liked_posts', 'creator_photo_url'],
    ['most_viewed_reels', 'photo_url'],
    ['most_viewed_reels', 'creator_photo_url'],
    ['most_liked_reels', 'photo_url'],
    ['most_liked_reels', 'creator_photo_url'],
    ['most_liked_comments', 'photo_url'],
    ['most_liked_comments', 'creator_photo_url'],
    ['playlists', 'cover_url'],
    ['posts', 'playlist_cover_url'],
  ]

  for (const [table, col] of tables) {
    const { data, error: qerr } = await supabase.from(table).select(col)
    if (qerr) {
      console.log(table + '.' + col, 'ERR', qerr.message)
      continue
    }
    const counts = { cloudinary: 0, supabase: 0, other: 0, empty: 0 }
    for (const row of data || []) counts[classify(row[col])]++
    console.log(`${table}.${col} n=${(data || []).length}`, counts)
  }

  const { data: cels } = await supabase.from('celebrities').select('name,photo_url').like('photo_url', '%supabase%').limit(3)
  for (const r of cels || []) {
    const res = await fetch(r.photo_url, { method: 'HEAD' })
    console.log('VERIFY_SUPABASE', res.status, r.name)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
