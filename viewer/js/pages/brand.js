import { enhanceChrome } from "../chrome.js";
import { dataset, byNumber, esc, pad, inkFor, shuffledRoles } from "../data.js";
import { mountPicker } from "../picker.js";
import { studioShell, renderPlate, bindCopy, plateFromHash, writePlateHash, fatal } from "../studio.js";

enhanceChrome();
const app = document.getElementById("app");
let data;
try {
  data = dataset();
} catch (err) {
  fatal(app, err);
  throw err;
}
const index = byNumber(data);
const DEFAULT_PLATE = 1;
let comboNumber = plateFromHash(DEFAULT_PLATE, (n) => index.has(n));
let turn = 0;

app.innerHTML = studioShell({
  kicker: "Brand, web, and print",
  title: "A plate, three jobs",
  lede: "The same combination colors a wordmark, a short page, and a poster. Type is set in a neutral ink so it stays readable.",
  stage: `
    <div class="stage specimens">
      <figure class="specimen">
        <div id="mock"></div>
        <figcaption><b>Fig. 1</b> · A short page. The lightest color is the ground, the next a band, the darkest a single mark.</figcaption>
      </figure>
      <figure class="specimen">
        <div id="poster"></div>
        <figcaption><b>Fig. 2</b> · A poster. Equal bars, as in the book. The page above gives them unequal jobs.</figcaption>
      </figure>
    </div>`,
  groups: [
    {
      id: "plate",
      label: "Plate",
      action: `<button type="button" class="link-btn" id="shuffle">Shuffle roles</button>`,
      body: `<div id="palette"></div>
        <p class="warn">A plate in the book is not a claim that the pair meets a contrast standard. Check the pair you actually ship before you set small text.</p>`,
    },
    { id: "find", label: `<label for="combo-q">Find a combination</label>`, body: `<div id="picker"></div>` },
  ],
});
bindCopy(app);

function colors() {
  return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
}
function paint() {
  const roles = shuffledRoles(colors(), turn);
  const ground = roles.dominant.hex;
  const band = roles.secondary.hex;
  const mark = roles.accent.hex;
  const ink = inkFor(ground);
  const bandInk = inkFor(band);
  const button = mark === band ? ground : mark; // a two-color plate has no third color for the mark
  const markInk = inkFor(button);
  const names = esc(colors().map((color) => color.name).join(" · "));
  document.getElementById("mock").innerHTML = `
    <div class="mock-site" role="img" aria-label="Sample website colored with combination ${pad(comboNumber)}">
      <div class="mock-bar" style="background:${ground};color:${ink}">
        <strong>Atelier ${pad(comboNumber)}</strong>
        <nav><span>Journal</span><span>Studio</span><span>Contact</span></nav>
      </div>
      <div class="mock-hero" style="background:${band};color:${bandInk}">
        <p class="kicker" style="color:${bandInk}">Combination ${pad(comboNumber)}</p>
        <p class="mock-title">${esc(roles.secondary.name)}</p>
        <p>A quiet ground, one supporting field, and a single mark.</p>
        <span class="mock-cta" style="background:${button};color:${markInk}">${esc(mark === band ? roles.dominant.name : roles.accent.name)}</span>
      </div>
      <div class="mock-foot" style="background:${ground};color:${ink}">${names}</div>
    </div>`;
  const bars = colors().map((color) => `<span style="background:${color.hex}"></span>`).join("");
  document.getElementById("poster").innerHTML = `
    <div class="poster" role="img" aria-label="Sample poster with combination ${pad(comboNumber)}">
      <div class="poster-copy" style="background:${ground};color:${ink}">
        <p class="kicker">Haishoku · Print</p>
        <div>
          <p class="num">${pad(comboNumber)}</p>
          <p>${names}</p>
        </div>
        <p class="foot">After Sanzo Wada, 1933</p>
      </div>
      <div class="poster-bars">${bars}</div>
    </div>`;
  renderPlate(document.getElementById("palette"), comboNumber, colors());
}
document.getElementById("shuffle").addEventListener("click", () => {
  turn = (turn + 1) % colors().length;
  paint();
});
const picker = mountPicker(document.getElementById("picker"), data.combinations, (combo) => {
  comboNumber = combo.number;
  writePlateHash(comboNumber, DEFAULT_PLATE);
  turn = 0;
  paint();
});
picker.select(comboNumber);
paint();
