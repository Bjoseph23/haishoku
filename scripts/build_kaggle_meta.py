#!/usr/bin/env python3
"""Write kaggle/datapackage.json (Frictionless) and kaggle/dataset-metadata.json (Kaggle CLI)."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
K = ROOT / "kaggle"
readme = (K / "README.md").read_text(encoding="utf-8")

def coldocs(section):
    block = readme.split(f"### `{section}`", 1)[1].split("\n### ", 1)[0].split("\n## ", 1)[0]
    out = {}
    for line in block.splitlines():
        m = re.match(r"\| (`.+?`(?:, `.+?`)*) \| (\w+) \| (.+) \|$", line)
        if not m: continue
        for name in re.findall(r"`([^`]+)`", m.group(1)):
            out[name] = (m.group(2), m.group(3).strip())
    return out

TYPES = {"int": "integer", "float": "number", "str": "string", "hex": "string", "bool": "boolean"}
DESC = {
 "colors.csv": "159 named colors: printed CMYK, three hex readings, RGB, CIELAB/LCh, HSL, hue family and usage counts. One row per color.",
 "combinations.csv": "348 combinations (2, 3 or 4 colors), with book page, layout, color ids, names and display hexes. One row per combination.",
 "combination_colors.csv": "Long-format join table, one row per color slot (1,032), linking combinations to colors with per-swatch measurements.",
}
REQ = {"colors.csv": ["id", "name", "c", "m", "y", "k", "hex_cmyk", "scan_hex", "display_hex"],
       "combinations.csv": ["number", "size", "page"],
       "combination_colors.csv": ["combination_number", "slot", "color_id", "display_hex"]}
resources = []
for fname in DESC:
    header = (K / fname).read_text(encoding="utf-8").splitlines()[0].split(",")
    docs = coldocs(fname)
    fields = []
    for h in header:
        t, d = docs[h]
        f = {"name": h, "type": TYPES[t], "description": d}
        if t == "hex": f["constraints"] = {"pattern": "^#[0-9A-F]{6}$"}
        if h in REQ[fname]: f.setdefault("constraints", {})["required"] = True
        if fname == "colors.csv" and h in "cmyk" and len(h) == 1:
            f.setdefault("constraints", {}).update(minimum=0, maximum=100)
        fields.append(f)
    schema = {"fields": fields}
    if fname == "colors.csv": schema["primaryKey"] = ["id"]
    if fname == "combinations.csv": schema["primaryKey"] = ["number"]
    if fname == "combination_colors.csv":
        schema["primaryKey"] = ["combination_number", "slot"]
        schema["foreignKeys"] = [
            {"fields": ["color_id"], "reference": {"resource": "colors", "fields": ["id"]}},
            {"fields": ["combination_number"], "reference": {"resource": "combinations", "fields": ["number"]}}]
    resources.append({"name": fname[:-4], "path": fname, "profile": "tabular-data-resource", "format": "csv",
                      "mediatype": "text/csv", "encoding": "utf-8", "description": DESC[fname], "schema": schema})
extra = {"combinations_wide.csv": "Wide layout identical to data/combinations.csv in the GitHub repo (zero-padded number, up to 4 slot columns).",
         "wada_colors_and_combinations.json": "Canonical nested JSON (meta, colors, combinations with per-slot page sample, OCR score and delta E)."}
for p, d in extra.items():
    resources.append({"name": re.sub(r"[^a-z0-9]+", "-", p.rsplit(".", 1)[0].lower()), "path": p,
                      "format": p.rsplit(".", 1)[1], "description": d})
pkg = {
 "profile": "data-package",
 "name": "haishoku-sanzo-wada-color-combinations",
 "id": "https://github.com/Bjoseph23/haishoku",
 "title": "Haishoku: Sanzo Wada Color Combinations",
 "description": "348 verified color combinations and 159 named colors from Sanzo Wada's Haishoku Soukan (1933-34), as printed in Seigensha's A Dictionary of Color Combinations (2010).",
 "version": "1.0.0", "created": "2026-11-27T00:00:00Z",
 "homepage": "https://github.com/Bjoseph23/haishoku",
 "keywords": ["color", "palette", "color harmony", "design", "art", "fashion", "japan", "Sanzo Wada", "tabular"],
 "licenses": [{"name": "CC-BY-4.0", "title": "Creative Commons Attribution 4.0", "path": "https://creativecommons.org/licenses/by/4.0/"}],
 "contributors": [{"title": "Bill Mageni (Bjoseph23)", "role": "author", "path": "https://github.com/Bjoseph23"},
                  {"title": "Sanzo Wada", "role": "contributor", "organization": "Original author of Haishoku Soukan (1933-34)"}],
 "sources": [{"title": "Sanzo Wada, Haishoku Soukan (1933-34)"},
             {"title": "A Dictionary of Color Combinations, Seigensha 2010, ISBN 978-4-86152-247-5", "path": "https://en.seigensha.com/books/978-4-86152-247-5/"},
             {"title": "Cross-check: mattdesl/dictionary-of-colour-combinations", "path": "https://github.com/mattdesl/dictionary-of-colour-combinations"}],
 "image": "cover.png",
 "resources": resources,
}
(K / "datapackage.json").write_text(json.dumps(pkg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# Kaggle CLI metadata (also mirrors what is sent through the API)
kres = []
for r in resources:
    e = {"path": r["path"], "description": r["description"]}
    if "schema" in r:
        e["schema"] = {"fields": [{"name": f["name"], "description": f["description"],
                                   "type": {"integer": "integer", "number": "number", "boolean": "boolean"}.get(f["type"], "string")}
                                  for f in r["schema"]["fields"]]}
    kres.append(e)
desc = readme.split("\n", 2)[2]
meta = {"title": "Haishoku: Sanzo Wada Color Combinations",
        "subtitle": "348 verified color palettes & 159 named colors (CMYK, RGB, LAB) from Wada",
        "description": desc, "id": "billmageni/haishoku-sanzo-wada-color-combinations",
        "licenses": [{"name": "CC-BY-4.0"}],
        "keywords": ["arts and entertainment", "art", "design", "japan", "tabular", "clothing and accessories"],
        "resources": kres}
(K / "dataset-metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(len(meta["subtitle"]), "subtitle chars")
