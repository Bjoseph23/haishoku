#!/usr/bin/env python3
"""Write kaggle/haishoku_starter.ipynb. Works locally (kaggle/ folder) and on Kaggle (/kaggle/input/...)."""
import nbformat as nbf
from pathlib import Path
nb = nbf.v4.new_notebook()
md, code = nbf.v4.new_markdown_cell, nbf.v4.new_code_cell
nb.cells = [
 md("# Haishoku starter: Sanzo Wada's 348 color combinations\nThis notebook loads the three tidy tables, joins them, and looks at hue distribution, combination sizes, the most-used colors, the strongest color pairs, and lightness contrast within each palette.\n\nData: CC BY 4.0. Please credit Sanzo Wada (*Haishoku Sōkan*, 1933–34), Seigensha (*A Dictionary of Color Combinations*, 2010), and Bill Mageni's [haishoku](https://github.com/Bjoseph23/haishoku)."),
 code("import glob, os, itertools\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# find the data folder on Kaggle or locally\ncands = glob.glob('/kaggle/input/**/colors.csv', recursive=True) + ['colors.csv']\nDATA = os.path.dirname([c for c in cands if os.path.exists(c)][0]) or '.'\ncolors = pd.read_csv(f'{DATA}/colors.csv')\ncombos = pd.read_csv(f'{DATA}/combinations.csv')\nslots  = pd.read_csv(f'{DATA}/combination_colors.csv')\nprint(colors.shape, combos.shape, slots.shape)\ncolors.head()"),
 md("## Integrity checks"),
 code("assert colors.id.is_unique and len(colors) == 159\nassert combos.number.is_unique and len(combos) == 348\nassert len(slots) == 1032 and not slots.duplicated(['combination_number','slot']).any()\nassert slots.color_id.isin(colors.id).all() and slots.combination_number.isin(combos.number).all()\nassert (slots.groupby('combination_number').size() == combos.set_index('number')['size']).all()\nprint('all checks passed')"),
 md("## Join into one tidy table"),
 code("tidy = (slots.merge(colors[['id','hue_family','lab_l','lab_a','lab_b','hsl_h','hsl_s']], left_on='color_id', right_on='id')\n             .merge(combos[['number','size','page']], left_on='combination_number', right_on='number')\n             .drop(columns=['id','number']))\ntidy.head()"),
 md("## Combination sizes"),
 code("ax = combos['size'].value_counts().sort_index().plot.bar(color=['#E45B1E','#1C93B2','#848A55'])\nax.set(xlabel='colors per combination', ylabel='combinations', title='Combination sizes'); plt.show()"),
 md("## Hue distribution of the 159 colors\nEach bar is one color, placed by HSL hue and painted in its own `display_hex`."),
 code("fig, ax = plt.subplots(figsize=(12, 3))\nc = colors.sort_values('hsl_h')\nax.bar(c.hsl_h, c.hsl_l, width=2.2, color=c.display_hex, edgecolor='#00000022')\nax.set(xlabel='hue (degrees)', ylabel='lightness %', title='159 colors by hue and lightness'); plt.show()\ncolors.hue_family.value_counts()"),
 md("## The 20 most-used colors"),
 code("top = colors.nlargest(20, 'combo_count')\nfig, ax = plt.subplots(figsize=(8, 7))\nax.barh(top.name[::-1], top.combo_count[::-1], color=top.display_hex[::-1], edgecolor='#333')\nax.set(xlabel='combinations using the color', title='Most-used colors'); plt.show()"),
 md("## Strongest color pairs (co-occurrence)"),
 code("pairs = (slots.groupby('combination_number').color_id.apply(lambda s: list(itertools.combinations(sorted(s), 2)))\n         .explode().value_counts().head(15).rename('count').reset_index())\nname = colors.set_index('id').name\npairs[['a','b']] = pd.DataFrame(pairs.iloc[:,0].tolist(), index=pairs.index)\npairs.assign(a=pairs.a.map(name), b=pairs.b.map(name))[['a','b','count']]"),
 md("## Lightness contrast within palettes\nThe ΔL\\* range (max minus min CIELAB lightness) in each combination, by size."),
 code("rng = tidy.groupby(['combination_number','size']).lab_l.agg(lambda s: s.max()-s.min()).rename('delta_L').reset_index()\nrng.boxplot(column='delta_L', by='size'); plt.suptitle(''); plt.title('Lightness range within a combination'); plt.ylabel('ΔL*'); plt.show()\nrng.groupby('size').delta_L.describe()"),
 md("## Draw any combination"),
 code("def show(n):\n    s = slots[slots.combination_number == n]\n    fig, ax = plt.subplots(figsize=(len(s)*1.6, 1.6))\n    for i, r in enumerate(s.itertuples()):\n        ax.add_patch(plt.Rectangle((i,0),1,1,color=r.display_hex)); ax.text(i+.5,-.15,f'{r.color_name}\\n{r.display_hex}',ha='center',va='top',fontsize=8)\n    ax.set_xlim(0,len(s)); ax.set_ylim(-.5,1); ax.axis('off'); ax.set_title(f'Combination {n}'); plt.show()\nfor n in (1, 176, 301): show(n)"),
]
nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
nbf.write(nb, Path(__file__).resolve().parent.parent / "kaggle/haishoku_starter.ipynb")
