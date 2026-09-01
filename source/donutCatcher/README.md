# Donut Catcher

The playable release is `../../donutCatcher/donutCatcher.html`. It contains the complete Three.js bundle, CSS, game logic, and turtle image. Upload that one file to the existing `donutCatcher/` folder. The hub already links to that path. It also opens directly in a browser without a server or internet connection; WebGL 2 is required. The Games link expects the existing hub at `../index.html`.

## Rules

- Move with mouse, touch drag, arrow keys, or A/D.
- Catch a donut: +1 point. Catch a turtle: −1 point, including below zero.
- Missing an item has no penalty.
- Each round lasts 60 active seconds. Leaving the tab pauses it; choose Keep catching to resume.
- Ten caught donuts unlock the next level and friend, preserving the original five friends. Turtles do not undo unlocks.
- Best score is stored only in this browser. Storage being unavailable does not prevent play.

## Updating

Edit this source folder, then run `npm ci`, `npm test`, and `npm run build` here. Commit both source and the generated HTML. These commands run only during development; GitHub Pages needs no dependency installation or custom build workflow. Do not commit node_modules.

`engine.mjs` owns rules and swept basket collision. `game.js` owns Three.js objects, input, and UI. `style.css` and `template.html` own the interface. `build.mjs` bundles everything into the existing game URL. Dependencies are pinned in the lockfile.

The renderer caps pixel ratio at 1.65, pools falling meshes, instances sprinkles, uses fixed 1/60-second simulation substeps, and avoids dynamic shadow maps. Gameplay tests cover scoring, single catches, misses, frame-rate consistency, pause, restart, and level progression. The build was checked; browser visual QA was not performed in this environment.

## Turtle asset

`assets/turtle.png` is the original transparent 1254×1254 PNG, created with the built-in image generation tool. It is embedded without image edits. In the game it is a billboard sprite; donuts, basket, scenery, and friends are Three.js meshes.

Prompt: “Exactly one original cute baby turtle, soft glossy toy-like 3D style. Mint green baby turtle with a jade green domed shell with simple rounded shell plate pattern, large friendly dark eyes, tiny pink blush cheeks, and rounded flippers or feet. Adorable happy expression. Three-quarter front view with a slight top view, entire turtle silhouette fully visible, centered in a square image with generous transparent padding. Isolated on genuinely transparent background with alpha channel, no floor plane or cast shadow outside turtle. Soft studio highlights. No text, symbols, watermark, scenery, other animals, props, objects, checkerboard pattern, or solid background.”

Three.js is distributed under the MIT license; its copyright notice is preserved in the generated bundle.
