/**
 * Idempotent Cloudinary → Supabase Storage migration.
 * Does NOT delete Cloudinary assets or database rows.
 *
 * Usage:
 *   node scripts/migrate-cloudinary-to-supabase.js --audit
 *   node scripts/migrate-cloudinary-to-supabase.js --migrate
 */
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { v2: cloudinary } = require('cloudinary')

const ROOT = path.join(__dirname, '..')
const PROGRESS_PATH = path.join(__dirname, '.cloudinary-migration-progress.json')
const REPORT_PATH = path.join(__dirname, '.cloudinary-migration-report.json')
const BUCKET = 'media'
const FOLDER = 'migrated-from-cloudinary'

const IMAGE_SOURCES = [
  { table: 'celebrities', columns: ['photo_url'] },
  { table: 'news', columns: ['image_url'] },
  { table: 'most_followed', columns: ['photo_url'] },
  { table: 'viral_reels', columns: ['photo_url', 'creator_photo_url'] },
  { table: 'most_liked_posts', columns: ['photo_url', 'creator_photo_url'] },
  { table: 'most_viewed_reels', columns: ['photo_url', 'creator_photo_url'] },
  { table: 'most_liked_reels', columns: ['photo_url', 'creator_photo_url'] },
  { table: 'most_liked_comments', columns: ['photo_url', 'creator_photo_url'] },
  { table: 'playlists', columns: ['cover_url'] },
  { table: 'posts', columns: ['playlist_cover_url'] },
]

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('Missing .env.local')
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function classifyUrl(url) {
  if (!url || typeof url !== 'string') return 'empty'
  const u = url.trim()
  if (!u) return 'empty'
  if (u.includes('res.cloudinary.com') || u.includes('cloudinary.com')) return 'cloudinary'
  if (u.includes('.supabase.co/storage/') || u.includes('supabase.co/storage/v1/object/public/')) return 'supabase'
  if (u.includes('cdninstagram.com') || u.includes('instagram.com') || u.includes('fbcdn.net')) return 'instagram'
  if (u.startsWith('data:')) return 'data'
  return 'other'
}

function originalCloudinaryUrl(url) {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    const uploadIdx = parts.findIndex((p) => p === 'upload' || p === 'fetch')
    if (uploadIdx < 0) return url
    const after = parts.slice(uploadIdx + 1)
    const filtered = after.filter((seg, i) => {
      if (i === 0 && /^(c_|w_|h_|q_|f_|g_|e_|fl_|dpr_|ar_|bo_|r_|x_|y_|l_|t_|o_|a_|b_)/.test(seg)) return false
      if (i === 0 && seg.includes(',') && !seg.startsWith('v')) return false
      return true
    })
    parsed.pathname = '/' + [...parts.slice(0, uploadIdx + 1), ...filtered].join('/')
    parsed.search = ''
    return parsed.toString()
  } catch {
    return url
  }
}

function publicIdFromCloudinaryUrl(url) {
  try {
    const original = originalCloudinaryUrl(url)
    const parsed = new URL(original)
    const parts = parsed.pathname.split('/').filter(Boolean)
    const uploadIdx = parts.findIndex((p) => p === 'upload' || p === 'fetch')
    if (uploadIdx < 0) return null
    let after = parts.slice(uploadIdx + 1)
    if (after[0] && /^v\d+$/.test(after[0])) after = after.slice(1)
    const last = after[after.length - 1] || ''
    const withoutExt = last.replace(/\.[a-zA-Z0-9]+$/, '')
    after[after.length - 1] = withoutExt
    return after.join('/')
  } catch {
    return null
  }
}

function storagePathForCloudinary(url, publicId) {
  const extMatch = originalCloudinaryUrl(url).match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i)
  const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
  const safeId = (publicId || `asset-${Date.now()}`).replace(/[^a-zA-Z0-9/_-]/g, '_')
  return `${FOLDER}/${safeId}.${ext}`
}

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) return { urlMap: {}, uploadedPaths: {}, failures: [] }
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  } catch {
    return { urlMap: {}, uploadedPaths: {}, failures: [] }
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

async function fetchAllRows(supabase, table, columns) {
  const select = ['id', ...columns].join(', ')
  const pageSize = 1000
  let from = 0
  const rows = []
  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1)
    if (error) {
      if (String(error.message || '').includes('does not exist') || error.code === '42P01' || error.code === 'PGRST205') {
        console.log(`  skip missing table: ${table}`)
        return []
      }
      throw new Error(`${table}: ${error.message}`)
    }
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function listCloudinaryResources() {
  const resources = []
  let nextCursor = undefined
  do {
    const res = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      next_cursor: nextCursor,
    })
    resources.push(...(res.resources || []))
    nextCursor = res.next_cursor
  } while (nextCursor)
  return resources
}

async function ensureBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw error
  if (!(buckets || []).some((b) => b.name === BUCKET)) {
    const created = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
    })
    if (created.error && !String(created.error.message || '').toLowerCase().includes('already exists')) {
      throw created.error
    }
    console.log(`Created public bucket: ${BUCKET}`)
  } else {
    const bucket = (buckets || []).find((b) => b.name === BUCKET)
    console.log(`Using existing bucket: ${BUCKET} (public=${bucket?.public})`)
    if (bucket && bucket.public === false) {
      const upd = await supabase.storage.updateBucket(BUCKET, { public: true })
      if (upd.error) console.warn('Could not make bucket public:', upd.error.message)
    }
  }
}

