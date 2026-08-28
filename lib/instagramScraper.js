"use strict";
// Standalone Instagram Scraper for Test Mode
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramCollector = void 0;
const logger = {
    info: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.log(...args)
};
/** Known shorthand aliases → real Instagram handles */
const HANDLE_ALIASES = {
    virat: "virat.kohli",
    beingsalman: "beingsalmankhan",
};
/**
 * Standard browser headers for an HTML page navigation.
 * Used when fetching the profile HTML page (like a browser visiting the URL).
 */
const PAGE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
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
/**
 * Standard browser headers for XHR/fetch requests (feed API calls).
 */
const XHR_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
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
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function extractCause(err) {
    if (!(err instanceof Error))
        return undefined;
    if (err.cause instanceof Error)
        return err.cause.message;
    if (err.cause != null)
        return String(err.cause);
    return undefined;
}
/**
 * URL-decode cookie values safely.
 * Chrome DevTools sometimes shows cookie values in percent-encoded form
 * (%3A instead of :). Sending %3A in the Cookie header causes auth failures.
 */
function tryDecode(raw) {
    try {
        return decodeURIComponent(raw);
    }
    catch {
        return raw;
    }
}
/**
 * Extracts a numeric field from a raw HTML string.
 * Instagram embeds user data as a JSON blob inside a <script> tag.
 * We search for the field name and grab the number that follows it.
 */
