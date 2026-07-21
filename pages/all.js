import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { Search } from 'lucide-react'

const formatCount = (num) => {
  if (!num) return '0'
  const val = Number(num)
  if (val >= 1000000000) return (val / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return val.toString()
}

export default function AllCelebrities() {
  const router = useRouter()
  const { compare } = router.query

  const [celebrities, setCelebrities] = useState([])
  const [loading, setLoading] = useState(true)
  const [originalCelebrity, setOriginalCelebrity] = useState(null)
  const [selectedCel, setSelectedCel] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/celebrities?limit=all')
      .then(r => r.json())
      .then(d => {
        setCelebrities(d.celebrities || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Fetch original celebrity if comparison mode is active
  useEffect(() => {
    if (compare) {
      fetch(`/api/celebrities/${compare}`)
        .then(r => r.json())
        .then(d => {
          setOriginalCelebrity(d.celebrity)
        })
        .catch(err => console.error("Error loading original celebrity:", err))
    } else {
      setOriginalCelebrity(null)
      setSelectedCel(null)
    }
  }, [compare])

  // Handle keyboard Enter button
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (compare && selectedCel && e.key === 'Enter') {
        router.push(`/celebrity/${compare}?compare=${selectedCel.slug}`)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [compare, selectedCel, router])

  // Group by first letter, excluding comparing celebrity and dot art converter
  const grouped = celebrities.reduce((acc, cel) => {
    if (compare && cel.slug === compare) return acc

    // Do not show dot art converter in comparison selection list
    const isDotConverter = 
      cel.slug === 'dotart-converter' || 
      cel.slug === 'dot-art-converter' || 
      cel.slug === 'dot-converter' || 
      cel.slug === 'converter' ||
      cel.name?.toLowerCase().includes('dot') ||
      cel.name?.toLowerCase().includes('converter') ||
      cel.name?.toLowerCase().includes('convertor')

    if (compare && isDotConverter) return acc

    // Filter by search query (case-insensitive name check)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!cel.name?.toLowerCase().includes(q)) {
        return acc
      }
    }

    const letter = (cel.name?.charAt(0) || '#').toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(cel)
    return acc
  }, {})

  // Sort keys alphabetically
  const sortedLetters = Object.keys(grouped).sort()

  const renderProfileItem = (cel, index, letter) => {
    const isSelected = selectedCel && selectedCel.id === cel.id
    
    const content = (
      <div 
        onClick={(e) => {
          if (compare) {
            e.preventDefault()
            setSelectedCel(cel)
          }
        }}
        onDoubleClick={(e) => {
          if (compare) {
            e.preventDefault()
            router.push(`/celebrity/${compare}?compare=${cel.slug}`)
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          background: isSelected ? 'var(--surface2)' : 'transparent',
          transition: 'background 0.2s',
          borderBottom: '1px solid #f0f0f0'
        }}
        onMouseEnter={e => {
          if (!isSelected) e.currentTarget.style.background = '#f8f9fa'
        }}
        onMouseLeave={e => {
          if (!isSelected) e.currentTarget.style.background = 'transparent'
        }}
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
          gap: 20
        }}>
          {/* Avatar */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#e0e0e0',
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
          
          {/* Name & Subtext */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 500,
              color: '#202124',
              fontFamily: 'Roboto, "Segoe UI", sans-serif'
            }}>
              {cel.name}
            </div>
            <div style={{
              fontSize: 12.5,
              color: 'var(--text-muted)',
              fontFamily: 'Roboto, "Segoe UI", sans-serif',
              display: 'flex',
              alignItems: 'center',
            }}>
              <span>{formatCount(cel.followers_count)} followers</span>
            </div>
          </div>

          {/* Checkmark circle if in compare mode */}
          {compare && (
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: isSelected ? '5px solid var(--accent)' : '2px solid var(--border)',
              background: '#fff',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }} />
          )}
        </div>
      </div>
    )

    if (compare) {
      return <div key={cel.id}>{content}</div>
    } else {
      return (
        <Link key={cel.id} href={`/celebrity/${cel.slug}`} style={{ textDecoration: 'none' }}>
          {content}
        </Link>
      )
    }
  }

  return (
    <>
      <Head>
        <title>All Profiles — Spialr</title>
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 140px' }}>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 800,
          marginBottom: compare ? 12 : 24,
        }}>
          {compare ? 'Select Profile to Compare:' : 'All Available Profiles:'}
        </h1>

        {originalCelebrity && (
          <div style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 24 }}>
            Comparing with: <strong>{originalCelebrity.name}</strong>
          </div>
        )}

        {/* Small Search Bar */}
        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 500 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border-bright)',
            borderRadius: 12,
            padding: '4px 4px 4px 14px',
            gap: 8,
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
          onFocusCapture={(e) => {
            const container = e.currentTarget;
            container.style.borderColor = 'var(--accent)';
            container.style.boxShadow = '0 0 0 3px rgba(225, 48, 108, 0.15)';
          }}
          onBlurCapture={(e) => {
            const container = e.currentTarget;
            container.style.borderColor = 'var(--border-bright)';
            container.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
          }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search profiles..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: 15,
                flex: 1,
                padding: '8px 0',
                outline: 'none',
                color: 'var(--text)',
                fontFamily: 'Roboto, "Segoe UI", sans-serif'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'var(--surface2)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 2
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ position: 'relative', background: '#fff', borderRadius: '12px', overflow: 'hidden', paddingBottom: '24px' }}>
            {(() => {
              let globalIndex = 0
              return sortedLetters.map(letter => (
                <div key={letter} id={`letter-${letter}`} style={{ display: 'flex', flexDirection: 'column', scrollMarginTop: '80px' }}>
                  {grouped[letter].map((cel, index) => {
                    return (
                      <div key={cel.id}>
                        {renderProfileItem(cel, index, letter)}
                      </div>
                    )
                  })}
                </div>
              ))
            })()}

            {celebrities.length > 0 && sortedLetters.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '24px 20px',
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.02em',
                fontFamily: 'Roboto, "Segoe UI", sans-serif',
                marginTop: 20
              }}>
                ✨ More profiles will be added soon!
              </div>
            )}
            
            {(celebrities.length === 0 || sortedLetters.length === 0) && (
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

        {/* Floating Compare Enter Button (below right) */}
        {compare && selectedCel && (
          <button 
            className="btn btn-primary" 
            style={{
              position: 'fixed',
              bottom: 80,
              right: 20,
              zIndex: 200,
              padding: '12px 24px',
              borderRadius: 12,
              boxShadow: '0 8px 30px rgba(225, 48, 108, 0.35)',
              animation: 'fadeIn 0.2s var(--spring) forwards',
              cursor: 'pointer'
            }}
            onClick={() => router.push(`/celebrity/${compare}?compare=${selectedCel.slug}`)}
          >
            Compare
          </button>
        )}
      </main>
    </>
  )
}
