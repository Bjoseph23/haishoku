# Haishoku: Sanzo Wada Color Combinations

**348 color combinations and 159 named colors from Sanzo Wada's *Haishoku Sōkan* (配色総鑑, 1933–34), as reprinted in Seigensha's *A Dictionary of Color Combinations* (2010). Every swatch was checked by eye. The data has tidy tables with CMYK, RGB, CIELAB and HSL values.**

Sanzo Wada (和田三造, 1883–1967) was a Japanese painter, costume designer and color researcher. He founded the Japan Standard Color Association (now the Japan Color Research Institute), won the 1955 Academy Award for color costume design for *Gate of Hell*, and was named a Person of Cultural Merit in 1958. His six-volume study *Haishoku Sōkan* laid out color harmonies as a working reference. Seigensha's 2010 pocket edition, which has 348 of those combinations, made the work famous again with designers around the world.

This dataset is an independent, verified transcription of that edition, made for analysis, design tools and machine learning. It is useful for fashion, interiors, architecture, branding, data visualisation, generative art and color-harmony research.

## Files

| File | Rows | Grain | Use it for |
| --- | ---: | --- | --- |
| `colors.csv` | 159 | One row per named color | Color attributes: printed CMYK, three hex readings, RGB, CIELAB/LCh, HSL, hue family, usage counts |
| `combinations.csv` | 348 | One row per combination | Size (2, 3 or 4), book page, layout, color ids, names and hexes |
| `combination_colors.csv` | 1,032 | One row per color slot in a combination | The **join table** (`combination_number` → `combinations.number`, `color_id` → `colors.id`), with measurement fields |
| `combinations_wide.csv` | 348 | One row per combination, with up to 4 slot columns | The same layout as the GitHub repo, good for spreadsheets |
| `wada_colors_and_combinations.json` | — | Nested canonical file | Code and AI assistants. It has the per-slot sample, OCR score and ΔE |
| `datapackage.json` | — | Frictionless Data descriptor | Schemas, types, primary and foreign keys |
| `haishoku_starter.ipynb` | — | Starter notebook | Loading, joins and charts |

### Entity relationship

```
colors (id PK) 1 ──< combination_colors (combination_number, slot PK) >── 1 combinations (number PK)
```

## Columns

### `colors.csv`

| Column | Type | Description |
| --- | --- | --- |
| `id` | int | Color number 1–159, in the order of the book's reference swatches. Primary key. |
| `name` | str | English name as printed (historical spellings kept, e.g. *Cerulian Blue*). Unique. |
| `base` | str | `name` without the `(variant a/b)` suffix. Only Eugenia Red and Grayish Lavender have variants. |
| `c`, `m`, `y`, `k` | int | Printed process-ink percentages, 0–100. |
| `hex_cmyk` | hex | Naive CMYK→RGB conversion. It runs more saturated than the book. |
| `scan_hex` | hex | Raw scanned color of the reference swatch, which has a blue-gray paper cast. |
| `display_hex` | hex | **Recommended screen color.** The reference swatch, white-balanced so the paper reads as white. |
| `display_r`, `display_g`, `display_b` | int | sRGB channels of `display_hex`, 0–255. |
| `scan_r`, `scan_g`, `scan_b` | int | sRGB channels of `scan_hex`, 0–255. |
| `lab_l`, `lab_a`, `lab_b` | float | CIELAB (D65) of `display_hex`. |
| `lch_c`, `lch_h` | float | CIE LCh chroma and hue angle (degrees) of `display_hex`. |
| `hsl_h`, `hsl_s`, `hsl_l` | float | HSL hue in degrees, with saturation and lightness in %, of `display_hex`. |
| `hue_family` | str | A rule-based family label (red, pink, orange, brown, yellow, olive, green, cyan, blue, violet, magenta, gray, black, white). It is derived from HSL, so treat it as a convenience label, not an authority. |
| `is_variant` | bool | True for the four variant colors (ids 12, 13, 134, 135). |
| `ref_page` | int | Page of the reference swatch in the scanned edition (285–351). |
| `combo_count` | int | Number of combinations that use this color. |
| `combo_count_2`, `combo_count_3`, `combo_count_4` | int | The same count, split by combination size. |
| `appears_in` | str | Space-separated, zero-padded combination numbers. |
| `note` | str | Empty except for id 19, Etruscan Red, whose K value was corrected from 0 to 6 to match its swatch page. |

### `combinations.csv`

| Column | Type | Description |
| --- | --- | --- |
| `number` | int | Combination number 1–348, in book order. Primary key. |
| `size` | int | Number of colors: 2 (numbers 1–120), 3 (121–240) or 4 (241–348). |
| `page` | int | Page in the scanned edition. |
| `positions` | str | Layout on the plate: `left/right`, `left/middle/right`, or `top/left/right/bottom` for the four-color cross. |
| `color_ids` | str | Space-separated color ids in book order. |
| `color_names` | str | Color names in book order, separated by ` \| `. |
| `display_hexes` | str | Space-separated `display_hex` values in book order. |
| `confidence` | str | `verified-visual` for every row. |
| `notes` | str | Back-index cross-check, e.g. `back-index (OCR) confirms 3/4`, plus a note on which variant was picked where one applies. |

### `combination_colors.csv`

| Column | Type | Description |
| --- | --- | --- |
| `combination_number` | int | Foreign key → `combinations.number`. |
| `slot` | int | 1-based position in book order. Together with `combination_number`, this forms the primary key. |
| `position` | str | `left`, `middle`, `right`, `top` or `bottom`. |
| `color_id` | int | Foreign key → `colors.id`. |
| `color_name` | str | Copy of `colors.name`, kept for convenience. |
| `display_hex` | hex | Copy of `colors.display_hex`. |
| `page_sample_hex` | hex | Color sampled from this swatch on the combination page, before matching. |
| `label_ocr_match` | float | 0–1 string similarity between the OCR of the printed label and `color_name`. |
| `delta_e` | float | CIEDE2000 distance between the page sample and the matched reference swatch (0.3–10.1). |

