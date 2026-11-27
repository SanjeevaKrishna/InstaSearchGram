// Standalone Followers-Only Instagram Scraper
// This file is completely independent and has no dependencies on database or parent project models.

const PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

const XHR_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "X-IG-App-ID": "936619743392459",
  "X-IG-WWW-Claim": "0",
  "X-Requested-With": "XMLHttpRequest",
  "Sec-CH-UA": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};


const HANDLE_ALIASES = {
  'vidya.balan': 'balanvidya',
  'raj.kumar.rao': 'rajkummar_rao',
  'jayam.ravi': 'jayamravi_official',
  'surya.kumar.yadav': 'surya_14kumar',
  'kolkata.knight.riders': 'kkriders',
  'adah.sharma': 'adah_ki_adah',
  'shikhar.dhawan': 'shikhardofficial',
  'chennai.super.kings': 'chennaiipl',
  'dilijit.dosanjh': 'diljitdosanjh',
  'chinki.minki': 'surabhi.samriddhi',
  'virrender.sehwag': 'virendersehwag',
  'nischay.malhan': 'triggeredinsaan',
  'inc.kerla': 'inc_kerala',
  'sunanda.sharma': 'sunanda_ss',
  'kunchacko.boban': 'kunchacks',
  'robin.uthappa': 'robinaiyudauthappa',
  'bharatiya.janata.party': 'bjp4india',
  'sunitha.upadrashta': 'upadrashthasunitha',
  'sofia9__official': 'sofia9__official',
  'vasishta.n..simha': 'vasishta_simha',
  'shri.yogi.adityanath': 'myogi_adityanath',
  'pranita.subhash': 'pranitha.insta',
  'rachita.ram': 'rachita_instaofficial',
  'manoj.bajpayee': 'bajpayee.manoj',
  'jagat.prakash.nadda': 'jpnaddaofficial',
  'royal.challengers.benguluru': 'royalchallengers.bengaluru',
  'akhil.akkineni': 'akkineniakhil',
  'rinku.asha.mahadeo.rajguru': 'iamrinkurajguru',
  'navjot.singh.sidu': 'navjotsinghsidhu',
  'sherya.goshal': 'shreyaghoshal',
  'lavanya.tripathi': 'itsmelavanya',
  'harshi.beniwal': 'harshbeniwal',
  'meghana.raj.sarja': 'megsraj',
  't.natarajan': 'natarajan_jayaprakash',
  'shefalii.bagga': 'shefalibaggaofficial',
  'aashika.bhattia': '_aashikabhatia_',
  'eros.universe': 'erosnow',
  'adhitya.tv': 'adithyatv',
  'amazon.india': 'amazondotin',
  'tata.group': 'tatacompanies',
  'jaya.sharma.kishori': 'iamjayakishori',
  'gashmeer.mahajani': 'mahajani.gashmeer',
  'nimisha.bindu.sajayan': 'nimisha_sajayan',
  'kavya.manohor.shetty': 'kavyashettyofficial',
  'adinath.m.kothare': 'adinathkothare'
};

function tryDecode(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseCountFromMeta(meta) {
  if (!meta) return 0;
  const match = meta.match(/([\d,.]+)([KkMmBb]?)\s+Followers/i);
  if (!match) return 0;
  const numStr = match[1].replace(/,/g, '');
  const num = parseFloat(numStr);
  const unit = (match[2] || '').toUpperCase();
  if (unit === 'M') return Math.round(num * 1000000);
  if (unit === 'K') return Math.round(num * 1000);
  if (unit === 'B') return Math.round(num * 1000000000);
  return Math.round(num);
}

function extractNumber(html, field) {
  const patterns = [
    new RegExp(`"${field}"\\s*:\\s*(\\d+)`),
    new RegExp(`'${field}'\\s*:\\s*(\\d+)`),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) return parseInt(m[1], 10);
  }
  return 0;
}

function extractString(html, field) {
  const pat = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m = html.match(pat);
  return m?.[1] ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').trim() : null;
}

