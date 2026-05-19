import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function About() {
  return (
    <>
      <Head>
        <title>About — InstaSearch</title>
        <meta name="description" content="InstaSearch helps you find Instagram posts and reels from your favourite creators without endless scrolling." />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <div className="fade-in">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            About <span className="gradient-text">InstaSearch</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
            Instagram is amazing — but finding a specific post or reel from a creator means scrolling endlessly through their profile. We built InstaSearch to fix that.
          </p>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
            Every post on InstaSearch is manually curated and tagged. Search a celebrity name, filter by Most Liked, Most Commented, or a keyword tag — and get a direct link to the exact post on Instagram.
          </p>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8 }}>
            No login needed. No scrolling. Just search and find.
          </p>
        </div>
      </main>
    </>
  )
}
