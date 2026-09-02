# Hide & Seek — 3D forest asset pass 01

This is the first asset pass for the 3D rebuild of `hideAndSeek`.

The existing game already has four hiding archetypes — **bush, tree, rock and pond** — so the first 3D pack is built around those. The look is chunky, toy-like and bright, matching the supplied card while keeping geometry intentionally small for iPad Safari.

## Files

- `forestAssetFactory.js` — procedural Three.js assets. It has no texture files and can be used from Threlte because it returns normal `THREE.Group` objects.
- `asset-manifest.json` — collider suggestions, hide anchors, bounds and triangle counts from the matching GLB export.
- `preview.html` — lightweight browser preview of the procedural assets.

## Runtime approach

Build the prototype library once and clone it. `Object3D.clone(true)` keeps the geometry and material references shared, so repeated props do not duplicate GPU buffers. For the actual forest scene, the next pass should turn the highest-count repeated parts into `InstancedMesh` batches.

Recommended iPad baseline: DPR cap around 1.5, one sun light, ambient/hemisphere fill, no post FX, no per-prop dynamic shadows, primitive colliders only, and pooled interaction markers.
