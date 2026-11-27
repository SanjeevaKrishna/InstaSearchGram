import React from 'react'
import { Award, Trophy, Crown, Star, Sparkles, Shield } from 'lucide-react'

// Metallic Silver Trophy SVG (100K+)
export const SilverTrophySvg = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}
  >
    <defs>
      <linearGradient id="silverGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#e2e8f0" />
        <stop offset="70%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="silverHandle" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>
    {/* Trophy Cup */}
    <path
      d="M6 3h12v7a6 6 0 0 1-12 0V3z"
      fill="url(#silverGrad)"
      stroke="#cbd5e1"
      strokeWidth="1.2"
    />
    {/* Left Handle */}
    <path
      d="M6 5H3.5a2.5 2.5 0 0 0 0 5H6"
      stroke="url(#silverHandle)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Right Handle */}
    <path
      d="M18 5h2.5a2.5 2.5 0 0 1 0 5H18"
      stroke="url(#silverHandle)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Stem */}
    <path
      d="M10 16h4v3h-4z"
      fill="#94a3b8"
      stroke="#cbd5e1"
      strokeWidth="1"
    />
    {/* Base */}
    <path
      d="M7 19h10v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2z"
      fill="url(#silverGrad)"
      stroke="#cbd5e1"
      strokeWidth="1.2"
    />
    {/* Engraved Star */}
    <polygon
      points="12,6 13,8.5 15.5,8.5 13.5,10 14.5,12.5 12,11 9.5,12.5 10.5,10 8.5,8.5 11,8.5"
      fill="#ffffff"
      opacity="0.95"
    />
  </svg>
)

// Metallic 24K Gold Trophy SVG (1M+)
export const GoldTrophySvg = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(217, 119, 6, 0.4))' }}
  >
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="35%" stopColor="#f59e0b" />
        <stop offset="75%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="goldRim" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <path
      d="M6 3h12v7a6 6 0 0 1-12 0V3z"
      fill="url(#goldGrad)"
      stroke="#fde047"
      strokeWidth="1.2"
    />
    <path
      d="M6 5H3.5a2.5 2.5 0 0 0 0 5H6"
      stroke="url(#goldRim)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M18 5h2.5a2.5 2.5 0 0 1 0 5H18"
      stroke="url(#goldRim)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M10 16h4v3h-4z"
      fill="#b45309"
      stroke="#fde047"
      strokeWidth="1"
    />
    <path
      d="M7 19h10v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2z"
      fill="url(#goldGrad)"
      stroke="#fde047"
      strokeWidth="1.2"
    />
    <polygon
      points="12,5.5 13.2,8 16,8 13.8,9.7 14.8,12.2 12,10.6 9.2,12.2 10.2,9.7 8,8 10.8,8"
      fill="#fffbeb"
      opacity="0.95"
    />
  </svg>
)

// Metallic Bronze Trophy SVG (1K+)
export const BronzeTrophySvg = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 3px rgba(180, 83, 9, 0.3))' }}
  >
    <defs>
      <linearGradient id="bronzeGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="40%" stopColor="#d97706" />
        <stop offset="70%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    <path
      d="M6 3h12v7a6 6 0 0 1-12 0V3z"
      fill="url(#bronzeGrad)"
      stroke="#fcd34d"
      strokeWidth="1.2"
    />
    <path
      d="M6 5H3.5a2.5 2.5 0 0 0 0 5H6"
      stroke="#d97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M18 5h2.5a2.5 2.5 0 0 1 0 5H18"
      stroke="#d97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M10 16h4v3h-4z"
      fill="#92400e"
      stroke="#fcd34d"
      strokeWidth="1"
    />
    <path
      d="M7 19h10v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2z"
      fill="url(#bronzeGrad)"
      stroke="#fcd34d"
      strokeWidth="1.2"
    />
    <circle cx="12" cy="9" r="2.2" fill="#fff" opacity="0.9" />
  </svg>
)

// Brilliant Diamond Trophy SVG (10M+)
export const DiamondTrophySvg = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.45))' }}
  >
    <defs>
      <linearGradient id="diamondGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f0f9ff" />
        <stop offset="30%" stopColor="#38bdf8" />
        <stop offset="70%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    {/* Diamond Facets */}
    <path
      d="M6 3h12l4 6-10 12L2 9l4-6z"
      fill="url(#diamondGrad)"
      stroke="#bae6fd"
      strokeWidth="1.2"
    />
    <path
      d="M2 9h20M12 21L7.5 9 10 3m4 0l2.5 6L12 21"
      stroke="#e0f2fe"
      strokeWidth="1"
      opacity="0.85"
    />
  </svg>
)

