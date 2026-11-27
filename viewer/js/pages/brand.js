import { enhanceChrome, copyText, copyIcon } from "../chrome.js";
import { dataset, byNumber, esc, pad, inkFor, roleColors, rotateRoles } from "../data.js";
import { mountPicker } from "../picker.js";

enhanceChrome();
const index = byNumber(dataset());
const app = document.getElementById("app");
let comboNumber = 1;
let turn = 0;

app.innerHTML = `
  <p class="kicker">Brand, web, and print</p>
  <h1>A plate, three jobs</h1>
  <p class="lede muted">The same combination colors a wordmark, a short page, and a poster. Type is set in a neutral ink so it stays readable. These plates are not a claim that the pair meets a contrast standard. Check the pair you actually ship.</p>
  <div class="studio" style="margin-top:16px">
    <div>
      <div class="stage" id="mock"></div>
      <div class="stage" id="poster" style="margin-top:12px"></div>
    </div>
    <div class="panel">
      <button type="button" class="text-btn" id="shuffle">Shuffle roles</button>
      <div id="palette"></div>
      <div id="picker"></div>
    </div>
  </div>
`;

function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}
function paint() {
  const roles = roleColors(rotateRoles(colors(), turn));
  const ground = roles.dominant.hex;
  const band = roles.secondary.hex;
  const mark = roles.accent.hex;
  const ink = inkFor(ground);
  const bandInk = inkFor(band);
  const markInk = inkFor(mark);
  document.getElementById("mock").innerHTML = `
    <div class="mock-site" aria-label="Sample website colored with combination ${pad(comboNumber)}">
      <div class="mock-bar" style="background:${ground};color:${ink}">
        <strong>Atelier ${pad(comboNumber)}</strong>
        <span>Journal</span>
      </div>
      <div class="mock-hero" style="background:${band};color:${bandInk}">
        <p class="kicker" style="color:${bandInk}">Combination ${pad(comboNumber)}</p>
        <h3>${esc(roles.secondary.name)}</h3>
        <p>A quiet ground, one supporting field, and a single mark.</p>
        <button type="button" style="background:${mark};color:${markInk}">${esc(roles.accent.name)}</button>
      </div>
      <div class="mock-foot" style="background:${ground};color:${ink}">${esc(colors().map((color) => color.name).join(" · "))}</div>
    </div>`;
  const bars = colors().map((color) => `<span style="background:${color.hex}"></span>`).join("");
  document.getElementById("poster").innerHTML = `
    <div class="poster" aria-label="Sample poster">
      <div class="poster-copy" style="background:${ground};color:${ink}">
        <p class="kicker" style="color:${ink}">Print</p>
        <div>
          <h2 style="margin:0">#${pad(comboNumber)}</h2>
          <p>${esc(colors().map((color) => color.name).join(" · "))}</p>
        </div>
        <p class="muted">Equal bars, as in the book. The page above gives them unequal jobs.</p>
      </div>
      <div class="poster-bars">${bars}</div>
    </div>`;
  document.getElementById("palette").innerHTML = `<h2>#${pad(comboNumber)}</h2><div class="swatch-list">${colors().map((color) => `
    <div class="surface-btn" style="cursor:default"><i class="swatch-pip" style="background:${color.hex}"></i><span>${esc(color.name)}<br><span class="muted">${color.hex}</span></span>
    <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${color.hex}" style="margin-left:auto">${copyIcon()}</button></div>`).join("")}</div>`;
}
app.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot");
  if (dot) copyText(dot.dataset.hex);
});
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  paint();
});
const picker = mountPicker(document.getElementById("picker"), dataset().combinations, (combo) => {
  comboNumber = combo.number;
  turn = 0;
  paint();
});
picker.select(1);
paint();
