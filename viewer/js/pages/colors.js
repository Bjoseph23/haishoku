import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, esc, inkFor } from "../data.js";

enhanceChrome();
const { colors } = dataset();
const app = document.getElementById("app");
app.innerHTML = `
  <p class="kicker">159 named colors</p>
  <h1>Colors</h1>
  <p class="lede muted">Reference order from the back of the book. Hex codes are the white-balanced screen colors. Open a name to see every plate that uses it.</p>
  <div class="toolbar" style="margin: 18px 0">
    <input id="q" type="search" placeholder="Search a color" aria-label="Search colors">
  </div>
  <p class="muted" id="count"></p>
  <div class="colors" id="grid"></div>
`;
const grid = document.getElementById("grid");
const count = document.getElementById("count");
const search = document.getElementById("q");

function render() {
  const q = search.value.trim().toLowerCase();
  const frag = document.createDocumentFragment();
  let shown = 0;
  for (const color of colors) {
    if (q && !`${color.name} ${color.display_hex}`.toLowerCase().includes(q)) continue;
    shown += 1;
    const ink = inkFor(color.display_hex);
    const card = document.createElement("article");
    card.className = "color-card";
    card.innerHTML = `
      <div class="swatch-block" style="background:${color.display_hex}">
        <div class="chip-meta" style="background:${color.display_hex};color:${ink}">
          <span class="chip-hex">${color.display_hex}</span>
          <button type="button" class="dot" data-hex="${color.display_hex}" aria-label="Copy ${color.display_hex}" style="color:${ink}">${copyIcon()}</button>
        </div>
      </div>
      <a class="name-btn" href="index.html#color=${color.id}"><b>${color.id}. ${esc(color.name)}</b></a>
      <p>C${color.c} M${color.m} Y${color.y} K${color.k}<br>${color.appears_in.length} plates</p>`;
    frag.appendChild(card);
  }
  grid.replaceChildren(frag);
  count.textContent = `${shown} colors`;
}
grid.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (!dot) return;
  event.preventDefault();
  event.stopPropagation();
  copyText(dot.dataset.hex);
});
search.addEventListener("input", render);
render();
