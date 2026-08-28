import { InstagramCollector } from './instagramScraper'
import { getAdminClient } from './supabase'

function formatNumberShort(num) {
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
  maxPages = 3, 
  onProgressStream = null,
  nextMaxId = null,
  initialStats = null,
  lastScrapedDate = null
) {
  const finalSessionId = sessionId || process.env.INSTAGRAM_SESSION_ID;
  const finalCsrfToken = csrfToken || process.env.INSTAGRAM_CSRF_TOKEN;

  const isFullCookie = finalSessionId && (finalSessionId.includes("sessionid=") || finalSessionId.includes(";"));
  if (!finalSessionId || (!isFullCookie && !finalCsrfToken)) {
    throw new Error('Missing Instagram credentials. Please provide them in the popup or in .env.local')
  }

  let finalMaxPages = 3;
  let finalOnProgress = null;

  if (typeof maxPages === 'function') {
    finalOnProgress = maxPages;
    finalMaxPages = 3;
  } else {
    finalMaxPages = maxPages || 3;
    finalOnProgress = onProgressStream;
  }

  let finalStats = null;
  const collector = new InstagramCollector(
    finalSessionId,
    finalCsrfToken,
    finalMaxPages
  );

  const supabase = getAdminClient();

  // Get current manual values to apply computed logic
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', celebrityId)
    .single();

  if (!celebrity) {
    throw new Error('Celebrity not found');
  }

  let sessionData = null;
  let scrapeError = null;

  try {
    // We capture the last emitted stats from onProgress
    sessionData = await collector.runTest(
      username, 
      (stats) => {
        finalStats = stats;
        if (finalOnProgress) {
          finalOnProgress(stats);
        }
      },
      nextMaxId,
      initialStats,
      lastScrapedDate
    );
  } catch (err) {
    scrapeError = err;
    sessionData = {
      displayName: celebrity.name || username,
      followersCount: celebrity.followers_scraped || 0,
      postsCount: celebrity.posts_scraped || 0,
      nextMaxId: finalStats?.nextMaxId || null,
      moreAvailable: true
    };
  }

  if (!finalStats) {
    // If no feed posts were processed (e.g. incremental run found no new posts),
    // we use a fallback stats object so the update proceeds gracefully.
    finalStats = {
      totalReelViews: 0,
      totalReelLikes: 0,
      totalPostLikes: 0,
      totalComments: 0,
      averageReelViews: celebrity.average_views_scraped || 0,
      averageReelLikes: celebrity.average_reel_likes_scraped || 0,
      averagePostLikes: celebrity.average_post_likes_scraped || 0,
      latestEngagementRate: celebrity.followers_interaction_scraped || 0,
    };
  }

  let finalName = sessionData.displayName || null;
  if (finalName) {
    finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
  }

  const isIncremental = Boolean(lastScrapedDate);
  const isFullScrape = (finalStats.processedItems || 0) >= ((sessionData.postsCount || 0) * 0.95);

  // Helper to parse shorthand counts like "26.6k" or "5m" to a number for comparison
  function parseCountToNumber(countStr) {
    if (!countStr) return 0;
    const clean = String(countStr).toLowerCase().replace(/[^0-9.km]/g, '');
    if (clean.endsWith('m')) return parseFloat(clean) * 1000000;
    if (clean.endsWith('k')) return parseFloat(clean) * 1000;
    return parseInt(clean, 10) || 0;
  }

  const newMostLikes = finalStats.topPostLikes?.count || 0;
  const oldMostLikes = celebrity.most_likes_scraped || 0;
  const updateMostLikes = newMostLikes > oldMostLikes;

  const newMostComments = finalStats.topPostComments?.count || 0;
  const oldMostComments = parseCountToNumber(celebrity.most_commented_count_scraped);
  const updateMostComments = newMostComments > oldMostComments;

  const newMostViews = finalStats.topReelViews?.count || 0;
  const oldMostViews = parseCountToNumber(celebrity.most_viewed_count_scraped);
  const updateMostViews = newMostViews > oldMostViews;

  const scraped = {
    name_scraped: finalName,
    description_scraped: sessionData.bio || null,
    followers_scraped: sessionData.followersCount || 0,
    posts_scraped: sessionData.postsCount || 0,

    total_reel_views_scraped: isIncremental 
      ? (celebrity.total_reel_views_scraped || 0) + (finalStats.totalReelViews || 0)
      : (isFullScrape ? (finalStats.totalReelViews || 0) : Math.max(celebrity.total_reel_views_scraped || 0, celebrity.total_reel_views || 0, finalStats.totalReelViews || 0)),
    total_reel_likes_scraped: isIncremental
      ? (celebrity.total_reel_likes_scraped || 0) + (finalStats.totalReelLikes || 0)
      : (isFullScrape ? (finalStats.totalReelLikes || 0) : Math.max(celebrity.total_reel_likes_scraped || 0, celebrity.total_reel_likes || 0, finalStats.totalReelLikes || 0)),
    total_post_likes_scraped: isIncremental
      ? (celebrity.total_post_likes_scraped || 0) + (finalStats.totalPostLikes || 0)
      : (isFullScrape ? (finalStats.totalPostLikes || 0) : Math.max(celebrity.total_post_likes_scraped || 0, celebrity.total_post_likes || 0, finalStats.totalPostLikes || 0)),
    total_comments_scraped: isIncremental
      ? (celebrity.total_comments_scraped || 0) + (finalStats.totalComments || 0)
      : (isFullScrape ? (finalStats.totalComments || 0) : Math.max(celebrity.total_comments_scraped || 0, celebrity.total_comments || 0, finalStats.totalComments || 0)),

    average_views_scraped: finalStats.averageReelViews || 0,
    average_reel_likes_scraped: finalStats.averageReelLikes || 0,
    average_post_likes_scraped: finalStats.averagePostLikes || 0,

    followers_interaction_scraped: finalStats.latestEngagementRate || 0,

    most_likes_scraped: updateMostLikes
      ? newMostLikes
      : (celebrity.most_likes_scraped || 0),
    most_liked_count_scraped: updateMostLikes
      ? formatNumberShort(newMostLikes)
      : (celebrity.most_liked_count_scraped || '0'),
    most_commented_count_scraped: updateMostComments
      ? formatNumberShort(newMostComments)
      : (celebrity.most_commented_count_scraped || '0'),
    most_viewed_count_scraped: updateMostViews
      ? formatNumberShort(newMostViews)
      : (celebrity.most_viewed_count_scraped || '0'),

    most_liked_date_scraped: updateMostLikes
      ? formatDate(finalStats.topPostLikes.date)
      : (celebrity.most_liked_date_scraped || null),
    most_commented_date_scraped: updateMostComments
      ? formatDate(finalStats.topPostComments.date)
      : (celebrity.most_commented_date_scraped || null),
    most_viewed_date_scraped: updateMostViews
      ? formatDate(finalStats.topReelViews.date)
      : (celebrity.most_viewed_date_scraped || null),
  };

  // Compute final values: manual ?? scraped
  const updates = {
    ...scraped,
    name: celebrity.name_manual || scraped.name_scraped,
    description: celebrity.description_manual || scraped.description_scraped,
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

  const { error } = await supabase
    .from('celebrities')
    .update(updates)
    .eq('id', celebrityId);

  if (error) {
    throw new Error('Database update failed: ' + error.message);
  }

  if (scrapeError) {
    throw scrapeError;
  }

  return {
    success: true,
    updates,
    nextMaxId: sessionData.nextMaxId || null,
    moreAvailable: sessionData.moreAvailable !== undefined ? sessionData.moreAvailable : false,
    processedItems: finalStats?.processedItems || 0,
    finalStats: finalStats
  };
}
