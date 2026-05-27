import { useState, useEffect } from 'react'
import Head from 'next/head'
import PostCard from '../../components/PostCard'

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

function AdminModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: 550,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface2)'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--text)',
            margin: 0
          }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

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
    name: '', instagram_handle: '', followers_count: '', posts_count: '', photo_url: '', is_featured: false,
    has_full_details: false
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
          has_full_details: !!form.has_full_details,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="featured" style={{ fontSize: 14, color: 'var(--text-dim)', cursor: 'pointer' }}>
            Show on Homepage (Featured)
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="full_details" checked={form.has_full_details || false} onChange={e => set('has_full_details', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="full_details" style={{ fontSize: 14, color: 'var(--text-dim)', cursor: 'pointer' }}>
            Has Full Instagram Details (All Posts & Playlists Entered)
          </label>
        </div>
      </div>
      {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Update Celebrity' : 'Add Celebrity'}
        </button>
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
  const [existingPlaylists, setExistingPlaylists] = useState([])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!form.celebrity_id) {
      setExistingPlaylists([])
      return
    }
    adminFetch(`/api/admin/posts?celebrity_id=${form.celebrity_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          const uniquePlaylists = []
          const map = new Map()
          data.posts.forEach(p => {
            if (p.playlist_name && p.playlist_name.trim()) {
              const nameLower = p.playlist_name.toLowerCase().trim()
              if (!map.has(nameLower)) {
                map.set(nameLower, true)
                uniquePlaylists.push({
                  name: p.playlist_name.trim(),
                  cover_url: p.playlist_cover_url || ''
                })
              }
            }
          })
          setExistingPlaylists(uniquePlaylists)
        }
      })
      .catch(err => console.error('Failed to load playlists:', err))
  }, [form.celebrity_id])

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
        <input
          className="input-field"
          value={form.playlist_name || ''}
          onChange={e => {
            const val = e.target.value
            set('playlist_name', val)
            
            const match = existingPlaylists.find(p => p.name.toLowerCase().trim() === val.toLowerCase().trim())
            if (match && match.cover_url && !form.playlist_cover_url) {
              set('playlist_cover_url', match.cover_url)
            }
          }}
          placeholder="e.g. World Cup 2023"
          list="celebrity-playlists"
        />
        <datalist id="celebrity-playlists">
          {existingPlaylists.map((p, idx) => (
            <option key={idx} value={p.name} />
          ))}
        </datalist>
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

function NewsForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', image_url: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required')
    setSaving(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/news', {
        method: 'POST',
        body: { ...form, id: initial?.id },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.news)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="News Headline..." />
      </div>
      <div>
        <label style={labelStyle}>Image Cover</label>
        {form.image_url ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={form.image_url} alt="Cover" style={{ width: 100, height: 60, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)' }} />
            <button className="btn btn-ghost" onClick={() => set('image_url', '')} style={{ color: '#ff5252' }}>Remove</button>
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
                  if (data.url) set('image_url', data.url)
                  else throw new Error(data.error || 'Upload failed')
                } catch(err) {
                  setError(err.message || 'Failed to upload image')
                } finally {
                  setSaving(false)
                }
              }
            }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Upload an image for the news thumbnail</div>
          </div>
        )}
      </div>
      <div>
        <label style={labelStyle}>Matter (Content)</label>
        <textarea
          className="input-field"
          value={form.content || ''}
          onChange={e => set('content', e.target.value)}
          placeholder="Write the full news story here..."
          rows={6}
          style={{ resize: 'vertical' }}
        />
      </div>
      {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Update News' : 'Publish News'}
        </button>
      </div>
    </div>
  )
}

function MostFollowedForm({ profiles = [], initial, onSave, onCancel }) {
  const predefinedTabCategories = ['Creators', 'Influencers', 'Actors', 'Meme Pages', 'Sports', 'Politicians', 'Handles', 'Singers']
  
  const parseCategoryAndTag = (rawCategory) => {
    const raw = (rawCategory || '').trim();
    if (raw.includes(':')) {
      const parts = raw.split(':');
      return {
        tabCategory: parts[0].trim(),
        describingTag: parts[1].trim()
      };
    }
    const cat = raw.toLowerCase();
    let tabCategory = 'Creators';
    let describingTag = raw || 'Creator';

    if (cat.includes('actor') || cat.includes('actress')) {
      tabCategory = 'Actors';
    } else if (cat.includes('influencer') || cat.includes('model')) {
      tabCategory = 'Influencers';
    } else if (cat.includes('singer')) {
      tabCategory = 'Singers';
    } else if (cat.includes('creator') || cat.includes('artist')) {
      tabCategory = 'Creators';
    } else if (cat.includes('meme')) {
      tabCategory = 'Meme Pages';
    } else if (cat.includes('handle') || cat.includes('page')) {
      tabCategory = 'Handles';
    } else if (cat.includes('sport') || cat.includes('cricket')) {
      tabCategory = 'Sports';
    } else if (cat.includes('politician')) {
      tabCategory = 'Politicians';
    }

    return { tabCategory, describingTag };
  };

  const parsed = parseCategoryAndTag(initial?.category);

  const [form, setForm] = useState(initial || {
    name: '', photo_url: '', followers_count: '', followers_text: '', order_index: '0'
  })
  
  const [tabCategory, setTabCategory] = useState(parsed.tabCategory)
  const [describingTag, setDescribingTag] = useState(parsed.describingTag)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleNameChange = (nameVal) => {
    setForm(f => {
      const updated = { ...f, name: nameVal }
      if (!initial) {
        const trimmed = nameVal.trim().toLowerCase()
        const match = profiles.find(p => p.name.trim().toLowerCase() === trimmed)
        if (match) {
          setNotice(`✨ Existing profile found! Loaded details for "${match.name}" to update.`)
          updated.id = match.id
          updated.photo_url = match.photo_url || ''
          updated.followers_count = match.followers_count?.toString() || ''
          updated.followers_text = match.followers_text || ''
          updated.order_index = match.order_index?.toString() || '0'
          
          const parsedMatch = parseCategoryAndTag(match.category)
          setTabCategory(parsedMatch.tabCategory)
          setDescribingTag(parsedMatch.describingTag)
        } else {
          if (updated.id) {
            delete updated.id
            updated.photo_url = ''
            updated.followers_count = ''
            updated.followers_text = ''
            updated.order_index = '0'
            setNotice('')
            setTabCategory('Actors')
            setDescribingTag('')
          }
        }
      }
      return updated
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Name is required')
    if (!describingTag.trim()) return setError('Description tag is required')

    const combinedCategory = `${tabCategory}:${describingTag.trim()}`

    setSaving(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/most_followed', {
        method: (initial || form.id) ? 'PUT' : 'POST',
        body: {
          ...form,
          id: initial?.id || form.id,
          followers_count: form.followers_count ? Number(form.followers_count) : 0,
          order_index: form.order_index ? Number(form.order_index) : 0,
          category: combinedCategory
        },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.profile)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <label style={labelStyle}>Full Name *</label>
        <input 
          className="input-field" 
          value={form.name} 
          onChange={e => handleNameChange(e.target.value)} 
          placeholder="e.g. Virat Kohli" 
          list="admin-profiles-list"
        />
        <datalist id="admin-profiles-list">
          {profiles.map(p => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        {notice && (
          <div style={{ color: '#00c853', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
            {notice}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Followers Count (Number for sorting)</label>
          <input className="input-field" type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="e.g. 270000000" />
        </div>
        <div>
          <label style={labelStyle}>Followers Text (Custom display)</label>
          <input className="input-field" value={form.followers_text} onChange={e => set('followers_text', e.target.value)} placeholder="e.g. 270M or 27 Cr" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Category Tab (for Filtering)</label>
          <select
            className="input-field"
            value={tabCategory}
            onChange={e => setTabCategory(e.target.value)}
          >
            {predefinedTabCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Description Tag (for Display)</label>
          <input
            className="input-field"
            value={describingTag}
            onChange={e => setDescribingTag(e.target.value)}
            placeholder="e.g. Actor, Singer, Cricketer, Meme Page"
          />
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
                  try { data = JSON.parse(text) } catch(e) { throw new Error(`Server Error`) }
                  if (data.url) set('photo_url', data.url)
                  else throw new Error(data.error || 'Upload failed')
                } catch(err) {
                  setError(err.message || 'Failed to upload image')
                } finally {
                  setSaving(false)
                }
              }
            }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Select an image to upload securely</div>
          </div>
        )}
      </div>
      {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : (initial || form.id) ? 'Update Profile' : 'Add Profile'}
        </button>
      </div>
    </div>
  )
}

function ViralReelsForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    title: '', photo_url: '', instagram_link: '', order_index: '0', creator_name: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required')
    if (!form.instagram_link.trim()) return setError('Instagram link is required')
    setSaving(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/viral_reels', {
        method: initial ? 'PUT' : 'POST',
        body: {
          ...form,
          id: initial?.id,
          order_index: form.order_index ? Number(form.order_index) : 0,
          creator_name: form.creator_name || '',
        },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.reel)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <label style={labelStyle}>Reel Title / Caption *</label>
        <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Virat Kohli historic knock..." />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Creator Name</label>
          <input className="input-field" value={form.creator_name || ''} onChange={e => set('creator_name', e.target.value)} placeholder="e.g. Virat Kohli" />
        </div>
        <div>
          <label style={labelStyle}>Rank (e.g. 1 for 1st, 2 for 2nd)</label>
          <input className="input-field" type="number" value={form.order_index || ''} onChange={e => set('order_index', e.target.value)} placeholder="e.g. 1 or 2" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Instagram URL *</label>
        <input className="input-field" value={form.instagram_link} onChange={e => set('instagram_link', e.target.value)} placeholder="e.g. https://instagram.com/reel/..." />
      </div>
      <div>
        <label style={labelStyle}>Reel Thumbnail Photo</label>
        {form.photo_url ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={form.photo_url} alt="Thumbnail" style={{ width: 100, height: 60, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)' }} />
            <button className="btn btn-ghost" onClick={() => set('photo_url', '')} style={{ color: '#ff5252' }}>Remove</button>
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
                  try { data = JSON.parse(text) } catch(e) { throw new Error(`Server Error`) }
                  if (data.url) set('photo_url', data.url)
                  else throw new Error(data.error || 'Upload failed')
                } catch(err) {
                  setError(err.message || 'Failed to upload image')
                } finally {
                  setSaving(false)
                }
              }
            }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Select a thumbnail image to upload securely</div>
          </div>
        )}
      </div>
      {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : initial ? 'Update Reel' : 'Add Reel'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin Panel ────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('celebrities')
  const [celebrities, setCelebrities] = useState([])
  const [posts, setPosts] = useState([])
  const [news, setNews] = useState([])

  const [mostFollowed, setMostFollowed] = useState([])
  const [showMostFollowedForm, setShowMostFollowedForm] = useState(false)
  const [editingMostFollowed, setEditingMostFollowed] = useState(null)

  const [viralReels, setViralReels] = useState([])
  const [showViralReelsForm, setShowViralReelsForm] = useState(false)
  const [editingViralReels, setEditingViralReels] = useState(null)

  const [liveDate, setLiveDate] = useState('')
  const [savingLiveDate, setSavingLiveDate] = useState(false)

  const [loadingData, setLoadingData] = useState(false)
  const [showCelForm, setShowCelForm] = useState(false)
  const [editingCel, setEditingCel] = useState(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [filterCelId, setFilterCelId] = useState('')
  const [toast, setToast] = useState('')

  const [searchCel, setSearchCel] = useState('')
  const [searchPost, setSearchPost] = useState('')
  const [searchNews, setSearchNews] = useState('')
  const [searchMostFollowed, setSearchMostFollowed] = useState('')
  const [searchViralReels, setSearchViralReels] = useState('')

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
      // Load live date settings
      const dateRes = await adminFetch('/api/admin/live_settings')
      const dateData = await dateRes.json()
      setLiveDate(dateData.settings?.live_date || '')

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
      if (tab === 'news') {
        const newsRes = await adminFetch('/api/admin/news')
        const newsData = await newsRes.json()
        setNews(newsData.news || [])
      }
      if (tab === 'most_followed') {
        const res = await adminFetch('/api/admin/most_followed')
        const data = await res.json()
        setMostFollowed(data.profiles || [])
      }
      if (tab === 'viral_reels') {
        const res = await adminFetch('/api/admin/viral_reels')
        const data = await res.json()
        setViralReels(data.reels || [])
      }
    } catch {}
    setLoadingData(false)
  }

  const deleteMostFollowed = async (id) => {
    if (!confirm('Delete this profile from most followed?')) return
    await adminFetch('/api/admin/most_followed', { method: 'DELETE', body: { id } })
    setMostFollowed(p => p.filter(x => x.id !== id))
    showToast('✅ Profile deleted')
  }

  const deleteViralReel = async (id) => {
    if (!confirm('Delete this viral reel?')) return
    await adminFetch('/api/admin/viral_reels', { method: 'DELETE', body: { id } })
    setViralReels(r => r.filter(x => x.id !== id))
    showToast('✅ Reel deleted')
  }

  const saveLiveDate = async () => {
    setSavingLiveDate(true)
    try {
      const res = await adminFetch('/api/admin/live_settings', {
        method: 'PUT',
        body: { live_date: liveDate }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showToast('✅ Live date updated!')
    } catch(e) {
      alert('Error: ' + e.message)
    } finally {
      setSavingLiveDate(false)
    }
  }

  const handleAutoOrder = async () => {
    if (!confirm('Reorder all profiles by followers count descending? This will update their rank indexes.')) return
    setLoadingData(true)
    try {
      const res = await adminFetch('/api/admin/most_followed', {
        method: 'PUT',
        body: { action: 'reorder' }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMostFollowed(data.profiles || [])
      showToast('✅ Profiles ordered by followers!')
    } catch(e) {
      alert('Error: ' + e.message)
    } finally {
      setLoadingData(false)
    }
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

  const deleteNews = async (id) => {
    if (!confirm('Delete this news?')) return
    await adminFetch('/api/admin/news', { method: 'DELETE', body: { id } })
    setNews(n => n.filter(x => x.id !== id))
    showToast('✅ News deleted')
  }

  const formatCount = (n) => {
    if (!n) return '—'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  const getOrdinal = (n) => {
    if (!n) return ''
    const s = ["th", "st", "nd", "rd"]
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
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
              {(((JSON.stringify(celebrities).length + JSON.stringify(posts).length + JSON.stringify(mostFollowed).length + JSON.stringify(viralReels).length) / 1024 / 1024) || 0).toFixed(2)} MB / 500 MB
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--gradient)', 
              width: `${Math.min(100, Math.max(0.5, ((JSON.stringify(celebrities).length + JSON.stringify(posts).length + JSON.stringify(mostFollowed).length + JSON.stringify(viralReels).length) / 1024 / 1024) / 500 * 100))}%` 
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Rows tracked: {celebrities.length} celebrities, {posts.length} posts, {mostFollowed.length} most followed, {viralReels.length} viral reels
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--surface)', borderRadius: 10, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            { id: 'celebrities', label: '👤 Celebrities' },
            { id: 'posts', label: '🎬 Posts & Reels' },
            { id: 'news', label: '📰 InstaNews' },
            { id: 'most_followed', label: '📊 Most Followed' },
            { id: 'viral_reels', label: '🔥 Viral Reels Today' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                setShowCelForm(false)
                setShowPostForm(false)
                setEditingCel(null)
                setEditingPost(null)
                setShowNewsForm(false)
                setEditingNews(null)
                setShowMostFollowedForm(false)
                setEditingMostFollowed(null)
                setShowViralReelsForm(false)
                setEditingViralReels(null)
              }}
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
              <AdminModal
                isOpen={showCelForm || !!editingCel}
                onClose={() => { setShowCelForm(false); setEditingCel(null); }}
                title={editingCel ? '✏️ Edit Celebrity' : '➕ Add New Celebrity'}
              >
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
              </AdminModal>
            )}

            {/* Leaderboard widget for requested profiles */}
            {(() => {
              const requestedCels = celebrities
                .filter(c => !c.has_full_details && (c.request_count || 0) > 0)
                .sort((a, b) => (b.request_count || 0) - (a.request_count || 0))
              
              if (requestedCels.length === 0) return null

              const totalRequests = celebrities.reduce((sum, c) => sum + (c.request_count || 0), 0)

              return (
                <div className="card" style={{
                  background: 'rgba(255, 152, 0, 0.05)',
                  border: '1px solid rgba(255, 152, 0, 0.15)',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ff9800', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      🔥 Most Requested Additions ({totalRequests} total requests)
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {requestedCels.slice(0, 5).map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {c.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(@{c.instagram_handle || '—'})</span>
                        </span>
                        <span style={{
                          background: '#ff9800',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          {c.request_count} requests
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchCel}
                onChange={e => setSearchCel(e.target.value)}
                placeholder="🔍 Search celebrities by name or handle..."
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  // Explicit trigger or visual indicator, search matches instantly on state update
                }}
                style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Search
              </button>
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(() => {
                  const filtered = celebrities.filter(c => 
                    c.name?.toLowerCase().includes(searchCel.toLowerCase()) ||
                    c.instagram_handle?.toLowerCase().includes(searchCel.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {celebrities.length === 0 ? "No celebrities yet. Add your first one! 👆" : "No matching celebrities found."}
                      </div>
                    )
                  }
                  return filtered.map(cel => (
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
                          {cel.has_full_details ? (
                            <span style={{ marginLeft: 8, color: '#4caf50', fontWeight: 600 }}>✓ Full Details</span>
                          ) : (
                            <span style={{ marginLeft: 8, color: '#ff9800', fontWeight: 600 }}>⚠️ Partial ({cel.request_count || 0} requests)</span>
                          )}
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
                  ))
                })()}
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
              <AdminModal
                isOpen={showPostForm || !!editingPost}
                onClose={() => { setShowPostForm(false); setEditingPost(null); }}
                title={editingPost ? '✏️ Edit Post' : '➕ Add New Post'}
              >
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
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchPost}
                onChange={e => setSearchPost(e.target.value)}
                placeholder="🔍 Search posts by celebrity, caption, playlist, or tags..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = posts.filter(post => {
                    const cel = celebrities.find(c => c.id === post.celebrity_id)
                    const celName = cel ? cel.name : ''
                    return (
                      post.caption?.toLowerCase().includes(searchPost.toLowerCase()) ||
                      post.tags?.some(t => t.toLowerCase().includes(searchPost.toLowerCase())) ||
                      post.playlist_name?.toLowerCase().includes(searchPost.toLowerCase()) ||
                      celName.toLowerCase().includes(searchPost.toLowerCase())
                    )
                  })
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {posts.length === 0 ? "No posts yet. Add your first one! 👆" : "No matching posts found."}
                      </div>
                    )
                  }
                  return filtered.map(post => {
                    const cel = celebrities.find(c => c.id === post.celebrity_id)
                    return (
                      <div key={post.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface)', padding: 16 }}>
                        {cel && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Celebrity:</span>
                            <strong style={{ fontSize: 13, color: 'var(--text)' }}>{cel.name}</strong>
                          </div>
                        )}
                        
                        <PostCard post={post} />

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => { setEditingPost(post); setShowPostForm(false) }}>
                            ✏️ Edit Post
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            style={{
                              background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                              color: '#ff5252', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            🗑 Delete Post
                          </button>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── NEWS TAB ────────────────────────────────────────────────────── */}
        {tab === 'news' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                InstaNews ({news.length})
              </h2>
              {!showNewsForm && !editingNews && (
                <button className="btn btn-primary" onClick={() => setShowNewsForm(true)}>
                  + Add News
                </button>
              )}
            </div>

            {(showNewsForm || editingNews) && (
              <AdminModal
                isOpen={showNewsForm || !!editingNews}
                onClose={() => { setShowNewsForm(false); setEditingNews(null); }}
                title={editingNews ? '✏️ Edit News' : '➕ Add InstaNews'}
              >
                <NewsForm
                  initial={editingNews}
                  onSave={(item) => {
                    if (editingNews) {
                      setNews(n => n.map(x => x.id === item.id ? item : x))
                    } else {
                      setNews(n => [item, ...n])
                    }
                    setShowNewsForm(false)
                    setEditingNews(null)
                    showToast('✅ News saved!')
                  }}
                  onCancel={() => { setShowNewsForm(false); setEditingNews(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchNews}
                onChange={e => setSearchNews(e.target.value)}
                placeholder="🔍 Search news by title or content..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = news.filter(item => 
                    item.title?.toLowerCase().includes(searchNews.toLowerCase()) ||
                    item.content?.toLowerCase().includes(searchNews.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {news.length === 0 ? "No news yet. Add your first one! 👆" : "No matching news found."}
                      </div>
                    )
                  }
                  return filtered.map(item => (
                    <div key={item.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)' }} />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📰</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          <span style={{ color: '#00e5ff', fontWeight: 600 }}>👁 {item.views || 0} views</span> &nbsp;·&nbsp; {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <a href={`/instanews/${item.slug}`} target="_blank">
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>View</button>
                        </a>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => { setEditingNews(item); setShowNewsForm(false) }}>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteNews(item.id)}
                          style={{
                            background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                            color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE DATE CARD (Only visible in Live-related tabs) ────────── */}
        {(tab === 'most_followed' || tab === 'viral_reels') && (
          <div className="card" style={{ marginBottom: 28, padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
              📅 Live Page Manual Date
            </h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                className="input-field"
                value={liveDate}
                onChange={e => setLiveDate(e.target.value)}
                placeholder="e.g. 22 May 2026 or Friday, 22-05-2026"
                style={{ maxWidth: 350 }}
              />
              <button className="btn btn-primary" onClick={saveLiveDate} disabled={savingLiveDate}>
                {savingLiveDate ? 'Saving...' : 'Save Date'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              This date will display on the top-right corner of the /live page.
            </div>
          </div>
        )}

        {/* ── MOST FOLLOWED TAB ─────────────────────────────────────────── */}
        {tab === 'most_followed' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Most Followed Profiles ({mostFollowed.length})
              </h2>
              <div style={{ display: 'flex', gap: 10 }}>
                {!showMostFollowedForm && !editingMostFollowed && (
                  <button className="btn btn-primary" onClick={() => setShowMostFollowedForm(true)}>
                    + Add Profile
                  </button>
                )}
              </div>
            </div>

            {(showMostFollowedForm || editingMostFollowed) && (
              <AdminModal
                isOpen={showMostFollowedForm || !!editingMostFollowed}
                onClose={() => { setShowMostFollowedForm(false); setEditingMostFollowed(null); }}
                title={editingMostFollowed ? '✏️ Edit Profile' : '➕ Add Most Followed Profile'}
              >
                <MostFollowedForm
                  profiles={mostFollowed}
                  initial={editingMostFollowed}
                  onSave={(profile) => {
                    if (editingMostFollowed) {
                      setMostFollowed(p => p.map(x => x.id === profile.id ? profile : x))
                    } else {
                      setMostFollowed(p => [...p, profile])
                    }
                    setShowMostFollowedForm(false)
                    setEditingMostFollowed(null)
                    showToast('✅ Profile saved!')
                  }}
                  onCancel={() => { setShowMostFollowedForm(false); setEditingMostFollowed(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchMostFollowed}
                onChange={e => setSearchMostFollowed(e.target.value)}
                placeholder="🔍 Search profiles by name or category..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostFollowed.filter(profile => 
                    profile.name?.toLowerCase().includes(searchMostFollowed.toLowerCase()) ||
                    profile.category?.toLowerCase().includes(searchMostFollowed.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {mostFollowed.length === 0 ? "No profiles added yet. Click \"+ Add Profile\" to begin!" : "No matching profiles found."}
                      </div>
                    )
                  }
                  return filtered.map((profile, index) => (
                    <div key={profile.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', width: 24 }}>
                        #{index + 1}
                      </div>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 18, flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {profile.photo_url ? (
                          <img src={profile.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          profile.name?.charAt(0)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{profile.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Category: <strong style={{ color: 'var(--text)' }}>{(() => {
                            if (!profile.category) return 'None';
                            if (profile.category.includes(':')) {
                              const parts = profile.category.split(':');
                              return `${parts[1]} (${parts[0]})`;
                            }
                            return profile.category;
                          })()}</strong> &nbsp;·&nbsp; Followers: <strong style={{ color: 'var(--text)' }}>{profile.followers_text?.trim() ? profile.followers_text : (profile.followers_count >= 1000000 ? `${(profile.followers_count / 1000000).toFixed(1).replace(/\.0$/, '')}M` : profile.followers_count?.toLocaleString() || '—')}</strong> &nbsp;·&nbsp; Numeric: {profile.followers_count?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => { setEditingMostFollowed({ ...profile, followers_count: profile.followers_count?.toString(), order_index: profile.order_index?.toString(), category: profile.category || '' }); setShowMostFollowedForm(false) }}>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMostFollowed(profile.id)}
                          style={{
                            background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                            color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── VIRAL REELS TAB ───────────────────────────────────────────── */}
        {tab === 'viral_reels' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Viral Reels Today ({viralReels.length})
              </h2>
              {!showViralReelsForm && !editingViralReels && (
                <button className="btn btn-primary" onClick={() => setShowViralReelsForm(true)}>
                  + Add Reel
                </button>
              )}
            </div>

            {(showViralReelsForm || editingViralReels) && (
              <AdminModal
                isOpen={showViralReelsForm || !!editingViralReels}
                onClose={() => { setShowViralReelsForm(false); setEditingViralReels(null); }}
                title={editingViralReels ? '✏️ Edit Viral Reel' : '➕ Add New Viral Reel'}
              >
                <ViralReelsForm
                  initial={editingViralReels}
                  onSave={(reel) => {
                    if (editingViralReels) {
                      setViralReels(r => r.map(x => x.id === reel.id ? reel : x))
                    } else {
                      setViralReels(r => [reel, ...r])
                    }
                    setShowViralReelsForm(false)
                    setEditingViralReels(null)
                    showToast('✅ Viral reel saved!')
                  }}
                  onCancel={() => { setShowViralReelsForm(false); setEditingViralReels(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchViralReels}
                onChange={e => setSearchViralReels(e.target.value)}
                placeholder="🔍 Search reels by title or creator name..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = viralReels.filter(reel => 
                    reel.title?.toLowerCase().includes(searchViralReels.toLowerCase()) ||
                    reel.creator_name?.toLowerCase().includes(searchViralReels.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {viralReels.length === 0 ? "No viral reels added yet. Click \"+ Add Reel\" to begin!" : "No matching viral reels found."}
                      </div>
                    )
                  }
                  return filtered.map((reel, index) => (
                    <div key={reel.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', width: 36, textAlign: 'center' }}>
                        {getOrdinal(index + 1)}
                      </div>
                      {reel.photo_url ? (
                        <img src={reel.photo_url} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)' }} />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎬</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{reel.title}</div>
                        {reel.creator_name && (
                          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
                            {reel.creator_name}
                          </div>
                        )}
                        <a href={reel.instagram_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all' }}>
                          {reel.instagram_link}
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => { setEditingViralReels({ ...reel, order_index: reel.order_index?.toString(), creator_name: reel.creator_name || '' }); setShowViralReelsForm(false) }}>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteViralReel(reel.id)}
                          style={{
                            background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                            color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
