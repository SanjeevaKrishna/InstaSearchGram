import React from 'react'

export default function Logo({ height = 32 }) {
  // Orange-to-pink brand gradient matching the Site UI
  const gradientId = "spialr-logo-gradient"

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, select: 'none', WebkitUserSelect: 'none' }}>
      <svg 
        viewBox="0 0 32 32" 
        width={height} 
        height={height} 
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>

        {/* Magnifying Glass (Search) */}
        <circle 
          cx="14" 
          cy="14" 
          r="9" 
          fill="none" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="2.8" 
        />
        {/* Handle */}
        <line 
          x1="20.5" 
          y1="20.5" 
          x2="28" 
          y2="28" 
          stroke={`url(#${gradientId})`} 
          strokeWidth="2.8" 
          strokeLinecap="round" 
        />

        {/* Podiums/Steps (Rank) inside the lens */}
        {/* Bar 1 */}
        <rect 
          x="8.5" 
          y="15.5" 
          width="2.5" 
          height="4.5" 
          rx="0.8" 
          fill={`url(#${gradientId})`} 
        />
        {/* Bar 2 */}
        <rect 
          x="12.7" 
          y="12" 
          width="2.5" 
          height="8" 
          rx="0.8" 
          fill={`url(#${gradientId})`} 
        />
        {/* Bar 3 */}
        <rect 
          x="17" 
          y="8" 
          width="2.5" 
          height="12" 
          rx="0.8" 
          fill={`url(#${gradientId})`} 
        />
      </svg>

      {/* Brand Text */}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 850,
        fontSize: 20,
        color: 'var(--text)',
        letterSpacing: '-0.03em',
        lineHeight: 1
      }}>
        Spi<span style={{
          background: 'linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>alr</span>
      </span>
    </div>
  )
}
