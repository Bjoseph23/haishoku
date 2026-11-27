import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";
import { loadFrame, paintFrame, regionAt } from "../recolor.js";

enhanceChrome();
const data = dataset();
const combos = data.combinations;
const index = byNumber(data);
const catalog = await fetch("assets/looks/catalog.json").then((response) => response.json());
const app = document.getElementById("app");

const PARTS = [
  ["top", "Top", 1],
  ["outer", "Outerwear", 2],
  ["bottoms", "Bottoms", 3],
  ["shoes", "Shoes", 4],
  ["accent", "Tie", 5],
];

let gender = "f";
let look = catalog.find((item) => item.id === "f-tee-jeans");
let comboNumber = 6;
let turn = 0;
const override = {};
let frame = null;
let frameKey = "";

app.innerHTML = `
  <p class="kicker">Outfit studio</p>
  <h1>Dress a plate</h1>
  <p class="lede muted">A studio photograph, recolored with one of the 348 combinations. Folds stay in the cloth. Shuffle moves the colors. A garment only cycles through colors from that plate. The grid is the looks we photographed.</p>
  <div class="studio" style="margin-top:16px">
    <div>
      <div class="stage" id="stage"><canvas id="figure" aria-label="Recolored outfit photograph"></canvas></div>
      <div class="lookbook" id="lookbook" role="listbox" aria-label="Photographed looks"></div>
    </div>
    <div class="panel">
      <div class="seg" role="group" aria-label="Figure">
        <button type="button" data-gender="f" aria-pressed="true">Female</button>
        <button type="button" data-gender="m" aria-pressed="false">Male</button>
      </div>
      <div class="presets" role="group" aria-label="Preset looks" id="presets"></div>
      <button type="button" class="text-btn" id="shuffle">Shuffle colors</button>
      <p class="hint" id="status">Loading photograph…</p>
      <div id="palette"></div>
      <div class="surface-list" id="parts"></div>
      <div id="picker"></div>
    </div>
  </div>
`;

const canvas = document.getElementById("figure");
const PRESETS = [
  ["casual", "Casual", "tee-jeans"],
  ["uni", "Uni", "polo-chinos"],
  ["formal", "Formal", "blazer"],
  ["date", "Date", "knit-trousers"],
  ["shirt", "Shirt", "shirt-trousers"],
  ["concert", "Concert", "jacket-jeans"],
];

function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}

function nearest(nextGender, top, outer, bottoms) {
  const pool = catalog.filter((item) => item.gender === nextGender);
  let best = pool[0];
  let score = -1;
  for (const item of pool) {
    let value = 0;
    if (item.top === top) value += 4;
    if (item.outer === outer) value += 3;
    if (item.bottoms === bottoms) value += 2;
    if (value > score) {
      score = value;
      best = item;
    }
  }
  return best;
}

function assignment() {
  const cols = rotateRoles(colors(), turn);
  const map = {};
  look.parts.forEach((part, i) => {
    const region = PARTS.find(([id]) => id === part)[2];
    const chosen = override[part];
    map[region] = cols[chosen == null ? i % cols.length : chosen % cols.length];
  });
  return map;
}

async function showLook(next) {
  look = next;
  const key = next.id;
  document.getElementById("status").textContent = "Loading photograph…";
  if (frameKey !== key) {
    frame = await loadFrame("assets/looks/" + next.photo, "assets/looks/" + next.mask);
    frameKey = key;
  }
  const map = assignment();
  const byRegion = {};
  for (const [region, color] of Object.entries(map)) byRegion[region] = color.hex;
  paintFrame(frame, byRegion, canvas);
  canvas.setAttribute("aria-label", `${next.gender === "f" ? "Female" : "Male"} ${next.top} look, combination ${pad(comboNumber)}`);
  document.getElementById("status").textContent = `${next.top}, ${next.outer === "none" ? "no layer" : next.outer}, ${next.bottoms}.`;
  document.getElementById("palette").innerHTML = `
    <h2>#${pad(comboNumber)}</h2>
    <div class="swatch-list">${colors().map((color) => `
      <div class="surface-btn" style="cursor:default"><i class="swatch-pip" style="background:${color.hex}"></i>
      <span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
      <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button></div>`).join("")}</div>`;
  document.getElementById("parts").innerHTML = look.parts.map((part) => {
    const region = PARTS.find(([id]) => id === part)[2];
    const color = map[region];
    const label = PARTS.find(([id]) => id === part)[1];
    return `<button type="button" class="surface-btn" data-part="${part}"><i class="swatch-pip" style="background:${color.hex}"></i><span>${label}<br><span class="muted">${esc(color.name)}</span></span></button>`;
  }).join("");
  document.querySelectorAll("[data-gender]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.gender === look.gender));
  });
  document.querySelectorAll("[data-look]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.look === look.id));
  });
  renderBook();
}

function renderBook() {
  const mine = catalog.filter((item) => item.gender === gender);
  document.getElementById("lookbook").innerHTML = mine.map((item) => `
    <button type="button" data-look="${item.id}" aria-pressed="${item.id === look.id}" aria-label="${item.top} ${item.bottoms}">
      <img src="assets/looks/${item.thumb}" alt="" width="180" height="280" loading="lazy">
    </button>`).join("");
  document.getElementById("presets").innerHTML = PRESETS.map(([id, label, slug]) => {
    const match = catalog.find((item) => item.id === `${gender}-${slug}`);
    return `<button type="button" class="preset" data-preset="${match ? match.id : ""}" aria-pressed="${look.id === `${gender}-${slug}`}">${label}</button>`;
  }).join("");
}

function cycle(part) {
  const cols = colors();
  const current = override[part];
  const base = current == null ? look.parts.indexOf(part) + turn : current;
  override[part] = (Math.max(0, base) + 1) % cols.length;
  showLook(look);
}

canvas.addEventListener("click", (event) => {
  if (!frame) return;
  const region = regionAt(frame, canvas, event);
  const part = PARTS.find(([, , id]) => id === region);
  if (part && look.parts.includes(part[0])) cycle(part[0]);
});
app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) copyText(dot.dataset.hex);
  const genderButton = event.target.closest("[data-gender]");
  if (genderButton) {
    gender = genderButton.dataset.gender;
    const next = nearest(gender, look.top, look.outer, look.bottoms);
    turn = 0;
    for (const key of Object.keys(override)) delete override[key];
    showLook(next);
  }
  const preset = event.target.closest("[data-preset]");
  if (preset && preset.dataset.preset) {
    const next = catalog.find((item) => item.id === preset.dataset.preset);
    turn = 0;
    for (const key of Object.keys(override)) delete override[key];
    showLook(next);
  }
  const thumb = event.target.closest("[data-look]");
  if (thumb) {
    const next = catalog.find((item) => item.id === thumb.dataset.look);
    turn = 0;
    for (const key of Object.keys(override)) delete override[key];
    showLook(next);
  }
  const part = event.target.closest("[data-part]");
  if (part) cycle(part.dataset.part);
});
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  for (const key of Object.keys(override)) delete override[key];
  showLook(look);
});

const picker = mountPicker(document.getElementById("picker"), combos, (combo) => {
  comboNumber = combo.number;
  turn = 0;
  for (const key of Object.keys(override)) delete override[key];
  showLook(look);
});
picker.select(6);
renderBook();
showLook(look);
