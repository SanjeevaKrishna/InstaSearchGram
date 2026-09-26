/**
 * Milestones Helper for Spialr.com
 * Dynamically computes major creator follower milestones (10k, 25k, 50k, 75k, 100k, 150k, 200k... 1M, 2M... 50M, 100M...)
 * and extracts verified achievement dates that occurred during tracking.
 */

export function generateMilestones(currentCount) {
  if (!currentCount || currentCount < 10000) return []
  const list = []

  // 1. Under 100K: Major tiers (10k, 25k, 50k, 75k, 100k)
  const lowTiers = [10000, 25000, 50000, 75000, 100000]
  for (const t of lowTiers) {
    if (t <= currentCount) list.push(t)
  }

  // 2. 100K to 1M: (150k, 200k, 250k, 300k, 400k, 500k, 600k, 700k, 750k, 800k, 900k, 1M)
  const midTiers = [150000, 200000, 250000, 300000, 400000, 500000, 600000, 700000, 750000, 800000, 900000, 1000000]
  for (const t of midTiers) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
  }

  // 3. 1M to 10M: (1.5M, 2M, 2.5M, 3M, 4M, 5M, 6M, 7M, 8M, 9M, 10M)
  const millionTiers = [1500000, 2000000, 2500000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 9000000, 10000000]
  for (const t of millionTiers) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
  }

  // 4. 10M to 50M: (15M, 20M, 25M, 30M, 35M, 40M, 45M, 50M)
  const bigTiers = [15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 45000000, 50000000]
  for (const t of bigTiers) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
  }

  // 5. 50M to 100M: (60M, 70M, 80M, 90M, 100M)
  const hugeTiers = [60000000, 70000000, 80000000, 90000000, 100000000]
  for (const t of hugeTiers) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
  }

  // 6. 100M+: (125M, 150M, 175M, 200M, 225M, 250M, 275M, 300M, 350M, 400M, 500M)
  const megaTiers = [125000000, 150000000, 175000000, 200000000, 225000000, 250000000, 275000000, 300000000, 350000000, 400000000, 500000000]
  for (const t of megaTiers) {
    if (t <= currentCount && !list.includes(t)) list.push(t)
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
  const s = String(str).toUpperCase().trim().replace(/-/g, '.')
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

/**
 * Returns the VERIFIED real achievement date if and only if the milestone
 * transition was recorded while Spialr was tracking the account.
 * If the account was already above the milestone on the first tracked scrape,
 * returns null so no false historical dates are shown.
 */
export function findMilestoneAchievedDate(followerHistory = [], milestoneValue = 0) {
  if (!Array.isArray(followerHistory) || followerHistory.length === 0 || !milestoneValue) {
    return null
  }

  // Sort chronologically
  const sorted = [...followerHistory]
    .filter(h => h && h.date && h.count && h.count > 0 && h.status !== 'Server Failed' && !h.serverFailed)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (sorted.length === 0) return null

  // If the very first scrape was ALREADY above or equal to the milestone,
  // we do not have the real historical date (e.g. Virat hitting 100K years ago).
  if (sorted[0].count >= milestoneValue) {
    return null
  }

  // Find the exact day when count crossed milestoneValue from below
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].count < milestoneValue && sorted[i].count >= milestoneValue) {
      try {
        const d = new Date(sorted[i].date + 'T00:00:00Z')
        const day = d.getUTCDate()
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const month = monthNames[d.getUTCMonth()]
        const year = d.getUTCFullYear()
        return `${day} ${month} ${year}`
      } catch {
        return sorted[i].date
      }
    }
  }

  return null
}
