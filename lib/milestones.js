/**
 * Milestones Helper for Spialr.com
 * Dynamically computes creator follower milestones (50k, 100k, 200k... 1M, 1.5M, 2M... 10M, 11M...)
 * and dates achieved from follower history.
 */

export function generateMilestones(currentCount) {
  if (!currentCount || currentCount < 10000) return []
  const list = []

  // Under 100K: 10k, 25k, 50k, 75k, 100k
  const lowTiers = [10000, 25000, 50000, 75000, 100000]
  for (const t of lowTiers) {
    if (t <= currentCount) list.push(t)
  }

  // 100K to 1M: 200k, 300k, 400k, 500k, 600k, 700k, 800k, 900k, 1000000
  for (let t = 200000; t <= 1000000; t += 100000) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
  }

  // 1M to 10M: every 500k (1.5M, 2M, 2.5M, 3M, 3.5M, ... 10M)
  for (let t = 1500000; t <= 10000000; t += 500000) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
  }

  // 10M+: every 1M (11M, 12M, 13M ... up to currentCount)
  for (let t = 11000000; t <= currentCount; t += 1000000) {
    if (!list.includes(t)) list.push(t)
  }

  return list
}

export function formatMilestoneLabel(n) {
  if (!n) return '0'
  const abs = Math.abs(n)
  if (abs >= 1000000) {
    const val = abs / 1000000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`
  }
  if (abs >= 1000) {
    const val = abs / 1000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(0)}K`
  }
  return abs.toLocaleString()
}

export function parseMilestoneParam(str) {
  if (!str) return null
  const s = String(str).toUpperCase().trim().replace('-', '.')
  if (s.endsWith('M')) {
    const num = parseFloat(s.slice(0, -1))
    return Math.round(num * 1000000)
  }
  if (s.endsWith('K')) {
    const num = parseFloat(s.slice(0, -1))
    return Math.round(num * 1000)
  }
  const parsed = parseInt(s, 10)
  return isNaN(parsed) ? null : parsed
}

export function findMilestoneAchievedDate(followerHistory = [], milestoneValue = 0) {
  if (!Array.isArray(followerHistory) || followerHistory.length === 0 || !milestoneValue) {
    return null
  }

  // Sort chronological
  const sorted = [...followerHistory]
    .filter(h => h && h.date && h.count && h.count > 0 && h.status !== 'Server Failed' && !h.serverFailed)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  for (const item of sorted) {
    if (item.count >= milestoneValue) {
      try {
        const d = new Date(item.date + 'T00:00:00Z')
        const day = d.getUTCDate()
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const month = monthNames[d.getUTCMonth()]
        const year = d.getUTCFullYear()
        return `${day} ${month} ${year}`
      } catch {
        return item.date
      }
    }
  }

  return null
}
