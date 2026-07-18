// Core conversion engine: turns raw pixel data into Unicode Braille "dot art"
// or classic ASCII-ramp art. Braille mode is what gives the dense, accurate
// dot-matrix look (each character encodes an independent 2x4 grid of dots,
// so it has 8x the resolution of a single ASCII character).

const ASCII_RAMP = "@%#*+=-:. "; // dark -> light

// Braille dot bit positions (standard Unicode braille cell layout):
// 1 4
// 2 5
// 3 6
// 7 8
const BRAILLE_BITS = [
  [0x01, 0x08], // row 0: dot1, dot4
  [0x02, 0x10], // row 1: dot2, dot5
  [0x04, 0x20], // row 2: dot3, dot6
  [0x40, 0x80], // row 3: dot7, dot8
];

/**
 * Draw an image onto an offscreen canvas at a target pixel size and
 * return its grayscale luminance data as a Float32Array (0 = black, 255 = white).
 */
function getGrayscale(image, targetWidthPx, targetHeightPx, cropLeft = 0, cropRight = 0, cropTop = 0, cropBottom = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Calculate source rectangle coordinates
  const sx = image.width * cropLeft;
  const sy = image.height * cropTop;
  const sWidth = image.width * (1 - cropLeft - cropRight);
  const sHeight = image.height * (1 - cropTop - cropBottom);

  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, targetWidthPx, targetHeightPx);

  const { data } = ctx.getImageData(0, 0, targetWidthPx, targetHeightPx);
  const gray = new Float32Array(targetWidthPx * targetHeightPx);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3] / 255;
    // Rec. 709 luma, blended onto white for transparent pixels
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    gray[p] = lum * a + 255 * (1 - a);
  }
  return gray;
}

function applyContrastBrightnessGamma(gray, width, height, contrast, brightness, gamma = 1.0) {
  // contrast: -100..100, brightness: -100..100, gamma: 0.2..3.0
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < gray.length; i++) {
    // 1. Apply contrast and brightness
    let v = factor * (gray[i] - 128) + 128 + brightness;
    v = Math.max(0, Math.min(255, v));
    // 2. Apply gamma correction (adjust midtones)
    if (gamma !== 1.0) {
      v = Math.pow(v / 255, gamma) * 255;
    }
    gray[i] = v;
  }
  return gray;
}

/**
 * Floyd-Steinberg error-diffusion dithering. Produces much more accurate-looking
 * dot art than a flat threshold because it preserves perceived shading through
 * dot density rather than hard edges.
 */
const BAYER_4X4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

const BAYER_8X8 = [
  [ 0, 48, 12, 60,  3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [ 8, 56,  4, 52, 11, 59,  7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [ 2, 50, 14, 62,  1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58,  6, 54,  9, 57,  5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21]
];

function ditherToBinary(gray, width, height, threshold, ditherAmount = 1.0, ditherMode = 'floyd-steinberg') {
  const bin = new Uint8Array(width * height);

  if (ditherMode === 'threshold') {
    for (let i = 0; i < gray.length; i++) {
      bin[i] = gray[i] < threshold ? 1 : 0;
    }
    return bin;
  }

  if (ditherMode === 'bayer-4x4') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const matrixVal = BAYER_4X4[y % 4][x % 4];
        const normThreshold = ((matrixVal + 0.5) / 16) * 255;
        bin[idx] = gray[idx] < normThreshold ? 1 : 0;
      }
    }
    return bin;
  }

  if (ditherMode === 'bayer-8x8') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const matrixVal = BAYER_8X8[y % 8][x % 8];
        const normThreshold = ((matrixVal + 0.5) / 64) * 255;
        bin[idx] = gray[idx] < normThreshold ? 1 : 0;
      }
    }
    return bin;
  }

  const g = Float32Array.from(gray); // work on a copy

  if (ditherMode === 'atkinson') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const old = g[idx];
        const on = old < threshold ? 1 : 0;
        bin[idx] = on;
        const newVal = on ? 0 : 255;
        const err = (old - newVal) * ditherAmount;
        const e8 = err / 8;

        if (x + 1 < width) g[idx + 1] += e8;
        if (x + 2 < width) g[idx + 2] += e8;
        if (y + 1 < height) {
          if (x - 1 >= 0) g[idx + width - 1] += e8;
          g[idx + width] += e8;
          if (x + 1 < width) g[idx + width + 1] += e8;
        }
        if (y + 2 < height) {
          g[idx + 2 * width] += e8;
        }
      }
    }
    return bin;
  }

  // Default: Floyd-Steinberg
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const old = g[idx];
      const on = old < threshold ? 1 : 0;
      bin[idx] = on;
      const newVal = on ? 0 : 255;
      const err = (old - newVal) * ditherAmount;

      if (x + 1 < width) g[idx + 1] += (err * 7) / 16;
      if (y + 1 < height) {
        if (x - 1 >= 0) g[idx + width - 1] += (err * 3) / 16;
        g[idx + width] += (err * 5) / 16;
        if (x + 1 < width) g[idx + width + 1] += (err * 1) / 16;
      }
    }
  }
  return bin;
}

