#!/usr/bin/env python3
"""Render assets/preview.png, a specimen sheet of twelve combinations.

    python scripts/generate_preview.py

Requires Pillow (see scripts/requirements.txt). The combo numbers below
are a fixed editorial selection; the colors themselves always come from
the dataset, so a data correction shows up the next time this is run.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from haishoku import ROOT, load_json  # noqa: E402

# Two, three, then four colors. Chosen to show contrast, pastels, and
# the book's range rather than to rank the combinations.
SHOWCASE = (
    (1, 6, 14, 22),
    (122, 176, 193, 240),
    (257, 300, 315, 347),
)
ROW_LABELS = ("Two colors", "Three colors", "Four colors")

PAPER = "#f3efe6"
INK = "#241f1c"
MUTED = "#6f675f"
HAIRLINE = "#ddd4c6"

WIDTH = 1600
MARGIN_X = 64
SPECTRUM_H = 40
GAP_X = 28
GAP_Y = 36
SWATCH_H = 156
SECTION_LABEL_H = 36


def _font(size: int, candidates: list[str]):
    from PIL import ImageFont

    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _fonts():
    sans = [
        "/usr/share/fonts/truetype/macos/Inter-Regular.ttf",
        "/usr/share/fonts/truetype/inter/Inter-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    sans_med = [
        "/usr/share/fonts/truetype/macos/Inter-Medium.ttf",
        "/usr/share/fonts/truetype/inter/Inter-Medium.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    serif = [
        "/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    ]
    mono = [
        "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Medium.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    cjk = [
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
    ]
    return {
        "title": _font(68, serif),
        "subtitle": _font(22, sans),
        "cjk": _font(26, cjk),
        "section": _font(18, sans_med),
        "number": _font(18, mono),
        "name": _font(20, sans),
        "footer": _font(18, sans),
    }


def _tracked(draw, xy, text, font, fill, tracking):
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        x += font.getlength(char) + tracking
    return x


def _ellipsize(text, font, max_width):
    if font.getlength(text) <= max_width:
        return text
    ellipsis = "…"
    trimmed = text
    while trimmed and font.getlength(trimmed + ellipsis) > max_width:
        trimmed = trimmed[:-1]
    return trimmed.rstrip(" ·") + ellipsis


def _name_lines(names: list[str], font, max_width: int, max_lines: int = 2) -> list[str]:
    lines: list[str] = []
    current = ""
    for index, name in enumerate(names):
        proposal = name if not current else f"{current} · {name}"
        if font.getlength(proposal) <= max_width:
            current = proposal
            continue
        if current:
            lines.append(current)
        current = name
        if len(lines) == max_lines - 1:
            rest = " · ".join([current, *names[index + 1 :]])
            lines.append(_ellipsize(rest, font, max_width))
            return lines
    if current:
        lines.append(_ellipsize(current, font, max_width))
    return lines[:max_lines]


def render(path: Path | None = None) -> Path:
    from PIL import Image, ImageDraw

    data = load_json()
    by_number = {combo["number"]: combo for combo in data["combinations"]}
    missing = [number for row in SHOWCASE for number in row if number not in by_number]
    if missing:
        raise SystemExit(f"showcase combinations missing from the dataset: {missing}")

    fonts = _fonts()
    content_w = WIDTH - 2 * MARGIN_X
    cell_w = (content_w - GAP_X * (len(SHOWCASE[0]) - 1)) // len(SHOWCASE[0])
    name_block = 28 + 26 * 2
    cell_h = SWATCH_H + 16 + name_block
    header_h = 168
    footer_h = 72
    height = (
        SPECTRUM_H
        + header_h
        + len(SHOWCASE) * (SECTION_LABEL_H + cell_h)
        + GAP_Y * (len(SHOWCASE) - 1)
        + footer_h
    )

    image = Image.new("RGB", (WIDTH, height), PAPER)
    draw = ImageDraw.Draw(image)

    # The reference order of the 159 colors already runs from pinks
    # through yellows, greens, blues, violets, and neutrals.
    strip = max(1, WIDTH // len(data["colors"]))
    x = 0
    for color in data["colors"]:
        x2 = x + strip
        draw.rectangle((x, 0, x2, SPECTRUM_H), fill=color["display_hex"])
        x = x2
    if x < WIDTH:
        draw.rectangle((x, 0, WIDTH, SPECTRUM_H), fill=data["colors"][-1]["display_hex"])

    title_y = SPECTRUM_H + 36
    draw.text((MARGIN_X, title_y), "haishoku", font=fonts["title"], fill=INK)
    cjk = "配色総鑑"
    cjk_w = fonts["cjk"].getlength(cjk)
    draw.text((WIDTH - MARGIN_X - cjk_w, title_y + 28), cjk, font=fonts["cjk"], fill=INK)
    draw.text(
        (MARGIN_X, title_y + 84),
        "Twelve combinations from Sanzo Wada’s dictionary",
        font=fonts["subtitle"],
        fill=MUTED,
    )

    y = SPECTRUM_H + header_h
    for label, numbers in zip(ROW_LABELS, SHOWCASE):
        _tracked(draw, (MARGIN_X, y + 4), label.upper(), fonts["section"], MUTED, 1.6)
        y += SECTION_LABEL_H
        for index, number in enumerate(numbers):
            combo = by_number[number]
            x0 = MARGIN_X + index * (cell_w + GAP_X)
            slots = combo["colors"]
            gap = 4
            usable = cell_w - gap * (len(slots) - 1)
            widths = [usable // len(slots)] * len(slots)
            widths[-1] += usable - sum(widths)
            cursor = x0
            for slot, swatch_w in zip(slots, widths):
                draw.rounded_rectangle(
                    (cursor, y, cursor + swatch_w, y + SWATCH_H),
                    radius=8,
                    fill=slot["display_hex"],
                )
                # A hairline keeps near-white swatches visible on the paper.
                draw.rounded_rectangle(
                    (cursor, y, cursor + swatch_w, y + SWATCH_H),
                    radius=8,
                    outline=HAIRLINE,
                    width=1,
                )
                cursor += swatch_w + gap
            text_y = y + SWATCH_H + 14
            draw.text((x0, text_y), f"#{number:03d}", font=fonts["number"], fill=INK)
            lines = _name_lines([slot["name"] for slot in slots], fonts["name"], cell_w)
            for line_index, line in enumerate(lines):
                draw.text(
                    (x0, text_y + 28 + line_index * 26),
                    line,
                    font=fonts["name"],
                    fill=MUTED,
                )
        y += cell_h + GAP_Y

    footer = "Screen colors are white-balanced scans (display_hex).  Four-color bars read top, left, right, bottom."
    footer_w = fonts["footer"].getlength(footer)
    draw.text(((WIDTH - footer_w) / 2, height - 48), footer, font=fonts["footer"], fill=MUTED)

    destination = path or (ROOT / "assets" / "preview.png")
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True)
    return destination


def main() -> None:
    path = render()
    print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
