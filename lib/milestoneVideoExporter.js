/**
 * 15-Second Milestone Video Exporter for Spialr.com
 * Renders an exact 15-second 60fps/30fps vertical celebration video (1080x1920)
 * with avatar, passing follower counter from 99.2% to 100%, and corner party bomb confetti blast at 10 seconds.
 */

import { formatMilestoneLabel } from './milestones'

async function preloadAvatarImage(url) {
  if (!url) return null

  const fetchBlobWithTimeout = async (targetUrl, ms = 3000) => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
      const timeoutId = controller ? setTimeout(() => controller.abort(), ms) : null
      const response = await fetch(targetUrl, { signal: controller ? controller.signal : undefined, mode: 'cors' })
      if (timeoutId) clearTimeout(timeoutId)
      if (!response.ok) return null
      return await response.blob()
    } catch {
      return null
    }
  }

  try {
    let blob = await fetchBlobWithTimeout(url, 2500)
    if (!blob) {
      blob = await fetchBlobWithTimeout('/api/image-proxy?url=' + encodeURIComponent(url), 3500)
    }
    if (!blob) return null

    const objectUrl = URL.createObjectURL(blob)
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        try { URL.revokeObjectURL(objectUrl) } catch {}
        resolve(null)
      }
      img.src = objectUrl
    })
  } catch {
    return null
  }
}

