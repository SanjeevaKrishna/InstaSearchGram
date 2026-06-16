import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import { Mail } from 'lucide-react'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !message) return
    setSubmitted(true)
    setTimeout(() => {
      setName('')
      setEmail('')
      setMessage('')
    }, 2000)
  }

  return (
    <>
      <Head>
        <title>Contact Us — Spialr</title>
      </Head>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', textAlign: 'center' }}>
          Contact Us
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 40, fontSize: 15 }}>
          Have any questions, feedback, or inquiries? Get in touch!
        </p>

        {submitted ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', border: '1px solid #00c853', background: 'rgba(0,200,83,0.05)' }}>
            <Mail size={40} strokeWidth={1.5} style={{ color: '#00c853', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#00c853', marginBottom: 8 }}>Message Sent Successfully!</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Thank you for reaching out. We will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 16, padding: 32 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Full Name</label>
              <input 
                className="input-field" 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Your Name..." 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email Address</label>
              <input 
                className="input-field" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name@example.com..." 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Message</label>
              <textarea 
                className="input-field" 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Write your message here..." 
                rows={5} 
                style={{ resize: 'vertical' }} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              Send Message
            </button>
          </form>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
          Or direct inquiries to: <a href="mailto:professionalusepurpose@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>professionalusepurpose@gmail.com</a>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>We usually respond within 24-48 business hours.</div>
        </div>
      </main>
    </>
  )
}
