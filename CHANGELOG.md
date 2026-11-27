# Changelog

All notable changes to this project are documented here.

## 1.0.0 — 2026-11-27

First public release of the compilation.

- 159 named colors and 348 combinations: 120 of two colors, 120 of three, and 108 of four. Every combination is `verified-visual`.
- Each color carries the printed CMYK values, a naive CMYK-to-RGB hex (`hex_cmyk`), the raw scan (`scan_hex`), and a white-balanced screen color (`display_hex`).
- Etruscan Red (color 19) is recorded as K6, matching the reference swatch page. The back-index table prints K0.
- Combination order follows the page: left to right for two and three colors, and top, left, right, bottom for the four-color cross.
- Cross-checks: printed English labels agreed with the sampled swatch on 1,028 of 1,032 slots (the other four resolved by eye); the back index confirms 968 slots; membership matches [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) on all 1,032 slots.
- Palette viewer, CSS variables, SCSS map, Tailwind colors, GIMP palette, and Adobe swatch files generated from the JSON.
- Validation checks counts, hex values, references, and that the derived files match the source.
