import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

function createResilientFetch() {
  if (typeof window !== 'undefined') return globalThis.fetch;
  let https = null;
  try {
    const reqFn = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
    https = reqFn('https');
  } catch {
    https = null;
  }
  if (!https) return globalThis.fetch;

  const httpsFetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const plainHeaders = {};
      if (options.headers) {
        if (typeof options.headers.forEach === 'function') {
          options.headers.forEach((val, key) => {
            plainHeaders[key] = val;
          });
        } else if (typeof options.headers.entries === 'function') {
          for (const [k, v] of options.headers.entries()) {
            plainHeaders[k] = v;
          }
        } else {
          Object.assign(plainHeaders, options.headers);
        }
      }

      const reqOptions = {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: plainHeaders
      };

      const req = https.request(reqOptions, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const bodyBuffer = Buffer.concat(chunks);
          const bodyText = bodyBuffer.toString('utf8');
          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: {
              get: (name) => {
                const val = res.headers[name.toLowerCase()];
                return Array.isArray(val) ? val.join(', ') : val;
              }
            },
            text: async () => bodyText,
            json: async () => JSON.parse(bodyText || '{}'),
            blob: async () => new Blob([bodyBuffer]),
            arrayBuffer: async () => bodyBuffer.buffer.slice(bodyBuffer.byteOffset, bodyBuffer.byteOffset + bodyBuffer.byteLength)
          };
          resolve(response);
        });
      });

      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };

  return async function hybridFetch(url, options = {}) {
    try {
      return await fetch(url, options);
    } catch (err) {
      console.warn(`[hybridFetch] global fetch failed (${err.message}), using native https fallback...`);
      return await httpsFetch(url, options);
    }
  };
}

// Admin client (only used in API routes - never exposed to browser)
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) {
    throw new Error('Missing Supabase keys in .env.local')
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: createResilientFetch()
    }
  })
}
