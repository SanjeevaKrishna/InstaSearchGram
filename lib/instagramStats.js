import { InstagramCollector } from './instagramScraper.js'
import { getAdminClient } from './supabase.js'

function unwrapCount(val) {
  while (val && typeof val === 'object' && 'count' in val) {
    val = val.count;
  }
  const n = typeof val === 'number' ? val : parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function formatNumberShort(num) {
  num = unwrapCount(num);
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return num.toString()
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.split('T')[0];
}

export async function refreshInstagramStats(
  celebrityId, 
  username, 
  sessionId = null, 
  csrfToken = null, 
  maxPages = 17, 
  onProgressStream = null,
  nextMaxId = null,
  initialStats = null,
  lastScrapedDate = null
) {
  const finalSessionId = sessionId || process.env.INSTAGRAM_SESSION_ID;
  const finalCsrfToken = csrfToken || process.env.INSTAGRAM_CSRF_TOKEN;

  if (!finalSessionId) {
    throw new Error('Missing Instagram credentials. Please provide them in the popup or in .env.local')
  }
  // If the sessionId is a full cookie string (contains "sessionid="), extract csrfToken from it
  const isFullCookie = finalSessionId.includes('sessionid=') || finalSessionId.includes(';');
  const resolvedCsrf = isFullCookie 
    ? (finalSessionId.match(/csrftoken=([^;]+)/)?.[1] || finalCsrfToken || '') 
    : (finalCsrfToken || '');
  if (!isFullCookie && !resolvedCsrf) {
    throw new Error('Missing Instagram credentials. Please provide them in the popup or in .env.local')
  }

  let finalStats = null;
  const collector = new InstagramCollector(
    finalSessionId,
    resolvedCsrf,
    maxPages || 17
  );

  // Run build with pagination cursor and state carry-forward
  let sessionData = null;
  try {
    sessionData = await collector.runBuild(
      collector.resolveHandle(username),
      (stats) => {
        finalStats = stats;
        if (onProgressStream) {
          onProgressStream(stats);
        }
      },
      nextMaxId,
      initialStats,
      lastScrapedDate
    );
  } catch (buildErr) {
    if (finalStats && (finalStats.processedItems > (initialStats?.processedItems || 0))) {
      console.warn(`[instagramStats] Warning during build: ${buildErr.message}. Saving progress collected so far.`);
      sessionData = {
        posts: [],
        reels: [],
        finalStats,
        userId: finalStats.userId,
        displayName: finalStats.displayName,
        bio: finalStats.bio,
        followersCount: finalStats.followersCount,
        postsCount: finalStats.totalPosts,
        isVerified: finalStats.isVerified
      };
    } else {
      throw buildErr;
    }
  }

  if (!finalStats) {
    finalStats = {
      processedItems: 0,
      totalReelViews: 0,
      totalReelLikes: 0,
      totalPostLikes: 0,
      totalComments: 0,
      averageReelViews: 0,
      averageReelLikes: 0,
      averagePostLikes: 0,
      latestEngagementRate: 0,
    };
  }

  const supabase = getAdminClient();

  // Helper to execute DB queries with retries
  const executeWithRetry = async (fn, maxAttempts = 4, baseDelay = 1500) => {
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fn();
        if (res && res.error) {
          lastError = res.error;
          console.warn(`[instagramStats] DB query attempt ${attempt}/${maxAttempts} returned error:`, res.error.message || res.error);
          if (attempt < maxAttempts) {
            await new Promise(r => setTimeout(r, baseDelay * attempt));
            continue;
          }
        } else {
          return res;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[instagramStats] DB query attempt ${attempt}/${maxAttempts} threw exception:`, err.message);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, baseDelay * attempt));
          continue;
        }
      }
    }
    return { data: null, error: lastError };
  };

  const cleanHandle = (username || '').trim().replace(/^@/, '').toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(celebrityId || '');

  // Get current celebrity by ID, by exact instagram_handle, by partial handle, or by slug
  let celebrity = null;

  // 1. Try by celebrityId in celebrities table (if valid UUID)
  if (isUuid) {
    const res = await executeWithRetry(() =>
      supabase.from('celebrities').select('*').eq('id', celebrityId).maybeSingle()
    );
    if (res.data) celebrity = res.data;
  }

  // 2. Try by exact cleanHandle in celebrities table
  if (!celebrity && cleanHandle) {
    const res = await executeWithRetry(() =>
      supabase.from('celebrities').select('*').ilike('instagram_handle', cleanHandle).maybeSingle()
    );
    if (res.data) celebrity = res.data;
  }

  // 3. Try by partial handle (%cleanHandle%) in celebrities table
  if (!celebrity && cleanHandle) {
    const res = await executeWithRetry(() =>
      supabase.from('celebrities').select('*').ilike('instagram_handle', `%${cleanHandle}%`).limit(1)
    );
    if (res.data && res.data.length > 0) celebrity = res.data[0];
  }

  // 4. Try by slug in celebrities table
  if (!celebrity && cleanHandle) {
    const res = await executeWithRetry(() =>
      supabase.from('celebrities').select('*').ilike('slug', cleanHandle).maybeSingle()
    );
    if (res.data) celebrity = res.data;
  }

  // 5. Check most_followed table if not found in celebrities
  let mfRecord = null;
  if (!celebrity) {
    if (isUuid) {
      const mfRes = await executeWithRetry(() =>
        supabase.from('most_followed').select('*').eq('id', celebrityId).maybeSingle()
      );
      if (mfRes.data) mfRecord = mfRes.data;
    }
    if (!mfRecord && cleanHandle) {
      const mfRes = await executeWithRetry(() =>
        supabase.from('most_followed').select('*').ilike('instagram_handle', cleanHandle).maybeSingle()
      );
      if (mfRes.data) mfRecord = mfRes.data;
    }
  }

  // 6. Auto-create in celebrities table if completely absent
  if (!celebrity) {
    const initialName = sessionData?.displayName || mfRecord?.name?.trim() || username;
    const initialSlug = cleanHandle.replace(/[^a-z0-9]+/g, '-') || `profile-${Date.now()}`;
    console.log(`[instagramStats] Auto-creating celebrity record for @${cleanHandle} (${initialName})...`);

    const insertPayload = {
      name: initialName,
      slug: initialSlug,
      instagram_handle: cleanHandle,
      description: sessionData?.bio || '',
      followers_count: sessionData?.followersCount || mfRecord?.followers_count || 0,
      posts_count: sessionData?.postsCount || 0,
      is_featured: false,
      has_full_details: true,
      hide_search: false,
      photo_url: sessionData?.profilePicUrl || mfRecord?.photo_url || null,
    };

    const insertRes = await executeWithRetry(() =>
      supabase.from('celebrities').insert(insertPayload).select().single()
    );

    if (insertRes.data) {
      celebrity = insertRes.data;
    } else {
      console.warn('[instagramStats] DB insert failed, using fallback container:', insertRes.error?.message);
      celebrity = {
        id: celebrityId || mfRecord?.id || 'temp',
        name: initialName,
        slug: initialSlug,
        instagram_handle: cleanHandle,
        ...insertPayload
      };
    }
  }

  let finalName = sessionData.displayName || null;
  if (finalName) {
    finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
  }

  const reelViews = finalStats.totalReelViews || 0;
  const reelLikes = finalStats.totalReelLikes || 0;
  const safeReelViews = (reelLikes > 0 && reelViews < reelLikes)
    ? Math.round(reelLikes * 12.5)
    : reelViews;

  const scraped = {
    name_scraped: finalName || celebrity.name_scraped || celebrity.name || username,
    description_scraped: sessionData.bio || celebrity.description_scraped || celebrity.description || null,
    followers_scraped: (sessionData.followersCount && sessionData.followersCount > 0) ? sessionData.followersCount : (celebrity.followers_scraped || celebrity.followers_count || 0),
    posts_scraped: (sessionData.postsCount && sessionData.postsCount > 0) ? sessionData.postsCount : (celebrity.posts_scraped || celebrity.posts_count || 0),

    total_reel_views_scraped: safeReelViews,
    total_reel_likes_scraped: reelLikes,
    total_post_likes_scraped: finalStats.totalPostLikes || 0,
    total_comments_scraped: finalStats.totalComments || 0,

    average_views_scraped: finalStats.averageReelViews || (safeReelViews > 0 && (finalStats.totalReels || celebrity.reels_count) ? Math.round(safeReelViews / (finalStats.totalReels || celebrity.reels_count || 1)) : 0),
    average_reel_likes_scraped: finalStats.averageReelLikes || (reelLikes > 0 && (finalStats.totalReels || celebrity.reels_count) ? Math.round(reelLikes / (finalStats.totalReels || celebrity.reels_count || 1)) : 0),
    average_post_likes_scraped: finalStats.averagePostLikes || 0,

    followers_interaction_scraped: finalStats.latestEngagementRate || 0,

    most_likes_scraped: unwrapCount(finalStats.topPostLikes),
    most_liked_count_scraped: formatNumberShort(finalStats.topPostLikes),
    most_commented_count_scraped: formatNumberShort(finalStats.topPostComments),
    most_viewed_count_scraped: formatNumberShort(finalStats.topReelViews?.count || finalStats.topReelViews || (unwrapCount(finalStats.topPostLikes) * 12.5)),

    most_liked_date_scraped: formatDate(finalStats.topPostLikes?.date),
    most_commented_date_scraped: formatDate(finalStats.topPostComments?.date),
    most_viewed_date_scraped: formatDate(finalStats.topReelViews?.date),
  };

  // Compute final values: manual ?? scraped ?? existing DB
  const updates = {
    ...scraped,
    name: celebrity.name_manual || scraped.name_scraped || celebrity.name || username,
    description: celebrity.description_manual || scraped.description_scraped || celebrity.description || '',
    followers_count: celebrity.followers_manual || scraped.followers_scraped,
    posts_count: celebrity.posts_manual || scraped.posts_scraped,
    total_reel_views: celebrity.total_reel_views_manual || scraped.total_reel_views_scraped,
    total_reel_likes: celebrity.total_reel_likes_manual || scraped.total_reel_likes_scraped,
    total_post_likes: celebrity.total_post_likes_manual || scraped.total_post_likes_scraped,
    total_comments: celebrity.total_comments_manual || scraped.total_comments_scraped,
    average_views: celebrity.average_views_manual || scraped.average_views_scraped,
    average_reel_likes: celebrity.average_reel_likes_manual || scraped.average_reel_likes_scraped,
    average_post_likes: celebrity.average_post_likes_manual || scraped.average_post_likes_scraped,
    followers_interaction: celebrity.followers_interaction_manual || scraped.followers_interaction_scraped,
    most_likes: celebrity.most_likes_manual || scraped.most_likes_scraped,
    most_liked_count: celebrity.most_liked_count_manual || scraped.most_liked_count_scraped,
    most_commented_count: celebrity.most_commented_count_manual || scraped.most_commented_count_scraped,
    most_viewed_count: celebrity.most_viewed_count_manual || scraped.most_viewed_count_scraped,
    most_liked_date: celebrity.most_liked_date_manual || scraped.most_liked_date_scraped,
    most_commented_date: celebrity.most_commented_date_manual || scraped.most_commented_date_scraped,
    most_viewed_date: celebrity.most_viewed_date_manual || scraped.most_viewed_date_scraped,
  };

  const targetId = celebrity.id;
  const updateRes = await executeWithRetry(() =>
    supabase.from('celebrities').update(updates).eq('id', targetId)
  );

  if (updateRes.error) {
    console.error(`[instagramStats] DB update failed for id ${targetId}:`, updateRes.error.message);
    if (cleanHandle) {
      const handleRes = await executeWithRetry(() =>
        supabase.from('celebrities').update(updates).ilike('instagram_handle', cleanHandle)
      );
      if (handleRes.error) {
        throw new Error('Database update failed: ' + updateRes.error.message);
      }
    } else {
      throw new Error('Database update failed: ' + updateRes.error.message);
    }
  }

  // Also sync most_followed table if the profile is registered there
  if (cleanHandle || (isUuid && celebrityId)) {
    try {
      const mfPayload = {
        followers_count: updates.followers_count,
        updated_at: new Date().toISOString()
      };
      if (isUuid && celebrityId) {
        await supabase.from('most_followed').update(mfPayload).eq('id', celebrityId);
      }
      if (cleanHandle) {
        await supabase.from('most_followed').update(mfPayload).ilike('instagram_handle', cleanHandle);
      }
    } catch (mfErr) {
      console.warn('[instagramStats] Non-critical: Could not sync to most_followed:', mfErr.message);
    }
  }

  return { 
    success: true, 
    updates,
    nextMaxId: sessionData.nextMaxId || null,
    moreAvailable: Boolean(sessionData.moreAvailable && sessionData.nextMaxId),
    processedItems: finalStats.processedItems,
    finalStats
  };
}
