#!/usr/bin/env python3
"""Loaders and generators for the haishoku dataset.

The CSV and JSON files under data/ are the source of truth. Everything
this module writes (CSS, ASE, GPL, Tailwind JSON, the viewer's data
file) is derived from them. Validation lives in scripts/validate_data.py.
"""

from __future__ import annotations

import csv
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / "data" / "wada_colors_and_combinations.json"
COLORS_CSV = ROOT / "data" / "colors.csv"
COMBOS_CSV = ROOT / "data" / "combinations.csv"

HEX_RE = re.compile(r"^#[0-9A-F]{6}$")
EXPECTED_COLORS = 159
EXPECTED_COMBOS = 348
EXPECTED_SLOTS = 1032  # 120*2 + 120*3 + 108*4

# Book structure of the Seigensha edition, from the page images.
SIZE_PAGES = {
    2: (1, 120, 28, 87, 2),
    3: (121, 240, 90, 149, 2),
    4: (241, 348, 152, 259, 1),
}
POSITIONS = {
    2: ("left", "right"),
    3: ("left", "middle", "right"),
    4: ("top", "left", "right", "bottom"),
}


def load_json(path: Path = JSON_PATH) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def slug(name: str) -> str:
    text = name.lower().replace("'", "")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    if not text:
        raise ValueError(f"empty slug for {name!r}")
    return text


def hex_rgb(value: str) -> tuple[int, int, int]:
    return tuple(int(value[i : i + 2], 16) for i in (1, 3, 5))  # type: ignore[return-value]


def _utf16_name(name: str) -> bytes:
    encoded = name.encode("utf-16-be") + b"\x00\x00"
    n_units = len(encoded) // 2
    return struct.pack(">H", n_units) + encoded


def _ase_block(kind: int, body: bytes) -> bytes:
    return struct.pack(">HI", kind, len(body)) + body


def _ase_color(name: str, model: str, values: tuple[float, ...]) -> bytes:
    if model not in {"RGB ", "CMYK"}:
        raise ValueError(model)
    body = _utf16_name(name) + model.encode("ascii")
    body += struct.pack(">" + "f" * len(values), *values)
    body += struct.pack(">H", 0)  # global swatch
    return _ase_block(0x0001, body)


def _ase_group_start(name: str) -> bytes:
    return _ase_block(0xC001, _utf16_name(name))


def _ase_group_end() -> bytes:
    return _ase_block(0xC002, b"")


def build_ase(data: dict, model: str) -> bytes:
    """Adobe Swatch Exchange file.

    model "RGB " stores display_hex. model "CMYK" stores the printed
    ink percentages from the book (0–100 scaled to 0–1), not a conversion
    of the screen hex.
    """
    blocks: list[bytes] = [_ase_group_start("All colors")]
    by_id = {color["id"]: color for color in data["colors"]}
    for color in data["colors"]:
        if model == "RGB ":
            rgb = tuple(channel / 255 for channel in hex_rgb(color["display_hex"]))
            blocks.append(_ase_color(color["name"], "RGB ", rgb))
        else:
            values = tuple(color[key] / 100 for key in ("c", "m", "y", "k"))
            blocks.append(_ase_color(color["name"], "CMYK", values))
    blocks.append(_ase_group_end())

    for combo in data["combinations"]:
        blocks.append(_ase_group_start(f"Combo {combo['number']:03d}"))
        for slot in combo["colors"]:
            color = by_id[slot["id"]]
            if model == "RGB ":
                rgb = tuple(channel / 255 for channel in hex_rgb(color["display_hex"]))
                blocks.append(_ase_color(color["name"], "RGB ", rgb))
            else:
                values = tuple(color[key] / 100 for key in ("c", "m", "y", "k"))
                blocks.append(_ase_color(color["name"], "CMYK", values))
        blocks.append(_ase_group_end())

    return b"ASEF" + struct.pack(">HHI", 1, 0, len(blocks)) + b"".join(blocks)


