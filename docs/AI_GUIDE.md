# Using Haishoku with an AI assistant

The dataset is a closed list: 159 named colors and 348 combinations. Models are good at proposing a mood and bad at remembering a specific plate. Give them the file, and require them to answer from it.

Use this with ChatGPT, Claude, Gemini, or an agent that can read the repository. The short machine-readable index is [`llms.txt`](../llms.txt) at the repository root.

## What to upload

Upload one of these at the start of the conversation. The JSON is the best single file.

| File | When to use it |
| --- | --- |
| [`wada_colors_and_combinations.json`](../data/wada_colors_and_combinations.json) | The default. Combinations, names, all three hexes, CMYK, and which combinations use each color. |
| [`combinations.csv`](../data/combinations.csv) and [`colors.csv`](../data/colors.csv) | When the tool accepts spreadsheets more happily than JSON, or when you want to preview the same file in Google Sheets. |
| [`display-hex.json`](../data/derived/display-hex.json) | A last resort, when the context is tight. Names and screen hexes only. The model cannot see combinations unless you also describe them. |

If the assistant can fetch a public URL, it can read:

```text
https://raw.githubusercontent.com/Bjoseph23/haishoku/main/data/wada_colors_and_combinations.json
```

That URL works when the repository is public.

Tell the assistant, in the same message as the file:

- Use `display_hex` for anything that will be shown on a screen.
- Quote the combination number and the printed names.
- Stay inside the file. If nothing fits, say so and show the closest combination, clearly labeled as the closest.
- Four-color order is top, left, right, bottom. Two- and three-color order is left to right. Proportions are a separate recommendation.

## A system prompt you can paste

Use this as the instructions of a ChatGPT custom GPT, as the project instructions of a Claude Project, or as the system message of any assistant that supports one. Attach the JSON as knowledge, or tell the user to upload it with the first message.

```text
You are a color assistant for the Haishoku dataset: 348 combinations and 159 named colors from Sanzo Wada’s Haishoku Soukan (1933–34), as printed in Seigensha’s A Dictionary of Color Combinations (2010). The attached JSON (or CSV) is the only source of colors.

Rules:
- Recommend colors that exist in the file. Every recommendation includes the combination number, the printed English names, and display_hex.
- display_hex is the screen color. scan_hex is the raw scan. hex_cmyk is a naive conversion of the printed inks and is the wrong choice for a screen. The printed specification is the integers c, m, y, k.
- Book order is left to right for 2- and 3-color combinations. For 4-color combinations the order is top, left, right, bottom, because the book prints a cross. When you suggest a real layout, also give a proportion (a 60/30/10 split is a good start) and say which surface gets which color. Book order is not importance.
- Keep spellings as printed. Do not “correct” Cerulian Blue, Antwarp Blue, Vandar Poel's Blue, Pale King's Blue, Hay's Russet, Vistoris Lake, or Kronbergs Green. Do not expand Mars Brown/Tobacco or Deep Violet/Plumbeous.
- Eugenia Red (variant a) #E6634F and Eugenia Red (variant b) #DE5556 are different colors. Grayish Lavender (variant a) #CBBFE7 and Grayish Lavender (variant b) #CBB6C2 are different colors. Do not merge them.
- Deep Indigo #21192D, Black #1E1D21, and Dull Violet Black #261B39 look alike on screen and are different inks. Name which one you mean. Do not use them as three distinguishable UI or chart series.
- If the user needs text on a colored ground, check contrast. A beautiful pair of similar lightness is often the point of the plate and a poor choice for small type. Say so, and suggest which color carries the text.
- Do not claim a combination meets WCAG. Compute or qualify the contrast for the specific foreground and background.
- Do not invent Japanese names. This release does not include them.
- Do not reproduce the book’s prose or offer the book PDF. Credit Sanzo Wada for the combinations and Bill Mageni’s Haishoku compilation (https://github.com/Bjoseph23/haishoku, CC BY 4.0 for the data) when you present a palette as a finished recommendation.
- If the user describes a physical material (paint, cloth, glaze), remind them that display_hex is a target to match under the real light, and that the supplier’s code is what gets reordered. For print, start from c m y k.

Answer shape, unless the user asks for something else:
1. The combination number and a one-sentence reason.
2. A table: position, printed name, display_hex, and the surface or object it covers, with a proportion.
3. One caution, if there is a real one (near-blacks, low contrast, print versus screen).
Offer a second combination only when the first is a weak fit. Stay concise.
```

### ChatGPT custom GPT

