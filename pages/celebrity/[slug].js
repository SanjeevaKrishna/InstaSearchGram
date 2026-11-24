import { supabase } from '../../lib/supabase'

export default function CelebrityRedirect() {
  return null
}

export async function getServerSideProps(context) {
  const { slug, compare } = context.query
  const decodedSlug = decodeURIComponent(slug || '').toLowerCase().trim()

  try {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, slug, instagram_handle')
      .eq('slug', decodedSlug)
      .maybeSingle()

    const targetHandle = (celebrity && celebrity.instagram_handle)
      ? celebrity.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
      : decodedSlug

    const compareParam = compare ? `?compare=${encodeURIComponent(compare)}` : ''
    const dest = `/profile/${encodeURIComponent(targetHandle)}${compareParam}`

    return {
      redirect: {
        destination: dest,
        permanent: true, // 301 Permanent Redirect
      }
    }
  } catch (err) {
    console.error('Error redirecting celebrity route:', err)
    return {
      redirect: {
        destination: `/profile/${encodeURIComponent(decodedSlug)}`,
        permanent: true,
      }
    }
  }
}
