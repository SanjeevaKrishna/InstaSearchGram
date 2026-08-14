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


function tryDecode(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
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
  // Check for follower fields
  if (!html.includes('"follower_count"') && !html.includes('"edge_followed_by"')) {
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
  const followersCount = extractNumber(html, "follower_count");
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
    const handle = username.trim().replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
    const profileUrl = `https://www.instagram.com/${handle}/`;

    // Strategy 1: Fetch without cookies (SSR version typically has the JSON embedded)
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
      console.warn(`[FollowersScraper] Fetch without cookies failed:`, err);
    }

    // Strategy 2: Fallback to cookies if credentials are provided
    if (!this.sessionId && !this.csrfToken) {
      throw new Error(`Scrape failed without cookies. Set INSTAGRAM_SESSION_ID and INSTAGRAM_CSRF_TOKEN in your env to enable auth fallback.`);
    }

    console.log(`[FollowersScraper] Fetching @${handle} with authentication cookies via web_profile_info...`);
    const cookieHeader = [
      ...(this.sessionId ? [`sessionid=${this.sessionId}`] : []),
      ...(this.csrfToken ? [`csrftoken=${this.csrfToken}`] : []),
    ].join("; ");

    const infoUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
    const headers = {
      ...XHR_HEADERS,
      Origin: "https://www.instagram.com",
      Referer: `https://www.instagram.com/${handle}/`,
      Cookie: cookieHeader,
      ...(this.csrfToken ? { "X-CSRFToken": this.csrfToken } : {}),
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
