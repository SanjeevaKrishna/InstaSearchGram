import { useState } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import { Home, Info, Mail, ShieldCheck, FileText, AlertTriangle, Scale, PlusCircle, Newspaper, TrendingUp, MessageSquare, Flame } from 'lucide-react'

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
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Logo height={30} />
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
              <Link href="/trending">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>Trending</button>
              </Link>
              <Link href="/live">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>Live</button>
              </Link>
              <Link href="/chat">
                <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, borderRadius: '100px' }}>Chat</button>
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
                    <Home size={14} style={{ marginRight: 8 }} /> Home
                  </Link>
                  <Link href="/about" className="dropdown-item" onClick={closeDropdown}>
                    <Info size={14} style={{ marginRight: 8 }} /> About Us
                  </Link>
                  <Link href="/contact" className="dropdown-item" onClick={closeDropdown}>
                    <Mail size={14} style={{ marginRight: 8 }} /> Contact Us
                  </Link>
                  <Link href="/privacy" className="dropdown-item" onClick={closeDropdown}>
                    <ShieldCheck size={14} style={{ marginRight: 8 }} /> Privacy Policy
                  </Link>
                  <Link href="/terms" className="dropdown-item" onClick={closeDropdown}>
                    <FileText size={14} style={{ marginRight: 8 }} /> Terms & Conditions
                  </Link>
                  <Link href="/disclaimer" className="dropdown-item" onClick={closeDropdown}>
                    <AlertTriangle size={14} style={{ marginRight: 8 }} /> Disclaimer
                  </Link>
                  <Link href="/dmca" className="dropdown-item" onClick={closeDropdown}>
                    <Scale size={14} style={{ marginRight: 8 }} /> DMCA (optional but good)
                  </Link>
                  <Link href="/request" className="dropdown-item" onClick={closeDropdown}>
                    <PlusCircle size={14} style={{ marginRight: 8 }} /> Request Creator / Suggest Profile
                  </Link>
                  <Link href="/trending" className="dropdown-item" onClick={closeDropdown}>
                    <TrendingUp size={14} style={{ marginRight: 8 }} /> Trending
                  </Link>
                  <Link href="/live" className="dropdown-item" onClick={closeDropdown}>
                    <Flame size={14} style={{ marginRight: 8 }} /> Live
                  </Link>
                  <Link href="/chat" className="dropdown-item" onClick={closeDropdown}>
                    <MessageSquare size={14} style={{ marginRight: 8 }} /> Chat Room
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
