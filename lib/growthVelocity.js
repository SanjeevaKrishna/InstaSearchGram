/**
 * lib/growthVelocity.js
 * High-performance follower velocity & momentum calculation engine.
 * Computes daily follower changes and percentage growth across all 1,110+ creators
 * using their historical follower snapshots, with automatic previous-day fallback.
 */

/**
 * Formats integer follower count into human-readable compact text (e.g. 1.2M, 45.3K)
 */
export function formatFollowersText(count) {
  if (count === null || count === undefined || isNaN(count)) return '—';
  const num = Number(count);
  if (num >= 1000000000) return `${(Math.floor(num / 100000000) / 10).toString().replace(/\.0$/, '')}B`;
  if (num >= 1000000) return `${(Math.floor(num / 100000) / 10).toString().replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(Math.floor(num / 100) / 10).toString().replace(/\.0$/, '')}K`;
  return num.toLocaleString();
}

/**
 * Formats a signed change (e.g. +45,210 or -3,120)
 */
export function formatSignedChange(change) {
  if (change === null || change === undefined || isNaN(change)) return '—';
  const num = Number(change);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toLocaleString()}`;
}

/**
 * Formats a signed percentage (e.g. +0.45% or -0.12%)
 */
export function formatSignedPercent(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '0.00%';
  const num = Number(pct);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
}

/**
 * Extracts all unique dates present in profiles' follower_history, sorted descending (newest first).
 */
export function getAvailableHistoryDates(profiles = []) {
  const dateSet = new Set();
  for (const p of profiles) {
    if (Array.isArray(p.follower_history)) {
      for (const h of p.follower_history) {
        if (h.date && h.count && h.status !== 'Server Failed') {
          dateSet.add(h.date);
        }
      }
    }
  }
  return Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
}

/**
 * Computes 24-hour gainers and losers across all profiles for a given target date.
 * If targetDate is missing or has insufficient data, automatically falls back to the latest valid date.
 */
export function calculateGrowthVelocity(profiles = [], requestedDate = null) {
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return {
      activeDate: null,
      prevDate: null,
      isFallback: false,
      totalCount: 0,
      gainersCount: 0,
      losersCount: 0,
      gainers: [],
      losers: [],
      all: []
    };
  }

  const availableDates = getAvailableHistoryDates(profiles);
  if (availableDates.length < 2) {
    // Need at least 2 consecutive dates to calculate 24h delta
    return {
      activeDate: availableDates[0] || null,
      prevDate: null,
      isFallback: false,
      totalCount: profiles.length,
      gainersCount: 0,
      losersCount: 0,
      gainers: [],
      losers: [],
      all: []
    };
  }

  // Determine active date
  let activeDate = null;
  let isFallback = false;

  if (requestedDate) {
    if (!availableDates.includes(requestedDate)) {
      // Requested date has 0 records scraped yet
      isFallback = true;
    } else {
      // Check if requested date has enough profile comparisons (at least 50 profiles)
      const testCount = profiles.filter(p => {
        const hist = Array.isArray(p.follower_history) ? p.follower_history : [];
        const curIdx = hist.findIndex(h => h.date === requestedDate && h.count && h.status !== 'Server Failed');
        return curIdx > 0 && hist[curIdx - 1]?.count;
      }).length;

      if (testCount < 50) {
        // Not enough profiles scraped for this date yet; fall back to newest complete date
        isFallback = true;
      } else {
        activeDate = requestedDate;
      }
    }
  }

  if (!activeDate) {
    // Default to the latest date that has a preceding date
    activeDate = availableDates[0];
  }

  const activeDateObj = new Date(activeDate);
  // Find predecessor date in availableDates list (the closest date before activeDate)
  const pastDates = availableDates.filter(d => new Date(d) < activeDateObj);
  const prevDate = pastDates.length > 0 ? pastDates[0] : null;

  if (!prevDate) {
    return {
      activeDate,
      prevDate: null,
      isFallback,
      totalCount: profiles.length,
      gainersCount: 0,
      losersCount: 0,
      gainers: [],
      losers: [],
      all: []
    };
  }

  const all = [];
  const seenHandles = new Set();

  for (const p of profiles) {
    // 1. Deduplicate by instagram_handle (prevents duplicate database rows from appearing twice)
    const handle = (p.instagram_handle || '').toLowerCase().trim();
    if (handle) {
      if (seenHandles.has(handle)) continue;
      seenHandles.add(handle);
    }

    const hist = Array.isArray(p.follower_history)
      ? p.follower_history.filter(h => h.count && h.status !== 'Server Failed')
      : [];

    const curEntry = hist.find(h => h.date === activeDate);
    if (!curEntry || !curEntry.count) continue;

    // Find the entry on or closest to prevDate before activeDate
    const curIdx = hist.findIndex(h => h.date === activeDate);
    if (curIdx <= 0) continue;

    const prevEntry = hist[curIdx - 1];
    if (!prevEntry || !prevEntry.count) continue;

    const curCount = Number(curEntry.count);
    const prevCount = Number(prevEntry.count);
    const change = curCount - prevCount;
    const growthPercent = prevCount > 0 ? (change / prevCount) * 100 : 0;

    // 2. Anomaly Guard: Suppress unnatural jumps caused by manual handle renames (e.g. 375K -> 5.5M is a 1300% jump)
    if (Math.abs(change) > 1000000 && Math.abs(growthPercent) > 100) {
      continue;
    }

    const creatorItem = {
      id: p.id,
      name: p.name || 'Creator',
      instagram_handle: p.instagram_handle || '',
      category: p.category || 'Creator',
      language: p.language || 'All',
      photo_url: p.photo_url || null,
      followers_count: curCount,
      followers_text: formatFollowersText(curCount),
      prev_count: prevCount,
      prev_text: formatFollowersText(prevCount),
      change,
      formatted_change: formatSignedChange(change),
      growth_percent: growthPercent,
      formatted_percent: formatSignedPercent(growthPercent),
      is_gainer: change > 0,
      is_loser: change < 0,
      active_date: activeDate,
      prev_date: prevDate
    };

    all.push(creatorItem);
  }

  const positiveCount = all.filter(p => p.change > 0).length;
  const negativeCount = all.filter(p => p.change < 0).length;

  // 1. Gainers view: all creators sorted from highest gain (+400k) down to 0,
  // then transitioning into minus followers from less to high (-1, -2, ... -45k)
  const gainers = all.map(p => ({ ...p })).sort((a, b) => b.change - a.change);
  gainers.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // 2. Losers view: all creators sorted from biggest drop (-45k) down to -1,
  // then transitioning into 0 and smallest gains to highest gains (+1, +2, ... +400k)
  const losers = all.map(p => ({ ...p })).sort((a, b) => a.change - b.change);
  losers.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return {
    activeDate,
    prevDate,
    isFallback,
    totalCount: all.length,
    gainersCount: positiveCount,
    losersCount: negativeCount,
    gainers,
    losers,
    all
  };
}
