import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, esc, pad, inkFor, hexOf } from "../data.js";

enhanceChrome();
const data = dataset();
const app = document.getElementById("app");
const params = new URLSearchParams(location.hash.replace(/^#/, ""));
let size = [0, 2, 3, 4].includes(Number(params.get("size"))) ? Number(params.get("size")) : 0;
let mode = params.get("mode") === "cmyk" ? "hex_cmyk" : "display_hex";
let query = params.get("q") || "";
let picked = Number(params.get("color")) || 0;
const colorsById = new Map(data.colors.map((color) => [color.id, color]));
if (!colorsById.has(picked)) picked = 0;

app.innerHTML = `
  <p class="kicker">348 plates</p>
  <h1>Palettes</h1>
  <p class="lede muted">Every combination from Sanzo Wada’s dictionary. The chip button copies one hex. The caption copies the whole plate. Choose a color underneath to see only the plates that use it.</p>
  <div class="toolbar" style="margin: 18px 0">
    <input id="q" type="search" placeholder="Search name, hex, or number" value="${esc(query)}" aria-label="Search combinations" size="28">
    <div class="filters" role="group" aria-label="Size">
      ${[0, 2, 3, 4].map((n) => `<button type="button" data-size="${n}" aria-pressed="${n === size}">${n ? n + " colors" : "All"}</button>`).join("")}
    </div>
    <div class="filters" role="group" aria-label="Color source">
      <button type="button" data-mode="display_hex" aria-pressed="${mode === "display_hex"}">Book colors</button>
      <button type="button" data-mode="hex_cmyk" aria-pressed="${mode === "hex_cmyk"}">CMYK colors</button>
    </div>
  </div>
  <h2>Combinations <span class="muted" id="count"></span></h2>
  <div class="plates" id="plates"></div>
  <h2>All 159 colors <span class="muted" id="ccount"></span></h2>
  <div class="colors" id="colors"></div>
`;

const plates = document.getElementById("plates");
const colorGrid = document.getElementById("colors");
const count = document.getElementById("count");
const ccount = document.getElementById("ccount");
const search = document.getElementById("q");

function writeHash() {
  const next = new URLSearchParams();
  if (size) next.set("size", String(size));
  if (mode === "hex_cmyk") next.set("mode", "cmyk");
  if (search.value) next.set("q", search.value);
  if (picked) next.set("color", String(picked));
  const hash = next.toString();
  history.replaceState(null, "", hash ? "#" + hash : location.pathname);
}

function chip(slot) {
  const hex = hexOf(slot, mode);
  const ink = inkFor(hex);
  return `<div class="chip">
    <div class="chip-fill" style="background:${hex}"></div>
    <div class="chip-meta" style="background:${hex};color:${ink}">
      <span class="chip-hex">${hex}</span>
      <button type="button" class="dot" data-hex="${hex}" aria-label="Copy ${hex}" style="color:${ink}">${copyIcon()}</button>
    </div>
  </div>`;
}

function renderPlates() {
  const q = search.value.trim().toLowerCase();
  const frag = document.createDocumentFragment();
  let shown = 0;
  for (const combo of data.combinations) {
    if (size && combo.size !== size) continue;
    if (picked && !combo.colors.some((slot) => slot.id === picked)) continue;
    const names = combo.colors.map((slot) => slot.name).join(" · ");
    const hay = [pad(combo.number), combo.number, names, ...combo.colors.map((slot) => hexOf(slot, mode))].join(" ").toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown += 1;
    const all = combo.colors.map((slot) => hexOf(slot, mode)).join(", ");
    const article = document.createElement("article");
    article.className = "plate";
    article.innerHTML = `
      <div class="swatches">${combo.colors.map(chip).join("")}</div>
      <button type="button" class="plate-copy" data-all="${esc(all)}">
        <b>#${pad(combo.number)}</b> · ${combo.size} colors<br>
        <span class="muted">${esc(names)}</span>
      </button>`;
    frag.appendChild(article);
  }
  plates.replaceChildren(frag);
  const who = picked ? ` with ${colorsById.get(picked).name}. Choose it again to clear.` : "";
  count.textContent = `${shown} shown${who}`;
}

function renderColors() {
  const q = search.value.trim().toLowerCase();
  const frag = document.createDocumentFragment();
  let shown = 0;
  for (const color of data.colors) {
    const hex = mode === "hex_cmyk" ? color.hex_cmyk : color.display_hex;
    if (q && !`${color.name} ${hex}`.toLowerCase().includes(q)) continue;
    shown += 1;
    const ink = inkFor(hex);
    const card = document.createElement("article");
    card.className = "color-card" + (picked === color.id ? " sel" : "");
    card.innerHTML = `
      <div class="swatch-block" style="background:${hex}">
        <div class="chip-meta" style="background:${hex};color:${ink}">
          <span class="chip-hex">${hex}</span>
          <button type="button" class="dot" data-hex="${hex}" aria-label="Copy ${hex}" style="color:${ink}">${copyIcon()}</button>
        </div>
      </div>
      <button type="button" class="name-btn" data-id="${color.id}"><b>${color.id}. ${esc(color.name)}</b></button>
      <p>C${color.c} M${color.m} Y${color.y} K${color.k}<br>in ${color.appears_in.length} plates</p>`;
    frag.appendChild(card);
  }
  colorGrid.replaceChildren(frag);
  ccount.textContent = `${shown} shown`;
}

function render() {
  renderPlates();
  renderColors();
  writeHash();
}

app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) {
    event.stopPropagation();
    copyText(dot.dataset.hex);
    return;
  }
  const swatches = event.target.closest(".swatches");
  if (swatches) {
    copyText(swatches.parentElement.querySelector(".plate-copy").dataset.all);
    return;
  }
  const plate = event.target.closest(".plate-copy");
  if (plate) {
    copyText(plate.dataset.all);
    return;
  }
  const name = event.target.closest(".name-btn");
  if (name) {
    const id = Number(name.dataset.id);
    picked = picked === id ? 0 : id;
    render();
    if (picked) window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    return;
  }
  const sizeButton = event.target.closest("[data-size]");
  if (sizeButton) {
    size = Number(sizeButton.dataset.size);
    app.querySelectorAll("[data-size]").forEach((button) => button.setAttribute("aria-pressed", String(button === sizeButton)));
    render();
    return;
  }
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    mode = modeButton.dataset.mode;
    app.querySelectorAll("[data-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button === modeButton)));
    render();
  }
});
search.addEventListener("input", () => {
  query = search.value;
  render();
});
render();
