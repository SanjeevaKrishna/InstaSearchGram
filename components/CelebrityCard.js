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

  return (
    <Link href={`/celebrity/${celebrity.slug}`}>
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer',
          transition: 'all 0.3s var(--spring)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-bright)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Avatar with Story Ring */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--gradient)',
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
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {celebrity.name}
          </div>
          {celebrity.instagram_handle && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              @{celebrity.instagram_handle}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {celebrity.followers_count && (
              <span style={{ fontSize: 13.5, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center' }}>
                <Users size={15} style={{ marginRight: 4 }} /> {formatCount(celebrity.followers_count)} followers
              </span>
            )}
            {celebrity.posts_count && (
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
            color: 'var(--text)',
            background: 'var(--surface2)',
            padding: '6px 14px',
            borderRadius: '100px',
            border: '1px solid var(--border)'
          }}>View</div>
        </div>
      </div>
    </Link>
  )
}