function extractNumber(html, field) {
    const patterns = [
        // "field":12345
        new RegExp(`"${field}"\\s*:\\s*(\\d+)`),
        // 'field':12345
        new RegExp(`'${field}'\\s*:\\s*(\\d+)`),
    ];
    for (const pat of patterns) {
        const m = html.match(pat);
        if (m?.[1])
            return parseInt(m[1], 10);
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
/**
 * Parses Instagram profile data from the raw HTML of the profile page.
 *
 * Instagram embeds user data as JSON inside one of the inline <script> tags.
 * The data does NOT use __NEXT_DATA__ or _sharedData — it is embedded
 * directly as a JSON fragment. We locate it by searching for key field names.
 *
 * Verified approach: GET https://www.instagram.com/{username}/ returns HTTP 200
 * for public profiles without any auth, and the HTML body contains:
 *   "follower_count":685820455,"following_count":271,"media_count":7500,...
 */
function parseProfileFromHTML(html, handle) {
    // Verify the user data is actually in this page
    if (!html.includes('"follower_count"') && !html.includes('"edge_followed_by"')) {
        // Could be a private account or login wall
        const isLoginWall = html.includes("Log In") && html.includes("Sign Up") && html.length < 50000;
        if (isLoginWall) {
            throw new Error(`Instagram returned a login wall for @${handle} — the profile page requires authentication. ` +
                `Set INSTAGRAM_SESSION_ID and INSTAGRAM_CSRF_TOKEN in .env.local.`);
        }
        throw new Error(`No follower_count field found in Instagram HTML for @${handle}. ` +
            `The page structure may have changed or the account is private/suspended.`);
    }
    // Extract user ID — try multiple field names Instagram uses
    const userId = extractString(html, "id") ??
        extractString(html, "pk") ??
        (() => {
            // Try numeric id pattern near username
            const handleIdx = html.indexOf(`"username":"${handle}"`);
            if (handleIdx === -1)
                return null;
            const nearby = html.slice(Math.max(0, handleIdx - 200), handleIdx + 200);
            const idMatch = nearby.match(/"(?:id|pk)"\s*:\s*"?(\d{6,})"?/);
            return idMatch?.[1] ?? null;
        })();
    if (!userId) {
        throw new Error(`Could not extract user ID from Instagram HTML for @${handle}. ` +
            `The page embedded data structure may have changed.`);
    }
    const username = extractString(html, "username") ?? handle;
    const followersCount = extractNumber(html, "follower_count");
    const followingCount = extractNumber(html, "following_count");
    // Post count — try direct field first, then the nested edge format, then meta description.
    // Instagram uses "media_count":234 in newer embedded JSON, or
    // "edge_owner_to_timeline_media":{"count":234,...} in older GraphQL format.
    const postsCount = (() => {
        const direct = extractNumber(html, "media_count");
        if (direct > 0)
            return direct;
        // Nested edge format: {"count":N,...}
        const edgeMatch = html.match(/"edge_owner_to_timeline_media"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
        if (edgeMatch?.[1])
            return parseInt(edgeMatch[1], 10);
        // Meta description SEO tag: "686M Followers, 271 Following, 7,500 Posts - See Instagram..."
        const metaMatch = html.match(/(?:content|description)="[^"]*?(?:Followers|Following)[^"]*?,\s*([\d,]+)\s+Posts/i);
        if (metaMatch?.[1])
            return parseInt(metaMatch[1].replace(/,/g, ""), 10);
        return 0;
    })();
    const displayName = extractString(html, "full_name");
    const bio = extractString(html, "biography");
    const isVerified = extractBool(html, "is_verified");
    return {
        userId,
        username: username.toLowerCase(),
        followersCount,
        followingCount,
        postsCount,
        displayName: displayName?.trim() || null,
        bio: bio?.trim() || null,
        isVerified,
    };
}
class InstagramCollector {
    sessionId;
    csrfToken;
    maxPages;
    constructor(sessionId, csrfToken, maxPages = 5) {
        this.sessionId = sessionId;
        this.csrfToken = csrfToken;
        this.maxPages = maxPages;
    }
    async getProfileInfo(handle) {
        const decodedSessionId = tryDecode(this.sessionId.trim());
        const decodedCsrfToken = tryDecode(this.csrfToken.trim());
        
        const isFullCookie = decodedSessionId.includes("sessionid=") || decodedSessionId.includes(";");
        const cookieHeader = isFullCookie ? decodedSessionId : [
            ...(decodedSessionId ? [`sessionid=${decodedSessionId}`] : []),
            ...(decodedCsrfToken ? [`csrftoken=${decodedCsrfToken}`] : []),
        ].join("; ");
        
        const csrfToken = decodedCsrfToken || (cookieHeader.match(/csrftoken=([^;]+)/)?.[1] ?? "");
        const hasAuth = Boolean(cookieHeader);

        logger.info({
            handle,
            hasAuth,
            isFullCookie,
            sessionCookiePresent: Boolean(cookieHeader),
            csrfTokenPresent: Boolean(csrfToken),
        }, "[InstagramCollector] Starting profile fetch via HTML page");
        let profileData = null;
        let html = "";

        if (hasAuth) {
            logger.info({ handle }, "[InstagramCollector] Attempting to fetch profile via web_profile_info API with auth");
            const infoUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
            try {
                const infoRes = await fetch(infoUrl, {
                    redirect: "manual",
                    headers: {
                        ...XHR_HEADERS,
                        Origin: "https://www.instagram.com",
                        Referer: `https://www.instagram.com/${handle}/`,
                        Cookie: cookieHeader,
                        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
                    }
                });
                
                if (infoRes.ok) {
                    const infoJson = await infoRes.json();
                    
                    if (infoJson.status === 'ok' && (!infoJson.data || !infoJson.data.user)) {
                        throw new Error(`Instagram profile @${handle} does not exist. Please check the spelling of the username.`);
                    }
                    
                    const user = infoJson.data?.user;
                    if (user) {
                        profileData = {
                            userId: user.id,
                            username: user.username,
                            followersCount: user.edge_followed_by?.count || 0,
                            followingCount: user.edge_follow?.count || 0,
                            postsCount: user.edge_owner_to_timeline_media?.count || 0,
                            displayName: user.full_name?.trim() || null,
                            bio: user.biography?.trim() || null,
                            isVerified: user.is_verified || false,
                        };
                        logger.info({ handle }, "[InstagramCollector] ✅ Profile data parsed from web_profile_info API");
                    }
                } else {
                    logger.warn({ handle, status: infoRes.status }, "[InstagramCollector] web_profile_info API failed, falling back to HTML");
                }
            } catch (err) {
                logger.warn({ handle, error: String(err) }, "[InstagramCollector] web_profile_info API error, falling back to HTML");
            }
        }

        if (!profileData) {
            // ── Fetch profile HTML page (NO cookies) ─────────────────────
            const profileUrl = `https://www.instagram.com/${handle}/`;
            try {
                const pageRes = await fetch(profileUrl, {
                    redirect: "follow",
                    headers: {
                        ...PAGE_HEADERS,
                        Referer: "https://www.instagram.com/",
                    },
                });

                logger.info({
                    handle,
                    httpStatus: pageRes.status,
                    finalUrl: pageRes.url,
                    contentType: pageRes.headers.get("content-type"),
                }, "[InstagramCollector] Profile HTML page response");

                if (!pageRes.ok) {
                    const body = await pageRes.text().catch(() => "");
                    throw new Error(`Profile HTML page returned HTTP ${pageRes.status} for @${handle}. ` +
                        `Body: ${body.slice(0, 200)}`);
                }

                html = await pageRes.text();
            } catch (err) {
                if (err instanceof Error && err.message.startsWith("Profile HTML"))
                    throw err;
                const cause = extractCause(err);
                throw new Error(`Network error fetching profile page for @${handle}: ` +
                    `${err instanceof Error ? err.message : String(err)}` +
                    (cause ? ` (cause: ${cause})` : ""), { cause: err });
            }

            logger.debug({ handle, htmlLength: html.length }, "[InstagramCollector] Profile HTML received — parsing embedded user data");
            
            profileData = parseProfileFromHTML(html, handle);
            logger.info({
                handle,
                userId: profileData.userId,
                username: profileData.username,
                followersCount: profileData.followersCount,
                followingCount: profileData.followingCount,
                postsCount: profileData.postsCount,
                isVerified: profileData.isVerified,
            }, "[InstagramCollector] ✅  Profile data parsed from HTML — verify follower count");
        }
        return profileData;
    }
    async runTest(username, onProgress, nextMaxId = null, initialStats = null, lastScrapedDate = null) {
        const handle = this.resolveHandle(username);
        return this.runBuild(handle, onProgress, nextMaxId, initialStats, lastScrapedDate);
    }
    buildPromises = new Map();
    resolveHandle(input) {
        const cleaned = input.trim().replace(/^@/, "").replace(/\s+/g, "").toLowerCase();
        return HANDLE_ALIASES[cleaned] ?? cleaned;
    }
    getOrBuildSession(username) {
        const handle = this.resolveHandle(username);
        if (!this.buildPromises.has(handle)) {
            this.buildPromises.set(handle, this.runBuild(handle));
        }
        return this.buildPromises.get(handle);
    }
    async runBuild(handle, onProgress, initialNextMaxId = null, initialStats = null, lastScrapedDate = null) {
        const profileData = await this.getProfileInfo(handle);
        // ── Step 3: Paginate feed for engagement stats ────────────────────────
        // Requires auth cookies. If cookies are missing or the endpoint fails,
        // we skip gracefully and return empty arrays (profile data is still saved).
        logger.info({ handle }, "[WORKER_LIFECYCLE] WORKER_CREATED");
        const posts = [];
        const reels = [];
        let finalNextMaxId = initialNextMaxId;
        let finalMoreAvailable = true;
        let processedItems = initialStats?.processedItems || 0;
        let skippedPosts = initialStats?.skippedPosts || 0;
        let totalReelViews = initialStats?.totalReelViews || 0;
        let totalReelLikes = initialStats?.totalReelLikes || 0;
        let totalPostLikes = initialStats?.totalPostLikes || 0;
        let totalComments = initialStats?.totalComments || 0;
        let totalReelsCount = initialStats?.totalReelsCount || 0;
        let totalPostsCount = initialStats?.totalPostsCount || 0;
        let topPostLikes = initialStats?.topPostLikes || 0;
        let topPostLikesDate = initialStats?.topPostLikesDate || null;
        let topPostComments = initialStats?.topPostComments || 0;
        let topPostCommentsDate = initialStats?.topPostCommentsDate || null;
        let topReelViews = initialStats?.topReelViews || 0;
        let topReelViewsDate = initialStats?.topReelViewsDate || null;
        let collabPosts = initialStats?.collabPosts || 0;
        let normalPosts = initialStats?.normalPosts || 0;
        let taggedNonCollab = initialStats?.taggedNonCollab || 0;
        let latestItemsEngagement = initialStats?.latestItemsEngagement || 0;
        let latestItemsCount = initialStats?.latestItemsCount || 0;
        let latestPostDate = initialStats?.latestPostDate || null;
        let scaledInteraction = 0;
        let avgReelViews = 0;
        let avgReelLikes = 0;
        let avgPostLikes = 0;
        const seenMediaIds = new Set(initialStats?.seenMediaIds || []);
        logger.info({ handle }, "[WORKER_LIFECYCLE] WORKER_STARTED");
        if (!hasAuth) {
            logger.warn({ handle }, "[InstagramCollector] No auth cookies — skipping feed pagination.");
        }
        else {
            const feedHeaders = {
                ...XHR_HEADERS,
                Origin: "https://www.instagram.com",
                Referer: `https://www.instagram.com/${handle}/`,
                Cookie: cookieHeader,
                ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
            };
            // ── Feed API Loop (Profile Grid) ──
            let nextMaxId = initialNextMaxId;
            let moreAvailable = true;
            let page = 0;
            while (moreAvailable && page < this.maxPages) {
                const params = new URLSearchParams({ count: "50" });
                if (nextMaxId)
                    params.set("max_id", nextMaxId);
                const feedUrl = `https://www.instagram.com/api/v1/feed/user/${profileData.userId}/?${params}`;
                let feedRes = null;
                let attempts = 0;
                while (attempts < 5) {
                    attempts++;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);
                    try {
                        feedRes = await fetch(feedUrl, {
                            redirect: "manual",
                            headers: feedHeaders,
                            signal: controller.signal,
                        });
                    }
                    catch (feedErr) {
                        const isAbort = feedErr instanceof Error && feedErr.name === 'AbortError';
                        logger.warn({ handle, page, error: feedErr instanceof Error ? feedErr.message : String(feedErr) }, `[WORKER_LIFECYCLE] WORKER_ERROR - ${isAbort ? 'Timeout' : 'Network error'} on feed page`);
                        if (isAbort)
                            logger.warn({ handle }, "[WORKER_LIFECYCLE] WORKER_TERMINATED (Timeout)");
                        break;
                    }
                    finally {
                        clearTimeout(timeoutId);
                    }
                    if (feedRes.status === 429) {
                        logger.warn({ handle, page }, "[WORKER_LIFECYCLE] WORKER_MESSAGE - Rate limited (429), backing off...");
                        const avgReelViews = totalReelsCount > 0 ? Math.round(totalReelViews / totalReelsCount) : 0;
                        const avgReelLikes = totalReelsCount > 0 ? Math.round(totalReelLikes / totalReelsCount) : 0;
                        const avgPostLikes = totalPostsCount > 0 ? Math.round(totalPostLikes / totalPostsCount) : 0;
                        const rawInteractionRate = profileData.followersCount > 0 && latestItemsCount > 0
                            ? ((latestItemsEngagement / latestItemsCount) / profileData.followersCount) * 100
                            : 0;
                        const scaledInteraction = rawInteractionRate > 0 
                            ? parseFloat((50 + 49.9 * (rawInteractionRate / (rawInteractionRate + 0.65))).toFixed(2))
                            : 0;
                        onProgress?.({
                            page, processedItems, totalPosts: profileData.postsCount, totalReels: totalReelsCount,
                            totalReelViews, totalReelLikes, totalPostLikes, totalComments,
                            totalReelsCount, totalPostsCount,
                            topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                            topPostComments: { count: topPostComments, date: topPostCommentsDate },
                            topReelViews: { count: topReelViews, date: topReelViewsDate },
                            averageReelViews: avgReelViews,
                            averageReelLikes: avgReelLikes,
                            averagePostLikes: avgPostLikes,
                            latestEngagementRate: parseFloat(scaledInteraction.toFixed(2)),
                            isComplete: false, rateLimited: true,
                            nextMaxId,
                            latestPostDate
                        });
                        await sleep(60000);
                        logger.warn({ handle }, "[WORKER_LIFECYCLE] WORKER_RESTARTED (after 429)");
                        continue;
                    }
                    break;
                }
                if (!feedRes)
                    break;
                // Redirect handler for Feed API
                if (feedRes.status >= 300 && feedRes.status < 400) {
                    const location = feedRes.headers.get("location") ?? "";
                    if (location.includes("/accounts/login") || location.includes("login_required")) {
                        logger.warn({ handle }, "[WORKER_LIFECYCLE] WORKER_ERROR - Redirected to login (session expired)");
                        break;
                    }
                    const redirectCookies = (feedRes.headers.getSetCookie?.() ?? [])
                        .map((c) => c.split(";")[0]?.trim() ?? "")
                        .filter(Boolean)
                        .join("; ");
                    const mergedCookieHeader = [cookieHeader, redirectCookies].filter(Boolean).join("; ");
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);
                    try {
                        const retryUrl = location || feedUrl;
                        feedRes = await fetch(retryUrl, {
                            redirect: "manual",
                            headers: { ...feedHeaders, Cookie: mergedCookieHeader },
                            signal: controller.signal,
                        });
                    }
                    catch (retryErr) {
                        logger.warn({ handle }, "[WORKER_LIFECYCLE] WORKER_ERROR - Feed redirect retry failed");
                        break;
                    }
                    finally {
                        clearTimeout(timeoutId);
                    }
                    if (feedRes.status >= 300 && feedRes.status < 400) {
                        logger.warn({ handle }, "[WORKER_LIFECYCLE] WORKER_ERROR - API still redirecting after retry");
                        break;
                    }
                }
                if (!feedRes.ok) {
                    logger.warn({ handle, httpStatus: feedRes.status }, "[WORKER_LIFECYCLE] WORKER_ERROR - Feed page error HTTP response");
                    break;
                }
                let feedJson;
                try {
                    feedJson = await feedRes.json();
                }
                catch (jsonErr) {
                    logger.error({ handle, page }, "[WORKER_LIFECYCLE] WORKER_ERROR - Failed to parse JSON from feed response. Gracefully stopping pagination.");
                    break;
                }
                const items = feedJson.items ?? [];
                let skippedInPage = 0;
                for (const item of items) {
                    if (seenMediaIds.has(item.id)) {
                        skippedPosts++;
                        skippedInPage++;
                        continue;
                    }
                    seenMediaIds.add(item.id);
                    // Collab detection
                    const ownerUsername = item.user?.username;
                    const collabs = item.coauthor_producers?.map((c) => c.username) || [];
                    const invitedCollabs = item.invited_coauthor_producers?.map((c) => c.username) || [];
                    const allCollaborators = [...collabs, ...invitedCollabs];
                    const targetIsCollaborator = allCollaborators.includes(handle) || ownerUsername === handle;
                    if (!targetIsCollaborator) {
                        taggedNonCollab++;
                        skippedPosts++;
                        skippedInPage++;
                        continue;
                    }
                    if (allCollaborators.length > 0 && targetIsCollaborator) {
                        collabPosts++;
                    }
                    else {
                        normalPosts++;
                    }
                    const dateStr = item.taken_at ? new Date(item.taken_at * 1000).toISOString() : null;
                    if (lastScrapedDate && dateStr && dateStr <= lastScrapedDate) {
                        logger.info({ handle, dateStr, lastScrapedDate }, "[InstagramCollector] Reached previously scraped post date — stopping feed pagination.");
                        moreAvailable = false;
                        break;
                    }
                    if (!latestPostDate && dateStr) {
                        latestPostDate = dateStr;
                    }
                    const likes = item.like_count ?? 0;
                    const comments = item.comment_count ?? 0;
                    if (likes > topPostLikes) {
                        topPostLikes = likes;
                        topPostLikesDate = dateStr;
                    }
                    if (comments > topPostComments) {
                        topPostComments = comments;
                        topPostCommentsDate = dateStr;
                    }
                    if (item.media_type === 2 || item.is_video === true) {
                        reels.push(item);
                        totalReelsCount++;
                        const views = item.play_count ?? item.view_count ?? 0;
                        totalReelViews += views;
                        totalReelLikes += likes;
                        totalComments += comments;
                        if (views > topReelViews) {
                            topReelViews = views;
                            topReelViewsDate = dateStr;
                        }
                    }
                    else {
                        posts.push(item);
                        totalPostsCount++;
                        totalPostLikes += likes;
                        totalComments += comments;
                    }
                    if (latestItemsCount < 12) {
                        latestItemsEngagement += likes + comments;
                        latestItemsCount++;
                    }
                    processedItems++;
                    avgReelViews = totalReelsCount > 0 ? Math.round(totalReelViews / totalReelsCount) : 0;
                    avgReelLikes = totalReelsCount > 0 ? Math.round(totalReelLikes / totalReelsCount) : 0;
                    avgPostLikes = totalPostsCount > 0 ? Math.round(totalPostLikes / totalPostsCount) : 0;
                    const rawInteractionRate = profileData.followersCount > 0 && latestItemsCount > 0
                        ? ((latestItemsEngagement / latestItemsCount) / profileData.followersCount) * 100
                        : 0;
                    scaledInteraction = rawInteractionRate > 0 
                        ? parseFloat((50 + 49.9 * (rawInteractionRate / (rawInteractionRate + 0.65))).toFixed(2))
                        : 0;
                    onProgress?.({
                        page,
                        processedItems,
                        totalPosts: profileData.postsCount,
                        totalReels: totalReelsCount,
                        totalReelViews,
                        totalReelLikes,
                        totalPostLikes,
                        totalComments,
                        totalReelsCount,
                        totalPostsCount,
                        topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                        topPostComments: { count: topPostComments, date: topPostCommentsDate },
                        topReelViews: { count: topReelViews, date: topReelViewsDate },
                        averageReelViews: avgReelViews,
                        averageReelLikes: avgReelLikes,
                        averagePostLikes: avgPostLikes,
                        latestEngagementRate: parseFloat(scaledInteraction.toFixed(2)),
                        isComplete: false,
                        nextMaxId: feedJson?.next_max_id ?? null,
                        moreAvailable: feedJson?.more_available ?? false,
                        latestPostDate
                    });
                }
                moreAvailable = feedJson.more_available ?? false;
                nextMaxId = feedJson.next_max_id ?? null;
                finalMoreAvailable = moreAvailable;
                finalNextMaxId = nextMaxId;
                page++;
                logger.info({ handle, page, pageItems: items.length, processedItems, skippedInPage, reason: "duplicate_or_non_collab" }, "[WORKER_LIFECYCLE] WORKER_MESSAGE - Feed page collected");
                if (moreAvailable && page < this.maxPages) {
                    const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
                    onProgress?.({
                        page,
                        processedItems,
                        totalPosts: profileData.postsCount,
                        totalReels: totalReelsCount,
                        totalReelViews,
                        totalReelLikes,
                        totalPostLikes,
                        totalComments,
                        totalReelsCount,
                        totalPostsCount,
                        topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                        topPostComments: { count: topPostComments, date: topPostCommentsDate },
                        topReelViews: { count: topReelViews, date: topReelViewsDate },
                        averageReelViews: totalReelsCount > 0 ? Math.round(totalReelViews / totalReelsCount) : 0,
                        averageReelLikes: totalReelsCount > 0 ? Math.round(totalReelLikes / totalReelsCount) : 0,
                        averagePostLikes: totalPostsCount > 0 ? Math.round(totalPostLikes / totalPostsCount) : 0,
                        latestEngagementRate: parseFloat(scaledInteraction.toFixed(2)),
                        isComplete: false,
                        nextMaxId: feedJson?.next_max_id ?? null,
                        moreAvailable: feedJson?.more_available ?? false,
                        latestPostDate,
                        statusMessage: `Sleeping for ${(delay / 1000).toFixed(1)}s to mimic human scroll speed...`
                    });
                    await sleep(delay);
                }
            } // End Feed Loop
            logger.info({ handle, totalPosts: posts.length, totalReels: reels.length, collabPosts, normalPosts, skippedPosts, taggedNonCollab }, "[WORKER_LIFECYCLE] WORKER_EXIT - Feed pagination complete");
        }
        return {
            ...profileData,
            posts,
            reels,
            nextMaxId: finalNextMaxId || null,
            moreAvailable: finalMoreAvailable,
        };
    }
    async fetchProfile(username) {
        const session = await this.getOrBuildSession(username);
        const profile = {
            username: session.username,
            displayName: session.displayName,
            bio: session.bio,
            profilePictureUrl: null, // always null — stats-only requirement
            isVerified: session.isVerified,
            followersCount: session.followersCount,
            followingCount: session.followingCount,
            postsCount: session.postsCount,
        };
        logger.info({
            username: profile.username,
            followersCount: profile.followersCount,
            postsInCache: session.posts.length,
            reelsInCache: session.reels.length,
        }, "[InstagramCollector] Profile metrics ready");
        return profile;
    }
    async fetchPosts(username) {
        const session = await this.getOrBuildSession(username);
        return session.posts.map((item) => ({
            igMediaId: item.id,
            shortcode: item.code ?? null,
            caption: null,
            mediaType: item.media_type === 8 ? "carousel" : "image",
            postedAt: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : null,
            likeCount: item.like_count ?? 0,
            commentCount: item.comment_count ?? 0,
        }));
    }
    async fetchReels(username) {
        const session = await this.getOrBuildSession(username);
        return session.reels.map((item) => ({
            igMediaId: item.id,
            shortcode: item.code ?? null,
            caption: null,
            postedAt: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : null,
            viewCount: item.view_count ?? item.play_count ?? 0,
            likeCount: item.like_count ?? 0,
            commentCount: item.comment_count ?? 0,
        }));
    }
}
exports.InstagramCollector = InstagramCollector;
