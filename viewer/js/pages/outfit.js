import { enhanceChrome } from "../chrome.js";
import { dataset, byNumber, pad, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";
import { loadFrame, paintFrame, regionAt } from "../recolor.js";
import { studioShell, photoStage, withStage, crossfade, renderPlate, renderAssign, bindCopy, plateFromHash, writePlateHash, fatal } from "../studio.js";

enhanceChrome();
const app = document.getElementById("app");
let data;
let catalog;
try {
  data = dataset();
  catalog = await fetch("assets/looks/catalog.json").then((response) => {
    if (!response.ok) throw new Error("The look catalog did not load.");
    return response.json();
  });
} catch (err) {
  fatal(app, err);
  throw err;
}
const combos = data.combinations;
const index = byNumber(data);

const PARTS = [
  ["top", "Top", 1],
  ["outer", "Outerwear", 2],
  ["bottoms", "Bottoms", 3],
  ["shoes", "Shoes", 4],
  ["accent", "Tie", 5],
];
const PRESETS = [
  ["casual", "Casual", "tee-jeans"],
  ["uni", "Uni", "polo-chinos"],
  ["formal", "Formal", "blazer"],
  ["date", "Date", "knit-trousers"],
  ["shirt", "Shirt", "shirt-trousers"],
  ["concert", "Concert", "jacket-jeans"],
];
const DEFAULT_PLATE = 6;

let gender = "f";
let look = catalog.find((item) => item.id === "f-tee-jeans");
let comboNumber = plateFromHash(DEFAULT_PLATE, (n) => index.has(n));
let turn = 0;
const override = {};
let frame = null;
let frameKey = "";
let loading = null;

app.innerHTML = studioShell({
  kicker: "Outfit studio",
  title: "Dress a plate",
  lede: "A studio photograph, recolored with one of the 348 combinations. Folds stay in the cloth. A garment only cycles through colors from the plate in play.",
  stage: photoStage({ id: "figure", shape: "portrait", label: "Recolored outfit photograph", tip: "Click a garment to change its color" }),
  groups: [
    {
      id: "look",
      label: "Look",
      body: `
        <div class="seg full" role="group" aria-label="Figure">
          <button type="button" data-gender="f" aria-pressed="true">Female</button>
          <button type="button" data-gender="m" aria-pressed="false">Male</button>
        </div>
        <div class="seg full tight presets-grid" role="group" aria-label="Preset looks" id="presets"></div>
        <div class="lookbook" id="lookbook" role="group" aria-label="Photographed looks"></div>`,
    },
    {
      id: "plate",
      label: "Plate",
      action: `<button type="button" class="link-btn" id="shuffle">Shuffle colors</button>`,
      body: `<div id="palette"></div>`,
    },
    { id: "assign", label: "On the figure", body: `<div class="assign" id="parts"></div>` },
    { id: "find", label: `<label for="combo-q">Find a combination</label>`, body: `<div id="picker"></div>` },
  ],
});

const canvas = document.getElementById("figure");
bindCopy(app);

function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}

/** Snap a requested garment mix to the closest photographed look (top 4, outer 3, bottoms 2). */
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

function partInfo(part) {
  return PARTS.find(([id]) => id === part);
}

function assignment() {
  const cols = rotateRoles(colors(), turn);
  const map = {};
  look.parts.forEach((part, i) => {
    const chosen = override[part];
    map[partInfo(part)[2]] = cols[chosen == null ? i % cols.length : chosen % cols.length];
  });
  return map;
}

function garmentName(part) {
  if (part === "top") return look.top;
  if (part === "outer") return look.outer;
  if (part === "bottoms") return look.bottoms;
  if (part === "accent") return "tie";
  return "shoes";
}

