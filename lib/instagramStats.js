import { InstagramCollector } from './instagramScraper.js'
import { getAdminClient } from './supabase.js'

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
  const sessionData = await collector.runBuild(
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

  // Get current celebrity by ID or by instagram_handle
  let celebrity = null;
  if (celebrityId && celebrityId !== 'test' && celebrityId !== 'undefined') {
    const { data } = await supabase
      .from('celebrities')
      .select('*')
      .eq('id', celebrityId)
      .maybeSingle();
    celebrity = data;
  }

  if (!celebrity && username) {
    const cleanHandle = username.trim().replace(/^@/, '').toLowerCase();
    const { data } = await supabase
      .from('celebrities')
      .select('*')
      .ilike('instagram_handle', `%${cleanHandle}%`)
      .limit(1);
    if (data && data.length > 0) {
      celebrity = data[0];
    }
  }

  if (!celebrity) {
    throw new Error(`Celebrity profile for @${username} not found in database. Please ensure the profile exists in Admin panel.`);
  }

  let finalName = sessionData.displayName || null;
  if (finalName) {
    finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
  }

  const scraped = {
    name_scraped: finalName,
    description_scraped: sessionData.bio || null,
    followers_scraped: sessionData.followersCount || 0,
    posts_scraped: sessionData.postsCount || 0,

    total_reel_views_scraped: finalStats.totalReelViews || 0,
    total_reel_likes_scraped: finalStats.totalReelLikes || 0,
    total_post_likes_scraped: finalStats.totalPostLikes || 0,
    total_comments_scraped: finalStats.totalComments || 0,

    average_views_scraped: finalStats.averageReelViews || 0,
    average_reel_likes_scraped: finalStats.averageReelLikes || 0,
    average_post_likes_scraped: finalStats.averagePostLikes || 0,

    followers_interaction_scraped: finalStats.latestEngagementRate || 0,

    most_likes_scraped: finalStats.topPostLikes?.count || 0,
    most_liked_count_scraped: formatNumberShort(finalStats.topPostLikes?.count || 0),
    most_commented_count_scraped: formatNumberShort(finalStats.topPostComments?.count || 0),
    most_viewed_count_scraped: formatNumberShort(finalStats.topReelViews?.count || 0),

    most_liked_date_scraped: formatDate(finalStats.topPostLikes?.date),
    most_commented_date_scraped: formatDate(finalStats.topPostComments?.date),
    most_viewed_date_scraped: formatDate(finalStats.topReelViews?.date),
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

  return { 
    success: true, 
    updates,
    nextMaxId: sessionData.nextMaxId || null,
    moreAvailable: Boolean(sessionData.moreAvailable && sessionData.nextMaxId),
    processedItems: finalStats.processedItems,
    finalStats
  };
}
