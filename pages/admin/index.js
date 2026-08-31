import { useState, useEffect, useRef } from 'react'
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
  }).then(res => {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearToken()
      window.dispatchEvent(new Event('admin_unauthorized'))
    }
    return res
  })
}

function parseCountText(text) {
  if (!text) return 0;
  const cleaned = text.toString().trim().toLowerCase();
  const numMatch = cleaned.match(/^([0-9.]+)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1]);
  if (isNaN(num)) return 0;
  
  if (cleaned.includes('b') || cleaned.includes('billion')) {
    return num * 1000000000;
  }
  if (cleaned.includes('m') || cleaned.includes('million')) {
    return num * 1000000;
  }
  if (cleaned.includes('k') || cleaned.includes('thousand')) {
    return num * 1000;
  }
  if (cleaned.includes('crore') || cleaned.includes('cr')) {
    return num * 10000000;
  }
  if (cleaned.includes('lakh') || cleaned.includes('l')) {
    return num * 100000;
  }
  return num;
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
        name: initial.name_manual || '',
        instagram_handle: initial.instagram_handle || '',
        photo_url: initial.photo_url || '',
        description: initial.description_manual || '',
        order_index: initial.order_index !== undefined && initial.order_index !== null ? initial.order_index.toString() : '0',
        followers_count: initial.followers_manual !== undefined && initial.followers_manual !== null ? initial.followers_manual.toString() : '',
        posts_count: initial.posts_manual !== undefined && initial.posts_manual !== null ? initial.posts_manual.toString() : '',
        total_reel_views: initial.total_reel_views_manual !== undefined && initial.total_reel_views_manual !== null ? initial.total_reel_views_manual.toString() : '',
        total_reel_likes: initial.total_reel_likes_manual !== undefined && initial.total_reel_likes_manual !== null ? initial.total_reel_likes_manual.toString() : '',
        total_post_likes: initial.total_post_likes_manual !== undefined && initial.total_post_likes_manual !== null ? initial.total_post_likes_manual.toString() : '',
        total_comments: initial.total_comments_manual !== undefined && initial.total_comments_manual !== null ? initial.total_comments_manual.toString() : '',
        average_views: initial.average_views_manual !== undefined && initial.average_views_manual !== null ? initial.average_views_manual.toString() : '',
        average_reel_likes: initial.average_reel_likes_manual !== undefined && initial.average_reel_likes_manual !== null ? initial.average_reel_likes_manual.toString() : '',
        average_post_likes: initial.average_post_likes_manual !== undefined && initial.average_post_likes_manual !== null ? initial.average_post_likes_manual.toString() : '',
        followers_interaction: initial.followers_interaction_manual !== undefined && initial.followers_interaction_manual !== null ? initial.followers_interaction_manual.toString() : '',
        most_likes: initial.most_likes_manual !== undefined && initial.most_likes_manual !== null ? initial.most_likes_manual.toString() : '',
        most_liked_count: initial.most_liked_count_manual || '',
        most_commented_count: initial.most_commented_count_manual || '',
        most_viewed_count: initial.most_viewed_count_manual || '',
        total_shares: initial.total_shares !== undefined && initial.total_shares !== null ? initial.total_shares.toString() : '',
        total_reposts: initial.total_reposts !== undefined && initial.total_reposts !== null ? initial.total_reposts.toString() : '',
        account_created_year: initial.account_created_year !== undefined && initial.account_created_year !== null ? initial.account_created_year.toString() : '',
        hide_search: !!initial.hide_search,
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
      description: '',
      most_liked_count: '',
      most_commented_count: '',
      most_viewed_count: ''
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
          description: form.description || '',
          most_liked_count: form.most_liked_count || null,
          most_commented_count: form.most_commented_count || null,
          most_viewed_count: form.most_viewed_count || null
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
      <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <strong>Note:</strong> Leave any field blank to automatically use the scraped value. 
          If you fill in a field, it will override the scraper.
        </p>
      </div>
      <div>
        <label style={labelStyle}>Display Name Override (Scraped: {initial?.name_scraped || 'None'})</label>
        <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Virat Kohli" />
      </div>
      <div>
        <label style={labelStyle}>Instagram Handle (without @)</label>
        <input 
          className="input-field" 
          value={form.instagram_handle || ''} 
          onChange={e => set('instagram_handle', e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} 
          placeholder="e.g. virat.kohli" 
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Followers Override (Scraped: {initial?.followers_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="e.g. 17000000" />
        </div>
        <div>
          <label style={labelStyle}>Posts Override (Scraped: {initial?.posts_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.posts_count} onChange={e => set('posts_count', e.target.value)} placeholder="e.g. 140" />
        </div>
        <div>
          <label style={labelStyle}>Account Created Year (Manual)</label>
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
          <label style={labelStyle}>Total Reel Views Override (Scraped: {initial?.total_reel_views_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.total_reel_views} onChange={e => set('total_reel_views', e.target.value)} placeholder="e.g. 5200000" />
        </div>
        <div>
          <label style={labelStyle}>Total Reel Likes Override (Scraped: {initial?.total_reel_likes_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.total_reel_likes} onChange={e => set('total_reel_likes', e.target.value)} placeholder="e.g. 150000" />
        </div>
        <div>
          <label style={labelStyle}>Total Post Likes Override (Scraped: {initial?.total_post_likes_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.total_post_likes} onChange={e => set('total_post_likes', e.target.value)} placeholder="e.g. 80000" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Total Comments Override (Scraped: {initial?.total_comments_scraped || 'None'})</label>
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
          <label style={labelStyle}>Average Views Override (Scraped: {initial?.average_views_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.average_views || ''} onChange={e => set('average_views', e.target.value)} placeholder="e.g. 1200000" />
        </div>
        <div>
          <label style={labelStyle}>Average Reel Likes Override (Scraped: {initial?.average_reel_likes_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.average_reel_likes || ''} onChange={e => set('average_reel_likes', e.target.value)} placeholder="e.g. 45000" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Average Post Likes Override (Scraped: {initial?.average_post_likes_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.average_post_likes || ''} onChange={e => set('average_post_likes', e.target.value)} placeholder="e.g. 25000" />
        </div>
        <div>
          <label style={labelStyle}>Followers Interaction Override (Scraped: {initial?.followers_interaction_scraped || '0'}%)</label>
          <input className="input-field" type="number" step="0.01" value={form.followers_interaction || ''} onChange={e => set('followers_interaction', e.target.value)} placeholder="e.g. 5.25" />
        </div>
        <div>
          <label style={labelStyle}>Most Likes Override (Scraped: {initial?.most_likes_scraped || 'None'})</label>
          <input className="input-field" type="number" value={form.most_likes || ''} onChange={e => set('most_likes', e.target.value)} placeholder="e.g. 85000" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Posted: {initial?.most_liked_date_scraped || 'N/A'}</div>
          <label style={labelStyle}>Most Liked Override (Scraped: {initial?.most_liked_count_scraped || 'None'})</label>
          <input className="input-field" type="text" value={form.most_liked_count || ''} onChange={e => set('most_liked_count', e.target.value)} placeholder="e.g. 1.2m or 500k" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Posted: {initial?.most_commented_date_scraped || 'N/A'}</div>
          <label style={labelStyle}>Most Commented Override (Scraped: {initial?.most_commented_count_scraped || 'None'})</label>
          <input className="input-field" type="text" value={form.most_commented_count || ''} onChange={e => set('most_commented_count', e.target.value)} placeholder="e.g. 85k" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Posted: {initial?.most_viewed_date_scraped || 'N/A'}</div>
          <label style={labelStyle}>Most Viewed Override (Scraped: {initial?.most_viewed_count_scraped || 'None'})</label>
          <input className="input-field" type="text" value={form.most_viewed_count || ''} onChange={e => set('most_viewed_count', e.target.value)} placeholder="e.g. 22m" />
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
            Add search for this
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

function PostForm({ celebrities, initial, onSave, onCancel, presetValues }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''),
        like_count: initial.like_count !== undefined && initial.like_count !== null ? initial.like_count.toString() : '',
        comment_count: initial.comment_count !== undefined && initial.comment_count !== null ? initial.comment_count.toString() : '',
        view_count: initial.view_count !== undefined && initial.view_count !== null ? initial.view_count.toString() : '',
      }
    }
    const lastId = typeof window !== 'undefined' ? localStorage.getItem('last_selected_celebrity_id') : ''
    const idExists = lastId && celebrities.some(c => c.id === lastId)
    return {
      celebrity_id: presetValues?.celebrity_id || (idExists ? lastId : ''),
      post_url: presetValues?.post_url || '',
      post_type: presetValues?.post_type || 'reel',
      caption: presetValues?.caption || '',
      post_date: presetValues?.post_date || '',
      tags: presetValues?.tags || '',
      is_most_liked: presetValues?.is_most_liked || false,
      is_most_commented: presetValues?.is_most_commented || false,
      is_most_viewed: presetValues?.is_most_viewed || false,
      is_first_post: presetValues?.is_first_post || false,
      playlist_name: presetValues?.playlist_name || '',
      playlist_cover_url: presetValues?.playlist_cover_url || '',
      like_count: presetValues?.like_count || '',
      comment_count: presetValues?.comment_count || '',
      view_count: presetValues?.view_count || ''
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
        body: { 
          ...form, 
          id: initial?.id, 
          tags,
          like_count: form.like_count ? Number(form.like_count) : null,
          comment_count: form.comment_count ? Number(form.comment_count) : null,
          view_count: form.view_count ? Number(form.view_count) : null
        },
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Likes Count (optional)</label>
          <input className="input-field" type="number" value={form.like_count} onChange={e => set('like_count', e.target.value)} placeholder="e.g. 2400000" />
        </div>
        <div>
          <label style={labelStyle}>Comments Count (optional)</label>
          <input className="input-field" type="number" value={form.comment_count} onChange={e => set('comment_count', e.target.value)} placeholder="e.g. 85000" />
        </div>
        <div>
          <label style={labelStyle}>Views Count (optional)</label>
          <input className="input-field" type="number" value={form.view_count} onChange={e => set('view_count', e.target.value)} placeholder="e.g. 15000000" />
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
    name: '', photo_url: '', followers_count: '', followers_text: '', order_index: '0', language: '', instagram_handle: ''
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
          updated.instagram_handle = match.instagram_handle || ''
          
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
            updated.instagram_handle = ''
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
    
    let followersVal = (form.followers_text || '').trim().toUpperCase();
    if (!followersVal) {
      return setError('Followers Count is required');
    }
    // If entered as pure integer/number like "229172", automatically convert to standard shorthand
    if (/^[0-9,]+$/.test(followersVal)) {
      const rawNum = parseInt(followersVal.replace(/,/g, ''), 10);
      if (rawNum >= 1000000000) followersVal = `${(Math.floor(rawNum / 100000000) / 10).toString().replace(/\.0$/, "")}B`;
      else if (rawNum >= 1000000) followersVal = `${(Math.floor(rawNum / 100000) / 10).toString().replace(/\.0$/, "")}M`;
      else if (rawNum >= 1000) followersVal = `${(Math.floor(rawNum / 100) / 10).toString().replace(/\.0$/, "")}K`;
      else followersVal = rawNum.toString();
    } else if (!/^[0-9]+(\.[0-9]+)?[KMB]$/.test(followersVal)) {
      return setError('Followers Count must be a valid number or shorthand (e.g., 270M, 229.1K, 500K)');
    }

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
          order_index: form.order_index ? Number(form.order_index) : 0,
          category: combinedCategory,
          language: combinedLanguage,
          instagram_handle: form.instagram_handle ? form.instagram_handle.trim() : null
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
      <div>
        <label style={labelStyle}>Instagram Username / Handle (without @)</label>
        <input 
          className="input-field" 
          value={form.instagram_handle || ''} 
          onChange={e => set('instagram_handle', e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} 
          placeholder="e.g. virat.kohli" 
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Followers Count (e.g. 270M, 10K, 1.2B) *</label>
          <input 
            className="input-field" 
            value={form.followers_text || ''} 
            onChange={e => {
              const val = e.target.value;
              const cleaned = val.replace(/[^0-9.kmbKMB]/g, '');
              if (/^[0-9]*\.?[0-9]*[kmbKMB]?$/.test(cleaned) || cleaned === '') {
                set('followers_text', cleaned.toUpperCase());
              }
            }} 
            placeholder="e.g. 270M" 
          />
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
  const isComment = apiEndpoint.includes('most_liked_comments')
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
        views_text: initial.isCopy ? '' : (initial.views_text || initial.likes_text || ''),
        hours_ago: getInitialHoursAgo(initial.created_at),
        uploaded_date: initialDate,
        description: initial.description || '',
        why_notable: initial.why_notable || '',
        show_in_most_liked: initial.show_in_most_liked !== undefined ? !!initial.show_in_most_liked : false,
        show_in_all_posts: initial.show_in_all_posts !== undefined ? !!initial.show_in_all_posts : true,
        show_in_original: initial.show_in_original !== undefined ? !!initial.show_in_original : false,
        show_in_all_reels: initial.show_in_all_reels !== undefined ? !!initial.show_in_all_reels : true
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
      uploaded_date: initialDate,
      description: '',
      why_notable: '',
      show_in_most_liked: false,
      show_in_all_posts: true,
      show_in_original: false,
      show_in_all_reels: true
    }
  })
  const [saving, setSaving] = useState(false)
  const [fetchingReel, setFetchingReel] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAutoFetchReel = async () => {
    if (!form.instagram_link) return
    setFetchingReel(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/fetch_reel_info', {
        method: 'POST',
        body: { instagram_link: form.instagram_link }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.reel) {
        if (!isComment && data.reel.title && (!form.title || form.title.startsWith('Reel'))) set('title', data.reel.title)
        if (data.reel.viewsText && !isComment) set('views_text', data.reel.viewsText)
        if (data.reel.creatorName && !form.creator_name) set('creator_name', data.reel.creatorName)
        if (data.reel.creatorPhotoUrl && !form.creator_photo_url) set('creator_photo_url', data.reel.creatorPhotoUrl)
        if (data.reel.thumbnailUrl && !form.photo_url && !isComment) set('photo_url', data.reel.thumbnailUrl)
        if (data.reel.takenAt) {
          const diffMs = Date.now() - new Date(data.reel.takenAt).getTime()
          const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)))
          set('hours_ago', `${diffHours} hours ago`)
          set('uploaded_date', data.reel.takenAt.split('T')[0])
          set('created_at', data.reel.takenAt)
        }
      }
    } catch (err) {
      setError(`Auto-fetch failed: ${err.message}`)
    } finally {
      setFetchingReel(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) return setError(isComment ? 'Comment text is required' : 'Title is required')
    if (!form.instagram_link.trim()) return setError('Instagram link is required')
    if (isMostViewed || isMostLiked || isComment) {
      const viewsVal = (form.views_text || form.likes_text || '').trim().toUpperCase();
      if (!viewsVal) {
        return setError(`Likes count is required (e.g. 150K, 200K)`);
      }
      if (!/^[0-9]+(\.[0-9]+)?[KMB]$/.test(viewsVal)) {
        return setError(`Likes/views count must be a number followed by K, M, or B (e.g., 150K, 200K, 1.2M)`);
      }
      
      const followersVal = (form.followers_text || '').trim().toUpperCase();
      if (followersVal && !/^[0-9]+(\.[0-9]+)?[KMB]$/.test(followersVal)) {
        return setError(`Followers count must be a number followed by K, M, or B (e.g., 10M, 500K)`);
      }
    }
    setSaving(true)
    setError('')
    try {
      const calculatedCreatedAt = (isMostViewed || isMostLiked || isComment)
        ? (form.uploaded_date ? new Date(form.uploaded_date + 'T12:00:00').toISOString() : (form.created_at || new Date().toISOString()))
        : (form.created_at ? form.created_at : (() => {
            const match = (form.hours_ago || '').match(/\d+/)
            const hours = match ? parseInt(match[0], 10) : 0
            return new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString()
          })())

      const res = await adminFetch(apiEndpoint, {
        method: (initial && !initial.isCopy) ? 'PUT' : 'POST',
        body: {
          ...form,
          id: (initial && !initial.isCopy) ? initial.id : undefined,
          order_index: form.order_index ? Number(form.order_index) : 0,
          creator_name: form.creator_name || '',
          creator_photo_url: form.creator_photo_url || '',
          followers_text: form.followers_text || '',
          description: form.description || '',
          why_notable: form.why_notable || '',
          show_in_most_liked: form.show_in_most_liked !== undefined ? !!form.show_in_most_liked : false,
          show_in_all_posts: form.show_in_all_posts !== undefined ? !!form.show_in_all_posts : true,
          show_in_original: form.show_in_original !== undefined ? !!form.show_in_original : false,
          show_in_all_reels: form.show_in_all_reels !== undefined ? !!form.show_in_all_reels : true,
          ...(isMostLiked || isComment ? { likes_text: form.views_text || form.likes_text || '' } : { views_text: form.views_text || '' }),
          created_at: calculatedCreatedAt
        },
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onSave(data.reel || data.post || data.comment)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (initial && initial.isCopy) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Copying Reel details</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{form.title}</div>
          <div style={{ fontSize: 12, color: 'var(--accent)' }}>by {form.creator_name || '@anonymous'}</div>
        </div>
        
        <div>
          <label style={labelStyle}>
            {isMostLiked ? 'Likes Count (e.g. 1.2M, 500K) *' : 'Views Count (e.g. 1.2M, 500K) *'}
          </label>
          <input 
            className="input-field" 
            value={form.views_text || ''} 
            onChange={e => {
              const val = e.target.value;
              const cleaned = val.replace(/[^0-9.kmbKMB]/g, '');
              if (/^[0-9]*\.?[0-9]*[kmbKMB]?$/.test(cleaned) || cleaned === '') {
                set('views_text', cleaned.toUpperCase());
              }
            }} 
            placeholder={isMostLiked ? "e.g. 500K" : "e.g. 1.2M"} 
            autoFocus
          />
        </div>

        {(isMostViewed || isMostLiked) && (
          <>
            <div>
              <label style={labelStyle}>Reel Description (2–4 sentences)</label>
              <textarea 
                className="input-field" 
                rows={3}
                value={form.description || ''} 
                onChange={e => set('description', e.target.value)} 
                placeholder="Enter a unique 2–4 sentence description for this reel..." 
                style={{ height: 'auto', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Why Notable (Optional context)</label>
              <input 
                className="input-field" 
                value={form.why_notable || ''} 
                onChange={e => set('why_notable', e.target.value)} 
                placeholder="e.g. Fastest reel to reach 10M views in 24 hours" 
              />
            </div>
          </>
        )}
        
        {error && <div style={{ color: '#ff5252', fontSize: 13 }}>{error}</div>}
        
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Copying...' : (isMostLiked ? 'Confirm Copy to Most Liked' : 'Confirm Copy to Most Viewed')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {isComment ? (
        <div>
          <label style={labelStyle}>💬 Comment Text *</label>
          <textarea 
            className="input-field" 
            rows={3} 
            value={form.title} 
            onChange={e => set('title', e.target.value)} 
            placeholder="Type the actual Instagram comment here... e.g. What an unbelievable match! Pure masterclass 🔥🏏" 
            style={{ resize: 'vertical' }}
          />
        </div>
      ) : (
        <div>
          <label style={labelStyle}>Reel Title / Caption *</label>
          <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Virat Kohli historic knock..." />
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: (isMostViewed || isMostLiked || isComment) ? '1fr 1fr' : '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>{isComment ? '👤 Commenter Name / Username *' : 'Creator Name'}</label>
          <input className="input-field" value={form.creator_name || ''} onChange={e => set('creator_name', e.target.value)} placeholder={isComment ? "e.g. sachintendulkar" : "e.g. Virat Kohli"} />
        </div>
        <div>
          <label style={labelStyle}>
            {isComment ? '❤️ Likes Count * (e.g. 150K, 200K)' : (isMostLiked ? 'Likes Count (e.g. 1.2M, 500K)' : 'Views Count (e.g. 1.2M, 500K)')}
          </label>
          <input 
            className="input-field" 
            value={form.views_text || ''} 
            onChange={e => {
              const val = e.target.value;
              const cleaned = val.replace(/[^0-9.kmbKMB]/g, '');
              if (/^[0-9]*\.?[0-9]*[kmbKMB]?$/.test(cleaned) || cleaned === '') {
                set('views_text', cleaned.toUpperCase());
              }
            }} 
            placeholder={isComment ? "e.g. 150K" : (isMostLiked ? "e.g. 500K" : "e.g. 1.2M")} 
          />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>{isComment ? '🔗 Instagram Reel / Post URL *' : 'Instagram URL *'}</label>
          {form.instagram_link && (
            <button
              type="button"
              onClick={handleAutoFetchReel}
              disabled={fetchingReel}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white',
                border: 'none',
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {fetchingReel ? '⏳ Fetching...' : '⚡ Auto-Fetch Data'}
            </button>
          )}
        </div>
        <input className="input-field" value={form.instagram_link} onChange={e => set('instagram_link', e.target.value)} placeholder="e.g. https://instagram.com/reel/..." />
      </div>

      <div>
        <label style={labelStyle}>{isComment ? 'Commenter Profile Avatar' : 'Creator Profile Photo'}</label>
        {form.creator_photo_url ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={form.creator_photo_url} alt="Creator avatar" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface2)' }} />
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
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Select a circular profile photo for the commenter</div>
          </div>
        )}
      </div>

      {!isComment && (
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
      )}

      {(isMostViewed || isMostLiked) && !isComment && (
        <>
          <div>
            <label style={labelStyle}>Reel Description (2–4 sentences)</label>
            <textarea 
              className="input-field" 
              rows={3}
              value={form.description || ''} 
              onChange={e => set('description', e.target.value)} 
              placeholder="Enter a unique 2–4 sentence description for this reel..." 
              style={{ height: 'auto', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Why Notable (Optional context)</label>
            <input 
              className="input-field" 
              value={form.why_notable || ''} 
              onChange={e => set('why_notable', e.target.value)} 
              placeholder="e.g. Fastest reel to reach 10M views in 24 hours" 
            />
          </div>
        </>
      )}

      {apiEndpoint.includes('most_liked_posts') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="show_in_most_liked"
              checked={!!form.show_in_most_liked}
              onChange={e => set('show_in_most_liked', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="show_in_most_liked" style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer' }}>
              Show in Most Liked
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="show_in_all_posts"
              checked={form.show_in_all_posts !== false}
              onChange={e => set('show_in_all_posts', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="show_in_all_posts" style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer' }}>
              Show in All Posts
            </label>
          </div>
        </div>
      )}

      {apiEndpoint.includes('most_viewed_reels') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="show_in_original"
              checked={!!form.show_in_original}
              onChange={e => set('show_in_original', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="show_in_original" style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer' }}>
              Show in Original
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="show_in_all_reels"
              checked={form.show_in_all_reels !== false}
              onChange={e => set('show_in_all_reels', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="show_in_all_reels" style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer' }}>
              Show in All
            </label>
          </div>
        </div>
      )}

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
  const [expandedCels, setExpandedCels] = useState({})
  const [news, setNews] = useState([])

  const [mostFollowed, setMostFollowed] = useState([])
  const [showMostFollowedForm, setShowMostFollowedForm] = useState(false)
  const [editingMostFollowed, setEditingMostFollowed] = useState(null)
  const [updatingFollowersId, setUpdatingFollowersId] = useState(null)
  const [tempHandles, setTempHandles] = useState({})

  // Batch scraper states
  const [selectedBatchLang, setSelectedBatchLang] = useState('All')
  const [selectedBatchCategory, setSelectedBatchCategory] = useState('')
  const [batchUpdating, setBatchUpdating] = useState(false)
  const [batchProgressCurrent, setBatchProgressCurrent] = useState(0)
  const [batchProgressTotal, setBatchProgressTotal] = useState(0)
  const [batchStatusMessage, setBatchStatusMessage] = useState('')
  const [batchErrorLog, setBatchErrorLog] = useState('')
  const abortBatchRef = useRef(false)

  // "Scrape ALL accounts" server-side batch state
  const [allScrapeRunning, setAllScrapeRunning] = useState(false)
  const [allScrapeProgress, setAllScrapeProgress] = useState({ current: 0, total: 0, percent: 0, currentName: '', currentHandle: '', status: '', updated: 0, failed: 0 })
  const [allScrapeLogs, setAllScrapeLogs] = useState([])
  const [allScrapeResult, setAllScrapeResult] = useState(null)
  const allScrapeAbortRef = useRef(null)

  // Trending Reels batch scraper state
  const [trendingScrapeRunning, setTrendingScrapeRunning] = useState(false)
  const [trendingScrapeProgress, setTrendingScrapeProgress] = useState({ current: 0, total: 0, percent: 0, currentTitle: '', status: '', updated: 0, failed: 0 })
  const [trendingScrapeLogs, setTrendingScrapeLogs] = useState([])
  const [trendingScrapeResult, setTrendingScrapeResult] = useState(null)
  const trendingScrapeAbortRef = useRef(null)

  const [instagramSessionId, setInstagramSessionId] = useState('')
  const [instagramCsrfToken, setInstagramCsrfToken] = useState('')
  const [cookiesLocked, setCookiesLocked] = useState(true)
  const [savingCookies, setSavingCookies] = useState(false)

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

  const [mostLikedComments, setMostLikedComments] = useState([])
  const [showMostLikedCommentsForm, setShowMostLikedCommentsForm] = useState(false)
  const [editingMostLikedComments, setEditingMostLikedComments] = useState(null)

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
    const isMostLikedComments = tab === 'most_liked_comments'
    const targetList = isMostViewed ? mostViewedReels : (isMostLiked ? mostLikedPosts : (isMostLikedReels ? mostLikedReels : (isMostLikedComments ? mostLikedComments : viralReels)))
    const setList = isMostViewed ? setMostViewedReels : (isMostLiked ? setMostLikedPosts : (isMostLikedReels ? setMostLikedReels : (isMostLikedComments ? setMostLikedComments : setViralReels)))
    const dbTable = isMostViewed ? 'most_viewed_reels' : (isMostLiked ? 'most_liked_posts' : (isMostLikedReels ? 'most_liked_reels' : (isMostLikedComments ? 'most_liked_comments' : 'viral_reels')))

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
    const isMostLikedComments = tab === 'most_liked_comments'
    const targetList = isMostViewed ? mostViewedReels : (isMostLiked ? mostLikedPosts : (isMostLikedReels ? mostLikedReels : (isMostLikedComments ? mostLikedComments : viralReels)))
    const setList = isMostViewed ? setMostViewedReels : (isMostLiked ? setMostLikedPosts : (isMostLikedReels ? setMostLikedReels : (isMostLikedComments ? setMostLikedComments : setViralReels)))
    const dbTable = isMostViewed ? 'most_viewed_reels' : (isMostLiked ? 'most_liked_posts' : (isMostLikedReels ? 'most_liked_reels' : (isMostLikedComments ? 'most_liked_comments' : 'viral_reels')))

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



  const [liveDate, setLiveDate] = useState('')
  const [trendingEnabled, setTrendingEnabled] = useState(true)
  const [showSocialAudit, setShowSocialAudit] = useState(true)
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
  const [presetPostValues, setPresetPostValues] = useState(null)
  const [refreshing, setRefreshing] = useState(null)

  const [refreshProgress, setRefreshProgress] = useState(null)

  const handleRefreshStats = (cel) => {
    if (!cel.instagram_handle) return alert('No Instagram handle set for this profile!');
    window.open(`/admin/scrape?id=${cel.id}&handle=${cel.instagram_handle}`, '_blank');
  }

  const openPostFormForHighlight = async (cel, highlightKey) => {
    setTab('posts')
    setFilterCelId(cel.id)
    setLoadingData(true)
    try {
      const res = await adminFetch(`/api/admin/posts?celebrity_id=${cel.id}`)
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
        const existing = data.posts.find(p => p[highlightKey] === true)
        if (existing) {
          setPresetPostValues(null)
          setEditingPost(existing)
        } else {
          setEditingPost(null)
          setPresetPostValues({
            celebrity_id: cel.id,
            post_type: highlightKey === 'is_most_viewed' ? 'reel' : 'post',
            is_most_liked: highlightKey === 'is_most_liked',
            is_most_commented: highlightKey === 'is_most_commented',
            is_most_viewed: highlightKey === 'is_most_viewed',
            is_first_post: highlightKey === 'is_first_post'
          })
          setShowPostForm(true)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingData(false)
    }
  }

  const [searchCel, setSearchCel] = useState('')
  const [searchPost, setSearchPost] = useState('')
  const [searchNews, setSearchNews] = useState('')
  const [searchMostFollowed, setSearchMostFollowed] = useState('')
  const [searchViralReels, setSearchViralReels] = useState('')
  const [searchMostViewedReels, setSearchMostViewedReels] = useState('')
  const [searchMostLikedReels, setSearchMostLikedReels] = useState('')
  const [searchMostLikedPosts, setSearchMostLikedPosts] = useState('')
  const [searchMostLikedComments, setSearchMostLikedComments] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
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

    const handleUnauthorized = () => setAuthed(false)
    window.addEventListener('admin_unauthorized', handleUnauthorized)
    return () => window.removeEventListener('admin_unauthorized', handleUnauthorized)
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
      if (dateRes.ok) {
        const dateData = await dateRes.json()
        setLiveDate(dateData.settings?.live_date || '')
        setTrendingEnabled(dateData.settings?.trending_enabled !== undefined ? dateData.settings.trending_enabled : true)
        setShowSocialAudit(dateData.settings?.show_social_audit !== undefined ? dateData.settings.show_social_audit : true)
        setInstagramSessionId(dateData.settings?.instagram_session_id || '')
        setInstagramCsrfToken(dateData.settings?.instagram_csrf_token || '')
      }

      if (tab === 'celebrities' || tab === 'posts') {
        const celRes = await adminFetch('/api/admin/celebrities')
        if (celRes.ok) {
          const celData = await celRes.json()
          setCelebrities(celData.celebrities || [])
        }
      }
      if (tab === 'posts') {
        const url = filterCelId ? `/api/admin/posts?celebrity_id=${filterCelId}` : '/api/admin/posts'
        const postRes = await adminFetch(url)
        if (postRes.ok) {
          const postData = await postRes.json()
          setPosts(postData.posts || [])
        }
      }
      if (tab === 'most_followed') {
        const res = await adminFetch('/api/admin/most_followed')
        if (res.ok) {
          const data = await res.json()
          setMostFollowed(data.profiles || [])
        }
      }
      if (tab === 'voting_management') {
        const res = await adminFetch('/api/admin/most_followed')
        if (res.ok) {
          const data = await res.json()
          setMostFollowed(data.profiles || [])
        }
      }
      if (tab === 'visitors') {
        const res = await adminFetch('/api/admin/visits')
        if (res.ok) {
          const data = await res.json()
          setVisits(data.visits || [])
        }
      }

      if (tab === 'reels') {
        const res = await adminFetch('/api/admin/viral_reels')
        if (res.ok) {
          const data = await res.json()
          setViralReels(data.reels || [])
        }
      }
      if (tab === 'most_viewed_reels') {
        const res = await adminFetch('/api/admin/most_viewed_reels')
        if (res.ok) {
          const data = await res.json()
          setMostViewedReels(data.reels || [])
        }
      }
      if (tab === 'most_liked_posts') {
        const res = await adminFetch('/api/admin/most_liked_posts')
        if (res.ok) {
          const data = await res.json()
          setMostLikedPosts(data.posts || [])
        }
      }
      if (tab === 'most_liked_reels') {
        const res = await adminFetch('/api/admin/most_liked_reels')
        if (res.ok) {
          const data = await res.json()
          setMostLikedReels(data.reels || [])
        }
      }
      if (tab === 'most_liked_comments') {
        const res = await adminFetch('/api/admin/most_liked_comments')
        if (res.ok) {
          const data = await res.json()
          setMostLikedComments(data.comments || data.reels || [])
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const deleteMostFollowed = async (id) => {
    if (!confirm('Delete this profile from most followed?')) return
    await adminFetch('/api/admin/most_followed', { method: 'DELETE', body: { id } })
    setMostFollowed(p => p.filter(x => x.id !== id))
    showToast('✅ Profile deleted')
  }

  const handleUpdateFollowers = async (id) => {
    setUpdatingFollowersId(id)
    try {
      const res = await adminFetch('/api/admin/most_followed', {
        method: 'PUT',
        body: { id, action: 'scrape_followers' }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      // Update local state with the new followers count
      setMostFollowed(profiles => profiles.map(p => p.id === id ? data.profile : p))
      showToast('✨ Followers count updated successfully!')
    } catch (err) {
      alert('Error updating followers: ' + err.message)
    } finally {
      setUpdatingFollowersId(null)
    }
  }

  const handleSaveHandle = async (profile, index, shouldFetch = false) => {
    const newHandle = tempHandles[profile.id] !== undefined ? tempHandles[profile.id].trim() : (profile.instagram_handle || '').trim()
    
    setUpdatingFollowersId(profile.id)
    try {
      // 1. Save the handle (using original profile data for other columns)
      const saveRes = await adminFetch('/api/admin/most_followed', {
        method: 'PUT',
        body: {
          id: profile.id,
          name: profile.name,
          photo_url: profile.photo_url,
          followers_count: profile.followers_count,
          followers_text: profile.followers_text,
          order_index: profile.order_index,
          category: profile.category,
          language: profile.language,
          instagram_handle: newHandle || null
        }
      })
      const saveData = await saveRes.json()
      if (saveData.error) throw new Error(saveData.error)
      
      // Update local profiles list
      setMostFollowed(profiles => profiles.map(p => p.id === profile.id ? saveData.profile : p))
      showToast('✅ Handle saved successfully!')

      // 2. Fetch/Scrape if requested
      if (shouldFetch) {
        if (!newHandle) {
          alert('Cannot fetch without an Instagram handle!')
          setUpdatingFollowersId(null)
          return
        }
        
        const fetchRes = await adminFetch('/api/admin/most_followed', {
          method: 'PUT',
          body: { id: profile.id, action: 'scrape_followers' }
        })
        const fetchData = await fetchRes.json()
        if (fetchData.error) throw new Error(fetchData.error)
        
        setMostFollowed(profiles => profiles.map(p => p.id === profile.id ? fetchData.profile : p))
        showToast('✨ Followers count updated successfully!')

        // Automatically move to the next profile!
        setTimeout(() => {
          const nextInput = document.getElementById(`handle-input-${index + 1}`)
          if (nextInput) {
            nextInput.focus()
            nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setUpdatingFollowersId(null)
    }
  }

  const getProfileCountForCategory = (lang, catName) => {
    return mostFollowed.filter(profile => {
      const matchesLang = !lang || lang === 'All' || profile.language === lang || (lang === 'Global' && !profile.language)
      if (!matchesLang) return false
      if (!profile.category) return false
      
      let matchesCat = false
      profile.category.split(',').forEach(c => {
        const trimmed = c.trim()
        if (trimmed.includes(':')) {
          const parts = trimmed.split(':')
          if (parts[0] && parts[0].trim().toLowerCase() === catName.toLowerCase()) matchesCat = true
        } else if (trimmed.toLowerCase() === catName.toLowerCase()) {
          matchesCat = true
        }
      })
      return matchesCat
    }).length
  }

  const handleStartBatchUpdate = async () => {
    const lang = selectedBatchLang
    const cat = selectedBatchCategory
    if (!cat) {
      alert("Please select a category word first!")
      return
    }

    const targets = mostFollowed.filter(profile => {
      const matchesLang = !lang || lang === 'All' || profile.language === lang || (lang === 'Global' && !profile.language)
      if (!matchesLang) return false
      if (!profile.category) return false
      
      let matchesCat = false
      profile.category.split(',').forEach(c => {
        const trimmed = c.trim()
        if (trimmed.includes(':')) {
          const parts = trimmed.split(':')
          if (parts[0] && parts[0].trim().toLowerCase() === cat.toLowerCase()) matchesCat = true
        } else if (trimmed.toLowerCase() === cat.toLowerCase()) {
          matchesCat = true
        }
      })
      return matchesCat
    })

    if (targets.length === 0) {
      alert("No profiles match the selected language and category.")
      return
    }

    if (!confirm(`Are you sure you want to update ${targets.length} profiles in category "${cat}"? This will process them one by one with a 2.5-second delay to protect rate limits.`)) {
      return
    }

    setBatchUpdating(true)
    setBatchProgressCurrent(0)
    setBatchProgressTotal(targets.length)
    setBatchStatusMessage(`Starting batch update for ${targets.length} profiles...`)
    setBatchErrorLog('')
    abortBatchRef.current = false

    for (let i = 0; i < targets.length; i++) {
      if (abortBatchRef.current) {
        setBatchStatusMessage(`🛑 Batch update stopped by user at ${i} / ${targets.length} profiles.`)
        break
      }

      const profile = targets[i]
      setBatchStatusMessage(`🔄 [${i + 1}/${targets.length}] Updating ${profile.name}...`)

      if (!profile.instagram_handle) {
        setBatchProgressCurrent(i + 1)
        continue
      }

      try {
        const res = await adminFetch('/api/admin/most_followed', {
          method: 'PUT',
          body: { id: profile.id, action: 'scrape_followers' }
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setMostFollowed(profiles => profiles.map(p => p.id === profile.id ? data.profile : p))
      } catch (err) {
        setBatchErrorLog(`Failed on profile "${profile.name}": ${err.message}`)
        setBatchStatusMessage(`❌ Batch update halted due to error on "${profile.name}".`)
        break
      }

      setBatchProgressCurrent(i + 1)

      if (i < targets.length - 1 && !abortBatchRef.current) {
        setBatchStatusMessage(`⏳ [${i + 1}/${targets.length}] Waiting 2.5 seconds to respect rate limits...`)
        await new Promise(resolve => setTimeout(resolve, 2500))
      }
    }

    if (!abortBatchRef.current && !batchErrorLog) {
      setBatchStatusMessage(`✅ Batch update complete! All ${targets.length} profiles updated successfully.`)
    }
    setBatchUpdating(false)
  }

  const handleScrapeAllAccounts = async () => {
    const withHandles = mostFollowed.filter(p => p.instagram_handle && p.instagram_handle.trim() !== '')
    const total = withHandles.length
    const estMinutes = Math.ceil((total * 3.5) / 60)
    if (!confirm(`🚀 Scrape ALL ${total} accounts with Instagram handles?\n\nThis runs sequentially with a 3.5-second safety delay between each account to prevent rate limits.\n\nEstimated time: ~${estMinutes} minutes.\n\nDo NOT close this tab until it finishes!`)) return

    setAllScrapeRunning(true)
    setAllScrapeResult(null)
    setAllScrapeLogs([])
    setAllScrapeProgress({ current: 0, total, percent: 0, currentName: '', currentHandle: '', status: 'Starting batch scrape...', updated: 0, failed: 0 })
    allScrapeAbortRef.current = new AbortController()

    try {
      const token = getToken()
      const res = await fetch('/api/admin/batch_scrape_followers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        signal: allScrapeAbortRef.current.signal
      })

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'start') {
                setAllScrapeProgress(prev => ({ ...prev, total: data.total }))
              } else if (data.type === 'progress') {
                setAllScrapeProgress({
                  current: data.current,
                  total: data.total,
                  percent: data.percent,
                  currentName: data.name,
                  currentHandle: data.handle,
                  status: data.status,
                  updated: data.updated,
                  failed: data.failed
                })
                setAllScrapeLogs(prev => [
                  ...prev.slice(-40),
                  {
                    timestamp: new Date().toLocaleTimeString(),
                    handle: data.handle,
                    name: data.name,
                    status: data.status,
                    text: data.formattedText,
                    error: data.error
                  }
                ])
              } else if (data.type === 'complete') {
                setAllScrapeResult(data)
                setAllScrapeRunning(false)
                showToast(`🎉 Batch scrape complete! ${data.updated} updated, ${data.failed} failed.`)
                // Refresh table to show updated counts immediately
                const loadRes = await adminFetch('/api/admin/most_followed')
                const loadData = await loadRes.json()
                setMostFollowed(loadData.profiles || [])
              }
            } catch (e) {
              console.error('Failed to parse SSE line:', e)
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Batch scraping stopped by admin.')
      } else {
        setAllScrapeResult({ error: err.message })
      }
      setAllScrapeRunning(false)
    }
  }

  const handleAbortAllScrape = () => {
    if (allScrapeAbortRef.current) {
      allScrapeAbortRef.current.abort()
    }
    setAllScrapeRunning(false)
  }

  const handleRefreshTrendingReels = async (targetTable = 'viral_reels') => {
    let list = viralReels
    let sectionName = 'Trending Reels'
    let metricName = 'engagement stats (views, likes, comments)'
    let endpoint = '/api/admin/viral_reels'
    let setFunc = setViralReels

    if (targetTable === 'most_viewed_reels') {
      list = mostViewedReels
      sectionName = 'Most Viewed Reels'
      metricName = 'views & stats'
      endpoint = '/api/admin/most_viewed_reels'
      setFunc = setMostViewedReels
    } else if (targetTable === 'most_liked_reels') {
      list = mostLikedReels
      sectionName = 'Most Liked Reels'
      metricName = 'likes & stats'
      endpoint = '/api/admin/most_liked_reels'
      setFunc = setMostLikedReels
    } else if (targetTable === 'most_liked_posts') {
      list = mostLikedPosts
      sectionName = 'Most Liked Posts'
      metricName = 'likes & stats'
      endpoint = '/api/admin/most_liked_posts'
      setFunc = setMostLikedPosts
    }

    const total = list.length
    if (total === 0) {
      alert(`No items found in ${sectionName} to refresh.`)
      return
    }
    if (!confirm(`⚡ Refresh latest ${metricName} and auto-rank all ${total} items in ${sectionName}?\n\nThis runs sequentially with a safety delay to protect against rate limits.`)) return

    setTrendingScrapeRunning(true)
    setTrendingScrapeResult(null)
    setTrendingScrapeLogs([])
    setTrendingScrapeProgress({ current: 0, total, percent: 0, currentTitle: '', status: `Starting ${sectionName} scraper...`, updated: 0, failed: 0 })
    trendingScrapeAbortRef.current = new AbortController()

    try {
      const token = getToken()
      const res = await fetch('/api/admin/refresh_trending_reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || ''
        },
        body: JSON.stringify({ table: targetTable }),
        signal: trendingScrapeAbortRef.current.signal
      })

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'start') {
                setTrendingScrapeProgress(prev => ({ ...prev, total: data.total }))
              } else if (data.type === 'progress') {
                setTrendingScrapeProgress({
                  current: data.current,
                  total: data.total,
                  percent: data.percent,
                  currentTitle: data.title,
                  status: data.status,
                  updated: data.updated,
                  failed: data.failed
                })
                setTrendingScrapeLogs(prev => [
                  ...prev.slice(-30),
                  {
                    timestamp: new Date().toLocaleTimeString(),
                    title: data.title,
                    creator: data.creator,
                    viewsText: data.viewsText,
                    likesText: data.likesText,
                    status: data.status,
                    error: data.error
                  }
                ])
              } else if (data.type === 'complete') {
                setTrendingScrapeResult(data)
                setTrendingScrapeRunning(false)
                showToast(`🎉 ${sectionName} refreshed & reordered! ${data.updated} updated.`)
                
                // Refresh table data
                const loadRes = await adminFetch(endpoint)
                const loadData = await loadRes.json()
                setFunc(loadData.reels || loadData.posts || [])
              }
            } catch (e) {
              console.error('Failed to parse SSE line:', e)
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        showToast(`${sectionName} scraper stopped by admin.`)
      } else {
        setTrendingScrapeResult({ error: err.message })
      }
      setTrendingScrapeRunning(false)
    }
  }

  const handleAbortTrendingScrape = () => {
    if (trendingScrapeAbortRef.current) {
      trendingScrapeAbortRef.current.abort()
    }
    setTrendingScrapeRunning(false)
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

  const deleteMostLikedComment = async (id) => {
    if (!confirm('Delete this most liked comment?')) return
    await adminFetch('/api/admin/most_liked_comments', { method: 'DELETE', body: { id } })
    setMostLikedComments(comments => comments.filter(x => x.id !== id))
    showToast('✅ Comment deleted')
  }

  const saveGlobalSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await adminFetch('/api/admin/live_settings', {
        method: 'PUT',
        body: { 
          live_date: liveDate,
          trending_enabled: trendingEnabled,
          show_social_audit: showSocialAudit,
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

  const saveCookiesSettings = async () => {
    setSavingCookies(true)
    try {
      const res = await adminFetch('/api/admin/live_settings', {
        method: 'PUT',
        body: { 
          live_date: liveDate,
          trending_enabled: trendingEnabled,
          show_social_audit: showSocialAudit,
          instagram_session_id: instagramSessionId,
          instagram_csrf_token: instagramCsrfToken
        }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showToast('🔑 Scraper credentials updated successfully!')
      setCookiesLocked(true)
    } catch(e) {
      alert('Error saving credentials: ' + e.message)
    } finally {
      setSavingCookies(false)
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

  // (toggleSocialAudit and toggleAllSocialAudit removed — now a single global setting in Global Settings tab)


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
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#e8f5e9', border: '1px solid #4caf50',
          color: '#2e7d32', padding: '12px 20px',
          borderRadius: 10, fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          {toast}
        </div>
      )}

      {/* 🚀 Persistent Background Batch Scraper Widget (Visible across all tabs) */}
      {allScrapeRunning && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9998,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 16,
          padding: '14px 18px',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          maxWidth: 460,
          width: 'calc(100% - 48px)'
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>
                Batch Scraping ({allScrapeProgress.current}/{allScrapeProgress.total})
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#34d399' }}>
                {allScrapeProgress.percent}%
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ width: `${allScrapeProgress.percent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Processing: <strong style={{ color: '#38bdf8' }}>@{allScrapeProgress.currentHandle || '...'}</strong> &nbsp;·&nbsp; ✅ {allScrapeProgress.updated} &nbsp;·&nbsp; ❌ {allScrapeProgress.failed}
            </div>
          </div>
          <button
            onClick={handleAbortAllScrape}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            Stop
          </button>
        </div>
      )}

      {/* ⚡ Persistent Trending Reels Batch Scraper Widget */}
      {trendingScrapeRunning && (
        <div style={{
          position: 'fixed',
          bottom: allScrapeRunning ? 100 : 24,
          left: 24,
          zIndex: 9998,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: 16,
          padding: '14px 18px',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(168, 85, 247, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          maxWidth: 460,
          width: 'calc(100% - 48px)'
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px #a855f7', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>
                Trending Reels Scraper ({trendingScrapeProgress.current}/{trendingScrapeProgress.total})
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#c084fc' }}>
                {trendingScrapeProgress.percent}%
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ width: `${trendingScrapeProgress.percent}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #ec4899)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Scraping: <strong style={{ color: '#e879f9' }}>{trendingScrapeProgress.currentTitle || '...'}</strong> &nbsp;·&nbsp; ✅ {trendingScrapeProgress.updated} &nbsp;·&nbsp; ❌ {trendingScrapeProgress.failed}
            </div>
          </div>
          <button
            onClick={handleAbortTrendingScrape}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            Stop
          </button>
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
            { id: 'most_liked_comments', label: '💬 Most Liked Comments' },
            { id: 'most_followed', label: '📊 Most Followed' },
            { id: 'voting_management', label: '🏆 Voting Management' },
            { id: 'visitors', label: '👥 Visitors' },
            
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
                setShowMostLikedCommentsForm(false)
                setEditingMostLikedComments(null)
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

            {/* Instagram Scraper Sessions Credentials (global config) */}
            <div className="card" style={{ marginBottom: 28, padding: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                🔑 Instagram Scraper Authentication Session
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
                Paste your full Instagram <strong>Cookie Header</strong> string below (copied from browser DevTools). This contains your session credentials and device IDs, which completely prevents Instagram from flagging your scraper as a bot.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                  Full Instagram Cookie String
                </label>
                <textarea
                  className="input-field"
                  value={instagramSessionId}
                  onChange={e => setInstagramSessionId(e.target.value)}
                  placeholder={cookiesLocked ? "••••••••••••••••••••••••••••••••••••••••" : "Paste full Cookie string (e.g., mid=...; ig_did=...; csrftoken=...; sessionid=...)"}
                  style={{ fontSize: 12, width: '100%', minHeight: 70, resize: 'vertical', fontFamily: 'monospace' }}
                  disabled={cookiesLocked}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {cookiesLocked ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setCookiesLocked(false)}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    🔓 Edit Credentials
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setCookiesLocked(true);
                        // Reset to original values
                        loadData();
                      }}
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={saveCookiesSettings}
                      disabled={savingCookies}
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      {savingCookies ? 'Saving...' : '💾 Save & Lock'}
                    </button>
                  </>
                )}
              </div>
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

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                className="input-field"
                value={searchCel}
                onChange={e => setSearchCel(e.target.value)}
                placeholder="🔍 Search celebrities by name or handle..."
                style={{ flex: 1, minWidth: 200 }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {}}
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
                    <div key={cel.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 16, background: 'var(--surface)' }}>
                      {/* Row 1: Profile */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
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
                              <span style={{ marginLeft: 8, color: '#4caf50', fontWeight: 600 }}>✓ Add Search</span>
                            ) : (
                              <span style={{ marginLeft: 8, color: '#ff9800', fontWeight: 600 }}>⚠️ No Search ({cel.request_count || 0} requests)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(255, 255, 255, 0.05)' }}
                          onClick={() => handleRefreshStats(cel)}
                          disabled={refreshing === cel.id}
                        >
                          {refreshing === cel.id ? (refreshProgress || '🔄 Scraping...') : '🔄 Refresh Stats'}
                        </button>
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
                              tags: '',
                              most_liked_count: cel.most_liked_count || '',
                              most_commented_count: cel.most_commented_count || '',
                              most_viewed_count: cel.most_viewed_count || ''
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

                      {/* Row 2: Highlights Shortcuts */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        paddingTop: 10,
                        borderTop: '1px dashed var(--border)',
                        marginTop: 4
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>
                          ⚡ Highlights Manager:
                        </span>
                        <button
                          onClick={() => openPostFormForHighlight(cel, 'is_most_liked')}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                            padding: '5px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          ❤️ Most Liked
                        </button>
                        <button
                          onClick={() => openPostFormForHighlight(cel, 'is_most_commented')}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                            padding: '5px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          💬 Most Commented
                        </button>
                        <button
                          onClick={() => openPostFormForHighlight(cel, 'is_most_viewed')}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                            padding: '5px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          👁 Most Viewed
                        </button>
                        <button
                          onClick={() => openPostFormForHighlight(cel, 'is_first_post')}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                            padding: '5px 10px', fontSize: 11.5, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          ⭐ First Post
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
                onClose={() => { setShowPostForm(false); setEditingPost(null); setPresetPostValues(null); }}
                title={editingPost ? '✏️ Edit Post' : '➕ Add New Post'}
              >
                <PostForm
                  celebrities={celebrities}
                  initial={editingPost ? {
                    ...editingPost,
                    tags: (editingPost.tags || []).join(', ')
                  } : null}
                  presetValues={presetPostValues}
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
                  const groupedByCel = {}
                  filtered.forEach(post => {
                    const celId = post.celebrity_id || 'unassigned'
                    if (!groupedByCel[celId]) groupedByCel[celId] = []
                    groupedByCel[celId].push(post)
                  })

                  return Object.keys(groupedByCel).map(celId => {
                    const cel = celebrities.find(c => c.id === celId)
                    const celName = cel ? cel.name : 'General / Unassigned Posts'
                    const celPosts = groupedByCel[celId]
                    const isExpanded = expandedCels[celId]

                    return (
                      <div key={celId} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                        {/* Folder Header */}
                        <div 
                          onClick={() => setExpandedCels(prev => ({ ...prev, [celId]: !prev[celId] }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            background: 'var(--surface2)',
                            cursor: 'pointer',
                            userSelect: 'none',
                            borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--border-bright)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                            <span style={{ fontSize: 20 }}>📁</span>
                            <span style={{ color: 'var(--text)' }}>{celName}</span>
                            <span style={{
                              fontSize: 12,
                              background: 'var(--accent)',
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: 100,
                              fontWeight: 600
                            }}>
                              {celPosts.length} {celPosts.length === 1 ? 'post' : 'posts'}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                            {isExpanded ? '▼ Collapse' : '▶ Expand'}
                          </div>
                        </div>

                        {/* Folder Contents (only visible when expanded) */}
                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, background: 'var(--surface)' }}>
                            {celPosts.map(post => (
                              <div key={post.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface2)', padding: 16 }}>
                                <PostCard post={post} />

                                {post.playlist_name && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 4 }}>
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
                            ))}
                          </div>
                        )}
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
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>
              The date on the top-right corner of the <span style={{ color: 'var(--accent)', fontWeight: 700 }}>/live</span> page is now <strong>fully automated</strong> by calendar time. It dynamically displays the current local date to visitors.
            </div>
            <div style={{ 
              fontSize: 13, 
              padding: '12px 14px', 
              background: 'rgba(245,158,11,0.08)', 
              border: '1px dashed rgba(245,158,11,0.3)', 
              borderRadius: '8px',
              color: '#d97706',
              lineHeight: 1.5,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <div>
                <strong>Scraping Tip:</strong> Both this admin panel and your live website share the <strong>exact same database</strong>. To protect your Instagram session and avoid rate limits (HTTP 429 errors) on Vercel, run scraping updates from your laptop's <strong>localhost</strong>. Updates will sync to your live site instantly!
              </div>
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

            {/* 🔄 Batch Scraper Control Center */}
            <div className="card" style={{ marginBottom: 24, padding: '20px', background: 'var(--surface)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                🔄 Batch Scraper Control Center
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
                Select a language and a category filter pill below to update follower counts for that entire category in a single run. A 2.5-second safety delay will run between requests.
              </p>

              {/* Language Filters Row */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>1. Select Language:</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['All', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Global'].map(lang => {
                    const isSelected = selectedBatchLang === lang;
                    return (
                      <button
                        key={lang}
                        className="btn"
                        onClick={() => {
                          if (batchUpdating) return;
                          setSelectedBatchLang(lang);
                          setSelectedBatchCategory(''); // Reset category when language changes
                        }}
                        style={{
                          fontSize: 12,
                          padding: '6px 12px',
                          background: isSelected ? 'var(--accent)' : 'var(--surface2)',
                          color: isSelected ? '#ffffff' : 'var(--text)',
                          border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                          cursor: batchUpdating ? 'not-allowed' : 'pointer',
                          opacity: batchUpdating ? 0.6 : 1
                        }}
                        disabled={batchUpdating}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Pills Row */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>2. Select Category Filter:</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Creators', 'Influencers', 'Actors', 'Meme Pages', 'Personalities', 'Sports', 'Politicians', 'Handles', 'Singers'].map(cat => {
                    const isSelected = selectedBatchCategory === cat;
                    const count = getProfileCountForCategory(selectedBatchLang, cat);
                    return (
                      <button
                        key={cat}
                        className="btn"
                        onClick={() => {
                          if (batchUpdating) return;
                          setSelectedBatchCategory(cat);
                        }}
                        style={{
                          fontSize: 11,
                          padding: '5px 10px',
                          background: isSelected ? 'var(--accent)' : 'var(--surface2)',
                          color: isSelected ? '#ffffff' : 'var(--text)',
                          border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                          cursor: batchUpdating ? 'not-allowed' : 'pointer',
                          opacity: batchUpdating ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        disabled={batchUpdating}
                      >
                        <span>{cat}</span>
                        <span style={{
                          background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontSize: 10
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Run Control & Counter Display */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div>
                  {selectedBatchCategory ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      📋 {getProfileCountForCategory(selectedBatchLang, selectedBatchCategory)} profile(s) found in <span style={{ color: 'var(--accent)' }}>{selectedBatchLang} &rarr; {selectedBatchCategory}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Please select a category filter above to get started.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {batchUpdating ? (
                    <button
                      className="btn"
                      onClick={() => {
                        abortBatchRef.current = true;
                        setBatchStatusMessage('⏳ Abort request received. Halting batch on next step...');
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        background: 'rgba(255,82,82,0.1)',
                        border: '1px solid rgba(255,82,82,0.3)',
                        color: '#ff5252'
                      }}
                    >
                      🛑 Stop Update
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleStartBatchUpdate}
                      disabled={!selectedBatchCategory || getProfileCountForCategory(selectedBatchLang, selectedBatchCategory) === 0}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        opacity: (selectedBatchCategory && getProfileCountForCategory(selectedBatchLang, selectedBatchCategory) > 0) ? 1 : 0.6,
                        cursor: (selectedBatchCategory && getProfileCountForCategory(selectedBatchLang, selectedBatchCategory) > 0) ? 'pointer' : 'not-allowed'
                      }}
                    >
                      🚀 Start Batch Update
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Display */}
              {(batchUpdating || batchStatusMessage) && (
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text)' }}>{batchStatusMessage}</span>
                    {batchProgressTotal > 0 && (
                      <span style={{ color: 'var(--text-muted)' }}>{batchProgressCurrent} of {batchProgressTotal} updated</span>
                    )}
                  </div>
                  {batchProgressTotal > 0 && (
                    <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                      <div
                        style={{
                          width: `${(batchProgressCurrent / batchProgressTotal) * 100}%`,
                          height: '100%',
                          background: 'var(--gradient)',
                          borderRadius: 4,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  )}
                  {batchErrorLog && (
                    <div style={{ color: '#ff5252', fontSize: 12, fontWeight: 500, marginTop: 8, padding: 8, background: 'rgba(255,82,82,0.08)', borderRadius: 6, border: '1px solid rgba(255,82,82,0.15)' }}>
                      ⚠️ {batchErrorLog}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 🌐 Scrape ALL Accounts — Server-Side Nightly Run */}
            <div className="card" style={{ marginBottom: 24, padding: '24px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
                  🌐 Scrape ALL Accounts — Nightly Batch Run
                </h3>
                {allScrapeRunning && (
                  <button
                    onClick={handleAbortAllScrape}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⏹️ Stop Batch
                  </button>
                )}
              </div>
              
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                Runs a sequential scrape for every account with an Instagram handle. Uses a <strong>3.5-second safety delay</strong> between each request. Broken or invalid usernames are gracefully skipped without stopping the batch.
              </p>

              {allScrapeRunning ? (
                <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, padding: '18px 20px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
                  {/* Progress Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="spinner" style={{ width: 18, height: 18 }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#09090b' }}>
                        Scraping in progress... [{allScrapeProgress.current} / {allScrapeProgress.total}]
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#059669', fontFamily: 'var(--font-display)' }}>
                      {allScrapeProgress.percent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: 12, background: '#f4f4f5', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ width: `${allScrapeProgress.percent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', transition: 'width 0.3s ease' }} />
                  </div>

                  {/* Real-time Status Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 12, marginBottom: 14 }}>
                    <div style={{ color: '#09090b', fontWeight: 600 }}>
                      Currently processing: <strong style={{ color: '#0284c7' }}>@{allScrapeProgress.currentHandle || '...'}</strong> {allScrapeProgress.currentName ? `(${allScrapeProgress.currentName})` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: '#059669', fontWeight: 700 }}>✅ {allScrapeProgress.updated} Updated</span>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>❌ {allScrapeProgress.failed} Skipped</span>
                    </div>
                  </div>

                  {/* Live Mini Log Feed */}
                  {allScrapeLogs.length > 0 && (
                    <div style={{ maxHeight: 130, overflowY: 'auto', background: '#fafafa', border: '1px solid #f4f4f5', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontFamily: 'monospace' }}>
                      {allScrapeLogs.slice(-6).map((l, idx) => (
                        <div key={idx} style={{ color: l.status === 'success' ? '#059669' : '#dc2626', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#a1a1aa' }}>[{l.timestamp}]</span>
                          <span>{l.status === 'success' ? `✅ @${l.handle} -> ${l.text}` : `⚠️ @${l.handle} skipped: ${l.error}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleScrapeAllAccounts}
                    style={{
                      padding: '12px 24px',
                      fontSize: 14,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                    }}
                  >
                    🚀 Scrape All {mostFollowed.filter(p => p.instagram_handle).length} Accounts Now
                  </button>
                </div>
              )}

              {/* Completion Result Card */}
              {allScrapeResult && !allScrapeRunning && (
                <div style={{
                  marginTop: 18,
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: allScrapeResult.error ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${allScrapeResult.error ? '#fecaca' : '#bbf7d0'}`,
                  fontSize: 13
                }}>
                  {allScrapeResult.error ? (
                    <div style={{ color: '#dc2626', fontWeight: 700 }}>❌ Error: {allScrapeResult.error}</div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: 14, marginBottom: 6 }}>
                        🎉 Nightly Batch Complete! {allScrapeResult.updated} accounts updated, {allScrapeResult.failed} failed out of {allScrapeResult.total} total.
                      </div>
                      
                      {allScrapeResult.failures?.length > 0 ? (
                        <div style={{ marginTop: 14, background: '#ffffff', border: '1px solid #fee2e2', borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            ⚠️ Unscraped / Skipped Accounts ({allScrapeResult.failures.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                            {allScrapeResult.failures.map((f, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fee2e2' }}>
                                <div>
                                  <span style={{ fontWeight: 800, color: '#09090b', marginRight: 6 }}>{f.name}</span>
                                  <code style={{ color: '#dc2626', fontWeight: 700 }}>@{f.handle}</code>
                                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{f.error}</div>
                                </div>
                                <button
                                  onClick={() => handleEdit(mostFollowed.find(p => p.id === f.id) || f)}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Edit Handle
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#059669', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                          ✨ 100% Success! All accounts scraped cleanly without errors.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchMostFollowed}
                onChange={e => setSearchMostFollowed(e.target.value)}
                placeholder="🔍 Search profiles by name, handle or category..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostFollowed.filter(profile => {
                    const query = searchMostFollowed.toLowerCase();
                    return profile.name?.toLowerCase().includes(query) ||
                           profile.instagram_handle?.toLowerCase().includes(query) ||
                           profile.category?.toLowerCase().includes(query);
                  })
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{profile.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            (Followers: <strong style={{ color: 'var(--text)' }}>{profile.followers_text?.trim() ? profile.followers_text : (profile.followers_count >= 1000000 ? `${(Math.floor(profile.followers_count / 100000) / 10).toString().replace(/\.0$/, '')}M` : profile.followers_count?.toLocaleString() || '—')}</strong>)
                          </span>
                        </div>

                        {/* Inline ID / Handle Editor */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)' }}>Instagram ID:</span>
                          <input
                            id={`handle-input-${index}`}
                            type="text"
                            value={tempHandles[profile.id] !== undefined ? tempHandles[profile.id] : (profile.instagram_handle || '')}
                            onChange={e => setTempHandles(prev => ({ ...prev, [profile.id]: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleSaveHandle(profile, index, true)
                              }
                            }}
                            placeholder="e.g. virat.kohli"
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'var(--surface2)',
                              color: 'var(--text)',
                              fontSize: 12,
                              width: 160
                            }}
                            disabled={updatingFollowersId === profile.id}
                          />
                          <button
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleSaveHandle(profile, index, false)}
                            disabled={updatingFollowersId === profile.id}
                          >
                            💾 Save
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: 11, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleSaveHandle(profile, index, true)}
                            disabled={updatingFollowersId === profile.id}
                          >
                            {updatingFollowersId === profile.id ? '⏳ Scraping...' : '🚀 Save & Fetch'}
                          </button>
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
                          })()}</strong> &nbsp;·&nbsp; Language: <strong style={{ color: 'var(--text)' }}>{profile.language || 'None'}</strong> &nbsp;·&nbsp; Numeric: {profile.followers_count?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => { setEditingMostFollowed({ ...profile, followers_count: profile.followers_count?.toString(), order_index: profile.order_index?.toString(), category: profile.category || '', language: profile.language || '', instagram_handle: profile.instagram_handle || '' }); setShowMostFollowedForm(false) }}>
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
                placeholder="🔍 Search profiles by name, handle or category..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostFollowed.filter(profile => {
                    const query = searchMostFollowed.toLowerCase();
                    return profile.name?.toLowerCase().includes(query) ||
                           profile.instagram_handle?.toLowerCase().includes(query) ||
                           profile.category?.toLowerCase().includes(query);
                  })
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

        {/* ── TRENDING REELS TAB ────────────────────────────────────────── */}
        {tab === 'reels' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                  Trending Reels ({viralReels.length})
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Live 24-hour trending leaderboard with automatic rank momentum calculation
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRefreshTrendingReels('viral_reels')}
                  disabled={trendingScrapeRunning}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    color: '#ffffff',
                    cursor: trendingScrapeRunning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {trendingScrapeRunning ? '⏳ Scraping in Progress...' : '⚡ Refresh & Auto-Rank Reels'}
                </button>
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
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Manual Reorder'}
                </button>
                {!showViralReelsForm && !editingViralReels && (
                  <button className="btn btn-primary" onClick={() => setShowViralReelsForm(true)}>
                    + Add Reel
                  </button>
                )}
              </div>
            </div>

            {/* Trending Scrape Live Card */}
            {(trendingScrapeRunning || trendingScrapeResult) && (
              <div className="card" style={{
                marginBottom: 20,
                padding: '16px 20px',
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--surface2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>
                    {trendingScrapeRunning ? '⚡ Refreshing & Auto-Ranking Reels...' : '🎉 Refresh Complete!'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#a855f7' }}>
                    {trendingScrapeProgress.current} / {trendingScrapeProgress.total} ({trendingScrapeProgress.percent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ width: `${trendingScrapeProgress.percent}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #6366f1)', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✅ {trendingScrapeProgress.updated} Updated</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>❌ {trendingScrapeProgress.failed} Skipped</span>
                </div>
              </div>
            )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                  Most Viewed Reels ({mostViewedReels.length})
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  All-time highest viewed reels ranked automatically by real-time view count
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRefreshTrendingReels('most_viewed_reels')}
                  disabled={trendingScrapeRunning}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                    color: '#ffffff',
                    cursor: trendingScrapeRunning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {trendingScrapeRunning ? '⏳ Scraping in Progress...' : '⚡ Refresh & Auto-Rank Views'}
                </button>
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
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Manual Reorder'}
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
                      setMostViewedReels(r => {
                        const updated = r.map(x => x.id === reel.id ? reel : x)
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.views_text)
                          const countB = parseCountText(b.views_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
                    } else {
                      setMostViewedReels(r => {
                        const updated = [reel, ...r]
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.views_text)
                          const countB = parseCountText(b.views_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
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
                          <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                            {item.show_in_original && (
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>
                                Original
                              </span>
                            )}
                            {item.show_in_all_reels !== false && (
                              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>
                                All
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <a href={item.instagram_link} target="_blank" rel="noopener noreferrer">
                            <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>View Link</button>
                          </a>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => { setTab('most_liked_reels'); setEditingMostLikedReels({ ...item, isCopy: true }); setShowMostLikedReelsForm(false); }}>
                            Copy to Likes
                          </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                  Most Liked Posts ({mostLikedPosts.length})
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  All-time highest liked Instagram posts ranked automatically by real-time like count
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRefreshTrendingReels('most_liked_posts')}
                  disabled={trendingScrapeRunning}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #ff2a5f, #ff6b35)',
                    color: '#ffffff',
                    cursor: trendingScrapeRunning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 42, 95, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {trendingScrapeRunning ? '⏳ Scraping in Progress...' : '⚡ Refresh & Auto-Rank Likes'}
                </button>
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
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Manual Reorder'}
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
                      setMostLikedPosts(r => {
                        const updated = r.map(x => x.id === post.id ? post : x)
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.likes_text)
                          const countB = parseCountText(b.likes_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
                    } else {
                      setMostLikedPosts(r => {
                        const updated = [post, ...r]
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.likes_text)
                          const countB = parseCountText(b.likes_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
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
                          <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                            {item.show_in_most_liked && (
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>
                                Most Liked
                              </span>
                            )}
                            {item.show_in_all_posts !== false && (
                              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>
                                All Posts
                              </span>
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

        {/* ── MOST LIKED COMMENTS TAB ────────────────────────────────────────── */}
        {tab === 'most_liked_comments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                Most Liked Comments ({mostLikedComments.length})
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {!showMostLikedCommentsForm && !editingMostLikedComments && (
                  <button className="btn btn-primary" onClick={() => setShowMostLikedCommentsForm(true)}>
                    + Add Comment
                  </button>
                )}
              </div>
            </div>

            {(showMostLikedCommentsForm || editingMostLikedComments) && (
              <AdminModal
                isOpen={showMostLikedCommentsForm || !!editingMostLikedComments}
                onClose={() => { setShowMostLikedCommentsForm(false); setEditingMostLikedComments(null); }}
                title={editingMostLikedComments ? '✏️ Edit Comment' : '➕ Add Most Liked Comment'}
              >
                <ViralReelsForm
                  apiEndpoint="/api/admin/most_liked_comments"
                  initial={editingMostLikedComments}
                  onSave={(comment) => {
                    if (editingMostLikedComments) {
                      setMostLikedComments(r => {
                        const updated = r.map(x => x.id === comment.id ? comment : x)
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.likes_text)
                          const countB = parseCountText(b.likes_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
                    } else {
                      setMostLikedComments(r => {
                        const updated = [comment, ...r]
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.likes_text)
                          const countB = parseCountText(b.likes_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
                    }
                    setShowMostLikedCommentsForm(false)
                    setEditingMostLikedComments(null)
                    showToast('✅ Comment saved!')
                  }}
                  onCancel={() => { setShowMostLikedCommentsForm(false); setEditingMostLikedComments(null) }}
                />
              </AdminModal>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                value={searchMostLikedComments}
                onChange={e => setSearchMostLikedComments(e.target.value)}
                placeholder="🔍 Search comments by text or creator..."
              />
            </div>

            {loadingData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(() => {
                  const filtered = mostLikedComments.filter(item => 
                    item.title?.toLowerCase().includes(searchMostLikedComments.toLowerCase()) ||
                    item.creator_name?.toLowerCase().includes(searchMostLikedComments.toLowerCase())
                  )
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {mostLikedComments.length === 0 ? "No most liked comments yet. Add your first one! 👆" : "No matching comments found."}
                      </div>
                    )
                  }
                  return filtered.map(item => {
                    const globalIdx = mostLikedComments.findIndex(x => x.id === item.id)
                    const isFirst = globalIdx === 0
                    const isLast = globalIdx === mostLikedComments.length - 1

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

                        {/* Commenter Avatar */}
                        <div className="row-avatar-container" style={{ width: 42, height: 42, flexShrink: 0 }}>
                          <div className="row-avatar-inner">
                            {item.creator_photo_url ? (
                              <img src={item.creator_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : '💬'}
                          </div>
                        </div>
                        
                        {/* Comment Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 13 }}>#{globalIdx + 1}</span>
                            <span style={{ fontWeight: 750, fontSize: 14, color: 'var(--text)' }}>
                              {item.creator_name ? item.creator_name.replace(/^@/, '') : '@anonymous'}
                            </span>
                            {item.created_at && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                · {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-line', marginBottom: 6 }}>
                            {item.title || item.description}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: 'rgba(255, 42, 95, 0.08)',
                              color: '#ff2a5f',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 800
                            }}>
                              ❤️ {item.likes_text || '0'} likes
                            </span>
                            {item.instagram_link && (
                              <a href={item.instagram_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                                View Reel ↗
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'center' }}>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => { setEditingMostLikedComments(item); setShowMostLikedCommentsForm(false) }}>
                            ✏️ Edit Likes / Text
                          </button>
                          <button
                            onClick={() => deleteMostLikedComment(item.id)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                  Most Liked Reels ({mostLikedReels.length})
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  All-time highest liked Instagram reels ranked automatically by real-time like count
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRefreshTrendingReels('most_liked_reels')}
                  disabled={trendingScrapeRunning}
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #ff2a5f, #a855f7)',
                    color: '#ffffff',
                    cursor: trendingScrapeRunning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 42, 95, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {trendingScrapeRunning ? '⏳ Scraping in Progress...' : '⚡ Refresh & Auto-Rank Likes'}
                </button>
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
                  {reorderMode ? '🔒 Done Reordering' : '🔧 Manual Reorder'}
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
                      setMostLikedReels(r => {
                        const updated = r.map(x => x.id === reel.id ? reel : x)
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.likes_text)
                          const countB = parseCountText(b.likes_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
                    } else {
                      setMostLikedReels(r => {
                        const updated = [reel, ...r]
                        return updated.sort((a, b) => {
                          const countA = parseCountText(a.likes_text)
                          const countB = parseCountText(b.likes_text)
                          if (countA !== countB) return countB - countA
                          return new Date(b.created_at) - new Date(a.created_at)
                        })
                      })
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
                            onClick={() => { setTab('most_viewed_reels'); setEditingMostViewedReels({ ...item, isCopy: true }); setShowMostViewedReelsForm(false); }}>
                            Copy to Views
                          </button>
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

              {/* Social Audit Benchmarks Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Show Social Audit Benchmarks</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>When ON, every profile page displays the "Social Audit Benchmarks" analysis section. When OFF, it is hidden on ALL profiles at once.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={showSocialAudit}
                  onChange={(e) => setShowSocialAudit(e.target.checked)}
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
