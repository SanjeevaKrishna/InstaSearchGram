const fs = require('fs');
const path = require('path');
const ImageKit = require('imagekit');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(key + '=(.+)'));
  return match ? match[1].trim() : null;
};

const imagekit = new ImageKit({
  publicKey: getEnv('IMAGEKIT_PUBLIC_KEY'),
  privateKey: getEnv('IMAGEKIT_PRIVATE_KEY'),
  urlEndpoint: getEnv('IMAGEKIT_URL_ENDPOINT')
});

const BACKUP_DIR = path.join(__dirname, '..', 'backup_supabase_images');
const PROGRESS_FILE = path.join(__dirname, '.imagekit_upload_progress.json');

// Map of relative path (e.g. "insta_search_celebrities/abc.jpg") -> ImageKit public URL
let progressMap = {};
if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progressMap = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch (e) {
    progressMap = {};
  }
}

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progressMap, null, 2), 'utf8');
}

function getAllLocalFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllLocalFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function uploadSingleFileWithRetry(filePath, maxRetries = 3) {
  const relPath = path.relative(BACKUP_DIR, filePath).replace(/\\/g, '/');
  
  if (progressMap[relPath]) {
    return { relPath, url: progressMap[relPath], skipped: true };
  }

  const folder = '/' + path.dirname(relPath).replace(/\\/g, '/');
  const fileName = path.basename(relPath);
  const fileBuffer = fs.readFileSync(filePath);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        imagekit.upload({
          file: fileBuffer,
          fileName: fileName,
          folder: folder,
          useUniqueFileName: false
        }, (error, res) => {
          if (error) return reject(error);
          resolve(res);
        });
      });

      progressMap[relPath] = result.url;
      return { relPath, url: result.url, skipped: false };
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      // Exponential backoff
      await new Promise(r => setTimeout(r, attempt * 1200));
    }
  }
}

async function runUpload() {
  console.log('Scanning local backup directory for files to upload to ImageKit...');
  const allFiles = getAllLocalFiles(BACKUP_DIR);
  console.log(`Found ${allFiles.length} local files.`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  // Use concurrency 4 to ensure stability and prevent connection timeouts
  const CONCURRENCY = 4;
  for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
    const chunk = allFiles.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (file) => {
        try {
          const res = await uploadSingleFileWithRetry(file);
          if (res.skipped) skipped++;
          else uploaded++;
        } catch (err) {
          failed++;
          console.error(`\nFailed uploading ${file}:`, err.message || err);
        }
      })
    );
    saveProgress();
    process.stdout.write(`\rUpload progress: ${uploaded + skipped + failed}/${allFiles.length} (Uploaded: ${uploaded}, Cached/Skipped: ${skipped}, Failed: ${failed})`);
  }
  saveProgress();
  console.log('\nAll files processed for ImageKit!');
}

runUpload();
