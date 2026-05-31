import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function AllCelebrities() {
  const [celebrities, setCelebrities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/celebrities?limit=all')
      .then(r => r.json())
      .then(d => {
        setCelebrities(d.celebrities || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Group by first letter
  const grouped = celebrities.reduce((acc, cel) => {
    const letter = (cel.name?.charAt(0) || '#').toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(cel)
    return acc
  }, {})

  // Sort keys alphabetically
  const sortedLetters = Object.keys(grouped).sort()

  return (
    <>
      <Head>
        <title>All Profiles — Spialr</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 24,
        }}>
          All Available Profiles:
        </h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ position: 'relative', background: '#fff', borderRadius: '12px', overflow: 'hidden', paddingBottom: '24px' }}>
            {sortedLetters.map(letter => (
              <div key={letter} id={`letter-${letter}`} style={{ display: 'flex', flexDirection: 'column', scrollMarginTop: '80px' }}>
                {grouped[letter].map((cel, index) => (
                  <Link key={cel.id} href={`/celebrity/${cel.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Left Column for Letter Header */}
                      <div style={{ width: 72, display: 'flex', justifyContent: 'flex-start', paddingLeft: 16, alignItems: 'center', flexShrink: 0, paddingBottom: 8 }}>
                        {index === 0 ? (
                          <div style={{
                            width: 40,
                            height: 40,
                            background: '#0f9d58', // Contacts Green
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 18,
                            fontFamily: 'Roboto, "Segoe UI", sans-serif'
                          }}>
                            {letter}
                          </div>
                        ) : null}
                      </div>

                      {/* Right Column for Contact Detail */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px 12px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        gap: 20
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: '#e0e0e0', // Grey circle for placeholders
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 500,
                          fontSize: 18,
                          flexShrink: 0,
                          overflow: 'hidden',
                          color: '#757575',
                        }}>
                          {cel.photo_url ? (
                            <img src={cel.photo_url} alt={cel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                          ) : (
                            cel.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        
                        {/* Name */}
                        <div style={{
                          flex: 1,
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#202124', // Dark black text
                          fontFamily: 'Roboto, "Segoe UI", sans-serif'
                        }}>
                          {cel.name}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
            
            {celebrities.length === 0 && (
              <div style={{ textAlign: 'center', color: '#757575', padding: 40 }}>
                No profiles found.
              </div>
            )}

            {/* Alphabet Scrubber */}
            <div style={{
              position: 'fixed',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent)',
              zIndex: 10,
            }}>
              <div 
                style={{ cursor: 'pointer', padding: '2px 8px', width: '100%', textAlign: 'center' }}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(`letter-#`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >#</div>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => (
                <div 
                  key={char} 
                  style={{ cursor: 'pointer', padding: '2px 8px', width: '100%', textAlign: 'center' }}
                  onClick={(e) => {
                    e.preventDefault();
                    // Find the exact element or the nearest next one
                    let el = document.getElementById(`letter-${char}`);
                    if (!el) {
                      // fallback to nearest next letter
                      const letters = Object.keys(grouped).sort();
                      const nextLetter = letters.find(l => l > char);
                      if (nextLetter) el = document.getElementById(`letter-${nextLetter}`);
                    }
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
