import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — Spialr</title>
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em' }}>
          Terms of Service
        </h1>
        <div style={{ color: 'var(--text-dim)', lineHeight: 1.9, fontSize: 15 }}>
          <p style={{ marginBottom: 20 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p style={{ marginBottom: 16 }}>Welcome to Spialr. By accessing our website, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>1. Use of the Site</h2>
          <p style={{ marginBottom: 16 }}>Spialr is an information and search directory for public social media profiles. You agree to use the site only for lawful, personal, and non-commercial purposes.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>2. Intellectual Property</h2>
          <p style={{ marginBottom: 16 }}>All trademarks, logos, content, and code on Spialr are the property of their respective owners. Instagram profile pictures, reels, posts, and names referenced belong to the respective creators and Instagram (Meta Platforms, Inc.). We claim no ownership over Instagram content.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>3. Disclaimer of Warranties</h2>
          <p style={{ marginBottom: 16 }}>The materials on Spialr are provided on an 'as is' basis. We make no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of the information.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>4. Limitations of Liability</h2>
          <p style={{ marginBottom: 16 }}>In no event shall Spialr or its developers be liable for any damages arising out of the use or inability to use the materials on the website.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>5. Governing Law</h2>
          <p style={{ marginBottom: 16 }}>These terms are governed by and construed in accordance with the laws of India, and you submit to the exclusive jurisdiction of the courts in that location.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>6. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us directly at <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>professionalusepurpose@gmail.com</a>.</p>
        </div>
      </main>
    </>
  )
}
