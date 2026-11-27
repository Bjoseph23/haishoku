function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load " + url));
    image.src = url;
  });
}

function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * (c ** (1 / 2.4)) - 0.055;
  return Math.min(255, Math.max(0, v * 255));
}

function rgbToOklab(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb(L, a, b) {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  const lp = l * l * l;
  const mp = m * m * m;
  const sp = s * s * s;
  return [
    linearToSrgb(4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp),
    linearToSrgb(-1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp),
    linearToSrgb(-0.0041960362 * lp - 0.7034186147 * mp + 1.707614701 * sp),
  ];
}

function boxBlur(src, w, h) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      let n = 0;
      for (let k = -2; k <= 2; k += 1) {
        const xx = x + k;
        if (xx < 0 || xx >= w) continue;
        sum += src[row + xx];
        n += 1;
      }
      tmp[row + x] = sum / n;
    }
  }
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) {
      let sum = 0;
      let n = 0;
      for (let k = -2; k <= 2; k += 1) {
        const yy = y + k;
        if (yy < 0 || yy >= h) continue;
        sum += tmp[yy * w + x];
        n += 1;
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Photo plus a feathered mask. R is the region id, G is coverage. */
export async function loadFrame(photoUrl, maskUrl) {
  const [photo, maskImage] = await Promise.all([loadImage(photoUrl), loadImage(maskUrl)]);
  const w = photo.naturalWidth;
  const h = photo.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(photo, 0, 0, w, h);
  const src = ctx.getImageData(0, 0, w, h).data;
  ctx.drawImage(maskImage, 0, 0, w, h);
  const md = ctx.getImageData(0, 0, w, h).data;
  const region = new Uint8Array(w * h);
  const cover = new Uint8Array(w * h);
  const second = new Uint8Array(w * h);
  const light = new Float32Array(w * h);
  const sums = new Map();
  const sumsq = new Map();
  const counts = new Map();
  for (let i = 0, p = 0; i < region.length; i += 1, p += 4) {
    const id = md[p];
    const alpha = md[p + 1];
    region[i] = alpha > 8 ? id : 0;
    cover[i] = region[i] ? alpha : 0;
    second[i] = region[i] ? md[p + 2] : 0;
    const lab = rgbToOklab(src[p], src[p + 1], src[p + 2]);
    light[i] = lab[0];
    if (region[i]) {
      sums.set(region[i], (sums.get(region[i]) || 0) + lab[0]);
      sumsq.set(region[i], (sumsq.get(region[i]) || 0) + lab[0] * lab[0]);
      counts.set(region[i], (counts.get(region[i]) || 0) + 1);
    }
  }
  const mean = {};
  const spread = {};
  for (const [id, sum] of sums) {
    const n = counts.get(id);
    mean[id] = sum / n;
    spread[id] = Math.sqrt(Math.max(0, sumsq.get(id) / n - mean[id] * mean[id]));
  }
  return { w, h, src, region, cover, second, light, smooth: boxBlur(light, w, h), mean, spread };
}

export function paintFrame(frame, colorByRegion, canvas, options = {}) {
  const { w, h, src, region, cover, second, light, smooth, mean, spread } = frame;
  const translucent = options.translucent || new Set();
  const texture = !!options.texture;
  const image = new ImageData(w, h);
  const out = image.data;
  const lab = {};
  const plain = {};
  for (const [id, hex] of Object.entries(colorByRegion)) {
    if (!hex) continue;
    const rgb = hexRgb(hex);
    plain[id] = rgb;
    lab[id] = rgbToOklab(...rgb);
  }
  function shade(i, p, id) {
    const target = lab[id];
    const targetRgb = plain[id];
    if (!target || !targetRgb) return null;
    const tL = target[0];
    const tLread = Math.min(0.86, Math.max(0.38, tL));
    const lift = tLread / Math.max(0.08, tL);
    const srcL = texture ? light[i] : smooth[i];
    const detail = (light[i] - smooth[i]) * (texture ? 0.55 : 0.4);
    const deviation = spread?.[id] ?? 0.08;
    const gain = texture ? (deviation < 0.04 ? 1.7 : 1.2) : 0.82;
    let L = tLread + (srcL - (mean[id] ?? tLread)) * gain + detail;
    L = Math.min(0.95, Math.max(texture ? 0.1 : 0.22, L));
    const rgb = oklabToRgb(L, target[1] * lift, target[2] * lift);
    const mix = texture ? 0.48 : 0.22;
    rgb[0] = rgb[0] * (1 - mix) + src[p] * (targetRgb[0] / 255) * mix;
    rgb[1] = rgb[1] * (1 - mix) + src[p + 1] * (targetRgb[1] / 255) * mix;
    rgb[2] = rgb[2] * (1 - mix) + src[p + 2] * (targetRgb[2] / 255) * mix;
    return rgb;
  }
  for (let i = 0, p = 0; i < region.length; i += 1, p += 4) {
    const id = region[i];
    const main = shade(i, p, id);
    const cov = cover[i] / 255;
    if (!main || cov < 0.02) {
      out[p] = src[p];
      out[p + 1] = src[p + 1];
      out[p + 2] = src[p + 2];
      out[p + 3] = 255;
      continue;
    }
    const id2 = second[i];
    const other = id2 ? shade(i, p, id2) : null;
    let rgb = main;
    let blend = cov;
    if (other) {
      const w = cov;
      rgb = [main[0] * w + other[0] * (1 - w), main[1] * w + other[1] * (1 - w), main[2] * w + other[2] * (1 - w)];
      blend = 1;
    }
    if (translucent.has(Number(id))) blend *= 0.42;
    out[p] = src[p] * (1 - blend) + rgb[0] * blend;
    out[p + 1] = src[p + 1] * (1 - blend) + rgb[1] * blend;
    out[p + 2] = src[p + 2] * (1 - blend) + rgb[2] * blend;
    out[p + 3] = 255;
  }
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  canvas.getContext("2d").putImageData(image, 0, 0);
}

export function regionAt(frame, canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * frame.w);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * frame.h);
  if (x < 0 || y < 0 || x >= frame.w || y >= frame.h) return 0;
  if (frame.cover[y * frame.w + x] < 80) return 0;
  return frame.region[y * frame.w + x];
}
