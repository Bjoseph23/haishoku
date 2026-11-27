# Methodology

How the 159 colors and 348 combinations in this repository were read, checked, and where they are still approximate.

The source edition is Seigensha’s *A Dictionary of Color Combinations* (配色事典, July 2010, ISBN 978-4-86152-247-5), the bilingual republication of Sanzo Wada’s *Haishoku Soukan* (配色総鑑, 1933–34). Values were read from page images of a 356-page scan of that book (an Internet Archive scan; the publisher lists the book itself at 352 pages). This repository does not include the scan or the book.

## Where things are in the scan

| Pages | Contents |
| --- | --- |
| 28–87 | 120 two-color combinations, two per page. Numbers 1–120. |
| 90–149 | 120 three-color combinations, two per page. Numbers 121–240. |
| 152–259 | 108 four-color combinations, one per page. Numbers 241–348. |
| 262–283 | Back index. |
| 285–351 | The 159 reference swatches. |

Four-color plates are printed as a cross. They are stored top, left, right, bottom. Two- and three-color plates are stored left to right. That is the order of `color_1` … `color_4` and of `combinations[].colors`.

## Reading a swatch

Each swatch on the combination pages was sampled from the rendered page image. The English label printed under the swatch was read with Tesseract at 300 dpi. The sample was then matched to one of the 159 reference colors by comparing it with that color’s own scanned swatch from the reference pages, using CIEDE2000. The distance is stored as `delta_e` on the slot. In this release those distances run from 0.3 to 10.1.

The hex sampled from the combination page, before matching, is `page_sample_hex`. The reference swatch’s own scan is `scan_hex`. They are related measurements of two printings of the “same” color, and they are not forced to be equal.

### Labels and swatches

For 1,028 of the 1,032 slots, the printed English label and the sampled swatch indicated the same reference color. The other four labels were too damaged for OCR to settle. They are one slot in combination 050 (Ivory Buff), one slot in combination 112 (Black), and both slots in combination 132 (Citrine and Sulphur Yellow). Those four were resolved from the swatch color and the back index, then checked by eye on the page.

`label_ocr_match` is a separate number: the string similarity between the OCR output and the color name, from 0 to 1. A score below 1.0 usually means the OCR dropped an apostrophe, punctuation, or letters from a short word (`Blue`, `Black`, `Violet`). Many slots with a score below 1.0 are among the 1,028 that agreed. The field records how clean the OCR string was. It does not, by itself, mean the color was reassigned.

### Two further checks

The back index was read again with OCR. It confirms 968 of the 1,032 slots. The combination `notes` record the fraction for that row (`back-index (OCR) confirms 3/4` and similar). The slots the index OCR missed are misses, not disagreements: the index line was not recovered, and the color assignment did not change because of it.

An independent public dataset, [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations), records which colors appear in which combinations. It matches this dataset on all 1,032 slots, including the choice between Eugenia Red variants a and b and between Grayish Lavender variants a and b.

Every combination in this release has `confidence` set to `verified-visual`. Nothing is left unresolved.

## What the visual pass corrected

An earlier extraction of the same book used the PDF’s text layer. It was incomplete, and where it was filled in it was sometimes wrong. The visual pass replaced it. The notes below are the record of that replacement, so a difference between an old text-layer file and this release can be traced.

Of the 348 combinations, that earlier file had 151 rows it treated as resolved (98 “likely”, 53 “probable”) and 197 it left unresolved.

Of those 151:

- 113 were exactly right.
- 3 had the right colors in the wrong order: 106, 201, and 309.
- 35 were wrong. Most of the errors were a page-pairing shift, where colors leaked between the two combinations printed on the same page.

The 35 are:

- The pairs 9/10, 11/12, 33/34, 59/60, 77/78, 79/80, 95/96, 109/110
- The trio 112/113/114
- And 179, 180, 181, 200, 204, 288, 290, 301, 304, 314, 319, 321, 336, 337, 338, 344

Name confusions that the text layer mixed up, and that the swatch match separated:

- Olive and Olive Buff
- Orange and Yellow Orange
- Green, and Benzol Green or Rainette Green
- Yellow and Sulphur Yellow
- Lemon Yellow and Pale Lemon Yellow
- Blue and Deep Lyons Blue
- Violet and Dusky Madder Violet

## The color records

Each of the 159 colors has the CMYK recipe printed with its reference swatch, a naive conversion of that recipe to RGB (`hex_cmyk`), the raw scan of the swatch (`scan_hex`, and `scan_rgb`), and a white-balanced copy of the scan (`display_hex`).

`display_hex` is the recommended screen color. The balance is global: it is chosen so the paper reads as white. It tracks the printed book more closely than `hex_cmyk`, which has no knowledge of the paper or the ink and comes out oversaturated. `hex_cmyk` stays in the file so notes written against the older conversion still line up.

`appears_in` lists every combination that contains the color, ascending. The CSV also stores `combo_count`, which is the length of that list, and `ref_page`.

### Etruscan Red

Color 19, Etruscan Red, is **C16 M80 Y74 K6**. The reference swatch page prints K6. The back-index table prints K0. The other 158 CMYK recipes match their reference pages. This dataset follows the swatch page, and the color’s `note` records the correction.

### Variants

The book gives two recipes and two swatches to Eugenia Red and to Grayish Lavender. They are stored as separate colors (ids 12 and 13, and ids 134 and 135). `base` holds the shared name. The combination note names the variant the swatch matched.

## What is still approximate

- **No combination is unresolved.** The open question is how close a screen hex is to the printed ink, not which color the plate contains.
- **`display_hex` is one scan with one white balance.** Expect a small cast. Very dark colors move the most. Deep Indigo (`#21192D`), Black (`#1E1D21`), and Dull Violet Black (`#261B39`) are distinct recipes and are hard to tell apart on a display. If a use depends on which one it is, use the name and the CMYK, and treat the three hexes as a neighborhood.
- **White’s `display_hex` is `#FDFDFD`.** The balanced scan does not land on monitor white. `hex_cmyk` for White, which is 0 0 0 0, is `#FFFFFF`.
- **A screen hex is not a print specification.** The printed specification is `c m y k`. Converting `display_hex` into a CMYK profile will not reconstruct the book.
- **Japanese names were not added.** An OCR pass over them was too noisy to publish without a manual reading. A careful addition of those names, checked against the plates, would be a good later version.
- **Historical English spellings are kept** as printed, including Cerulian, Antwarp, Vandar Poel's, Vistoris, and Kronbergs.

## What this repository does not contain

The book PDF, the page scans, and the publisher’s layout are not part of the dataset. The cover image in `assets/` is a reduced publisher image, included so the edition can be identified, and it is not covered by the data license. See [../assets/ATTRIBUTION.md](../assets/ATTRIBUTION.md).
