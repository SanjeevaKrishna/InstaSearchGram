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
 * Loads an image safely by proxying through /api/image-proxy with base64 format.
 * This guarantees the image is loaded as a clean, same-origin data URL that CAN NEVER TAINT the canvas.
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
    }, 4500);

    const done = (img) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    // 1. Primary approach: fetch via our same-origin image-proxy with base64
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}&format=base64`;
    fetch(proxyUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Proxy status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data?.dataUrl) throw new Error('No dataUrl returned');
        const img = new Image();
        img.onload = () => done(img);
        img.onerror = () => done(null);
        img.src = data.dataUrl;
      })
      .catch((err) => {
        console.warn('Proxy base64 fetch failed, trying direct blob load:', err);
        // 2. Secondary fallback: direct blob fetch with cache buster
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
            done(null);
          });
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

function drawTrendingUpCircle(ctx, centerX, centerY, radius = 12, isLeft = true) {
  ctx.save();
  // Circular badge with Instagram gradient
  const badgeGrad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
  if (isLeft) {
    badgeGrad.addColorStop(0, '#f09433');
    badgeGrad.addColorStop(1, '#e6683c');
  } else {
    badgeGrad.addColorStop(0, '#dc2743');
    badgeGrad.addColorStop(1, '#bc1888');
  }
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = badgeGrad;
  ctx.shadowColor = isLeft ? 'rgba(240, 148, 51, 0.6)' : 'rgba(225, 48, 108, 0.6)';
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
  // 1. BASE BACKGROUND: Deep Instagram Midnight Violet Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c0414');
  bgGrad.addColorStop(0.35, '#160620');
  bgGrad.addColorStop(0.7, '#120519');
  bgGrad.addColorStop(1, '#09020e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. VIBRANT INSTAGRAM AMBIENT GLOW LIGHTS
  // Top-left: Warm Instagram Amber/Coral glow
  const leftGlow = ctx.createRadialGradient(180, 200, 20, 180, 200, 380);
  leftGlow.addColorStop(0, 'rgba(240, 148, 51, 0.28)');
  leftGlow.addColorStop(1, 'rgba(240, 148, 51, 0)');
  ctx.fillStyle = leftGlow;
  ctx.fillRect(0, 0, width / 2 + 100, 600);

  // Top-right: Instagram Magenta / Pink glow
  const rightGlow = ctx.createRadialGradient(width - 180, 200, 20, width - 180, 200, 380);
  rightGlow.addColorStop(0, 'rgba(225, 48, 108, 0.32)');
  rightGlow.addColorStop(1, 'rgba(225, 48, 108, 0)');
  ctx.fillStyle = rightGlow;
  ctx.fillRect(width / 2 - 100, 0, width / 2 + 100, 600);

  // Center: Instagram Royal Violet glow
  const centerGlow = ctx.createRadialGradient(width / 2, 750, 40, width / 2, 750, 500);
  centerGlow.addColorStop(0, 'rgba(188, 24, 136, 0.18)');
  centerGlow.addColorStop(0.6, 'rgba(131, 58, 180, 0.08)');
  centerGlow.addColorStop(1, 'rgba(131, 58, 180, 0)');
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

  // 5. TOP HEADER BAR: INSTAGRAM GRADIENT BRAND & PILL
  const topY = 24;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const logoGrad = ctx.createLinearGradient(width / 2 - 160, topY, width / 2 + 160, topY);
  logoGrad.addColorStop(0, '#f09433');
  logoGrad.addColorStop(0.25, '#e6683c');
  logoGrad.addColorStop(0.5, '#dc2743');
  logoGrad.addColorStop(0.75, '#cc2366');
  logoGrad.addColorStop(1, '#bc1888');
  ctx.fillStyle = logoGrad;
  ctx.shadowColor = 'rgba(225, 48, 108, 0.5)';
  ctx.shadowBlur = 18;
  ctx.fillText('⚡ SPIALR.COM', width / 2, topY + 34);
  ctx.restore();

  // Centered Subtitle Pill
  const headerPillW = 430;
  const headerPillH = 26;
  const headerPillX = width / 2 - headerPillW / 2;
  const headerPillY = topY + 46;
  drawRoundedRect(ctx, headerPillX, headerPillY, headerPillW, headerPillH, 13, 'rgba(255, 255, 255, 0.05)', 'rgba(225, 48, 108, 0.28)');

  ctx.beginPath();
  ctx.arc(headerPillX + 20, headerPillY + 13, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e1306c';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.fillText('DISCOVER MOST FOLLOWED CREATORS & TRENDING REELS', width / 2 + 8, headerPillY + 17);

  // Header separator line
  ctx.strokeStyle = 'rgba(225, 48, 108, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 106);
  ctx.lineTo(width - 40, 106);
  ctx.stroke();

  // 6. HERO PROFILES BATTLE SECTION
  const colLeftX = 220;
  const colRightX = width - 220;
  const avatarCenterY = 168;
  const avatarSize = 104;

  const drawAvatar = (img, fallbackName, centerX, centerY, size, isLeft) => {
    // Outer official Instagram Story multi-color gradient ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 + 6, 0, Math.PI * 2);
    const storyRingGrad = ctx.createLinearGradient(centerX - size / 2, centerY + size / 2, centerX + size / 2, centerY - size / 2);
    storyRingGrad.addColorStop(0, '#feda75');
    storyRingGrad.addColorStop(0.25, '#fa7e1e');
    storyRingGrad.addColorStop(0.5, '#d62976');
    storyRingGrad.addColorStop(0.75, '#962fbf');
    storyRingGrad.addColorStop(1, '#4f5bd5');
    ctx.strokeStyle = storyRingGrad;
    ctx.lineWidth = 4.5;
    ctx.shadowColor = 'rgba(225, 48, 108, 0.55)';
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
        // Compute center-crop (object-fit: cover) so image is never stretched
        const imgW = img.naturalWidth || img.width || 1;
        const imgH = img.naturalHeight || img.height || 1;
        let sx = 0, sy = 0, sWidth = imgW, sHeight = imgH;
        if (imgW > imgH) {
          sWidth = imgH;
          sx = (imgW - imgH) / 2;
        } else if (imgH > imgW) {
          sHeight = imgW;
          sy = (imgH - imgW) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, centerX - size / 2, centerY - size / 2, size, size);
        drawn = true;
      } catch (e) {
        drawn = false;
      }
    }

    if (!drawn) {
      const avGrad = ctx.createLinearGradient(centerX - size / 2, centerY - size / 2, centerX + size / 2, centerY + size / 2);
      if (isLeft) {
        avGrad.addColorStop(0, '#f09433');
        avGrad.addColorStop(1, '#dc2743');
      } else {
        avGrad.addColorStop(0, '#dc2743');
        avGrad.addColorStop(1, '#bc1888');
      }
      ctx.fillStyle = avGrad;
      ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((fallbackName || '?').charAt(0).toUpperCase(), centerX, centerY);
    }
    ctx.restore();
  };

  drawAvatar(img1, celebrity1?.name, colLeftX, avatarCenterY, avatarSize, true);
  drawAvatar(img2, celebrity2?.name, colRightX, avatarCenterY, avatarSize, false);

  // Center "VS" Badge with Instagram Gradient
  const vsX = width / 2;
  const vsY = avatarCenterY;
  const vsRadius = 25;
  ctx.save();
  const vsGrad = ctx.createLinearGradient(vsX - vsRadius, vsY - vsRadius, vsX + vsRadius, vsY + vsRadius);
  vsGrad.addColorStop(0, '#f09433');
  vsGrad.addColorStop(0.5, '#dc2743');
  vsGrad.addColorStop(1, '#833ab4');
  ctx.beginPath();
  ctx.arc(vsX, vsY, vsRadius, 0, Math.PI * 2);
  ctx.fillStyle = vsGrad;
  ctx.shadowColor = 'rgba(225, 48, 108, 0.6)';
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
  const drawCreatorInfo = (cel, rank, centerX, isLeft) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.font = '900 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    let displayName = cel?.name || '';
    if (displayName.length > 18) displayName = displayName.slice(0, 17) + '…';
    ctx.fillText(displayName, centerX, 242);

    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isLeft ? '#f09433' : '#e1306c';
    if (cel?.instagram_handle) {
      ctx.fillText(`@${cel.instagram_handle}`, centerX, 260);
    }

    ctx.save();
    ctx.font = '900 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isLeft ? '#f09433' : '#e1306c';
    ctx.shadowColor = isLeft ? 'rgba(240, 148, 51, 0.45)' : 'rgba(225, 48, 108, 0.45)';
    ctx.shadowBlur = 10;
    const followersText = `${formatNumberShort(cel?.followers_count)} Followers`;
    ctx.fillText(followersText, centerX, 284);
    ctx.restore();

    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`${formatNumberShort(cel?.posts_count)} Posts Published`, centerX, 302);

    // Only show rank badge if rank exists (governed by mutual rank requirement)
    if (rank) {
      const rankW = 168;
      const rankH = 22;
      const rankBg = isLeft ? 'rgba(240, 148, 51, 0.18)' : 'rgba(225, 48, 108, 0.18)';
      const rankBorder = isLeft ? '#f09433' : '#e1306c';
      drawRoundedRect(ctx, centerX - rankW / 2, 312, rankW, rankH, 11, rankBg, rankBorder, 1.2);
      ctx.font = '900 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isLeft ? '#ffaa40' : '#ff4d8d';
      ctx.fillText(`🏆 RANK #${rank} MOST FOLLOWED`, centerX, 327);
    }
  };

  // Identical logic to website: ONLY show rank tag if BOTH profiles have a live section most followed rank!
  const showRanks = Boolean(liveRank1 && liveRank2);
  drawCreatorInfo(celebrity1, showRanks ? liveRank1 : null, colLeftX, true);
  drawCreatorInfo(celebrity2, showRanks ? liveRank2 : null, colRightX, false);

  // 7. COMPARATIVE METRICS SECTION HEADER
  ctx.strokeStyle = 'rgba(225, 48, 108, 0.2)';
  ctx.beginPath();
  ctx.moveTo(40, 348);
  ctx.lineTo(width - 40, 348);
  ctx.stroke();

  const titlePillW = 340;
  const titlePillH = 26;
  drawRoundedRect(ctx, width / 2 - titlePillW / 2, 356, titlePillW, titlePillH, 13, 'rgba(225, 48, 108, 0.12)', 'rgba(225, 48, 108, 0.3)');
  ctx.textAlign = 'center';
  ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f09433';
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

    drawRoundedRect(ctx, centerPillX, y + 11, centerPillW, 34, 17, 'rgba(255, 255, 255, 0.05)', 'rgba(225, 48, 108, 0.22)');
    ctx.textAlign = 'center';
    ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(m.label.toUpperCase(), width / 2, y + 32);

    const formattedVal1 = m.isPercent ? (m.val1 ? Number(m.val1).toFixed(2) + '%' : '0.00%') : formatNumberShort(m.val1);
    const formattedVal2 = m.isPercent ? (m.val2 ? Number(m.val2).toFixed(2) + '%' : '0.00%') : formatNumberShort(m.val2);

    // Left Card
    const leftBg = isCel1Winner ? 'rgba(240, 148, 51, 0.18)' : 'rgba(255, 255, 255, 0.03)';
    const leftBorder = isCel1Winner ? '#f09433' : 'rgba(255, 255, 255, 0.09)';
    drawRoundedRect(ctx, leftCardX, y, cardW, rowHeight, 14, leftBg, leftBorder, isCel1Winner ? 2.5 : 1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isCel1Winner ? '#ffffff' : '#d4d4d8';
    if (isCel1Winner) {
      ctx.shadowColor = 'rgba(240, 148, 51, 0.45)';
      ctx.shadowBlur = 8;
    }
    ctx.fillText(formattedVal1, leftCardX + cardW / 2, y + 36);
    ctx.restore();

    if (isCel1Winner) {
      drawTrendingUpCircle(ctx, leftCardX + 24, y + rowHeight / 2, 12, true);
    }

    // Right Card
    const rightBg = isCel2Winner ? 'rgba(225, 48, 108, 0.18)' : 'rgba(255, 255, 255, 0.03)';
    const rightBorder = isCel2Winner ? '#e1306c' : 'rgba(255, 255, 255, 0.09)';
    drawRoundedRect(ctx, rightCardX, y, cardW, rowHeight, 14, rightBg, rightBorder, isCel2Winner ? 2.5 : 1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isCel2Winner ? '#ffffff' : '#d4d4d8';
    if (isCel2Winner) {
      ctx.shadowColor = 'rgba(225, 48, 108, 0.45)';
      ctx.shadowBlur = 8;
    }
    ctx.fillText(formattedVal2, rightCardX + cardW / 2, y + 36);
    ctx.restore();

    if (isCel2Winner) {
      drawTrendingUpCircle(ctx, rightCardX + cardW - 24, y + rowHeight / 2, 12, false);
    }
  });

  // 9. BOTTOM BRANDING BANNER WITH INSTAGRAM GRADIENT
  const footerY = 1215;
  const footerW = width - 80;
  const footerH = 82;
  const footerGrad = ctx.createLinearGradient(40, footerY, width - 40, footerY);
  footerGrad.addColorStop(0, 'rgba(240, 148, 51, 0.18)');
  footerGrad.addColorStop(0.5, 'rgba(220, 39, 67, 0.22)');
  footerGrad.addColorStop(1, 'rgba(188, 24, 136, 0.18)');
  drawRoundedRect(ctx, 40, footerY, footerW, footerH, 20, footerGrad, 'rgba(225, 48, 108, 0.35)', 1.5);

  ctx.textAlign = 'center';
  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.fillText('🔥 TRACK REAL-TIME FOLLOWER VELOCITY & ENGAGEMENT STATS ON', width / 2, footerY + 30);

  ctx.save();
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const urlGrad = ctx.createLinearGradient(width / 2 - 130, footerY, width / 2 + 130, footerY);
  urlGrad.addColorStop(0, '#f09433');
  urlGrad.addColorStop(0.25, '#e6683c');
  urlGrad.addColorStop(0.5, '#dc2743');
  urlGrad.addColorStop(0.75, '#cc2366');
  urlGrad.addColorStop(1, '#bc1888');
  ctx.fillStyle = urlGrad;
  ctx.shadowColor = 'rgba(225, 48, 108, 0.6)';
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
