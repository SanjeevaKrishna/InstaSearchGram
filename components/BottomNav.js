import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  const router = useRouter()

  const navItems = [
    { 
      name: 'Home', 
      path: '/', 
      iconOutline: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      iconFilled: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20 20H14V12H10V20H4V10L12 3L20 10V20Z"/>
        </svg>
      )
    },
    { 
      name: 'All Profiles', 
      path: '/all', 
      iconOutline: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      iconFilled: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      )
    },
    { 
      name: 'Trending', 
      path: '/trending', 
      iconOutline: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      iconFilled: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M16 6l2.29 2.29-4.88 4.88-3-3L2 18.59 3.41 20l7-7 3 3 6.29-6.29L22 12V6h-6z"/>
        </svg>
      )
    },
    { 
      name: 'Live', 
      path: '/live', 
      iconOutline: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      ),
      iconFilled: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      )
    },
    { 
      name: 'Chat', 
      path: '/chat', 
      iconOutline: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      iconFilled: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      )
    }
  ]

  return (
    <>
      <div className="bottom-nav-spacer" style={{ height: 70 }} />
      <nav className="bottom-nav">
        <div className="bottom-nav-container">
          {navItems.map((item) => {
            const isActive = router.pathname === item.path
            return (
              <Link key={item.path} href={item.path}>
                <div className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
                  <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>
                    {isActive ? item.iconFilled : item.iconOutline}
                  </span>
                  <span className="label">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
