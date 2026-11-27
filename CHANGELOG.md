# Changelog

All notable changes to this project are documented here.

## Unreleased — viewer

The use-case pages read like a printed color book.

- Every page reaches every other page. The desktop bar lists the four studios beside Palettes, Colors, Use cases, and About, and marks the page you are on. The phone menu groups Browse and Studios and has a Close button.
- The use-cases hub is a contents page. Outfit and Rooms lead with photographs from the studios and the default plate under each. Facade and Brand follow. Illustration and events are listed as uses of the plates, not as studios.
- The studios are spreads: the photograph on the left, a legend on the right in labeled groups (Look, Plate, On the figure or Surfaces, Find a combination). The plate in play is shown as equal chips with a round copy button on each. The stage shows a quiet placeholder while the photograph loads, and a "Try again" button if it fails.
- The combination picker works from the keyboard. Arrow keys move through the list and the stage follows, Home and End jump, and "Show more" replaces the 40-row cap. Studios accept an optional `#plate=176` in the URL. Old URLs open the same defaults.
- Room scenes are a proper tab list (arrow keys switch rooms). Shuffle roles now changes the roles on Rooms, Facade, and Brand. Before, the colors were re-sorted by lightness after the shuffle, so nothing moved.
- Type, spacing, radius, and motion are CSS tokens in `viewer/css/site.css`. Hex labels are 12px instead of 10px. Copy buttons have a 46px hit area and briefly show a check. Motion is short and stops under reduced motion.
- `scripts/sync_viewer_chrome.py` writes the same header, menu, and footer into all eight pages.
- README screenshots are retaken.

## 1.4.0 — 2026-11-27

The dataset is published on Kaggle as an analysis-ready package.

- New [`kaggle/`](kaggle/) folder with tidy tables. `colors.csv` adds sRGB channels, CIELAB and LCh, HSL, a hue family, and per-size usage counts. `combinations.csv` has one row per combination, and the long table `combination_colors.csv` has one row per slot. A Frictionless `datapackage.json` holds the schemas and keys, the data card is in `README.md`, and there is an executed starter notebook and a cover image.
- `scripts/build_kaggle_package.py` rebuilds the package from the canonical JSON and checks the counts, keys, nulls, hex format, and referential integrity. CI runs it and fails if `kaggle/` is out of date.
- The README has a "Get the data" section. CITATION.cff lists the Kaggle URL.
- The existing `data/` files and column names are unchanged.

## 1.3.0 — 2026-11-27

The photographic studios keep more of the cloth and the room.

- Recoloring runs in OKLab. The plate supplies the hue. The photograph supplies the folds. Near-black and near-white plates are lifted just enough that a shirt does not turn into a flat hole, and a multiply mix keeps weave on a rug or a blazer.
- Outfit masks are rebuilt so the collar, tie, blazer, trousers, and shoes are separate regions. Skin and hands are left out of the cloth. The blazer silhouette is feathered, and the shirt between the lapels is not painted as the jacket.
- The living-room rug follows the pile instead of a trapezoid, and the other room and facade masks are pulled back onto their objects. Curtains stay partly see-through. A lamp shade keeps its shading.
- Twenty-two looks (eleven women, eleven men) cover tee, polo, shirt, and knit, with and without a jacket or blazer, and jeans, chinos, or trousers. The controls still snap when a combination was not photographed.
- A cold outfit view transfers about 50 KB of images plus the shared 262 KB dataset. The studio asset folder is under a megabyte.
- The hem of each look follows the drop into the trousers, so a shadowed sleeve or cuff stays with the jacket. Silhouettes are anti-aliased with about a pixel of feather and no gray halo from the backdrop. The living-room rug continues under the sofa, and the kitchen counter stops at the cabinet.

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
