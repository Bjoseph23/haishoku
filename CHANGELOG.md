# Changelog

All notable changes to this project are documented here.

## 1.3.0 — 2026-11-27

The photographic studios keep more of the cloth and the room.

- Recoloring runs in OKLab. The plate supplies the hue. The photograph supplies the folds. Near-black and near-white plates are lifted just enough that a shirt does not turn into a flat hole, and a multiply mix keeps weave on a rug or a blazer.
- Outfit masks are rebuilt so the collar, tie, blazer, trousers, and shoes are separate regions. Skin and hands are left out of the cloth. The blazer silhouette is feathered, and the shirt between the lapels is not painted as the jacket.
- The living-room rug follows the pile instead of a trapezoid, and the other room and facade masks are pulled back onto their objects. Curtains stay partly see-through. A lamp shade keeps its shading.
- Twenty-two looks (eleven women, eleven men) cover tee, polo, shirt, and knit, with and without a jacket or blazer, and jeans, chinos, or trousers. The controls still snap when a combination was not photographed.
- A cold outfit view transfers about 50 KB of images plus the shared 262 KB dataset. The studio asset folder is under a megabyte.

## 1.2.0 — 2026-11-27

Outfit studio, room studio, and the facade now recolor photographs instead of flat drawings.

- Twelve full-length studio looks (six women, six men) and six interior or facade photographs, generated for this project and released under CC BY 4.0. See CREDITS.md.
- A mask keeps skin, hair, and the backdrop, and tints cloth or a wall while keeping the shading.
- Garment controls snap to the nearest photographed look. Shuffle, per-region reassignment, presets, the combination picker, and hex copy buttons stay.
- A cold outfit load is a few hundred kilobytes. The asset folder is about half a megabyte.

## 1.1.0 — 2026-11-27

The viewer is a set of static pages on the warm-paper design.

- Palettes keep search, size filters, book versus CMYK, and copying a whole plate. Each chip now shows its hex and a button that copies only that code.
- New pages: Colors, Use cases, About, Outfit studio, Room studio, Facade, and Brand and poster. Navigation is a bar on a wide screen and a bottom sheet on a narrow one. Dark mode is a toggle.
- Outfit studio maps a combination onto a flat figure (shirt, polo, tee, or knit; blazer or jacket; trousers, chinos, or jeans; shoes; tie or pocket square), with presets and per-garment overrides.
- Room studio colors living room, bedroom, kitchen, patio, and bar. The lightest color starts on the large surfaces.
- The dataset files are unchanged. Page scripts are ES modules, so the viewer is opened from GitHub Pages or a local static server.

## 1.0.0 — 2026-11-27

First public release of the compilation.

- 159 named colors and 348 combinations: 120 of two colors, 120 of three, and 108 of four. Every combination is `verified-visual`.
- Each color carries the printed CMYK values, a naive CMYK-to-RGB hex (`hex_cmyk`), the raw scan (`scan_hex`), and a white-balanced screen color (`display_hex`).
- Etruscan Red (color 19) is recorded as K6, matching the reference swatch page. The back-index table prints K0.
- Combination order follows the page: left to right for two and three colors, and top, left, right, bottom for the four-color cross.
- Cross-checks: printed English labels agreed with the sampled swatch on 1,028 of 1,032 slots (the other four resolved by eye); the back index confirms 968 slots; membership matches [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) on all 1,032 slots.
- Palette viewer, CSS variables, SCSS map, Tailwind colors, GIMP palette, and Adobe swatch files generated from the JSON.
- Validation checks counts, hex values, references, and that the derived files match the source.
