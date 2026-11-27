import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad, roleColors, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";
import { loadFrame, paintFrame, regionAt } from "../recolor.js";

enhanceChrome();
const scene = (await fetch("assets/rooms/catalog.json").then((response) => response.json())).find((item) => item.id === "facade");
const index = byNumber(dataset());
const app = document.getElementById("app");
let comboNumber = 347;
let turn = 0;
const override = {};
let frame = null;

app.innerHTML = `
  <p class="kicker">Architecture</p>
  <h1>A street elevation</h1>
  <p class="lede muted">${esc(scene.blurb)} The hex is a target for a paint fan. The supplier’s code is what gets reordered.</p>
  <div class="studio" style="margin-top:16px">
    <div class="stage"><canvas id="view" aria-label="Recolored house photograph"></canvas></div>
    <div class="panel">
      <button type="button" class="text-btn" id="shuffle">Shuffle roles</button>
      <div id="palette"></div>
      <div class="surface-list" id="surfaces"></div>
      <div id="picker"></div>
    </div>
  </div>
`;
const canvas = document.getElementById("view");
function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}
function assignment() {
  const roles = roleColors(rotateRoles(colors(), turn));
  const map = {};
  for (const surface of scene.surfaces) {
    const chosen = override[surface.id];
    map[surface.index] = chosen == null ? roles[surface.role] || roles.secondary : colors()[chosen % colors().length];
  }
  return map;
}
async function paint() {
  if (!frame) frame = await loadFrame("assets/rooms/" + scene.photo, "assets/rooms/" + scene.mask);
  const map = assignment();
  const byRegion = {};
  for (const [region, color] of Object.entries(map)) byRegion[region] = color.hex;
  paintFrame(frame, byRegion, canvas);
  document.getElementById("palette").innerHTML = `<h2>#${pad(comboNumber)}</h2><div class="swatch-list">${colors().map((color) => `
    <div class="surface-btn" style="cursor:default"><i class="swatch-pip" style="background:${color.hex}"></i><span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
    <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button></div>`).join("")}</div>`;
  document.getElementById("surfaces").innerHTML = scene.surfaces.map((surface) => `
    <button type="button" class="surface-btn" data-surface="${surface.id}"><i class="swatch-pip" style="background:${map[surface.index].hex}"></i>
    <span>${surface.label}<br><span class="muted">${esc(map[surface.index].name)}</span></span></button>`).join("");
}
function cycle(id) {
  const surface = scene.surfaces.find((item) => item.id === id);
  if (!surface) return;
  const current = override[id];
  const base = current == null ? colors().findIndex((color) => color.hex === assignment()[surface.index].hex) : current;
  override[id] = (Math.max(0, base) + 1) % colors().length;
  paint();
}
canvas.addEventListener("click", (event) => {
  if (!frame) return;
  const region = regionAt(frame, canvas, event);
  const surface = scene.surfaces.find((item) => item.index === region);
  if (surface) cycle(surface.id);
});
app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) copyText(dot.dataset.hex);
  const surface = event.target.closest("[data-surface]");
  if (surface) cycle(surface.dataset.surface);
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
