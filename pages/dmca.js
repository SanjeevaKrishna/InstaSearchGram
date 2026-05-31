import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function DMCA() {
  return (
    <>
      <Head>
        <title>DMCA Policy — Spialr</title>
      </Head>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em' }}>
          DMCA Copyright Policy
        </h1>
        <div style={{ color: 'var(--text-dim)', lineHeight: 1.9, fontSize: 15 }}>
          <p style={{ marginBottom: 20 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p style={{ marginBottom: 16 }}>Spialr respects the intellectual property rights of others. We comply with the Digital Millennium Copyright Act (DMCA) and other applicable intellectual property laws.</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>1. Copyright Infringement Claims</h2>
          <p style={{ marginBottom: 16 }}>If you believe that your copyrighted work has been copied or used on Spialr in a way that constitutes copyright infringement, please notify our designated copyright agent with the following details:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 20, display: 'grid', gap: 8 }}>
            <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.</li>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material that is claimed to be infringing (including the specific URL on our website).</li>
            <li>Your contact details, including your address, telephone number, and email address.</li>
            <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
          </ul>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>2. Designated Copyright Agent</h2>
          <p style={{ marginBottom: 16 }}>Please send all copyright notices to our designated agent via email at:</p>
          <p style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 16, marginBottom: 24 }}>professionalusepurpose@gmail.com</p>

          <h2 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, marginTop: 30 }}>3. Response and Removal</h2>
          <p>Upon receiving a valid DMCA notification, Spialr will take immediate action to investigate and, if necessary, remove or disable access to the infringing material. We will also notify the user who posted or is associated with the material, allowing for counter-notifications under applicable laws.</p>
        </div>
      </main>
    </>
  )
}
