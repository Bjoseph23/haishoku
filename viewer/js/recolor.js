function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load " + url));
    image.src = url;
  });
}

function percentiles(values) {
  if (!values.length) return [0, 1];
  const copy = values.slice().sort((a, b) => a - b);
  const at = (p) => copy[Math.min(copy.length - 1, Math.floor(p * (copy.length - 1)))];
  return [at(0.08), at(0.92)];
}

/** Photo plus a mask. Region 0 is left as photographed (skin, hair, background). */
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
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(maskImage, 0, 0, w, h);
  const md = ctx.getImageData(0, 0, w, h).data;
  const region = new Uint8Array(w * h);
  const lum = new Float32Array(w * h);
  const buckets = new Map();
  for (let i = 0, p = 0; i < region.length; i += 1, p += 4) {
    const id = md[p];
    region[i] = id;
    const L = (0.2126 * src[p] + 0.7152 * src[p + 1] + 0.0722 * src[p + 2]) / 255;
    lum[i] = L;
    if (id) {
      if (!buckets.has(id)) buckets.set(id, []);
      buckets.get(id).push(L);
    }
  }
  const range = {};
  for (const [id, values] of buckets) range[id] = percentiles(values);
  return { w, h, src, region, lum, range };
}

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export function paintFrame(frame, colorByRegion, canvas) {
  const { w, h, src, region, lum, range } = frame;
  const image = new ImageData(w, h);
  const out = image.data;
  const rgb = {};
  for (const [id, hex] of Object.entries(colorByRegion)) {
    if (hex) rgb[id] = hexRgb(hex);
  }
  for (let i = 0, p = 0; i < region.length; i += 1, p += 4) {
    const id = region[i];
    const target = rgb[id];
    if (!target) {
      out[p] = src[p];
      out[p + 1] = src[p + 1];
      out[p + 2] = src[p + 2];
      out[p + 3] = 255;
      continue;
    }
    const span = Math.max(0.05, (range[id]?.[1] ?? 1) - (range[id]?.[0] ?? 0));
    const norm = Math.min(1, Math.max(0, (lum[i] - (range[id]?.[0] ?? 0)) / span));
    const shade = 0.4 + 0.74 * norm;
    out[p] = target[0] * shade;
    out[p + 1] = target[1] * shade;
    out[p + 2] = target[2] * shade;
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
  return frame.region[y * frame.w + x];
}
