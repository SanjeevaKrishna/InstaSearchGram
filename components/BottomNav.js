import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  const router = useRouter()

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'All Profiles', path: '/all', icon: '👥' },
    { name: 'Live', path: '/live', icon: '⚡' },
    { name: 'InstaNews', path: '/instanews', icon: '📰' },
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
                  <span className="icon">{item.icon}</span>
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
