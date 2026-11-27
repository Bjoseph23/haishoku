# Using the combinations

Wada’s plates are specimens. Each color in a combination is printed at the same size, so you can see the relationship. A room, a garment, a poster, or a screen gives those colors unequal areas. That assignment is the design.

The dataset is a shared reference for anyone choosing color together: stylists, interior designers, architects, graphic designers, product designers, illustrators, people planning an event, and developers. The steps below are practical. They are application advice. They are not a claim about a rule printed in the 1933 book.

## A proportion to start from

**60 / 30 / 10.** Give about 60% of the surface to the quietest or largest field, 30% to the supporting color, and 10% to the accent. Then move the numbers if the combination asks for it.

- A very dark or very bright partner often wants less than 30%. A coat in Deep Indigo with a Grenadine Pink scarf is closer to 85 / 15, and it is still combination 006.
- Two colors of similar lightness, such as English Red and Cerulian Blue (combination 001), can sit nearer 50 / 50 as adjacent shapes. They are a poor choice for small text on a colored ground: their contrast ratio is about 1:1.
- Four colors still need a dominant. Pick one field for the 60%, one for the 30%, and let the other two share the last 10%, or give the sharpest color the whole 10% and use the fourth as a thin line.

Book order (left to right, or top / left / right / bottom) is the order of the plate. It is not a ranking of importance. Say the proportion out loud when you hand the palette to someone else.

**Temperature.** Many of the plates put a warm color against a cool one, or a clear color against a grayed one. When you assign area, the grayed or lighter color usually makes the better large field, and the clearer color makes the better accent. Swap them when you want the room or the poster to feel hotter.

**Value.** If every color in the plate is light (combination 176) or the accent is one of the three near-blacks, the contrast that matters is the one you add for text and for small labels. Check it. Do not assume a beautiful plate is a readable interface.

Contrast ratios below use the WCAG relative-luminance definition against `display_hex`. They are rounded to one decimal. Recalculate if you change the hex.

| Pair | Ratio | Reads as |
| --- | --- | --- |
| Deep Indigo `#21192D` on Seashell Pink `#FEDFCF` | 13.4:1 | Small text |
| Grenadine Pink `#FA784A` on Deep Indigo `#21192D` | 6.3:1 | Small text |
| Carmine `#CA1A2A` on Cream Yellow `#FFC86A` | 3.7:1 | Large text or a button, not body text |
| Yellow `#FFEB01` on the dataset’s White `#FDFDFD` | 1.2:1 | A shape, not text |
| English Red `#E45B1E` on Cerulian Blue `#1C93B2` | 1.0:1 | Adjacent fields, not text |

## Fashion and styling

Use a two-color plate when the outfit has one clear relationship, and a three-color plate when a third piece (a shirt, a lining, a bag) should belong to the same idea.

**Combination 006**, Deep Indigo `#21192D` and Grenadine Pink `#FA784A`. The indigo carries the coat, the suit, or the dress. The pink is the scarf, the piping, or the shoe. At 6.3:1 the pink still reads as a mark on the dark ground, so a monogram or a top-stitch can use it.

**Combination 001**, English Red `#E45B1E` and Cerulian Blue `#1C93B2`. Similar in lightness, so they want similar-sized blocks: a jacket and a skirt, two scarves, a color-blocked knit. A thin red line on a blue ground will shimmer and disappear. Give both colors real area.

Keep the printed names when you write the combination down for a collaborator. “Cerulian” is how the book spells it, and it is how the dataset keys it.

## Interior design

Pick the plate from the light in the room. A north-facing room can take a warmer accent. A room that is already full of oak and brass may want the accent to be the cool color, so the wood can be the 60%.

**Combination 176**, left to right: Calamine Blue `#86D6DE`, Hermosa Pink `#FACDDE`, Seashell Pink `#FEDFCF`.

- 60% Seashell Pink: walls, or the largest upholstery.
- 30% Calamine Blue: the sofa, the curtain, or the floor tile.
- 10% Hermosa Pink: cushions, a lamp, the edge of a tray.

