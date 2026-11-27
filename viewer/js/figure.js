const CX = 180;
const SKIN = "#e7d0be";
const HAIR = "#2a2420";
const LINE = "rgba(36,31,28,0.28)";

function metrics(gender) {
  if (gender === "f") {
    return { shoulder: 62, waist: 46, hip: 64, thigh: 28, calf: 14, head: 24 };
  }
  return { shoulder: 78, waist: 64, hip: 62, thigh: 30, calf: 15, head: 25 };
}

function n(value) {
  return Math.round(value * 10) / 10;
}

function sleeve(side, reach, fill, part) {
  const s = side === "l" ? -1 : 1;
  const x0 = CX + s * (reach.shoulder - 18);
  const y0 = 132;
  const x1 = CX + s * (reach.shoulder + reach.out);
  const y1 = reach.y;
  const cuff = reach.cuff;
  const d = `M ${n(x0)} ${y0}
    C ${n(x0 + s * 10)} ${y0 + 24}, ${n(x1 + s * 6)} ${y1 - 30}, ${n(x1)} ${y1}
    L ${n(x1 - s * cuff)} ${y1 + 8}
    C ${n(x1 - s * cuff - s * 8)} ${y1 - 20}, ${n(x0 + s * 4)} ${y0 + 36}, ${n(x0 - s * 8)} ${y0 + 8}
    Z`;
  return `<path data-part="${part}" fill="${fill}" stroke="${LINE}" stroke-width="1" d="${d}"/>`;
}

function legs(m, style, fill) {
  const y0 = 255;
  const y1 = 552;
  const gap = 4;
  const ankle = style === "chinos" ? m.hip * 0.46 : style === "jeans" ? m.hip * 0.55 : m.hip * 0.52;
  const paths = [-1, 1].map((s) => {
    const outer0 = CX + s * m.hip;
    const inner0 = CX + s * gap;
    const outer1 = CX + s * ankle;
    const inner1 = CX + s * (gap + 1);
    return `M ${n(outer0)} ${y0}
      C ${n(outer0 + s * 2)} 380, ${n(outer1 + s * 4)} 470, ${n(outer1)} ${y1}
      L ${n(inner1)} ${y1}
      C ${n(inner1 + s * 2)} 470, ${n(inner0)} 390, ${n(inner0)} ${y0 + 28}
      Z`;
  });
  const crease = [-1, 1].map((s) => {
    const x = CX + s * (m.hip * 0.42);
    return `<path d="M ${n(x)} 320 L ${n(x)} 530" fill="none" stroke="${LINE}" stroke-width="1" pointer-events="none"/>`;
  }).join("");
  return paths.map((d) => `<path data-part="bottoms" fill="${fill}" stroke="${LINE}" stroke-width="1" d="${d}"/>`).join("") + crease;
}

function torso(m, fill, part, hem, neck) {
  const ls = CX - m.shoulder;
  const rs = CX + m.shoulder;
  const lw = CX - m.waist;
  const rw = CX + m.waist;
  const d = `M ${n(ls)} 134
    C ${n(ls - 4)} 180, ${n(lw - 2)} 220, ${n(lw)} 258
    L ${n(lw - 2)} ${hem}
    L ${n(rw + 2)} ${hem}
    L ${n(rw)} 258
    C ${n(rw + 2)} 220, ${n(rs + 4)} 180, ${n(rs)} 134
    Q ${n(CX)} 122, ${n(CX + 18)} ${126 + neck}
    Q ${n(CX)} ${144 + neck}, ${n(CX - 18)} ${126 + neck}
    Q ${n(CX)} 122, ${n(ls)} 134 Z`;
  return `<path data-part="${part}" fill="${fill}" stroke="${LINE}" stroke-width="1" d="${d}"/>`;
}

function blazer(m, fill) {
  const panels = [-1, 1].map((s) => {
    const outerS = CX + s * m.shoulder;
    const outerH = CX + s * (m.waist + 8);
    const innerS = CX + s * 10;
    const innerH = CX + s * 16;
    const lapel = CX + s * 28;
    return `M ${n(outerS)} 136
      C ${n(outerS + s * 2)} 190, ${n(outerH)} 230, ${n(outerH)} 300
      L ${n(innerH)} 318
      L ${n(innerS)} 230
      L ${n(lapel)} 150
      Q ${n(CX + s * 20)} 132, ${n(outerS * 0.15 + CX * 0.85)} 128
      Z`;
  });
  return panels.map((d) => `<path data-part="outer" fill="${fill}" stroke="${LINE}" stroke-width="1" d="${d}"/>`).join("");
}

function jacket(m, fill) {
  const d = `M ${n(CX - m.shoulder)} 132
    L ${n(CX - m.waist - 6)} 318
    L ${n(CX + m.waist + 6)} 318
    L ${n(CX + m.shoulder)} 132
    Q ${n(CX)} 118, ${n(CX - m.shoulder)} 132 Z`;
  const zip = `<path d="M ${CX} 150 L ${CX} 310" fill="none" stroke="${LINE}" stroke-width="1.4" pointer-events="none"/>`;
  return `<path data-part="outer" fill="${fill}" stroke="${LINE}" stroke-width="1" d="${d}"/>${zip}`;
}

function collar(kind) {
  if (kind === "shirt" || kind === "polo") {
    const drop = kind === "shirt" ? 22 : 12;
    return `<path d="M ${n(CX - 20)} 124 L ${n(CX - 34)} ${124 + drop} L ${n(CX - 8)} ${130 + drop} L ${CX} 128 L ${n(CX + 8)} ${130 + drop} L ${n(CX + 34)} ${124 + drop} L ${n(CX + 20)} 124 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="1" pointer-events="none"/>`;
  }
  return "";
}