export async function exportMilestoneVideo({
  profile = {},
  milestoneValue = 1000000,
  achievedDate = '',
  onProgress = () => {},
  abortSignal = null
}) {
  const width = 1080
  const height = 1920
  const fps = 30
  const durationSec = 15
  const totalFrames = fps * durationSec // 450 frames
  const partyFrame = fps * 10 // Frame 300 = exactly 10.0 seconds

  const startCount = Math.floor(milestoneValue * 0.992) // 992,000 for 1M

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  onProgress(5, 'Loading creator profile photo...')
  const avatarImg = await preloadAvatarImage(profile.profile_pic_url)

  if (abortSignal && abortSignal.aborted) {
    throw new Error('Video generation cancelled')
  }

  let mimeType = 'video/webm'
  let ext = 'webm'
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
      mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
      ext = 'mp4'
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4'
      ext = 'mp4'
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9'
      ext = 'webm'
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm'
      ext = 'webm'
    }
  }

  const stream = canvas.captureStream(fps)
  let mediaRecorder
  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 })
  } catch {
    mediaRecorder = new MediaRecorder(stream)
  }

  const recordedChunks = []
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data)
  }

  // Pre-generate confetti particles for the party bomb explosions
  const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15', '#06b6d4']
  const particles = []
  const numParticles = 240
  for (let i = 0; i < numParticles; i++) {
    const isLeft = i % 2 === 0
    const originX = isLeft ? 140 : width - 140
    const originY = height - 260
    const angle = isLeft
      ? -Math.PI / 4 + (Math.random() - 0.5) * (Math.PI / 3) // Shoots up-right
      : -3 * Math.PI / 4 + (Math.random() - 0.5) * (Math.PI / 3) // Shoots up-left
    const speed = 24 + Math.random() * 32
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.75,
      size: 14 + Math.random() * 16,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
      isCircle: Math.random() > 0.5
    })
  }

  mediaRecorder.start()

  let currentFrame = 0

  return new Promise((resolve, reject) => {
    mediaRecorder.onerror = (err) => reject(err)
    mediaRecorder.onstop = () => {
      if (abortSignal && abortSignal.aborted) return
      const blob = new Blob(recordedChunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      const slug = (profile.name || 'creator').replace(/[^a-zA-Z0-9]/g, '_')
      a.download = `${slug}_${formatMilestoneLabel(milestoneValue)}_Milestone_Spialr.${ext}`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 2000)
      resolve({ url, blob, ext })
    }

    function drawPartyPopper(x, y, angle, isBlasting) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      // Party cone body
      const gradient = ctx.createLinearGradient(-35, 0, 35, 80)
      gradient.addColorStop(0, '#f59e0b')
      gradient.addColorStop(0.5, '#ef4444')
      gradient.addColorStop(1, '#8b5cf6')
      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-45, 90)
      ctx.lineTo(45, 90)
      ctx.closePath()
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      // Festive stripes
      ctx.strokeStyle = '#fde047'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(-22, 45)
      ctx.lineTo(22, 45)
      ctx.stroke()

      if (isBlasting) {
        // Flash glow at nozzle
        ctx.beginPath()
        ctx.arc(0, 0, 28, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(253, 224, 71, 0.85)'
        ctx.fill()
      }

      ctx.restore()
    }

    function renderNextFrame() {
      if (abortSignal && abortSignal.aborted) {
        if (mediaRecorder.state !== 'inactive') {
          try { mediaRecorder.stop() } catch {}
        }
        reject(new Error('Cancelled by user'))
        return
      }

      if (currentFrame > totalFrames) {
        mediaRecorder.stop()
        return
      }

      // ── Background: Clean crisp white with subtle festive gradient glow ──
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      // Top soft ambient gradient
      const topGrad = ctx.createLinearGradient(0, 0, 0, 500)
      topGrad.addColorStop(0, 'rgba(240, 243, 255, 0.7)')
      topGrad.addColorStop(1, '#ffffff')
      ctx.fillStyle = topGrad
      ctx.fillRect(0, 0, width, 500)

      // ── Main Card Frame (matches Image 3 user drawing) ──
      const cardMarginX = 80
      const cardMarginY = 160
      const cardW = width - cardMarginX * 2
      const cardH = height - cardMarginY * 2

      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 16
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(cardMarginX, cardMarginY, cardW, cardH, 48)
      ctx.fill()
      ctx.restore()

      // Card border
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(cardMarginX, cardMarginY, cardW, cardH, 48)
      ctx.stroke()

      // Header Brand
      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SPIALR.COM · OFFICIAL FOLLOWER MILESTONE', width / 2, cardMarginY + 80)

      // ── Image 3: Circle Avatar ──
      const avatarCenterX = width / 2
      const avatarCenterY = cardMarginY + 280
      const avatarRadius = 130

      // Glowing halo around avatar
      const isBlasted = currentFrame >= partyFrame
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 8, 0, Math.PI * 2)
      if (isBlasted) {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 12
        ctx.shadowColor = 'rgba(245, 158, 11, 0.5)'
        ctx.shadowBlur = 30
      } else {
        ctx.strokeStyle = '#6366f1'
        ctx.lineWidth = 8
        ctx.shadowColor = 'rgba(99, 102, 241, 0.3)'
        ctx.shadowBlur = 20
      }
      ctx.stroke()
      ctx.restore()

      // Draw avatar clipped in circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2)
      ctx.clip()

      if (avatarImg) {
        ctx.drawImage(avatarImg, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
      } else {
        ctx.fillStyle = '#6366f1'
        ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 90px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText((profile.name || 'C').charAt(0).toUpperCase(), avatarCenterX, avatarCenterY)
      }
      ctx.restore()

      // ── Image 3: Creator Name ──
      const nameY = avatarCenterY + avatarRadius + 90
      ctx.fillStyle = '#0f172a'
      ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(profile.name || 'Creator', width / 2, nameY)

      if (profile.instagram_handle) {
        ctx.fillStyle = '#a855f7'
        ctx.font = 'bold 30px sans-serif'
        ctx.fillText(`@${profile.instagram_handle}`, width / 2, nameY + 48)
      }

      // ── Calculate Counter Number for Current Frame ──
      let currentDisplayCount = startCount
      if (currentFrame < partyFrame) {
        // Smooth easing from startCount to milestoneValue across 10 seconds
        const t = currentFrame / partyFrame
        const eased = 1 - Math.pow(1 - t, 3)
        currentDisplayCount = Math.round(startCount + (milestoneValue - startCount) * eased)
      } else {
        currentDisplayCount = milestoneValue
      }

      // ── Image 3: Follower Count (- follower count -) ──
      const countY = nameY + 240
      ctx.fillStyle = isBlasted ? '#ef4444' : '#1e293b'
      ctx.font = '900 96px "SF Pro Display", -apple-system, BlinkMacSystemFont, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const formattedCount = currentDisplayCount.toLocaleString('en-US')
      ctx.fillText(`- ${formattedCount} -`, width / 2, countY)

      ctx.fillStyle = '#64748b'
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText('INSTAGRAM FOLLOWERS', width / 2, countY + 80)

      // ── Image 3: Achieved Date ──
      const dateY = countY + 180
      const dateText = achievedDate ? `Achieved Date: ${achievedDate}` : 'Milestone Achieved'
      ctx.save()
      ctx.fillStyle = '#f8fafc'
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(width / 2 - 280, dateY - 35, 560, 70, 35)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#475569'
      ctx.font = 'bold 30px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(dateText, width / 2, dateY)
      ctx.restore()

      // ── Congratulations Banner after 10s (partyFrame) ──
      if (isBlasted) {
        const framesAfterBlast = currentFrame - partyFrame
        const scale = Math.min(1, framesAfterBlast / 12)
        ctx.save()
        ctx.translate(width / 2, dateY + 160)
        ctx.scale(scale, scale)

        // Banner box
        const grad = ctx.createLinearGradient(-380, 0, 380, 0)
        grad.addColorStop(0, '#f59e0b')
        grad.addColorStop(0.5, '#ef4444')
        grad.addColorStop(1, '#ec4899')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(-420, -60, 840, 120, 30)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.font = '900 42px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`🎉 CONGRATULATIONS ON ${formatMilestoneLabel(milestoneValue)}! 🎉`, 0, 0)
        ctx.restore()
      }

      // ── Image 3: Corner Party Bombs (Party Poppers) in bottom corners ──
      // Bottom-left party bomb pointing up-right (45 deg)
      drawPartyPopper(cardMarginX + 100, cardMarginY + cardH - 120, -Math.PI / 4, isBlasted)

      // Bottom-right party bomb pointing up-left (-45 deg)
      drawPartyPopper(cardMarginX + cardW - 100, cardMarginY + cardH - 120, Math.PI / 4, isBlasted)

      // ── Confetti Particle Physics after Frame 300 (10s Party Explosion) ──
      if (isBlasted) {
        const framesActive = currentFrame - partyFrame
        particles.forEach((p) => {
          const posX = p.x + p.vx * framesActive
          const posY = p.y + p.vy * framesActive + 0.5 * p.gravity * framesActive * framesActive

          if (posY < height && posX > 0 && posX < width) {
            ctx.save()
            ctx.translate(posX, posY)
            ctx.rotate(p.rotation + p.spin * framesActive)
            ctx.fillStyle = p.color
            if (p.isCircle) {
              ctx.beginPath()
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
              ctx.fill()
            } else {
              ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
            }
            ctx.restore()
          }
        })
      }

      // ── 15-Second Progress Bar at Very Bottom ──
      const footProgressY = height - 60
      const prog = currentFrame / totalFrames
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(80, footProgressY, width - 160, 8)
      ctx.fillStyle = isBlasted ? '#ef4444' : '#6366f1'
      ctx.fillRect(80, footProgressY, (width - 160) * prog, 8)

      currentFrame++
      const progressPercent = Math.min(100, Math.round((currentFrame / totalFrames) * 100))
      onProgress(progressPercent, `Generating 15s Celebration Video... ${progressPercent}%`)

      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(renderNextFrame)
      } else {
        setTimeout(renderNextFrame, 0)
      }
    }

    renderNextFrame()
  })
}
