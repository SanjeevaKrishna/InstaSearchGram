import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const closeDropdown = () => {
    setTimeout(() => {
      setDropdownOpen(false)
    }, 150)
  }

  return (
    <>
      {dropdownOpen && (
        <div 
          onClick={() => setDropdownOpen(false)} 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'transparent'
          }} 
        />
      )}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}>🔍</div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 19,
                  letterSpacing: '-0.03em',
                }}>
                  Spi<span className="gradient-text">alr</span>
                </span>
                <span className="gradient-text" style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  fontFamily: 'var(--font-body)',
                }}>
                  search posts & analyze ranks
                </span>
              </div>
            </div>
          </Link>

          {/* Right Section Container */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Nav links */}
            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>Home</button>
              </Link>
              <Link href="/all">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>All Profiles</button>
              </Link>
              <Link href="/live">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>Live</button>
              </Link>
              <Link href="/instanews">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>InstaNews</button>
              </Link>
              <Link href="/about">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>About</button>
              </Link>
            </div>

            {/* Menu Dropdown */}
            <div style={{ position: 'relative', zIndex: 999 }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  padding: '8px 14px', 
                  fontSize: 13, 
                  borderRadius: '100px',
                  border: '1px solid var(--border)',
                  background: dropdownOpen ? 'var(--surface2)' : 'transparent',
                  color: 'var(--text)'
                }}
              >
                <span style={{ fontWeight: 600 }}>Menu</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 280,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', padding: '4px 10px', marginBottom: 4 }}>
                    Menu Links
                  </div>

                  <Link href="/" className="dropdown-item" onClick={closeDropdown}>
                    🏠 Home
                  </Link>
                  <Link href="/about" className="dropdown-item" onClick={closeDropdown}>
                    ℹ️ About Us
                  </Link>
                  <Link href="/contact" className="dropdown-item" onClick={closeDropdown}>
                    ✉️ Contact Us
                  </Link>
                  <Link href="/privacy" className="dropdown-item" onClick={closeDropdown}>
                    🛡️ Privacy Policy
                  </Link>
                  <Link href="/terms" className="dropdown-item" onClick={closeDropdown}>
                    📜 Terms & Conditions
                  </Link>
                  <Link href="/disclaimer" className="dropdown-item" onClick={closeDropdown}>
                    ⚠️ Disclaimer
                  </Link>
                  <Link href="/dmca" className="dropdown-item" onClick={closeDropdown}>
                    ⚖️ DMCA (optional but good)
                  </Link>
                  <Link href="/request" className="dropdown-item" onClick={closeDropdown}>
                    ➕ Request Creator / Suggest Profile
                  </Link>
                  <Link href="/instanews" className="dropdown-item" onClick={closeDropdown}>
                    📰 InstaNews
                  </Link>
                  <Link href="/live" className="dropdown-item" onClick={closeDropdown}>
                    📈 Trending / Live
                  </Link>

                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

                  {/* Crawlers / SEO tools */}
                  <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>Sitemap: <a href="/sitemap.xml" target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>sitemap.xml</a></span>
                      <span style={{ color: '#00c853', fontWeight: 600 }}>Verified</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>ads.txt Status:</span>
                      <span style={{ color: '#00c853', fontWeight: 600 }}>Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
