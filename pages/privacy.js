import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — InstaSearch</title>
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <div style={{ color: 'var(--text-dim)', lineHeight: 1.9, fontSize: 15 }}>
          <p style={{ marginBottom: 20 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>What We Collect</h2>
          <p style={{ marginBottom: 16 }}>InstaSearch does not collect any personal information from users. We do not require account registration or login to use the site.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Cookies & Analytics</h2>
          <p style={{ marginBottom: 16 }}>We may use basic analytics tools (such as Google Analytics) to understand how visitors use the site. These tools may set cookies. No personally identifiable information is stored.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Third-Party Links</h2>
          <p style={{ marginBottom: 16 }}>InstaSearch links to Instagram posts and reels. Clicking these links takes you to Instagram, which has its own privacy policy. We are not responsible for Instagram's data practices.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Advertising</h2>
          <p style={{ marginBottom: 16 }}>We may show advertisements via Google AdSense. Google may use cookies to serve ads based on your prior visits to this or other websites. You can opt out at Google's Ads Settings page.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Contact</h2>
          <p>If you have any questions about this policy, please reach out through our website.</p>
        </div>
      </main>
    </>
  )
}
