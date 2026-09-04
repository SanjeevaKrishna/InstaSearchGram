/**
 * exportComparisonCard.js
 * Generates and downloads an ultra-high-resolution 1080x1350 (4:5 Instagram Portrait Ratio)
 * branded comparison graphic tailored specifically for Instagram fan pages and creators to share.
 * Bulletproof implementation with:
 * - CORS safe blob image loader with cache-busting & strict timeout
 * - Instant toDataURL + fallback toBlob download pipeline
 * - Automatic tainted canvas recovery (guarantees download never fails)
 */

function formatNumberShort(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  const n = Number(num);
  if (n >= 1000000000) return `${(Math.floor(n / 100000000) / 10).toString().replace(/\.0$/, '')}B`;
  if (n >= 1000000) return `${(Math.floor(n / 100000) / 10).toString().replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(Math.floor(n / 100) / 10).toString().replace(/\.0$/, '')}K`;
  return n.toLocaleString();
}

/**
 * Loads an image safely with CORS and blob conversion to guarantee the canvas is never tainted.
 */
function loadImageSafe(url) {
  if (!url) return Promise.resolve(null);

  return new Promise((resolve) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(null);
      }
    }, 2500);

    const done = (img) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    // Cache-bust to prevent browser from returning non-CORS cached images
    const bustUrl = url.includes('?') ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;

    fetch(bustUrl, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error('CORS fetch failed');
        return res.blob();
      })
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => done(img);
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          done(null);
        };
        img.src = objUrl;
      })
      .catch(() => {
        // Fallback to direct anonymous image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => done(img);
        img.onerror = () => done(null);
        img.src = url;
      });
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawTrendingUpCircle(ctx, centerX, centerY, radius = 12, bgColor = '#ff006e') {
  ctx.save();
  // Circular badge
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.shadowColor = bgColor;
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Lucide TrendingUp arrow (clean vector stroke)
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 0;

  const s = radius / 12;
  ctx.moveTo(centerX - 5.5 * s, centerY + 3.8 * s);
  ctx.lineTo(centerX - 1.8 * s, centerY);
  ctx.lineTo(centerX + 1 * s, centerY + 2.8 * s);
  ctx.lineTo(centerX + 5.5 * s, centerY - 3.8 * s);

  // Arrow head
  ctx.lineTo(centerX + 2.3 * s, centerY - 3.8 * s);
  ctx.moveTo(centerX + 5.5 * s, centerY - 3.8 * s);
  ctx.lineTo(centerX + 5.5 * s, centerY - 0.6 * s);
  ctx.stroke();
  ctx.restore();
}