function getOutline(bin, width, height) {
  const outline = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (bin[idx] === 1) {
        let isBoundary = false;
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          isBoundary = true;
        } else {
          // Check 4-neighborhood
          if (
            bin[idx - 1] === 0 ||
            bin[idx + 1] === 0 ||
            bin[idx - width] === 0 ||
            bin[idx + width] === 0
          ) {
            isBoundary = true;
          }
        }
        if (isBoundary) {
          outline[idx] = 1;
        }
      }
    }
  }
  return outline;
}

function binaryToGray(bin) {
  const gray = new Float32Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    gray[i] = bin[i] ? 0 : 255;
  }
  return gray;
}

function renderBraille(bin, pxWidth, pxHeight, minInk) {
  const cols = Math.floor(pxWidth / 2);
  const rows = Math.floor(pxHeight / 4);
  const lines = new Array(rows);

  for (let cy = 0; cy < rows; cy++) {
    let line = "";
    for (let cx = 0; cx < cols; cx++) {
      let bits = 0;
      for (let ry = 0; ry < 4; ry++) {
        for (let rx = 0; rx < 2; rx++) {
          const px = cx * 2 + rx;
          const py = cy * 4 + ry;
          if (bin[py * pxWidth + px]) bits |= BRAILLE_BITS[ry][rx];
        }
      }
      // A fully-blank braille cell (U+2800, zero dots) renders with
      // unpredictable/collapsed advance width in some apps' fonts (notably
      // Instagram's comment box), which shifts every subsequent line by a
      // different amount and scrambles the picture. Forcing a single faint
      // dot keeps every character's width consistent, at the cost of a very
      // subtle background texture.
      if (bits === 0 && minInk) bits = 0x01;
      line += String.fromCharCode(0x2800 + bits);
    }
    lines[cy] = line;
  }
  return { lines, cols, rows };
}

function renderAsciiRamp(gray, pxWidth, pxHeight, cellW, cellH, ramp) {
  const cols = Math.floor(pxWidth / cellW);
  const rows = Math.floor(pxHeight / cellH);
  const lines = new Array(rows);
  const rampLen = ramp.length;

  for (let cy = 0; cy < rows; cy++) {
    let line = "";
    for (let cx = 0; cx < cols; cx++) {
      let sum = 0;
      let count = 0;
      for (let ry = 0; ry < cellH; ry++) {
        for (let rx = 0; rx < cellW; rx++) {
          const px = cx * cellW + rx;
          const py = cy * cellH + ry;
          sum += gray[py * pxWidth + px];
          count++;
        }
      }
      const avg = sum / count; // 0 dark .. 255 light
      const charIdx = Math.min(rampLen - 1, Math.floor((avg / 255) * rampLen));
      line += ramp[charIdx];
    }
    lines[cy] = line;
  }
  return { lines, cols, rows };
}

/**
 * Main entry point.
 * Options include: modes, output size, contrast, brightness, gamma, and threshold.
 */
