#!/usr/bin/env python3
"""Write the shared viewer chrome (theme script, top bar, mobile sheet, footer, toast)
into every page in viewer/, so the eight shells cannot drift apart.

Edit NAV or the templates below, then run:  python3 scripts/sync_viewer_chrome.py
Standard library only. The site itself has no build step; this only rewrites HTML in place.
"""
from __future__ import annotations

import re
from pathlib import Path

VIEWER = Path(__file__).resolve().parent.parent / "viewer"

# (file, desktop label, sheet label, group)
NAV = [
    ("index.html", "Palettes", "Palettes", "browse"),
    ("colors.html", "Colors", "Colors", "browse"),
    ("use-cases.html", "Use cases", "Use cases", "browse"),
    ("outfit.html", "Outfit", "Outfit studio", "studio"),
    ("room.html", "Room", "Room studio", "studio"),
    ("facade.html", "Facade", "Facade", "studio"),
    ("brand.html", "Brand", "Brand and poster", "studio"),
    ("about.html", "About", "About", "about"),
]

THEME = """<script>
(function () {
  try {
    var t = localStorage.getItem("haishoku-theme");
    if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
</script>"""

FOOT = """<footer class="site-foot"><p>Sanzo Wada, <em>A Dictionary of Color Combinations</em>. Compiled by <a href="https://github.com/Bjoseph23">Bill Mageni</a>. Code MIT, data and studio photographs CC BY 4.0.</p></footer>
<div id="toast" role="status" aria-live="polite"></div>"""


def link(href: str, label: str, page: str, indent: str, extra: str = "") -> str:
    cur = ' aria-current="page"' if href == page else ""
    return f'{indent}<a href="{href}"{cur}>{label}{extra}</a>'


def chrome(page: str) -> str:
    i4 = "    "
    desk = []
    for group in ("browse", "studio", "about"):
        items = [n for n in NAV if n[3] == group]
        if group != "browse":
            desk.append(f'{i4}<span class="desk-sep" aria-hidden="true"></span>')
        if group == "studio":
            desk.append(f'{i4}<span class="desk-label" aria-hidden="true">Studios</span>')
        for href, short, _, _ in items:
            extra = '<span class="sr"> studio</span>' if group == "studio" else ""
            desk.append(link(href, short, page, i4, extra))
    browse = [link(h, s, page, i4) for h, _, s, g in NAV if g in ("browse", "about")]
    studios = [link(h, s, page, i4) for h, _, s, g in NAV if g == "studio"]
    nl = "\n"
    return f"""<a class="skip" href="#app">Skip to content</a>
<header class="topbar">
  <a class="mark" href="index.html">haishoku</a>
  <nav class="desk" aria-label="Primary">
{nl.join(desk)}
  </nav>
  <div class="tools">
    <button type="button" class="text-btn" id="theme">Dark</button>
    <button type="button" class="icon-btn" id="menu" aria-expanded="false" aria-controls="sheet" aria-label="Open menu"><span class="burger"></span></button>
  </div>
</header>
<div class="backdrop" id="backdrop" hidden></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
  <div class="sheet-grip">
    <span class="mark">haishoku</span>
    <button type="button" class="text-btn" id="sheet-close">Close</button>
  </div>
  <p class="sheet-label" id="sheet-browse">Browse</p>
  <nav class="sheet-nav" aria-labelledby="sheet-browse">
{nl.join(browse)}
  </nav>
  <p class="sheet-label" id="sheet-studios">Studios</p>
  <nav class="sheet-nav sheet-studios" aria-labelledby="sheet-studios">
{nl.join(studios)}
  </nav>
</div>
"""


def main() -> None:
    for href, *_ in NAV:
        path = VIEWER / href
        html = path.read_text(encoding="utf-8")
        html = re.sub(r"<script>\s*\(function \(\) \{.*?</script>", lambda _: THEME, html, count=1, flags=re.S)
        html = re.sub(r"<a class=\"skip\".*?(?=<main)", lambda _: chrome(href), html, count=1, flags=re.S)
        html = re.sub(r"<footer class=\"site-foot\">.*?<div id=\"toast\"[^>]*></div>", lambda _: FOOT, html, count=1, flags=re.S)
        path.write_text(html, encoding="utf-8")
        print("synced", path.relative_to(VIEWER.parent))


if __name__ == "__main__":
    main()