// Centurion Legend Trophy SVG (100M+)
export const CenturionTrophySvg = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 10px rgba(239, 68, 68, 0.5))' }}
  >
    <defs>
      <linearGradient id="centurionGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef2f2" />
        <stop offset="30%" stopColor="#ef4444" />
        <stop offset="70%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
    </defs>
    {/* Crown & Star */}
    <path
      d="M5 16L3 5l5.5 5L12 3l3.5 7L21 5l-2 11H5z"
      fill="url(#centurionGrad)"
      stroke="#fca5a5"
      strokeWidth="1.2"
    />
    <path
      d="M5 18h14v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2z"
      fill="#991b1b"
      stroke="#fca5a5"
      strokeWidth="1"
    />
    <circle cx="12" cy="14" r="2" fill="#fff" />
  </svg>
)

// Helper to determine exact tier definition from follower count
export function getMilestoneTier(followersCount) {
  const count = Number(followersCount) || 0

  if (count >= 100000000) {
    return {
      tierKey: 'centurion',
      label: '100M',
      title: 'Centurion Legend',
      badgeLevel: '100M+ Milestone',
      tierColor: '#ef4444',
      textColor: '#fca5a5',
      borderColor: 'rgba(239, 68, 68, 0.5)',
      glowColor: 'rgba(239, 68, 68, 0.35)',
      bg: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
      pillBg: 'rgba(239, 68, 68, 0.12)',
      pillBorder: 'rgba(239, 68, 68, 0.35)',
      shadow: 'rgba(239, 68, 68, 0.35)',
      accent: '#ef4444',
      iconSvg: <CenturionTrophySvg size={18} />,
      miniSvg: <CenturionTrophySvg size={14} />,
      nextTarget: null,
      desc: 'Top 0.001% of Instagram creators worldwide. 100M+ Centurion tier reached.'
    }
  }

  if (count >= 50000000) {
    return {
      tierKey: 'crown',
      label: '50M',
      title: 'Crown Supernova',
      badgeLevel: '50M+ Milestone',
      tierColor: '#ec4899',
      textColor: '#f472b6',
      borderColor: 'rgba(236, 72, 153, 0.5)',
      glowColor: 'rgba(236, 72, 153, 0.35)',
      bg: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
      pillBg: 'rgba(236, 72, 153, 0.12)',
      pillBorder: 'rgba(236, 72, 153, 0.35)',
      shadow: 'rgba(236, 72, 153, 0.3)',
      accent: '#ec4899',
      iconSvg: <Crown size={17} color="#fff" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }} />,
      miniSvg: <Crown size={14} color="#f472b6" />,
      nextTarget: 100000000,
      desc: 'Superstar status. Surpassed 50 Million followers.'
    }
  }

  if (count >= 10000000) {
    return {
      tierKey: 'diamond',
      label: '10M',
      title: 'Diamond Icon',
      badgeLevel: '10M+ Milestone',
      tierColor: '#38bdf8',
      textColor: '#7dd3fc',
      borderColor: 'rgba(56, 189, 248, 0.55)',
      glowColor: 'rgba(56, 189, 248, 0.35)',
      bg: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
      pillBg: 'rgba(56, 189, 248, 0.12)',
      pillBorder: 'rgba(56, 189, 248, 0.35)',
      shadow: 'rgba(56, 189, 248, 0.3)',
      accent: '#38bdf8',
      iconSvg: <DiamondTrophySvg size={18} />,
      miniSvg: <DiamondTrophySvg size={14} />,
      nextTarget: 50000000,
      desc: 'Diamond Play status. Over 10 Million followers worldwide.'
    }
  }

  if (count >= 1000000) {
    return {
      tierKey: 'gold',
      label: '1M',
      title: 'Gold Millionaire',
      badgeLevel: '1M+ Milestone',
      tierColor: '#f59e0b',
      textColor: '#fde047',
      borderColor: 'rgba(245, 158, 11, 0.55)',
      glowColor: 'rgba(245, 158, 11, 0.35)',
      bg: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
      pillBg: 'rgba(245, 158, 11, 0.12)',
      pillBorder: 'rgba(245, 158, 11, 0.35)',
      shadow: 'rgba(245, 158, 11, 0.3)',
      accent: '#f59e0b',
      iconSvg: <GoldTrophySvg size={18} />,
      miniSvg: <GoldTrophySvg size={14} />,
      nextTarget: 10000000,
      desc: 'Official 1M+ Gold Play creator milestone.'
    }
  }

  if (count >= 100000) {
    return {
      tierKey: 'silver',
      label: '100K',
      title: 'Silver Creator',
      badgeLevel: '100K+ Milestone',
      tierColor: '#cbd5e1',
      textColor: '#f1f5f9',
      borderColor: 'rgba(203, 213, 225, 0.55)',
      glowColor: 'rgba(203, 213, 225, 0.3)',
      bg: 'linear-gradient(135deg, #475569 0%, #cbd5e1 100%)',
      pillBg: 'rgba(203, 213, 225, 0.12)',
      pillBorder: 'rgba(203, 213, 225, 0.35)',
      shadow: 'rgba(203, 213, 225, 0.25)',
      accent: '#e2e8f0',
      iconSvg: <SilverTrophySvg size={18} />,
      miniSvg: <SilverTrophySvg size={14} />,
      nextTarget: 1000000,
      desc: 'Official 100K+ Silver Play creator milestone.'
    }
  }

  if (count >= 10000) {
    return {
      tierKey: 'vanguard',
      label: '10K',
      title: 'Community Vanguard',
      badgeLevel: '10K+ Milestone',
      tierColor: '#6366f1',
      textColor: '#a5b4fc',
      borderColor: 'rgba(99, 102, 241, 0.45)',
      glowColor: 'rgba(99, 102, 241, 0.25)',
      bg: 'linear-gradient(135deg, #3730a3 0%, #6366f1 100%)',
      pillBg: 'rgba(99, 102, 241, 0.1)',
      pillBorder: 'rgba(99, 102, 241, 0.3)',
      shadow: 'rgba(99, 102, 241, 0.2)',
      accent: '#6366f1',
      iconSvg: <Star size={16} color="#fff" />,
      miniSvg: <Star size={13} color="#a5b4fc" />,
      nextTarget: 100000,
      desc: 'Established audience. 10K+ followers reached.'
    }
  }

  if (count >= 1000) {
    return {
      tierKey: 'bronze',
      label: '1K',
      title: 'Bronze Creator',
      badgeLevel: '1K+ Milestone',
      tierColor: '#d97706',
      textColor: '#fcd34d',
      borderColor: 'rgba(217, 119, 6, 0.5)',
      glowColor: 'rgba(217, 119, 6, 0.3)',
      bg: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
      pillBg: 'rgba(217, 119, 6, 0.1)',
      pillBorder: 'rgba(217, 119, 6, 0.3)',
      shadow: 'rgba(217, 119, 6, 0.25)',
      accent: '#d97706',
      iconSvg: <BronzeTrophySvg size={18} />,
      miniSvg: <BronzeTrophySvg size={14} />,
      nextTarget: 10000,
      desc: '1,000+ Bronze milestone unlocked.'
    }
  }

  return {
    tierKey: 'rising',
    label: 'Rising',
    title: 'Rising Creator',
    badgeLevel: 'Starter Tier',
    tierColor: '#94a3b8',
    textColor: '#cbd5e1',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    glowColor: 'rgba(148, 163, 184, 0.15)',
    bg: 'linear-gradient(135deg, #334155 0%, #64748b 100%)',
    pillBg: 'rgba(148, 163, 184, 0.08)',
    pillBorder: 'rgba(148, 163, 184, 0.25)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    accent: '#94a3b8',
    iconSvg: <Shield size={16} color="#fff" />,
    miniSvg: <Shield size={13} color="#cbd5e1" />,
    nextTarget: 1000,
    desc: 'Rising creator account.'
  }
}

