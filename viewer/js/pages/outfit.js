import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad } from "../data.js";
import { mountPicker } from "../picker.js";
import { renderFigure, PRESETS } from "../figure.js";

enhanceChrome();
const data = dataset();
const combos = data.combinations;
const index = byNumber(data);
const app = document.getElementById("app");

const state = {
  gender: "f",
  top: "shirt",
  outer: "blazer",
  bottoms: "trousers",
  accent: "tie",
  combo: 1,
  turn: 0,
  override: {},
};

app.innerHTML = `
  <p class="kicker">Outfit studio</p>
  <h1>Dress a plate</h1>
  <p class="lede muted">Pick one of the 348 combinations. The colors land on the clothes. Shuffle moves them. A garment only cycles through colors from that plate.</p>
  <div class="presets" role="group" aria-label="Preset looks" id="presets" style="margin: 14px 0 18px">
    ${PRESETS.map((preset) => `<button type="button" class="preset" data-preset="${preset.id}" aria-pressed="false">${preset.label}</button>`).join("")}
  </div>
  <div class="studio">
    <div class="stage" id="stage"></div>
    <div class="panel">
      <div class="seg" role="group" aria-label="Figure">
        <button type="button" data-gender="f" aria-pressed="true">Female</button>
        <button type="button" data-gender="m" aria-pressed="false">Male</button>
      </div>
      <div class="field"><label for="top">Top</label>
        <select id="top">${opt(["shirt", "Shirt"], ["polo", "Polo"], ["tee", "Tee"], ["knit", "Knit sweater"])}</select></div>
      <div class="field"><label for="outer">Outerwear</label>
        <select id="outer">${opt(["none", "None"], ["blazer", "Blazer"], ["jacket", "Jacket"])}</select></div>
      <div class="field"><label for="bottoms">Bottoms</label>
        <select id="bottoms">${opt(["trousers", "Trousers"], ["chinos", "Chinos"], ["jeans", "Jeans"])}</select></div>
      <div class="field"><label for="accent">Accent</label>
        <select id="accent">${opt(["none", "None"], ["tie", "Tie"], ["pocket", "Pocket square"])}</select></div>
      <button type="button" class="text-btn" id="shuffle">Shuffle colors</button>
      <div id="palette"></div>
      <div id="garments" class="surface-list"></div>
      <div id="picker"></div>
    </div>
  </div>
`;

function opt(...pairs) {
  return pairs.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

const stage = document.getElementById("stage");
const palette = document.getElementById("palette");
const garments = document.getElementById("garments");

function combo() {
  return index.get(state.combo);
}

function slots() {
  return combo().colors.map((slot) => ({ name: slot.name, hex: slot.display_hex, id: slot.id }));
}

function activeParts() {
  const parts = [
    ["top", "Top"],
    ["bottoms", "Bottoms"],
    ["shoes", "Shoes"],
  ];
  if (state.outer !== "none") parts.splice(1, 0, ["outer", "Outerwear"]);
  if (state.accent !== "none") parts.push(["accent", state.accent === "tie" ? "Tie" : "Pocket square"]);
  return parts;
}

function fills() {
  const colors = slots();
  const parts = activeParts().map(([id]) => id);
  const map = {};
  parts.forEach((part, i) => {
    const rotated = (i + state.turn) % colors.length;
    const choice = state.override[part];
    const indexIn = choice == null ? rotated : choice % colors.length;
    map[part] = colors[indexIn];
  });
  if (!map.outer) map.outer = map.top;
  if (!map.accent) map.accent = colors[colors.length - 1];
  if (!map.shoes) map.shoes = colors[colors.length - 1];
  return map;
}

function paint() {
  const map = fills();
  const hex = Object.fromEntries(Object.entries(map).map(([key, value]) => [key, value.hex]));
  stage.innerHTML = renderFigure(state, hex);
  const colors = slots();
  palette.innerHTML = `
    <h2>#${pad(state.combo)}</h2>
    <p class="hint">${esc(combo().colors.map((slot) => slot.name).join(" · "))}</p>
    <div class="swatch-list">
      ${colors.map((color) => `
        <div class="surface-btn" style="cursor:default">
          <i class="swatch-pip" style="background:${color.hex}"></i>
          <span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
          <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button>
        </div>`).join("")}
    </div>`;
  garments.innerHTML = activeParts().map(([id, label]) => `
    <button type="button" class="surface-btn" data-part="${id}">
      <i class="swatch-pip" style="background:${map[id].hex}"></i>
      <span>${label}<br><span class="muted">${esc(map[id].name)}</span></span>
    </button>`).join("");
  document.querySelectorAll("[data-gender]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.gender === state.gender));
  });
  for (const key of ["top", "outer", "bottoms", "accent"]) {
    document.getElementById(key).value = state[key];
  }
}

function cycle(part) {
  const colors = slots();
  const current = state.override[part];
  const base = current == null ? (activeParts().findIndex(([id]) => id === part) + state.turn) % colors.length : current;
  state.override[part] = (base + 1) % colors.length;
  paint();
}

stage.addEventListener("click", (event) => {
  const part = event.target.closest("[data-part]");
  if (part) cycle(part.dataset.part);
});
garments.addEventListener("click", (event) => {
  const part = event.target.closest("[data-part]");
  if (part) cycle(part.dataset.part);
});
app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) copyText(dot.dataset.hex);
  const gender = event.target.closest("[data-gender]");
  if (gender) {
    state.gender = gender.dataset.gender;
    paint();
  }
  const preset = event.target.closest("[data-preset]");
  if (preset) applyPreset(preset.dataset.preset);
});
document.getElementById("shuffle").addEventListener("click", () => {
  state.turn = (state.turn + 1) % slots().length;
  state.override = {};
  paint();
});
for (const key of ["top", "outer", "bottoms", "accent"]) {
  document.getElementById(key).addEventListener("change", (event) => {
    state[key] = event.target.value;
    paint();
  });
}

const picker = mountPicker(document.getElementById("picker"), combos, (next) => {
  state.combo = next.number;
  state.turn = 0;
  state.override = {};
  paint();
});

function applyPreset(id) {
  const preset = PRESETS.find((item) => item.id === id);
  state.gender = preset.gender;
  state.top = preset.top;
  state.outer = preset.outer;
  state.bottoms = preset.bottoms;
  state.accent = preset.accent;
  state.combo = preset.combo;
  state.turn = 0;
  state.override = {};
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.preset === id));
  });
  picker.select(preset.combo);
  paint();
}

picker.select(1);
paint();
