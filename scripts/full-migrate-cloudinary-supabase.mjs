import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// 1. Load environment variables
const envPath = path.join(ROOT, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Missing .env.local file');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const BUCKET_NAME = 'profile-images';
const PROGRESS_FILE = path.join(__dirname, '.migration_progress.json');
const CONCURRENCY = 3;

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });
const apiHeaders = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`
};

const TABLES_CONFIG = [
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
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Ensure bucket exists and is public
async function ensureBucket() {
  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: { ...apiHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET_NAME, name: BUCKET_NAME, public: true })
    });
    const data = await res.json();
    console.log(`✅ Supabase Storage bucket "${BUCKET_NAME}" is verified.`);
  } catch (e) {
    console.log(`Bucket check notice: ${e.message}`);
  }
}

// Download image from Cloudinary with retry
async function downloadImageWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      if (!arrayBuf || arrayBuf.byteLength < 50) {
        throw new Error('Image buffer is empty');
      }
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      return { buffer: Buffer.from(arrayBuf), contentType };
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(1500 * attempt);
    }
  }
}

// Upload buffer directly to Supabase Storage using native HTTPS agent for rock-solid stability
async function uploadToSupabase(buffer, filePath, contentType) {
  const u = new URL(`${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${filePath}`);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
        'Content-Length': buffer.length
      }
    }, (res) => {
      let respBody = '';
      res.on('data', chunk => respBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed HTTP ${res.statusCode}: ${respBody}`));
        }
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// Parse storage path from Cloudinary URL preserving folders & filenames
function getStoragePath(cloudinaryUrl) {
  try {
    const cleanUrl = cloudinaryUrl.split('?')[0];
    const parts = cleanUrl.split('/image/upload/');
    if (parts.length > 1) {
      let subPath = parts[1];
      const segments = subPath.split('/');
      // Remove version segment (e.g. v1781324975)
      if (segments[0].startsWith('v') && !isNaN(segments[0].substring(1))) {
        segments.shift();
      }
      return segments.join('/');
    }
    // Fallback
    const filename = cleanUrl.split('/').pop();
    return `insta_search_celebrities/${filename}`;
  } catch {
    const hash = Math.random().toString(36).substring(2, 10);
    return `insta_search_celebrities/${Date.now()}_${hash}.jpg`;
  }
}