function extractBool(html, field) {
  const pat = new RegExp(`"${field}"\\s*:\\s*(true|false)`);
  const m = html.match(pat);
  return m?.[1] === "true";
}

function parseProfileFromHTML(html, handle) {
  const metaMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/i);
  const metaFollowers = metaMatch ? parseCountFromMeta(metaMatch[1]) : 0;

  // Check for follower fields
  if (!html.includes('"follower_count"') && !html.includes('"edge_followed_by"') && !metaFollowers) {
    const isLoginWall = html.includes("Log In") && html.includes("Sign Up") && html.length < 50000;
    if (isLoginWall) {
      throw new Error(
        `Instagram returned a login wall for @${handle}. The session cookies may be invalid or expired.`
      );
    }
    throw new Error(
      `No follower_count field found in Instagram HTML for @${handle}. Profile may be private, suspended, or page structure has changed.`
    );
  }

  const username = extractString(html, "username") ?? handle;
  const followersCount = extractNumber(html, "follower_count") ||
    (() => {
      const edge = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
      return edge?.[1] ? parseInt(edge[1], 10) : 0;
    })() || metaFollowers;
  const displayName = extractString(html, "full_name");
  const isVerified = extractBool(html, "is_verified");

  return {
    username: username.toLowerCase(),
    displayName: displayName?.trim() || null,
    followersCount,
    isVerified,
  };
}

