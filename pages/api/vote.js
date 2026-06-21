import { getAdminClient } from '../../lib/supabase'
import { recalculateVotingRanks } from '../../lib/voting'

// In-memory rate limiting map (IP -> timestamp)
const ipCooldownMap = new Map()
const COOLDOWN_MS = 1000 // 1-second cooldown between votes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  try {
    const { profileId, type } = req.body
    if (!profileId) return res.status(400).json({ error: 'Profile ID is required' })
    if (type !== 'vote' && type !== 'devote') {
      return res.status(400).json({ error: 'Invalid vote type. Must be "vote" or "devote".' })
    }

    // Basic rate limit / Cooldown protection
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const lastVoteTime = ipCooldownMap.get(ip)

    if (lastVoteTime && (now - lastVoteTime < COOLDOWN_MS)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' })
    }

    ipCooldownMap.set(ip, now)

    // Clean up older entries in rate limit map to prevent leaks
    if (ipCooldownMap.size > 5000) {
      const expirationTime = now - COOLDOWN_MS
      for (const [key, val] of ipCooldownMap.entries()) {
        if (val < expirationTime) ipCooldownMap.delete(key)
      }
    }

    const supabase = getAdminClient()

    // 1. Fetch current votes count for this profile
    const { data: profile, error: fetchErr } = await supabase
      .from('most_followed')
      .select('votes, name')
      .eq('id', profileId)
      .single()

    if (fetchErr || !profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const newVotes = (profile.votes || 0) + (type === 'vote' ? 1 : -1)

    // 2. Update votes in database
    const { error: updateErr } = await supabase
      .from('most_followed')
      .update({ votes: newVotes })
      .eq('id', profileId)

    if (updateErr) throw updateErr

    // 3. Recalculate all rankings instantly
    await recalculateVotingRanks()

    // 4. Fetch updated details to return new rank
    const { data: updatedProfile, error: fetchUpdatedErr } = await supabase
      .from('most_followed')
      .select('votes, current_vote_rank')
      .eq('id', profileId)
      .single()

    if (fetchUpdatedErr) throw fetchUpdatedErr

    return res.status(200).json({
      success: true,
      votes: updatedProfile.votes,
      currentRank: updatedProfile.current_vote_rank,
      name: profile.name
    })

  } catch (err) {
    console.error('Voting API Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to process vote' })
  }
}
