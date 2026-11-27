import { mountScenes } from "../scene-studio.js";

mountScenes({
  pick: (catalog) => catalog.filter((scene) => scene.id === "facade"),
  defaultPlate: 347,
  tabs: false,
  kicker: "Facade studio",
  title: "A street elevation",
  lede: (scene) => `${scene.blurb} The hex is a target for a paint fan. The supplier’s code is what gets reordered.`,
  label: "Recolored house photograph",
  tip: "Click the wall, roof, or door to change its color",
  caption: () => "Wall, roof, and door. Edges are approximate.",
});