export default function MilestoneTrophyBadge({
  followersCount = 0,
  mode = 'avatar-pin', // 'avatar-pin' | 'hero-pill' | 'showcase-card'
  onClick = null,
  style = {}
}) {
  const tier = getMilestoneTier(followersCount)

  // 1. Avatar Pin (Floating badge on avatar top-right)
  if (mode === 'avatar-pin') {
    return (
      <div
        onClick={onClick}
        title={`${tier.title} (${tier.label}+ Milestone) — Tap to view achievements`}
        style={{
          position: 'absolute',
          top: -3,
          right: -3,
          background: tier.bg,
          border: `2px solid ${tier.accent}`,
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 14px ${tier.shadow}`,
          cursor: onClick ? 'pointer' : 'default',
          zIndex: 6,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          ...style
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.boxShadow = `0 6px 18px ${tier.shadow}`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = `0 4px 14px ${tier.shadow}`
        }}
      >
        {tier.iconSvg}
      </div>
    )
  }

  // 2. Hero Pill (Beside name/rank or right beneath avatar)
  return (
    <div
      onClick={onClick}
      title={`${tier.title} (${tier.label}+ Milestone) — Tap to view milestone roadmap`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: tier.pillBg,
        border: `1px solid ${tier.pillBorder}`,
        borderRadius: 100,
        padding: '5px 14px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: `0 2px 10px ${tier.shadow}`,
        transition: 'all 0.2s ease',
        ...style
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 4px 16px ${tier.shadow}`
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = `0 2px 10px ${tier.shadow}`
        }
      }}
    >
      {tier.miniSvg}
      <span style={{ fontSize: 12, fontWeight: 750, color: tier.textColor }}>
        {tier.title} · {tier.label}+ Trophy
      </span>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: tier.textColor,
        opacity: 0.85,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '1px 6px',
        borderRadius: 8
      }}>
        Unlocked
      </span>
    </div>
  )
}
