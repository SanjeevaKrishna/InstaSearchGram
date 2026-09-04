import React, { useState, useEffect, useMemo } from 'react'
import { MessageSquare, Search, Trash2, Edit3, Check, X, ArrowLeft, RefreshCw, ExternalLink, Sparkles, User, Layers, List } from 'lucide-react'

export default function AdminCommentManager({ mostFollowed = [], celebrities = [], adminFetch }) {
  // Active section: 'live' (most_followed profiles) or 'celebrity' (celebrities)
  const [section, setSection] = useState('live')

  // View mode within section: 'feed' (all comments feed) or 'accounts' (browse by account)
  const [viewMode, setViewMode] = useState('feed')

  // Accounts state (with automatic self-fetching fallback)
  const [liveAccounts, setLiveAccounts] = useState(mostFollowed || [])
  const [celebAccounts, setCelebAccounts] = useState(celebrities || [])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  // Summary counts { [slug]: count }
  const [summaryCounts, setSummaryCounts] = useState({})
  const [loadingSummary, setLoadingSummary] = useState(true)

  // Recent comments feed for active section
  const [feedComments, setFeedComments] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  // Selected account for account-specific thread view
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [accountComments, setAccountComments] = useState([])
  const [loadingAccountComments, setLoadingAccountComments] = useState(false)

  // Search & filter
  const [search, setSearch] = useState('')
  const [onlyWithComments, setOnlyWithComments] = useState(false)

  // Editing comment state
  const [editingComment, setEditingComment] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Deleting comment ID
  const [deletingId, setDeletingId] = useState(null)
  const [actionNotice, setActionNotice] = useState('')

  // Show temporary notice
  const notify = (msg) => {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(''), 3500)
  }

  // Self-fetch accounts if props were initially empty
  useEffect(() => {
    if (mostFollowed && mostFollowed.length > 0) {
      setLiveAccounts(mostFollowed)
    } else {
      adminFetch('/api/admin/most_followed')
        .then(res => res.json())
        .then(data => setLiveAccounts(data.profiles || []))
        .catch(err => console.error('Error fetching most_followed in comments manager:', err))
    }

    if (celebrities && celebrities.length > 0) {
      setCelebAccounts(celebrities)
    } else {
      adminFetch('/api/admin/celebrities')
        .then(res => res.json())
        .then(data => setCelebAccounts(data.celebrities || []))
        .catch(err => console.error('Error fetching celebrities in comments manager:', err))
    }
  }, [mostFollowed, celebrities])

  // Fetch comment summary counts
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true)
      const res = await adminFetch('/api/admin/comments?action=summary')
      if (res.ok) {
        const data = await res.json()
        setSummaryCounts(data.counts || {})
      }
    } catch (err) {
      console.error('Error fetching summary counts:', err)
    } finally {
      setLoadingSummary(false)
    }
  }

  // Fetch comments feed for current section
  const fetchFeedComments = async () => {
    try {
      setLoadingFeed(true)
      const targetType = section === 'live' ? 'profile' : section === 'suggestions' ? 'suggestion' : 'celebrity'
      const res = await adminFetch(`/api/admin/comments?target_type=${encodeURIComponent(targetType)}`)
      if (res.ok) {
        const data = await res.json()
        setFeedComments(data.comments || [])
      }
    } catch (err) {
      console.error('Error fetching feed comments:', err)
    } finally {
      setLoadingFeed(false)
    }
  }

  // Fetch comments for specific account
  const fetchAccountComments = async (account) => {
    if (!account) return
    const targetType = account.targetType
    const targetSlug = account.slug || account.instagram_handle
    try {
      setLoadingAccountComments(true)
      const res = await adminFetch(`/api/admin/comments?target_type=${encodeURIComponent(targetType)}&target_slug=${encodeURIComponent(targetSlug)}`)
      if (res.ok) {
        const data = await res.json()
        setAccountComments(data.comments || [])
      }
    } catch (err) {
      console.error('Error fetching account comments:', err)
    } finally {
      setLoadingAccountComments(false)
    }
  }

  // Trigger daily automated likes boost (+3 standard, +5 name mentions)
  const [runningBoost, setRunningBoost] = useState(false)
  const handleTriggerBoost = async () => {
    try {
      setRunningBoost(true)
      const res = await adminFetch('/api/admin/boost_comments', {
        method: 'POST',
        body: { force: true }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to run daily boost')
      notify(`⚡ Boost applied! ${data.boostedCount} comments boosted (+${data.totalLikesAdded} likes)`)
      fetchFeedComments()
      fetchSummary()
      if (selectedAccount) fetchAccountComments(selectedAccount)
    } catch (err) {
      alert('Error running daily likes boost: ' + err.message)
    } finally {
      setRunningBoost(false)
    }
  }

  // Refetch on mount and section switch
  useEffect(() => {
    fetchSummary()
    fetchFeedComments()
  }, [section])

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountComments(selectedAccount)
    }
  }, [selectedAccount])

  // Current accounts formatted list
  const currentAccounts = useMemo(() => {
    if (section === 'live') {
      return (liveAccounts || []).map(item => ({
        id: item.id,
        name: (item.name || '').trim(),
        instagram_handle: (item.instagram_handle || '').trim(),
        slug: (item.instagram_handle || '').toLowerCase().trim(),
        photo_url: item.photo_url || item.profile_pic_url,
        followers_count: item.followers_count,
        targetType: 'profile',
        liveUrl: `/profile/${item.instagram_handle || ''}`
      }))
    } else {
      return (celebAccounts || []).map(item => ({
        id: item.id,
        name: (item.name || '').trim(),
        instagram_handle: (item.instagram_handle || '').trim(),
        slug: (item.slug || '').toLowerCase().trim(),
        photo_url: item.photo_url,
        followers_count: item.followers_count,
        targetType: 'celebrity',
        liveUrl: `/celebrity/${item.slug || ''}`
      }))
    }
  }, [section, liveAccounts, celebAccounts])

  // Lookup map to quickly find account details by slug
  const accountsBySlug = useMemo(() => {
    const map = new Map()
    for (const acc of currentAccounts) {
      if (acc.slug) map.set(acc.slug.toLowerCase(), acc)
      if (acc.instagram_handle) map.set(acc.instagram_handle.toLowerCase(), acc)
    }
    return map
  }, [currentAccounts])

  // Filtered and sorted accounts (accounts with comments placed first!)
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = currentAccounts.filter(acc => {
      const slugKey = acc.slug || acc.instagram_handle
      const count = summaryCounts[slugKey] || summaryCounts[`${acc.targetType}:${slugKey}`] || 0

      if (onlyWithComments && count === 0) return false
      if (!q) return true

      return (
        (acc.name && acc.name.toLowerCase().includes(q)) ||
        (acc.instagram_handle && acc.instagram_handle.toLowerCase().includes(q)) ||
        (acc.slug && acc.slug.toLowerCase().includes(q))
      )
    })

    // Sort accounts with comments to the top
    list.sort((a, b) => {
      const countA = summaryCounts[a.slug] || summaryCounts[`${a.targetType}:${a.slug}`] || 0
      const countB = summaryCounts[b.slug] || summaryCounts[`${b.targetType}:${b.slug}`] || 0
      if (countB !== countA) return countB - countA
      return a.name.localeCompare(b.name)
    })

    return list
  }, [currentAccounts, search, onlyWithComments, summaryCounts])

  // Filtered comments in feed mode
  const filteredFeedComments = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return feedComments
    return feedComments.filter(c => {
      return (
        (c.author_name && c.author_name.toLowerCase().includes(q)) ||
        (c.content && c.content.toLowerCase().includes(q)) ||
        (c.target_slug && c.target_slug.toLowerCase().includes(q))
      )
    })
  }, [feedComments, search])

  const accountsWithCommentsCount = useMemo(() => {
    return currentAccounts.filter(acc => {
      const slugKey = acc.slug || acc.instagram_handle
      return (summaryCounts[slugKey] || summaryCounts[`${acc.targetType}:${slugKey}`] || 0) > 0
    }).length
  }, [currentAccounts, summaryCounts])

  // Save comment edit
  const handleSaveEdit = async () => {
    if (!editingComment || !editingComment.id) return
    try {
      setSavingEdit(true)
      const res = await adminFetch('/api/admin/comments', {
        method: 'PUT',
        body: {
          id: editingComment.id,
          content: editingComment.content,
          author_name: editingComment.author_name,
          likes_count: editingComment.likes_count,
          dislikes_count: editingComment.dislikes_count
        }
      })

      if (!res.ok) throw new Error('Failed to save comment changes')

      // Update in feed
      setFeedComments(prev => prev.map(c => c.id === editingComment.id ? { ...c, ...editingComment } : c))

      // Update in account tree
      const updateTree = (list) => {
        return list.map(item => {
          if (item.id === editingComment.id) {
            return { ...item, ...editingComment }
          }
          if (item.replies) {
            return { ...item, replies: updateTree(item.replies) }
          }
          return item
        })
      }
      setAccountComments(prev => updateTree(prev))

      setEditingComment(null)
      notify('Comment updated successfully!')
    } catch (err) {
      alert('Error updating comment: ' + err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment permanently?')) return
    try {
      setDeletingId(commentId)
      const res = await adminFetch(`/api/admin/comments?id=${encodeURIComponent(commentId)}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete comment')

      // Remove from feed
      setFeedComments(prev => prev.filter(c => c.id !== commentId))

      // Remove from account tree
      const removeTree = (list) => {
        return list
          .filter(item => item.id !== commentId)
          .map(item => ({
            ...item,
            replies: item.replies ? removeTree(item.replies) : []
          }))
      }
      setAccountComments(prev => removeTree(prev))

      fetchSummary()
      notify('Comment deleted permanently!')
    } catch (err) {
      alert('Error deleting comment: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* ─── Top Header: Section Selection & View Modes ─── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(99,102,241,0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(37,99,235,0.2)'
          }}>
            <MessageSquare size={18} color="#2563eb" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
                Profile Comments
              </h2>
              {actionNotice && (
                <span style={{ background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                  {actionNotice}
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
              Manage, edit, or delete public comments & replies on profiles
            </p>
          </div>
        </div>

        {/* Section Switcher: Live Section vs All Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => {
                setSection('live')
                setSelectedAccount(null)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: section === 'live' ? 'var(--text)' : 'transparent',
                color: section === 'live' ? 'var(--black)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🔴 Live Section ({liveAccounts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSection('celebrity')
                setSelectedAccount(null)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: section === 'celebrity' ? 'var(--text)' : 'transparent',
                color: section === 'celebrity' ? 'var(--black)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              👤 All Section ({celebAccounts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSection('suggestions')
                setViewMode('feed')
                setSelectedAccount(null)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: section === 'suggestions' ? '#0e71eb' : 'transparent',
                color: section === 'suggestions' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              💬 Celebrity Requests ({summaryCounts['suggestion:featured_celebrities'] || summaryCounts['featured_celebrities'] || (section === 'suggestions' ? feedComments.length : 0)})
            </button>
          </div>

          {/* View Mode Toggle (Feed vs Accounts) */}
          <div style={{ display: section === 'suggestions' ? 'none' : 'flex', gap: 2, background: 'var(--surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => {
                setViewMode('feed')
                setSelectedAccount(null)
              }}
              title="View all comments as a live feed"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                border: 'none',
                background: viewMode === 'feed' && !selectedAccount ? '#2563eb' : 'transparent',
                color: viewMode === 'feed' && !selectedAccount ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <List size={13} />
              <span>Comments Feed ({feedComments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('accounts')
                setSelectedAccount(null)
              }}
              title="Browse accounts to see comments by profile"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                border: 'none',
                background: viewMode === 'accounts' || selectedAccount ? '#2563eb' : 'transparent',
                color: viewMode === 'accounts' || selectedAccount ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <User size={13} />
              <span>By Accounts</span>
            </button>
          </div>

          {/* Daily Likes Boost Action Button */}
          <button
            type="button"
            onClick={handleTriggerBoost}
            disabled={runningBoost}
            title="Execute daily likes boost (+3 normal direct comments, +5 name mention comments)"
            style={{
              padding: '6px 13px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 750,
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.18))',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: runningBoost ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(245, 158, 11, 0.1)'
            }}
          >
            <Sparkles size={13} color="#d97706" style={{ animation: runningBoost ? 'spin 1s linear infinite' : 'none' }} />
            <span>{runningBoost ? 'Boosting...' : '⚡ Run Daily Likes Boost'}</span>
          </button>
        </div>
      </div>

      {/* ─── Engagement Engine Rule Banner ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        padding: '8px 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        fontSize: 11.5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚡ Automated Daily Engagement:</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#2563eb', fontWeight: 650 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }}></span>
            Standard Direct Comment: <strong>+3 likes/day</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#d97706', fontWeight: 650 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706' }}></span>
            Name / @Handle Mention: <strong>+5 likes/day</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8' }}></span>
            Nested Replies: <strong>0 likes (Organic only)</strong>
          </span>
        </div>
      </div>

      {/* ─── VIEW 1: SELECTED ACCOUNT COMMENTS DETAIL VIEW ─── */}
      {selectedAccount ? (
        <div style={{ padding: 20 }}>
          {/* Back button & Account Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingBottom: 16,
            marginBottom: 20,
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedAccount.photo_url ? (
                  <img
                    src={selectedAccount.photo_url}
                    alt={selectedAccount.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 800
                  }}>
                    {selectedAccount.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{selectedAccount.name}</span>
                    <a
                      href={selectedAccount.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}
                    >
                      <span>Open Page</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    @{selectedAccount.instagram_handle || selectedAccount.slug} • {accountComments.length} discussion threads
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchAccountComments(selectedAccount)}
              disabled={loadingAccountComments}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} style={{ animation: loadingAccountComments ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Account Comments Content */}
          {loadingAccountComments ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading comments...
            </div>
          ) : accountComments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              background: 'var(--surface2)',
              border: '1.5px dashed var(--border)',
              borderRadius: 14
            }}>
              <MessageSquare size={26} style={{ margin: '0 auto 8px', color: 'var(--text-muted)', opacity: 0.5, display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>No comments found for this account</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Comments posted by visitors on this profile will show up here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {accountComments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Top-level comment */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: comment.avatar_color || 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        flexShrink: 0
                      }}>
                        {comment.avatar_emoji || '🔥'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text)' }}>
                            {comment.author_name || 'Anonymous'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            • {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span>👍 {comment.likes_count || 0} likes</span>
                          <span>👎 {comment.dislikes_count || 0} dislikes</span>
                          {comment.boost_rate === 5 && (
                            <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 750 }}>
                              ⚡ +5/day (Name Mention)
                            </span>
                          )}
                          {comment.boost_rate === 3 && (
                            <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 750 }}>
                              ⚡ +3/day (Standard)
                            </span>
                          )}
                          {comment.replies && comment.replies.length > 0 && (
                            <span style={{ color: '#2563eb', fontWeight: 700 }}>
                              💬 {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setEditingComment({
                          id: comment.id,
                          author_name: comment.author_name || '',
                          content: comment.content || '',
                          likes_count: comment.likes_count || 0,
                          dislikes_count: comment.dislikes_count || 0
                        })}
                        style={{
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={12} color="#2563eb" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === comment.id}
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{deletingId === comment.id ? '...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comment text or Inline Editor */}
                  {editingComment?.id === comment.id ? (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Author Name</label>
                          <input
                            type="text"
                            value={editingComment.author_name}
                            onChange={(e) => setEditingComment({ ...editingComment, author_name: e.target.value })}
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: 'var(--text)', width: 170 }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 750, color: '#2563eb', display: 'block', marginBottom: 2 }}>👍 Edit Likes</label>
                          <input
                            type="number"
                            min="0"
                            value={editingComment.likes_count ?? 0}
                            onChange={(e) => setEditingComment({ ...editingComment, likes_count: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                            style={{ background: 'var(--surface2)', border: '1.5px solid #2563eb', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontWeight: 800, color: '#2563eb', width: 95 }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>👎 Dislikes</label>
                          <input
                            type="number"
                            min="0"
                            value={editingComment.dislikes_count ?? 0}
                            onChange={(e) => setEditingComment({ ...editingComment, dislikes_count: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: 'var(--text)', width: 80 }}
                          />
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={editingComment.content}
                        onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setEditingComment(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                        <button type="button" onClick={handleSaveEdit} disabled={savingEdit} style={{ background: '#2563eb', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 11.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{savingEdit ? 'Saving...' : 'Save'}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 10,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: 'var(--text)',
                      background: 'var(--surface2)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-word'
                    }}>
                      {comment.content}
                    </div>
                  )}

                  {/* Nested replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{
                      marginTop: 12,
                      paddingLeft: 14,
                      borderLeft: '2.5px solid #2563eb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      {comment.replies.map(reply => (
                        <div key={reply.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13 }}>{reply.avatar_emoji || '🔥'}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text)' }}>{reply.author_name}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>• {new Date(reply.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setEditingComment({
                                  id: reply.id,
                                  author_name: reply.author_name,
                                  content: reply.content,
                                  likes_count: reply.likes_count || 0,
                                  dislikes_count: reply.dislikes_count || 0
                                })}
                                style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === reply.id}
                                onClick={() => handleDeleteComment(reply.id)}
                                style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {editingComment?.id === reply.id ? (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <input
                                  type="text"
                                  placeholder="Author"
                                  value={editingComment.author_name}
                                  onChange={(e) => setEditingComment({ ...editingComment, author_name: e.target.value })}
                                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, color: 'var(--text)', width: 140 }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 750 }}>👍 Likes:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingComment.likes_count ?? 0}
                                    onChange={(e) => setEditingComment({ ...editingComment, likes_count: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                    style={{ background: 'var(--surface)', border: '1px solid #2563eb', borderRadius: 6, padding: '3px 6px', fontSize: 11.5, fontWeight: 750, color: '#2563eb', width: 75 }}
                                  />
                                </div>
                              </div>
                              <textarea
                                rows={2}
                                value={editingComment.content}
                                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px', fontSize: 12, color: 'var(--text)' }}
                              />
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setEditingComment(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                                <button type="button" onClick={handleSaveEdit} style={{ background: '#2563eb', border: 'none', borderRadius: 4, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--text)', whiteSpace: 'pre-line' }}>{reply.content}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'feed' ? (
        /* ─── VIEW 2: ALL COMMENTS FEED (Shows all comments directly!) ─── */
        <div style={{ padding: 20 }}>
          {/* Top Search & Refresh */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search comments by author or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 12px 8px 34px',
                  fontSize: 12.5,
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {filteredFeedComments.length} {section === 'live' ? 'live' : section === 'suggestions' ? 'celebrity request' : 'celebrity'} comments
              </span>
              <button
                type="button"
                onClick={fetchFeedComments}
                disabled={loadingFeed}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} style={{ animation: loadingFeed ? 'spin 1s linear infinite' : 'none' }} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Comments Feed List */}
          {loadingFeed ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading comments...
            </div>
          ) : filteredFeedComments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '50px 20px',
              background: 'var(--surface2)',
              border: '1.5px dashed var(--border)',
              borderRadius: 14
            }}>
              <MessageSquare size={26} style={{ margin: '0 auto 8px', color: 'var(--text-muted)', opacity: 0.5, display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>No comments in this section yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                When users submit {section === 'live' ? 'live follower tracking comments' : section === 'suggestions' ? 'celebrity feature requests in the Zoom chat' : 'celebrity comments'}, they will appear here instantly.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredFeedComments.map((comment) => {
                const matchedAccount = accountsBySlug.get((comment.target_slug || '').toLowerCase())
                const isSuggestion = section === 'suggestions' || comment.target_type === 'suggestion'
                const profileName = isSuggestion ? 'Celebrity Suggestion' : (matchedAccount?.name || comment.target_slug)
                const profileHandle = isSuggestion ? '🌟 Feature Request' : `@${matchedAccount?.instagram_handle || comment.target_slug}`
                const liveUrl = isSuggestion ? '/all' : (section === 'live' ? `/profile/${comment.target_slug}` : `/celebrity/${comment.target_slug}`)

                return (
                  <div
                    key={comment.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Header: Account badge + Author + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Target Account Pill */}
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: isSuggestion ? 'rgba(14, 113, 235, 0.12)' : 'rgba(37,99,235,0.1)',
                            border: isSuggestion ? '1px solid rgba(14, 113, 235, 0.3)' : '1px solid rgba(37,99,235,0.25)',
                            color: isSuggestion ? '#0e71eb' : '#2563eb',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 750,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none'
                          }}
                        >
                          <span>{profileHandle}</span>
                          <ExternalLink size={10} />
                        </a>

                        {/* Author */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{comment.avatar_emoji || '🔥'}</span>
                          <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--text)' }}>
                            {comment.author_name || 'Anonymous'}
                          </span>
                          {comment.parent_id && (
                            <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 10, padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                              Reply
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            • {new Date(comment.created_at).toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 750, color: '#2563eb', background: 'rgba(37, 99, 235, 0.08)', padding: '1px 6px', borderRadius: 4 }}>
                            👍 {comment.likes_count || 0}
                          </span>
                          {comment.boost_rate === 5 && (
                            <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 750 }}>
                              ⚡ +5/day (Name Mention)
                            </span>
                          )}
                          {comment.boost_rate === 3 && (
                            <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 750 }}>
                              ⚡ +3/day (Standard)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingComment({
                            id: comment.id,
                            author_name: comment.author_name,
                            content: comment.content,
                            likes_count: comment.likes_count || 0,
                            dislikes_count: comment.dislikes_count || 0
                          })}
                          style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={11} color="#2563eb" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === comment.id}
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={11} />
                          <span>{deletingId === comment.id ? '...' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {editingComment?.id === comment.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Author</label>
                            <input
                              type="text"
                              value={editingComment.author_name}
                              onChange={(e) => setEditingComment({ ...editingComment, author_name: e.target.value })}
                              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: 'var(--text)', width: 160 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 750, color: '#2563eb', display: 'block', marginBottom: 2 }}>👍 Edit Likes</label>
                            <input
                              type="number"
                              min="0"
                              value={editingComment.likes_count ?? 0}
                              onChange={(e) => setEditingComment({ ...editingComment, likes_count: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                              style={{ background: 'var(--surface2)', border: '1.5px solid #2563eb', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 800, color: '#2563eb', width: 90 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>👎 Dislikes</label>
                            <input
                              type="number"
                              min="0"
                              value={editingComment.dislikes_count ?? 0}
                              onChange={(e) => setEditingComment({ ...editingComment, dislikes_count: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: 'var(--text)', width: 75 }}
                            />
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={editingComment.content}
                          onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', fontSize: 13, color: 'var(--text)', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setEditingComment(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 11.5, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                          <button type="button" onClick={handleSaveEdit} disabled={savingEdit} style={{ background: '#2563eb', border: 'none', borderRadius: 6, padding: '3px 12px', fontSize: 11.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      /* Comment Content */
                      <div style={{
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: 'var(--text)',
                        background: 'var(--surface2)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word'
                      }}>
                        {comment.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── VIEW 3: BROWSE BY ACCOUNTS (Accounts Grid) ─── */
        <div style={{ padding: 20 }}>
          {/* Search & Filter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${section === 'live' ? 'live profile' : 'celebrity'} by name or @handle...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 12px 8px 34px',
                  fontSize: 12.5,
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setOnlyWithComments(false)}
                style={{
                  background: !onlyWithComments ? 'rgba(37,99,235,0.1)' : 'transparent',
                  border: !onlyWithComments ? '1px solid #2563eb' : '1px solid var(--border)',
                  color: !onlyWithComments ? '#2563eb' : 'var(--text-muted)',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                All Accounts ({currentAccounts.length})
              </button>

              <button
                type="button"
                onClick={() => setOnlyWithComments(true)}
                style={{
                  background: onlyWithComments ? 'rgba(37,99,235,0.1)' : 'transparent',
                  border: onlyWithComments ? '1px solid #2563eb' : '1px solid var(--border)',
                  color: onlyWithComments ? '#2563eb' : 'var(--text-muted)',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>With Comments</span>
                <span style={{
                  background: '#2563eb',
                  color: '#fff',
                  borderRadius: 100,
                  padding: '1px 6px',
                  fontSize: 10,
                  fontWeight: 800
                }}>
                  {accountsWithCommentsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          {filteredAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <Sparkles size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>No accounts found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing the search or filter</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 12
            }}>
              {filteredAccounts.map(account => {
                const slugKey = account.slug || account.instagram_handle
                const commentCount = summaryCounts[slugKey] || summaryCounts[`${account.targetType}:${slugKey}`] || 0

                return (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    style={{
                      background: 'var(--surface)',
                      border: commentCount > 0 ? '1.5px solid #2563eb' : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: commentCount > 0 ? '0 2px 8px rgba(37,99,235,0.08)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.borderColor = '#2563eb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.borderColor = commentCount > 0 ? '#2563eb' : 'var(--border)'
                    }}
                  >
                    {account.photo_url ? (
                      <img
                        src={account.photo_url}
                        alt={account.name}
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                        {account.name?.charAt(0) || 'A'}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {account.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        @{account.instagram_handle || account.slug}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: commentCount > 0 ? '#2563eb' : 'var(--surface2)',
                      color: commentCount > 0 ? '#ffffff' : 'var(--text-muted)',
                      border: commentCount > 0 ? 'none' : '1px solid var(--border)',
                      borderRadius: 100,
                      padding: '4px 10px',
                      fontSize: 11.5,
                      fontWeight: 750,
                      flexShrink: 0
                    }}>
                      <MessageSquare size={12} color={commentCount > 0 ? '#ffffff' : 'var(--text-muted)'} />
                      <span>{commentCount}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