function tie(fill) {
  return `<path data-part="accent" fill="${fill}" stroke="${LINE}" stroke-width="1" d="M ${n(CX - 7)} 142 L ${n(CX + 7)} 142 L ${n(CX + 11)} 250 L ${CX} 268 L ${n(CX - 11)} 250 Z"/>`;
}

function pocket(fill) {
  return `<path data-part="accent" fill="${fill}" stroke="${LINE}" stroke-width="1" d="M ${n(CX + 24)} 168 L ${n(CX + 46)} 168 L ${n(CX + 42)} 186 L ${n(CX + 28)} 186 Z"/>`;
}

function shoes(m, fill) {
  return [-1, 1].map((s) => {
    const x = CX + s * (m.calf + 8);
    return `<path data-part="shoes" fill="${fill}" stroke="${LINE}" stroke-width="1" d="M ${n(x - s * 16)} 548
      L ${n(x + s * 18)} 548
      Q ${n(x + s * 26)} 562, ${n(x + s * 16)} 572
      L ${n(x - s * 18)} 572
      Q ${n(x - s * 22)} 560, ${n(x - s * 16)} 548 Z"/>`;
  }).join("");
}

function head(m, gender) {
  const r = m.head;
  const hair = gender === "f"
    ? `<path fill="${HAIR}" d="M ${n(CX - r)} 66
        C ${n(CX - r - 8)} 24, ${n(CX + r + 10)} 20, ${n(CX + r + 2)} 66
        C ${n(CX + r + 10)} 108, ${n(CX + 28)} 132, ${n(CX + 16)} 146
        L ${n(CX + 6)} 112
        C ${n(CX + r - 6)} 96, ${n(CX)} 92, ${n(CX - 6)} 112
        L ${n(CX - 16)} 146
        C ${n(CX - 28)} 132, ${n(CX - r - 8)} 108, ${n(CX - r)} 66 Z"/>`
    : `<path fill="${HAIR}" d="M ${n(CX - r - 2)} 62
        C ${n(CX - r - 8)} 28, ${n(CX + r + 10)} 24, ${n(CX + r + 4)} 64
        C ${n(CX + r + 2)} 78, ${n(CX + r - 6)} 86, ${n(CX)} 84
        C ${n(CX - r + 4)} 88, ${n(CX - r)} 74, ${n(CX - r - 2)} 62 Z"/>`;
  return `
    ${hair}
    <ellipse cx="${CX}" cy="78" rx="${r - 2}" ry="${r + 4}" fill="${SKIN}"/>
    <path d="M ${n(CX - 8)} 100 L ${n(CX + 8)} 100 L ${n(CX + 7)} 126 L ${n(CX - 7)} 126 Z" fill="${SKIN}"/>
  `;
}

function hands(x, y) {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="7" fill="${SKIN}" pointer-events="none"/>`;
}

export function renderFigure(state, fills) {
  const m = metrics(state.gender);
  const long = state.outer !== "none" || state.top === "shirt" || state.top === "knit";
  const sleevePart = state.outer === "none" ? "top" : "outer";
  const sleeveFill = sleevePart === "outer" ? fills.outer : fills.top;
  const reach = {
    shoulder: m.shoulder,
    out: long ? 18 : 30,
    y: long ? 340 : 210,
    cuff: long ? 16 : 20,
  };
  const hem = state.top === "tee" || state.top === "polo" ? 300 : 328;
  const neck = state.top === "tee" ? 8 : 0;
  const bits = [
    `<ellipse cx="${CX}" cy="630" rx="70" ry="8" fill="rgba(36,31,28,0.08)"/>`,
    legs(m, state.bottoms, fills.bottoms),
    shoes(m, fills.shoes),
    sleeve("l", reach, sleeveFill, sleevePart),
    sleeve("r", reach, sleeveFill, sleevePart),
    torso(m, fills.top, "top", hem, neck),
  ];
  if (state.outer === "blazer") bits.push(blazer(m, fills.outer));
  if (state.outer === "jacket") bits.push(jacket(m, fills.outer));
  bits.push(collar(state.top));
  if (state.accent === "tie" && (state.top === "shirt" || state.top === "polo")) bits.push(tie(fills.accent));
  if (state.accent === "pocket" && state.outer !== "none") bits.push(pocket(fills.outer === "none" ? fills.top : fills.accent));
  bits.push(head(m, state.gender));
  const handY = reach.y + 4;
  const handX = m.shoulder + reach.out - reach.cuff * 0.35;
  bits.push(hands(CX - handX, handY), hands(CX + handX, handY));
  const label = `${state.gender === "f" ? "Female" : "Male"} figure wearing the chosen combination. Choose a garment to change its color.`;
  return `<svg viewBox="0 0 360 660" role="img" aria-label="${label}">${bits.join("")}</svg>`;
}

export const PRESETS = [
  { id: "formal", label: "Formal", gender: "m", top: "shirt", outer: "blazer", bottoms: "trousers", accent: "tie", combo: 16 },
  { id: "casual", label: "Casual", gender: "f", top: "tee", outer: "none", bottoms: "jeans", accent: "none", combo: 6 },
  { id: "uni", label: "Uni", gender: "m", top: "polo", outer: "none", bottoms: "chinos", accent: "none", combo: 122 },
  { id: "date", label: "Date", gender: "f", top: "knit", outer: "blazer", bottoms: "trousers", accent: "none", combo: 14 },
  { id: "event", label: "Event", gender: "f", top: "shirt", outer: "jacket", bottoms: "trousers", accent: "pocket", combo: 176 },
  { id: "concert", label: "Concert", gender: "m", top: "tee", outer: "jacket", bottoms: "jeans", accent: "none", combo: 22 },
];
