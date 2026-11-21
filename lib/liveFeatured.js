/**
 * Helper to manage featured status for Live Profiles (most_followed)
 * Stored in live_settings (id: 101) for instant compatibility, and synchronizes
 * with most_followed.is_featured column if present.
 */

export async function getFeaturedLiveIds(supabase) {
  const idsSet = new Set()

  try {
    const { data } = await supabase
      .from('live_settings')
      .select('instagram_session_id')
      .eq('id', 101)
      .maybeSingle()

    if (data?.instagram_session_id) {
      try {
        const parsed = JSON.parse(data.instagram_session_id)
        if (Array.isArray(parsed?.featured_ids)) {
          parsed.featured_ids.forEach(id => idsSet.add(String(id)))
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error('getFeaturedLiveIds error:', err)
  }

  // Also check if most_followed has is_featured column
  try {
    const { data } = await supabase
      .from('most_followed')
      .select('id')
      .eq('is_featured', true)

    if (data && Array.isArray(data)) {
      data.forEach(row => idsSet.add(String(row.id)))
    }
  } catch (err) {
    // Column might not exist yet, safe to ignore
  }

  return Array.from(idsSet)
}

export async function setFeaturedLiveId(supabase, id, isFeatured) {
  const strId = String(id)
  const currentIds = await getFeaturedLiveIds(supabase)
  const idsSet = new Set(currentIds)

  if (isFeatured) {
    idsSet.add(strId)
  } else {
    idsSet.delete(strId)
  }

  const updatedIds = Array.from(idsSet)

  try {
    await supabase
      .from('live_settings')
      .upsert({
        id: 101,
        live_date: 'featured_live_profiles',
        trending_enabled: true,
        instagram_session_id: JSON.stringify({ featured_ids: updatedIds }),
        updated_at: new Date().toISOString()
      })
  } catch (err) {
    console.error('setFeaturedLiveId live_settings upsert error:', err)
  }

  // Attempt column update in most_followed if column exists
  try {
    await supabase
      .from('most_followed')
      .update({ is_featured: !!isFeatured })
      .eq('id', id)
  } catch (err) {
    // Column might not exist yet, safe to ignore
  }

  return updatedIds
}