async function listExistingStorageFiles(supabase) {
  const found = new Set()
  async function walk(prefix) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 })
    if (error) {
      console.warn(`list ${prefix || '/'}:`, error.message)
      return
    }
    for (const item of data || []) {
      const full = prefix ? `${prefix}/${item.name}` : item.name
      if (!item.id && item.name) {
        await walk(full)
      } else {
        found.add(full)
      }
    }
  }
  await walk(FOLDER)
  await walk('')
  return found
}

async function download(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SpialrMigration/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return { buf, contentType }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  loadEnv()
  const mode = process.argv.includes('--migrate') ? 'migrate' : 'audit'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env')

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(`Mode: ${mode}`)
  const tableStats = []
  const uniqueCloudinary = new Map()

  for (const source of IMAGE_SOURCES) {
    const rows = await fetchAllRows(supabase, source.table, source.columns)
    const counts = { total: rows.length, cloudinary: 0, supabase: 0, instagram: 0, other: 0, empty: 0, refs: [] }
    for (const row of rows) {
      for (const col of source.columns) {
        const url = row[col]
        const kind = classifyUrl(url)
        counts[kind] = (counts[kind] || 0) + 1
        if (kind === 'cloudinary') {
          const original = originalCloudinaryUrl(url)
          const key = original
          if (!uniqueCloudinary.has(key)) uniqueCloudinary.set(key, [])
          uniqueCloudinary.get(key).push({ table: source.table, id: row.id, column: col, storedUrl: url })
          counts.refs.push({ id: row.id, column: col })
        }
      }
    }
    tableStats.push({
      table: source.table,
      totalRows: counts.total,
      cloudinary: counts.cloudinary,
      supabase: counts.supabase,
      instagram: counts.instagram,
      other: counts.other,
      empty: counts.empty,
    })
    console.log(
      `${source.table}: rows=${counts.total} cloudinary=${counts.cloudinary} supabase=${counts.supabase} instagram=${counts.instagram} other=${counts.other} empty=${counts.empty}`
    )
  }

  let cloudinaryAssets = []
  try {
    cloudinaryAssets = await listCloudinaryResources()
    console.log(`Cloudinary account assets: ${cloudinaryAssets.length}`)
  } catch (err) {
    console.warn('Could not list Cloudinary account (quota/API). Will migrate from DB URLs only:', err.message)
  }

  for (const asset of cloudinaryAssets) {
    const url = asset.secure_url || asset.url
    if (!url) continue
    const original = originalCloudinaryUrl(url)
    if (!uniqueCloudinary.has(original)) uniqueCloudinary.set(original, [])
  }

  await ensureBucket(supabase)
  const existingFiles = await listExistingStorageFiles(supabase)
  const migratedLike = [...existingFiles].filter((p) => p.startsWith(FOLDER + '/') || p.includes('cloudinary'))
  console.log(`Supabase storage objects visible: ${existingFiles.size} (migration-folder-ish: ${migratedLike.length})`)

  const progress = loadProgress()
  const alreadyMapped = Object.keys(progress.urlMap || {}).length
  console.log(`Resume map entries: ${alreadyMapped}`)
  console.log(`Unique Cloudinary URLs to handle: ${uniqueCloudinary.size}`)

  const report = {
    startedAt: new Date().toISOString(),
    mode,
    tableStats,
    uniqueCloudinaryUrls: uniqueCloudinary.size,
    cloudinaryAccountAssets: cloudinaryAssets.length,
    supabaseStorageObjects: existingFiles.size,
    alreadyMapped,
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  const remaining = [...uniqueCloudinary.keys()].filter((u) => !progress.urlMap[u])
  const avgSeconds = 2.2
  const estimateMin = Math.max(1, Math.ceil((remaining.length * avgSeconds) / 60))
  console.log(`Remaining unique downloads: ${remaining.length}`)
  console.log(`Estimated time if migrating now: ~${estimateMin} minute(s)`)

  if (mode !== 'migrate') {
    console.log('Audit complete. Re-run with --migrate to copy files and update URLs.')
    return
  }

  let uploaded = 0
  let reused = 0
  let updatedRows = 0
  let failed = 0

  for (const url of uniqueCloudinary.keys()) {
    const refs = uniqueCloudinary.get(url)
    let newUrl = progress.urlMap[url]
    if (!newUrl) {
      const publicId = publicIdFromCloudinaryUrl(url) || `unknown/${Date.now()}`
      const storagePath = storagePathForCloudinary(url, publicId)
      try {
        const { buf, contentType } = await download(url)
        const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
          contentType,
          upsert: true,
        })
        if (error) throw error
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
        newUrl = data.publicUrl
        progress.urlMap[url] = newUrl
        progress.uploadedPaths[url] = storagePath
        saveProgress(progress)
        uploaded += 1
        process.stdout.write(`  uploaded ${uploaded}/${remaining.length || uniqueCloudinary.size} ${publicId}\n`)
        await sleep(250)
      } catch (err) {
        failed += 1
        progress.failures.push({ url, error: err.message, at: new Date().toISOString() })
        saveProgress(progress)
        console.error(`  FAIL ${url}: ${err.message}`)
        continue
      }
    } else {
      reused += 1
    }

    for (const ref of refs) {
      const { error } = await supabase.from(ref.table).update({ [ref.column]: newUrl }).eq('id', ref.id)
      if (error) {
        failed += 1
        console.error(`  DB update fail ${ref.table}.${ref.column} ${ref.id}: ${error.message}`)
      } else {
        updatedRows += 1
      }
    }
  }

  report.finishedAt = new Date().toISOString()
  report.uploaded = uploaded
  report.reused = reused
  report.updatedRows = updatedRows
  report.failed = failed
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`Done. uploaded=${uploaded} reused=${reused} dbUpdates=${updatedRows} failed=${failed}`)
  console.log('Cloudinary originals were NOT deleted.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
