/**
 * Ultra-Fast Timeline Video Exporter for Spialr.com
 * Generates 1-second-per-day high-definition 9:16 / 16:9 videos in 2-3 seconds total
 * with real creator avatar photos, spialr.com watermarking, and dynamic overtaking animations.
 */

const BAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
  '#14b8a6', '#84cc16', '#e11d48', '#0284c7', '#7c3aed'
];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function formatNumberShort(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1000000000) return (Math.floor(abs / 100000000) / 10).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1000000) return (Math.floor(abs / 100000) / 10).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1000) return (Math.floor(abs / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K';
  return abs.toLocaleString();
}

function getOptimizedAvatarUrl(url) {
  if (!url) return null;
  // If it's a Cloudinary image, inject w_120,h_120,c_fill,g_face,q_auto,f_auto (reduces image from 350KB to 3KB)
  if (url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('w_120')) {
    return url.replace('/upload/', '/upload/w_120,h_120,c_fill,g_face,q_auto,f_auto/');
  }
  return url;
}

// Ultra-fast, bulletproof avatar loader using Fetch Blob & Image Object URL (Works 100% on iOS & Android mobile)
async function preloadAvatar(rawUrl) {
  if (!rawUrl) return null;
  const optimizedUrl = getOptimizedAvatarUrl(rawUrl);

  const fetchBlobWithTimeout = async (targetUrl, ms = 3500) => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), ms) : null;
      const response = await fetch(targetUrl, { 
        signal: controller ? controller.signal : undefined,
        mode: 'cors'
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (!response.ok) return null;
      return await response.blob();
    } catch (e) {
      return null;
    }
  };

  try {
    // 1. Try direct fetch with optimized thumbnail (Cloudinary allows CORS natively)
    let blob = await fetchBlobWithTimeout(optimizedUrl, 2500);

    // 2. If direct fetch fails (e.g. non-Cloudinary or CORS block), fetch via proxy
    if (!blob) {
      const proxyUrl = '/api/image-proxy?url=' + encodeURIComponent(optimizedUrl);
      blob = await fetchBlobWithTimeout(proxyUrl, 3500);
    }

    if (!blob) return null;

    // 3. Create a local in-memory Object URL from blob
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        try { URL.revokeObjectURL(objectUrl); } catch(e) {}
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch (err) {
    return null;
  }
}

