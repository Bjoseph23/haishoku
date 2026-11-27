#!/usr/bin/env python3
"""Check the haishoku dataset and the files generated from it.

    python scripts/validate_data.py

Exits 0 when all of the following hold:

- 159 colors, numbered 1–159, and 348 combinations, numbered 1–348
- 120 two-color, 120 three-color, and 108 four-color combinations
- 1,032 color slots, each pointing at a color that exists
- every hex is #RRGGBB in uppercase
- printed CMYK values are integers from 0 to 100
- Etruscan Red is K6
- appears_in matches the combinations, in both directions
- the CSV files match the JSON
- derived CSS, GPL, ASE, Tailwind, and viewer files match a fresh generation
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from haishoku import EXPECTED_COLORS, EXPECTED_COMBOS, EXPECTED_SLOTS, validate  # noqa: E402


def main() -> int:
    errors = validate()
    if errors:
        print(f"{len(errors)} error(s):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(
        f"ok: {EXPECTED_COLORS} colors, {EXPECTED_COMBOS} combinations, "
        f"{EXPECTED_SLOTS} slots; CSV matches JSON; derived files are current"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
