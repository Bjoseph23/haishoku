import { esc, pad } from "./data.js";

export function mountPicker(host, combos, onPick) {
  host.innerHTML = `
    <div class="field">
      <label for="combo-q">Find a combination</label>
      <input id="combo-q" type="search" placeholder="Name, number, or hex" autocomplete="off">
    </div>
    <div class="filters" role="group" aria-label="Combination size">
      <button type="button" data-size="0" aria-pressed="true">All</button>
      <button type="button" data-size="2" aria-pressed="false">2</button>
      <button type="button" data-size="3" aria-pressed="false">3</button>
      <button type="button" data-size="4" aria-pressed="false">4</button>
      <button type="button" id="combo-random">Random</button>
    </div>
    <div class="pick-results" id="combo-results" role="listbox" aria-label="Matching combinations"></div>
  `;
  const input = host.querySelector("#combo-q");
  const results = host.querySelector("#combo-results");
  let size = 0;
  let current = null;

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

  function paint(prefer) {
    const query = input.value.trim().toLowerCase();
    const found = combos.filter((combo) => matches(combo, query));
    const shown = found.slice(0, 40);
    results.innerHTML = shown.map((combo) => `
      <button type="button" class="pick-row" role="option" data-n="${combo.number}" aria-selected="${combo.number === current}">
        <b>#${pad(combo.number)}</b>
        <span class="mini">${combo.colors.map((slot) => `<i style="background:${slot.display_hex}"></i>`).join("")}</span>
      </button>
    `).join("") || `<p class="hint">No combination matches.</p>`;
    if (found.length > shown.length) {
      results.insertAdjacentHTML("beforeend", `<p class="hint">Showing 40 of ${found.length}. Keep typing to narrow.</p>`);
    }
    if (prefer) {
      const pick = found.find((combo) => combo.number === prefer) || found[0];
      if (pick && pick.number !== current) choose(pick.number, false);
    }
  }

  function choose(number, scroll) {
    const combo = combos.find((item) => item.number === number);
    if (!combo) return;
    current = number;
    results.querySelectorAll(".pick-row").forEach((row) => {
      row.setAttribute("aria-selected", String(Number(row.dataset.n) === number));
    });
    onPick(combo);
    if (scroll) {
      const row = results.querySelector(`[data-n="${number}"]`);
      row?.scrollIntoView({ block: "nearest" });
    }
  }

  host.addEventListener("click", (event) => {
    const sizeButton = event.target.closest("[data-size]");
    if (sizeButton) {
      size = Number(sizeButton.dataset.size);
      host.querySelectorAll("[data-size]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button === sizeButton));
      });
      paint(current);
      return;
    }
    const row = event.target.closest(".pick-row");
    if (row) choose(Number(row.dataset.n), false);
    if (event.target.id === "combo-random") {
      const query = input.value.trim().toLowerCase();
      const found = combos.filter((combo) => matches(combo, query));
      const pool = found.length ? found : combos;
      const combo = pool[Math.floor(Math.random() * pool.length)];
      choose(combo.number, true);
    }
  });
  input.addEventListener("input", () => paint(null));

  return {
    select(number) {
      current = number;
      paint(null);
      results.querySelectorAll(".pick-row").forEach((row) => {
        row.setAttribute("aria-selected", String(Number(row.dataset.n) === number));
      });
    },
    random() {
      host.querySelector("#combo-random").click();
    },
  };
}
