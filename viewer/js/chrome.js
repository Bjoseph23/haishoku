const PAGE = location.pathname.split("/").pop() || "index.html";

function syncThemeButton() {
  const button = document.getElementById("theme");
  if (!button) return;
  const dark = document.documentElement.dataset.theme === "dark";
  button.textContent = dark ? "Light" : "Dark";
  button.setAttribute("aria-pressed", String(dark));
  button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

function trapSheet(event) {
  const sheet = document.getElementById("sheet");
  if (!sheet || sheet.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeSheet();
    return;
  }
  if (event.key !== "Tab") return;
  const items = [...sheet.querySelectorAll("a, button")];
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openSheet() {
  const sheet = document.getElementById("sheet");
  const backdrop = document.getElementById("backdrop");
  const menu = document.getElementById("menu");
  sheet.hidden = false;
  backdrop.hidden = false;
  menu.setAttribute("aria-expanded", "true");
  document.addEventListener("keydown", trapSheet);
  const first = sheet.querySelector("a, button");
  if (first) first.focus();
}

function closeSheet() {
  const sheet = document.getElementById("sheet");
  const backdrop = document.getElementById("backdrop");
  const menu = document.getElementById("menu");
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  backdrop.hidden = true;
  menu.setAttribute("aria-expanded", "false");
  document.removeEventListener("keydown", trapSheet);
  menu.focus();
}

export function enhanceChrome() {
  document.querySelectorAll(".desk a, .sheet a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === PAGE || (PAGE === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });
  const theme = document.getElementById("theme");
  syncThemeButton();
  theme?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("haishoku-theme", next); } catch (err) { /* private mode */ }
    syncThemeButton();
  });
  const menu = document.getElementById("menu");
  const backdrop = document.getElementById("backdrop");
  menu?.addEventListener("click", () => {
    const sheet = document.getElementById("sheet");
    if (sheet.hidden) openSheet();
    else closeSheet();
  });
  backdrop?.addEventListener("click", closeSheet);
  document.getElementById("sheet-close")?.addEventListener("click", closeSheet);
}

let toastTimer = 0;
export function toast(message) {
  const node = document.getElementById("toast");
  if (!node) return;
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 1100);
}

const CHECK = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

/** Copy text, toast it, and briefly turn the pressed round button into a check. */
export async function copyText(text, button) {
  if (button) {
    clearTimeout(button._done);
    button.classList.add("done");
    button.innerHTML = CHECK;
    button._done = setTimeout(() => {
      button.classList.remove("done");
      button.innerHTML = copyIcon();
    }, 1200);
  }
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else throw new Error("fallback");
  } catch (err) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    area.remove();
  }
  toast("Copied " + text);
}

export function copyIcon() {
  return '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="5.2" y="5.2" width="7.2" height="7.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3.2 10.6V3.4h7.2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
}
