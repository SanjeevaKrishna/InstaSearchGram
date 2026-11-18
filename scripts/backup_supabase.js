const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim() : null;
};

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const BACKUP_DIR = path.join(__dirname, '..', 'backup_supabase_images');

async function getAllFiles() {
  let allFiles = [];
  async function listFolder(folder = '') {
    let offset = 0;
    const limit = 1000;
    while (true) {
      const { data, error } = await supabase.storage.from('profile-images').list(folder, { limit, offset });
      if (error || !data || data.length === 0) break;
      for (const item of data) {
        if (item.id === null) {
          await listFolder(folder ? folder + '/' + item.name : item.name);
        } else {
          allFiles.push(folder ? folder + '/' + item.name : item.name);
        }
      }
      if (data.length < limit) break;
      offset += limit;
    }
  }
  await listFolder();
  return allFiles;
}

function downloadFile(filePath) {
  return new Promise((resolve, reject) => {
    const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const destPath = path.join(BACKUP_DIR, filePath.replace(/\//g, path.sep));
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return resolve({ filePath, skipped: true });
    }

    const fileStream = fs.createWriteStream(destPath);
    https.get(publicUrl, (res) => {
      if (res.statusCode !== 200) {
        fileStream.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download ${filePath}: Status ${res.statusCode}`));
      }
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve({ filePath, skipped: false });
      });
    }).on('error', (err) => {
      fileStream.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function runBackup() {
  console.log('Fetching list of files from Supabase Storage (profile-images)...');
  const files = await getAllFiles();
  console.log(`Found ${files.length} total files to backup.`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  // Process concurrently in chunks of 15
  const CONCURRENCY = 15;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (file) => {
        try {
          const res = await downloadFile(file);
          if (res.skipped) skipped++;
          else downloaded++;
        } catch (err) {
          failed++;
          console.error(`Error downloading ${file}:`, err.message);
        }
      })
    );
    process.stdout.write(`\rProgress: ${downloaded + skipped + failed}/${files.length} (Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed})`);
  }
  console.log('\nBackup Complete! All files safely saved in:', BACKUP_DIR);
}

runBackup();
