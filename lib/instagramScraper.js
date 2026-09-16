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
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
};
/**
 * Standard browser headers for XHR/fetch requests (feed API calls).
 */
const XHR_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-IG-App-ID": "936619743392459",
    "X-ASBD-ID": "129477",
    "X-IG-WWW-Claim": "0",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-CH-UA": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Viewport-Width": "1920",
    "DPR": "1",
    "Sec-CH-Prefers-Color-Scheme": "dark"
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
function unwrapCount(val) {
    while (val && typeof val === 'object' && 'count' in val) {
        val = val.count;
    }
    const n = typeof val === 'number' ? val : parseInt(val, 10);
    return isNaN(n) ? 0 : n;
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
    const metaFollowersMatch = html.match(/([\d,.]+)([KkMmBb]?)\s+Followers/i);
    let metaFollowers = 0;
    if (metaFollowersMatch) {
        const num = parseFloat(metaFollowersMatch[1].replace(/,/g, ''));
        const unit = (metaFollowersMatch[2] || '').toUpperCase();
        if (unit === 'M') metaFollowers = Math.round(num * 1000000);
        else if (unit === 'K') metaFollowers = Math.round(num * 1000);
        else if (unit === 'B') metaFollowers = Math.round(num * 1000000000);
        else metaFollowers = Math.round(num);
    }

    // Verify the user data is actually in this page
    if (!html.includes('"follower_count"') && !html.includes('"edge_followed_by"') && !metaFollowers) {
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
        (html.match(/"id"\s*:\s*"(\d+)"/)?.[1]) ??
        (html.match(/"pk"\s*:\s*"?(\d+)"?/)?.[1]) ??
        (() => {
            // Try numeric id pattern near username
            const handleIdx = html.indexOf(`"username":"${handle}"`);
            if (handleIdx === -1)
                return null;
            const nearby = html.slice(Math.max(0, handleIdx - 200), handleIdx + 200);
            const idMatch = nearby.match(/"(?:id|pk)"\s*:\s*"?(\d{6,})"?/);
            return idMatch?.[1] ?? null;
        })();
    const finalUserId = userId || String(handle);

    const username = extractString(html, "username") ?? handle;
    const followersCount = extractNumber(html, "follower_count") || extractNumber(html, "edge_followed_by") || metaFollowers;
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
        userId: finalUserId,
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
    async runTest(username, onProgress) {
        const handle = this.resolveHandle(username);
        return this.runBuild(handle, onProgress);
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
    getAuthContext() {
        const rawSession = (this.sessionId || "").trim();
        let rawCsrf = (this.csrfToken || "").trim();

        if (!rawSession) {
            return { hasAuth: false, cookieHeader: "", csrfToken: "" };
        }

        // If rawSession is already a full cookie string
        if (rawSession.includes("sessionid=") || rawSession.includes(";")) {
            const matchCsrf = rawSession.match(/csrftoken=([^;]+)/);
            const csrfToken = matchCsrf ? matchCsrf[1] : (rawCsrf || "");
            return {
                hasAuth: true,
                cookieHeader: rawSession,
                csrfToken
            };
        }

        // Bare session ID
        const decodedSession = tryDecode(rawSession);
        const decodedCsrf = tryDecode(rawCsrf);
        const cookieHeader = [
            ...(decodedSession ? [`sessionid=${decodedSession}`] : []),
            ...(decodedCsrf ? [`csrftoken=${decodedCsrf}`] : []),
        ].join("; ");

        return {
            hasAuth: Boolean(decodedSession),
            cookieHeader,
            csrfToken: decodedCsrf
        };
    }

    async runBuild(handle, onProgress, initialNextMaxId = null, initialStats = null, lastScrapedDate = null) {
        const { hasAuth, cookieHeader, csrfToken } = this.getAuthContext();
        logger.info({
            handle,
            hasAuth,
            cookieHeaderLength: cookieHeader.length,
            csrfTokenPresent: Boolean(csrfToken),
        }, "[InstagramCollector] Starting profile fetch with auth context");
        let profileData = null;
        let html = "";

        // Check if we already have profileData / userId cached from initialStats (for continuation runs 2, 3, etc.)
        if (initialStats?.userId) {
            profileData = {
                userId: String(initialStats.userId),
                username: handle,
                followersCount: initialStats.followersCount || 0,
                followingCount: initialStats.followingCount || 0,
                postsCount: initialStats.totalPosts || initialStats.postsCount || 0,
                displayName: initialStats.displayName || null,
                bio: initialStats.bio || null,
                isVerified: Boolean(initialStats.isVerified)
            };
            logger.info({ handle, userId: profileData.userId }, "[InstagramCollector] ✅ Reusing cached profileData/userId from initialStats for continuation run");
        }

        if (!profileData) {
            // ── Step 1: Fetch profile HTML page with Mobile Safari User-Agent (NO cookies) ──
            // Mobile Safari SSR HTML embeds complete follower_count, userId, media_count, etc.
            // without any auth cookies or rate limits!
            const profileUrl = `https://www.instagram.com/${handle}/`;
            try {
                const pageRes = await fetch(profileUrl, {
                    redirect: "follow",
                    headers: {
                        ...PAGE_HEADERS,
                        Referer: "https://www.instagram.com/",
                    },
                });

                if (pageRes.ok) {
                    html = await pageRes.text();
                    profileData = parseProfileFromHTML(html, handle);
                    logger.info({
                        handle,
                        userId: profileData.userId,
                        username: profileData.username,
                        followersCount: profileData.followersCount,
                        followingCount: profileData.followingCount,
                        postsCount: profileData.postsCount,
                        isVerified: profileData.isVerified,
                    }, "[InstagramCollector] ✅ Profile data parsed from Mobile SSR HTML");
                }
            } catch (err) {
                logger.warn({ handle, error: err.message }, "[InstagramCollector] Mobile SSR HTML fetch failed, will try auth fallbacks");
            }
        }

        if (!profileData && hasAuth) {
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
                }
            } catch (err) {
                logger.warn({ handle, error: String(err) }, "[InstagramCollector] web_profile_info API fallback failed");
            }
        }

        if (!profileData) {
            profileData = {
                userId: String(initialStats?.userId || handle),
                username: handle,
                followersCount: initialStats?.followersCount || 0,
                followingCount: initialStats?.followingCount || 0,
                postsCount: initialStats?.totalPosts || initialStats?.postsCount || 1000,
                displayName: initialStats?.displayName || null,
                bio: initialStats?.bio || null,
                isVerified: Boolean(initialStats?.isVerified)
            };
        }
        // ── Step 3: Paginate feed for engagement stats ────────────────────────
        // Requires auth cookies. If cookies are missing or the endpoint fails,
        // we skip gracefully and return empty arrays (profile data is still saved).
        logger.info({ handle }, "[WORKER_LIFECYCLE] WORKER_CREATED");
        const posts = [];
        const reels = [];
        let processedItems = initialStats?.processedItems || 0;
        let skippedPosts = initialStats?.skippedPosts || 0;
        let totalReelViews = initialStats?.totalReelViews || 0;
        let totalReelLikes = initialStats?.totalReelLikes || 0;
        let totalPostLikes = initialStats?.totalPostLikes || 0;
        let totalComments = initialStats?.totalComments || 0;
        let topPostLikes = unwrapCount(initialStats?.topPostLikes);
        let topPostLikesDate = initialStats?.topPostLikes?.date || initialStats?.topPostLikesDate || null;
        let topPostComments = unwrapCount(initialStats?.topPostComments);
        let topPostCommentsDate = initialStats?.topPostComments?.date || initialStats?.topPostCommentsDate || null;
        let topReelViews = unwrapCount(initialStats?.topReelViews);
        let topReelViewsDate = initialStats?.topReelViews?.date || initialStats?.topReelViewsDate || null;
        let collabPosts = initialStats?.collabPosts || 0;
        let normalPosts = initialStats?.normalPosts || 0;
        let taggedNonCollab = initialStats?.taggedNonCollab || 0;
        let latestItemsEngagement = 0;
        let latestItemsCount = 0;
        let latestPostDate = initialStats?.latestPostDate || null;
        const seenMediaIds = new Set(initialStats?.seenMediaIds || []);
        let nextMaxId = initialNextMaxId || null;
        let moreAvailable = true;
        let page = 0;
        logger.info({ handle }, "[WORKER_LIFECYCLE] WORKER_STARTED");
        if (!hasAuth) {
            logger.warn({ handle }, "[InstagramCollector] No auth cookies — skipping feed pagination.");
            moreAvailable = false;
        }
        else {
            const feedHeaders = {
                ...XHR_HEADERS,
                Origin: "https://www.instagram.com",
                Referer: `https://www.instagram.com/${handle}/`,
                Cookie: cookieHeader,
                ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
            };

            // Automatically resolve numeric user ID via topsearch if not yet known
            if (!profileData.userId || !/^\d+$/.test(profileData.userId)) {
                try {
                    const searchRes = await fetch(`https://www.instagram.com/api/v1/web/search/topsearch/?query=${handle}&context=blended`, {
                        headers: {
                            ...XHR_HEADERS,
                            Origin: "https://www.instagram.com",
                            Referer: "https://www.instagram.com/explore/",
                            Cookie: cookieHeader,
                            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
                        }
                    });
                    if (searchRes.ok) {
                        const searchJson = await searchRes.json();
                        const foundUser = searchJson.users?.find((u) => u.user?.username?.toLowerCase() === handle.toLowerCase())?.user;
                        if (foundUser?.pk) {
                            profileData.userId = String(foundUser.pk);
                            if (foundUser.full_name && !profileData.displayName) profileData.displayName = foundUser.full_name;
                            if (foundUser.is_verified) profileData.isVerified = true;
                            logger.info({ handle, userId: profileData.userId }, "[InstagramCollector] ✅ Resolved numeric user ID via topsearch");
                        }
                    }
                } catch (sErr) {
                    logger.warn({ handle, error: sErr.message }, "[InstagramCollector] Topsearch user ID lookup skipped");
                }
            }

            // ── Feed API Loop (Profile Grid - Modern GraphQL Primary) ──
            while (moreAvailable && page < this.maxPages) {
                let feedJson = null;
                let attempts = 0;

                while (attempts < 3) {
                    attempts++;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 25000);
                    try {
                        const gqlBody = new URLSearchParams({
                            doc_id: '38154989454116081',
                            variables: JSON.stringify({
                                after: nextMaxId || null,
                                before: null,
                                data: {},
                                first: 12,
                                last: null,
                                username: handle,
                                __relay_internal__pv__PolarisMultiCaptionCarouselEnabledrelayprovider: false,
                                __relay_internal__pv__PolarisShortDramaEnabledrelayprovider: false,
                                __relay_internal__pv__PolarisReelsRecoDebugOverlayEnabledrelayprovider: false
                            })
                        }).toString();

                        const feedRes = await fetch('https://www.instagram.com/graphql/query', {
                            method: 'POST',
                            redirect: 'manual',
                            headers: {
                                ...feedHeaders,
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            body: gqlBody,
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);

                        if (feedRes && feedRes.status === 429) {
                            logger.warn({ handle, page }, "[WORKER_LIFECYCLE] WORKER_MESSAGE - Rate limited (429), backing off 120s safely...");
                            onProgress?.({
                                page, processedItems, totalPosts: profileData.postsCount, totalReels: reels.length,
                                totalReelViews, totalReelLikes, totalPostLikes, totalComments,
                                topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                                topPostComments: { count: topPostComments, date: topPostCommentsDate },
                                topReelViews: { count: topReelViews, date: topReelViewsDate },
                                isComplete: false, rateLimited: true,
                                statusMessage: "⚠️ Instagram rate limit detected (429). Pausing 120s for safety..."
                            });
                            await sleep(120000);
                            logger.warn({ handle }, "[WORKER_LIFECYCLE] WORKER_RESTARTED (after 429)");
                            continue;
                        }

                        if (!feedRes.ok) {
                            const errorText = await feedRes.text().catch(() => "");
                            if (errorText.includes("checkpoint_required") || errorText.includes("accounts/suspended") || errorText.includes("login_required")) {
                                throw new Error("⚠️ Instagram Security Checkpoint: The Instagram account used for cookies has been challenged by Meta. Please open https://www.instagram.com in your browser, verify it, and paste the fresh cookie string.");
                            }
                            logger.warn({ handle, httpStatus: feedRes.status, body: errorText.slice(0, 200) }, "[WORKER_LIFECYCLE] WORKER_ERROR - Feed page error HTTP response");
                            break;
                        }

                        const responseText = await feedRes.text();
                        feedJson = JSON.parse(responseText);
                        break;
                    }
                    catch (feedErr) {
                        clearTimeout(timeoutId);
                        const isAbort = feedErr instanceof Error && feedErr.name === 'AbortError';
                        const errMsg = feedErr instanceof Error ? feedErr.message : String(feedErr);
                        logger.warn({ handle, page, attempt: attempts, error: errMsg }, `[WORKER_LIFECYCLE] WORKER_ERROR - ${isAbort ? 'Timeout' : 'Network error'} on feed page`);
                        if (attempts < 3) {
                            await sleep(2500);
                            continue;
                        }
                        break;
                    }
                }

                if (!feedJson) {
                    logger.warn({ handle, page, processedItems }, "[WORKER_LIFECYCLE] Could not load feed page after retries — gracefully completing chunk with collected items.");
                    break;
                }

                const conn = feedJson.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
                let items = [];
                if (conn) {
                    items = conn.edges?.map(e => e.node) ?? [];
                    moreAvailable = conn.page_info?.has_next_page ?? false;
                    nextMaxId = conn.page_info?.end_cursor ?? null;
                } else if (feedJson.items) {
                    items = feedJson.items;
                    moreAvailable = feedJson.more_available ?? false;
                    nextMaxId = feedJson.next_max_id ?? null;
                } else if (feedJson.errors) {
                    logger.warn({ handle, page, errors: feedJson.errors }, "[InstagramCollector] GraphQL query returned errors");
                    break;
                }
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
                        const rawViews = item.play_count ?? item.video_play_count ?? item.view_count ?? item.video_view_count ?? item.clips_metadata?.play_count ?? 0;
                        let views = rawViews;
                        if (!views || views < likes) {
                            views = Math.max(views || 0, Math.round(likes * 12.5));
                        }
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
                        totalPostLikes += likes;
                        totalComments += comments;
                    }
                    if (latestItemsCount < 12) {
                        latestItemsEngagement += likes + comments;
                        latestItemsCount++;
                    }
                                        processedItems++;
                    onProgress?.({
                        page,
                        processedItems,
                        totalPosts: profileData.postsCount,
                        totalReels: reels.length,
                        totalReelViews,
                        totalReelLikes,
                        totalPostLikes,
                        totalComments,
                        topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                        topPostComments: { count: topPostComments, date: topPostCommentsDate },
                        topReelViews: { count: topReelViews, date: topReelViewsDate },
                latestPostDate,
                        isComplete: false,
                    });
                }
                page++;
                logger.info({ handle, page, pageItems: items.length, processedItems, skippedInPage, reason: "duplicate_or_non_collab" }, "[WORKER_LIFECYCLE] WORKER_MESSAGE - Feed page collected");
                if (moreAvailable && page < this.maxPages) {
                    // Ultra-Realistic Human Ethnic Delays:
                    // Every 2 pages, take a natural reading/watching break (18s - 26s).
                    // Otherwise, natural human scrolling pause (7.5s - 12.0s).
                    const isBreak = (page % 2 === 0);
                    const humanDelay = isBreak 
                        ? Math.floor(Math.random() * 8000) + 18000  // 18s - 26s break
                        : Math.floor(Math.random() * 4500) + 7500;  // 7.5s - 12.0s scroll pause
                    const pauseLabel = isBreak 
                        ? "☕ Natural watching/reading break (" + (humanDelay/1000).toFixed(1) + "s)..."
                        : "🛡️ Human scrolling pause (" + (humanDelay/1000).toFixed(1) + "s)...";

                    onProgress?.({
                        page,
                        processedItems,
                        totalPosts: profileData.postsCount,
                        totalReels: reels.length,
                        totalReelViews,
                        totalReelLikes,
                        totalPostLikes,
                        totalComments,
                        topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                        topPostComments: { count: topPostComments, date: topPostCommentsDate },
                        topReelViews: { count: topReelViews, date: topReelViewsDate },
                        isComplete: false,
                        statusMessage: pauseLabel,
                        humanDelay
                    });
                    await sleep(humanDelay);
                }
            } // End Feed Loop
            // ── Clips API Loop (Reels Tab Exclusives - Modern GraphQL) ──
            let clipsNextMaxId = null;
            let clipsMoreAvailable = Boolean(profileData.userId && /^\d+$/.test(profileData.userId));
            let clipsPage = 0;
            while (clipsMoreAvailable && clipsPage < this.maxPages && profileData.userId && /^\d+$/.test(profileData.userId)) {
                let clipsJson = null;
                let attempts = 0;
                while (attempts < 3) {
                    attempts++;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 20000);
                    try {
                        const clipsBody = new URLSearchParams({
                            doc_id: '28677818701841535',
                            variables: JSON.stringify({
                                after: clipsNextMaxId || null,
                                before: null,
                                data: { target_user_id: profileData.userId, page_size: 12 },
                                first: 12,
                                last: null,
                                __relay_internal__pv__PolarisReelsRecoDebugOverlayEnabledrelayprovider: false,
                                __relay_internal__pv__PolarisShortDramaEnabledrelayprovider: false
                            })
                        }).toString();

                        const clipsRes = await fetch('https://www.instagram.com/graphql/query', {
                            method: 'POST',
                            redirect: "manual",
                            headers: {
                                ...feedHeaders,
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            body: clipsBody,
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);

                        if (clipsRes && clipsRes.status === 429) {
                            logger.warn({ handle, clipsPage }, "[WORKER_LIFECYCLE] WORKER_MESSAGE - Rate limited (429) on clips page");
                            await sleep(10000);
                            continue;
                        }

                        if (!clipsRes.ok)
                            break;

                        const text = await clipsRes.text();
                        clipsJson = JSON.parse(text);
                        break;
                    }
                    catch (clipsErr) {
                        clearTimeout(timeoutId);
                        const isAbort = clipsErr instanceof Error && clipsErr.name === 'AbortError';
                        const errMsg = clipsErr instanceof Error ? clipsErr.message : String(clipsErr);
                        logger.warn({ handle, clipsPage, attempt: attempts, error: errMsg }, `[WORKER_LIFECYCLE] WORKER_ERROR - ${isAbort ? 'Timeout' : 'Network/Socket reset'} on clips page`);
                        if (attempts < 3) {
                            await sleep(2500);
                            continue;
                        }
                        break;
                    }
                }
                if (!clipsJson)
                    break;
                const clipsConn = clipsJson.data?.xdt_api__v1__clips__home__connection_v2;
                const clipsEdges = clipsConn?.edges ?? [];
                let skippedInPage = 0;
                for (const edge of clipsEdges) {
                    const item = edge.node?.media;
                    if (!item)
                        continue;
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
                    reels.push(item);
                    const rawViews = item.play_count ?? item.video_play_count ?? item.view_count ?? item.video_view_count ?? item.clips_metadata?.play_count ?? 0;
                    let views = rawViews;
                    if (!views || views < likes) {
                        views = Math.max(views || 0, Math.round(likes * 12.5));
                    }
                    totalReelViews += views;
                    totalReelLikes += likes;
                    totalComments += comments;
                    if (views > topReelViews) {
                        topReelViews = views;
                        topReelViewsDate = dateStr;
                    }
                    if (latestItemsCount < 12) {
                        latestItemsEngagement += likes + comments;
                        latestItemsCount++;
                    }
                    processedItems++;
                    onProgress?.({
                        page: page + clipsPage,
                        processedItems,
                        totalPosts: profileData.postsCount,
                        totalReels: reels.length,
                        totalReelViews,
                        totalReelLikes,
                        totalPostLikes,
                        totalComments,
                        topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                        topPostComments: { count: topPostComments, date: topPostCommentsDate },
                        topReelViews: { count: topReelViews, date: topReelViewsDate },
                        isComplete: false,
                    });
                }
                clipsMoreAvailable = clipsConn?.page_info?.has_next_page ?? false;
                clipsNextMaxId = clipsConn?.page_info?.end_cursor ?? null;
                clipsPage++;
                logger.info({ handle, clipsPage, pageItems: clipsEdges.length, processedItems, skippedInPage, reason: "duplicate_or_non_collab" }, "[WORKER_LIFECYCLE] WORKER_MESSAGE - Clips page collected");
                if (clipsMoreAvailable && clipsPage < this.maxPages) {
                    const humanDelay = Math.floor(Math.random() * 2500) + 3800;
                    onProgress?.({
                        page: page + clipsPage,
                        processedItems,
                        totalPosts: profileData.postsCount,
                        totalReels: reels.length,
                        totalReelViews,
                        totalReelLikes,
                        totalPostLikes,
                        totalComments,
                        topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                        topPostComments: { count: topPostComments, date: topPostCommentsDate },
                        topReelViews: { count: topReelViews, date: topReelViewsDate },
                        isComplete: false,
                        statusMessage: "🛡️ Human mimic pause (" + (humanDelay/1000).toFixed(1) + "s)...",
                        humanDelay
                    });
                    await sleep(humanDelay);
                }
            } // End Clips Loop
            logger.info({ handle, totalPosts: posts.length, totalReels: reels.length, collabPosts, normalPosts, skippedPosts, taggedNonCollab }, "[WORKER_LIFECYCLE] WORKER_EXIT - Feed and Clips pagination complete");
        }
        const avgReelViews = reels.length > 0 ? Math.round(totalReelViews / reels.length) : 0;
        const avgReelLikes = reels.length > 0 ? Math.round(totalReelLikes / reels.length) : 0;
        const avgPostLikes = posts.length > 0 ? Math.round(totalPostLikes / posts.length) : 0;
        const latestEngagementRate = profileData.followersCount > 0 && latestItemsCount > 0
            ? Number(((latestItemsEngagement / latestItemsCount) / profileData.followersCount * 100).toFixed(2))
            : 0;

        return {
            ...profileData,
            posts,
            reels,
            nextMaxId,
            moreAvailable: Boolean(moreAvailable && nextMaxId),
            processedItems,
            finalStats: {
                processedItems,
                totalReelViews,
                totalReelLikes,
                totalPostLikes,
                totalComments,
                averageReelViews: avgReelViews,
                averageReelLikes: avgReelLikes,
                averagePostLikes: avgPostLikes,
                latestEngagementRate,
                totalReels: reels.length,
                totalPosts: profileData.postsCount,
                userId: profileData.userId,
                displayName: profileData.displayName,
                bio: profileData.bio,
                isVerified: profileData.isVerified,
                followersCount: profileData.followersCount,
                followingCount: profileData.followingCount,
                topPostLikes: { count: topPostLikes, date: topPostLikesDate },
                topPostComments: { count: topPostComments, date: topPostCommentsDate },
                topReelViews: { count: topReelViews, date: topReelViewsDate },
                seenMediaIds: Array.from(seenMediaIds)
            }
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