## Quick start

```python
import pandas as pd
colors = pd.read_csv("colors.csv")
combos = pd.read_csv("combinations.csv")
slots  = pd.read_csv("combination_colors.csv")

tidy = (slots.merge(colors[["id", "hue_family", "lab_l", "lab_a", "lab_b"]],
                    left_on="color_id", right_on="id")
             .merge(combos[["number", "size", "page"]],
                    left_on="combination_number", right_on="number"))
# Most-used colors
print(colors.nlargest(10, "combo_count")[["name", "display_hex", "combo_count"]])
```

Example analyses:
- Which colors does Wada pair most often? Build a co-occurrence network from `combination_colors`.
- How much lightness contrast (ΔL\*) or hue distance is there within a combination, and how does it change with size?
- Cluster the palettes in CIELAB, or train a palette recommender or generator.
- Compare warm and cool balance across the 2-, 3- and 4-color sections.
- Simulate color-vision deficiency on each palette to check accessibility.

## Provenance and methodology

- **Source work:** Sanzo Wada, *Haishoku Sōkan* (配色総鑑), Japan Standard Color Association, 1933–34.
- **Edition transcribed:** *A Dictionary of Color Combinations* (配色事典), Seigensha Art Publishing, July 2010, ISBN 978-4-86152-247-5.
- **Collection:** each swatch on the combination pages was sampled from page images. The English label under it was read by OCR (Tesseract, 300 dpi), and the sample was matched to the 159 reference swatches by CIEDE2000. For 1,028 of the 1,032 slots, the label and the swatch agreed. The other four were settled from the swatch color and the back index, then checked by eye.
- **Cross-checks:** the book's back index (OCR) confirms 968 of the 1,032 slots, and the slots it misses are OCR misses, not disagreements. The independent public dataset [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations) agrees on 1,032 of 1,032 color memberships.
- **Corrections:** Etruscan Red is K6, as its swatch page shows, not K0 as the index table shows. An earlier text-layer extraction had 35 wrong rows and 3 rows in the wrong order. All of them are fixed here.
- **Derived values:** RGB, CIELAB (D65, sRGB), LCh, HSL and `hue_family` are computed from `display_hex` by `scripts/build_kaggle_package.py` in the GitHub repo.
- **Full methodology:** [docs/METHODOLOGY.md](https://github.com/Bjoseph23/haishoku/blob/main/docs/METHODOLOGY.md)

### Validation (run on every build)

- 159 unique color ids (1–159) and names. 348 unique combination numbers (1–348), split 120 / 120 / 108 by size.
- 1,032 slots, no duplicate `(combination_number, slot)` pairs, and no repeated color within a combination.
- No nulls in key or required fields. Every hex matches `^#[0-9A-F]{6}$`. CMYK values are within 0–100.
- Referential integrity: every `color_id` and `combination_number` resolves. `combo_count` equals the number of slot rows, and the counts sum to 1,032.
- The repo validator also checks that the CSVs match the canonical JSON.

## Known limitations

- `display_hex` comes from one scan with one global white balance, so it is close to the print but not exact. Very dark colors (Deep Indigo, Black, Dull Violet Black) are hard to tell apart on screen.
- A screen hex is not a print spec. For print, use the printed `c m y k` values.
- White's `display_hex` is `#FDFDFD`, not `#FFFFFF`.
- Japanese color names are not included yet.
- The 348 combinations are the Seigensha selection, not all of the original six volumes.
- `hue_family` is a heuristic label.
- Update frequency: about once a year, or sooner when there are corrections. The data is stable, and new versions only follow corrections or additions such as Japanese names. See the repo's CHANGELOG.

## License and attribution

- **This compilation** (tables, derived values, documentation) is licensed under **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. You may use, share and adapt it, including commercially, as long as you credit it.
- The color combinations and names are Sanzo Wada's work from 1933–34. Please credit **Sanzo Wada** and the Seigensha edition. This project is not affiliated with Seigensha, and no book scans, PDF or publisher layout are included. If you love the plates, [buy the book](https://en.seigensha.com/books/978-4-86152-247-5/).

## Citation

> Mageni, B. (Bjoseph23) (2026). *Haishoku: a verified data compilation of Sanzo Wada's color combinations* (Version 1.0.0) [Data set]. https://github.com/Bjoseph23/haishoku. Based on Sanzo Wada, *Haishoku Sōkan* (1933–34), and *A Dictionary of Color Combinations* (Seigensha, 2010).

```bibtex
@dataset{mageni_2026_haishoku,
  author    = {Mageni, Bill},
  title     = {Haishoku: a verified data compilation of Sanzo Wada's color combinations},
  year      = {2026},
  version   = {1.0.0},
  publisher = {GitHub},
  url       = {https://github.com/Bjoseph23/haishoku},
  note      = {Based on Sanzo Wada, Haishoku Soukan (1933--34); A Dictionary of Color Combinations, Seigensha (2010). License CC BY 4.0}
}
```

## Links

- Kaggle: https://www.kaggle.com/datasets/billmageni/haishoku-sanzo-wada-color-combinations
- GitHub (source, scripts, swatch files for CSS, Tailwind, ASE and GPL): https://github.com/Bjoseph23/haishoku
- Live palette viewer, outfit studio and room studio: https://bjoseph23.github.io/haishoku/viewer/
