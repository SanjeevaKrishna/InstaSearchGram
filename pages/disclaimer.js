import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function Disclaimer() {
  return (
    <>
      <Head>
        <title>Disclaimer — Spialr</title>
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em' }}>
          Disclaimer
        </h1>
        <div style={{ color: 'var(--text-dim)', lineHeight: 1.9, fontSize: 15 }}>
          <p style={{ marginBottom: 20 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>1. External Links Disclaimer</h2>
          <p style={{ marginBottom: 16 }}>Spialr may contain links to external websites that are not provided or maintained by or in any way affiliated with us. Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>2. No Affiliation with Instagram</h2>
          <p style={{ marginBottom: 16 }}>Spialr is an independent search tool and directory. We are not sponsored, endorsed, administered by, or associated with Instagram, Meta Platforms, Inc., or any of the celebrities, creators, or profiles listed on this website.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>3. Information Accuracy</h2>
          <p style={{ marginBottom: 16 }}>The information on Spialr is compiled from public sources. While we strive to keep information updated (such as follower counts and trends), we make no representations or warranties of any kind about the accuracy or completeness of the data.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>4. Professional Disclaimer</h2>
          <p style={{ marginBottom: 16 }}>The site cannot and does not contain professional, financial, or legal advice. The information is provided for general informational and educational purposes only and is not a substitute for professional advice.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>5. Contact and Feedback</h2>
          <p>For any queries or concerns regarding this disclaimer or any content on this website, please reach out to us at <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>professionalusepurpose@gmail.com</a>.</p>
        </div>
      </main>
    </>
  )
}