def parse_ase(blob: bytes) -> list[tuple[str, list[tuple]]]:
    """Return [(group name, [(name, model, values, kind), ...]), ...]."""
    if len(blob) < 12 or blob[:4] != b"ASEF":
        raise ValueError("not an ASE file")
    _major, _minor, nblocks = struct.unpack_from(">HHI", blob, 4)
    offset = 12
    groups: list[tuple[str, list[tuple]]] = []
    current: list | None = None
    for _ in range(nblocks):
        if offset + 6 > len(blob):
            raise ValueError("truncated ASE block header")
        kind, length = struct.unpack_from(">HI", blob, offset)
        offset += 6
        chunk = blob[offset : offset + length]
        if len(chunk) != length:
            raise ValueError("truncated ASE block")
        offset += length
        if kind == 0xC001:
            n_units = struct.unpack_from(">H", chunk, 0)[0]
            name = chunk[2 : 2 + (n_units - 1) * 2].decode("utf-16-be")
            current = [name, []]
            groups.append((name, current[1]))
        elif kind == 0xC002:
            current = None
        elif kind == 0x0001:
            n_units = struct.unpack_from(">H", chunk, 0)[0]
            name = chunk[2 : 2 + (n_units - 1) * 2].decode("utf-16-be")
            pos = 2 + n_units * 2
            model = chunk[pos : pos + 4].decode("ascii")
            pos += 4
            if model == "RGB ":
                values = struct.unpack_from(">3f", chunk, pos)
                pos += 12
            elif model == "CMYK":
                values = struct.unpack_from(">4f", chunk, pos)
                pos += 16
            else:
                raise ValueError(f"unexpected color model {model!r}")
            swatch_kind = struct.unpack_from(">H", chunk, pos)[0]
            if current is None:
                raise ValueError(f"color {name!r} is outside a group")
            current[1].append((name, model, values, swatch_kind))
        else:
            raise ValueError(f"unexpected ASE block {kind:#x}")
    if offset != len(blob):
        raise ValueError(f"ASE file has {len(blob) - offset} trailing bytes")
    return groups


def css_text(data: dict) -> str:
    lines = [
        "/*",
        " * haishoku named colors",
        " * Generated by scripts/generate_derived.py — do not edit by hand.",
        " * Values are display_hex: white-balanced scans, the colors to use on screen.",
        " * Source: data/wada_colors_and_combinations.json",
        " */",
        ":root {",
    ]
    seen: set[str] = set()
    for color in data["colors"]:
        key = slug(color["name"])
        if key in seen:
            raise ValueError(f"duplicate CSS slug {key}")
        seen.add(key)
        lines.append(
            f"  --haishoku-{key}: {color['display_hex']}; /* {color['id']:03d} {color['name']} */"
        )
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def combinations_css_text(data: dict) -> str:
    lines = [
        "/*",
        " * haishoku combinations",
        " * Generated by scripts/generate_derived.py — do not edit by hand.",
        " * Each class sets --haishoku-1 … --haishoku-4 to display_hex, in book order.",
        " * Two- and three-color combinations run left to right.",
        " * Four-color combinations are the printed cross: top, left, right, bottom.",
        " */",
    ]
    for combo in data["combinations"]:
        names = ", ".join(slot["name"] for slot in combo["colors"])
        lines.append(f"/* {combo['number']:03d} {names} */")
        lines.append(f".haishoku-combo-{combo['number']:03d} {{")
        for index, slot in enumerate(combo["colors"], start=1):
            lines.append(f"  --haishoku-{index}: {slot['display_hex']};")
        lines.append("}")
    lines.append("")
    return "\n".join(lines)


