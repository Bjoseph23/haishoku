import { esc, pad } from "./data.js";

const PAGE = 40;

/**
 * Combination picker shared by the studios.
 * Search by name, number, or hex; filter by size; Random; a listbox you can arrow through.
 * Arrow keys move and select (the stage follows), Home/End jump, Enter or Space selects.
 */
export function mountPicker(host, combos, onPick) {
  host.innerHTML = `
    <div class="picker">
      <input id="combo-q" type="search" placeholder="Name, number, or hex" autocomplete="off" aria-controls="combo-results" aria-describedby="combo-help">
      <div class="picker-tools">
        <div class="seg" role="group" aria-label="Combination size">
          <button type="button" data-size="0" aria-pressed="true">All</button>
          <button type="button" data-size="2" aria-pressed="false">2</button>
          <button type="button" data-size="3" aria-pressed="false">3</button>
          <button type="button" data-size="4" aria-pressed="false">4</button>
        </div>
        <button type="button" class="link-btn" id="combo-random">Random plate</button>
      </div>
      <p class="sr" id="combo-help">Press the down arrow to move into the list.</p>
      <div class="pick-results" id="combo-results" role="listbox" aria-label="Matching combinations"></div>
      <div class="pick-more" id="combo-more"></div>
    </div>
  `;
  const input = host.querySelector("#combo-q");
  const results = host.querySelector("#combo-results");
  const more = host.querySelector("#combo-more");
  let size = 0;
  let current = null;
  let limit = PAGE;

  function matches(combo, query) {
    if (size && combo.size !== size) return false;
    if (!query) return true;
    const hay = [
      pad(combo.number),
      String(combo.number),
      ...combo.colors.flatMap((slot) => [slot.name, slot.display_hex]),
    ].join(" ").toLowerCase();
    return hay.includes(query);
  }

  function found() {
    const query = input.value.trim().toLowerCase();
    return combos.filter((combo) => matches(combo, query));
  }

  function rows() {
    return [...results.querySelectorAll(".pick-row")];
  }

  function paint() {
    const list = found();
    const at = list.findIndex((combo) => combo.number === current);
    if (at >= limit) limit = Math.ceil((at + 1) / PAGE) * PAGE;
    const shown = list.slice(0, limit);
    results.innerHTML = shown.map((combo) => `
      <div class="pick-row" role="option" tabindex="-1" id="opt-${combo.number}" data-n="${combo.number}" aria-selected="${combo.number === current}"
        aria-label="Combination ${pad(combo.number)}: ${esc(combo.colors.map((slot) => slot.name).join(", "))}">
        <b>${pad(combo.number)}</b>
        <span class="mini" aria-hidden="true">${combo.colors.map((slot) => `<i style="background:${slot.display_hex}"></i>`).join("")}</span>
      </div>
    `).join("") || `<p class="hint">No combination matches.</p>`;
    more.innerHTML = list.length > shown.length
      ? `<span class="hint">Showing ${shown.length} of ${list.length}. Keep typing to narrow.</span><button type="button" class="link-btn" id="combo-next">Show ${Math.min(PAGE, list.length - shown.length)} more</button>`
      : "";
    roving();
  }

  function roving(focusRow) {
    const all = rows();
    const target = focusRow || all.find((row) => row.getAttribute("aria-selected") === "true") || all[0];
    all.forEach((row) => row.setAttribute("tabindex", row === target ? "0" : "-1"));
    return target;
  }

  function reveal(row) {
    if (!row) return;
    const top = row.offsetTop - results.offsetTop;
    if (top < results.scrollTop) results.scrollTop = top;
    else if (top + row.offsetHeight > results.scrollTop + results.clientHeight) {
      results.scrollTop = top + row.offsetHeight - results.clientHeight;
    }
  }

  function choose(number, { focus = false, quiet = false } = {}) {
    const combo = combos.find((item) => item.number === number);
    if (!combo) return;
    current = number;
    let row = results.querySelector(`[data-n="${number}"]`);
    if (!row) {
      paint();
      row = results.querySelector(`[data-n="${number}"]`);
    }
    rows().forEach((item) => item.setAttribute("aria-selected", String(item === row)));
    roving(row);
    reveal(row);
    if (focus && row) row.focus({ preventScroll: true });
    if (!quiet) onPick(combo);
  }

  host.addEventListener("click", (event) => {
    const sizeButton = event.target.closest("[data-size]");
    if (sizeButton) {
      size = Number(sizeButton.dataset.size);
      limit = PAGE;
      host.querySelectorAll("[data-size]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button === sizeButton));
      });
      paint();
      return;
    }
    const row = event.target.closest(".pick-row");
    if (row) {
      choose(Number(row.dataset.n), { focus: true });
      return;
    }
    if (event.target.id === "combo-next") {
      limit += PAGE;
      const keep = results.scrollTop;
      paint();
      results.scrollTop = keep;
      return;
    }
    if (event.target.id === "combo-random") {
      const list = found();
      const pool = list.length ? list : combos;
      const combo = pool[Math.floor(Math.random() * pool.length)];
      choose(combo.number);
    }
  });

  results.addEventListener("keydown", (event) => {
    const all = rows();
    if (!all.length) return;
    const at = all.indexOf(document.activeElement);
    let next = null;
    if (event.key === "ArrowDown") next = all[Math.min(all.length - 1, at + 1)];
    else if (event.key === "ArrowUp") {
      if (at <= 0) {
        event.preventDefault();
        input.focus();
        return;
      }
      next = all[at - 1];
    } else if (event.key === "Home") next = all[0];
    else if (event.key === "End") next = all[all.length - 1];
    else if (event.key === "Enter" || event.key === " ") next = all[Math.max(0, at)];
    if (!next) return;
    event.preventDefault();
    choose(Number(next.dataset.n), { focus: true });
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown") return;
    const row = roving();
    if (!row) return;
    event.preventDefault();
    reveal(row);
    row.focus({ preventScroll: true });
  });
  input.addEventListener("input", () => {
    limit = PAGE;
    paint();
    results.scrollTop = 0;
  });

  return {
    select(number) {
      current = number;
      paint();
      const row = results.querySelector(`[data-n="${number}"]`);
      if (row) results.scrollTop = row.offsetTop - results.offsetTop - (results.clientHeight - row.offsetHeight) / 2;
    },
    random() {
      host.querySelector("#combo-random").click();
    },
  };
}
