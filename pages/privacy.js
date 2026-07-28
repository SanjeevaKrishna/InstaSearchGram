import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Spialr</title>
        <meta name="description" content="Read the official Privacy Policy of Spialr. Learn how we handle cookies, Google Analytics, third-party advertising partners like Google AdSense, and cookie opt-out options." />
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <div style={{ color: 'var(--text-dim)', lineHeight: 1.9, fontSize: 15 }}>
          <p style={{ marginBottom: 20 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>What We Collect</h2>
          <p style={{ marginBottom: 16 }}>Spialr does not collect any personal information from users. We do not require account registration or login to use the site.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Cookies & Third-Party Analytics</h2>
          <p style={{ marginBottom: 16 }}>Spialr utilizes standard internet cookies to analyze visitor traffic patterns, optimize page loading speeds, and measure user experience. We use third-party analytics tools (such as Google Analytics) which place tracking cookies. These cookies do not collect or store any personally identifiable information (such as your name, email, or IP address) and are used solely for aggregate website traffic analysis.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Google AdSense & Personalized Advertising</h2>
          <p style={{ marginBottom: 16 }}>We partner with third-party advertising vendors, including Google, to serve ads when you visit our website. Google uses cookies (such as the DoubleClick/DART cookie) to serve advertisements based on your prior visits to Spialr or other sites on the internet.</p>
          <p style={{ marginBottom: 16 }}>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our sites and/or other sites on the Internet. You may opt out of personalized advertising by visiting the <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Google Ads Settings page</a>.</p>
          <p style={{ marginBottom: 16 }}>Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting the <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>www.aboutads.info</a> opt-out portal.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Live Rankings (Live Ranks)</h2>
          <p style={{ marginBottom: 16 }}>We display live follower counts and ranks for popular creators. This data is collected entirely from public information on Instagram. We do not store or track any personal information of users featured in these rankings, nor do we track individuals who view the rankings.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>24-Hour Viral Reels</h2>
          <p style={{ marginBottom: 16 }}>Our 24-Hour Viral Reels section showcases popular public Instagram reels. We only display publicly available metadata (such as titles, creator names, and public thumbnails). Any interaction or click redirects you to Instagram, which is governed by Meta's privacy policy. We do not collect or monitor your viewing history, Instagram credentials, or personal engagement statistics.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Third-Party Links</h2>
          <p style={{ marginBottom: 16 }}>Spialr links to Instagram posts and reels. Clicking these links takes you to Instagram, which has its own privacy policy. We are not responsible for Instagram's data practices.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>Contact</h2>
          <p>If you have any questions about this policy, please reach out through our website or contact us directly at <a href="mailto:contact@spialr.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>contact@spialr.com</a>.</p>
        </div>
      </main>
    </>
  )
}
