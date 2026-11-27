// Room and facade: one photographed scene, surfaces recolored by role.
import { enhanceChrome } from "./chrome.js";
import { dataset, byNumber, esc, pad, shuffledRoles } from "./data.js";
import { mountPicker } from "./picker.js";
import { loadFrame, paintFrame, regionAt } from "./recolor.js";
import { studioShell, photoStage, withStage, crossfade, renderPlate, renderAssign, bindCopy, plateFromHash, writePlateHash, fatal } from "./studio.js";

/**
 * options: { pick(catalog) -> scenes[], defaultPlate, kicker, title, lede(scene), label, tip, caption(scene), tabs, translucent }
 */
export async function mountScenes(options) {
  enhanceChrome();
  const app = document.getElementById("app");
  let scenes;
  let data;
  try {
    data = dataset();
    const catalog = await fetch("assets/rooms/catalog.json").then((response) => {
      if (!response.ok) throw new Error("The scene catalog did not load.");
      return response.json();
    });
    scenes = options.pick(catalog);
  } catch (err) {
    fatal(app, err);
    throw err;
  }
  const index = byNumber(data);
  let scene = scenes[0];
  let comboNumber = plateFromHash(options.defaultPlate, (n) => index.has(n));
  let turn = 0;
  const override = {};
  let frame = null;
  let frameKey = "";
  let loading = "";

  const tabs = options.tabs ? `
    <div class="scenes" role="tablist" aria-label="Rooms" id="tabs">
      ${scenes.map((item, i) => `<button type="button" role="tab" id="tab-${item.id}" aria-controls="stage" data-scene="${item.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(item.label)}</button>`).join("")}
    </div>` : "";

  app.innerHTML = studioShell({
    kicker: options.kicker,
    title: options.title,
    lede: options.lede(scene),
    before: tabs,
    stage: photoStage({ id: "view", shape: "wide", label: options.label, tip: options.tip }),
    groups: [
      {
        id: "plate",
        label: "Plate",
        action: `<button type="button" class="link-btn" id="shuffle">Shuffle roles</button>`,
        body: `<div id="palette"></div>`,
      },
      { id: "assign", label: "Surfaces", body: `<div class="assign" id="surfaces"></div>` },
      { id: "find", label: `<label for="combo-q">Find a combination</label>`, body: `<div id="picker"></div>` },
    ],
  });
  if (options.tabs) {
    const stage = document.getElementById("stage");
    stage.setAttribute("role", "tabpanel");
    stage.setAttribute("aria-labelledby", "tab-" + scene.id);
  }
  const canvas = document.getElementById("view");
  bindCopy(app);

  function colors() {
    return index.get(comboNumber).colors.map((slot) => ({ name: slot.name, hex: slot.display_hex }));
  }
  function key(id) {
    return scene.id + ":" + id;
  }
  function assignment() {
    const roles = shuffledRoles(colors(), turn);
    const map = {};
    for (const surface of scene.surfaces) {
      const chosen = override[key(surface.id)];
      map[surface.index] = chosen == null ? roles[surface.role] || roles.secondary : colors()[chosen % colors().length];
    }
    return map;
  }

  function paint(fade) {
    const map = assignment();
    if (frame && frameKey === scene.id) {
      const byRegion = {};
      for (const [region, color] of Object.entries(map)) byRegion[region] = color.hex;
      const translucent = new Set(scene.surfaces.filter((item) => item.translucent).map((item) => item.index));
      const draw = () => paintFrame(frame, byRegion, canvas, { translucent, texture: true });
      if (fade) crossfade(canvas, draw);
      else draw();
    }
    canvas.setAttribute("aria-label", `${options.label}: ${scene.label}, combination ${pad(comboNumber)}`);
    document.getElementById("status").innerHTML = `<b>No. ${pad(comboNumber)}</b> · ${esc(options.caption(scene))}`;
    renderPlate(document.getElementById("palette"), comboNumber, colors());
    renderAssign(document.getElementById("surfaces"), scene.surfaces.map((surface) => ({
      key: surface.id,
      label: surface.label,
      name: map[surface.index].name,
      hex: map[surface.index].hex,
    })), "data-surface");
  }

  async function show(next) {
    scene = next;
    document.getElementById("lede").textContent = options.lede(scene);
    document.querySelectorAll("[data-scene]").forEach((tab) => {
      const on = tab.dataset.scene === scene.id;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    document.getElementById("stage").setAttribute("aria-labelledby", "tab-" + scene.id);
    paint(false);
    if (frameKey === scene.id) return;
    loading = scene.id;
    const loaded = await withStage(() => loadFrame("assets/rooms/" + next.photo, "assets/rooms/" + next.mask));
    if (loading !== next.id) return;
    frame = loaded;
    frameKey = next.id;
    paint(false);
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

  function cycle(id) {
    const surface = scene.surfaces.find((item) => item.id === id);
    if (!surface) return;
    const current = override[key(id)];
    const base = current == null ? colors().findIndex((color) => color.hex === assignment()[surface.index].hex) : current;
    override[key(id)] = (Math.max(0, base) + 1) % colors().length;
    schedule();
  }

  canvas.addEventListener("click", (event) => {
    if (!frame) return;
    const region = regionAt(frame, canvas, event);
    const surface = scene.surfaces.find((item) => item.index === region);
    if (surface) cycle(surface.id);
  });
  app.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-scene]");
    if (tab) {
      show(scenes.find((item) => item.id === tab.dataset.scene));
      return;
    }
    const surface = event.target.closest("[data-surface]");
    if (surface) cycle(surface.dataset.surface);
  });
  document.getElementById("tabs")?.addEventListener("keydown", (event) => {
    const all = [...document.querySelectorAll("[data-scene]")];
    const at = all.indexOf(document.activeElement);
    let next = null;
    if (event.key === "ArrowRight") next = all[(at + 1) % all.length];
    else if (event.key === "ArrowLeft") next = all[(at - 1 + all.length) % all.length];
    else if (event.key === "Home") next = all[0];
    else if (event.key === "End") next = all[all.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    next.scrollIntoView({ block: "nearest", inline: "nearest" });
    show(scenes.find((item) => item.id === next.dataset.scene));
  });
  document.getElementById("shuffle").addEventListener("click", () => {
    turn = (turn + 1) % colors().length;
    for (const k of Object.keys(override)) {
      if (k.startsWith(scene.id + ":")) delete override[k];
    }
    schedule();
  });
  const picker = mountPicker(document.getElementById("picker"), data.combinations, (combo) => {
    comboNumber = combo.number;
    writePlateHash(comboNumber, options.defaultPlate);
    turn = 0;
    for (const k of Object.keys(override)) delete override[k];
    schedule();
  });
  picker.select(comboNumber);
  show(scene);
}
