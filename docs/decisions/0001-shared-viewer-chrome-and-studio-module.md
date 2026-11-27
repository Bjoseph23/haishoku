# 0001. Shared viewer chrome and studio module, no build step

Date: 2026-11-27. Status: accepted.

## Context

The eight viewer pages each had a hand-copied header, menu, and footer, and the copies had drifted apart: the desktop bar left out the studios. The four studios each built their own panel markup. The viewer must stay a static GitHub Pages site with no bundler.

## Decision

- `scripts/sync_viewer_chrome.py` (standard library) writes one header, menu, and footer into every page. The HTML stays static, so the navigation works before any script runs.
- `viewer/js/studio.js` holds the stage, the plate legend, assignment buttons, copy feedback, the `#plate=` hash, and the loading and error states. `viewer/js/scene-studio.js` runs Room and Facade from one module. The page scripts only configure them.

## Consequences

Change the navigation in the script and run it, not in the pages. CI does not run the script. A page edited by hand will be overwritten the next time someone syncs.
