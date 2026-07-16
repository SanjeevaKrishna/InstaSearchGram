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
function getGrayscale(image, targetWidthPx, targetHeightPx) {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, targetWidthPx, targetHeightPx);

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
function ditherToBinary(gray, width, height, threshold, ditherAmount = 1.0) {
  const g = Float32Array.from(gray); // work on a copy
  const bin = new Uint8Array(width * height); // 1 = dark/on, 0 = light/off

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

function flatThreshold(gray, threshold) {
  const bin = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) bin[i] = gray[i] < threshold ? 1 : 0;
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
  } = options;

  const contrast = 100;
  const brightness = 100;
  const gamma = 3.00;
  const threshold = 100;
  const ditherAmount = 0.75;

  const cols = Math.min(outputCols, 74);
  const aspect = image.width / image.height;

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

  let gray = getGrayscale(image, pxWidth, pxHeight);
  gray = applyContrastBrightnessGamma(gray, pxWidth, pxHeight, contrast, brightness, gamma);

  if (invert) {
    for (let i = 0; i < gray.length; i++) gray[i] = 255 - gray[i];
  }

  const binDithered = ditherToBinary(gray, pxWidth, pxHeight, threshold, ditherAmount);

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
