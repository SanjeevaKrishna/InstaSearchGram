import { getAdminClient } from './supabase'

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media'

export async function ensureMediaBucket() {
  const supabase = getAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw listError

  const exists = (buckets || []).some((b) => b.name === MEDIA_BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    })
    if (error && !String(error.message || '').toLowerCase().includes('already exists')) {
      throw error
    }
  }
  return supabase
}

export function getPublicStorageUrl(path) {
  const supabase = getAdminClient()
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadImageBuffer(buffer, { filename, contentType, folder = 'uploads' }) {
  const supabase = await ensureMediaBucket()
  const safeName = String(filename || `img-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
    contentType: contentType || 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return getPublicStorageUrl(path)
}
