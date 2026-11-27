# Viewer plan

## Research: how outfit and room previews are actually made

Retail color tools fall into two families.

**3D configurators.** A glTF model is shown in the browser and a material color changes at runtime. Google’s [`<model-viewer>`](https://modelviewer.dev/) ([Apache-2.0](https://github.com/google/model-viewer)) is the component Shopify-style sites embed. The Khronos [Materials Variants shoe](https://github.com/KhronosGroup/glTF-Sample-Models/blob/master/2.0/MaterialsVariantsShoe/README.md) (Shopify, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)) is the usual sample: one mesh, several base-color textures. [three.js](https://threejs.org/) and React Three Fiber do the same with more code ([an example product viewer](https://react-immersive.liveroom.dev/docs/introduction)). [Babylon.js](https://www.babylonjs.com/) is the other full engine. [MeshMarkup](https://www.meshmarkup.com/3d-configurator) and templates such as [FORMA](https://www.dev3.tech/item/dev3-forma-3d-website-template) recolor glTF parts or keep the shading and swap the hue in a shader. This looks modern when the model is a real garment scan. Open libraries do not offer that scan: [Poly Haven](https://polyhaven.com/license) is CC0 but not fashion, [Quaternius](https://quaternius.com/license.html) forbids redistributing the asset files, [Kenney](https://kenney.nl/assets) is game-low-poly, and MakeHuman’s meshes are CC0 while its code is AGPL. A plastic mannequin would look worse than a photograph.

**Photographic recoloring.** A real photo keeps its folds. A mask marks the cloth or the wall. The browser replaces hue and keeps luminance, which is how paint visualizers work (Sherwin-Williams ColorSnap and the same class of fabric tools) and how [Polotno’s room visualizer](https://polotno.com/demo/room-visualizer) describes a catalogue photo: one picture, a color mask, many hues, no new render. Virtual try-on repositories (VITON and the rest) need a server and a person’s photo. They do not fit a static host.

## Decision

Photographic recoloring, with photographs generated for this project and released under CC BY 4.0. See [CREDITS.md](../CREDITS.md).

- **Outfits.** Twelve full-length studio photographs on a green screen (six women’s looks, six men’s): tee and jeans, polo and chinos, shirt and trousers, knit and trousers, shirt with blazer and tie, tee with jacket and jeans. A mask separates top, outer layer, trousers, shoes, and tie. The page tints those regions and leaves skin, hair, and the backdrop alone. The lookbook grid is those twelve frames. Choosing a garment snaps to the nearest photograph, because a tee and a blazer are different pictures, not layers that can be stacked from one shoot.
- **Rooms and facade.** One photograph each for living room, bedroom, kitchen, patio, bar, and a house front. Polygons mark the large surfaces. Edges are approximate. Shading inside the polygon stays photographic.
- **Why not 3D.** `<model-viewer>` is the right widget once a licensed, good-looking clothed body exists. It does not, at a size and quality that would beat these photographs on a phone. Draco and KTX2 would matter for that future model. They do not help a JPEG.

Each studio page loads one photograph and one mask, then the shared dataset. A cold outfit load on a desktop test was about 340 KB including the visible thumbnails. Room and facade loads were about 40–50 KB plus the dataset if it was not already cached. The asset folder is about 530 KB on disk.

## Pages

Separate HTML files. Palettes, colors, use cases, and about are unchanged in structure. Outfit, room, and facade now use `viewer/js/recolor.js`.

| Page | File |
| --- | --- |
| Palettes | `viewer/index.html` |
| Colors | `viewer/colors.html` |
| Use cases | `viewer/use-cases.html` |
| About | `viewer/about.html` |
| Outfit studio | `viewer/outfit.html` |
| Room studio | `viewer/room.html` |
| Facade | `viewer/facade.html` |
| Brand and poster | `viewer/brand.html` |

Palettes still search, filter, and copy a whole plate or one hex. Studios still take a combination from the picker, shuffle the assignment, reassign a region, and copy hex codes. Presets jump to a photographed look.

## Limits

Masks do not follow every collar, cuff, or sofa curve. Hands can pick up a little color. Sheer curtains and small objects are coarse. There is no photo for every mix of shirt, jacket, and trouser, so the controls snap to the nearest look. `file://` still cannot load the modules.