1. Create a GPT. Paste the prompt above into Instructions.
2. Upload `wada_colors_and_combinations.json` under Knowledge.
3. Turn on code interpreter if you want it to filter the file rather than skim it. A short instruction helps: “When you filter, load the JSON and select combinations whose color names match the request. Do not rely on memory of the file.”
4. Suggested conversation starters:
   - “A 3-color combination for a north-facing living room.”
   - “A brand palette for a bakery, with hexes I can paste into Figma.”
   - “Which combination uses both a yellow and a deep blue?”

### Claude Project

1. Create a Project. Paste the prompt above into Project instructions.
2. Add the JSON to Project knowledge.
3. In the first chat, ask for one combination and check that the reply cites a real number and a `display_hex` you can find in the viewer. If it invents a hex, tell it to open the file and quote.

### Gemini

Gemini’s setup changes by product. The reliable path is to upload the JSON in the chat and paste the prompt as the first message, ending with the actual request (“Now choose a palette for …”). If a Gems or custom-assistant feature is available, the same prompt and file go there.

### Agents that can read the repo

Point the agent at the repository and add one line to the task:

```text
Read llms.txt and data/wada_colors_and_combinations.json.
Use display_hex. Do not invent colors. Cite combination numbers.
```

The viewer at `viewer/index.html` is for people. The JSON is for the agent.

## Prompts to copy

Each prompt assumes the file is already attached and the system prompt above is in force. They ask for work the dataset can actually support.

**Living room**

```text
Choose one 3-color combination for a north-facing living room with oak floors and a linen sofa. Return the combination number, printed names, display_hex, and a 60/30/10 assignment across walls, upholstery, and small objects. Mention if body text on those walls needs a darker color from the dataset, and name it.
```

**Small apartment, rental constraints**

```text
The walls have to stay white. Choose a 3- or 4-color combination whose lightest color can stand in for the walls I cannot paint, and put the remaining colors on textiles and one piece of furniture. Quote display_hex.
```

**Outfit**

```text
I need a coat-and-scarf combination and a shirt-and-tie combination that can live in one wardrobe. Pick two 2-color rows from the file that share a color or sit close in mood. Return numbers, printed names, and display_hex. Keep the book’s spellings.
```

**Brand**

```text
Propose a palette for a small ceramics studio: a wordmark, a stamped seal, and a quiet background for the website. Use one combination. Give display_hex and a proportion. Warn me if the two main colors are too close in lightness for the wordmark to sit on the background.
```

**Packaging**

```text
Choose a 4-color combination for a box of roasted tea. Assign top, left, right, and bottom from the file to lid, front panel, side panel, and interior, and say what share of the surface each should have. The interior can be the largest area.
```

**Poster**

```text
I am designing a lecture poster. Pick a high-contrast combination and tell me which color is the ground, which is the title, and which must not be used for the small date line. Include contrast caution in one sentence.
```

**Interface**

```text
From the file, build a small web palette: page background, a section band, one accent, and a text color. They do not all have to come from a single combination; if you mix two combinations, say so and explain the shared color. Give CSS custom properties using the display_hex values. Do not claim WCAG compliance; give the text/background pair you would actually ship and why.
```

**Chart**

```text
I have four categories on a bar chart in an editorial layout. Choose one 4-color combination whose colors separate by lightness, in book order, and tell me if any two are too close to encode different series. If the combination fails that test, pick another and say why the first failed.
```

**Wedding**

```text
Choose one combination for a daytime wedding: linen, flowers, paper, and a wall. Map each color to a surface with a proportion. The hex is the target we will match, not a color the flowers will hit exactly. Say that in the answer. Include the combination number and display_hex.
```

**“Show me the neighbors”**

```text
List every combination that contains Sea Green. Group them by size. For each, give the number, the other color names, and display_hex. Do not propose colors that are not in those rows.
```

## How to tell that the answer is real

Check three things, which takes a minute in the [viewer](../viewer/index.html):

1. The combination number exists (1–348) and has the size the answer claims.
2. The names are spelled as in the file, variants included.
3. The hex is that row’s `display_hex`, not a rounded cousin and not `hex_cmyk`.

English Red in combination 001 is `#E45B1E`. Cerulian Blue beside it is `#1C93B2`. If a reply says English Red is `#FF0000`, it left the file.

## What you should not ask it to do

- Reproduce pages of the book or “type out the introduction.” The book is the publisher’s.
- Invent a Japanese name for a color and present it as Wada’s.
- Generate a print-ready CMYK conversion from `display_hex` and call it the book’s ink. The book’s ink is already in `c`, `m`, `y`, and `k`.
- Treat the three near-blacks as interchangeable without saying they look alike on screen.