def scss_text(data: dict) -> str:
    lines = [
        "// haishoku named colors",
        "// Generated by scripts/generate_derived.py — do not edit by hand.",
        "// Values are display_hex.",
        "$haishoku-colors: (",
    ]
    for color in data["colors"]:
        lines.append(f'  "{slug(color["name"])}": {color["display_hex"]},')
    lines.append(");")
    lines.append("")
    return "\n".join(lines)


def tailwind_text(data: dict) -> str:
    payload = {slug(color["name"]): color["display_hex"] for color in data["colors"]}
    return json.dumps(payload, indent=2) + "\n"


def display_hex_text(data: dict) -> str:
    payload = {color["name"]: color["display_hex"] for color in data["colors"]}
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def gpl_text(data: dict) -> str:
    lines = [
        "GIMP Palette",
        "Name: Haishoku",
        "Columns: 8",
        "#",
        "# Generated by scripts/generate_derived.py — do not edit by hand.",
        "# RGB from display_hex (white-balanced scans).",
    ]
    for color in data["colors"]:
        red, green, blue = hex_rgb(color["display_hex"])
        lines.append(f"{red:3d} {green:3d} {blue:3d}\t{color['name']}")
    lines.append("")
    return "\n".join(lines)


def viewer_js(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("<", "\\u003c")
    return (
        "/* Generated by scripts/generate_derived.py from "
        "data/wada_colors_and_combinations.json. Do not edit by hand. */\n"
        "window.HAISHOKU = "
        + payload
        + ";\n"
    )


def derived_outputs(data: dict) -> dict[str, str | bytes]:
    return {
        "data/derived/colors.css": css_text(data),
        "data/derived/combinations.css": combinations_css_text(data),
        "data/derived/colors.scss": scss_text(data),
        "data/derived/tailwind.colors.json": tailwind_text(data),
        "data/derived/display-hex.json": display_hex_text(data),
        "data/derived/haishoku.gpl": gpl_text(data),
        "data/derived/haishoku-rgb.ase": build_ase(data, "RGB "),
        "data/derived/haishoku-cmyk.ase": build_ase(data, "CMYK"),
        "viewer/palette-data.js": viewer_js(data),
    }


def write_derived(root: Path = ROOT, data: dict | None = None) -> list[Path]:
    data = data if data is not None else load_json()
    written: list[Path] = []
    for relative, content in derived_outputs(data).items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            path.write_bytes(content)
        else:
            path.write_text(content, encoding="utf-8", newline="\n")
        written.append(path)
    return written


def _read_colors_csv(path: Path = COLORS_CSV) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _read_combos_csv(path: Path = COMBOS_CSV) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate(data: dict | None = None, root: Path = ROOT) -> list[str]:
    """Return a list of human-readable errors. Empty means the dataset is valid."""
    errors: list[str] = []
    data = data if data is not None else load_json(root / "data" / "wada_colors_and_combinations.json")

    colors = data.get("colors")
    combos = data.get("combinations")
    if not isinstance(colors, list) or not isinstance(combos, list):
        return ["JSON must contain colors and combinations arrays"]

    if len(colors) != EXPECTED_COLORS:
        errors.append(f"expected {EXPECTED_COLORS} colors, found {len(colors)}")
    if len(combos) != EXPECTED_COMBOS:
        errors.append(f"expected {EXPECTED_COMBOS} combinations, found {len(combos)}")

    by_id: dict[int, dict] = {}
    for color in colors:
        cid = color.get("id")
        if cid in by_id:
            errors.append(f"duplicate color id {cid}")
            continue
        by_id[cid] = color
        for key in ("id", "name", "base", "c", "m", "y", "k", "hex_cmyk", "scan_rgb", "scan_hex", "display_hex", "ref_page", "appears_in", "note"):
            if key not in color:
                errors.append(f"color {cid} missing {key}")
        for key in ("hex_cmyk", "scan_hex", "display_hex"):
            if not HEX_RE.match(str(color.get(key, ""))):
                errors.append(f"color {cid} {key} is not uppercase hex: {color.get(key)!r}")
        if color.get("scan_hex") and HEX_RE.match(color["scan_hex"]):
            if list(hex_rgb(color["scan_hex"])) != list(color.get("scan_rgb") or []):
                errors.append(f"color {cid} scan_rgb does not match scan_hex")
        for key in ("c", "m", "y", "k"):
            value = color.get(key)
            if not isinstance(value, int) or not 0 <= value <= 100:
                errors.append(f"color {cid} {key} out of range: {value!r}")
        if not isinstance(color.get("appears_in"), list):
            errors.append(f"color {cid} appears_in is not a list")
        elif color["appears_in"] != sorted(color["appears_in"]):
            errors.append(f"color {cid} appears_in is not sorted")
        name = color.get("name") or ""
        if not name:
            errors.append(f"color {cid} has an empty name")

    if [color.get("id") for color in colors] != list(range(1, EXPECTED_COLORS + 1)):
        errors.append("color ids are not 1..159 in order")

    etruscan = by_id.get(19)
    if etruscan:
        if etruscan.get("k") != 6:
            errors.append(f"Etruscan Red K should be 6, found {etruscan.get('k')}")
        if "K6" not in (etruscan.get("note") or ""):
            errors.append("Etruscan Red note should record the K6 correction")
    else:
        errors.append("missing color 19 Etruscan Red")

    seen_numbers: set[int] = set()
    membership: dict[int, list[int]] = {cid: [] for cid in by_id}
    slots = 0
    for combo in combos:
        number = combo.get("number")
        size = combo.get("size")
        if number in seen_numbers:
            errors.append(f"duplicate combination {number}")
        seen_numbers.add(number)
        slots_here = combo.get("colors") or []
        if size not in POSITIONS:
            errors.append(f"combo {number} has size {size}")
            continue
        if len(slots_here) != size:
            errors.append(f"combo {number} size {size} but {len(slots_here)} colors")
        if tuple(combo.get("positions") or []) != POSITIONS[size]:
            errors.append(f"combo {number} positions {combo.get('positions')}")
        if combo.get("confidence") != "verified-visual":
            errors.append(f"combo {number} confidence is {combo.get('confidence')!r}")
        if not combo.get("notes"):
            errors.append(f"combo {number} has empty notes")
        start, end, page_lo, page_hi, per_page = SIZE_PAGES[size]
        if not (isinstance(number, int) and start <= number <= end):
            errors.append(f"combo {number} is outside the {size}-color number range")
        page = combo.get("page")
        if not (isinstance(page, int) and page_lo <= page <= page_hi):
            errors.append(f"combo {number} page {page} outside {page_lo}-{page_hi}")
        ids_here = []
        for slot in slots_here:
            slots += 1
            sid = slot.get("id")
            ids_here.append(sid)
            color = by_id.get(sid)
            if color is None:
                errors.append(f"combo {number} references missing color {sid}")
                continue
            membership[sid].append(number)
            if slot.get("name") != color["name"]:
                errors.append(f"combo {number} color {sid} name mismatch")
            for key in ("display_hex", "scan_hex", "hex_cmyk"):
                if slot.get(key) != color[key]:
                    errors.append(f"combo {number} color {sid} {key} does not match the color record")
            if not HEX_RE.match(str(slot.get("page_sample_hex", ""))):
                errors.append(f"combo {number} color {sid} page_sample_hex is invalid")
            match = slot.get("label_ocr_match")
            if not isinstance(match, (int, float)) or not 0 <= match <= 1:
                errors.append(f"combo {number} color {sid} label_ocr_match out of range")
            delta = slot.get("delta_e")
            if not isinstance(delta, (int, float)) or delta < 0:
                errors.append(f"combo {number} color {sid} delta_e invalid")
        if len(ids_here) != len(set(ids_here)):
            errors.append(f"combo {number} repeats a color")

    if slots != EXPECTED_SLOTS:
        errors.append(f"expected {EXPECTED_SLOTS} color slots, found {slots}")
    if [combo.get("number") for combo in combos] != list(range(1, EXPECTED_COMBOS + 1)):
        errors.append("combination numbers are not 1..348 in order")

    # Two combinations per page for 2- and 3-color; one per page for 4-color.
    from collections import Counter

    for size, (_a, _b, page_lo, page_hi, per_page) in SIZE_PAGES.items():
        pages = [combo["page"] for combo in combos if combo.get("size") == size]
        counts = Counter(pages)
        expected_pages = set(range(page_lo, page_hi + 1))
        if set(counts) != expected_pages or any(count != per_page for count in counts.values()):
            errors.append(f"{size}-color page occupancy is not {per_page} per page from {page_lo} to {page_hi}")

    for cid, color in by_id.items():
        found = sorted(membership.get(cid, []))
        if color.get("appears_in") != found:
            errors.append(f"color {cid} appears_in does not match the combinations")

    errors.extend(_validate_csv(root, data, by_id))
    errors.extend(_validate_derived(root, data))
    errors.extend(_validate_preview(root))
    return errors


def _validate_csv(root: Path, data: dict, by_id: dict[int, dict]) -> list[str]:
    errors: list[str] = []
    color_rows = _read_colors_csv(root / "data" / "colors.csv")
    combo_rows = _read_combos_csv(root / "data" / "combinations.csv")
    if len(color_rows) != EXPECTED_COLORS:
        errors.append(f"colors.csv has {len(color_rows)} rows")
    if len(combo_rows) != EXPECTED_COMBOS:
        errors.append(f"combinations.csv has {len(combo_rows)} rows")

    expected_color_fields = [
        "id", "name", "c", "m", "y", "k", "hex_cmyk", "scan_hex", "display_hex",
        "ref_page", "combo_count", "appears_in", "note",
    ]
    if color_rows and list(color_rows[0].keys()) != expected_color_fields:
        errors.append(f"colors.csv columns are {list(color_rows[0].keys())}")

    expected_combo_fields = [
        "number", "size", "page",
        "color_1", "color_2", "color_3", "color_4",
        "display_hex_1", "display_hex_2", "display_hex_3", "display_hex_4",
        "hex_cmyk_1", "hex_cmyk_2", "hex_cmyk_3", "hex_cmyk_4",
        "positions", "confidence", "notes",
    ]
    if combo_rows and list(combo_rows[0].keys()) != expected_combo_fields:
        errors.append(f"combinations.csv columns are {list(combo_rows[0].keys())}")

    for row, color in zip(color_rows, data["colors"]):
        if int(row["id"]) != color["id"] or row["name"] != color["name"]:
            errors.append(f"colors.csv row does not match JSON color {color['id']}")
            continue
        for key in ("c", "m", "y", "k", "ref_page"):
            if int(row[key]) != color[key]:
                errors.append(f"colors.csv color {color['id']} {key} mismatch")
        for key in ("hex_cmyk", "scan_hex", "display_hex", "note"):
            if row[key] != color[key]:
                errors.append(f"colors.csv color {color['id']} {key} mismatch")
        appears = [int(part) for part in row["appears_in"].split()] if row["appears_in"] else []
        if appears != color["appears_in"]:
            errors.append(f"colors.csv color {color['id']} appears_in mismatch")
        if int(row["combo_count"]) != len(color["appears_in"]):
            errors.append(f"colors.csv color {color['id']} combo_count mismatch")
        padded = " ".join(f"{number:03d}" for number in color["appears_in"])
        if row["appears_in"] != padded:
            errors.append(f"colors.csv color {color['id']} appears_in is not zero-padded")

    for row, combo in zip(combo_rows, data["combinations"]):
        if int(row["number"]) != combo["number"]:
            errors.append(f"combinations.csv number {row['number']} is out of order")
            continue
        if int(row["size"]) != combo["size"] or int(row["page"]) != combo["page"]:
            errors.append(f"combinations.csv {combo['number']} size or page mismatch")
        if row["confidence"] != combo["confidence"] or row["notes"] != combo["notes"]:
            errors.append(f"combinations.csv {combo['number']} confidence or notes mismatch")
        if row["positions"] != "/".join(combo["positions"]):
            errors.append(f"combinations.csv {combo['number']} positions mismatch")
        for index in range(1, 5):
            slot = combo["colors"][index - 1] if index <= combo["size"] else None
            name = row[f"color_{index}"]
            display = row[f"display_hex_{index}"]
            cmyk = row[f"hex_cmyk_{index}"]
            if slot is None:
                if name or display or cmyk:
                    errors.append(f"combinations.csv {combo['number']} extra color in slot {index}")
            else:
                color = by_id[slot["id"]]
                if name != color["name"] or display != color["display_hex"] or cmyk != color["hex_cmyk"]:
                    errors.append(f"combinations.csv {combo['number']} slot {index} does not match JSON")
    return errors


def _validate_derived(root: Path, data: dict) -> list[str]:
    errors: list[str] = []
    for relative, expected in derived_outputs(data).items():
        path = root / relative
        if not path.exists():
            errors.append(f"missing derived file {relative}")
            continue
        actual = path.read_bytes() if isinstance(expected, bytes) else path.read_text(encoding="utf-8")
        if actual != expected:
            errors.append(f"{relative} is stale; run python scripts/generate_derived.py")
    ase_path = root / "data" / "derived" / "haishoku-rgb.ase"
    if ase_path.exists() and not any(error.startswith("data/derived/haishoku-rgb.ase") for error in errors):
        groups = parse_ase(ase_path.read_bytes())
        if len(groups) != 1 + EXPECTED_COMBOS:
            errors.append(f"RGB ASE has {len(groups)} groups")
        elif len(groups[0][1]) != EXPECTED_COLORS:
            errors.append("RGB ASE all-colors group does not hold 159 swatches")
        else:
            for group, combo in zip(groups[1:], data["combinations"]):
                if len(group[1]) != combo["size"]:
                    errors.append(f"RGB ASE {group[0]} has the wrong number of swatches")
                    break
                for entry, slot in zip(group[1], combo["colors"]):
                    channels = tuple(round(channel * 255) for channel in entry[2])
                    if channels != hex_rgb(slot["display_hex"]):
                        errors.append(f"RGB ASE {group[0]} {entry[0]} does not match display_hex")
                        break
    cmyk_path = root / "data" / "derived" / "haishoku-cmyk.ase"
    if cmyk_path.exists() and not any("haishoku-cmyk.ase" in error for error in errors):
        groups = parse_ase(cmyk_path.read_bytes())
        if groups and groups[0][1]:
            first = groups[0][1][0]
            expected = tuple(data["colors"][0][key] / 100 for key in ("c", "m", "y", "k"))
            if first[1] != "CMYK" or tuple(round(value * 100) for value in first[2]) != tuple(
                data["colors"][0][key] for key in ("c", "m", "y", "k")
            ):
                errors.append(f"CMYK ASE first swatch {first[2]} != {expected}")
    return errors


def _validate_preview(root: Path) -> list[str]:
    path = root / "assets" / "preview.png"
    if not path.exists():
        return ["missing assets/preview.png"]
    blob = path.read_bytes()
    if blob[:8] != b"\x89PNG\r\n\x1a\n" or len(blob) < 32:
        return ["assets/preview.png is not a PNG"]
    width, height = struct.unpack(">II", blob[16:24])
    errors = []
    if width < 1200 or height < 800:
        errors.append(f"assets/preview.png is {width}x{height}, expected a large hero")
    if not 20_000 <= len(blob) <= 2_000_000:
        errors.append(f"assets/preview.png size {len(blob)} is unexpected")
    return errors
