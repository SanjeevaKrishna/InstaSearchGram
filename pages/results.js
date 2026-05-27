import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'

export default function ResultsPage() {
  const router = useRouter()
  const { slug, search, filter, date, month, start, end, playlist } = router.query

  const [celebrity, setCelebrity] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    if (celebrity?.id) {
      const alreadyRequested = localStorage.getItem(`requested_${celebrity.id}`)
      if (alreadyRequested === 'true') {
        setRequested(true)
      }
    }
  }, [celebrity])

  const handleRequestFullDetails = async () => {
    if (!celebrity?.id) return
    setRequesting(true)
    try {
      const res = await fetch('/api/celebrities/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: celebrity.id })
      })
      const data = await res.json()
      if (data.success) {
        setRequested(true)
        localStorage.setItem(`requested_${celebrity.id}`, 'true')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRequesting(false)
    }
  }

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/celebrities/${slug}`)
      .then(r => r.json())
      .then(d => {
        setCelebrity(d.celebrity)
        
        // Filter posts client-side
        let result = d.posts || []

        if (filter === 'most_liked') result = result.filter(p => p.is_most_liked)
        else if (filter === 'most_commented') result = result.filter(p => p.is_most_commented)
        else if (filter === 'most_viewed') result = result.filter(p => p.is_most_viewed)
        else if (filter === 'first_post') result = result.filter(p => p.is_first_post)

        if (search) {
          const s = search.toLowerCase()
          result = result.filter(p =>
            (p.caption || '').toLowerCase().includes(s) ||
            (p.tags || []).some(t => t.toLowerCase().includes(s))
          )
        }

        if (date) {
          result = result.filter(p => p.post_date === date)
        }

        if (month) {
          // month format is YYYY-MM
          result = result.filter(p => p.post_date && p.post_date.startsWith(month))
        }

        if (start) result = result.filter(p => p.post_date && p.post_date >= start)
        if (end) result = result.filter(p => p.post_date && p.post_date <= end)

        if (playlist) {
          result = result.filter(p => p.playlist_name === playlist)
        }

        setPosts(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug, search, filter, date, month, start, end, playlist])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </>
  )

  let filterDesc = 'All posts'
  if (filter === 'most_liked') filterDesc = 'Most Liked Post'
  else if (filter === 'most_commented') filterDesc = 'Most Commented Post'
  else if (filter === 'most_viewed') filterDesc = 'Most Viewed Post'
  else if (filter === 'first_post') filterDesc = 'First Post'
  else if (search) filterDesc = `Search: "${search}"`
  else if (date) filterDesc = `Date: ${new Date(date).toLocaleDateString()}`
  else if (month) filterDesc = `Month: ${month}`
  else if (start || end) filterDesc = `Timeline: ${start || 'Any'} to ${end || 'Any'}`
  else if (playlist) filterDesc = `Playlist: ${playlist}`

  return (
    <>
      <Head>
        <title>Results — InstaSearch</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 80px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, cursor: 'pointer', padding: 0 }}>
          ← Back to Profile
        </button>

        <div className="card fade-in" style={{ marginBottom: 32, padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {celebrity?.photo_url ? (
            <img src={celebrity.photo_url} alt={celebrity.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
              {celebrity?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 2 }}>
              {filterDesc}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Found {posts.length} result{posts.length !== 1 ? 's' : ''} for {celebrity?.name}
            </div>
          </div>
        </div>

        {celebrity && !celebrity.has_full_details && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-bright)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 32,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ fontSize: 24 }}>💡</div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 4, color: 'var(--accent)' }}>
                Note!
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
                Right now, we only have the top 4 featured posts loaded for <strong>{celebrity?.name || 'this celebrity'}</strong>. Want to see their complete Instagram Posts and playlists? Tap <strong>Request</strong> below, and we will load all their posts within 2 days! 🚀
              </p>
            </div>
            {requested ? (
              <div style={{
                color: '#00c853',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0, 200, 83, 0.08)',
                padding: '6px 16px',
                borderRadius: '100px'
              }}>
                ✓ Requested successfully!
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleRequestFullDetails}
                disabled={requesting}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 4
                }}
              >
                {requesting ? 'Requesting...' : 'Request'}
              </button>
            )}
          </div>
        )}

        {posts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p>No posts match your filters.</p>
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => router.back()}>
              Try another search
            </button>
          </div>
        )}
      </main>
    </>
  )
}
