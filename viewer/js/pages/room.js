import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad, roleColors, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";
import { loadFrame, paintFrame, regionAt } from "../recolor.js";

enhanceChrome();
const scenes = (await fetch("assets/rooms/catalog.json").then((response) => response.json())).filter((scene) => scene.id !== "facade");
const index = byNumber(dataset());
const app = document.getElementById("app");
let scene = scenes[0];
let comboNumber = 176;
let turn = 0;
const override = {};
let frame = null;
let frameKey = "";

app.innerHTML = `
  <p class="kicker">Room studio</p>
  <h1>Color a room</h1>
  <p class="lede muted" id="blurb"></p>
  <div class="scene-tabs" role="tablist" aria-label="Rooms" id="tabs">
    ${scenes.map((item) => `<button type="button" class="preset" role="tab" data-scene="${item.id}" aria-pressed="${item.id === scene.id}">${item.label}</button>`).join("")}
  </div>
  <div class="studio" style="margin-top:16px">
    <div class="stage" id="stage"><canvas id="view" aria-label="Recolored room photograph"></canvas></div>
    <div class="panel">
      <button type="button" class="text-btn" id="shuffle">Shuffle roles</button>
      <p class="hint" id="status">Loading photograph…</p>
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
    const chosen = override[scene.id + ":" + surface.id];
    map[surface.index] = chosen == null ? roles[surface.role] || roles.secondary : colors()[chosen % colors().length];
  }
  return map;
}
async function paint() {
  document.getElementById("blurb").textContent = scene.blurb;
  document.getElementById("status").textContent = "Loading photograph…";
  if (frameKey !== scene.id) {
    frame = await loadFrame("assets/rooms/" + scene.photo, "assets/rooms/" + scene.mask);
    frameKey = scene.id;
  }
  const map = assignment();
  const byRegion = {};
  for (const [region, color] of Object.entries(map)) byRegion[region] = color.hex;
  const translucent = new Set(scene.surfaces.filter((item) => item.translucent).map((item) => item.index));
  paintFrame(frame, byRegion, canvas, { translucent });
  document.getElementById("status").textContent = "Masks follow the main surfaces. Edges are approximate.";
  document.getElementById("palette").innerHTML = `<h2>#${pad(comboNumber)}</h2><div class="swatch-list">${colors().map((color) => `
    <div class="surface-btn" style="cursor:default"><i class="swatch-pip" style="background:${color.hex}"></i><span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
    <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button></div>`).join("")}</div>`;
  document.getElementById("surfaces").innerHTML = scene.surfaces.map((surface) => `
    <button type="button" class="surface-btn" data-surface="${surface.id}"><i class="swatch-pip" style="background:${map[surface.index].hex}"></i>
    <span>${surface.label}<br><span class="muted">${esc(map[surface.index].name)}</span></span></button>`).join("");
  document.querySelectorAll("[data-scene]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.scene === scene.id));
  });
}
function cycle(id) {
  const surface = scene.surfaces.find((item) => item.id === id);
  if (!surface) return;
  const key = scene.id + ":" + id;
  const current = override[key];
  const base = current == null ? colors().findIndex((color) => color.hex === assignment()[surface.index].hex) : current;
  override[key] = (Math.max(0, base) + 1) % colors().length;
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
  const tab = event.target.closest("[data-scene]");
  if (tab) {
    scene = scenes.find((item) => item.id === tab.dataset.scene);
    paint();
  }
  const surface = event.target.closest("[data-surface]");
  if (surface) cycle(surface.dataset.surface);
});
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  for (const key of Object.keys(override)) {
    if (key.startsWith(scene.id + ":")) delete override[key];
  }
  paint();
});
const picker = mountPicker(document.getElementById("picker"), dataset().combinations, (combo) => {
  comboNumber = combo.number;
  turn = 0;
  for (const key of Object.keys(override)) delete override[key];
  paint();
});
picker.select(176);
paint();