export function convertImageToDotArt(image, options) {
  const {
    mode = "braille",
    outputCols = 120,
    invert = false,
    minInk = true,
    contrast = 100,
    brightness = 100,
    gamma = 3.00,
    threshold = 100,
    ditherAmount = 0.75,
    ditherMode = "floyd-steinberg",
    unlimited = false,
    cropLeft = 0,
    cropRight = 0,
    cropTop = 0,
    cropBottom = 0,
  } = options;

  const cols = unlimited ? outputCols : Math.min(outputCols, 74);
  
  // Calculate aspect ratio based on cropped bounds
  const sWidth = image.width * (1 - cropLeft - cropRight);
  const sHeight = image.height * (1 - cropTop - cropBottom);
  const aspect = sWidth / sHeight;

  let pxWidth, pxHeight;
  if (mode === "braille") {
    pxWidth = cols * 2;
    pxHeight = Math.max(4, Math.round(pxWidth / aspect / 4) * 4);
  } else {
    const cellW = 2;
    const cellH = 4;
    pxWidth = cols * cellW;
    pxHeight = Math.max(cellH, Math.round((pxWidth / aspect) * (cellH / cellW) / cellH) * cellH);
  }

  let gray = getGrayscale(image, pxWidth, pxHeight, cropLeft, cropRight, cropTop, cropBottom);
  gray = applyContrastBrightnessGamma(gray, pxWidth, pxHeight, contrast, brightness, gamma);

  if (invert) {
    for (let i = 0; i < gray.length; i++) gray[i] = 255 - gray[i];
  }

  const binDithered = ditherToBinary(gray, pxWidth, pxHeight, threshold, ditherAmount, ditherMode);

  if (mode === "braille") {
    const dithered = renderBraille(binDithered, pxWidth, pxHeight, minInk);
    return {
      lines: dithered.lines,
      cols: dithered.cols,
      rows: dithered.rows,
    };
  }

  const dithered = renderAsciiRamp(gray, pxWidth, pxHeight, 2, 4, ASCII_RAMP);
  return {
    lines: dithered.lines,
    cols: dithered.cols,
    rows: dithered.rows,
  };
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Heuristic-based subject boundary detection (auto-cropping).
 * Analyzes vertical and horizontal pixel gradients to trim uniform background.
 */
export function detectSubjectBounds(image) {
  const canvas = document.createElement("canvas");
  const maxDim = 150; // Analyze at small resolution for fast performance
  const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, w, h);
  
  const { data } = ctx.getImageData(0, 0, w, h);
  
  // Calculate luminance of each pixel
  const brightness = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    brightness[p] = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
  }
  
  // Calculate column activity (vertical changes)
  const colActivity = new Float32Array(w);
  for (let x = 1; x < w - 1; x++) {
    let activity = 0;
    for (let y = 1; y < h - 1; y++) {
      const idx = y * w + x;
      const val = brightness[idx];
      const diffY = Math.abs(val - brightness[idx - w]);
      const diffX = Math.abs(val - brightness[idx - 1]);
      activity += diffY + diffX;
    }
    colActivity[x] = activity / h;
  }
  
  // Calculate row activity (horizontal changes)
  const rowActivity = new Float32Array(h);
  for (let y = 1; y < h - 1; y++) {
    let activity = 0;
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const val = brightness[idx];
      const diffY = Math.abs(val - brightness[idx - w]);
      const diffX = Math.abs(val - brightness[idx - 1]);
      activity += diffY + diffX;
    }
    rowActivity[y] = activity / w;
  }
  
  let avgColAct = 0;
  let maxColAct = 0;
  for (let x = 0; x < w; x++) {
    avgColAct += colActivity[x];
    if (colActivity[x] > maxColAct) maxColAct = colActivity[x];
  }
  avgColAct /= w;
  
  let avgRowAct = 0;
  let maxRowAct = 0;
  for (let y = 0; y < h; y++) {
    avgRowAct += rowActivity[y];
    if (rowActivity[y] > maxRowAct) maxRowAct = rowActivity[y];
  }
  avgRowAct /= h;
  
  if (maxColAct < 1.0 && maxRowAct < 1.0) {
    return { cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0 };
  }
  
  // Dynamic threshold: ignore low-activity borders (typically solid backgrounds)
  const colThreshold = Math.max(1.0, avgColAct * 0.3);
  const rowThreshold = Math.max(1.0, avgRowAct * 0.3);
  
  let left = 0;
  while (left < w / 2 && colActivity[left] < colThreshold) {
    left++;
  }
  
  let right = w - 1;
  while (right > w / 2 && colActivity[right] < colThreshold) {
    right--;
  }
  
  let top = 0;
  while (top < h / 2 && rowActivity[top] < rowThreshold) {
    top++;
  }
  
  let bottom = h - 1;
  while (bottom > h / 2 && rowActivity[bottom] < rowThreshold) {
    bottom--;
  }
  
  // Safe bounds with padding
  const paddingPct = 0.02;
  const cropLeft = Math.max(0, (left / w) - paddingPct);
  const cropRight = Math.max(0, (1 - (right / w)) - paddingPct);
  const cropTop = Math.max(0, (top / h) - paddingPct);
  const cropBottom = Math.max(0, (1 - (bottom / h)) - paddingPct);
  
  return {
    cropLeft: Math.round(Math.min(0.45, cropLeft) * 100) / 100,
    cropRight: Math.round(Math.min(0.45, cropRight) * 100) / 100,
    cropTop: Math.round(Math.min(0.45, cropTop) * 100) / 100,
    cropBottom: Math.round(Math.min(0.45, cropBottom) * 100) / 100,
  };
}
