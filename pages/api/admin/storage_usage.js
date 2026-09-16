import https from 'https';

const httpsAgent = new https.Agent({ keepAlive: true });

let cachedMetrics = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers['x-admin-token'];
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = Buffer.from(auth, 'base64').toString('utf8');
    if (decoded !== process.env.ADMIN_SECRET_CODE + ':admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const force = req.query.refresh === 'true';
  const now = Date.now();

  if (!force && cachedMetrics && (now - lastFetchTime < CACHE_TTL_MS)) {
    return res.status(200).json({ ...cachedMetrics, cached: true });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    async function listFolderFiles(prefix, offset = 0, limit = 1000) {
      const u = new URL(`${supabaseUrl}/storage/v1/object/list/profile-images`);
      const payload = JSON.stringify({
        prefix,
        offset,
        limit,
        sortBy: { column: 'name', order: 'asc' }
      });

      return new Promise((resolve, reject) => {
        const reqObj = https.request({
          hostname: u.hostname,
          port: 443,
          path: u.pathname,
          method: 'POST',
          agent: httpsAgent,
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (resp) => {
          let body = '';
          resp.on('data', chunk => body += chunk);
          resp.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(body));
            }
          });
        });

        reqObj.on('error', reject);
        reqObj.write(payload);
        reqObj.end();
      });
    }

    let allFiles = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const batch = await listFolderFiles('insta_search_celebrities', offset, limit);
      if (!Array.isArray(batch) || batch.length === 0) break;
      allFiles = allFiles.concat(batch);
      if (batch.length < limit) break;
      offset += limit;
    }

    let totalBytes = 0;
    let fileCount = 0;

    for (const file of allFiles) {
      if (file.metadata?.size) {
        totalBytes += file.metadata.size;
        fileCount++;
      }
    }

    const usedMb = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
    const maxMb = 1024; // 1 GB free tier limit
    const percentUsed = parseFloat(((usedMb / maxMb) * 100).toFixed(1));
    const remainingMb = parseFloat((maxMb - usedMb).toFixed(2));

    cachedMetrics = {
      success: true,
      bucket: 'profile-images',
      totalFiles: fileCount,
      totalBytes,
      usedMb,
      maxMb,
      remainingMb,
      percentUsed,
      updatedAt: new Date().toISOString()
    };
    lastFetchTime = now;

    return res.status(200).json(cachedMetrics);
  } catch (err) {
    console.error('Storage usage error:', err);
    return res.status(500).json({ error: 'Failed to calculate storage usage: ' + err.message });
  }
}
