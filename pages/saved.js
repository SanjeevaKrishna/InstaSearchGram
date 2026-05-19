import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'

export default function SavedLinks() {
  const [savedPosts, setSavedPosts] = useState([])

  const loadSaved = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]')
      setSavedPosts(saved)
    } catch {
      setSavedPosts([])
    }
  }

  useEffect(() => {
    loadSaved()
    window.addEventListener('saved_posts_updated', loadSaved)
    return () => window.removeEventListener('saved_posts_updated', loadSaved)
  }, [])

  return (
    <>
      <Head>
        <title>Saved Links — InstaSearch</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 24,
        }}>
          Saved Links & Profile
        </h1>

        {savedPosts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {savedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
            <p>You haven't saved any posts yet.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Find a post you like and click the heart icon to save it here!</p>
          </div>
        )}
      </main>
    </>
  )
}
