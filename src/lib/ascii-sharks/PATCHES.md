# Local patches to `ascii-sharks`

Vendored from https://github.com/stackedlol/ascii-sharks (MIT, see `LICENSE`).
These are the only deviations from upstream. Re-apply them if the library is updated.

## 1. `renderer.ts` — cell grid can be disabled

Upstream always strokes a faint cell grid (`rgba(255,255,255,0.055)`) behind the scene.
Inside a per-card slice that grid reads as hairlines cutting across the art.

- Added `private showGrid = true;`
- Added `setGridVisible(visible: boolean)` (repaints the cached background)
- `paintBackground()` now guards `paintGrid(...)` with `if (this.showGrid)`

Default behaviour is unchanged; the site opts out explicitly.

## 2. `engine.ts` — expose the toggle

- Added `setGridVisible(visible: boolean)` delegating to `this.renderer`.

## Usage in this site

`src/components/HeroGrid/OceanBed.tsx` calls `engine.setGridVisible(false)` right after
constructing the engine.
