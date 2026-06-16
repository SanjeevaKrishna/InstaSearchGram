import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { TrendingUp, BarChart3, Newspaper, Search } from 'lucide-react'

export default function About() {
  return (
    <>
      <Head>
        <title>About Spialr — Instagram Rankings, Insights & News</title>
        <meta name="description" content="Discover Spialr - a professional analytics platform featuring live creator ranks, daily InstaNews, total views, reel likes, post likes, and instant keyword search." />
      </Head>
      
      <Navbar />
      
      <main style={{ maxWidth: 750, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div className="fade-in">
          {/* Back button */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24, cursor: 'pointer', fontWeight: 600 }}>
              ← Back to Search
            </span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            About <span className="gradient-text">Spialr</span>
          </h1>
          
          <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 40 }}>
            Instagram is an incredible space for creativity, but finding specific content or understanding a creator's true scale often requires endless scrolling. <strong>Spialr</strong> was built to solve this. We curate, index, and analyze top profiles to provide instant search and professional social analytics.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            What We Offer:
          </h2>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
            marginBottom: 48
          }}>
            {/* Card 1: Creator Rankings */}
            <div className="card" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(225, 48, 108, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Live Creator Rankings
                </h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                Check real-time standings and follower count leaderboards for thousands of top Instagram profiles. We track ranks across multiple categories including Actors, Singers, Creators, Meme Pages, and Politicians in India and globally.
              </p>
            </div>

            {/* Card 2: Account Insights */}
            <div className="card" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 107, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={18} style={{ color: '#ff6b35' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Detailed Account Insights
                </h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                Analyze overall profile performance through deep analytics metrics like <strong>Total Reel Views</strong>, <strong>Reel Likes</strong>, and <strong>Post Likes</strong>. This gives you an immediate picture of a creator's audience engagement and reaches.
              </p>
            </div>

            {/* Card 3: InstaNews */}
            <div className="card" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 180, 219, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Newspaper size={18} style={{ color: '#00b4db' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Daily InstaNews
                </h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                Stay updated with a dedicated daily news feed covering trending articles, viral events, and major announcements about popular online celebrities and digital creators.
              </p>
            </div>

            {/* Card 4: Search & Curation */}
            <div className="card" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(224, 64, 251, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={18} style={{ color: '#e040fb' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Deep Curation & Search
                </h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                Search any profile by keywords, timelines (specific date or range), or playlist. Instantly view a creator's most liked, most commented, or most viewed posts, and link directly to the official Instagram post.
              </p>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
            Get in Touch
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
            No login required. No endless scrolling. Just data and curation.
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8 }}>
            Have a suggestion, question, want to request a profile, or need assistance? Reach out to us directly through our <a href="/contact" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contact Us</a> page or email us at <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>professionalusepurpose@gmail.com</a>.
          </p>
        </div>
      </main>
    </>
  )
}
