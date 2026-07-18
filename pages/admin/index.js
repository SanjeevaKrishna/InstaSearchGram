import { useState, useEffect } from 'react'
import Head from 'next/head'
import PostCard from '../../components/PostCard'
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react'

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
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        order_index: initial.order_index !== undefined && initial.order_index !== null ? initial.order_index.toString() : '0',
        total_reel_views: initial.total_reel_views !== undefined && initial.total_reel_views !== null ? initial.total_reel_views.toString() : '',
        total_reel_likes: initial.total_reel_likes !== undefined && initial.total_reel_likes !== null ? initial.total_reel_likes.toString() : '',
        total_post_likes: initial.total_post_likes !== undefined && initial.total_post_likes !== null ? initial.total_post_likes.toString() : '',
        total_comments: initial.total_comments !== undefined && initial.total_comments !== null ? initial.total_comments.toString() : '',
        total_shares: initial.total_shares !== undefined && initial.total_shares !== null ? initial.total_shares.toString() : '',
        total_reposts: initial.total_reposts !== undefined && initial.total_reposts !== null ? initial.total_reposts.toString() : '',
        average_views: initial.average_views !== undefined && initial.average_views !== null ? initial.average_views.toString() : '',
        average_reel_likes: initial.average_reel_likes !== undefined && initial.average_reel_likes !== null ? initial.average_reel_likes.toString() : '',
        average_post_likes: initial.average_post_likes !== undefined && initial.average_post_likes !== null ? initial.average_post_likes.toString() : '',
        followers_interaction: initial.followers_interaction !== undefined && initial.followers_interaction !== null ? initial.followers_interaction.toString() : '',
        most_likes: initial.most_likes !== undefined && initial.most_likes !== null ? initial.most_likes.toString() : '',
        account_created_year: initial.account_created_year !== undefined && initial.account_created_year !== null ? initial.account_created_year.toString() : '',
        hide_search: !!initial.hide_search,
        description: initial.description || ''
      }
    }
    return {
      name: '', instagram_handle: '', followers_count: '', posts_count: '', photo_url: '', is_featured: false,
      has_full_details: false, order_index: '0',
      total_reel_views: '', total_reel_likes: '', total_post_likes: '',
      total_comments: '', total_shares: '', total_reposts: '', hide_search: false,
      average_views: '', average_reel_likes: '', average_post_likes: '', followers_interaction: '',
      most_likes: '',
      account_created_year: '',
      description: ''
    }
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
          order_index: form.order_index ? Number(form.order_index) : 0,
          total_reel_views: form.total_reel_views ? Number(form.total_reel_views) : 0,
          total_reel_likes: form.total_reel_likes ? Number(form.total_reel_likes) : 0,
          total_post_likes: form.total_post_likes ? Number(form.total_post_likes) : 0,
          total_comments: form.total_comments ? Number(form.total_comments) : 0,
          total_shares: form.total_shares ? Number(form.total_shares) : 0,
          total_reposts: form.total_reposts ? Number(form.total_reposts) : 0,
          average_views: form.average_views ? Number(form.average_views) : 0,
          average_reel_likes: form.average_reel_likes ? Number(form.average_reel_likes) : 0,
          average_post_likes: form.average_post_likes ? Number(form.average_post_likes) : 0,
          followers_interaction: form.followers_interaction ? Number(form.followers_interaction) : 0,
          most_likes: form.most_likes ? Number(form.most_likes) : 0,
          account_created_year: form.account_created_year ? Number(form.account_created_year) : null,
          hide_search: !!form.hide_search,
          description: form.description || ''
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Followers Count (number)</label>
          <input className="input-field" type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="e.g. 17000000" />
        </div>
        <div>
          <label style={labelStyle}>Total Posts on Instagram</label>
          <input className="input-field" type="number" value={form.posts_count} onChange={e => set('posts_count', e.target.value)} placeholder="e.g. 140" />
        </div>
        <div>
          <label style={labelStyle}>Account Created Year</label>
          <input className="input-field" type="number" value={form.account_created_year} onChange={e => set('account_created_year', e.target.value)} placeholder="e.g. 2012" />
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
      <div>
        <label style={labelStyle}>Profile Description / Bio</label>
        <textarea 
          className="input-field" 
          value={form.description || ''} 
          onChange={e => set('description', e.target.value)} 
          placeholder="Enter description or bio about the celebrity..." 
          style={{ width: '100%', height: 80, padding: 12, borderRadius: 12, resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Total Reel Views</label>
          <input className="input-field" type="number" value={form.total_reel_views} onChange={e => set('total_reel_views', e.target.value)} placeholder="e.g. 5200000" />
        </div>
        <div>
          <label style={labelStyle}>Total Reel Likes</label>
          <input className="input-field" type="number" value={form.total_reel_likes} onChange={e => set('total_reel_likes', e.target.value)} placeholder="e.g. 150000" />
        </div>
        <div>
          <label style={labelStyle}>Total Post Likes</label>
          <input className="input-field" type="number" value={form.total_post_likes} onChange={e => set('total_post_likes', e.target.value)} placeholder="e.g. 80000" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Total Comments</label>
          <input className="input-field" type="number" value={form.total_comments} onChange={e => set('total_comments', e.target.value)} placeholder="e.g. 12000" />
        </div>
        <div>
          <label style={labelStyle}>Total Shares</label>
          <input className="input-field" type="number" value={form.total_shares} onChange={e => set('total_shares', e.target.value)} placeholder="e.g. 4500" />
        </div>
        <div>
          <label style={labelStyle}>Total Repost</label>
          <input className="input-field" type="number" value={form.total_reposts} onChange={e => set('total_reposts', e.target.value)} placeholder="e.g. 3500" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Average Views</label>
          <input className="input-field" type="number" value={form.average_views || ''} onChange={e => set('average_views', e.target.value)} placeholder="e.g. 1200000" />
        </div>
        <div>
          <label style={labelStyle}>Average Reel Likes</label>
          <input className="input-field" type="number" value={form.average_reel_likes || ''} onChange={e => set('average_reel_likes', e.target.value)} placeholder="e.g. 45000" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Average Post Likes</label>
          <input className="input-field" type="number" value={form.average_post_likes || ''} onChange={e => set('average_post_likes', e.target.value)} placeholder="e.g. 25000" />
        </div>
        <div>
          <label style={labelStyle}>Followers Interaction (%)</label>
          <input className="input-field" type="number" step="0.01" value={form.followers_interaction || ''} onChange={e => set('followers_interaction', e.target.value)} placeholder="e.g. 5.25" />
        </div>
        <div>
          <label style={labelStyle}>Most Likes</label>
          <input className="input-field" type="number" value={form.most_likes || ''} onChange={e => set('most_likes', e.target.value)} placeholder="e.g. 85000" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Homepage Display Order (Popular Section Order Index)</label>
        <input className="input-field" type="number" value={form.order_index} onChange={e => set('order_index', e.target.value)} placeholder="e.g. 1 for first, 2 for second (0 = default alphabetical)" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Lower numbers are displayed first. 0 is the default. If same, sorted alphabetically.</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="hide_search" checked={form.hide_search || false} onChange={e => set('hide_search', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="hide_search" style={{ fontSize: 14, color: '#f44336', fontWeight: 600, cursor: 'pointer' }}>
            🔴 Temporary Disable Profile (Hide from search & website)
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
  const [form, setForm] = useState(() => {
    if (initial) return initial
    const lastId = typeof window !== 'undefined' ? localStorage.getItem('last_selected_celebrity_id') : ''
    const idExists = lastId && celebrities.some(c => c.id === lastId)
    return {
      celebrity_id: idExists ? lastId : '',
      post_url: '',
      post_type: 'reel',
      caption: '',
      post_date: '',
      tags: '',
      is_most_liked: false,
      is_most_commented: false,
      is_most_viewed: false,
      is_first_post: false,
      playlist_name: '',
      playlist_cover_url: ''
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [availablePlaylists, setAvailablePlaylists] = useState([])
  const [celSearch, setCelSearch] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSelectCelebrity = (id) => {
    set('celebrity_id', id)
    if (id) {
      localStorage.setItem('last_selected_celebrity_id', id)
    }
  }

  const filteredCelebrities = celebrities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(celSearch.toLowerCase())
    const isCurrentlySelected = c.id === form.celebrity_id
    return matchesSearch || isCurrentlySelected
  })

  useEffect(() => {
    if (!form.celebrity_id) {
      setAvailablePlaylists([])
      return
    }
    adminFetch(`/api/admin/playlists?celebrity_id=${form.celebrity_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.playlists) {
          setAvailablePlaylists(data.playlists)
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
          <input
            className="input-field"
            type="text"
            placeholder="🔍 Type to search celebrity..."
            value={celSearch}
            onChange={e => setCelSearch(e.target.value)}
            style={{ fontSize: 13, height: 38, padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }}
          />
        </div>
        <select
          className="input-field"
          value={form.celebrity_id}
          onChange={e => handleSelectCelebrity(e.target.value)}
        >
          <option value="">— Select Celebrity —</option>
          {filteredCelebrities.map(c => (
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
        <label style={labelStyle}>Playlist (optional)</label>
        <select
          className="input-field"
          value={form.playlist_name || ''}
          onChange={e => {
            const val = e.target.value
            if (!val) {
              set('playlist_name', '')
              set('playlist_cover_url', '')
            } else {
              const match = availablePlaylists.find(p => p.name === val)
              set('playlist_name', val)
              set('playlist_cover_url', match ? match.cover_url || '' : '')
            }
          }}
        >
          <option value="">— No Playlist —</option>
          {availablePlaylists.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>
      {form.playlist_name && (
        <div>
          <label style={labelStyle}>Playlist Cover Image</label>
          {form.playlist_cover_url ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={form.playlist_cover_url} alt="Cover" style={{ width: 100, height: 60, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)' }} />
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No cover image set for this playlist</div>
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
  const [form, setForm] = useState(initial ? {
    ...initial,
    published_date: initial.published_date || '',
    order_index: initial.order_index?.toString() || '0'
  } : { title: '', image_url: '', content: '', published_date: '', order_index: '0' })
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Published Date (Manual)</label>
          <input className="input-field" type="date" value={form.published_date} onChange={e => set('published_date', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>News Rank / Order (for sorting)</label>
          <input className="input-field" type="number" value={form.order_index} onChange={e => set('order_index', e.target.value)} placeholder="e.g. 1" />
        </div>
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
  const predefinedTabCategories = ['Creators', 'Influencers', 'Actors', 'Meme Pages', 'Personalities', 'Sports', 'Politicians', 'Handles', 'Singers']
  
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
    } else if (cat.includes('personality')) {
      tabCategory = 'Personalities';
    } else if (cat.includes('handle') || cat.includes('page')) {
      tabCategory = 'Handles';
    } else if (cat.includes('sport') || cat.includes('cricket')) {
      tabCategory = 'Sports';
    } else if (cat.includes('politician')) {
      tabCategory = 'Politicians';
    }

    return { tabCategory, describingTag };
  };

  const parseMultipleCategories = (rawCategoryString) => {
    if (!rawCategoryString) return [{ tabCategory: 'Creators', describingTag: '' }];
    const parts = rawCategoryString.split(',');
    return parts.map(part => {
      const subparts = part.split(':');
      if (subparts.length >= 2) {
        return {
          tabCategory: subparts[0].trim(),
          describingTag: subparts[1].trim()
        };
      }
      const singleParsed = parseCategoryAndTag(part);
      return {
        tabCategory: singleParsed.tabCategory,
        describingTag: singleParsed.describingTag
      };
    });
  };

  const parseMultipleLanguages = (rawLanguageString) => {
    if (!rawLanguageString) return [''];
    return rawLanguageString.split(',').map(l => l.trim()).filter(Boolean);
  };

  const [form, setForm] = useState(initial || {
    name: '', photo_url: '', followers_count: '', followers_text: '', order_index: '0', language: ''
  })
  
  const [selectedCategories, setSelectedCategories] = useState(() => parseMultipleCategories(initial?.category))
  const [selectedLanguages, setSelectedLanguages] = useState(() => parseMultipleLanguages(initial?.language))
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
          updated.language = match.language || ''
          
          const parsedCats = parseMultipleCategories(match.category)
          setSelectedCategories(parsedCats)
          const parsedLangs = parseMultipleLanguages(match.language)
          setSelectedLanguages(parsedLangs)
        } else {
          if (updated.id) {
            delete updated.id
            updated.photo_url = ''
            updated.followers_count = ''
            updated.followers_text = ''
            updated.order_index = '0'
            updated.language = ''
            setNotice('')
            setSelectedCategories([{ tabCategory: 'Creators', describingTag: '' }])
            setSelectedLanguages([''])
          }
        }
      }
      return updated
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Name is required')
    
    // Validate categories
    if (selectedCategories.length === 0) return setError('At least one category is required')
    for (let i = 0; i < selectedCategories.length; i++) {
      if (!selectedCategories[i].describingTag.trim()) {
        return setError(`Description tag is required for category #${i + 1}`)
      }
    }

    const combinedCategory = selectedCategories
      .map(c => `${c.tabCategory}:${c.describingTag.trim()}`)
      .join(', ')

    // Filter duplicates and empty strings from languages
    const uniqueLangs = Array.from(new Set(selectedLanguages.map(l => l.trim()).filter(Boolean)))
    const combinedLanguage = uniqueLangs.join(', ') || null

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
          category: combinedCategory,
          language: combinedLanguage
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
      {error && <div style={{ color: '#ff5252', fontSize: 13, fontWeight: 600 }}>{error}</div>}
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

      <div style={{ display: 'grid', gap: 12, border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface2)' }}>
        <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 700 }}>Categories & Tags</label>
        {selectedCategories.map((cat, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {idx === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Category Tab</label>}
              <select
                className="input-field"
                value={cat.tabCategory}
                onChange={e => {
                  const updated = [...selectedCategories]
                  updated[idx].tabCategory = e.target.value
                  setSelectedCategories(updated)
                }}
              >
                {predefinedTabCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1.5 }}>
              {idx === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Description Tag</label>}
              <input
                className="input-field"
                value={cat.describingTag}
                onChange={e => {
                  const updated = [...selectedCategories]
                  updated[idx].describingTag = e.target.value
                  setSelectedCategories(updated)
                }}
                placeholder="e.g. Actor, Singer, Cricketer"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: idx === 0 ? 18 : 0 }}>
              <button
                className="btn"
                style={{
                  background: 'rgba(255,82,82,0.1)',
                  border: '1px solid rgba(255,82,82,0.2)',
                  color: '#ff5252',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (selectedCategories.length > 1) {
                    setSelectedCategories(selectedCategories.filter((_, i) => i !== idx))
                  } else {
                    const updated = [...selectedCategories]
                    updated[0].describingTag = ''
                    setSelectedCategories(updated)
                  }
                }}
                title="Remove Category"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, color: 'var(--accent)', padding: '6px 12px', alignSelf: 'flex-start', border: '1px dashed var(--accent)', borderRadius: 8 }}
          onClick={() => setSelectedCategories([...selectedCategories, { tabCategory: 'Creators', describingTag: '' }])}
        >
          ➕ Add Another Category
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface2)' }}>
        <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 700 }}>Languages</label>
        {selectedLanguages.map((lang, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {idx === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Language</label>}
              <select
                className="input-field"
                value={lang}
                onChange={e => {
                  const updated = [...selectedLanguages]
                  updated[idx] = e.target.value
                  setSelectedLanguages(updated)
                }}
              >
                <option value="">None (English/Global)</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: idx === 0 ? 18 : 0 }}>
              <button
                className="btn"
                style={{
                  background: 'rgba(255,82,82,0.1)',
                  border: '1px solid rgba(255,82,82,0.2)',
                  color: '#ff5252',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (selectedLanguages.length > 1) {
                    setSelectedLanguages(selectedLanguages.filter((_, i) => i !== idx))
                  } else {
                    const updated = [...selectedLanguages]
                    updated[0] = ''
                    setSelectedLanguages(updated)
                  }
                }}
                title="Remove Language"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, color: 'var(--accent)', padding: '6px 12px', alignSelf: 'flex-start', border: '1px dashed var(--accent)', borderRadius: 8 }}
          onClick={() => setSelectedLanguages([...selectedLanguages, ''])}
        >
          ➕ Add Another Language
        </button>
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

