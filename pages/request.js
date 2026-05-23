import { useState } from 'react'
import Head from 'next/head'
import Navbar from '../components/Navbar'

export default function RequestCreator() {
  const [creatorName, setCreatorName] = useState('')
  const [handle, setHandle] = useState('')
  const [category, setCategory] = useState('Actor')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!creatorName || !handle) return
    setSubmitted(true)
    setTimeout(() => {
      setCreatorName('')
      setHandle('')
      setCategory('Actor')
      setEmail('')
    }, 2000)
  }

  return (
    <>
      <Head>
        <title>Request Creator / Suggest Profile — InstaSearch</title>
      </Head>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', textAlign: 'center' }}>
          Request Creator / Suggest Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 40, fontSize: 15 }}>
          Want to see a specific creator or profile tracked on our live leaderboards? Suggest them below!
        </p>

        {submitted ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid #00c853', background: 'rgba(0,200,83,0.05)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#00c853', marginBottom: 8 }}>Suggestion Received!</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Thank you! We will review the profile and add them to our database if they qualify.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 16, padding: 32 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Creator Name *</label>
              <input 
                className="input-field" 
                type="text" 
                value={creatorName} 
                onChange={e => setCreatorName(e.target.value)} 
                placeholder="e.g. Cristiano Ronaldo..." 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Instagram Handle *</label>
              <input 
                className="input-field" 
                type="text" 
                value={handle} 
                onChange={e => setHandle(e.target.value)} 
                placeholder="e.g. cristiano..." 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Category</label>
              <select 
                className="input-field"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Actor">Actor</option>
                <option value="Influencers">Influencers</option>
                <option value="Creator">Creator</option>
                <option value="Singer">Singer</option>
                <option value="Sports">Sports</option>
                <option value="Politicians">Politicians</option>
                <option value="Meme Pages">Meme Pages</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Your Email (optional)</label>
              <input 
                className="input-field" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Receive notification if added..." 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              Submit Request
            </button>
          </form>
        )}
      </main>
    </>
  )
}
