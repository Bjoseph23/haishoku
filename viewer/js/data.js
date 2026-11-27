export function dataset() {
  const data = window.HAISHOKU;
  if (!data || !Array.isArray(data.colors) || !Array.isArray(data.combinations)) {
    throw new Error("Palette data did not load.");
  }
  return data;
}

export function pad(n) {
  return String(n).padStart(3, "0");
}

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function relLum(hex) {
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function inkFor(hex) {
  return relLum(hex) > 0.58 ? "#241f1c" : "#f6f1e7";
}

export function hexOf(slot, mode) {
  return mode === "hex_cmyk" ? slot.hex_cmyk : slot.display_hex;
}

export function byNumber(data) {
  const map = new Map();
  for (const combo of data.combinations) map.set(combo.number, combo);
  return map;
}

/** Lightest color is the large field, middle the support, darkest the accent. */
export function roleColors(colors) {
  const ranked = [...colors].sort((a, b) => relLum(b.hex) - relLum(a.hex));
  const dominant = ranked[0];
  const accent = ranked[ranked.length - 1];
  const secondary = ranked[Math.min(1, ranked.length - 1)];
  const support = ranked[Math.min(2, ranked.length - 1)];
  return { dominant, secondary, support, accent, ranked };
}

export function rotateRoles(colors, turn) {
  const next = [...colors];
  const n = ((turn % next.length) + next.length) % next.length;
  return next.slice(n).concat(next.slice(0, n));
}

/** Roles by lightness, then moved round by Shuffle. turn 0 is the default 60 / 30 / 10 reading. */
export function shuffledRoles(colors, turn) {
  const ranked = rotateRoles(roleColors(colors).ranked, turn);
  return {
    dominant: ranked[0],
    secondary: ranked[Math.min(1, ranked.length - 1)],
    support: ranked[Math.min(2, ranked.length - 1)],
    accent: ranked[ranked.length - 1],
    ranked,
  };
}