function ViralReelsForm({ initial, onSave, onCancel, apiEndpoint = '/api/admin/viral_reels' }) {
  const isMostViewed = apiEndpoint.includes('most_viewed')
  const isMostLiked = apiEndpoint.includes('most_liked')

  const getInitialHoursAgo = (createdAt) => {
    if (!createdAt) return '0 hours ago'
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  const [form, setForm] = useState(() => {
    const initialDate = initial?.created_at 
      ? new Date(initial.created_at).toISOString().substring(0, 10) 
      : new Date().toISOString().substring(0, 10)

    if (initial) {
      return {
        ...initial,
        order_index: initial.order_index !== undefined && initial.order_index !== null ? initial.order_index.toString() : '0',
        followers_text: initial.followers_text || '',
        views_text: initial.views_text || initial.likes_text || '',
        hours_ago: getInitialHoursAgo(initial.created_at),
        uploaded_date: initialDate
      }
    }
    return {
      title: '',
      photo_url: '',
      instagram_link: '',
      order_index: '0',
      creator_name: '',
      creator_photo_url: '',
      followers_text: '',
      views_text: '',
      hours_ago: '0 hours ago',
      uploaded_date: initialDate
    }
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
      const calculatedCreatedAt = isMostViewed || isMostLiked
        ? new Date(form.uploaded_date + 'T12:00:00').toISOString() 
        : (() => {
            const match = (form.hours_ago || '').match(/\d+/)
            const hours = match ? parseInt(match[0], 10) : 0
            return new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString()
          })()

      const res = await adminFetch(apiEndpoint, {
        method: initial ? 'PUT' : 'POST',
        body: {
          ...form,
          id: initial?.id,
          order_index: form.order_index ? Number(form.order_index) : 0,
          creator_name: form.creator_name || '',
          creator_photo_url: form.creator_photo_url || '',
          followers_text: form.followers_text || '',
          ...(isMostLiked ? { likes_text: form.views_text || '' } : { views_text: form.views_text || '' }),
          created_at: calculatedCreatedAt
        },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.reel || data.post)
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
        <label style={labelStyle}>Creator Profile Photo</label>
        {form.creator_photo_url ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={form.creator_photo_url} alt="Creator avatar" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface2)' }} />
            <button className="btn btn-ghost" onClick={() => set('creator_photo_url', '')} style={{ color: '#ff5252' }}>Remove</button>
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
                  if (data.url) set('creator_photo_url', data.url)
                  else throw new Error(data.error || 'Upload failed')
                } catch(err) {
                  setError(err.message || 'Failed to upload creator image')
                } finally {
                  setSaving(false)
                }
              }
            }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Select a circular avatar image to upload securely</div>
          </div>
        )}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Followers Count (e.g. 270M, 10k, 5 Crore)</label>
          <input className="input-field" value={form.followers_text || ''} onChange={e => set('followers_text', e.target.value)} placeholder="e.g. 270M" />
        </div>
        <div>
          <label style={labelStyle}>{isMostLiked ? 'Likes Count (e.g. 1.2M, 500k)' : 'Views Count (e.g. 1.2M, 500k)'}</label>
          <input className="input-field" value={form.views_text || ''} onChange={e => set('views_text', e.target.value)} placeholder={isMostLiked ? "e.g. 50k" : "e.g. 1.2M"} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          {isMostViewed || isMostLiked ? (
            <>
              <label style={labelStyle}>Uploaded Date</label>
              <input className="input-field" type="date" value={form.uploaded_date} onChange={e => set('uploaded_date', e.target.value)} />
            </>
          ) : (
            <>
              <label style={labelStyle}>Time Added (e.g. 1 hour ago, 5 hours ago)</label>
              <input className="input-field" value={form.hours_ago || ''} onChange={e => set('hours_ago', e.target.value)} placeholder="e.g. 5 hours ago" />
            </>
          )}
        </div>
      </div>

      {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : initial ? (isMostLiked ? 'Update Post' : 'Update Reel') : (isMostLiked ? 'Add Post' : 'Add Reel')}
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
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [reorderMode, setReorderMode] = useState(false)

  const [mostViewedReels, setMostViewedReels] = useState([])
  const [showMostViewedReelsForm, setShowMostViewedReelsForm] = useState(false)
  const [editingMostViewedReels, setEditingMostViewedReels] = useState(null)

  const [mostLikedReels, setMostLikedReels] = useState([])
  const [showMostLikedReelsForm, setShowMostLikedReelsForm] = useState(false)
  const [editingMostLikedReels, setEditingMostLikedReels] = useState(null)

  const [mostLikedPosts, setMostLikedPosts] = useState([])
  const [showMostLikedPostsForm, setShowMostLikedPostsForm] = useState(false)
  const [editingMostLikedPosts, setEditingMostLikedPosts] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
    setDraggedIndex(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const isMostViewed = tab === 'most_viewed_reels'
    const isMostLiked = tab === 'most_liked_posts'
    const isMostLikedReels = tab === 'most_liked_reels'
    const targetList = isMostViewed ? mostViewedReels : (isMostLiked ? mostLikedPosts : (isMostLikedReels ? mostLikedReels : viralReels))
    const setList = isMostViewed ? setMostViewedReels : (isMostLiked ? setMostLikedPosts : (isMostLikedReels ? setMostLikedReels : setViralReels))
    const dbTable = isMostViewed ? 'most_viewed_reels' : (isMostLiked ? 'most_liked_posts' : (isMostLikedReels ? 'most_liked_reels' : 'viral_reels'))

    const newReels = [...targetList]
    const [draggedItem] = newReels.splice(draggedIndex, 1)
    newReels.splice(dropIndex, 0, draggedItem)

    const reordered = newReels.map((reel, idx) => ({
      ...reel,
      order_index: idx + 1
    }))

    setList(reordered)

    try {
      const orders = reordered.map(r => ({ id: r.id, order_index: r.order_index }))
      await adminFetch('/api/admin/reorder_reels', {
        method: 'POST',
        body: { orders, table: dbTable }
      })
      showToast('✅ Ranking order updated!')
    } catch (err) {
      alert('Failed to save order: ' + err.message)
      loadData()
    }
  }

  const moveReel = async (index, direction) => {
    const isMostViewed = tab === 'most_viewed_reels'
    const isMostLiked = tab === 'most_liked_posts'
    const isMostLikedReels = tab === 'most_liked_reels'
    const targetList = isMostViewed ? mostViewedReels : (isMostLiked ? mostLikedPosts : (isMostLikedReels ? mostLikedReels : viralReels))
    const setList = isMostViewed ? setMostViewedReels : (isMostLiked ? setMostLikedPosts : (isMostLikedReels ? setMostLikedReels : setViralReels))
    const dbTable = isMostViewed ? 'most_viewed_reels' : (isMostLiked ? 'most_liked_posts' : (isMostLikedReels ? 'most_liked_reels' : 'viral_reels'))

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= targetList.length) return

    const newReels = [...targetList]
    const temp = newReels[index]
    newReels[index] = newReels[newIndex]
    newReels[newIndex] = temp

    const reordered = newReels.map((reel, idx) => ({
      ...reel,
      order_index: idx + 1
    }))

    setList(reordered)

    try {
      const orders = reordered.map(r => ({ id: r.id, order_index: r.order_index }))
      await adminFetch('/api/admin/reorder_reels', {
        method: 'POST',
        body: { orders, table: dbTable }
      })
      showToast('✅ Ranking order updated!')
    } catch (err) {
      alert('Failed to save order: ' + err.message)
      loadData()
    }
  }

  const [visits, setVisits] = useState([])

  const [chatBackgrounds, setChatBackgrounds] = useState({})
  const [uploadingBgRoom, setUploadingBgRoom] = useState(null)

  const [liveDate, setLiveDate] = useState('')
  const [trendingEnabled, setTrendingEnabled] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
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
  const [searchMostViewedReels, setSearchMostViewedReels] = useState('')
  const [searchMostLikedReels, setSearchMostLikedReels] = useState('')
  const [searchMostLikedPosts, setSearchMostLikedPosts] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveChatBackground = async (room, imageUrl) => {
    try {
      const res = await adminFetch('/api/chat_backgrounds', {
        method: 'POST',
        body: { room, image_url: imageUrl }
      })
      if (res.ok) {
        setChatBackgrounds(prev => ({ ...prev, [room]: imageUrl }))
        showToast(`✅ Wallpaper for ${room} room saved!`)
      } else {
        const err = await res.json()
        alert('Failed to save background: ' + (err.error || res.statusText))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteChatBackground = async (room) => {
    if (!confirm(`Delete wallpaper for ${room}?`)) return
    try {
      const res = await adminFetch('/api/chat_backgrounds', {
        method: 'DELETE',
        body: { room }
      })
      if (res.ok) {
        setChatBackgrounds(prev => {
          const updated = { ...prev }
          delete updated[room]
          return updated
        })
        showToast(`✅ Wallpaper for ${room} room deleted!`)
      } else {
        const err = await res.json()
        alert('Failed to delete background: ' + (err.error || res.statusText))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const [playlists, setPlaylists] = useState([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [showPlaylistForm, setShowPlaylistForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistCover, setNewPlaylistCover] = useState('')
  const [savingPlaylist, setSavingPlaylist] = useState(false)
  const [playlistError, setPlaylistError] = useState('')

  const loadPlaylists = async () => {
    if (!filterCelId) {
      setPlaylists([])
      return
    }
    setLoadingPlaylists(true)
    try {
      const res = await adminFetch(`/api/admin/playlists?celebrity_id=${filterCelId}`)
      const data = await res.json()
      setPlaylists(data.playlists || [])
    } catch (err) {
      console.error('Failed to load playlists', err)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  useEffect(() => {
    if (tab === 'posts' && authed) {
      loadPlaylists()
    }
  }, [filterCelId, tab, authed])

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return setPlaylistError('Playlist name is required')
    setSavingPlaylist(true)
    setPlaylistError('')
    try {
      const res = await adminFetch('/api/admin/playlists', {
        method: 'POST',
        body: {
          celebrity_id: filterCelId,
          name: newPlaylistName.trim(),
          cover_url: newPlaylistCover
        }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setPlaylists(prev => [...prev, data.playlist])
      setNewPlaylistName('')
      setNewPlaylistCover('')
      setShowPlaylistForm(false)
      showToast('✅ Playlist created!')
    } catch (e) {
      setPlaylistError(e.message)
    } finally {
      setSavingPlaylist(false)
    }
  }

  const handleDeletePlaylist = async (id) => {
    if (!confirm('Are you sure you want to delete this playlist? Posts in this playlist will NOT be deleted, but they will be removed from this playlist.')) return
    try {
      const res = await adminFetch('/api/admin/playlists', {
        method: 'DELETE',
        body: { id }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setPlaylists(prev => prev.filter(p => p.id !== id))
      loadData()
      showToast('🗑️ Playlist deleted!')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleRemovePostFromPlaylist = async (post) => {
    if (!confirm(`Remove this post from "${post.playlist_name}"?`)) return
    try {
      const res = await adminFetch('/api/admin/posts', {
        method: 'PUT',
        body: {
          ...post,
          tags: post.tags || [],
          playlist_name: null,
          playlist_cover_url: null
        }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setPosts(prev => prev.map(p => p.id === post.id ? data.post : p))
      showToast('✅ Removed post from playlist!')
    } catch (e) {
      alert(e.message)
    }
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
      setTrendingEnabled(dateData.settings?.trending_enabled !== undefined ? dateData.settings.trending_enabled : true)

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
      if (tab === 'most_followed') {
        const res = await adminFetch('/api/admin/most_followed')
        const data = await res.json()
        setMostFollowed(data.profiles || [])
      }
      if (tab === 'voting_management') {
        const res = await adminFetch('/api/admin/most_followed')
        const data = await res.json()
        setMostFollowed(data.profiles || [])
      }
      if (tab === 'visitors') {
        const res = await adminFetch('/api/admin/visits')
        const data = await res.json()
        setVisits(data.visits || [])
      }
      if (tab === 'chat_backgrounds') {
        const res = await adminFetch('/api/chat_backgrounds')
        const data = await res.json()
        setChatBackgrounds(data.backgrounds || {})
      }
      if (tab === 'reels') {
        const res = await adminFetch('/api/admin/viral_reels')
        const data = await res.json()
        setViralReels(data.reels || [])
      }
      if (tab === 'most_viewed_reels') {
        const res = await adminFetch('/api/admin/most_viewed_reels')
        const data = await res.json()
        setMostViewedReels(data.reels || [])
      }
      if (tab === 'most_liked_posts') {
        const res = await adminFetch('/api/admin/most_liked_posts')
        const data = await res.json()
        setMostLikedPosts(data.posts || [])
      }
      if (tab === 'most_liked_reels') {
        const res = await adminFetch('/api/admin/most_liked_reels')
        const data = await res.json()
        setMostLikedReels(data.reels || [])
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

  const updateVotes = async (id, votesVal) => {
    try {
      const res = await adminFetch('/api/admin/most_followed', {
        method: 'PUT',
        body: { id, votes: Number(votesVal), action: 'set_votes' }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showToast('✅ Votes updated successfully!')
      
      // Reload most followed data to show refreshed ranks
      const loadRes = await adminFetch('/api/admin/most_followed')
      const loadData = await loadRes.json()
      setMostFollowed(loadData.profiles || [])
    } catch (err) {
      alert('Error updating votes: ' + err.message)
    }
  }

  const deleteViralReel = async (id) => {
    if (!confirm('Delete this viral reel?')) return
    await adminFetch('/api/admin/viral_reels', { method: 'DELETE', body: { id } })
    setViralReels(r => r.filter(x => x.id !== id))
    showToast('✅ Reel deleted')
  }

  const deleteMostViewedReel = async (id) => {
    if (!confirm('Delete this most viewed reel?')) return
    await adminFetch('/api/admin/most_viewed_reels', { method: 'DELETE', body: { id } })
    setMostViewedReels(r => r.filter(x => x.id !== id))
    showToast('✅ Reel deleted')
  }

  const deleteMostLikedPost = async (id) => {
    if (!confirm('Delete this most liked post?')) return
    await adminFetch('/api/admin/most_liked_posts', { method: 'DELETE', body: { id } })
    setMostLikedPosts(posts => posts.filter(x => x.id !== id))
    showToast('✅ Post deleted')
  }

  const deleteMostLikedReel = async (id) => {
    if (!confirm('Delete this most liked reel?')) return
    await adminFetch('/api/admin/most_liked_reels', { method: 'DELETE', body: { id } })
    setMostLikedReels(reels => reels.filter(x => x.id !== id))
    showToast('✅ Reel deleted')
  }

  const saveGlobalSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await adminFetch('/api/admin/live_settings', {
        method: 'PUT',
        body: { 
          live_date: liveDate,
          trending_enabled: trendingEnabled
        }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showToast('⚙️ Global settings updated!')
    } catch(e) {
      alert('Error: ' + e.message)
    } finally {
      setSavingSettings(false)
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

  const toggleHideSearch = async (cel) => {
    const newHideSearch = !cel.hide_search
    try {
      const res = await adminFetch('/api/admin/celebrities', {
        method: 'PUT',
        body: {
          ...cel,
          hide_search: newHideSearch,
          followers_count: cel.followers_count ? Number(cel.followers_count) : null,
          posts_count: cel.posts_count ? Number(cel.posts_count) : null,
          order_index: cel.order_index ? Number(cel.order_index) : 0,
          total_reel_views: cel.total_reel_views ? Number(cel.total_reel_views) : 0,
          total_reel_likes: cel.total_reel_likes ? Number(cel.total_reel_likes) : 0,
          total_post_likes: cel.total_post_likes ? Number(cel.total_post_likes) : 0,
          total_comments: cel.total_comments ? Number(cel.total_comments) : 0,
          total_shares: cel.total_shares ? Number(cel.total_shares) : 0,
          total_reposts: cel.total_reposts ? Number(cel.total_reposts) : 0,
          average_views: cel.average_views ? Number(cel.average_views) : 0,
          average_reel_likes: cel.average_reel_likes ? Number(cel.average_reel_likes) : 0,
          average_post_likes: cel.average_post_likes ? Number(cel.average_post_likes) : 0,
          followers_interaction: cel.followers_interaction ? Number(cel.followers_interaction) : 0,
        }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCelebrities(list => list.map(c => c.id === cel.id ? data.celebrity : c))
      showToast(newHideSearch ? '✅ Search disabled for ' + cel.name : '✅ Search enabled for ' + cel.name)
    } catch(e) {
      alert('Error updating: ' + e.message)
    }
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
    const num = Number(n)
    if (isNaN(num)) return n.toString()

    // Pre-round to 3 significant figures to handle rollovers (e.g. 999900 -> 1000000)
    const roundedNum = Number(num.toPrecision(3))

    const formatWithPrec = (value, suffix) => {
      let formatted = Number(value.toPrecision(3)).toString()
      return formatted + suffix
    }

    if (roundedNum >= 1e12) return formatWithPrec(roundedNum / 1e12, 'T')
    if (roundedNum >= 1e9) return formatWithPrec(roundedNum / 1e9, 'B')
    if (roundedNum >= 1e6) return formatWithPrec(roundedNum / 1e6, 'M')
    if (roundedNum >= 1000) return formatWithPrec(roundedNum / 1000, 'K')
    return roundedNum.toString()
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
        <title>Admin — Spialr</title>
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
              {(((JSON.stringify(celebrities).length + JSON.stringify(posts).length + JSON.stringify(mostFollowed).length) / 1024 / 1024) || 0).toFixed(2)} MB / 500 MB
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--gradient)', 
              width: `${Math.min(100, Math.max(0.5, ((JSON.stringify(celebrities).length + JSON.stringify(posts).length + JSON.stringify(mostFollowed).length) / 1024 / 1024) / 500 * 100))}%` 
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Rows tracked: {celebrities.length} celebrities, {posts.length} posts, {mostFollowed.length} most followed
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--surface)', borderRadius: 10, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            { id: 'celebrities', label: '👤 Celebrities' },
            { id: 'posts', label: '🎬 Posts & Reels' },
            { id: 'reels', label: '🔥 Trending Reels' },
            { id: 'most_viewed_reels', label: '👁️ Most Viewed Reels' },
            { id: 'most_liked_reels', label: '🎬 Most Liked Reels' },
            { id: 'most_liked_posts', label: '❤️ Most Liked Posts' },
            { id: 'most_followed', label: '📊 Most Followed' },
            { id: 'voting_management', label: '🏆 Voting Management' },
            { id: 'visitors', label: '👥 Visitors' },
            { id: 'chat_backgrounds', label: '💬 Chat Wallpaper' },
            { id: 'settings', label: '⚙️ Settings' },
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
                setShowMostViewedReelsForm(false)
                setEditingMostViewedReels(null)
                setShowMostLikedReelsForm(false)
                setEditingMostLikedReels(null)
                setShowMostLikedPostsForm(false)
                setEditingMostLikedPosts(null)
                setReorderMode(false)
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
                          {cel.hide_search && <span style={{ marginLeft: 8, color: '#f44336', fontWeight: 600 }}>🚫 Disabled</span>}
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
                          onClick={() => {
                            setEditingCel({
                              ...cel,
                              followers_count: cel.followers_count?.toString() || '',
                              posts_count: cel.posts_count?.toString() || '',
                              order_index: cel.order_index?.toString() || '0',
                              total_reel_views: cel.total_reel_views?.toString() || '',
                              total_reel_likes: cel.total_reel_likes?.toString() || '',
                              total_post_likes: cel.total_post_likes?.toString() || '',
                              total_comments: cel.total_comments?.toString() || '',
                              total_shares: cel.total_shares?.toString() || '',
                              total_reposts: cel.total_reposts?.toString() || '',
                              average_views: cel.average_views?.toString() || '',
                              average_reel_likes: cel.average_reel_likes?.toString() || '',
                              average_post_likes: cel.average_post_likes?.toString() || '',
                              followers_interaction: cel.followers_interaction?.toString() || '',
                              hide_search: !!cel.hide_search,
                              tags: ''
                            });
                            setShowCelForm(false);
                          }}>
                          Edit
                        </button>
                        <button
                          onClick={() => toggleHideSearch(cel)}
                          style={{
                            background: cel.hide_search ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                            border: cel.hide_search ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(244,67,54,0.3)',
                            color: cel.hide_search ? '#4caf50' : '#f44336',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {cel.hide_search ? '🟢 Enable Profile' : '🔴 Disable Profile'}
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

            {/* Playlist management section for selected celebrity */}
            {filterCelId && (
              <div className="card" style={{ marginBottom: 20, padding: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📺 Playlists for {celebrities.find(c => c.id === filterCelId)?.name} ({playlists.length})
                  </h3>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setShowPlaylistForm(!showPlaylistForm);
                      setNewPlaylistName('');
                      setNewPlaylistCover('');
                      setPlaylistError('');
                    }}
                    style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8 }}
                  >
                    {showPlaylistForm ? 'Cancel' : '+ Create Playlist'}
                  </button>
                </div>

                {playlistError && (
                  <div style={{ color: '#ff5252', fontSize: 13, marginBottom: 10 }}>{playlistError}</div>
                )}

                {showPlaylistForm && (
                  <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, display: 'grid', gap: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Create Playlist</div>
                    <div>
                      <label style={labelStyle}>Playlist Name *</label>
                      <input 
                        className="input-field" 
                        value={newPlaylistName} 
                        onChange={e => setNewPlaylistName(e.target.value)} 
                        placeholder="e.g. Best of Reels" 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Cover Image (optional)</label>
                      {newPlaylistCover ? (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <img src={newPlaylistCover} alt="Cover" style={{ width: 100, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                          <button className="btn btn-ghost" onClick={() => setNewPlaylistCover('')} style={{ color: '#ff5252', padding: '6px 12px', fontSize: 12 }}>Remove</button>
                        </div>
                      ) : (
                        <div>
                          <input type="file" accept="image/*" className="input-field" style={{ padding: '8px' }} onChange={async (e) => {
                            const file = e.target.files[0]
                            if (!file) return
                            setSavingPlaylist(true)
                            setPlaylistError('')
                            const reader = new FileReader()
                            reader.readAsDataURL(file)
                            reader.onload = async () => {
                              try {
                                const res = await adminFetch('/api/admin/upload', {
                                  method: 'POST',
                                  body: { image: reader.result }
                                })
                                const data = await res.json()
                                if (data.url) setNewPlaylistCover(data.url)
                                else throw new Error(data.error || 'Upload failed')
                              } catch(err) {
                                setPlaylistError(err.message || 'Failed to upload cover image')
                              } finally {
                                setSavingPlaylist(false)
                              }
                            }
                          }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => setShowPlaylistForm(false)} style={{ padding: '6px 12px', fontSize: 12 }}>Cancel</button>
                      <button className="btn btn-primary" onClick={handleCreatePlaylist} disabled={savingPlaylist} style={{ padding: '6px 16px', fontSize: 12 }}>
                        {savingPlaylist ? 'Saving...' : 'Save Playlist'}
                      </button>
                    </div>
                  </div>
                )}

                {loadingPlaylists ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 10 }}><div className="spinner" style={{ width: 18, height: 18 }} /></div>
                ) : playlists.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    No playlists created for this profile yet.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {playlists.map(pl => (
                      <div key={pl.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface)', padding: 10, borderRadius: 10, border: '1px solid var(--border)', position: 'relative' }}>
                        {pl.cover_url ? (
                          <img src={pl.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📺</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Playlist</div>
                        </div>
                        <button
                          onClick={() => handleDeletePlaylist(pl.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff5252',
                            fontSize: 14,
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete Playlist"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

                        {post.playlist_name && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                              <span>📺 Playlist:</span>
                              <strong>{post.playlist_name}</strong>
                            </div>
                            <button
                              onClick={() => handleRemovePostFromPlaylist(post)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ff5252',
                                fontSize: 16,
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remove from Playlist"
                            >
                              ✕
                            </button>
                          </div>
                        )}

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



        {/* ── LIVE DATE CARD (Only visible in Live-related tabs) ────────── */}
        {(tab === 'most_followed' || tab === 'voting_management') && (
          <div className="card" style={{ marginBottom: 28, padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              📅 Live Page Date
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              The date on the top-right corner of the <span style={{ color: 'var(--accent)', fontWeight: 700 }}>/live</span> page is now <strong>fully automated</strong> by calendar time. It dynamically displays the current local date to visitors.
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
                            return profile.category.split(',').map(c => {
                              const trimmed = c.trim();
                              if (trimmed.includes(':')) {
                                const parts = trimmed.split(':');
                                return `${parts[1]} (${parts[0]})`;
                              }
                              return trimmed;
                            }).join(', ');
                          })()}</strong> &nbsp;·&nbsp; Language: <strong style={{ color: 'var(--text)' }}>{profile.language || 'None'}</strong> &nbsp;·&nbsp; Followers: <strong style={{ color: 'var(--text)' }}>{profile.followers_text?.trim() ? profile.followers_text : (profile.followers_count >= 1000000 ? `${(profile.followers_count / 1000000).toFixed(1).replace(/\.0$/, '')}M` : profile.followers_count?.toLocaleString() || '—')}</strong> &nbsp;·&nbsp; Numeric: {profile.followers_count?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => { setEditingMostFollowed({ ...profile, followers_count: profile.followers_count?.toString(), order_index: profile.order_index?.toString(), category: profile.category || '', language: profile.language || '' }); setShowMostFollowedForm(false) }}>
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

        {/* ── VOTING MANAGEMENT TAB ───────────────────────────────────────────── */}
        {tab === 'voting_management' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Voting Leaderboard Management ({mostFollowed.length})
              </h2>
            </div>

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
                  const sortedFiltered = [...filtered].sort((a, b) => (b.votes || 0) - (a.votes || 0))

                  if (sortedFiltered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {mostFollowed.length === 0 ? "No profiles found in Most Followed database." : "No matching profiles found."}
                      </div>
                    )
                  }

                  return sortedFiltered.map((profile) => (
                    <div key={profile.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface2)' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                      )}

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{profile.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
                          Current Rank: <strong style={{ color: 'var(--accent)' }}>#{profile.current_vote_rank || '—'}</strong> | Votes: <strong style={{ color: (profile.votes || 0) > 0 ? '#10b981' : (profile.votes || 0) < 0 ? '#dc2626' : 'var(--text)' }}>{(profile.votes || 0) > 0 ? '+' : ''}{profile.votes || 0}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="number"
                          placeholder="Votes"
                          id={`votes-input-${profile.id}`}
                          defaultValue={profile.votes || 0}
                          style={{
                            width: 80,
                            height: 36,
                            padding: '0 8px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--surface2)',
                            color: 'var(--text)',
                            fontSize: 13,
                            textAlign: 'center'
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: 12, height: 36 }}
                          onClick={() => {
                            const input = document.getElementById(`votes-input-${profile.id}`);
                            const val = input ? input.value : 0;
                            updateVotes(profile.id, val);
                          }}
                        >
                          Set Votes
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', fontSize: 12, height: 36, border: '1px solid var(--border)' }}
                          onClick={() => {
                            const input = document.getElementById(`votes-input-${profile.id}`);
                            if (input) input.value = 0;
                            updateVotes(profile.id, 0);
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}


        {/* ── VISITORS TAB ──────────────────────────────────────────────── */}
        {tab === 'visitors' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Daily Unique Visitors
              </h2>
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visits.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No visitor statistics tracked yet. Visits will automatically start logging when users visit the public pages.
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', padding: '14px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <div style={{ flex: 1 }}>Date</div>
                      <div style={{ width: 180, textAlign: 'right' }}>Unique Visitors Count</div>
                    </div>
                    {/* Rows */}
                    {visits.map(v => (
                      <div key={v.visit_date} style={{ display: 'flex', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                        <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
                          📅 {new Date(v.visit_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ width: 180, textAlign: 'right', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
                          {v.unique_visitors.toLocaleString()} visitor{v.unique_visitors !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CHAT WALLPAPER TAB ────────────────────────────────────────── */}
        {tab === 'chat_backgrounds' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
                  Chat Room Wallpapers
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  Upload a custom background wallpaper for each chat room. The image will be displayed as a subtle light watermark in the chat interface.
                </p>
              </div>
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {[
                  { key: 'all', name: 'Global Chat (All)' },
                  { key: 'hindi', name: 'Hindi Room' },
                  { key: 'telugu', name: 'Telugu Room' },
                  { key: 'tamil', name: 'Tamil Room' },
                  { key: 'kannada', name: 'Kannada Room' },
                  { key: 'malayalam', name: 'Malayalam Room' }
                ].map(room => {
                  const bgUrl = chatBackgrounds[room.key]
                  const isUploading = uploadingBgRoom === room.key

                  return (
                    <div key={room.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        💬 {room.name}
                      </h3>
                      
                      <div style={{ 
                        height: 160, 
                        borderRadius: 12, 
                        border: '1px dashed var(--border)', 
                        background: bgUrl 
                          ? `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${bgUrl}) center/cover no-repeat` 
                          : 'rgba(99, 102, 241, 0.03)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {isUploading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div className="spinner" />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uploading to Cloudinary...</span>
                          </div>
                        ) : bgUrl ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, padding: 12, background: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(4px)' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#2e7d32' }}>✓ Custom Wallpaper Active</span>
                            <a href={bgUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'underline' }}>View Original Image</a>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Default Chat Background</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                        {bgUrl ? (
                          <button 
                            className="btn btn-ghost" 
                            style={{ flex: 1, color: '#ff5252', background: 'rgba(255, 82, 82, 0.08)', fontWeight: 600 }}
                            onClick={() => handleDeleteChatBackground(room.key)}
                          >
                            🗑️ Delete Wallpaper
                          </button>
                        ) : (
                          <label style={{ flex: 1, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (!file) return
                                setUploadingBgRoom(room.key)
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
                                    if (data.url) {
                                      await handleSaveChatBackground(room.key, data.url)
                                    } else {
                                      throw new Error(data.error || 'Upload failed')
                                    }
                                  } catch (err) {
                                    alert('Upload failed: ' + err.message)
                                  } finally {
                                    setUploadingBgRoom(null)
                                  }
                                }
                              }}
                            />
                            <div className="btn" style={{ width: '100%', textAlign: 'center', background: 'var(--gradient)', color: 'white', fontWeight: 600 }}>
                              📤 Upload Image
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TRENDING REELS TAB ────────────────────────────────────────── */}
        {tab === 'reels' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Trending Reels ({viralReels.length})
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className={`btn ${reorderMode ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => setReorderMode(!reorderMode)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    border: reorderMode ? '1px solid #28a745' : '1px solid var(--border)',
                    background: reorderMode ? 'rgba(40, 167, 69, 0.1)' : 'transparent',
                    color: reorderMode ? '#28a745' : 'var(--text)'
                  }}
                >
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Reorder Positions'}
                </button>
                {!showViralReelsForm && !editingViralReels && (
                  <button className="btn btn-primary" onClick={() => setShowViralReelsForm(true)}>
                    + Add Reel
                  </button>
                )}
              </div>
            </div>

            {(showViralReelsForm || editingViralReels) && (
              <AdminModal
                isOpen={showViralReelsForm || !!editingViralReels}
                onClose={() => { setShowViralReelsForm(false); setEditingViralReels(null); }}
                title={editingViralReels ? '✏️ Edit Reel' : '➕ Add Trending Reel'}
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
                    showToast('✅ Reel saved!')
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
                placeholder="🔍 Search reels by title or creator..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = viralReels.filter(item => 
                    item.title?.toLowerCase().includes(searchViralReels.toLowerCase()) ||
                    item.creator_name?.toLowerCase().includes(searchViralReels.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {viralReels.length === 0 ? "No trending reels yet. Add your first one! 👆" : "No matching reels found."}
                      </div>
                    )
                  }
                  return filtered.map(item => {
                    const globalIdx = viralReels.findIndex(x => x.id === item.id)
                    const isFirst = globalIdx === 0
                    const isLast = globalIdx === viralReels.length - 1

                    return (
                      <div 
                        key={item.id} 
                        className="card" 
                        draggable={reorderMode ? "true" : "false"}
                        onDragStart={(e) => handleDragStart(e, globalIdx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, globalIdx)}
                        style={{ 
                          display: 'flex', 
                          gap: 14, 
                          alignItems: 'center',
                          cursor: reorderMode ? 'grab' : 'default',
                          userSelect: 'none',
                          border: draggedIndex === globalIdx ? '2px dashed var(--accent)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                          background: draggedIndex === globalIdx ? 'var(--surface2)' : 'var(--surface)'
                        }}
                      >
                        {/* Drag Handle */}
                        {reorderMode && (
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'grab' }}>
                            <GripVertical size={16} />
                          </div>
                        )}

                        {/* Move controls for touch/accessibility */}
                        {reorderMode && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'up'); }}
                              disabled={isFirst}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isFirst ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isFirst ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Up"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'down'); }}
                              disabled={isLast}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isLast ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isLast ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        )}

                        {item.photo_url ? (
                          <img src={item.photo_url} alt="" style={{ width: 90, height: 50, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)', pointerEvents: 'none' }} />
                        ) : (
                          <div style={{ width: 90, height: 50, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, pointerEvents: 'none' }}>🎬</div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Rank: #{globalIdx + 1}</span>
                            &nbsp;·&nbsp;
                            {item.creator_photo_url && (
                              <img src={item.creator_photo_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <span>Creator: <strong>{item.creator_name || '@anonymous'}</strong></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={item.instagram_link} target="_blank" rel="noopener noreferrer">
                            <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>View Link</button>
                          </a>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => { setEditingViralReels(item); setShowViralReelsForm(false) }}>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteViralReel(item.id)}
                            style={{
                              background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                              color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Delete
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

        {/* ── MOST VIEWED REELS TAB ────────────────────────────────────────── */}
        {tab === 'most_viewed_reels' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Most Viewed Reels ({mostViewedReels.length})
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className={`btn ${reorderMode ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => setReorderMode(!reorderMode)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    border: reorderMode ? '1px solid #28a745' : '1px solid var(--border)',
                    background: reorderMode ? 'rgba(40, 167, 69, 0.1)' : 'transparent',
                    color: reorderMode ? '#28a745' : 'var(--text)'
                  }}
                >
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Reorder Positions'}
                </button>
                {!showMostViewedReelsForm && !editingMostViewedReels && (
                  <button className="btn btn-primary" onClick={() => setShowMostViewedReelsForm(true)}>
                    + Add Reel
                  </button>
                )}
              </div>
            </div>

            {(showMostViewedReelsForm || editingMostViewedReels) && (
              <AdminModal
                isOpen={showMostViewedReelsForm || !!editingMostViewedReels}
                onClose={() => { setShowMostViewedReelsForm(false); setEditingMostViewedReels(null); }}
                title={editingMostViewedReels ? '✏️ Edit Reel' : '➕ Add Most Viewed Reel'}
              >
                <ViralReelsForm
                  apiEndpoint="/api/admin/most_viewed_reels"
                  initial={editingMostViewedReels}
                  onSave={(reel) => {
                    if (editingMostViewedReels) {
                      setMostViewedReels(r => r.map(x => x.id === reel.id ? reel : x))
                    } else {
                      setMostViewedReels(r => [reel, ...r])
                    }
                    setShowMostViewedReelsForm(false)
                    setEditingMostViewedReels(null)
                    showToast('✅ Reel saved!')
                  }}
                  onCancel={() => { setShowMostViewedReelsForm(false); setEditingMostViewedReels(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchMostViewedReels}
                onChange={e => setSearchMostViewedReels(e.target.value)}
                placeholder="🔍 Search reels by title or creator..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostViewedReels.filter(item => 
                    item.title?.toLowerCase().includes(searchMostViewedReels.toLowerCase()) ||
                    item.creator_name?.toLowerCase().includes(searchMostViewedReels.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {mostViewedReels.length === 0 ? "No most viewed reels yet. Add your first one! 👆" : "No matching reels found."}
                      </div>
                    )
                  }
                  return filtered.map(item => {
                    const globalIdx = mostViewedReels.findIndex(x => x.id === item.id)
                    const isFirst = globalIdx === 0
                    const isLast = globalIdx === mostViewedReels.length - 1

                    return (
                      <div 
                        key={item.id} 
                        className="card" 
                        draggable={reorderMode ? "true" : "false"}
                        onDragStart={(e) => handleDragStart(e, globalIdx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, globalIdx)}
                        style={{ 
                          display: 'flex', 
                          gap: 14, 
                          alignItems: 'center',
                          cursor: reorderMode ? 'grab' : 'default',
                          userSelect: 'none',
                          border: draggedIndex === globalIdx ? '2px dashed var(--accent)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                          background: draggedIndex === globalIdx ? 'var(--surface2)' : 'var(--surface)'
                        }}
                      >
                        {/* Drag Handle */}
                        {reorderMode && (
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'grab' }}>
                            <GripVertical size={16} />
                          </div>
                        )}

                        {/* Move controls for touch/accessibility */}
                        {reorderMode && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'up'); }}
                              disabled={isFirst}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isFirst ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isFirst ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Up"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'down'); }}
                              disabled={isLast}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isLast ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isLast ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        )}

                        {item.photo_url ? (
                          <img src={item.photo_url} alt="" style={{ width: 90, height: 50, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)', pointerEvents: 'none' }} />
                        ) : (
                          <div style={{ width: 90, height: 50, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, pointerEvents: 'none' }}>🎬</div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Rank: #{globalIdx + 1}</span>
                            &nbsp;·&nbsp;
                            {item.creator_photo_url && (
                              <img src={item.creator_photo_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <span>Creator: <strong>{item.creator_name || '@anonymous'}</strong></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={item.instagram_link} target="_blank" rel="noopener noreferrer">
                            <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>View Link</button>
                          </a>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => { setEditingMostViewedReels(item); setShowMostViewedReelsForm(false) }}>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMostViewedReel(item.id)}
                            style={{
                              background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                              color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Delete
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

        {/* ── MOST LIKED POSTS TAB ────────────────────────────────────────── */}
        {tab === 'most_liked_posts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Most Liked Posts ({mostLikedPosts.length})
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className={`btn ${reorderMode ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => setReorderMode(!reorderMode)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    border: reorderMode ? '1px solid #28a745' : '1px solid var(--border)',
                    background: reorderMode ? 'rgba(40, 167, 69, 0.1)' : 'transparent',
                    color: reorderMode ? '#28a745' : 'var(--text)'
                  }}
                >
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Reorder Positions'}
                </button>
                {!showMostLikedPostsForm && !editingMostLikedPosts && (
                  <button className="btn btn-primary" onClick={() => setShowMostLikedPostsForm(true)}>
                    + Add Post
                  </button>
                )}
              </div>
            </div>

            {(showMostLikedPostsForm || editingMostLikedPosts) && (
              <AdminModal
                isOpen={showMostLikedPostsForm || !!editingMostLikedPosts}
                onClose={() => { setShowMostLikedPostsForm(false); setEditingMostLikedPosts(null); }}
                title={editingMostLikedPosts ? '✏️ Edit Post' : '➕ Add Most Liked Post'}
              >
                <ViralReelsForm
                  apiEndpoint="/api/admin/most_liked_posts"
                  initial={editingMostLikedPosts}
                  onSave={(post) => {
                    if (editingMostLikedPosts) {
                      setMostLikedPosts(r => r.map(x => x.id === post.id ? post : x))
                    } else {
                      setMostLikedPosts(r => [post, ...r])
                    }
                    setShowMostLikedPostsForm(false)
                    setEditingMostLikedPosts(null)
                    showToast('✅ Post saved!')
                  }}
                  onCancel={() => { setShowMostLikedPostsForm(false); setEditingMostLikedPosts(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchMostLikedPosts}
                onChange={e => setSearchMostLikedPosts(e.target.value)}
                placeholder="🔍 Search posts by title or creator..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostLikedPosts.filter(item => 
                    item.title?.toLowerCase().includes(searchMostLikedPosts.toLowerCase()) ||
                    item.creator_name?.toLowerCase().includes(searchMostLikedPosts.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {mostLikedPosts.length === 0 ? "No most liked posts yet. Add your first one! 👆" : "No matching posts found."}
                      </div>
                    )
                  }
                  return filtered.map(item => {
                    const globalIdx = mostLikedPosts.findIndex(x => x.id === item.id)
                    const isFirst = globalIdx === 0
                    const isLast = globalIdx === mostLikedPosts.length - 1

                    return (
                      <div 
                        key={item.id} 
                        className="card" 
                        draggable={reorderMode ? "true" : "false"}
                        onDragStart={(e) => handleDragStart(e, globalIdx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, globalIdx)}
                        style={{ 
                          display: 'flex', 
                          gap: 14, 
                          alignItems: 'center',
                          cursor: reorderMode ? 'grab' : 'default',
                          userSelect: 'none',
                          border: draggedIndex === globalIdx ? '2px dashed var(--accent)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                          background: draggedIndex === globalIdx ? 'var(--surface2)' : 'var(--surface)'
                        }}
                      >
                        {/* Drag Handle */}
                        {reorderMode && (
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'grab' }}>
                            <GripVertical size={16} />
                          </div>
                        )}

                        {/* Move controls for touch/accessibility */}
                        {reorderMode && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'up'); }}
                              disabled={isFirst}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isFirst ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isFirst ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Up"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'down'); }}
                              disabled={isLast}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isLast ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isLast ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        )}

                        {item.photo_url ? (
                          <img src={item.photo_url} alt="" style={{ width: 90, height: 50, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)', pointerEvents: 'none' }} />
                        ) : (
                          <div style={{ width: 90, height: 50, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, pointerEvents: 'none' }}>🖼️</div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Rank: #{globalIdx + 1}</span>
                            &nbsp;·&nbsp;
                            {item.creator_photo_url && (
                              <img src={item.creator_photo_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <span>Creator: <strong>{item.creator_name || '@anonymous'}</strong></span>
                            {item.likes_text && (
                              <>
                                &nbsp;·&nbsp;
                                <span>Likes: <strong>{item.likes_text}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={item.instagram_link} target="_blank" rel="noopener noreferrer">
                            <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>View Link</button>
                          </a>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => { setEditingMostLikedPosts(item); setShowMostLikedPostsForm(false) }}>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMostLikedPost(item.id)}
                            style={{
                              background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                              color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Delete
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

        {/* ── MOST LIKED REELS TAB ────────────────────────────────────────── */}
        {tab === 'most_liked_reels' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Most Liked Reels ({mostLikedReels.length})
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  className={`btn ${reorderMode ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => setReorderMode(!reorderMode)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    border: reorderMode ? '1px solid #28a745' : '1px solid var(--border)',
                    background: reorderMode ? 'rgba(40, 167, 69, 0.1)' : 'transparent',
                    color: reorderMode ? '#28a745' : 'var(--text)'
                  }}
                >
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Reorder Positions'}
                </button>
                {!showMostLikedReelsForm && !editingMostLikedReels && (
                  <button className="btn btn-primary" onClick={() => setShowMostLikedReelsForm(true)}>
                    + Add Reel
                  </button>
                )}
              </div>
            </div>

            {(showMostLikedReelsForm || editingMostLikedReels) && (
              <AdminModal
                isOpen={showMostLikedReelsForm || !!editingMostLikedReels}
                onClose={() => { setShowMostLikedReelsForm(false); setEditingMostLikedReels(null); }}
                title={editingMostLikedReels ? '✏️ Edit Reel' : '➕ Add Most Liked Reel'}
              >
                <ViralReelsForm
                  apiEndpoint="/api/admin/most_liked_reels"
                  initial={editingMostLikedReels}
                  onSave={(reel) => {
                    if (editingMostLikedReels) {
                      setMostLikedReels(r => r.map(x => x.id === reel.id ? reel : x))
                    } else {
                      setMostLikedReels(r => [reel, ...r])
                    }
                    setShowMostLikedReelsForm(false)
                    setEditingMostLikedReels(null)
                    showToast('✅ Reel saved!')
                  }}
                  onCancel={() => { setShowMostLikedReelsForm(false); setEditingMostLikedReels(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchMostLikedReels}
                onChange={e => setSearchMostLikedReels(e.target.value)}
                placeholder="🔍 Search reels by title or creator..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostLikedReels.filter(item => 
                    item.title?.toLowerCase().includes(searchMostLikedReels.toLowerCase()) ||
                    item.creator_name?.toLowerCase().includes(searchMostLikedReels.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {mostLikedReels.length === 0 ? "No most liked reels yet. Add your first one! 👆" : "No matching reels found."}
                      </div>
                    )
                  }
                  return filtered.map(item => {
                    const globalIdx = mostLikedReels.findIndex(x => x.id === item.id)
                    const isFirst = globalIdx === 0
                    const isLast = globalIdx === mostLikedReels.length - 1

                    return (
                      <div 
                        key={item.id} 
                        className="card" 
                        draggable={reorderMode ? "true" : "false"}
                        onDragStart={(e) => handleDragStart(e, globalIdx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, globalIdx)}
                        style={{ 
                          display: 'flex', 
                          gap: 14, 
                          alignItems: 'center',
                          cursor: reorderMode ? 'grab' : 'default',
                          userSelect: 'none',
                          border: draggedIndex === globalIdx ? '2px dashed var(--accent)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                          background: draggedIndex === globalIdx ? 'var(--surface2)' : 'var(--surface)'
                        }}
                      >
                        {/* Drag Handle */}
                        {reorderMode && (
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'grab' }}>
                            <GripVertical size={16} />
                          </div>
                        )}

                        {/* Move controls for touch/accessibility */}
                        {reorderMode && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'up'); }}
                              disabled={isFirst}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isFirst ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isFirst ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Up"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveReel(globalIdx, 'down'); }}
                              disabled={isLast}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isLast ? 'var(--border)' : 'var(--text-dim)',
                                cursor: isLast ? 'default' : 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Move Down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        )}

                        {item.photo_url ? (
                          <img src={item.photo_url} alt="" style={{ width: 90, height: 50, borderRadius: 8, objectFit: 'cover', background: 'var(--surface2)', pointerEvents: 'none' }} />
                        ) : (
                          <div style={{ width: 90, height: 50, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, pointerEvents: 'none' }}>🖼️</div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Rank: #{globalIdx + 1}</span>
                            &nbsp;·&nbsp;
                            {item.creator_photo_url && (
                              <img src={item.creator_photo_url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <span>Creator: <strong>{item.creator_name || '@anonymous'}</strong></span>
                            {item.likes_text && (
                              <>
                                &nbsp;·&nbsp;
                                <span>Likes: <strong>{item.likes_text}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={item.instagram_link} target="_blank" rel="noopener noreferrer">
                            <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>View Link</button>
                          </a>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => { setEditingMostLikedReels(item); setShowMostLikedReelsForm(false) }}>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMostLikedReel(item.id)}
                            style={{
                              background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                              color: '#ff5252', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Delete
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

        {tab === 'settings' && (
          <div className="card" style={{ padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
            <h2 style={{ marginBottom: 20, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800 }}>⚙️ Global Settings</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>
              {/* Trending Reels Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Enable Trending Reels Section</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>If disabled, the "Trending Reels" tab will be hidden and the page will only show "Most Viewed".</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={trendingEnabled}
                  onChange={(e) => setTrendingEnabled(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              </div>

              {/* Live Date Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>Leaderboard Live Date override</label>
                <input 
                  type="text" 
                  value={liveDate}
                  onChange={(e) => setLiveDate(e.target.value)}
                  placeholder="Leave blank for auto-date"
                  className="input-field"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    fontSize: 14,
                    color: 'var(--text)',
                    outline: 'none',
                    width: '100%'
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Leave blank to automatically display today's current date.</span>
              </div>

              {/* Save Button */}
              <button 
                onClick={saveGlobalSettings}
                className="btn btn-primary"
                disabled={savingSettings}
                style={{ padding: '12px 20px', borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 }}
              >
                {savingSettings ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
