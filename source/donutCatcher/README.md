# Donut Catcher — Svelte + Three.js

The editable game uses Svelte 5 for the interface and lifecycle, and Three.js for the play scene. The nine distinct supplied images (one logo was attached twice) provide the logo, four donut flavors, basket, two hands, and candy-street background. The previously generated turtle is the tenth asset.

The artwork is used directly as textures and images. These are 2.5D sprites rendered in a Three.js scene, not newly modeled versions of the supplied pictures. Donuts drift and rotate, the hands follow the basket, caught donuts tuck behind the basket, and turtles bounce away after deducting a point. The procedural scenery and character meshes from the first draft have been replaced by the supplied artwork.

## Play and deploy

The generated release is `../../donutCatcher/donutCatcher.html`. It embeds compiled Svelte, Three.js, CSS, and all ten WebP images. Open that file directly in a current browser, or replace the same file in the existing GitHub game folder. The hub URL remains unchanged. No CDN, runtime download, npm installation, or GitHub build workflow is required to play. WebGL 2 is required. The Games link expects the existing hub at `../index.html`.

## Develop

From this folder:

```sh
npm ci
npm test
npm run build
```

Edit `App.svelte`, `style.css`, `scene.js`, or `engine.mjs`, then rebuild. Commit both the source and generated HTML. Do not commit `node_modules`.

- `App.svelte`: reactive score, timer, instructions, start/end screens, automatic-pause screen, score popups, and component cleanup.
- `scene.js`: texture loading, WebGL scene, sprites, input, animation, simulation loop, and disposal of listeners/GPU resources when Svelte unmounts.
- `engine.mjs`: frame-independent rules and swept basket collision.
- `assets.js`: imports the artwork for both Svelte and Three.js.
- `build.mjs`: compiles Svelte with zero-warning enforcement and embeds everything in the standalone release.
- `assets/manifest.json`: original attachment names, SHA-256 hashes, and web asset dimensions.

## Rules

- Move with mouse, touch drag, arrow keys, or A/D.
- Each donut adds 1 point. Each turtle deducts 1 point, including below zero.
- Missing an item has no penalty.
- Rounds last 60 active seconds. Leaving the tab pauses play; choose Keep catching to resume.
- Every ten caught donuts increases the level and falling speed. Turtle penalties do not undo level progress.
- Best score is stored only in the current browser. Blocked local storage does not prevent play.

## Assets and performance

The uploaded PNGs remain unchanged. Project copies are resized WebP encodings with alpha preserved: donuts 640 px, logo/basket 900 px, hands 800 px, background at the supplied 1672×941 resolution. `assets/turtle.png` retains the original turtle; `assets/turtle.webp` is its runtime copy. The complete release is approximately 1.65 MB.

The renderer caps pixel ratio at 1.65, pools falling sprites, uses shared textures and fixed 1/60-second simulation steps, and stops scheduling frames when the scene is idle or paused. It uses no dynamic shadows. Reduced-motion preferences disable wobble, catch motion, and confetti.

Validation: Svelte compiles without warnings; gameplay tests pass; the standalone JavaScript parses; every embedded image matches its runtime asset; no external script or stylesheet dependencies remain. Browser visual QA has not been performed.

Svelte and Three.js use the MIT license; license notices are preserved by the bundle.