function renderCanvasContent(ctx, width, height, celebrity1, celebrity2, metrics, liveRank1, liveRank2, img1, img2) {
  // 1. BASE BACKGROUND: Rich Deep Midnight Indigo Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#06070f');
  bgGrad.addColorStop(0.3, '#0b0c1b');
  bgGrad.addColorStop(0.7, '#0f0e22');
  bgGrad.addColorStop(1, '#080812');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. VIBRANT ELECTRIC AMBIENT GLOW LIGHTS
  const leftGlow = ctx.createRadialGradient(180, 220, 20, 180, 220, 360);
  leftGlow.addColorStop(0, 'rgba(255, 0, 110, 0.26)');
  leftGlow.addColorStop(1, 'rgba(255, 0, 110, 0)');
  ctx.fillStyle = leftGlow;
  ctx.fillRect(0, 0, width / 2 + 100, 600);

  const rightGlow = ctx.createRadialGradient(width - 180, 220, 20, width - 180, 220, 360);
  rightGlow.addColorStop(0, 'rgba(0, 245, 255, 0.24)');
  rightGlow.addColorStop(1, 'rgba(0, 245, 255, 0)');
  ctx.fillStyle = rightGlow;
  ctx.fillRect(width / 2 - 100, 0, width / 2 + 100, 600);

  const centerGlow = ctx.createRadialGradient(width / 2, 750, 40, width / 2, 750, 480);
  centerGlow.addColorStop(0, 'rgba(131, 56, 236, 0.16)');
  centerGlow.addColorStop(1, 'rgba(131, 56, 236, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(100, 400, width - 200, 700);

  // 3. DIAGONAL REPEATING WATERMARK PATTERN: spialr.com
  ctx.save();
  ctx.rotate(-22 * Math.PI / 180);
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.038)';
  ctx.textAlign = 'center';
  const stepX = 220;
  const stepY = 120;
  for (let x = -width; x < width * 2; x += stepX) {
    for (let y = -height; y < height * 2; y += stepY) {
      ctx.fillText('spialr.com', x, y);
    }
  }
  ctx.restore();

  // 4. LARGE CENTER BRAND WATERMARK BEHIND METRICS
  ctx.save();
  ctx.font = '900 130px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.textAlign = 'center';
  ctx.fillText('SPIALR.COM', width / 2, 790);
  ctx.restore();

  // 5. TOP HEADER BAR: CENTERED LOGO & VERIFIED PILL
  const topY = 24;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const logoGrad = ctx.createLinearGradient(width / 2 - 160, topY, width / 2 + 160, topY);
  logoGrad.addColorStop(0, '#ff007a');
  logoGrad.addColorStop(0.5, '#ffd166');
  logoGrad.addColorStop(1, '#00f5ff');
  ctx.fillStyle = logoGrad;
  ctx.shadowColor = 'rgba(255, 0, 122, 0.4)';
  ctx.shadowBlur = 18;
  ctx.fillText('⚡ SPIALR.COM', width / 2, topY + 34);
  ctx.restore();

  // Centered Subtitle Pill
  const headerPillW = 390;
  const headerPillH = 26;
  const headerPillX = width / 2 - headerPillW / 2;
  const headerPillY = topY + 46;
  drawRoundedRect(ctx, headerPillX, headerPillY, headerPillW, headerPillH, 13, 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.16)');

  ctx.beginPath();
  ctx.arc(headerPillX + 22, headerPillY + 13, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#00f59b';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.fillText('⚔️ HEAD-TO-HEAD BATTLE  •  VERIFIED DATA ON SPIALR', width / 2 + 10, headerPillY + 17);

  // Header separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 106);
  ctx.lineTo(width - 40, 106);
  ctx.stroke();

  // 6. HERO PROFILES BATTLE SECTION
  const colLeftX = 220;
  const colRightX = width - 220;
  const avatarCenterY = 168;
  const avatarSize = 92;

  const drawAvatar = (img, fallbackName, centerX, centerY, size, isLeft) => {
    // Outer neon ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 + 6, 0, Math.PI * 2);
    ctx.strokeStyle = isLeft ? 'rgba(255, 0, 110, 0.45)' : 'rgba(0, 245, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.shadowColor = isLeft ? '#ff006e' : '#00f5ff';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    // Inner white border ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    let drawn = false;
    if (img) {
      try {
        ctx.drawImage(img, centerX - size / 2, centerY - size / 2, size, size);
        drawn = true;
      } catch (e) {
        drawn = false;
      }
    }

    if (!drawn) {
      const avGrad = ctx.createLinearGradient(centerX - size / 2, centerY - size / 2, centerX + size / 2, centerY + size / 2);
      if (isLeft) {
        avGrad.addColorStop(0, '#ff007a');
        avGrad.addColorStop(1, '#ff5400');
      } else {
        avGrad.addColorStop(0, '#00f5ff');
        avGrad.addColorStop(1, '#7928ca');
      }
      ctx.fillStyle = avGrad;
      ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((fallbackName || '?').charAt(0).toUpperCase(), centerX, centerY);
    }
    ctx.restore();
  };

  drawAvatar(img1, celebrity1?.name, colLeftX, avatarCenterY, avatarSize, true);
  drawAvatar(img2, celebrity2?.name, colRightX, avatarCenterY, avatarSize, false);

  // Center "VS" Badge
  const vsX = width / 2;
  const vsY = avatarCenterY;
  const vsRadius = 25;
  ctx.save();
  const vsGrad = ctx.createLinearGradient(vsX - vsRadius, vsY - vsRadius, vsX + vsRadius, vsY + vsRadius);
  vsGrad.addColorStop(0, '#ff007a');
  vsGrad.addColorStop(0.5, '#7928ca');
  vsGrad.addColorStop(1, '#00f5ff');
  ctx.beginPath();
  ctx.arc(vsX, vsY, vsRadius, 0, Math.PI * 2);
  ctx.fillStyle = vsGrad;
  ctx.shadowColor = 'rgba(255, 0, 122, 0.6)';
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', vsX, vsY);
  ctx.restore();

  // Draw Creator Info
  const drawCreatorInfo = (cel, rank, centerX, isLeft, isWinnerFollowers) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.font = '900 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    let displayName = cel?.name || '';
    if (displayName.length > 18) displayName = displayName.slice(0, 17) + '…';
    ctx.fillText(displayName, centerX, 240);

    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isLeft ? '#ff758f' : '#70d6ff';
    if (cel?.instagram_handle) {
      ctx.fillText(`@${cel.instagram_handle}`, centerX, 258);
    }

    ctx.save();
    ctx.font = '900 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isLeft ? '#ff006e' : '#00f5ff';
    ctx.shadowColor = isLeft ? 'rgba(255, 0, 110, 0.35)' : 'rgba(0, 245, 255, 0.35)';
    ctx.shadowBlur = 10;
    const followersText = `${formatNumberShort(cel?.followers_count)} Followers`;
    ctx.fillText(followersText, centerX, 282);
    ctx.restore();

    if (isWinnerFollowers) {
      ctx.font = '900 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textW = ctx.measureText(followersText).width;
      drawTrendingUpCircle(ctx, centerX + textW / 2 + 16, 275, 11, isLeft ? '#ff006e' : '#00b4d8');
    }

    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`${formatNumberShort(cel?.posts_count)} Posts Published`, centerX, 301);

    if (rank) {
      const rankW = 168;
      const rankH = 22;
      const rankBg = isLeft ? 'rgba(255, 0, 110, 0.2)' : 'rgba(0, 245, 255, 0.2)';
      const rankBorder = isLeft ? '#ff006e' : '#00f5ff';
      drawRoundedRect(ctx, centerX - rankW / 2, 310, rankW, rankH, 11, rankBg, rankBorder, 1.2);
      ctx.font = '900 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isLeft ? '#ff4d8d' : '#38bdf8';
      ctx.fillText(`🏆 RANK #${rank} MOST FOLLOWED`, centerX, 325);
    }
  };

  const cel1Followers = Number(celebrity1?.followers_count || 0);
  const cel2Followers = Number(celebrity2?.followers_count || 0);
  drawCreatorInfo(celebrity1, liveRank1, colLeftX, true, cel1Followers > cel2Followers);
  drawCreatorInfo(celebrity2, liveRank2, colRightX, false, cel2Followers > cel1Followers);

  // 7. COMPARATIVE METRICS SECTION HEADER
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(40, 348);
  ctx.lineTo(width - 40, 348);
  ctx.stroke();

  const titlePillW = 320;
  const titlePillH = 26;
  drawRoundedRect(ctx, width / 2 - titlePillW / 2, 356, titlePillW, titlePillH, 13, 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.15)');
  ctx.textAlign = 'center';
  ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('📊 PERFORMANCE METRICS BREAKDOWN', width / 2, 373);

  // 8. METRICS ROWS (11 Rows)
  const rowsStartY = 392;
  const rowHeight = 56;
  const rowGap = 11;
  const cardW = 410;
  const centerPillW = 160;
  const leftCardX = 40;
  const rightCardX = width - 40 - cardW;
  const centerPillX = width / 2 - centerPillW / 2;

  metrics.forEach((m, idx) => {
    const y = rowsStartY + idx * (rowHeight + rowGap);
    const num1 = Number(m.val1 || 0);
    const num2 = Number(m.val2 || 0);
    const isCel1Winner = num1 > num2;
    const isCel2Winner = num2 > num1;

    drawRoundedRect(ctx, centerPillX, y + 11, centerPillW, 34, 17, 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.16)');
    ctx.textAlign = 'center';
    ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(m.label.toUpperCase(), width / 2, y + 32);

    const formattedVal1 = m.isPercent ? (m.val1 ? Number(m.val1).toFixed(2) + '%' : '0.00%') : formatNumberShort(m.val1);
    const formattedVal2 = m.isPercent ? (m.val2 ? Number(m.val2).toFixed(2) + '%' : '0.00%') : formatNumberShort(m.val2);

    // Left Card
    const leftBg = isCel1Winner ? 'rgba(255, 0, 110, 0.18)' : 'rgba(255, 255, 255, 0.03)';
    const leftBorder = isCel1Winner ? '#ff006e' : 'rgba(255, 255, 255, 0.09)';
    drawRoundedRect(ctx, leftCardX, y, cardW, rowHeight, 14, leftBg, leftBorder, isCel1Winner ? 2.5 : 1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isCel1Winner ? '#ffffff' : '#d4d4d8';
    if (isCel1Winner) {
      ctx.shadowColor = 'rgba(255, 0, 110, 0.4)';
      ctx.shadowBlur = 8;
    }
    ctx.fillText(formattedVal1, leftCardX + cardW / 2, y + 36);
    ctx.restore();

    if (isCel1Winner) {
      drawTrendingUpCircle(ctx, leftCardX + 24, y + rowHeight / 2, 12, '#ff006e');
    }

    // Right Card
    const rightBg = isCel2Winner ? 'rgba(0, 245, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)';
    const rightBorder = isCel2Winner ? '#00f5ff' : 'rgba(255, 255, 255, 0.09)';
    drawRoundedRect(ctx, rightCardX, y, cardW, rowHeight, 14, rightBg, rightBorder, isCel2Winner ? 2.5 : 1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isCel2Winner ? '#ffffff' : '#d4d4d8';
    if (isCel2Winner) {
      ctx.shadowColor = 'rgba(0, 245, 255, 0.4)';
      ctx.shadowBlur = 8;
    }
    ctx.fillText(formattedVal2, rightCardX + cardW / 2, y + 36);
    ctx.restore();

    if (isCel2Winner) {
      drawTrendingUpCircle(ctx, rightCardX + cardW - 24, y + rowHeight / 2, 12, '#00b4d8');
    }
  });

  // 9. BOTTOM BRANDING BANNER
  const footerY = 1215;
  const footerW = width - 80;
  const footerH = 82;
  const footerGrad = ctx.createLinearGradient(40, footerY, width - 40, footerY);
  footerGrad.addColorStop(0, 'rgba(255, 0, 110, 0.14)');
  footerGrad.addColorStop(0.5, 'rgba(131, 56, 236, 0.18)');
  footerGrad.addColorStop(1, 'rgba(0, 245, 255, 0.14)');
  drawRoundedRect(ctx, 40, footerY, footerW, footerH, 20, footerGrad, 'rgba(255, 255, 255, 0.16)', 1.5);

  ctx.textAlign = 'center';
  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.fillText('🔥 TRACK REAL-TIME FOLLOWER VELOCITY & ENGAGEMENT STATS ON', width / 2, footerY + 30);

  ctx.save();
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const urlGrad = ctx.createLinearGradient(width / 2 - 120, footerY, width / 2 + 120, footerY);
  urlGrad.addColorStop(0, '#ff007a');
  urlGrad.addColorStop(0.5, '#ffd166');
  urlGrad.addColorStop(1, '#00f5ff');
  ctx.fillStyle = urlGrad;
  ctx.shadowColor = 'rgba(255, 209, 102, 0.5)';
  ctx.shadowBlur = 12;
  ctx.fillText('WWW.SPIALR.COM', width / 2, footerY + 62);
  ctx.restore();
}

/**
 * Triggers instant browser download of the canvas graphic.
 */
function triggerDirectDownload(canvas, filename) {
  return new Promise((resolve) => {
    // 1. Try toDataURL first (Synchronous, no blob URL revocation issues)
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        resolve(true);
      }, 300);
      return;
    } catch (dataUrlErr) {
      console.warn('Canvas toDataURL export attempt failed:', dataUrlErr);
    }

    // 2. Fallback to toBlob with safe 30-second revocation
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve(true);
        }, 30000);
      }, 'image/png');
    } catch (blobErr) {
      console.error('Canvas toBlob export attempt failed:', blobErr);
      resolve(false);
    }
  });
}

export async function downloadComparisonCard({
  celebrity1,
  celebrity2,
  metrics = [],
  liveRank1 = null,
  liveRank2 = null
}) {
  if (typeof window === 'undefined') return;

  const width = 1080;
  const height = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Pre-load creator avatars safely
  const [img1, img2] = await Promise.all([
    loadImageSafe(celebrity1?.photo_url),
    loadImageSafe(celebrity2?.photo_url)
  ]);

  // Render canvas with images
  renderCanvasContent(ctx, width, height, celebrity1, celebrity2, metrics, liveRank1, liveRank2, img1, img2);

  const cleanName1 = (celebrity1?.name || 'creator1').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanName2 = (celebrity2?.name || 'creator2').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanName1}_vs_${cleanName2}_spialr_comparison.png`;

  // Attempt export
  const success = await triggerDirectDownload(canvas, filename);

  // If failed (e.g. tainted canvas from unknown image source), re-render cleanly without external images
  if (!success) {
    console.warn('Re-rendering canvas with safe vector avatars to guarantee export...');
    renderCanvasContent(ctx, width, height, celebrity1, celebrity2, metrics, liveRank1, liveRank2, null, null);
    await triggerDirectDownload(canvas, filename);
  }
}
