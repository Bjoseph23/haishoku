#!/usr/bin/env python3
"""Build the analysis-ready publication package in kaggle/ (Kaggle, Hugging Face, Zenodo).

    python scripts/build_kaggle_package.py

Reads data/wada_colors_and_combinations.json (canonical) and writes tidy CSVs,
a Frictionless datapackage.json, and runs integrity checks. Needs only the stdlib.
"""
from __future__ import annotations
import colorsys, csv, json, math, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "kaggle"
HEX = re.compile(r"^#[0-9A-F]{6}$")


def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def srgb_to_lab(r, g, b):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    R, G, B = lin(r), lin(g), lin(b)
    X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047
    Y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B)
    Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(X), f(Y), f(Z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def hue_family(h, s, l):
    if l < 0.12: return "black"
    if l > 0.94 and s < 0.35: return "white"
    if s < 0.12: return "gray"
    d = h * 360
    for lim, name in ((15, "red"), (40, "orange"), (65, "yellow"), (160, "green"),
                      (195, "cyan"), (255, "blue"), (290, "violet"), (335, "magenta"), (361, "red")):
        if d < lim:
            fam = name
            break
    if fam in ("red", "magenta") and l > 0.72:
        fam = "pink"
    if fam in ("orange", "red", "yellow") and l < 0.45 and s < 0.6:
        fam = "brown" if fam != "yellow" else "olive"
    return fam


def write(name, header, rows):
    with open(OUT / name, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)


def main():
    d = json.loads((ROOT / "data/wada_colors_and_combinations.json").read_text(encoding="utf-8"))
    colors, combos = d["colors"], d["combinations"]
    OUT.mkdir(exist_ok=True)

    color_header = ["id", "name", "base", "c", "m", "y", "k", "hex_cmyk", "scan_hex", "display_hex",
                    "display_r", "display_g", "display_b", "scan_r", "scan_g", "scan_b",
                    "lab_l", "lab_a", "lab_b", "lch_c", "lch_h",
                    "hsl_h", "hsl_s", "hsl_l", "hue_family", "is_variant",
                    "ref_page", "combo_count", "combo_count_2", "combo_count_3", "combo_count_4",
                    "appears_in", "note"]
    size_of = {c["number"]: c["size"] for c in combos}
    crow = []
    for c in colors:
        r, g, b = rgb(c["display_hex"])
        sr, sg, sb = rgb(c["scan_hex"])
        L, A, B = srgb_to_lab(r, g, b)
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        crow.append([c["id"], c["name"], c["base"], c["c"], c["m"], c["y"], c["k"], c["hex_cmyk"], c["scan_hex"],
                     c["display_hex"], r, g, b, sr, sg, sb, round(L, 2), round(A, 2), round(B, 2),
                     round(math.hypot(A, B), 2), round(math.degrees(math.atan2(B, A)) % 360, 1),
                     round(h * 360, 1), round(s * 100, 1), round(l * 100, 1), hue_family(h, s, l),
                     str(c["base"] != c["name"]).lower(), c["ref_page"], len(c["appears_in"]),
                     *[sum(1 for n in c["appears_in"] if size_of[n] == k) for k in (2, 3, 4)],
                     " ".join(f"{n:03d}" for n in c["appears_in"]), c["note"]])
    write("colors.csv", color_header, crow)

    write("combinations.csv",
          ["number", "size", "page", "positions", "color_ids", "color_names", "display_hexes", "confidence", "notes"],
          [[c["number"], c["size"], c["page"], "/".join(c["positions"]),
            " ".join(str(s["id"]) for s in c["colors"]), " | ".join(s["name"] for s in c["colors"]),
            " ".join(s["display_hex"] for s in c["colors"]), c["confidence"], c["notes"]] for c in combos])

    write("combination_colors.csv",
          ["combination_number", "slot", "position", "color_id", "color_name", "display_hex", "page_sample_hex",
           "label_ocr_match", "delta_e"],
          [[c["number"], i + 1, c["positions"][i], s["id"], s["name"], s["display_hex"], s["page_sample_hex"],
            s["label_ocr_match"], s["delta_e"]] for c in combos for i, s in enumerate(c["colors"])])

    shutil.copy(ROOT / "data/combinations.csv", OUT / "combinations_wide.csv")
    shutil.copy(ROOT / "data/wada_colors_and_combinations.json", OUT / "wada_colors_and_combinations.json")
    errors = validate()
    if errors:
        print("\n".join(errors)); return 1
    print("ok: package built and validated")
    return 0


def read(name):
    with open(OUT / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def validate():
    e = []
    col, com, slots = read("colors.csv"), read("combinations.csv"), read("combination_colors.csv")
    ids = [int(r["id"]) for r in col]
    if ids != list(range(1, 160)): e.append("color ids not 1..159")
    if len({r["name"] for r in col}) != 159: e.append("duplicate color names")
    nums = [int(r["number"]) for r in com]
    if nums != list(range(1, 349)): e.append("combination numbers not 1..348")
    if len(slots) != 1032: e.append(f"slot count {len(slots)} != 1032")
    sizes = [sum(1 for r in com if r["size"] == str(k)) for k in (2, 3, 4)]
    if sizes != [120, 120, 108]: e.append(f"size split {sizes}")
    for r in col:
        for k in ("hex_cmyk", "scan_hex", "display_hex"):
            if not HEX.match(r[k]): e.append(f"bad hex color {r['id']} {k}")
        for k in ("id", "name", "display_hex", "c", "m", "y", "k"):
            if r[k] == "": e.append(f"null {k} color {r['id']}")
        if not all(0 <= int(r[k]) <= 100 for k in "cmyk"): e.append(f"cmyk range {r['id']}")
    keys = set()
    idset = set(ids)
    per = {}
    for s in slots:
        key = (s["combination_number"], s["slot"])
        if key in keys: e.append(f"duplicate slot {key}")
        keys.add(key)
        if int(s["color_id"]) not in idset: e.append(f"dangling color_id {s['color_id']}")
        if int(s["combination_number"]) not in set(nums): e.append(f"dangling combo {key}")
        if not HEX.match(s["display_hex"]) or not HEX.match(s["page_sample_hex"]): e.append(f"bad hex slot {key}")
        per.setdefault(int(s["combination_number"]), []).append(int(s["color_id"]))
    for r in com:
        lst = per.get(int(r["number"]), [])
        if len(lst) != int(r["size"]): e.append(f"size mismatch combo {r['number']}")
        if len(set(lst)) != len(lst): e.append(f"repeated color in combo {r['number']}")
    cnt = {}
    for lst in per.values():
        for i in lst: cnt[i] = cnt.get(i, 0) + 1
    for r in col:
        if cnt.get(int(r["id"]), 0) != int(r["combo_count"]): e.append(f"combo_count mismatch {r['id']}")
    if sum(int(r["combo_count"]) for r in col) != 1032: e.append("combo_count total != 1032")
    return e


if __name__ == "__main__":
    sys.exit(main())