function describe() {
  const words = look.parts.map(garmentName);
  const text = words.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

async function showLook(next) {
  look = next;
  gender = next.gender;
  syncLookControls();
  if (frameKey !== next.id) {
    paint(false);
    const want = next.id;
    loading = want;
    const loaded = await withStage(() => loadFrame("assets/looks/" + next.photo, "assets/looks/" + next.mask));
    if (loading !== want) return;
    frame = loaded;
    frameKey = want;
    paint(false);
    return;
  }
  paint(true);
}

function paint(fade) {
  const map = assignment();
  const byRegion = {};
  for (const [region, color] of Object.entries(map)) byRegion[region] = color.hex;
  if (frame && frameKey === look.id) {
    const draw = () => paintFrame(frame, byRegion, canvas);
    if (fade) crossfade(canvas, draw);
    else draw();
  }
  canvas.setAttribute("aria-label", `${look.gender === "f" ? "Female" : "Male"} ${look.top} look in combination ${pad(comboNumber)}`);
  document.getElementById("status").innerHTML = `<b>No. ${pad(comboNumber)}</b> · ${describe()}`;
  renderPlate(document.getElementById("palette"), comboNumber, colors());
  renderAssign(document.getElementById("parts"), look.parts.map((part) => ({
    key: part,
    label: partInfo(part)[1],
    name: map[partInfo(part)[2]].name,
    hex: map[partInfo(part)[2]].hex,
  })), "data-part");
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    paint(true);
  });
}

function syncLookControls() {
  document.querySelectorAll("[data-gender]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.gender === gender));
  });
  renderBook();
}

function renderBook() {
  const book = document.getElementById("lookbook");
  if (book.dataset.gender !== gender) {
    book.dataset.gender = gender;
    book.innerHTML = catalog.filter((item) => item.gender === gender).map((item) => `
      <button type="button" data-look="${item.id}" aria-pressed="false" aria-label="${item.top}${item.outer === "none" ? "" : ", " + item.outer}, ${item.bottoms}">
        <img src="assets/looks/${item.thumb}" alt="" width="200" height="356" loading="lazy" decoding="async">
      </button>`).join("");
    document.getElementById("presets").innerHTML = PRESETS.map(([, label, slug]) => {
      const match = catalog.find((item) => item.id === `${gender}-${slug}`);
      return `<button type="button" data-preset="${match ? match.id : ""}" aria-pressed="false">${label}</button>`;
    }).join("");
  }
  book.querySelectorAll("[data-look]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.look === look.id));
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.preset === look.id));
  });
  const on = book.querySelector('[aria-pressed="true"]');
  if (on && book.scrollWidth > book.clientWidth) {
    book.scrollLeft = on.offsetLeft - book.clientWidth / 2 + on.offsetWidth / 2;
  }
}

function reset() {
  turn = 0;
  for (const key of Object.keys(override)) delete override[key];
}

function cycle(part) {
  const cols = colors();
  const current = override[part];
  const base = current == null ? look.parts.indexOf(part) + turn : current;
  override[part] = (Math.max(0, base) + 1) % cols.length;
  schedule();
}

canvas.addEventListener("click", (event) => {
  if (!frame) return;
  const region = regionAt(frame, canvas, event);
  const part = PARTS.find(([, , id]) => id === region);
  if (part && look.parts.includes(part[0])) cycle(part[0]);
});
app.addEventListener("click", (event) => {
  const genderButton = event.target.closest("[data-gender]");
  if (genderButton) {
    if (genderButton.dataset.gender === look.gender) return;
    reset();
    showLook(nearest(genderButton.dataset.gender, look.top, look.outer, look.bottoms));
    return;
  }
  const preset = event.target.closest("[data-preset]");
  const thumb = event.target.closest("[data-look]");
  const id = preset?.dataset.preset || thumb?.dataset.look;
  if (id) {
    reset();
    showLook(catalog.find((item) => item.id === id));
    return;
  }
  const part = event.target.closest("[data-part]");
  if (part) cycle(part.dataset.part);
});
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  for (const key of Object.keys(override)) delete override[key];
  schedule();
});

const picker = mountPicker(document.getElementById("picker"), combos, (combo) => {
  comboNumber = combo.number;
  writePlateHash(comboNumber, DEFAULT_PLATE);
  reset();
  schedule();
});
picker.select(comboNumber);
showLook(look);
