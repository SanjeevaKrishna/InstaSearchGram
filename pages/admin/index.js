import { useState, useEffect } from 'react'
import Head from 'next/head'

// ─── helpers ───────────────────────────────────────────────────────────────
const TOKEN_KEY = 'is_admin_token'
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': getToken() || '',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.success) {
        setToken(data.token)
        onLogin()
      } else {
        setError('Wrong secret code. Try again.')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--black)',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 36,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 8,
        }}>Admin Access</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
          Enter your secret admin code to continue
        </p>
        <input
          className="input-field"
          type="password"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Secret code..."
          style={{ marginBottom: 12, textAlign: 'center', letterSpacing: 4 }}
          autoFocus
        />
        {error && (
          <div style={{ color: '#ff5252', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Checking...' : 'Enter Admin Panel'}
        </button>
      </div>
    </div>
  )
}

function CelebrityForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', instagram_handle: '', followers_count: '', posts_count: '', photo_url: '', is_featured: false
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Name is required')
    setSaving(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/celebrities', {
        method: initial ? 'PUT' : 'POST',
        body: {
          ...form,
          id: initial?.id,
          followers_count: form.followers_count ? Number(form.followers_count) : null,
          posts_count: form.posts_count ? Number(form.posts_count) : null,
        },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.celebrity)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>
        {initial ? '✏️ Edit Celebrity' : '➕ Add New Celebrity'}
      </h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Virat Kohli" />
        </div>
        <div>
          <label style={labelStyle}>Instagram Handle (without @)</label>
          <input className="input-field" value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)} placeholder="e.g. virat.kohli" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Followers Count (number)</label>
            <input className="input-field" type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="e.g. 17000000" />
          </div>
          <div>
            <label style={labelStyle}>Total Posts on Instagram</label>
            <input className="input-field" type="number" value={form.posts_count} onChange={e => set('posts_count', e.target.value)} placeholder="e.g. 140" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Profile Photo</label>
          {form.photo_url ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={form.photo_url} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface2)' }} />
              <button className="btn btn-ghost" onClick={() => set('photo_url', '')} style={{ color: '#ff5252' }}>Remove</button>
            </div>
          ) : (
            <div>
              <input type="file" accept="image/*" className="input-field" style={{ padding: '8px' }} onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                
                // Show a temporary loading state by setting saving
                setSaving(true)
                setError('')
                const reader = new FileReader()
                reader.readAsDataURL(file)
                reader.onload = async () => {
                  try {
                    const res = await adminFetch('/api/admin/upload', {
                      method: 'POST',
                      body: { image: reader.result }
                    })
                    const text = await res.text()
                    let data
                    try {
                      data = JSON.parse(text)
                    } catch(e) {
                      throw new Error(`Server Error: ${res.status} - ${text.substring(0, 40)}`)
                    }
                    if (data.url) set('photo_url', data.url)
                    else throw new Error(data.error || 'Upload failed')
                  } catch(err) {
                    setError(err.message || 'Failed to upload image')
                  } finally {
                    setSaving(false)
                  }
                }
              }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Select an image to upload securely to Cloudinary</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="featured" style={{ fontSize: 14, color: 'var(--text-dim)', cursor: 'pointer' }}>
            Show on Homepage (Featured)
          </label>
        </div>
        {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : initial ? 'Update Celebrity' : 'Add Celebrity'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PostForm({ celebrities, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    celebrity_id: '', post_url: '', post_type: 'reel', caption: '', post_date: '',
    tags: '', is_most_liked: false, is_most_commented: false, is_most_viewed: false, is_first_post: false, playlist_name: '', playlist_cover_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.celebrity_id) return setError('Please select a celebrity')
    if (!form.post_url.trim()) return setError('Post URL is required')
    setSaving(true)
    setError('')
    try {
      const tags = form.tags
        ? form.tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
        : []
      const res = await adminFetch('/api/admin/posts', {
        method: initial ? 'PUT' : 'POST',
        body: { ...form, id: initial?.id, tags },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.post)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>
        {initial ? '✏️ Edit Post' : '➕ Add New Post / Reel'}
      </h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={labelStyle}>Celebrity *</label>
          <select
            className="input-field"
            value={form.celebrity_id}
            onChange={e => set('celebrity_id', e.target.value)}
          >
            <option value="">— Select Celebrity —</option>
            {celebrities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Instagram Post / Reel URL *</label>
          <input className="input-field" value={form.post_url} onChange={e => set('post_url', e.target.value)} placeholder="https://www.instagram.com/reel/..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select className="input-field" value={form.post_type} onChange={e => set('post_type', e.target.value)}>
              <option value="reel">Reel</option>
              <option value="post">Post (Photo)</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Post Date</label>
            <input className="input-field" type="date" value={form.post_date} onChange={e => set('post_date', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Caption (optional)</label>
          <textarea
            className="input-field"
            value={form.caption}
            onChange={e => set('caption', e.target.value)}
            placeholder="Paste the caption or describe the post..."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Playlist Name (optional)</label>
          <input className="input-field" value={form.playlist_name || ''} onChange={e => set('playlist_name', e.target.value)} placeholder="e.g. World Cup 2023" />
        </div>
        {form.playlist_name && (
          <div>
            <label style={labelStyle}>Playlist Cover Image</label>
            {form.playlist_cover_url ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={form.playlist_cover_url} alt="Cover" style={{ width: 100, height: 60, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)' }} />
                <button className="btn btn-ghost" onClick={() => set('playlist_cover_url', '')} style={{ color: '#ff5252' }}>Remove</button>
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" className="input-field" style={{ padding: '8px' }} onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  setSaving(true)
                  setError('')
                  const reader = new FileReader()
                  reader.readAsDataURL(file)
                  reader.onload = async () => {
                    try {
                      const res = await adminFetch('/api/admin/upload', {
                        method: 'POST',
                        body: { image: reader.result }
                      })
                      const text = await res.text()
                      let data
                      try { data = JSON.parse(text) } catch(e) { throw new Error(`Server Error: ${res.status}`) }
                      if (data.url) set('playlist_cover_url', data.url)
                      else throw new Error(data.error || 'Upload failed')
                    } catch(err) {
                      setError(err.message || 'Failed to upload image')
                    } finally {
                      setSaving(false)
                    }
                  }
                }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Upload an image for the playlist thumbnail</div>
              </div>
            )}
          </div>
        )}
        <div>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input
            className="input-field"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="e.g. cricket, ipl, celebration, boundary"
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            These are searchable keywords users can filter by
          </div>
        </div>
        {/* Checkboxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { key: 'is_most_liked', label: '❤️ Most Liked Post' },
            { key: 'is_most_commented', label: '💬 Most Commented' },
            { key: 'is_most_viewed', label: '👁 Most Viewed' },
            { key: 'is_first_post', label: '⭐ First Post Ever' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id={key}
                checked={form[key]}
                onChange={e => set(key, e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor={key} style={{ fontSize: 13, color: 'var(--text-dim)', cursor: 'pointer' }}>{label}</label>
            </div>
          ))}
        </div>
        {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : initial ? 'Update Post' : 'Add Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
  fontWeight: 600,
}

// ─── Main Admin Panel ────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('celebrities')
  const [celebrities, setCelebrities] = useState([])
  const [posts, setPosts] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [showCelForm, setShowCelForm] = useState(false)
  const [editingCel, setEditingCel] = useState(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [filterCelId, setFilterCelId] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    // Check if already logged in
    if (getToken()) setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    loadData()
  }, [authed, tab])

  const loadData = async () => {
    setLoadingData(true)
    try {
      if (tab === 'celebrities' || tab === 'posts') {
        const celRes = await adminFetch('/api/admin/celebrities')
        const celData = await celRes.json()
        setCelebrities(celData.celebrities || [])
      }
      if (tab === 'posts') {
        const url = filterCelId ? `/api/admin/posts?celebrity_id=${filterCelId}` : '/api/admin/posts'
        const postRes = await adminFetch(url)
        const postData = await postRes.json()
        setPosts(postData.posts || [])
      }
    } catch {}
    setLoadingData(false)
  }

  const deleteCelebrity = async (id) => {
    if (!confirm('Delete this celebrity AND all their posts? This cannot be undone!')) return
    await adminFetch('/api/admin/celebrities', { method: 'DELETE', body: { id } })
    setCelebrities(c => c.filter(x => x.id !== id))
    showToast('✅ Celebrity deleted')
  }

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return
    await adminFetch('/api/admin/posts', { method: 'DELETE', body: { id } })
    setPosts(p => p.filter(x => x.id !== id))
    showToast('✅ Post deleted')
  }

  const formatCount = (n) => {
    if (!n) return '—'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  return (
    <>
      <Head>
        <title>Admin — InstaSearch</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#e8f5e9', border: '1px solid #4caf50',
          color: '#2e7d32', padding: '12px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 500,
        }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
              🔐 Admin Panel
            </span>
            <span style={{
              fontSize: 11, color: '#ff6b35', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'rgba(255,107,53,0.1)', padding: '2px 8px', borderRadius: 4,
            }}>Private</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/" target="_blank">
              <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>View Site ↗</button>
            </a>
            <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => { clearToken(); setAuthed(false) }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Database Usage Tracker */}
      <div style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 20px' }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Database Usage (Estimated)</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              {(((JSON.stringify(celebrities).length + JSON.stringify(posts).length) / 1024 / 1024) || 0).toFixed(2)} MB / 500 MB
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--gradient)', 
              width: `${Math.min(100, Math.max(0.5, ((JSON.stringify(celebrities).length + JSON.stringify(posts).length) / 1024 / 1024) / 500 * 100))}%` 
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Rows tracked: {celebrities.length} celebrities, {posts.length} posts
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'celebrities', label: '👤 Celebrities' },
            { id: 'posts', label: '🎬 Posts & Reels' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setShowCelForm(false); setShowPostForm(false); setEditingCel(null); setEditingPost(null) }}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                background: tab === t.id ? 'var(--gradient)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CELEBRITIES TAB ─────────────────────────────────────────────── */}
        {tab === 'celebrities' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Celebrities ({celebrities.length})
              </h2>
              {!showCelForm && !editingCel && (
                <button className="btn btn-primary" onClick={() => setShowCelForm(true)}>
                  + Add Celebrity
                </button>
              )}
            </div>

            {(showCelForm || editingCel) && (
              <CelebrityForm
                initial={editingCel}
                onSave={(cel) => {
                  if (editingCel) {
                    setCelebrities(c => c.map(x => x.id === cel.id ? cel : x))
                  } else {
                    setCelebrities(c => [...c, cel])
                  }
                  setShowCelForm(false)
                  setEditingCel(null)
                  showToast('✅ Celebrity saved!')
                }}
                onCancel={() => { setShowCelForm(false); setEditingCel(null) }}
              />
            )}

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {celebrities.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    No celebrities yet. Add your first one! 👆
                  </div>
                )}
                {celebrities.map(cel => (
                  <div key={cel.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 18, flexShrink: 0,
                    }}>
                      {cel.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{cel.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        @{cel.instagram_handle || '—'} &nbsp;·&nbsp; {formatCount(cel.followers_count)} followers
                        {cel.is_featured && <span style={{ marginLeft: 8, color: '#ffeb3b', fontWeight: 600 }}>⭐ Featured</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <a href={`/celebrity/${cel.slug}`} target="_blank">
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>View</button>
                      </a>
                      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => { setEditingCel({ ...cel, followers_count: cel.followers_count?.toString(), posts_count: cel.posts_count?.toString(), tags: '' }); setShowCelForm(false) }}>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCelebrity(cel.id)}
                        style={{
                          background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                          color: '#ff5252', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── POSTS TAB ────────────────────────────────────────────────────── */}
        {tab === 'posts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Posts & Reels ({posts.length})
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  className="input-field"
                  value={filterCelId}
                  onChange={e => { setFilterCelId(e.target.value); setTimeout(loadData, 100) }}
                  style={{ width: 200, fontSize: 13 }}
                >
                  <option value="">All Celebrities</option>
                  {celebrities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!showPostForm && !editingPost && (
                  <button className="btn btn-primary" onClick={() => setShowPostForm(true)}>
                    + Add Post
                  </button>
                )}
              </div>
            </div>

            {(showPostForm || editingPost) && (
              <PostForm
                celebrities={celebrities}
                initial={editingPost ? {
                  ...editingPost,
                  tags: (editingPost.tags || []).join(', ')
                } : null}
                onSave={(post) => {
                  if (editingPost) {
                    setPosts(p => p.map(x => x.id === post.id ? post : x))
                  } else {
                    setPosts(p => [post, ...p])
                  }
                  setShowPostForm(false)
                  setEditingPost(null)
                  showToast('✅ Post saved!')
                }}
                onCancel={() => { setShowPostForm(false); setEditingPost(null) }}
              />
            )}

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {posts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    No posts yet. Add your first one! 👆
                  </div>
                )}
                {posts.map(post => {
                  const cel = celebrities.find(c => c.id === post.celebrity_id)
                  return (
                    <div key={post.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '2px 7px', borderRadius: 4,
                            background: post.post_type === 'reel' ? 'rgba(224,64,251,0.2)' : 'rgba(0,229,255,0.2)',
                            color: post.post_type === 'reel' ? '#e040fb' : '#00e5ff',
                          }}>
                            {post.post_type}
                          </span>
                          {cel && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cel.name}</span>}
                          {post.post_date && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {post.post_date}</span>}
                          {post.playlist_name && <span style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface2)', borderRadius: 4, color: 'var(--text)' }}>📺 {post.playlist_name}</span>}
                          {post.is_most_liked && <span style={{ fontSize: 11, color: '#ff6b35' }}>❤️</span>}
                          {post.is_most_commented && <span style={{ fontSize: 11, color: '#00e5ff' }}>💬</span>}
                          {post.is_most_viewed && <span style={{ fontSize: 11, color: '#e040fb' }}>👁</span>}
                          {post.is_first_post && <span style={{ fontSize: 11, color: '#ffeb3b' }}>⭐</span>}
                        </div>
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 13, color: 'var(--accent)', wordBreak: 'break-all' }}>
                          {post.post_url}
                        </a>
                        {post.caption && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.caption}
                          </p>
                        )}
                        {post.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                            {post.tags.map(t => (
                              <span key={t} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-dim)' }}>
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => { setEditingPost(post); setShowPostForm(false) }}>
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          style={{
                            background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                            color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
