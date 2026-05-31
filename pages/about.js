import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function About() {
  return (
    <>
      <Head>
        <title>About — Spialr</title>
        <meta name="description" content="Spialr helps you find Instagram posts and reels from your favourite creators without endless scrolling." />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <div className="fade-in">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            About <span className="gradient-text">Spialr</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
            Instagram is amazing — but finding a specific post or reel from a creator means scrolling endlessly through their profile. We built Spialr to fix that.
          </p>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
            Every post on Spialr is manually curated and tagged. Search a celebrity name, filter by Most Liked, Most Commented, or a keyword tag — and get a direct link to the exact post on Instagram.
          </p>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
            No login needed. No scrolling. Just search and find.
          </p>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8 }}>
            Have a suggestion, question, or need assistance? Reach out to us directly through our <a href="/contact" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contact Us</a> page or email us at <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>professionalusepurpose@gmail.com</a>.
          </p>
        </div>
      </main>
    </>
  )
}
