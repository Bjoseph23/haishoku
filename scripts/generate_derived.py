#!/usr/bin/env python3
"""Regenerate CSS, SCSS, Tailwind JSON, GPL, ASE, and the viewer data file.

Run from the repository root or from anywhere:

    python scripts/generate_derived.py

Source of truth: data/wada_colors_and_combinations.json and the two CSVs.
Do not hand-edit files under data/derived/ or viewer/palette-data.js.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from haishoku import ROOT, write_derived  # noqa: E402


def main() -> None:
    for path in write_derived():
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
