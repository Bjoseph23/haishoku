# Contributing

Thank you for helping Haishoku stay accurate. The dataset is a transcription of a printed book, so the most useful contributions are corrections of a color, a CMYK value, or a name, and improvements to the viewer and the docs.

The code of conduct is [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Report a data error

Open a [data-correction issue](https://github.com/Bjoseph23/haishoku/issues/new?template=data_correction.md) with:

- The combination number or the color id and printed name.
- The field you believe is wrong (`display_hex`, a CMYK value, the order, the name).
- What you believe the page shows, described in words.

Please do not attach the book PDF, page scans, or photographs of the plates. A description is enough for the maintainer to check, and the book stays with its publisher.

Spellings that look unusual (Cerulian, Antwarp, Vandar Poel's, Vistoris, Kronbergs) are the spellings printed in the Seigensha edition and are kept on purpose.

## Change the data

1. Edit `data/wada_colors_and_combinations.json` and the matching cells in `data/colors.csv` and `data/combinations.csv`. Keep the columns. The validator checks that the three files agree.
2. Regenerate the derived files and the viewer data:

   ```bash
   python scripts/generate_derived.py
   ```

3. If the specimen sheet should change, install Pillow and run:

   ```bash
   pip install -r scripts/requirements.txt
   python scripts/generate_preview.py
   ```

4. Check everything:

   ```bash
   python scripts/validate_data.py
   ```

`validate_data.py` confirms 159 colors, 348 combinations, 1,032 slots, uppercase hex, CMYK range, the Etruscan Red K6 note, that every combination points at real colors, that the CSVs match the JSON, and that the derived files are the ones the script would write today. A hand-edited CSS file will fail the check. That is what we want.

## Change the viewer or the docs

The viewer is `viewer/index.html`. It reads `viewer/palette-data.js`, which is generated. Change the page, then regenerate the data file if the JSON changed, and preview it through a local server: run `python3 -m http.server 8000` from the repository root and open http://localhost:8000/viewer/. A double-click (`file://`) does not work, because the pages are ES modules and the studios fetch their catalogs. The header, menu, and footer are shared: edit `scripts/sync_viewer_chrome.py` and run it, rather than editing the eight pages by hand.

Docs live in `docs/` and the README. If you rename a column, update the data dictionary, `llms.txt`, and the validator together.

## Pull requests

- Describe the correction in the pull request, with the combination or color id.
- Keep the commit focused. A data fix and an unrelated redesign are easier to review apart.
- Do not add the book, scans, or personal wardrobe notes.
- The validation workflow runs on the pull request. `python scripts/validate_data.py` should pass before you ask for review.

Maintainer: Bill Mageni ([@Bjoseph23](https://github.com/Bjoseph23)).
