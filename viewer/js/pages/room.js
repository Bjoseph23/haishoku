import { mountScenes } from "../scene-studio.js";

mountScenes({
  pick: (catalog) => catalog.filter((scene) => scene.id !== "facade"),
  defaultPlate: 176,
  tabs: true,
  kicker: "Room studio",
  title: "Color a room",
  lede: (scene) => scene.blurb,
  label: "Recolored room photograph",
  tip: "Click a wall or a surface to change its color",
  caption: () => "Masks follow the main surfaces. Edges are approximate.",
});