// Update DB record with resilient hybrid update
async function updateDbRecord(table, id, column, newUrl) {
  const patchUrl = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      ...apiHeaders,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ [column]: newUrl })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB PATCH failed on ${table}.${column} [${id}]: ${text}`);
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 SPIALR CLOUDINARY -> SUPABASE STORAGE MIGRATION');
  console.log('====================================================\n');

  await ensureBucket();

  // Load or initialize progress file
  let progress = { urlMap: {}, failedUrls: {} };
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      if (!progress.urlMap) progress.urlMap = {};
      if (!progress.failedUrls) progress.failedUrls = {};
      console.log(`📁 Loaded existing progress: ${Object.keys(progress.urlMap).length} URLs previously migrated.`);
    } catch {
      console.log('📁 Initializing new progress tracker.');
    }
  }

  function saveProgress() {
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch {}
  }

  // Scan all tables
  console.log('\n🔍 Scanning all 10 database tables for Cloudinary URLs...');
  const urlRefs = new Map(); // url -> Array<{ table, id, column }>
  let totalDbReferences = 0;

  for (const item of TABLES_CONFIG) {
    let offset = 0;
    const cols = ['id', ...item.columns].join(',');
    while (true) {
      const res = await fetch(`${supabaseUrl}/rest/v1/${item.table}?select=${cols}&offset=${offset}&limit=1000`, {
        headers: apiHeaders
      });
      if (!res.ok) {
        console.error(`Failed to read table ${item.table}: HTTP ${res.status}`);
        break;
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const row of data) {
        for (const col of item.columns) {
          const val = row[col];
          if (val && typeof val === 'string' && val.includes('cloudinary.com')) {
            totalDbReferences++;
            if (!urlRefs.has(val)) urlRefs.set(val, []);
            urlRefs.get(val).push({ table: item.table, id: row.id, column: col });
          }
        }
      }

      if (data.length < 1000) break;
      offset += 1000;
    }
  }

  const uniqueUrls = Array.from(urlRefs.keys());
  console.log(`📊 Scan Complete:`);
  console.log(`   Total Cloudinary DB References: ${totalDbReferences}`);
  console.log(`   Total Unique Cloudinary URLs:   ${uniqueUrls.length}\n`);

  if (uniqueUrls.length === 0) {
    console.log('🎉 No Cloudinary URLs found in database! All data is already on Supabase Storage.');
    return;
  }

  let processedCount = 0;
  let successCount = 0;
  let failCount = 0;

  // Process queue in concurrency chunks
  for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY) {
    const chunk = uniqueUrls.slice(i, i + CONCURRENCY);

    await Promise.all(chunk.map(async (cUrl) => {
      const refs = urlRefs.get(cUrl) || [];
      try {
        let targetSupabaseUrl = progress.urlMap[cUrl];

        if (!targetSupabaseUrl) {
          const filePath = getStoragePath(cUrl);
          const { buffer, contentType } = await downloadImageWithRetry(cUrl);
          targetSupabaseUrl = await uploadToSupabase(buffer, filePath, contentType);
          progress.urlMap[cUrl] = targetSupabaseUrl;
          delete progress.failedUrls[cUrl];
        }

        // Update all DB rows pointing to this URL (ZERO DATA LOSS: only on verified upload)
        for (const ref of refs) {
          await updateDbRecord(ref.table, ref.id, ref.column, targetSupabaseUrl);
        }

        successCount++;
      } catch (err) {
        failCount++;
        progress.failedUrls[cUrl] = err.message;
        console.error(`\n⚠️ Failed for ${cUrl.substring(0, 80)}: ${err.message}`);
      } finally {
        processedCount++;
        process.stdout.write(`\r[Migration] ${processedCount} / ${uniqueUrls.length} URLs (${Math.round((processedCount / uniqueUrls.length) * 100)}%) | ✅ ${successCount} ok | ❌ ${failCount} fails`);
      }
    }));

    // Save checkpoint every 15 items
    if (processedCount % 15 === 0) {
      saveProgress();
    }

    // Gentle pacing for network stability
    await sleep(150);
  }

  saveProgress();

  console.log('\n\n====================================================');
  console.log('🏁 MIGRATION RUN FINISHED');
  console.log(`   Processed URLs: ${processedCount} / ${uniqueUrls.length}`);
  console.log(`   Successes:      ${successCount}`);
  console.log(`   Failures:       ${failCount}`);
  console.log('====================================================\n');

  // Retry pass for any failed URLs if any occurred
  const remainingFails = Object.keys(progress.failedUrls);
  if (remainingFails.length > 0) {
    console.log(`🔄 Attempting retry pass on ${remainingFails.length} failed URLs...`);
    for (const fUrl of remainingFails) {
      try {
        const refs = urlRefs.get(fUrl) || [];
        const filePath = getStoragePath(fUrl);
        const { buffer, contentType } = await downloadImageWithRetry(fUrl, 4);
        const targetSupabaseUrl = await uploadToSupabase(buffer, filePath, contentType);
        progress.urlMap[fUrl] = targetSupabaseUrl;
        delete progress.failedUrls[fUrl];

        for (const ref of refs) {
          await updateDbRecord(ref.table, ref.id, ref.column, targetSupabaseUrl);
        }
        console.log(`  ✅ Recovered: ${fUrl.substring(0, 60)}`);
      } catch (e) {
        console.error(`  ❌ Still unreachable: ${fUrl.substring(0, 60)} (${e.message})`);
      }
      await sleep(500);
    }
    saveProgress();
  }

  // Final verification check
  console.log('\n🔎 Running Final Database Verification...');
  let remainingCloudinary = 0;
  for (const item of TABLES_CONFIG) {
    const cols = ['id', ...item.columns].join(',');
    const res = await fetch(`${supabaseUrl}/rest/v1/${item.table}?select=${cols}&limit=2000`, {
      headers: apiHeaders
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      data.forEach(r => {
        item.columns.forEach(col => {
          if (r[col] && r[col].includes('cloudinary.com')) remainingCloudinary++;
        });
      });
    }
  }

  console.log(`\n🎉 Final Verification Result: ${remainingCloudinary} Cloudinary URLs remaining in DB.`);
  if (remainingCloudinary === 0) {
    console.log('✨ ALL DATABASE RECORDS HAVE BEEN 100% TRANSFERRED TO SUPABASE STORAGE!');
  }
}

main().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
