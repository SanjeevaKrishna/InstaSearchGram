import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Download, RotateCcw, Share2, Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { generateMilestones, formatMilestoneLabel, parseMilestoneParam, findMilestoneAchievedDate } from '../../../lib/milestones'
import { exportMilestoneVideo } from '../../../lib/milestoneVideoExporter'

const InstagramIcon = ({ size = 20, style = {} }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

export default function MilestoneCelebrationPage({ profile, milestoneValue, achievedDate, allMilestones = [], slug = '' }) {
  const router = useRouter()
  const [displayCount, setDisplayCount] = useState(0)
  const [isBlasted, setIsBlasted] = useState(false)
  const [progress, setProgress] = useState(0) // 0 to 15 seconds
  const [isPlaying, setIsPlaying] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [copied, setCopied] = useState(false)

  const animationFrameRef = useRef(null)
  const startTimeRef = useRef(null)
  const confettiCanvasRef = useRef(null)
  const particlesRef = useRef([])

  const totalDuration = 15000 // 15 seconds
  const partyBombTime = 10000 // 10 seconds party blast
  const startCount = Math.floor(milestoneValue * 0.992) // e.g. 992,000 for 1M

  // ── Confetti Particle Engine ──
  const triggerConfettiBlast = useCallback(() => {
    const canvas = confettiCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15', '#06b6d4']
    const newParticles = []
    const count = 180

    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0
      const originX = fromLeft ? 80 : canvas.width - 80
      const originY = canvas.height - 100
      const angle = fromLeft
        ? -Math.PI / 4 + (Math.random() - 0.5) * 0.9
        : -3 * Math.PI / 4 + (Math.random() - 0.5) * 0.9
      const speed = 16 + Math.random() * 22

      newParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.55,
        size: 8 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        life: 1.0,
      })
    }
    particlesRef.current = newParticles

    let particleAnimId
    const renderParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let activeCount = 0

      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.rotation += p.spin
        p.life -= 0.0035

        if (p.life > 0 && p.y < canvas.height + 40) {
          activeCount++
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.color
          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.6)
          } else {
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        }
      })

      if (activeCount > 0) {
        particleAnimId = requestAnimationFrame(renderParticles)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    renderParticles()
  }, [])

  // ── 15-Second Animation Loop ──
  const startAnimation = useCallback(() => {
    setIsBlasted(false)
    startTimeRef.current = performance.now()

    const step = (now) => {
      const elapsed = now - startTimeRef.current
      const currentSec = Math.min(elapsed, totalDuration)
      setProgress(currentSec)

      if (elapsed < partyBombTime) {
        // Counting up smoothly from startCount to milestoneValue over 10 seconds
        const t = elapsed / partyBombTime
        const eased = 1 - Math.pow(1 - t, 3) // Smooth deceleration
        setDisplayCount(Math.round(startCount + (milestoneValue - startCount) * eased))
      } else {
        // Hit exactly at 10 seconds!
        setDisplayCount(milestoneValue)
        setIsBlasted(true)
      }

      if (elapsed >= partyBombTime && elapsed <= partyBombTime + 50) {
        triggerConfettiBlast()
      }

      if (elapsed < totalDuration) {
        animationFrameRef.current = requestAnimationFrame(step)
      } else {
        setIsPlaying(false)
      }
    }

    setIsPlaying(true)
    animationFrameRef.current = requestAnimationFrame(step)
  }, [milestoneValue, startCount, triggerConfettiBlast])

  useEffect(() => {
    startAnimation()
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [milestoneValue, startAnimation])

  // ── Video Download Handler ──
  const handleDownloadVideo = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportProgress(0)

    try {
      await exportMilestoneVideo({
        profile,
        milestoneValue,
        achievedDate,
        onProgress: (pct) => setExportProgress(pct),
      })
      setTimeout(() => setIsExporting(false), 1200)
    } catch (err) {
      console.error(err)
      alert('Could not export video: ' + (err.message || 'Error'))
      setIsExporting(false)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  // Find previous and next milestones for quick navigation
  const currentIndex = allMilestones.indexOf(milestoneValue)
  const prevMilestone = currentIndex > 0 ? allMilestones[currentIndex - 1] : null
  const nextMilestone = currentIndex >= 0 && currentIndex < allMilestones.length - 1 ? allMilestones[currentIndex + 1] : null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <Head>
        <title>{profile?.name} - {formatMilestoneLabel(milestoneValue)} Milestone Celebration | Spialr</title>
        <meta name="description" content={`Official celebration video for ${profile?.name} reaching ${formatMilestoneLabel(milestoneValue)} Instagram followers on Spialr.`} />
      </Head>

      {/* Confetti Canvas Overlay */}
      <canvas
        ref={confettiCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100
        }}
      />

      {/* Top Navbar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #f1f5f9',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <Link
          href={`/profile/${slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#475569',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 700
          }}
        >
          <ArrowLeft size={18} />
          <span>Profile</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 100,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handleDownloadVideo}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: isExporting ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 100,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 800,
              cursor: isExporting ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={15} />
            <span>{isExporting ? `Exporting (${exportProgress}%)` : 'Download 15s Video'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: 620,
        margin: '24px auto 60px',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>

        {/* Milestone Indicator Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: isBlasted ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)',
          border: `1px solid ${isBlasted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
          borderRadius: 100,
          padding: '6px 16px',
          marginBottom: 18,
          transition: 'all 0.4s ease'
        }}>
          <Sparkles size={15} color={isBlasted ? '#ef4444' : '#6366f1'} />
          <span style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: isBlasted ? '#ef4444' : '#6366f1',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            {isBlasted ? '🎉 Milestone Unlocked' : 'Approaching Milestone'}
          </span>
        </div>

        {/* ── CARD (Strictly matching Image 3 Drawing) ── */}
        <div style={{
          width: '100%',
          background: '#ffffff',
          borderRadius: 28,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.06)',
          padding: '40px 24px 34px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>

          {/* 1. Circle Image (Image 3) */}
          <div style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            padding: 4,
            background: isBlasted
              ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
              : '#e2e8f0',
            boxShadow: isBlasted ? '0 10px 30px rgba(220, 39, 67, 0.35)' : 'none',
            marginBottom: 16,
            transition: 'all 0.5s ease'
          }}>
            <img
              src={profile?.profile_pic_url || '/placeholder-avatar.png'}
              alt={profile?.name || 'Creator'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#ffffff'
              }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Creator')}&size=200&bold=true&background=6366f1&color=fff`
              }}
            />
          </div>

          {/* 2. Name (Image 3) */}
          <h1 style={{
            fontSize: 26,
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 4px',
            fontFamily: 'var(--font-display, sans-serif)',
            letterSpacing: '-0.02em'
          }}>
            {profile?.name}
          </h1>

          {profile?.instagram_handle && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 14,
              fontWeight: 700,
              color: '#9333ea',
              marginBottom: 24
            }}>
              <InstagramIcon size={14} />
              <span>@{profile.instagram_handle}</span>
            </div>
          )}

          {/* 3. Follower Count: "- follower count -" (Image 3) */}
          <div style={{
            margin: '12px 0 16px',
            position: 'relative'
          }}>
            <div style={{
              fontSize: 'clamp(32px, 8.5vw, 48px)',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: isBlasted ? '#ef4444' : '#0f172a',
              letterSpacing: '-0.03em',
              transition: 'color 0.4s ease',
              lineHeight: 1
            }}>
              - {displayCount.toLocaleString('en-US')} -
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 10
            }}>
              Followers
            </div>
          </div>

          {/* 4. Achieved Date (Image 3) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 100,
            padding: '7px 18px',
            marginTop: 10,
            marginBottom: 22
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
              {achievedDate ? `Achieved Date: ${achievedDate}` : 'Milestone Record'}
            </span>
          </div>

          {/* Congratulations Pop-In Banner at 10s */}
          <div style={{
            opacity: isBlasted ? 1 : 0,
            transform: isBlasted ? 'scale(1)' : 'scale(0.85)',
            maxHeight: isBlasted ? 100 : 0,
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            background: 'linear-gradient(135deg, #fef3c7, #fee2e2)',
            border: '1.5px solid #f59e0b',
            borderRadius: 18,
            padding: isBlasted ? '12px 20px' : '0 20px',
            margin: isBlasted ? '8px 0 20px' : '0',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#b45309' }}>
              🎉 CONGRATULATIONS {profile?.name}! 🎉
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#991b1b', marginTop: 3 }}>
              Official {formatMilestoneLabel(milestoneValue)} Instagram Milestone Reached!
            </div>
          </div>

          {/* 5. Left & Right Corner Party Poppers (Image 3 Drawing) */}
          {/* Bottom-Left Party Popper */}
          <div style={{
            position: 'absolute',
            bottom: 18,
            left: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              fontSize: 34,
              transform: 'rotate(-45deg)',
              animation: isBlasted ? 'popperBlast 0.6s infinite alternate' : 'none'
            }}>
              🎉
            </div>
          </div>

          {/* Bottom-Right Party Popper */}
          <div style={{
            position: 'absolute',
            bottom: 18,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              fontSize: 34,
              transform: 'rotate(45deg) scaleX(-1)',
              animation: isBlasted ? 'popperBlast 0.6s infinite alternate' : 'none'
            }}>
              🎉
            </div>
          </div>

          {/* 15-Second Timeline Progress Bar */}
          <div style={{
            width: '100%',
            height: 6,
            background: '#f1f5f9',
            borderRadius: 10,
            overflow: 'hidden',
            marginTop: 16
          }}>
            <div style={{
              width: `${(progress / totalDuration) * 100}%`,
              height: '100%',
              background: isBlasted
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #6366f1, #a855f7)',
              borderRadius: 10,
              transition: 'background 0.3s ease'
            }} />
          </div>

          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            fontSize: 11.5,
            fontWeight: 700,
            color: '#94a3b8'
          }}>
            <span>0:00 (Starts @ 99.2%)</span>
            <span style={{ color: isBlasted ? '#ef4444' : '#64748b' }}>
              {isBlasted ? '🎉 10s Blast!' : `${Math.floor(progress / 1000)}s / 15s`}
            </span>
            <span>0:15 (Finish)</span>
          </div>

        </div>

        {/* Action Controls Below Card */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 18,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => {
              if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
              startAnimation()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 100,
              padding: '10px 22px',
              fontSize: 13.5,
              fontWeight: 800,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>Replay 15s Celebration</span>
          </button>
        </div>

        {/* Milestone Navigation (Prev / Next) */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 30,
          padding: '0 8px'
        }}>
          {prevMilestone ? (
            <Link
              href={`/milestone/${slug}/${formatMilestoneLabel(prevMilestone).replace('.', '-')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#475569',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              <ChevronLeft size={16} />
              <span>{formatMilestoneLabel(prevMilestone)} Milestone</span>
            </Link>
          ) : <div />}

          {nextMilestone ? (
            <Link
              href={`/milestone/${slug}/${formatMilestoneLabel(nextMilestone).replace('.', '-')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#475569',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              <span>{formatMilestoneLabel(nextMilestone)} Milestone</span>
              <ChevronRight size={16} />
            </Link>
          ) : <div />}
        </div>

      </div>

      <style jsx global>{`
        @keyframes popperBlast {
          0% { transform: scale(1); }
          100% { transform: scale(1.2) translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const { slug, milestone } = params
  if (!slug || !milestone) return { notFound: true }

  const milestoneValue = parseMilestoneParam(milestone)
  if (!milestoneValue) return { notFound: true }

  try {
    const { data: nameList, error: listErr } = await supabase
      .from('most_followed')
      .select('id, name, instagram_handle')

    if (listErr || !nameList) return { notFound: true }

    const decodedSlug = decodeURIComponent(slug)
    const matched = nameList.find(p => {
      const sanitizedHandle = p.instagram_handle
        ? p.instagram_handle.toLowerCase().trim().replace(/\./g, '-')
        : null
      const nameSlug = p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      const namePlain = p.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      return (
        decodedSlug === sanitizedHandle ||
        decodedSlug === nameSlug ||
        decodedSlug === namePlain
      )
    })

    if (!matched) return { notFound: true }

    const { data: fullProfile, error: profErr } = await supabase
      .from('most_followed')
      .select('*')
      .eq('id', matched.id)
      .single()

    if (profErr || !fullProfile) return { notFound: true }

    const currentCount = fullProfile.followers_count || 0
    const allMilestones = generateMilestones(currentCount)

    const achievedDate = findMilestoneAchievedDate(fullProfile.follower_history || [], milestoneValue)

    return {
      props: {
        profile: {
          id: fullProfile.id,
          name: fullProfile.name,
          instagram_handle: fullProfile.instagram_handle || null,
          profile_pic_url: fullProfile.profile_pic_url || null,
          followers_count: currentCount,
        },
        milestoneValue,
        achievedDate: achievedDate || '',
        allMilestones,
        slug: decodedSlug
      }
    }
  } catch (e) {
    console.error('Milestone SSR Error:', e)
    return { notFound: true }
  }
}
