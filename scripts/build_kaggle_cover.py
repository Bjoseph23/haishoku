#!/usr/bin/env python3
"""Render kaggle/cover.png (1600x800): every combination as a stripe mosaic plus title."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parent.parent
d = json.loads((ROOT / "data/wada_colors_and_combinations.json").read_text())
W, H = 1600, 800
PAPER, INK = "#F3EFE6", "#241F1C"
im = Image.new("RGB", (W, H), PAPER); dr = ImageDraw.Draw(im)
def font(sz, bold=False):
    for f in (["DejaVuSerif-Bold.ttf", "DejaVuSerif.ttf"][0 if bold else 1], "DejaVuSans.ttf"):
        try: return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{f}", sz)
        except OSError: pass
    return ImageFont.load_default()
# mosaic of all 348 combinations: 29 cols x 12 rows
cols, rows = 29, 12
x0, y0, gx, gy = 60, 250, 6, 6
cw = (W - 2 * x0 - (cols - 1) * gx) / cols
ch = (H - y0 - 60 - (rows - 1) * gy) / rows
for i, c in enumerate(d["combinations"]):
    r, q = divmod(i, cols)
    x, y = x0 + q * (cw + gx), y0 + r * (ch + gy)
    n = len(c["colors"]); w = cw / n
    for j, s in enumerate(c["colors"]):
        dr.rectangle([x + j * w, y, x + (j + 1) * w, y + ch], fill=s["display_hex"])
# 159 color strip
sw = (W - 2 * x0) / 159
for i, c in enumerate(d["colors"]):
    dr.rectangle([x0 + i * sw, 200, x0 + (i + 1) * sw, 226], fill=c["display_hex"])
dr.text((x0, 50), "Haishoku", font=font(76, True), fill=INK)
try:
    jp = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc", 40)
except OSError:
    jp = None
if jp:
    dr.text((x0 + 420, 72), "配色総鑑", font=jp, fill="#6F675F")
dr.text((x0, 140), "Sanzo Wada’s 348 color combinations · 159 named colors · CMYK, RGB, LAB · 1933–34 / 2010",
        font=font(26), fill="#6F675F")
dr.text((x0, H - 44), "CC BY 4.0 · github.com/Bjoseph23/haishoku", font=font(20), fill="#6F675F")
im.save(ROOT / "kaggle/cover.png", optimize=True)
print("cover", im.size)
