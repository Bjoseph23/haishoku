// Shared layout and behavior for the four studios: one stage, one legend.
import { copyText, copyIcon } from "./chrome.js";
import { esc, pad } from "./data.js";

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Page head, a stage (figure) and a panel of labeled groups. */
export function studioShell({ kicker, title, lede, before = "", stage, groups }) {
  return `
  <header class="studio-head">
    <p class="kicker">${kicker}</p>
    <h1>${title}</h1>
    <p class="lede" id="lede">${lede}</p>
  </header>
  ${before}
  <div class="studio">
    ${stage}
    <div class="panel">
      ${groups.map((group) => `
      <section class="group" aria-labelledby="g-${group.id}">
        <div class="group-head">
          <h2 class="group-label" id="g-${group.id}">${group.label}</h2>
          ${group.action || ""}
        </div>
        ${group.body}
      </section>`).join("")}
    </div>
  </div>`;
}

/** A photographic stage with a loading skeleton, an error slot, and a caption. */
export function photoStage({ id, shape, label, tip }) {
  return `
    <div class="stage stage-${shape}" id="stage" aria-busy="true">
      <div class="stage-frame">
        <canvas id="${id}" aria-label="${label}"></canvas>
        <div class="stage-state" id="stage-state" role="status">Loading photograph…</div>
      </div>
      <p class="stage-cap"><span id="status">&nbsp;</span><span class="tip">${tip}</span></p>
    </div>`;
}

/** Run a photo load with a calm skeleton and a retry on failure. */
export async function withStage(load) {
  const stage = document.getElementById("stage");
  const state = document.getElementById("stage-state");
  stage.classList.remove("failed");
  stage.setAttribute("aria-busy", "true");
  state.textContent = "Loading photograph…";
  try {
    const result = await load();
    stage.setAttribute("aria-busy", "false");
    return result;
  } catch (err) {
    stage.setAttribute("aria-busy", "false");
    stage.classList.add("failed");
    state.innerHTML = `<div><p>The photograph did not load. Check the connection and try again.</p><button type="button" class="btn" id="stage-retry">Try again</button></div>`;
    return new Promise((resolve) => {
      document.getElementById("stage-retry").addEventListener("click", () => resolve(withStage(load)), { once: true });
    });
  }
}

/** Repaint a canvas, dissolving the previous picture over it. */
export function crossfade(canvas, paint) {
  const frame = canvas.parentElement;
  if (calm() || !canvas.width || canvas.width === 300) {
    paint();
    return;
  }
  let ghost = frame.querySelector(".stage-ghost");
  if (!ghost) {
    ghost = document.createElement("canvas");
    ghost.className = "stage-ghost";
    ghost.setAttribute("aria-hidden", "true");
    frame.appendChild(ghost);
  }
  ghost.width = canvas.width;
  ghost.height = canvas.height;
  ghost.getContext("2d").drawImage(canvas, 0, 0);
  Object.assign(ghost.style, {
    left: canvas.offsetLeft + "px",
    top: canvas.offsetTop + "px",
    width: canvas.offsetWidth + "px",
    height: canvas.offsetHeight + "px",
    transition: "none",
    opacity: "1",
  });
  paint();
  requestAnimationFrame(() => {
    ghost.style.transition = "";
    ghost.style.opacity = "0";
  });
}

/** The plate in play: number, equal chips, one round copy button each. */
export function renderPlate(host, number, colors) {
  if (host.dataset.n === String(number)) return;
  const first = !host.dataset.n;
  host.dataset.n = String(number);
  host.innerHTML = `
    <p class="plate-no">No. ${pad(number)}<small>${colors.length} colors</small></p>
    <div class="spec${first ? "" : " fresh"}" style="--n:${colors.length}">${colors.map((color) => `
      <div class="spec-chip">
        <div class="spec-fill" style="background:${color.hex}"></div>
        <div class="spec-meta">
          <span class="spec-name">${esc(color.name)}</span>
          <span class="spec-hex">${color.hex}</span>
          <button type="button" class="dot" data-hex="${color.hex}" aria-label="Copy ${esc(color.name)} ${color.hex}">${copyIcon()}</button>
        </div>
      </div>`).join("")}
    </div>
    <p class="copy-slot" id="copy-slot" aria-hidden="true"></p>`;
}

/** Assignment buttons. Rebuilt when the set changes, recolored in place otherwise. */
export function renderAssign(host, items, attr) {
  const keys = items.map((item) => item.key).join("|");
  if (host.dataset.keys !== keys) {
    host.dataset.keys = keys;
    host.innerHTML = items.map((item) => `
      <button type="button" class="surface-btn" ${attr}="${item.key}">
        <i class="swatch-pip"></i>
        <span>${esc(item.label)}<small></small></span>
        <span class="cyc" aria-hidden="true">↻</span><span class="sr">, next color</span>
      </button>`).join("");
  }
  items.forEach((item, i) => {
    const button = host.children[i];
    button.querySelector(".swatch-pip").style.backgroundColor = item.hex;
    button.querySelector("small").textContent = item.name;
  });
}

/** Round copy buttons in the studio panel. */
export function bindCopy(root) {
  root.addEventListener("click", (event) => {
    const dot = event.target.closest(".dot");
    if (!dot) return;
    copyText(dot.dataset.hex, dot);
    const slot = document.getElementById("copy-slot");
    if (slot) {
      slot.textContent = "Copied " + dot.dataset.hex;
      clearTimeout(slot._t);
      slot._t = setTimeout(() => { slot.textContent = ""; }, 2400);
    }
  });
}

/** Optional #plate=176 on any studio. Old URLs keep their defaults. */
export function plateFromHash(fallback, exists) {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get("plate"));
  return exists(n) ? n : fallback;
}
export function writePlateHash(n, fallback) {
  const url = n === fallback ? location.pathname + location.search : "#plate=" + n;
  history.replaceState(null, "", url);
}

/** If the catalog or the dataset failed, say so instead of a blank page. */
export function fatal(app, err) {
  app.innerHTML = `<header class="studio-head"><p class="kicker">Studio</p><h1>This studio did not load</h1>
    <p class="lede">${esc(err.message || err)} Serve the repository over http (for example <code>python3 -m http.server</code>) and open <code>viewer/</code>; a file:// page cannot load it.</p>
    <p><button type="button" class="btn" onclick="location.reload()">Try again</button></p></header>`;
}