All three are light. Text on them, including a house number or a woven label, wants a dark from outside the plate or from another combination. Deep Indigo `#21192D` on Seashell Pink is about 13.4:1. Black `#1E1D21` is similar on screen and different in ink (`20 10 15 100` against Deep Indigo’s `100 92 52 60`). Name which dark you specified.

**Combination 122**, Benzol Green `#028884`, Cream Yellow `#FFC86A`, Carmine `#CA1A2A`. A kitchen or a café. Cream Yellow on the large surfaces, Benzol Green on the joinery, Carmine on a pot or a single chair. Carmine on Cream Yellow is about 3.7:1, enough for a large word on a sign and not enough for a paragraph.

## Architecture and exteriors

Exterior color is mostly the large field plus one or two moments: a door, a frame, a soffit, a sign. Weathering and the paint manufacturer’s fan will move the hex. Treat `display_hex` as the target you match in a fan deck, and record the fan-deck code next to it once you have matched it. The hex will not be the paint.

**Combination 347**, the cross: Sea Green `#24AD94` (top), Helvetia Blue `#1B4F9E` (left), Lilac `#C18BBD` (right), Olive Yellow `#B4A039` (bottom). One reading: Olive Yellow as the rendered wall (the 60%), Helvetia Blue as the window frames (the 30%), Sea Green as the door, Lilac as a thin metal edge. Another reading, for a shadier elevation, makes Helvetia Blue the wall and keeps Olive Yellow for the door so the entry stays warm.

Sample the real daylight on the elevation before you commit. A north wall and a west wall will not show the same plate.

## Branding and graphic design

A combination is a palette with a built-in relationship, which is what a small identity needs. Write the combination number into the brand guidelines so the next person pulls the same row.

**Combination 001** as a two-color identity: Cerulian Blue `#1C93B2` for the field and the wordmark’s ground, English Red `#E45B1E` for a seal, a sticker, or a single rule. Because the two colors have almost the same lightness, do not set the red wordmark directly on the blue. Set the wordmark in a deep neutral, or knock the wordmark out of a red shape that sits on the blue.

**Combination 257**, the cross: Blue `#1C66CE`, Spectrum Red `#E21D15`, Aconite Violet `#AB69B5`, Orange Yellow `#FFB60B`. This is a poster palette. Give Orange Yellow or Blue the large ground, and let Spectrum Red be the one object the eye hits. Using all four at equal area recreates the specimen and flattens the hierarchy. That can be the right reference to the book. It is a busy cover.

Leave the historical spellings in the guideline. A “corrected” Cerulean will not match the file, the CSS variable, or a later search.

## Web and UI

Use the plate for surfaces, illustration, and marketing sections. Use a checked pair for text.

A calm marketing page from combination 176:

- Page background Seashell Pink `#FEDFCF`.
- A band or a card in Calamine Blue `#86D6DE`.
- A small link, a chart mark, or an illustration accent in Hermosa Pink `#FACDDE`.
- Body text in Deep Indigo `#21192D` (about 13.4:1 on Seashell Pink).

Do not set Yellow `#FFEB01` as text on White `#FDFDFD` (about 1.2:1). Yellow in these plates is a field or a large numeral.

CSS, once `data/derived/colors.css` is hosted with the site:

```css
body {
  background: var(--haishoku-seashell-pink);
  color: var(--haishoku-deep-indigo);
}
.band { background: var(--haishoku-calamine-blue); }
.mark { background: var(--haishoku-hermosa-pink); }
```

The viewer’s “CMYK colors” toggle is the naive conversion. It is the wrong hex for a production stylesheet. Use `display_hex` / the CSS variables.

Focus states, form errors, and chart series that must be distinguished by more than hue need a check beyond the plate. If two swatches in the chosen combination are close in lightness, give one of them a pattern, an underline, or a label. Do not rely on the hue alone.

