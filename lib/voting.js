import { getAdminClient } from './supabase'

export async function recalculateVotingRanks() {
  const supabase = getAdminClient()

  // 1. Fetch all records
  let allProfiles = []
  let from = 0
  let to = 999
  while (true) {
    const { data, error } = await supabase
      .from('most_followed')
      .select('*')
      .range(from, to)

    if (error) throw error
    allProfiles = allProfiles.concat(data || [])
    if (!data || data.length < 1000) break
    from += 1000
    to += 1000
  }

  // 2. Sort by followers_count desc to assign follower rank
  const followerRankProfiles = [...allProfiles].sort((a, b) => {
    const followersA = a.followers_count || 0
    const followersB = b.followers_count || 0
    if (followersA !== followersB) return followersB - followersA
    return (a.name || '').localeCompare(b.name || '')
  })

  const followerRanks = {}
  for (let i = 0; i < followerRankProfiles.length; i++) {
    followerRanks[followerRankProfiles[i].id] = i + 1
  }

  // 3. Sort by votes desc, then by followers_count desc, then by name asc
  allProfiles.sort((a, b) => {
    const votesA = a.votes || 0
    const votesB = b.votes || 0
    if (votesA !== votesB) return votesB - votesA

    const followersA = a.followers_count || 0
    const followersB = b.followers_count || 0
    if (followersA !== followersB) return followersB - followersA

    return (a.name || '').localeCompare(b.name || '')
  })

  // 4. Update database ranks in bulk
  const rowsToUpdate = []
  for (let i = 0; i < allProfiles.length; i++) {
    const profile = allProfiles[i]
    const currentRank = i + 1
    const followerRank = followerRanks[profile.id] || currentRank

    const oldCurrentRank = profile.current_vote_rank
    const oldPreviousRank = profile.previous_vote_rank

    let newPreviousRank = oldPreviousRank
    if (oldCurrentRank !== null && oldCurrentRank !== undefined) {
      if (currentRank !== oldCurrentRank) {
        newPreviousRank = oldCurrentRank
      } else if (oldPreviousRank === oldCurrentRank && (profile.votes || 0) > 0) {
        newPreviousRank = followerRank
      }
    } else {
      newPreviousRank = followerRank
    }

    let newHighest = profile.highest_vote_rank
    if (!newHighest || currentRank < newHighest) {
      newHighest = currentRank
    }

    let newLowest = profile.lowest_vote_rank
    if (!newLowest || currentRank > newLowest) {
      newLowest = currentRank
    }

    // Only update if changes are detected
    if (
      oldCurrentRank !== currentRank ||
      oldPreviousRank !== newPreviousRank ||
      profile.highest_vote_rank !== newHighest ||
      profile.lowest_vote_rank !== newLowest
    ) {
      rowsToUpdate.push({
        id: profile.id,
        name: profile.name,
        current_vote_rank: currentRank,
        previous_vote_rank: newPreviousRank,
        highest_vote_rank: newHighest,
        lowest_vote_rank: newLowest
      })
    }
  }

  if (rowsToUpdate.length > 0) {
    const { error: updateErr } = await supabase
      .from('most_followed')
      .upsert(rowsToUpdate, { onConflict: 'id' })

    if (updateErr) throw updateErr
  }
}
