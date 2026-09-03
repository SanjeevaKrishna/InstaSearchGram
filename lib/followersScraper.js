// Standalone Followers-Only Instagram Scraper
// This file is completely independent and has no dependencies on database or parent project models.

const PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
    "image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-CH-UA": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
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
      return edge?.[1] ? parseInt(edge[1], 10) : metaFollowers;
    })();
  const displayName = extractString(html, "full_name");
  const isVerified = extractBool(html, "is_verified");

  return {
    username: username.toLowerCase(),
    displayName: displayName?.trim() || null,
    followersCount,
    isVerified,
  };
}

export class InstagramFollowersScraper {
  constructor(sessionId = "", csrfToken = "") {
    this.sessionId = tryDecode(sessionId.trim());
    this.csrfToken = tryDecode(csrfToken.trim());
  }

  /**
   * Fetches the latest followers count for a given handle.
   * Attempts a cookie-free (unauthenticated) request first since Instagram
   * embeds stats in the SSR page. Falls back to sending cookies if rate-limited or blocked.
   */
  async fetchFollowers(username) {
    let handle = username.trim().replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
    if (HANDLE_ALIASES[handle]) {
      handle = HANDLE_ALIASES[handle];
    }
    const profileUrl = `https://www.instagram.com/${handle}/`;

    // Strategy 1: Fetch without cookies (SSR version typically has the JSON or meta embedded)
    try {
      console.log(`[FollowersScraper] Fetching @${handle} without cookies...`);
      const res = await fetch(profileUrl, {
        redirect: "follow",
        headers: {
          ...PAGE_HEADERS,
          Referer: "https://www.instagram.com/",
        },
      });

      if (res.ok) {
        const html = await res.text();
        return parseProfileFromHTML(html, handle);
      }
      console.warn(`[FollowersScraper] Fetch without cookies returned status ${res.status}`);
    } catch (err) {
      console.warn(`[FollowersScraper] Fetch without cookies failed:`, err.message);
    }

    // Strategy 2: Fallback to cookies if credentials are provided
    const rawSession = (this.sessionId || "").trim();
    let rawCsrf = (this.csrfToken || "").trim();

    if (!rawSession && !rawCsrf) {
      throw new Error(`Scrape failed without cookies. Set INSTAGRAM_SESSION_ID and INSTAGRAM_CSRF_TOKEN in your env to enable auth fallback.`);
    }

    console.log(`[FollowersScraper] Fetching @${handle} with authentication cookies via web_profile_info...`);
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
    const headers = {
      ...XHR_HEADERS,
      Origin: "https://www.instagram.com",
      Referer: `https://www.instagram.com/${handle}/`,
      Cookie: cookieHeader,
      ...(rawCsrf ? { "X-CSRFToken": rawCsrf } : {}),
    };

    let res = await fetch(infoUrl, {
      redirect: "manual",
      headers,
    });

    if (res.status === 302) {
      const redirectLocation = res.headers.get("location");
      if (redirectLocation && (redirectLocation.includes("/accounts/login") || redirectLocation.includes("login_required"))) {
        throw new Error(`Instagram returned a login redirect. Session cookie may be invalid or expired.`);
      }
      const redirectCookies = (res.headers.getSetCookie?.() ?? [])
        .map((c) => c.split(";")[0]?.trim() ?? "")
        .filter(Boolean)
        .join("; ");
      const mergedCookieHeader = [cookieHeader, redirectCookies].filter(Boolean).join("; ");
      const retryUrl = redirectLocation || infoUrl;
      res = await fetch(retryUrl, {
        redirect: "manual",
        headers: {
          ...headers,
          Cookie: mergedCookieHeader,
        },
      });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Instagram web_profile_info API returned HTTP ${res.status}. Body preview: ${text.slice(0, 150)}`);
    }

    const infoJson = await res.json();
    if (infoJson.status === 'ok' && (!infoJson.data || !infoJson.data.user)) {
      throw new Error(`Instagram profile @${handle} does not exist. Please check the spelling of the username.`);
    }

    const user = infoJson.data?.user;
    if (!user) {
      throw new Error(`Instagram web_profile_info returned invalid data structure.`);
    }

    return {
      username: user.username?.toLowerCase() || handle,
      displayName: user.full_name?.trim() || null,
      followersCount: user.edge_followed_by?.count || 0,
      isVerified: user.is_verified || false,
    };
  }
}
