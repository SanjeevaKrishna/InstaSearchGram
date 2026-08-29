// Instagram Reel & Post Engagement Scraper
// Extracts views, likes, comments, creator details, and thumbnail for any Instagram reel/post

const PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
    "image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
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

export function extractShortcode(url) {
  if (!url) return null;
  const clean = url.toString().trim();
  const m = clean.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : clean.length < 20 && !clean.includes('/') ? clean : null;
}

export function formatNumberText(count) {
  if (!count || isNaN(count)) return "0";
  const num = Number(count);
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return num.toLocaleString();
}

function parseNumber(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = val.toString().replace(/,/g, "").trim().toLowerCase();
  if (cleaned.endsWith("b")) return Math.round(parseFloat(cleaned) * 1000000000);
  if (cleaned.endsWith("m")) return Math.round(parseFloat(cleaned) * 1000000);
  if (cleaned.endsWith("k")) return Math.round(parseFloat(cleaned) * 1000);
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

export function calculateTrendingScore(views = 0, likes = 0, comments = 0, uploadedAt = null) {
  const v = Math.max(0, Number(views) || 0);
  const l = Math.max(0, Number(likes) || 0);
  const c = Math.max(0, Number(comments) || 0);

  // 1. Heavy Engagement Weighted Points
  // Comments: 100x weight (active conversation, controversy, virality)
  // Likes: 25x weight (appreciation, endorsement)
  // Views: 1x weight (base reach)
  const rawEngagement = v + (l * 25) + (c * 100);

  // 2. Viral Engagement Density Multiplier (Interaction Rate vs Views)
  // A reel where 10% of viewers liked & commented is 10x more viral than passive views
  const likeRatio = v > 0 ? (l / v) : 0.05;
  const commentRatio = v > 0 ? (c / v) : 0.005;
  const densityMultiplier = 1 + (Math.min(0.5, likeRatio) * 20) + (Math.min(0.1, commentRatio) * 120);

  // 3. Time Decay & Velocity Curve (Power Law Decay)
  let hoursAge = 12; // default 12 hours
  if (uploadedAt) {
    try {
      const diffMs = Date.now() - new Date(uploadedAt).getTime();
      hoursAge = Math.max(0.5, diffMs / (1000 * 60 * 60));
    } catch {
      hoursAge = 12;
    }
  }

  // Decay curve: (hoursAge + 2)^1.15
  // - 6 hours old: (6 + 2)^1.15 = 10.92 (Explosive boost for new viral drops)
  // - 24 hours old: (24 + 2)^1.15 = 42.4 (Peak 24h trending window)
  // - 48 hours old: (48 + 2)^1.15 = 90.5 (If it has monster comments/likes, it stays in Top 3)
  // - 96 hours old: (96 + 2)^1.15 = 199.1 (Gently decays so new content takes the lead)
  const timeDecay = Math.pow(hoursAge + 2, 1.15);

  const finalScore = (rawEngagement * densityMultiplier) / timeDecay;
  return Math.round(finalScore);
}

export class InstagramReelScraper {
  constructor(sessionId = "", csrfToken = "") {
    let rawSession = (sessionId || "").trim();
    let rawCsrf = (csrfToken || "").trim();

    // If user pasted the whole cookie string into session_id
    if (rawSession.includes("sessionid=")) {
      const match = rawSession.match(/sessionid=([^;]+)/);
      if (match) rawSession = match[1];
    }
    if (rawSession.includes("csrftoken=")) {
      const match = rawSession.match(/csrftoken=([^;]+)/);
      if (match && !rawCsrf) rawCsrf = match[1];
    }

    // Clean prefix if entered as "sessionid=..."
    rawSession = rawSession.replace(/^sessionid=/i, "").trim();
    rawCsrf = rawCsrf.replace(/^csrftoken=/i, "").trim();

    this.sessionId = rawSession;
    this.csrfToken = rawCsrf;
  }

  async fetchReel(urlOrShortcode) {
    const shortcode = extractShortcode(urlOrShortcode);
    if (!shortcode) {
      throw new Error(`Invalid Instagram Reel URL or shortcode: "${urlOrShortcode}"`);
    }

    const cookieHeader = [
      ...(this.sessionId ? [`sessionid=${this.sessionId}`] : []),
      ...(this.csrfToken ? [`csrftoken=${this.csrfToken}`] : []),
      `ds_user_id=${this.sessionId.split('%3A')[0] || ''}`
    ].filter(Boolean).join("; ");

    const headers = {
      ...XHR_HEADERS,
      Origin: "https://www.instagram.com",
      Referer: `https://www.instagram.com/reel/${shortcode}/`,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(this.csrfToken ? { "X-CSRFToken": this.csrfToken } : {}),
    };

    // Strategy 1: GraphQL Query Hash
    try {
      const queryHash = "b3055c01b4b222b8a47dc12b090e4e64";
      const gqlUrl = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(
        JSON.stringify({ shortcode, child_comment_count: 3, fetch_comment_sub_thread_count: 0, parent_comment_count: 0, has_threaded_comments: false })
      )}`;

      const res = await fetch(gqlUrl, { headers });
      if (res.ok) {
        const json = await res.json();
        const media = json.data?.shortcode_media;
        if (media) {
          return this.parseGraphQLMedia(media, shortcode);
        }
      }
    } catch (err) {
      console.warn(`[ReelScraper] Strategy 1 (GraphQL) failed for ${shortcode}:`, err.message);
    }

    // Strategy 2: Web Info (?__a=1&__d=dis)
    try {
      const infoUrl = `https://www.instagram.com/reel/${shortcode}/?__a=1&__d=dis`;
      const res = await fetch(infoUrl, { headers });
      if (res.ok) {
        const json = await res.json();
        const item = json.items?.[0] || json.graphql?.shortcode_media;
        if (item) {
          return this.parseMediaItem(item, shortcode);
        }
      }
    } catch (err) {
      console.warn(`[ReelScraper] Strategy 2 (__a=1) failed for ${shortcode}:`, err.message);
    }

    // Strategy 3: GraphQL doc_id endpoint
    try {
      const docUrl = `https://www.instagram.com/graphql/query/?doc_id=10015901848480474&variables=${encodeURIComponent(
        JSON.stringify({ shortcode })
      )}`;
      const res = await fetch(docUrl, { headers });
      if (res.ok) {
        const json = await res.json();
        const media = json.data?.xdt_shortcode_media || json.data?.shortcode_media;
        if (media) {
          return this.parseGraphQLMedia(media, shortcode);
        }
      }
    } catch (err) {
      console.warn(`[ReelScraper] Strategy 3 (doc_id) failed for ${shortcode}:`, err.message);
    }

    // Strategy 4: Desktop SSR HTML Parsing
    try {
      const pageUrl = `https://www.instagram.com/reel/${shortcode}/`;
      const res = await fetch(pageUrl, {
        headers: {
          ...PAGE_HEADERS,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      });

      if (res.ok) {
        const html = await res.text();
        const parsed = this.parseHTML(html, shortcode);
        if (parsed && (parsed.viewsCount > 0 || parsed.likesCount > 0)) return parsed;
      }
    } catch (err) {
      console.warn(`[ReelScraper] Strategy 4 (HTML) failed for ${shortcode}:`, err.message);
    }

    // Strategy 5: Instagram oEmbed Fallback (fetches creator, title, thumbnail publicly)
    try {
      const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/reel/${shortcode}/`;
      const res = await fetch(oembedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.author_name) {
          return {
            shortcode,
            viewsCount: 0,
            likesCount: 0,
            commentsCount: 0,
            viewsText: "—",
            likesText: "—",
            commentsText: "—",
            creatorName: data.author_name,
            creatorHandle: data.author_name,
            creatorPhotoUrl: "",
            thumbnailUrl: data.thumbnail_url || "",
            title: data.title ? data.title.slice(0, 80) : `Reel @${data.author_name}`,
            takenAt: new Date().toISOString(),
            score: 0
          };
        }
      }
    } catch (err) {
      console.warn(`[ReelScraper] Strategy 5 (oEmbed) failed for ${shortcode}:`, err.message);
    }

    throw new Error(`Failed to scrape Instagram reel @${shortcode}. Please provide a valid active Instagram session ID in Global Settings.`);
  }

  parseGraphQLMedia(media, shortcode) {
    const views = media.video_play_count || media.video_view_count || media.play_count || media.view_count || 0;
    const likes = media.edge_media_preview_like?.count || media.edge_liked_by?.count || media.like_count || 0;
    const comments = media.edge_media_to_parent_comment?.count || media.edge_media_to_comment?.count || media.comment_count || 0;

    const creatorName = media.owner?.full_name || media.owner?.username || "";
    const creatorHandle = media.owner?.username || "";
    const creatorPhotoUrl = media.owner?.profile_pic_url || "";
    const thumbnailUrl = media.display_url || media.thumbnail_src || "";
    const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text || "";
    const takenAt = media.taken_at_timestamp ? new Date(media.taken_at_timestamp * 1000).toISOString() : new Date().toISOString();

    const score = calculateTrendingScore(views, likes, comments, takenAt);

    return {
      shortcode,
      viewsCount: views,
      likesCount: likes,
      commentsCount: comments,
      viewsText: formatNumberText(views),
      likesText: formatNumberText(likes),
      commentsText: formatNumberText(comments),
      creatorName,
      creatorHandle,
      creatorPhotoUrl,
      thumbnailUrl,
      title: caption ? caption.slice(0, 80) : `Reel @${creatorHandle || shortcode}`,
      takenAt,
      score
    };
  }

  parseMediaItem(item, shortcode) {
    const views = item.play_count || item.view_count || item.video_view_count || 0;
    const likes = item.like_count || item.edge_media_preview_like?.count || 0;
    const comments = item.comment_count || item.edge_media_to_comment?.count || 0;

    const user = item.user || item.owner || {};
    const creatorName = user.full_name || user.username || "";
    const creatorHandle = user.username || "";
    const creatorPhotoUrl = user.profile_pic_url || "";
    const thumbnailUrl = item.image_versions2?.candidates?.[0]?.url || item.display_url || "";
    const caption = item.caption?.text || "";
    const takenAt = item.taken_at ? new Date(item.taken_at * 1000).toISOString() : new Date().toISOString();

    const score = calculateTrendingScore(views, likes, comments, takenAt);

    return {
      shortcode,
      viewsCount: views,
      likesCount: likes,
      commentsCount: comments,
      viewsText: formatNumberText(views),
      likesText: formatNumberText(likes),
      commentsText: formatNumberText(comments),
      creatorName,
      creatorHandle,
      creatorPhotoUrl,
      thumbnailUrl,
      title: caption ? caption.slice(0, 80) : `Reel @${creatorHandle || shortcode}`,
      takenAt,
      score
    };
  }

  parseHTML(html, shortcode) {
    // Look for embedded og:description: "12M likes, 45K comments - username on date: ..."
    let likes = 0;
    let comments = 0;
    let views = 0;

    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (descMatch) {
      const content = descMatch[1];
      const likesMatch = content.match(/([\d.,KMkmBb]+)\s+likes/i);
      if (likesMatch) likes = parseNumber(likesMatch[1]);

      const commentsMatch = content.match(/([\d.,KMkmBb]+)\s+comments/i);
      if (commentsMatch) comments = parseNumber(commentsMatch[1]);
    }

    const viewsMatch = html.match(/"video_play_count"\s*:\s*(\d+)/) || html.match(/"video_view_count"\s*:\s*(\d+)/);
    if (viewsMatch) {
      views = parseInt(viewsMatch[1], 10);
    } else if (likes > 0) {
      // Estimate views from likes ratio if views field is not exposed publicly
      views = Math.round(likes * 8.5);
    }

    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const title = titleMatch ? titleMatch[1] : `Reel ${shortcode}`;

    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const thumbnailUrl = imageMatch ? imageMatch[1] : "";
    const takenAt = new Date().toISOString();

    const score = calculateTrendingScore(views, likes, comments, takenAt);

    return {
      shortcode,
      viewsCount: views,
      likesCount: likes,
      commentsCount: comments,
      viewsText: formatNumberText(views),
      likesText: formatNumberText(likes),
      commentsText: formatNumberText(comments),
      creatorName: "",
      creatorHandle: "",
      creatorPhotoUrl: "",
      thumbnailUrl,
      title: title.slice(0, 80),
      takenAt: new Date().toISOString(),
      score
    };
  }
}
