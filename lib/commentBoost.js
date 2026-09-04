// lib/commentBoost.js
// Automated daily engagement boost engine for profile & celebrity comments
// Rules:
// 1. Direct comments only (replies are excluded from auto-likes)
// 2. Comments mentioning the account's name or handle get +5 likes/day
// 3. Normal direct comments get +3 likes/day
// 4. Manual user likes and admin edits are preserved

const accountCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Extracts searchable keywords from an account's name, handle, and slug.
 */
export function extractAccountKeywords(account) {
  const keywords = new Set();
  if (!account) return keywords;

  const addTerm = (str) => {
    if (!str) return;
    const clean = str.trim().toLowerCase();
    if (clean.length >= 3) keywords.add(clean);
  };

  // Handle
  if (account.instagram_handle) {
    const h = account.instagram_handle.trim().toLowerCase();
    addTerm(h);
    const noDigits = h.replace(/[0-9]+$/, '');
    if (noDigits.length >= 3) addTerm(noDigits);
    h.split(/[-_.]+/).forEach(addTerm);
  }

  // Slug
  if (account.slug) {
    const s = account.slug.trim().toLowerCase();
    addTerm(s);
    s.split(/[-_.]+/).forEach(addTerm);
  }

  // Display Name
  if (account.name) {
    const n = account.name.trim().toLowerCase();
    addTerm(n);
    n.split(/[\s\-_\.,\/]+/).forEach(w => {
      if (!['the', 'and', 'official', 'team', 'page', 'all', 'for'].includes(w)) {
        addTerm(w);
      }
    });
  }

  return keywords;
}

/**
 * Determines the daily boost rate for a comment:
 * - Reply (parent_id truthy) -> 0 likes/day
 * - Mentions account name or handle -> 5 likes/day
 * - Normal direct comment -> 3 likes/day
 */
export function determineBoostRate(comment, account) {
  if (comment.parent_id) {
    return 0;
  }

  const content = (comment.content || '').toLowerCase();
  if (!content) return 3;

  const keywords = extractAccountKeywords(account);

  if (comment.target_slug) {
    const ts = comment.target_slug.toLowerCase().trim();
    keywords.add(ts);
    const noDigits = ts.replace(/[0-9]+$/, '');
    if (noDigits.length >= 3) keywords.add(noDigits);
    ts.split(/[-_.]+/).forEach(w => {
      if (w.length >= 3) keywords.add(w);
    });
  }

  for (const kw of keywords) {
    if (content.includes(kw)) {
      return 5;
    }
  }

  return 3;
}

/**
 * Look up account details (name, handle, slug) for target_type and target_slug.
 * Cached in-memory to prevent repeated database queries.
 */
export async function getAccountInfo(supabase, targetType, targetSlug) {
  if (!targetSlug) return null;
  const cacheKey = `${targetType}:${targetSlug.toLowerCase().trim()}`;
  const cached = accountCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let account = null;
  try {
    if (targetType === 'profile') {
      const { data } = await supabase
        .from('most_followed')
        .select('name, instagram_handle')
        .ilike('instagram_handle', targetSlug)
        .limit(1)
        .single();

      if (data) {
        account = {
          name: (data.name || '').trim(),
          instagram_handle: (data.instagram_handle || '').trim(),
          slug: (data.instagram_handle || '').toLowerCase().trim()
        };
      }
    } else {
      const { data } = await supabase
        .from('celebrities')
        .select('name, instagram_handle, slug')
        .or(`slug.ilike.${targetSlug},instagram_handle.ilike.${targetSlug}`)
        .limit(1)
        .single();

      if (data) {
        account = {
          name: (data.name || '').trim(),
          instagram_handle: (data.instagram_handle || '').trim(),
          slug: (data.slug || data.instagram_handle || '').toLowerCase().trim()
        };
      }
    }
  } catch (err) {
    account = {
      name: targetSlug,
      instagram_handle: targetSlug,
      slug: targetSlug
    };
  }

  if (!account) {
    account = {
      name: targetSlug,
      instagram_handle: targetSlug,
      slug: targetSlug
    };
  }

  accountCache.set(cacheKey, { timestamp: Date.now(), data: account });
  return account;
}

/**
 * Calculates how many days elapsed and the expected likes for a comment.
 */
export function calculateEffectiveLikes(comment, account) {
  const rate = determineBoostRate(comment, account);
  if (rate === 0) {
    return {
      rate: 0,
      daysElapsed: 0,
      effectiveLikes: comment.likes_count || 0
    };
  }

  const createdTime = new Date(comment.created_at || Date.now()).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(0, Math.floor((now - createdTime) / (24 * 60 * 60 * 1000)));

  const minExpectedLikes = daysElapsed * rate;
  const currentLikes = comment.likes_count || 0;

  const effectiveLikes = Math.max(currentLikes, minExpectedLikes);

  return {
    rate,
    daysElapsed,
    effectiveLikes
  };
}

/**
 * Asynchronously updates database likes_count for any comments where
 * current DB likes < calculated effective likes.
 */
export async function syncCommentLikesToDB(supabase, comments, account) {
  if (!comments || comments.length === 0) return;

  const updates = [];
  for (const c of comments) {
    if (c.parent_id) continue;

    const { effectiveLikes } = calculateEffectiveLikes(c, account);
    if (effectiveLikes > (c.likes_count || 0)) {
      updates.push({
        id: c.id,
        likes_count: effectiveLikes
      });
      c.likes_count = effectiveLikes;
    }
  }

  if (updates.length === 0) return;

  await Promise.allSettled(
    updates.map(u =>
      supabase
        .from('profile_comments')
        .update({ likes_count: u.likes_count })
        .eq('id', u.id)
    )
  );
}

/**
 * Manual or cron-triggered daily boost execution across all direct comments.
 */
export async function triggerDailyLikesBoost(supabase, { force = false, targetSlug = null, targetType = null } = {}) {
  let query = supabase
    .from('profile_comments')
    .select('id, target_type, target_slug, content, parent_id, likes_count, created_at')
    .is('parent_id', null);

  if (targetSlug) {
    query = query.eq('target_slug', targetSlug);
  }
  if (targetType) {
    query = query.eq('target_type', targetType);
  }

  const { data: comments, error } = await query;
  if (error) {
    throw error;
  }

  if (!comments || comments.length === 0) {
    return { success: true, boostedCount: 0, totalLikesAdded: 0, details: [] };
  }

  let boostedCount = 0;
  let totalLikesAdded = 0;
  const details = [];

  for (const c of comments) {
    const account = await getAccountInfo(supabase, c.target_type, c.target_slug);
    const rate = determineBoostRate(c, account);
    if (rate === 0) continue;

    const currentLikes = c.likes_count || 0;
    let delta = 0;

    if (force) {
      delta = rate;
    } else {
      const { effectiveLikes } = calculateEffectiveLikes(c, account);
      if (effectiveLikes > currentLikes) {
        delta = effectiveLikes - currentLikes;
      } else {
        delta = rate;
      }
    }

    if (delta > 0) {
      const nextLikes = currentLikes + delta;
      const { error: updateErr } = await supabase
        .from('profile_comments')
        .update({ likes_count: nextLikes })
        .eq('id', c.id);

      if (!updateErr) {
        boostedCount++;
        totalLikesAdded += delta;
        details.push({
          id: c.id,
          target_slug: c.target_slug,
          rate,
          previousLikes: currentLikes,
          newLikes: nextLikes,
          added: delta
        });
      }
    }
  }

  return {
    success: true,
    boostedCount,
    totalLikesAdded,
    details
  };
}
