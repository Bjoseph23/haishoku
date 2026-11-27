import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad, roleColors, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";

enhanceChrome();
const data = dataset();
const index = byNumber(data);

function rect(id, fill, x, y, w, h, rx = 0) {
  const d = rx
    ? rounded(x, y, w, h, rx)
    : `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  return `<path data-surface="${id}" fill="${fill}" stroke="rgba(36,31,28,0.22)" stroke-width="1" d="${d}"/>`;
}
function rounded(x, y, w, h, r) {
  return `M ${x + r} ${y} h ${w - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - 2 * r} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - 2 * r)} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${-(h - 2 * r)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`;
}

const SCENES = {
  living: {
    label: "Living room",
    blurb: "Walls, floor, and curtains take the lightest color. The sofa takes the middle. The rug and lamp take the darkest.",
    surfaces: [
      ["ceiling", "dominant", "Ceiling"],
      ["wall", "dominant", "Walls"],
      ["floor", "dominant", "Floor"],
      ["curtains", "dominant", "Curtains"],
      ["sofa", "secondary", "Sofa"],
      ["accent", "secondary", "Accent wall"],
      ["rug", "accent", "Rug"],
      ["decor", "accent", "Lamp and frame"],
    ],
    draw(f) {
      return `
        ${rect("ceiling", f.ceiling, 0, 0, 800, 48)}
        ${rect("wall", f.wall, 0, 48, 800, 250)}
        ${rect("accent", f.accent, 530, 48, 270, 250)}
        ${rect("floor", f.floor, 0, 298, 800, 162)}
        ${rect("rug", f.rug, 170, 340, 400, 86, 10)}
        ${rect("curtains", f.curtains, 64, 72, 28, 190)}
        ${rect("curtains", f.curtains, 196, 72, 28, 190)}
        <rect x="92" y="84" width="104" height="130" fill="#efe8dc" stroke="rgba(36,31,28,0.25)" pointer-events="none"/>
        ${rect("sofa", f.sofa, 230, 268, 300, 86, 18)}
        ${rect("sofa", f.sofa, 248, 236, 78, 64, 14)}
        ${rect("sofa", f.sofa, 430, 236, 78, 64, 14)}
        ${rect("decor", f.decor, 648, 210, 12, 110)}
        ${rect("decor", f.decor, 620, 186, 68, 28, 6)}
        ${rect("decor", f.decor, 570, 86, 110, 72)}
        <rect x="584" y="100" width="82" height="44" fill="#efe8dc" pointer-events="none"/>
      `;
    },
  },
  bedroom: {
    label: "Bedroom",
    blurb: "The shell of the room stays the lightest color. The bed is the middle color. The throw and lamp are the accent.",
    surfaces: [
      ["ceiling", "dominant", "Ceiling"],
      ["wall", "dominant", "Walls"],
      ["floor", "dominant", "Floor"],
      ["curtains", "dominant", "Curtains"],
      ["bed", "secondary", "Bed"],
      ["head", "secondary", "Headboard"],
      ["rug", "accent", "Rug"],
      ["decor", "accent", "Lamp"],
    ],
    draw(f) {
      return `
        ${rect("ceiling", f.ceiling, 0, 0, 800, 48)}
        ${rect("wall", f.wall, 0, 48, 800, 260)}
        ${rect("floor", f.floor, 0, 308, 800, 152)}
        ${rect("curtains", f.curtains, 560, 70, 40, 200)}
        ${rect("curtains", f.curtains, 700, 70, 40, 200)}
        <rect x="600" y="84" width="100" height="130" fill="#efe8dc" stroke="rgba(36,31,28,0.25)" pointer-events="none"/>
        ${rect("rug", f.rug, 180, 390, 360, 40, 8)}
        ${rect("head", f.head, 120, 150, 36, 160, 6)}
        ${rect("bed", f.bed, 150, 210, 420, 120, 14)}
        ${rect("bed", f.bed, 170, 188, 120, 48, 10)}
        ${rect("bed", f.bed, 310, 188, 120, 48, 10)}
        ${rect("decor", f.decor, 80, 250, 16, 70)}
        <circle data-surface="decor" cx="88" cy="238" r="18" fill="${f.decor}" stroke="rgba(36,31,28,0.22)"/>
      `;
    },
  },
  kitchen: {
    label: "Kitchen",
    blurb: "Walls and floor carry the lightest color. Cabinets take the middle. The stool and a pot take the accent.",
    surfaces: [
      ["ceiling", "dominant", "Ceiling"],
      ["wall", "dominant", "Walls"],
      ["floor", "dominant", "Floor"],
      ["cabinet", "secondary", "Cabinets"],
      ["counter", "secondary", "Counter"],
      ["splash", "support", "Backsplash"],
      ["stool", "accent", "Stool"],
      ["decor", "accent", "Pot"],
    ],
    draw(f) {
      return `
        ${rect("ceiling", f.ceiling, 0, 0, 800, 40)}
        ${rect("wall", f.wall, 0, 40, 800, 200)}
        ${rect("floor", f.floor, 0, 320, 800, 140)}
        ${rect("cabinet", f.cabinet, 40, 70, 520, 70)}
        ${rect("splash", f.splash, 40, 150, 520, 70)}
        ${rect("counter", f.counter, 30, 214, 560, 28)}
        ${rect("cabinet", f.cabinet, 40, 242, 160, 78)}
        ${rect("cabinet", f.cabinet, 220, 242, 160, 78)}
        ${rect("cabinet", f.cabinet, 400, 242, 160, 78)}
        ${rect("stool", f.stool, 640, 250, 70, 16, 4)}
        ${rect("stool", f.stool, 662, 266, 12, 70)}
        ${rect("stool", f.stool, 676, 266, 12, 70)}
        <ellipse data-surface="decor" cx="140" cy="200" rx="28" ry="16" fill="${f.decor}" stroke="rgba(36,31,28,0.22)"/>
      `;
    },
  },
  patio: {
    label: "Patio",
    blurb: "The wall and deck are the large field. The awning is the middle color. The chair keeps the accent.",
    surfaces: [
      ["sky", "dominant", "Sky band"],
      ["wall", "dominant", "Wall"],
      ["deck", "dominant", "Deck"],
      ["trim", "dominant", "Post"],
      ["awning", "secondary", "Awning"],
      ["table", "secondary", "Table"],
      ["chair", "accent", "Chair"],
      ["plant", "accent", "Plant pot"],
    ],
    draw(f) {
      return `
        ${rect("sky", f.sky, 0, 0, 800, 150)}
        ${rect("wall", f.wall, 0, 150, 800, 170)}
        ${rect("deck", f.deck, 0, 320, 800, 140)}
        ${rect("awning", f.awning, 60, 70, 420, 36)}
        ${rect("trim", f.trim, 70, 106, 14, 214)}
        ${rect("trim", f.trim, 460, 106, 14, 214)}
        ${rect("table", f.table, 160, 300, 200, 16, 4)}
        ${rect("table", f.table, 176, 316, 12, 50)}
        ${rect("table", f.table, 332, 316, 12, 50)}
        ${rect("chair", f.chair, 400, 250, 70, 70, 8)}
        ${rect("chair", f.chair, 470, 230, 14, 90, 4)}
        <ellipse data-surface="plant" cx="120" cy="300" rx="26" ry="14" fill="${f.plant}" stroke="rgba(36,31,28,0.22)"/>
        <circle cx="120" cy="270" r="22" fill="#3f6b45" pointer-events="none"/>
      `;
    },
  },
  bar: {
    label: "Bar",
    blurb: "The room is the lightest color. The bar front is the middle. Stools and bottles are the accent.",
    surfaces: [
      ["ceiling", "dominant", "Ceiling"],
      ["wall", "dominant", "Wall"],
      ["floor", "dominant", "Floor"],
      ["shelf", "secondary", "Shelf"],
      ["bar", "secondary", "Bar front"],
      ["top", "support", "Counter"],
      ["stool", "accent", "Stools"],
      ["decor", "accent", "Bottles"],
    ],
    draw(f) {
      return `
        ${rect("ceiling", f.ceiling, 0, 0, 800, 36)}
        ${rect("wall", f.wall, 0, 36, 800, 250)}
        ${rect("floor", f.floor, 0, 330, 800, 130)}
        ${rect("shelf", f.shelf, 80, 70, 420, 18)}
        ${rect("decor", f.decor, 110, 40, 16, 30)}
        ${rect("decor", f.decor, 150, 28, 14, 42)}
        ${rect("decor", f.decor, 190, 36, 18, 34)}
        ${rect("decor", f.decor, 240, 32, 12, 38)}
        ${rect("bar", f.bar, 60, 200, 520, 130)}
        ${rect("top", f.top, 50, 184, 560, 22)}
        ${rect("stool", f.stool, 140, 340, 54, 14, 4)}
        ${rect("stool", f.stool, 156, 354, 10, 46)}
        ${rect("stool", f.stool, 300, 340, 54, 14, 4)}
        ${rect("stool", f.stool, 316, 354, 10, 46)}
        ${rect("stool", f.stool, 450, 340, 54, 14, 4)}
        ${rect("stool", f.stool, 466, 354, 10, 46)}
      `;
    },
  },
};

const app = document.getElementById("app");
let sceneId = "living";
let comboNumber = 176;
let turn = 0;
const override = {};

app.innerHTML = `
  <p class="kicker">Room studio</p>
  <h1>Color a room</h1>
  <p class="lede muted" id="blurb"></p>
  <div class="scene-tabs" role="tablist" aria-label="Rooms" id="tabs">
    ${Object.entries(SCENES).map(([id, scene]) => `<button type="button" class="preset" role="tab" data-scene="${id}" aria-pressed="${id === "living"}">${scene.label}</button>`).join("")}
  </div>
  <div class="studio" style="margin-top:16px">
    <div class="stage" id="stage"></div>
    <div class="panel">
      <button type="button" class="text-btn" id="shuffle">Shuffle roles</button>
      <p class="hint" id="ratio"></p>
      <div id="palette"></div>
      <div class="surface-list" id="surfaces"></div>
      <div id="picker"></div>
    </div>
  </div>
`;

const stage = document.getElementById("stage");
const surfacesEl = document.getElementById("surfaces");
const palette = document.getElementById("palette");

function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}
function assignment() {
  const scene = SCENES[sceneId];
  const roles = roleColors(rotateRoles(colors(), turn));
  const map = {};
  for (const [id, role] of scene.surfaces) {
    const chosen = override[sceneId + ":" + id];
    map[id] = chosen == null ? roles[role] || roles.secondary : colors()[chosen % colors().length];
  }
  return map;
}
function paint() {
  const scene = SCENES[sceneId];
  const map = assignment();
  const fills = Object.fromEntries(Object.entries(map).map(([id, color]) => [id, color.hex]));
  document.getElementById("blurb").textContent = scene.blurb;
  stage.innerHTML = `<svg viewBox="0 0 800 460" role="img" aria-label="${esc(scene.label)} colored with combination ${pad(comboNumber)}">${scene.draw(fills)}</svg>`;
  const cols = colors();
  palette.innerHTML = `<h2>#${pad(comboNumber)}</h2><div class="swatch-list">${cols.map((color) => `
    <div class="surface-btn" style="cursor:default"><i class="swatch-pip" style="background:${color.hex}"></i><span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
    <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button></div>`).join("")}</div>`;
  surfacesEl.innerHTML = scene.surfaces.map(([id, , label]) => `
    <button type="button" class="surface-btn" data-surface="${id}">
      <i class="swatch-pip" style="background:${map[id].hex}"></i>
      <span>${label}<br><span class="muted">${esc(map[id].name)}</span></span>
    </button>`).join("");
  document.getElementById("ratio").textContent = "Large surfaces start on the lightest color, the main furniture on the middle color, and the small objects on the darkest.";
}
function cycle(id) {
  const key = sceneId + ":" + id;
  const current = override[key];
  const base = current == null ? colors().findIndex((color) => color.hex === assignment()[id].hex) : current;
  override[key] = (Math.max(base, 0) + 1) % colors().length;
  paint();
}
stage.addEventListener("click", (event) => {
  const node = event.target.closest("[data-surface]");
  if (node) cycle(node.dataset.surface);
});
surfacesEl.addEventListener("click", (event) => {
  const node = event.target.closest("[data-surface]");
  if (node) cycle(node.dataset.surface);
});
app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) copyText(dot.dataset.hex);
  const tab = event.target.closest("[data-scene]");
  if (tab) {
    sceneId = tab.dataset.scene;
    document.querySelectorAll("[data-scene]").forEach((button) => button.setAttribute("aria-pressed", String(button === tab)));
    paint();
  }
});
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  for (const key of Object.keys(override)) {
    if (key.startsWith(sceneId + ":")) delete override[key];
  }
  paint();
});
const picker = mountPicker(document.getElementById("picker"), data.combinations, (combo) => {
  comboNumber = combo.number;
  turn = 0;
  for (const key of Object.keys(override)) delete override[key];
  paint();
});
picker.select(176);
paint();