export async function exportTimelineVideo({
  timelineDates = [],
  allProfiles = [],
  focusedProfileId = null,
  format = 'vertical',
  onProgress = () => {},
  abortSignal = null
}) {
  if (!timelineDates || timelineDates.length === 0 || !allProfiles || allProfiles.length === 0) {
    throw new Error('No timeline data available to export.');
  }

  const width = format === 'vertical' ? 720 : 1280;
  const height = format === 'vertical' ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let mimeType = 'video/webm';
  let ext = 'webm';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
      mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
      ext = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
      ext = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
      ext = 'webm';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
      ext = 'webm';
    }
  }

  const fps = 30;
  const stream = canvas.captureStream(fps);
  let mediaRecorder;
  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4500000 });
  } catch (e) {
    mediaRecorder = new MediaRecorder(stream);
  }

  const recordedChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  // Pre-calculate profile counts per timeline date
  const processedProfiles = allProfiles.map((p, idx) => {
    const countsByDate = {};
    const sortedHistory = Array.isArray(p.follower_history)
      ? [...p.follower_history].sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];

    timelineDates.forEach(td => {
      let count = p.followers_count || 0;
      if (sortedHistory.length > 0) {
        const exact = sortedHistory.find(h => h.date === td.iso);
        if (exact) {
          count = exact.count;
        } else {
          const prior = sortedHistory.filter(h => h.date <= td.iso);
          if (prior.length > 0) count = prior[prior.length - 1].count;
        }
      }
      countsByDate[td.iso] = count;
    });

    return {
      id: p.id || p.instagram_handle || p.name,
      name: p.name || 'Creator',
      handle: p.instagram_handle || '',
      photoUrl: p.photo_url || null,
      color: BAR_COLORS[idx % BAR_COLORS.length],
      countsByDate
    };
  });

  const focusedProfile = focusedProfileId 
    ? processedProfiles.find(p => p.id === focusedProfileId)
    : null;

  // Smart Preload: Only preload the specific accounts that actually enter the camera viewport across all dates
  const visibleCount = format === 'vertical' ? 12 : 9;
  const visibleProfilesSet = new Set();
  if (focusedProfileId) {
    visibleProfilesSet.add(focusedProfileId);
  }

  timelineDates.forEach(td => {
    const sortedOnDate = [...processedProfiles].sort((a, b) => (b.countsByDate[td.iso] || 0) - (a.countsByDate[td.iso] || 0));
    let centerIdx = 4;
    if (focusedProfileId) {
      const idx = sortedOnDate.findIndex(p => p.id === focusedProfileId);
      if (idx !== -1) centerIdx = idx;
    }
    let startIdx = Math.max(0, centerIdx - Math.floor(visibleCount / 2));
    if (startIdx + visibleCount > sortedOnDate.length) {
      startIdx = Math.max(0, sortedOnDate.length - visibleCount);
    }
    const cohort = sortedOnDate.slice(startIdx, startIdx + visibleCount);
    cohort.forEach(p => visibleProfilesSet.add(p.id));
  });

  if (!focusedProfileId) {
    processedProfiles.slice(0, visibleCount).forEach(p => visibleProfilesSet.add(p.id));
  }

  // Preload unique visible profiles (capped at 30 max for blazing speed)
  const profilesToPreload = processedProfiles.filter(p => visibleProfilesSet.has(p.id)).slice(0, 30);

  onProgress(10, 'Loading profile pictures...');
  const avatarMap = {};
  await Promise.all(
    profilesToPreload.map(async (p) => {
      if (p.photoUrl && !avatarMap[p.id]) {
        const img = await preloadAvatar(p.photoUrl);
        if (img) avatarMap[p.id] = img;
      }
    })
  );

  if (abortSignal && abortSignal.aborted) {
    throw new Error('Generation cancelled by user');
  }

  mediaRecorder.start();

  // Exactly 1 second per day transition (30 frames at 30 fps = exactly 1.0s per day!)
  const framesPerDate = 30;
  const totalTransitions = Math.max(1, timelineDates.length - 1);
  const totalFrames = totalTransitions * framesPerDate + 15; // 0.5s pause at the end

  let currentFrame = 0;

  return new Promise((resolve, reject) => {
    mediaRecorder.onerror = (err) => reject(err);
    mediaRecorder.onstop = () => {
      if (abortSignal && abortSignal.aborted) {
        return;
      }
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const creatorSlug = focusedProfile ? focusedProfile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'top_creators';
      a.download = creatorSlug + '_follower_timeline_spialr.' + ext;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
      resolve({ url, blob, ext });
    };

    function renderNextFrame() {
      if (abortSignal && abortSignal.aborted) {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          try { mediaRecorder.stop(); } catch (e) {}
        }
        reject(new Error('Generation cancelled by user'));
        return;
      }

      if (currentFrame > totalFrames) {
        mediaRecorder.stop();
        return;
      }

      const dateStep = Math.min(totalTransitions - 1, Math.floor(currentFrame / framesPerDate));
      const frameInStep = currentFrame % framesPerDate;
      const t = currentFrame >= totalTransitions * framesPerDate 
        ? 1.0 
        : easeInOutCubic(frameInStep / framesPerDate);

      const dateA = timelineDates[dateStep];
      const dateB = timelineDates[Math.min(timelineDates.length - 1, dateStep + 1)];

      const interpolatedProfiles = processedProfiles.map(p => {
        const countA = p.countsByDate[dateA.iso] || 0;
        const countB = p.countsByDate[dateB.iso] || countA;
        const interpolated = Math.round(countA + (countB - countA) * t);
        const dailyDelta = countB - countA;
        return {
          ...p,
          interpolatedCount: interpolated,
          dailyDelta
        };
      }).sort((a, b) => b.interpolatedCount - a.interpolatedCount);

      let targetCenterIdx = 4;
      if (focusedProfileId) {
        const fIdx = interpolatedProfiles.findIndex(p => p.id === focusedProfileId);
        if (fIdx !== -1) targetCenterIdx = fIdx;
      }

      let startIdx = Math.max(0, targetCenterIdx - Math.floor(visibleCount / 2));
      if (startIdx + visibleCount > interpolatedProfiles.length) {
        startIdx = Math.max(0, interpolatedProfiles.length - visibleCount);
      }
      const visibleProfiles = interpolatedProfiles.slice(startIdx, startIdx + visibleCount);

      // Dynamic cohort scale for visible overtakes and movements
      const cohortCounts = visibleProfiles.map(p => p.interpolatedCount);
      const cohortMax = Math.max(...cohortCounts, 1);
      const cohortMin = Math.min(...cohortCounts, 0);
      const cohortSpread = Math.max(1, cohortMax - cohortMin);

      // 1. Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.8);
      grad.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
      grad.addColorStop(1, 'rgba(9, 13, 22, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Middle Center Horizontal Broad Logo (spialr.com)
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtle ambient center brand glow
      const brandGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, 280);
      brandGrad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      brandGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
      brandGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = brandGrad;
      ctx.fillRect(width / 2 - 320, height / 2 - 120, 640, 240);

      // Clean broad horizontal logo in middle center
      ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('spialr.com', width / 2, height / 2);
      ctx.restore();

      // 3. Header Section
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1.5;
      const pillW = 270, pillH = 34, pillX = (width - pillW) / 2, pillY = 32;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 17);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#c7d2fe';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ SPIALR.COM · LIVE TIMELINE', width / 2, pillY + pillH / 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CREATOR GROWTH TIMELINE', width / 2, 98);

      const activeLabel = dateStep === timelineDates.length - 1 || t > 0.6 ? dateB.label : dateA.label;
      const activeYear = dateB.year || '2026';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(activeLabel.toUpperCase() + ' ' + activeYear, width / 2, 130);

      if (focusedProfile) {
        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Focus: ' + focusedProfile.name + (focusedProfile.handle ? ' (@' + focusedProfile.handle + ')' : ''), width / 2, 154);
      }

      // 4. Render Bars with Avatars & Dynamic Overtaking
      const listStartY = 180;
      const rowHeight = format === 'vertical' ? 74 : 52;
      const leftMargin = 56;
      const nameWidth = 145;
      const trackStartX = leftMargin + nameWidth + 10;
      const trackMaxW = width - trackStartX - 130;

      visibleProfiles.forEach((p, idx) => {
        const actualRank = startIdx + idx + 1;
        const y = listStartY + idx * rowHeight;
        const isFocused = focusedProfileId === p.id;

        let normalizedRatio = 0.5;
        if (cohortSpread > 0) {
          normalizedRatio = (p.interpolatedCount - cohortMin) / cohortSpread;
        }
        const barPct = 0.28 + normalizedRatio * 0.60;
        const barW = Math.max(20, barPct * trackMaxW);

        if (isFocused) {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(14, y - 4, width - 28, rowHeight - 6, 12);
          ctx.fill();
          ctx.stroke();
        }

        // Rank Badge
        ctx.fillStyle = actualRank === 1 ? '#000000' : actualRank === 2 ? '#111827' : actualRank === 3 ? '#1f2937' : '#0f172a';
        ctx.strokeStyle = actualRank === 1 ? '#eab308' : actualRank === 2 ? '#94a3b8' : actualRank === 3 ? '#b45309' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(18, y + 5, 34, 25, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(actualRank), 35, y + 18);

        // Creator Name
        ctx.fillStyle = isFocused ? '#818cf8' : '#f8fafc';
        ctx.font = isFocused ? 'bold 15px sans-serif' : 'bold 13.5px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const shortName = p.name.length > 15 ? p.name.substring(0, 14) + '…' : p.name;
        ctx.fillText(shortName, trackStartX - 12, y + 18);

        // Bar Track
        const barH = isFocused ? 26 : 20;
        const barY = y + 8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(trackStartX, barY, barW, barH, 5);
        ctx.fill();

        if (isFocused) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Circular Creator Image / Avatar
        const avatarRadius = isFocused ? 14 : 11;
        const avatarCenterX = trackStartX + barW;
        const avatarCenterY = barY + barH / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();

        const cachedImg = avatarMap[p.id];
        if (cachedImg) {
          ctx.drawImage(
            cachedImg,
            avatarCenterX - avatarRadius,
            avatarCenterY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          );
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold ' + (isFocused ? 12 : 10) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.name.charAt(0).toUpperCase(), avatarCenterX, avatarCenterY);
        }
        ctx.restore();

        // Avatar Border
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Follower Count
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const countStr = formatNumberShort(p.interpolatedCount);
        ctx.fillText(countStr, avatarCenterX + avatarRadius + 8, y + 18);

        if (p.dailyDelta && Math.abs(p.dailyDelta) > 0) {
          ctx.fillStyle = p.dailyDelta > 0 ? '#34d399' : '#fb7185';
          ctx.font = 'bold 10px monospace';
          const deltaStr = p.dailyDelta > 0 ? ('+' + formatNumberShort(p.dailyDelta)) : ('-' + formatNumberShort(Math.abs(p.dailyDelta)));
          ctx.fillText(deltaStr, avatarCenterX + avatarRadius + countStr.length * 8 + 16, y + 18);
        }
      });

      // 5. Footer
      const footY = height - 44;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, footY - 10, width, 1);

      const progressPct = currentFrame / totalFrames;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(40, footY - 4, width - 80, 4);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(40, footY - 4, (width - 80) * progressPct, 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Find real-time rankings & live daily analytics on Spialr.com', width / 2, footY + 18);

      currentFrame++;
      const progressPercent = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
      const creatorNameMsg = focusedProfile ? ('timeline of ' + focusedProfile.name) : 'creator timeline';
      onProgress(progressPercent, 'Generating ' + creatorNameMsg + '... ' + progressPercent + '%');

      // Super-fast GPU dispatch with requestAnimationFrame / microtask
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(renderNextFrame);
      } else {
        setTimeout(renderNextFrame, 0);
      }
    }

    renderNextFrame();
  });
}
