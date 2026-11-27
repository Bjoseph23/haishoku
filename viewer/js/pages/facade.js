import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad, roleColors, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";

enhanceChrome();
const index = byNumber(dataset());
const app = document.getElementById("app");
let comboNumber = 347;
let turn = 0;
const override = {};
const surfaces = [
  ["wall", "dominant", "Wall"],
  ["roof", "secondary", "Roof"],
  ["frame", "secondary", "Window frames"],
  ["door", "accent", "Door"],
  ["trim", "accent", "Trim"],
  ["step", "dominant", "Step"],
];

app.innerHTML = `
  <p class="kicker">Architecture</p>
  <h1>A street elevation</h1>
  <p class="lede muted">A flat facade, not a rendering. Match <code>display_hex</code> to a paint fan later. The hex is the target, and the supplier’s code is what gets reordered. Sky stays paper so the building can be read.</p>
  <div class="studio" style="margin-top:16px">
    <div class="stage" id="stage"></div>
    <div class="panel">
      <button type="button" class="text-btn" id="shuffle">Shuffle roles</button>
      <div id="palette"></div>
      <div class="surface-list" id="surfaces"></div>
      <div id="picker"></div>
    </div>
  </div>
`;

function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}
function assignment() {
  const roles = roleColors(rotateRoles(colors(), turn));
  const map = {};
  for (const [id, role] of surfaces) {
    const chosen = override[id];
    map[id] = chosen == null ? roles[role] : colors()[chosen % colors().length];
  }
  return map;
}
function rect(id, fill, x, y, w, h) {
  return `<rect data-surface="${id}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="rgba(36,31,28,0.28)"/>`;
}
function paint() {
  const map = assignment();
  const f = Object.fromEntries(Object.entries(map).map(([id, color]) => [id, color.hex]));
  document.getElementById("stage").innerHTML = `
    <svg viewBox="0 0 800 520" role="img" aria-label="House facade colored with combination ${pad(comboNumber)}">
      <rect width="800" height="520" fill="#efe6d6"/>
      ${rect("wall", f.wall, 160, 150, 480, 280)}
      <polygon data-surface="roof" points="140,160 400,40 660,160" fill="${f.roof}" stroke="rgba(36,31,28,0.28)"/>
      ${rect("frame", f.frame, 210, 200, 110, 90)}
      ${rect("frame", f.frame, 480, 200, 110, 90)}
      <rect x="222" y="212" width="86" height="66" fill="#efe6d6" pointer-events="none"/>
      <rect x="492" y="212" width="86" height="66" fill="#efe6d6" pointer-events="none"/>
      ${rect("door", f.door, 360, 250, 80, 180)}
      <circle cx="424" cy="340" r="4" fill="#241f1c" pointer-events="none"/>
      ${rect("trim", f.trim, 160, 410, 480, 16)}
      ${rect("step", f.step, 330, 430, 140, 22)}
    </svg>`;
  const cols = colors();
  document.getElementById("palette").innerHTML = `<h2>#${pad(comboNumber)}</h2><div class="swatch-list">${cols.map((color) => `
    <div class="surface-btn" style="cursor:default"><i class="swatch-pip" style="background:${color.hex}"></i><span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
    <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button></div>`).join("")}</div>`;
  document.getElementById("surfaces").innerHTML = surfaces.map(([id, , label]) => `
    <button type="button" class="surface-btn" data-surface="${id}"><i class="swatch-pip" style="background:${map[id].hex}"></i><span>${label}<br><span class="muted">${esc(map[id].name)}</span></span></button>`).join("");
}
function cycle(id) {
  const current = override[id];
  const base = current == null ? colors().findIndex((color) => color.hex === assignment()[id].hex) : current;
  override[id] = (Math.max(base, 0) + 1) % colors().length;
  paint();
}
app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) copyText(dot.dataset.hex);
  const surface = event.target.closest("[data-surface]");
  if (surface && event.target.closest("#stage, #surfaces")) cycle(surface.dataset.surface);
});
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  for (const key of Object.keys(override)) delete override[key];
  paint();
});
const picker = mountPicker(document.getElementById("picker"), dataset().combinations, (combo) => {
  comboNumber = combo.number;
  turn = 0;
  for (const key of Object.keys(override)) delete override[key];
  paint();
});
picker.select(347);
paint();
