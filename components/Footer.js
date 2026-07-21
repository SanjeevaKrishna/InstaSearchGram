import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '48px 24px 100px', // padding bottom has spacing for BottomNav
      color: 'var(--text-muted)',
      fontSize: 13,
      fontFamily: 'Roboto, "Segoe UI", sans-serif',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }}>
        {/* Top Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32
        }}>
          {/* Section 1: About */}
          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Spialr Analytics</h4>
            <p style={{ lineHeight: 1.6, margin: 0, color: 'var(--text-dim)' }}>
              Curating, indexing, and analyzing top social media creators to provide instant search and insights.
            </p>
          </div>

          {/* Section 2: Quick Links */}
          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Explore</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
              <Link href="/all" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>All Profiles</Link>
              <Link href="/trending" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Trending Reels</Link>
              <Link href="/live" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Live Standings</Link>
            </div>
          </div>

          {/* Section 3: Legal & Safety */}
          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Policies & Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/privacy" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/disclaimer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Disclaimer</Link>
              <Link href="/dmca" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>DMCA Policy</Link>
            </div>
          </div>

          {/* Section 4: Contact & Feedback */}
          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/about" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>About Us</Link>
              <Link href="/contact" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Contact Us</Link>
              <Link href="/request" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Request Profile</Link>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Sitemap</a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Disclaimer & Copyright */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ lineHeight: 1.6, fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
            <strong>Disclaimer:</strong> Spialr is an independent analytics directory and search resource for Instagram. We are not officially affiliated, associated, authorized, endorsed by, or connected with Meta Platforms, Inc., Instagram, or any of their subsidiaries. All creator names, profile photos, images, and content are the sole property of their respective copyright owners and are utilized under fair-use guidelines for analytics and information curation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
            <span>© {new Date().getFullYear()} Spialr. All rights reserved.</span>
            <span>Email Support: <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>professionalusepurpose@gmail.com</a></span>
          </div>
        </div>
      </div>
    </footer>
  )
}
