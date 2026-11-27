#!/usr/bin/env python3
"""Turn studio photographs into WebP frames plus region masks.

Sources are the generated photographs listed below. Outputs land in
viewer/assets/looks and viewer/assets/rooms. The pages recolor a region
by keeping its shading and replacing its hue, which is the same idea as
a paint visualizer.

Run from the repository root after the source JPEGs are available:

    python scripts/build_studio_assets.py /path/to/sources
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/cursor/artifacts/assets")
LOOKS = ROOT / "viewer" / "assets" / "looks"
ROOMS = ROOT / "viewer" / "assets" / "rooms"

# id, file, gender, top, outer, bottoms, accent, expect jacket, expect tie
OUTFITS = [
    ("f-tee-jeans", "f-tee-jeans.jpg", "f", "tee", "none", "jeans", "none", False, False),
    ("f-polo-chinos", "f-polo-chinos.jpg", "f", "polo", "none", "chinos", "none", False, False),
    ("f-shirt-trousers", "f-shirt-trousers.jpg", "f", "shirt", "none", "trousers", "none", False, False),
    ("f-knit-trousers", "f-knit-trousers.jpg", "f", "knit", "none", "trousers", "none", False, False),
    ("f-blazer", "f-blazer-shirt.jpg", "f", "shirt", "blazer", "trousers", "tie", True, True),
    ("f-jacket-jeans", "f-jacket-jeans.jpg", "f", "tee", "jacket", "jeans", "none", True, False),
    ("m-tee-jeans", "m-tee-jeans.jpg", "m", "tee", "none", "jeans", "none", False, False),
    ("m-polo-chinos", "m-polo-chinos.jpg", "m", "polo", "none", "chinos", "none", False, False),
    ("m-shirt-trousers", "m-shirt-trousers.jpg", "m", "shirt", "none", "trousers", "none", False, False),
    ("m-knit-trousers", "m-knit-trousers.jpg", "m", "knit", "none", "trousers", "none", False, False),
    ("m-blazer", "m-blazer-shirt.jpg", "m", "shirt", "blazer", "trousers", "tie", True, True),
    ("m-jacket-jeans", "m-jacket-jeans.jpg", "m", "tee", "jacket", "jeans", "none", True, False),
    ("f-tee-chinos", "f-tee-chinos.jpg", "f", "tee", "none", "chinos", "none", False, False),
    ("f-polo-jeans", "f-polo-jeans.jpg", "f", "polo", "none", "jeans", "none", False, False),
    ("f-shirt-jeans", "f-shirt-jeans.jpg", "f", "shirt", "none", "jeans", "none", False, False),
    ("f-shirt-jacket", "f-shirt-jacket.jpg", "f", "shirt", "jacket", "trousers", "none", True, False),
    ("m-tee-chinos", "m-tee-chinos.jpg", "m", "tee", "none", "chinos", "none", False, False),
    ("m-polo-jeans", "m-polo-jeans.jpg", "m", "polo", "none", "jeans", "none", False, False),
    ("m-shirt-jeans", "m-shirt-jeans.jpg", "m", "shirt", "none", "jeans", "none", False, False),
    ("m-shirt-jacket", "m-shirt-jacket.jpg", "m", "shirt", "jacket", "trousers", "none", True, False),
    ("f-knit-jeans", "f-knit-jeans.jpg", "f", "knit", "none", "jeans", "none", False, False),
    ("m-knit-jeans", "m-knit-jeans.jpg", "m", "knit", "none", "jeans", "none", False, False),
]


def segment_outfit(im: np.ndarray, outer: bool, tie: bool, top: str = "shirt") -> np.ndarray:
    h, w = im.shape[:2]
    r, g, b = im[:, :, 0].astype(np.int16), im[:, :, 1].astype(np.int16), im[:, :, 2].astype(np.int16)
    green = (g > 70) & (g > r + 28) & (g > b + 28)
    fg = ~green
    ys = np.where(fg)[0]
    y0, y1 = int(ys.min()), int(ys.max())
    rel = (np.arange(h)[:, None] - y0) / max(1, y1 - y0)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    lum_s = np.asarray(Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.0))).astype(np.float32)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = mx - mn
    cx = w / 2
    lateral = np.abs(np.arange(w)[None, :] - cx) > (w * 0.13)
    warm = (r > b + 4) & (r + 18 > g) & (r > 70) & (sat > 8) & (sat < 120) & (lum < 205)
    skin = fg & warm & ((rel < 0.24) | (lateral & (rel < 0.66)))
    skin = np.asarray(Image.fromarray((skin.astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(9))) > 0
    head = fg & (rel < 0.15)
    shoes = fg & (rel > 0.935) & ~skin & ((lum > 155) | (lum < 48))
    tie_m = fg & tie & (sat > 26) & (r > g + 8) & (r >= b) & (rel > 0.18) & (rel < 0.56) & (lum < 150)
    cloth = fg & ~skin & ~head & ~shoes & ~tie_m
    role = np.zeros((h, w), np.uint8)
    if outer:
        hi = 142 if top == "knit" else 168
        role[cloth & (lum_s >= hi)] = 1
        role[cloth & (lum_s >= 80) & (lum_s < hi) & (rel < 0.64)] = 2
        role[cloth & (lum_s < 85)] = 3
        role[cloth & (role == 0) & (rel >= 0.5)] = 3
        role[cloth & (role == 0)] = 2
    else:
        role[cloth & (lum_s >= 72)] = 1
        role[cloth & (lum_s < 72)] = 3
    role[shoes] = 4
    role[tie_m] = 5
    # Shirt pixels that spilled onto the legs belong to the trousers.
    role[(role == 1) & (rel > 0.56)] = 3
    # Close small gaps in the top, such as a gray collar between skin and cloth.
    # Clear skin, but leave dark cloth alone so a hand does not bite a hole in the jeans.
    role[skin & (lum > 75)] = 0
    fabric = (sat < 22) | (lum > 168)
    top = Image.fromarray(((role == 1).astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(5))
    extra = (np.asarray(top) > 0) & fg & ~green & (role == 0) & (rel > 0.18) & (rel < 0.55) & (lum > 80)
    role[extra] = 1
    center = np.abs(np.arange(w)[None, :] - (w / 2)) < (w * 0.09)
    collar = fg & ~green & (role == 0) & center & (rel > 0.17) & (rel < 0.28) & (lum > 100) & (sat < 35)
    role[collar] = 1
    outer_img = Image.fromarray(((role == 2).astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(3))
    sleeve = (np.asarray(outer_img) > 0) & fg & ~green & (role == 0) & (lum > 60) & (lum < 190) & (rel < 0.62)
    role[sleeve] = 2
    role = smooth_regions(role)
    # A light shirt edge that fell into the blazer reads as an orange halo between the lapels.
    if outer:
        blazer = role == 2
        if blazer.any():
            med = float(np.median(lum[blazer]))
            near = np.asarray(Image.fromarray(((role == 1).astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(3))) > 0
            center = np.abs(np.arange(w)[None, :] - (w / 2)) < (w * 0.11)
            # Only the much lighter shirt, not a highlight on the blazer.
            role[blazer & near & center & (lum > med + 45) & (rel > 0.16) & (rel < 0.5)] = 1
    return close_gaps(role), green


def despill(im: np.ndarray, green: np.ndarray) -> np.ndarray:
    out = im.copy()
    bg = np.array([236, 232, 224], np.uint8)
    out[green] = bg
    r, g, b = out[:, :, 0].astype(np.int16), out[:, :, 1].astype(np.int16), out[:, :, 2].astype(np.int16)
    spill = (g > r + 12) & (g > b + 12)
    out[spill, 1] = np.minimum(g[spill], np.maximum(r[spill], b[spill]) + 6).astype(np.uint8)
    return out


def grow_from(img: np.ndarray, seed: tuple[int, int], tol: int, blocked: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    sy, sx = seed
    sy = int(np.clip(sy, 0, h - 1))
    sx = int(np.clip(sx, 0, w - 1))
    target = img[sy, sx].astype(np.int16)
    cand = (np.abs(img.astype(np.int16) - target).max(axis=2) <= tol) & ~blocked
    if not cand[sy, sx]:
        return np.zeros((h, w), bool)
    sel = np.zeros((h, w), bool)
    sel[sy, sx] = True
    for _ in range(max(h, w)):
        grown = sel.copy()
        grown[1:] |= sel[:-1]
        grown[:-1] |= sel[1:]
        grown[:, 1:] |= sel[:, :-1]
        grown[:, :-1] |= sel[:, 1:]
        grown &= cand
        if int(grown.sum()) == int(sel.sum()):
            break
        sel = grown
    return sel


def save_photo(im: Image.Image, path: Path, width: int, quality: int) -> None:
    if im.width > width:
        height = round(im.height * width / im.width)
        im = im.resize((width, height), Image.Resampling.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)


def erode(mask: np.ndarray) -> np.ndarray:
    img = Image.fromarray((mask.astype(np.uint8) * 255))
    return np.asarray(img.filter(ImageFilter.MinFilter(3))) > 0


def feather_alpha(role: np.ndarray, radius: float) -> np.ndarray:
    """Soften only the outer silhouette. Interior pixels stay fully covered."""
    binary = Image.fromarray(np.where(role > 0, 255, 0).astype(np.uint8))
    blur = np.array(binary.filter(ImageFilter.GaussianBlur(radius=radius)))
    alpha = np.where(role > 0, 255, 0).astype(np.uint8)
    edge = (role > 0) & (blur < 235)
    alpha[edge] = np.clip(blur[edge], 90, 255).astype(np.uint8)
    return alpha


def smooth_regions(role: np.ndarray) -> np.ndarray:
    """Replace stair-stepped pixels with the majority of their neighbors."""
    h, w = role.shape
    counts = np.zeros((h, w, 6), np.uint8)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            shifted = np.roll(np.roll(role, dy, 0), dx, 1)
            for rid in range(6):
                counts[:, :, rid] += (shifted == rid).astype(np.uint8)
    mode = counts.argmax(axis=2).astype(np.uint8)
    # Keep the tie and the shoes. A 3x3 vote would nibble them away.
    keep = (role == 4) | (role == 5)
    mode[keep] = role[keep]
    return mode


def close_gaps(role: np.ndarray) -> np.ndarray:
    """Fill one-pixel holes so a dark jean speckle does not show through."""
    out = role.copy()
    for rid in range(1, 6):
        layer = ((role == rid).astype(np.uint8) * 255)
        closed = np.array(Image.fromarray(layer).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)))
        out[(closed > 0) & (out == 0)] = rid
    return out


def save_mask(role: np.ndarray, path: Path, width: int, radius: float = 1.15) -> None:
    alpha = feather_alpha(role, radius)
    rgb = np.zeros((role.shape[0], role.shape[1], 3), np.uint8)
    rgb[:, :, 0] = role
    rgb[:, :, 1] = alpha
    im = Image.fromarray(rgb, "RGB")
    if im.width > width:
        height = round(im.height * width / im.width)
        im = im.resize((width, height), Image.Resampling.NEAREST)
    im.save(path, optimize=True)


def build_outfits() -> list[dict]:
    LOOKS.mkdir(parents=True, exist_ok=True)
    catalog = []
    for item in OUTFITS:
        oid, fname, gender, top, outer, bottoms, accent, expect_outer, expect_tie = item
        src = SRC / fname
        if not src.exists():
            print("missing", src)
            continue
        plate = Image.open(src).convert("RGB")
        width = 760
        if plate.width > width:
            plate = plate.resize((width, round(plate.height * width / plate.width)), Image.Resampling.LANCZOS)
        raw = np.asarray(plate)
        role, green = segment_outfit(raw, expect_outer, expect_tie, top)
        photo = Image.fromarray(despill(raw, green))
        save_photo(photo, LOOKS / f"{oid}.webp", width, 74)
        save_mask(role, LOOKS / f"{oid}-mask.png", width, radius=1.25)
        thumb = photo.copy()
        thumb.thumbnail((200, 360), Image.Resampling.LANCZOS)
        thumb.save(LOOKS / f"{oid}-thumb.webp", "WEBP", quality=58, method=6)
        parts = ["top", "bottoms", "shoes"]
        if expect_outer:
            parts.insert(1, "outer")
        if expect_tie:
            parts.append("accent")
        catalog.append({
            "id": oid,
            "gender": gender,
            "top": top,
            "outer": outer,
            "bottoms": bottoms,
            "accent": accent,
            "parts": parts,
            "photo": f"{oid}.webp",
            "mask": f"{oid}-mask.png",
            "thumb": f"{oid}-thumb.webp",
        })
        print(oid, {k: int((role == k).sum()) for k in range(1, 6)})
    return catalog


ROOMS = [
    {
        "id": "living",
        "file": "ref-living.jpg",
        "label": "Living room",
        "blurb": "Walls and curtains take the lightest color. The sofa takes the middle. The rug and the lamp shade take the darkest.",
        "surfaces": [
            ("wall", "dominant", "Walls", (0.72, 0.22), 18),
            ("floor", "dominant", "Floor", (0.12, 0.92), 22),
            ("curtains", "dominant", "Curtains", (0.04, 0.35), 14),
            ("sofa", "secondary", "Sofa", (0.55, 0.58), 16),
            ("rug", "accent", "Rug", (0.45, 0.86), 18),
            ("lamp", "accent", "Lamp shade", (0.90, 0.32), 20),
        ],
    },
    {
        "id": "bedroom",
        "file": "ref-bedroom.jpg",
        "label": "Bedroom",
        "blurb": "The walls stay the large field. The bed takes the middle color. The rug and the lamp shade take the accent.",
        "surfaces": [
            ("wall", "dominant", "Walls", (0.22, 0.28), 16),
            ("floor", "dominant", "Floor", (0.72, 0.78), 20),
            ("curtains", "dominant", "Curtains", (0.88, 0.35), 12),
            ("bed", "secondary", "Bed", (0.35, 0.58), 16),
            ("head", "secondary", "Headboard", (0.18, 0.48), 18),
            ("rug", "accent", "Rug", (0.62, 0.86), 16),
        ],
    },
    {
        "id": "kitchen",
        "file": "ref-kitchen.jpg",
        "label": "Kitchen",
        "blurb": "Walls and floor are the large field. Cabinets take the middle color. The stool takes the accent.",
        "surfaces": [
            ("wall", "dominant", "Walls", (0.55, 0.28), 14),
            ("floor", "dominant", "Floor", (0.55, 0.88), 22),
            ("cabinet", "secondary", "Cabinets", (0.45, 0.18), 14),
            ("counter", "secondary", "Counter", (0.40, 0.42), 16),
            ("stool", "accent", "Stool", (0.32, 0.62), 22),
        ],
    },
    {
        "id": "patio",
        "file": "ref-patio.jpg",
        "label": "Patio",
        "blurb": "The wall and the deck are the large field. The awning takes the middle color. The chair cushion takes the accent.",
        "surfaces": [
            ("wall", "dominant", "Wall", (0.55, 0.42), 16),
            ("deck", "dominant", "Deck", (0.70, 0.88), 20),
            ("awning", "secondary", "Awning", (0.55, 0.16), 16),
            ("chair", "accent", "Chair cushion", (0.36, 0.62), 18),
            ("pot", "secondary", "Plant pot", (0.12, 0.72), 18),
        ],
    },
    {
        "id": "bar",
        "file": "ref-bar.jpg",
        "label": "Bar",
        "blurb": "The wall and floor are the large field. The bar front takes the middle color. The stools take the accent.",
        "surfaces": [
            ("wall", "dominant", "Wall", (0.40, 0.22), 14),
            ("floor", "dominant", "Floor", (0.75, 0.90), 20),
            ("bar", "secondary", "Bar front", (0.30, 0.62), 18),
            ("top", "dominant", "Counter", (0.45, 0.38), 16),
            ("stool", "accent", "Stools", (0.62, 0.70), 20),
        ],
    },
    {
        "id": "facade",
        "file": "ref-facade.jpg",
        "label": "Facade",
        "blurb": "The rendered wall is the large field. The roof takes the middle color. The door and window frames take the accent.",
        "surfaces": [
            ("wall", "dominant", "Wall", (0.30, 0.45), 14),
            ("roof", "secondary", "Roof", (0.50, 0.12), 16),
            ("door", "accent", "Door", (0.50, 0.72), 18),
            ("frame", "accent", "Window frames", (0.28, 0.62), 16),
        ],
    },
]


ROOM_POLYGONS = [
    {
        "id": "living", "file": "ref-living.jpg", "label": "Living room",
        "blurb": "Walls and curtains take the lightest color. The sofa takes the middle. The rug and the lamp shade take the darkest.",
        "surfaces": [
            {"id": "wall", "role": "dominant", "label": "Walls", "index": 1},
            {"id": "floor", "role": "dominant", "label": "Floor", "index": 2},
            {"id": "curtains", "role": "dominant", "label": "Curtains", "index": 3, "translucent": True},
            {"id": "rug", "role": "accent", "label": "Rug", "index": 4},
            {"id": "sofa", "role": "secondary", "label": "Sofa", "index": 5},
            {"id": "lamp", "role": "accent", "label": "Lamp shade", "index": 6},
        ],
        "polygons": [
            ([(0.22, 0), (1, 0), (1, 0.70), (0.22, 0.68)], 1),
            ([(0, 0.70), (1, 0.68), (1, 1), (0, 1)], 2),
            ([(0, 0), (0.23, 0), (0.225, 0.72), (0, 0.70)], 3),
            ([(0.06, 0.78), (0.80, 0.75), (0.88, 0.98), (0.05, 0.92)], 4),
            ([(0.295, 0.58), (0.34, 0.515), (0.72, 0.50), (0.785, 0.55), (0.80, 0.62), (0.78, 0.73), (0.31, 0.735), (0.29, 0.66)], 5),
            ([(0.805, 0.305), (0.862, 0.298), (0.875, 0.418), (0.798, 0.425)], 6),
        ],
    },
    {
        "id": "bedroom", "file": "ref-bedroom.jpg", "label": "Bedroom",
        "blurb": "The walls are the large field. The bed takes the middle color. The rug takes the accent.",
        "surfaces": [
            {"id": "wall", "role": "dominant", "label": "Walls", "index": 1},
            {"id": "floor", "role": "dominant", "label": "Floor", "index": 2},
            {"id": "curtains", "role": "dominant", "label": "Curtains", "index": 3, "translucent": True},
            {"id": "bed", "role": "secondary", "label": "Bed", "index": 4},
            {"id": "head", "role": "secondary", "label": "Headboard", "index": 5},
            {"id": "rug", "role": "accent", "label": "Rug", "index": 6},
        ],
        "polygons": [
            ([(0, 0), (0.60, 0), (0.58, 0.70), (0, 0.68)], 1),
            ([(0, 0.72), (1, 0.66), (1, 1), (0, 1)], 2),
            ([(0.62, 0.0), (1, 0), (1, 0.74), (0.60, 0.68)], 3),
            ([(0.04, 0.57), (0.38, 0.55), (0.62, 0.60), (0.57, 0.68), (0.16, 0.83), (0.05, 0.75)], 4),
            ([(0.04, 0.42), (0.38, 0.415), (0.38, 0.45), (0.04, 0.455)], 5),
            ([(0.30, 0.90), (0.90, 0.86), (0.94, 0.99), (0.28, 1.0)], 6),
        ],
    },
    {
        "id": "kitchen", "file": "ref-kitchen.jpg", "label": "Kitchen",
        "blurb": "Walls and floor are the large field. Cabinets take the middle color. The stool takes the accent.",
        "surfaces": [
            {"id": "wall", "role": "dominant", "label": "Walls", "index": 1},
            {"id": "floor", "role": "dominant", "label": "Floor", "index": 2},
            {"id": "cabinet", "role": "secondary", "label": "Cabinets", "index": 3},
            {"id": "counter", "role": "secondary", "label": "Counter", "index": 4},
            {"id": "stool", "role": "accent", "label": "Stool", "index": 5},
        ],
        "polygons": [
            ([(0, 0), (1, 0), (1, 0.48), (0, 0.50)], 1),
            ([(0, 0.78), (1, 0.75), (1, 1), (0, 1)], 2),
            ([(0.155, 0.055), (0.76, 0.05), (0.775, 0.30), (0.155, 0.31)], 3),
            ([(0.0, 0.58), (0.20, 0.55), (0.20, 0.82), (0.0, 0.84)], 3),
            ([(0.22, 0.56), (0.80, 0.54), (0.80, 0.78), (0.22, 0.80)], 3),
            ([(0.0, 0.535), (0.93, 0.515), (0.95, 0.55), (0.0, 0.57)], 4),
            ([(0.30, 0.55), (0.385, 0.545), (0.39, 0.65), (0.40, 0.67), (0.25, 0.71), (0.255, 0.65), (0.29, 0.63)], 5),
        ],
    },
    {
        "id": "patio", "file": "ref-patio.jpg", "label": "Patio",
        "blurb": "The wall and the deck are the large field. The awning takes the middle color. The chair cushion takes the accent.",
        "surfaces": [
            {"id": "wall", "role": "dominant", "label": "Wall", "index": 1},
            {"id": "deck", "role": "dominant", "label": "Deck", "index": 2},
            {"id": "awning", "role": "secondary", "label": "Awning", "index": 3},
            {"id": "chair", "role": "accent", "label": "Chair", "index": 4},
            {"id": "pot", "role": "secondary", "label": "Plant pot", "index": 5},
        ],
        "polygons": [
            ([(0, 0.24), (1, 0.18), (1, 0.78), (0, 0.78)], 1),
            ([(0, 0.78), (1, 0.76), (1, 1), (0, 1)], 2),
            ([(0.18, 0.17), (0.98, 0.02), (0.99, 0.17), (0.20, 0.25)], 3),
            ([(0.305, 0.60), (0.42, 0.59), (0.42, 0.66), (0.30, 0.67)], 4),
            ([(0.295, 0.68), (0.44, 0.67), (0.435, 0.73), (0.29, 0.74)], 4),
            ([(0.09, 0.68), (0.17, 0.67), (0.175, 0.80), (0.085, 0.81)], 5),
        ],
    },
    {
        "id": "bar", "file": "ref-bar.jpg", "label": "Bar",
        "blurb": "The wall and floor are the large field. The bar front takes the middle color. The stools take the accent.",
        "surfaces": [
            {"id": "wall", "role": "dominant", "label": "Wall", "index": 1},
            {"id": "floor", "role": "dominant", "label": "Floor", "index": 2},
            {"id": "bar", "role": "secondary", "label": "Bar front", "index": 3},
            {"id": "top", "role": "dominant", "label": "Counter", "index": 4},
            {"id": "stool", "role": "accent", "label": "Stools", "index": 5},
        ],
        "polygons": [
            ([(0, 0), (0.84, 0), (0.82, 0.48), (0, 0.55)], 1),
            ([(0, 0.80), (1, 0.76), (1, 1), (0, 1)], 2),
            ([(0.07, 0.54), (0.80, 0.51), (0.80, 0.86), (0.07, 0.88)], 3),
            ([(0.06, 0.48), (0.82, 0.46), (0.82, 0.55), (0.06, 0.56)], 4),
            ([(0.50, 0.60), (0.60, 0.59), (0.605, 0.66), (0.495, 0.67)], 5),
            ([(0.64, 0.60), (0.75, 0.59), (0.755, 0.66), (0.635, 0.67)], 5),
        ],
    },
    {
        "id": "facade", "file": "ref-facade.jpg", "label": "Facade",
        "blurb": "The rendered wall is the large field. The roof takes the middle color. The door takes the accent.",
        "surfaces": [
            {"id": "wall", "role": "dominant", "label": "Wall", "index": 1},
            {"id": "roof", "role": "secondary", "label": "Roof", "index": 2},
            {"id": "door", "role": "accent", "label": "Door", "index": 3},
        ],
        "polygons": [
            ([(0.155, 0.22), (0.845, 0.215), (0.845, 0.785), (0.155, 0.785)], 1),
            ([(0.20, 0.125), (0.80, 0.12), (0.855, 0.215), (0.145, 0.22)], 2),
            ([(0.462, 0.545), (0.548, 0.545), (0.548, 0.785), (0.462, 0.785)], 3),
        ],
        "clear": [
            (0.46, 0.27, 0.55, 0.48),
            (0.25, 0.52, 0.36, 0.69),
            (0.64, 0.52, 0.75, 0.69),
        ],
    },
]


def paint_polygons(size: tuple[int, int], layers: list[tuple[list[tuple[float, float]], int]]) -> np.ndarray:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    for points, index in layers:
        xy = [(x * size[0], y * size[1]) for x, y in points]
        draw.polygon(xy, fill=index)
    return np.asarray(mask)


def _component(cand: np.ndarray, seed: tuple[int, int]) -> np.ndarray:
    h, w = cand.shape
    sel = np.zeros_like(cand)
    sel[seed] = True
    for _ in range(max(h, w)):
        grown = sel.copy()
        grown[1:] |= sel[:-1]
        grown[:-1] |= sel[1:]
        grown[:, 1:] |= sel[:, :-1]
        grown[:, :-1] |= sel[:, 1:]
        grown &= cand
        if int(grown.sum()) == int(sel.sum()):
            break
        sel = grown
    return sel


def _hull(sel: np.ndarray) -> np.ndarray:
    ys, xs = np.where(sel)
    if len(xs) < 20:
        return sel
    pts = np.stack([xs[::6], ys[::6]], 1)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(tuple(int(v) for v in p))
    upper = []
    for p in pts[::-1]:
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(tuple(int(v) for v in p))
    poly = lower[:-1] + upper[:-1]
    canvas = Image.new("L", (sel.shape[1], sel.shape[0]), 0)
    ImageDraw.Draw(canvas).polygon(poly, fill=255)
    return np.asarray(canvas) > 0


def living_rug(im: np.ndarray) -> np.ndarray:
    """Follow the pile, then drop the wood floor and the line under the sofa."""
    h, w = im.shape[:2]
    gray = Image.fromarray(im).convert("L")
    g = np.asarray(gray).astype(np.float32)
    blur = np.asarray(gray.filter(ImageFilter.BoxBlur(1))).astype(np.float32)
    energy = np.asarray(Image.fromarray(np.clip(np.abs(g - blur) * 6, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(3))).astype(np.float32)
    warm = im[:, :, 0].astype(np.int16) - im[:, :, 2].astype(np.int16)
    yy = np.arange(h)[:, None] / h
    xx = np.arange(w)[None, :] / w
    core = (energy > 16) & (warm < 22) & (yy > 0.74) & (yy < 0.995) & (xx > 0.03) & (xx < 0.95) & (g < 245)
    core &= ~((energy < 30) & (g > 205) & (xx < 0.25) & (yy < 0.82))
    sel = _component(core, (int(0.88 * h), int(0.5 * w)))
    opened = sel.copy()
    for k in range(1, 6):
        opened[k:] &= sel[:-k]
        opened[: h - k] &= sel[k:]
    body = opened.copy()
    for k in range(1, 4):
        body[k:] |= opened[:-k]
        body[: h - k] |= opened[k:]
        body[:, k:] |= opened[:, :-k]
        body[:, : w - k] |= opened[:, k:]
    filled = _hull(body) & (warm < 26) & (yy > 0.745)
    filled &= ~((g < 80) & (yy < 0.79))
    # The shadow line under the sofa is not the rug.
    filled &= ~((yy < 0.768) & (xx > 0.42))
    filled &= ~((yy < 0.81) & (xx > 0.82))
    grown = np.asarray(Image.fromarray((filled.astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(3))) > 0
    grown &= (warm < 24) & (yy > 0.75) & (xx < 0.93)
    grown &= ~((yy < 0.768) & (xx > 0.42))
    return grown


def drop_warm_floor(im: np.ndarray, mask: np.ndarray) -> np.ndarray:
    h = im.shape[0]
    warm = im[:, :, 0].astype(np.int16) - im[:, :, 2].astype(np.int16)
    yy = np.arange(h)[:, None] / h
    return mask & ~((warm > 28) & (yy > 0.7))


def refine_room(room_id: str, im: np.ndarray, role: np.ndarray) -> np.ndarray:
    role = np.array(role)
    h, w = role.shape
    if room_id == "living":
        role[role == 4] = 0
        rug = living_rug(im)
        # The sofa is painted on top of the rug where they overlap.
        role[rug & (role != 5)] = 4
        y0, y1, x0, x1 = int(0.17 * h), int(0.46 * h), int(0.67 * w), int(0.80 * w)
        art = role[y0:y1, x0:x1]
        art[art == 1] = 0
        role[y0:y1, x0:x1] = art
    elif room_id == "bedroom":
        rug = drop_warm_floor(im, role == 6)
        rug = np.asarray(Image.fromarray((rug.astype(np.uint8) * 255)).filter(ImageFilter.MinFilter(3))) > 0
        role[role == 6] = 0
        role[rug] = 6
    elif room_id == "facade":
        for x0, y0, x1, y1 in ((0.46, 0.27, 0.55, 0.48), (0.25, 0.52, 0.36, 0.69), (0.64, 0.52, 0.75, 0.69)):
            role[int(y0 * h) : int(y1 * h), int(x0 * w) : int(x1 * w)] = 0
    return role


def build_rooms() -> list[dict]:
    out_dir = ROOT / "viewer" / "assets" / "rooms"
    out_dir.mkdir(parents=True, exist_ok=True)
    catalog = []
    for spec in ROOM_POLYGONS:
        src = SRC / spec["file"]
        if not src.exists():
            print("missing", src)
            continue
        photo = Image.open(src).convert("RGB")
        width = 1200
        if photo.width > width:
            photo = photo.resize((width, round(photo.height * width / photo.width)), Image.Resampling.LANCZOS)
        role = paint_polygons(photo.size, spec["polygons"])
        role = refine_room(spec["id"], np.asarray(photo), role)
        save_photo(photo, out_dir / f"{spec['id']}.webp", width, 72)
        save_mask(role, out_dir / f"{spec['id']}-mask.png", width, radius=1.4)
        print(spec["id"], {i: int((role == i).sum()) for i in range(1, 8)})
        catalog.append({
            "id": spec["id"],
            "label": spec["label"],
            "blurb": spec["blurb"],
            "photo": f"{spec['id']}.webp",
            "mask": f"{spec['id']}-mask.png",
            "surfaces": spec["surfaces"],
        })
    return catalog


def main() -> None:
    looks = build_outfits()
    rooms = build_rooms()
    (LOOKS / "catalog.json").write_text(json.dumps(looks, indent=2) + "\n")
    (ROOT / "viewer" / "assets" / "rooms" / "catalog.json").write_text(json.dumps(rooms, indent=2) + "\n")
    print("looks", len(looks), "rooms", len(rooms))


if __name__ == "__main__":
    main()