## Illustration

The plate is a limited box, which is the useful part. Pick the combination first and mix only inside it: the three (or four) hexes, plus tints you derive by mixing those hexes with each other or with the paper. Bringing in a fourth bright color from another plate breaks the set. If the picture needs a neutral, prefer one that the combination already contains, or a tint of its darkest color toward white.

Combination 014, Naples Yellow `#FFECAC` and Spinel Red `#E67191`, is a gentle pair for a figure against a ground. Combination 022, Deep Lyons Blue `#1C2E82` and Yellow `#FFEB01`, is the high-chroma pair: the yellow wants to be the lit object, the blue the field around it.

For print illustration, specify the book’s CMYK for flat areas of a named color, and proof it. The on-screen `display_hex` is the reference for the monitor, not the plate.

## Product design

On a physical product the hex is a target for a material sample: plastic, powder coat, textile, glaze. Match `display_hex` under the light the product will be sold under, then record the supplier’s code. The code, not the hex, is what gets reordered.

Combination 193, Light Porcelain Green `#1E8E89`, Naples Yellow `#FFECAC`, Grenadine Pink `#FA784A`, maps cleanly onto a small object: the body in Light Porcelain Green, a large secondary surface in Naples Yellow, a control or a seal in Grenadine Pink. That is a 60/30/10 split the hand can feel.

The three near-blacks matter here. A “black” housing specified as Deep Indigo will be a blue-black in the CMYK recipe (`100 92 52 60`) and will not match a pigment made from color 159, Black (`20 10 15 100`), even when the two hexes look alike on a phone.

## Data visualization

A Wada combination is a categorical palette with a point of view. It is a good choice when the chart is part of an editorial design and the series are few.

- Prefer a combination whose colors separate in lightness, not only in hue. Combination 240 (Fresh Color `#F88E71`, Cerulian Blue `#1C93B2`, Yellow `#FFEB01`) separates more reliably than combination 176, whose three pastels can collapse for anyone comparing by lightness.
- Four series is the maximum a single plate was built for. Past that, repeat with a second combination and label both, or the chart stops being that plate.
- Do not use Deep Indigo, Black, and Dull Violet Black as three different series. On screen they are one series.
- Put the category name on the mark when the design can afford it. Several plates fail a hue-only test on purpose: they are harmonies, and harmonies sit close together.

Sequential data (a magnitude from low to high) wants a light-to-dark ramp of one hue. These combinations are not ramps. Build a ramp from a single named color toward Seashell Pink or toward Deep Indigo if you need one, and say that you did.

## Weddings and events

Guests remember a few large surfaces: linen, flowers, paper, a wall. Choose one combination and spend it there. A second combination for the dinner and another for the invitation is how a palette turns into a catalog.

**Combination 014**, Naples Yellow `#FFECAC` and Spinel Red `#E67191`. Naples Yellow as the linen and the paper (the 60% or more), Spinel Red as the flowers, the ribbon, and the type of a short word. Long text on the yellow wants a dark, not the pink.

**Combination 300**, the cross: Calamine Blue `#86D6DE` (top), Cream Yellow `#FFC86A` (left), Grenadine Pink `#FA784A` (right), Turquoise Green `#CAE7D8` (bottom). Cream Yellow linen, Calamine Blue glassware, Grenadine Pink as the one floral note, Turquoise Green as a thin edge on the menu. Naming the combination number on the shared mood board (`Haishoku 300`) keeps a florist, a printer, and a family on the same four hexes.

Flowers and food will not hit a hex exactly. The hex is the agreement you made. The stem and the citrus will land near it.

## Writing the choice down

When you pass a combination to another person or to an AI assistant, include:

1. The combination number.
2. The printed names, spellings unchanged.
3. `display_hex` for screen work, or `c m y k` for print.
4. The proportion you actually want, in the order of the surfaces (“walls, sofa, cushion”), not only the book order.

That is enough for someone to find the same row in the viewer, the CSV, or the JSON.
