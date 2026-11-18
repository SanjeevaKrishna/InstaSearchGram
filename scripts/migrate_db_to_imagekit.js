const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim() : null;
};

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const PROGRESS_FILE = path.join(__dirname, '.imagekit_upload_progress.json');
if (!fs.existsSync(PROGRESS_FILE)) {
  console.error('Progress file not found! Upload must be run first.');
  process.exit(1);
}

const progressMap = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
const SUPABASE_STORAGE_BASE = 'https://kmamqlbtiqmfsngovniw.supabase.co/storage/v1/object/public/profile-images/';

// Function to resolve an old Supabase URL to the new ImageKit URL
function getNewImageUrl(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string' || !oldUrl.startsWith(SUPABASE_STORAGE_BASE)) {
    return null;
  }
  const relPath = oldUrl.slice(SUPABASE_STORAGE_BASE.length);
  return progressMap[relPath] || null;
}

async function updateTable(tableName, idCol, imageCols) {
  console.log(`\nScanning ${tableName} for URLs to update...`);
  let page = 0;
  const pageSize = 1000;
  let updatedCount = 0;
  let totalChecked = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from(tableName)
      .select([idCol, ...imageCols].join(', '))
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`Error reading ${tableName}:`, error.message);
      break;
    }
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      totalChecked++;
      const updates = {};
      let needsUpdate = false;

      for (const col of imageCols) {
        const oldVal = row[col];
        if (oldVal && typeof oldVal === 'string' && oldVal.includes('supabase.co')) {
          const newVal = getNewImageUrl(oldVal);
          if (newVal) {
            updates[col] = newVal;
            needsUpdate = true;
          } else {
            console.warn(`[Warning] No mapping found for: ${oldVal}`);
          }
        }
      }

      if (needsUpdate) {
        const { error: updErr } = await supabase
          .from(tableName)
          .update(updates)
          .eq(idCol, row[idCol]);

        if (updErr) {
          console.error(`Failed to update ${tableName} id=${row[idCol]}:`, updErr.message);
        } else {
          updatedCount++;
        }
      }
    }

    if (rows.length < pageSize) break;
    page++;
  }

  console.log(`Finished ${tableName}: Checked ${totalChecked} rows, successfully updated ${updatedCount} rows.`);
}

async function runDatabaseMigration() {
  console.log('--- Starting Database URL Migration to ImageKit ---');
  console.log(`Loaded ${Object.keys(progressMap).length} image mappings.`);

  await updateTable('celebrities', 'id', ['photo_url']);
  await updateTable('most_followed', 'id', ['photo_url']);
  await updateTable('viral_reels', 'id', ['photo_url', 'creator_photo_url']);
  await updateTable('most_viewed_reels', 'id', ['photo_url', 'creator_photo_url']);
  await updateTable('most_liked_reels', 'id', ['photo_url', 'creator_photo_url']);
  await updateTable('most_liked_posts', 'id', ['photo_url', 'creator_photo_url']);
  await updateTable('most_liked_comments', 'id', ['creator_photo_url']);

  console.log('\n--- All Database Records Successfully Migrated to ImageKit! ---');
}

runDatabaseMigration();