function getEffectiveSignal(externalSignal, timeoutMs = 9000) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!externalSignal) return timeoutSignal;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([externalSignal, timeoutSignal]);
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort(externalSignal.reason || timeoutSignal.reason);
  if (externalSignal.aborted) {
    controller.abort(externalSignal.reason);
    return controller.signal;
  }
  if (timeoutSignal.aborted) {
    controller.abort(timeoutSignal.reason);
    return controller.signal;
  }
  externalSignal.addEventListener("abort", onAbort, { once: true });
  timeoutSignal.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER 1: Direct Web Engine (Desktop Chrome SSR)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchServer1(handle, { sessionId, csrfToken, signal, timeoutMs = 9000 }) {
  const profileUrl = `https://www.instagram.com/${handle}/`;

  try {
    const s1Signal = getEffectiveSignal(signal, timeoutMs);
    const res = await fetch(profileUrl, {
      redirect: "follow",
      signal: s1Signal,
      headers: {
        ...PAGE_HEADERS,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseProfileFromHTML(html, handle);
      if (parsed.followersCount > 0) {
        return { ...parsed, server: 'Server 1 (Direct Web)' };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }

  // Fallback to web_profile_info if session cookies provided
  const rawSession = (sessionId || "").trim();
  let rawCsrf = (csrfToken || "").trim();
  if (rawSession || rawCsrf) {
    let cookieHeader = "";
    if (rawSession.includes("sessionid=") || rawSession.includes(";")) {
      cookieHeader = rawSession;
      const matchCsrf = rawSession.match(/csrftoken=([^;]+)/);
      if (matchCsrf && !rawCsrf) rawCsrf = matchCsrf[1];
    } else {
      cookieHeader = [
        ...(rawSession ? [`sessionid=${rawSession}`] : []),
        ...(rawCsrf ? [`csrftoken=${rawCsrf}`] : []),
      ].join("; ");
    }

    const infoUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
    const s2Signal = getEffectiveSignal(signal, timeoutMs);
    const res = await fetch(infoUrl, {
      redirect: "follow",
      signal: s2Signal,
      headers: {
        ...XHR_HEADERS,
        Origin: "https://www.instagram.com",
        Referer: `https://www.instagram.com/${handle}/`,
        Cookie: cookieHeader,
        ...(rawCsrf ? { "X-CSRFToken": rawCsrf } : {}),
      },
    });

    if (res.ok) {
      const infoJson = await res.json();
      const user = infoJson.data?.user;
      if (user && (user.edge_followed_by?.count || user.follower_count)) {
        return {
          username: user.username?.toLowerCase() || handle,
          displayName: user.full_name?.trim() || null,
          followersCount: user.edge_followed_by?.count || user.follower_count || 0,
          isVerified: user.is_verified || false,
          server: 'Server 1 (Direct Web)'
        };
      }
    }
  }

  throw new Error(`Server 1: Instagram HTML login wall or rate limit for @${handle}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER 2: Mobile iOS Safari Engine (iPhone SSR)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchServer2(handle, { sessionId, csrfToken, signal, timeoutMs = 9000 }) {
  const profileUrl = `https://www.instagram.com/${handle}/`;

  try {
    const sSignal = getEffectiveSignal(signal, timeoutMs);
    const res = await fetch(profileUrl, {
      redirect: "follow",
      signal: sSignal,
      headers: {
        ...PAGE_HEADERS,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        Referer: "https://www.instagram.com/",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseProfileFromHTML(html, handle);
      if (parsed.followersCount > 0) {
        return { ...parsed, server: 'Server 2 (Mobile iOS)' };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }

  // Fallback to Mobile App API if cookies provided
  const rawSession = (sessionId || "").trim();
  let rawCsrf = (csrfToken || "").trim();
  if (rawSession || rawCsrf) {
    const mobileHeaders = {
      "User-Agent": "Instagram 319.0.0.38.109 Android (33/13; 420dpi; 1080x2400; samsung; SM-G998B; o1s; exynos2100; en_US; 573210486)",
      "X-IG-App-ID": "936619743392459",
      "X-IG-WWW-Claim": "0",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://www.instagram.com",
      "Referer": "https://www.instagram.com/",
      "Cookie": rawSession.includes("sessionid=") ? rawSession : `sessionid=${rawSession}; csrftoken=${rawCsrf};`,
      ...(rawCsrf ? { "X-CSRFToken": rawCsrf } : {})
    };
    try {
      const sSignal = getEffectiveSignal(signal, timeoutMs);
      const res = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${handle}`, {
        headers: mobileHeaders,
        signal: sSignal
      });
      if (res.ok) {
        const json = await res.json();
        const user = json.data?.user;
        if (user && (user.edge_followed_by?.count || user.follower_count)) {
          return {
            username: user.username?.toLowerCase() || handle,
            displayName: user.full_name?.trim() || null,
            followersCount: user.edge_followed_by?.count || user.follower_count || 0,
            isVerified: user.is_verified || false,
            server: 'Server 2 (Mobile iOS)'
          };
        }
      }
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }

  throw new Error(`Server 2: Mobile iOS engine throttled or blocked for @${handle}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER 3: Android Mobile Web Engine (Pixel / Galaxy Chrome SSR)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchServer3(handle, { signal, timeoutMs = 9000 }) {
  const profileUrl = `https://www.instagram.com/${handle}/`;

  try {
    const sSignal = getEffectiveSignal(signal, timeoutMs);
    const res = await fetch(profileUrl, {
      redirect: "follow",
      signal: sSignal,
      headers: {
        ...PAGE_HEADERS,
        "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36",
        "Sec-CH-UA": '"Chromium";v="126", "Android";v="14"',
        "Sec-CH-UA-Mobile": "?1",
        "Sec-CH-UA-Platform": '"Android"',
        Referer: "https://www.instagram.com/",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseProfileFromHTML(html, handle);
      if (parsed.followersCount > 0) {
        return { ...parsed, server: 'Server 3 (Android Mobile)' };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }

  throw new Error(`Server 3: Android mobile engine throttled or blocked for @${handle}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER 4: Search Engine Snapshot Engine (Bing Web Index / Cache)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchServer4(handle, { signal, timeoutMs = 9000 }) {
  const query = `${encodeURIComponent(handle)}+instagram+followers`;
  const url = `https://www.bing.com/search?q=${query}`;

  const searchHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
  };

  try {
    const sSignal = getEffectiveSignal(signal, timeoutMs);
    const res = await fetch(url, {
      headers: searchHeaders,
      signal: sSignal
    });

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/([\d,.]+)([KkMmBb]?)\s+[Ff]ollowers/i);
      if (match) {
        const count = parseCountFromMeta(match[0]);
        if (count > 0) {
          return {
            username: handle,
            displayName: handle,
            followersCount: count,
            isVerified: false,
            server: 'Server 4 (Search Index Snapshot)'
          };
        }
      }
    }
  } catch (e) {
    if (signal?.aborted) throw e;
  }

  throw new Error(`Server 4: Search index snapshot not found for @${handle}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER 5: macOS & Firefox Rotating UA Engine
// ─────────────────────────────────────────────────────────────────────────────
const ROTATING_UA_POOL = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
];

async function fetchServer5(handle, { signal, timeoutMs = 9000 }) {
  const randomUa = ROTATING_UA_POOL[Math.floor(Math.random() * ROTATING_UA_POOL.length)];
  const profileUrl = `https://www.instagram.com/${handle}/`;

  try {
    const sSignal = getEffectiveSignal(signal, timeoutMs);
    const res = await fetch(profileUrl, {
      redirect: "follow",
      signal: sSignal,
      headers: {
        ...PAGE_HEADERS,
        "User-Agent": randomUa,
        Referer: "https://www.instagram.com/",
      }
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseProfileFromHTML(html, handle);
      if (parsed.followersCount > 0) {
        return { ...parsed, server: 'Server 5 (Rotating UA Pool)' };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }

  throw new Error(`Server 5: Blocked or follower count missing in HTML for @${handle}`);
}

export class InstagramFollowersScraper {
  constructor(sessionId = "", csrfToken = "") {
    this.sessionId = tryDecode(sessionId.trim());
    this.csrfToken = tryDecode(csrfToken.trim());
  }

  /**
   * Fetches latest follower count with Server 1-5 selection or Auto-Failover.
   * serverChoice: 'auto' | 'server1' | 'server2' | 'server3' | 'server4' | 'server5'
   */
  async fetchFollowers(username, { signal: externalSignal, timeoutMs = 9000, serverChoice = 'auto', onServerSwitch = null } = {}) {
    let handle = username.trim().replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
    if (HANDLE_ALIASES[handle]) {
      handle = HANDLE_ALIASES[handle];
    }

    if (externalSignal?.aborted) {
      throw new Error("Skipped manually by admin");
    }

    const opts = {
      sessionId: this.sessionId,
      csrfToken: this.csrfToken,
      signal: externalSignal,
      timeoutMs
    };

    // Manual single server selection
    if (serverChoice === 'server1') return await fetchServer1(handle, opts);
    if (serverChoice === 'server2') return await fetchServer2(handle, opts);
    if (serverChoice === 'server3') return await fetchServer3(handle, opts);
    if (serverChoice === 'server4') return await fetchServer4(handle, opts);
    if (serverChoice === 'server5') return await fetchServer5(handle, opts);

    // Auto-Failover: Cascades from Server 1 through Server 5 seamlessly
    const serverPipeline = [
      { name: 'Server 1 (Direct Web)', fn: () => fetchServer1(handle, opts) },
      { name: 'Server 2 (Mobile iOS)', fn: () => fetchServer2(handle, opts) },
      { name: 'Server 3 (Android Mobile)', fn: () => fetchServer3(handle, opts) },
      { name: 'Server 4 (Search Index Snapshot)', fn: () => fetchServer4(handle, opts) },
      { name: 'Server 5 (Rotating UA Pool)', fn: () => fetchServer5(handle, opts) },
    ];

    let lastError = null;
    for (let i = 0; i < serverPipeline.length; i++) {
      if (externalSignal?.aborted) {
        throw new Error("Skipped manually by admin");
      }
      const srv = serverPipeline[i];
      try {
        const result = await srv.fn();
        if (result && result.followersCount > 0) {
          return result;
        }
      } catch (err) {
        if (externalSignal?.aborted) throw err;
        lastError = err;
        const nextSrv = serverPipeline[i + 1];
        if (nextSrv && onServerSwitch) {
          onServerSwitch({
            failedServer: srv.name,
            nextServer: nextSrv.name,
            handle,
            error: err.message
          });
        }
      }
    }

    throw lastError || new Error(`All 5 servers failed to fetch followers for @${handle}`);
  }
}
