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

## 3. `renderer.ts` — configurable scene backdrop

Upstream hard-codes `g.fillStyle = "#000"` in `paintBackground()`.

- Added `private bgColor = "#000";`
- Added `setBackground(color: string)` (repaints the cached background)
- `paintBackground()` fills with `this.bgColor`

## 4. `engine.ts` — expose the backdrop

- Added `setBackground(color: string)` delegating to `this.renderer`.

## 5. `renderer.ts` — violet palette (no neon)

The site sits the scene on its `#6f64eb` purple, so the upstream neon palette was
retuned. No logic changed — constants only:

| Constant | Upstream | Now |
|---|---|---|
| `DOT_RGB` | blue / green / red / pale / cyan wake | five muted violets, pale-lavender wake |
| `ACCENTS` | orange, red, magenta, cyan, green, blue, yellow | violet family only |
| `SPECIES[].tint` (×8) | cool blue-grey / yellow-grey mixes | violet mixes (`g < r <= b`) |
| `fishStyles` | `rgba(230,238,255,…)` | `rgba(226,221,255,…)` |
| body glyph ink | `#0e0f13` / `#1b1d24` | `#170f3a` / `#241a52` |
| glint | `#ffffff` | `#efeaff` |
| eye glyph | `#9aa0ad` | `#e9e4ff` |
| heat | neon orange / red | `rgba(236,231,255,…)` / `rgba(128,116,244,…)` |

## Usage in this site

`src/components/HeroGrid/OceanBed.tsx` calls, right after constructing the engine:

```ts
engine.setGridVisible(false);
engine.setBackground(CARD_PURPLE); // "#6f64eb"
```
