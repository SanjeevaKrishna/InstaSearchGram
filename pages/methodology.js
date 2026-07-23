import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { Info, BarChart3, TrendingUp } from 'lucide-react'

export default function Methodology() {
  return (
    <>
      <Head>
        <title>How Spialr Data & Rankings Work — Methodology</title>
        <meta name="description" content="Learn how Spialr collects public social metrics, builds creator directory leaderboards, and compiles ranking indexes transparently." />
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

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            How <span className="gradient-text">Spialr</span> Data & Rankings Work
          </h1>
          
          <p style={{ fontSize: 16.5, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 40 }}>
            Transparency and accuracy are core values at Spialr. We want creators, marketers, and audiences to understand exactly how our metrics are structured, where the data originates, and how rankings are computed.
          </p>

          {/* Section 1 */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(225, 48, 108, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                1. What Spialr Does
              </h2>
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>
              Spialr is a curation directory and benchmarking platform. We help users discover, search, and compare publicly available social-media performance information, creator profiles, notable posts/reels, and rankings. Our goal is to organize public digital data in a professional, clean, and easily searchable layout.
            </p>
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} style={{ color: '#6366f1' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                2. Where Our Data Comes From
              </h2>
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 12 }}>
              All metrics on Spialr are compiled directly from public feeds. Our data collection uses the following standards:
            </p>
            <ul style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Public Feed Curation:</strong> We manually observe and record metrics (followers count, post counts, likes, and views) directly from publicly available creator profiles.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>No Partnerships/Official APIs:</strong> Spialr operates independently. We do not claim official API access or integrations with Instagram or Meta Platforms, Inc., nor do we represent any official partnerships.
              </li>
              <li>
                <strong>Curation Accuracy:</strong> Every celebrity standings index and ranking folder is researched, reviewed, and updated manually by our research team to maintain data integrity.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                3. How Rankings Work
              </h2>
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 16 }}>
              Spialr ranks and orders content based on exact public metrics. Rankings in our directories are computed transparently using specific metrics:
            </p>

            {/* Metrics cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 20
            }}>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontWeight: 750, color: 'var(--text)', marginBottom: 4, fontSize: 14 }}>Most Viewed</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ordered by recorded view count</div>
              </div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontWeight: 750, color: 'var(--text)', marginBottom: 4, fontSize: 14 }}>Most Liked</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ordered by recorded like count</div>
              </div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
                <div style={{ fontWeight: 750, color: 'var(--text)', marginBottom: 4, fontSize: 14 }}>Most Commented</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ordered by recorded comment count</div>
              </div>
            </div>

            <p style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>
              <strong>Note on Dynamic Changes:</strong> Social-media interaction rates and viewer counts are highly dynamic. Because metrics may change on the original platform after Spialr records them, all listed rankings should be understood as historical snapshots representing our last recorded observations.
            </p>
          </div>

          {/* Section 4 */}
          <div style={{ 
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px 28px',
            fontSize: 14,
            color: 'var(--text-dim)',
            lineHeight: 1.7
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 750, color: 'var(--text)', marginBottom: 8 }}>
              <span>❓ Have Questions?</span>
            </div>
            If you have feedback regarding our sorting criteria, want to correct an outdated metric, or have questions about how our curation works, please contact us at <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>professionalusepurpose@gmail.com</a>.
          </div>
        </div>
      </main>
    </>
  )
}
