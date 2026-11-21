import Link from 'next/link'
import { Users, Image } from 'lucide-react'

export default function CelebrityCard({ celebrity }) {
  const formatCount = (n) => {
    if (!n) return '—'
    const num = Number(n)
    if (isNaN(num)) return n.toString()

    // Pre-round to 3 significant figures to handle rollovers (e.g. 999900 -> 1000000)
    const roundedNum = Number(num.toPrecision(3))

    const formatWithPrec = (value, suffix) => {
      let formatted = Number(value.toPrecision(3)).toString()
      return formatted + suffix
    }

    if (roundedNum >= 1e12) return formatWithPrec(roundedNum / 1e12, 'T')
    if (roundedNum >= 1e9) return formatWithPrec(roundedNum / 1e9, 'B')
    if (roundedNum >= 1e6) return formatWithPrec(roundedNum / 1e6, 'M')
    if (roundedNum >= 1000) return formatWithPrec(roundedNum / 1000, 'K')
    return roundedNum.toString()
  }

  const isLive = !!celebrity.isLive
  const targetHref = isLive ? `/profile/${celebrity.slug}` : `/celebrity/${celebrity.slug}`

  return (
    <Link href={targetHref}>
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
          transition: 'all 0.3s var(--spring)',
          border: isLive ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid var(--border)',
          background: isLive ? 'rgba(147, 51, 234, 0.03)' : undefined,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = isLive ? '#a855f7' : 'var(--border-bright)'
          e.currentTarget.style.transform = 'translateY(-2px)'
          if (isLive) e.currentTarget.style.boxShadow = '0 6px 24px rgba(168, 85, 247, 0.18)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isLive ? 'rgba(168, 85, 247, 0.35)' : 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
          if (isLive) e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Avatar with Story Ring */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: isLive ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #4f46e5 100%)' : 'var(--gradient)',
          padding: 3, // Ring thickness
          flexShrink: 0,
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'var(--surface)', // Inner background to create ring effect
            padding: 2, // Inner spacing
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: 'white',
              fontFamily: 'var(--font-display)',
              overflow: 'hidden',
            }}>
              {celebrity.photo_url ? (
                <img
                  src={celebrity.photo_url}
                  alt={celebrity.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                celebrity.name?.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {celebrity.name}
            </span>
            {isLive && (
              <span style={{
                background: 'rgba(147, 51, 234, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#a855f7',
                  boxShadow: '0 0 8px #a855f7'
                }} />
                LIVE TRACKER
              </span>
            )}
          </div>
          {celebrity.instagram_handle && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              @{celebrity.instagram_handle}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {celebrity.followers_count && (
              <span style={{ fontSize: 13.5, color: isLive ? '#c084fc' : 'var(--text-dim)', display: 'inline-flex', alignItems: 'center' }}>
                <Users size={15} style={{ marginRight: 4 }} /> {formatCount(celebrity.followers_count)} {isLive ? 'live followers' : 'followers'}
              </span>
            )}
            {celebrity.posts_count && !isLive && (
              <span style={{ fontSize: 13.5, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center' }}>
                <Image size={15} style={{ marginRight: 4 }} /> {celebrity.posts_count} posts
              </span>
            )}
          </div>
        </div>

        {/* Arrow / Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: isLive ? '#c084fc' : 'var(--text)',
            background: isLive ? 'rgba(147, 51, 234, 0.15)' : 'var(--surface2)',
            padding: '6px 14px',
            borderRadius: '100px',
            border: isLive ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid var(--border)'
          }}>{isLive ? 'Live Count →' : 'View'}</div>
        </div>
      </div>
    </Link>
  )
}
