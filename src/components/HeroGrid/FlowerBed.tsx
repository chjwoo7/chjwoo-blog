import { useEffect, useRef } from "react";

/**
 * ASCII flowers drifting over the flipped board.
 *
 * Drawn the same way the shark renderer draws its creatures: one glyph cell per art
 * pixel, a tinted plate behind it and a ramp glyph on top — not a few loose characters.
 *
 * Performance:
 * - each flower size is rasterised ONCE into an offscreen sprite; per frame we only
 *   `drawImage` 11 sprites (no per-cell work inside the loop)
 * - single canvas, 24fps cap, DPR capped at 1.5
 * - transparent — this layer must never paint a background over the cards
 * - paused when the tab is hidden; still under prefers-reduced-motion
 */
const TARGET_FPS = 24;
const RAMP = ":;t%SX8#@";

type Sprite = { canvas: HTMLCanvasElement; px: number };

/** A five-petal flower as cell blocks + ramp glyphs, matching the shark's technique. */
function buildSprite(radius: number, pitch: number, dpr: number, font: string): Sprite {
  const cells = radius * 2 + 1;
  const px = cells * pitch;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(px * dpr);
  canvas.height = Math.round(px * dpr);

  const g = canvas.getContext("2d");
  if (!g) return { canvas, px };

  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.font = `600 ${Math.round(pitch * 0.9)}px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";

  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const dx = cx - radius;
      const dy = cy - radius;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      // five petals: a cosine lobe around the circle
      const petalReach = (0.56 + 0.44 * Math.cos(5 * angle)) * radius;
      if (dist > petalReach + 0.35) continue;

      const t = Math.min(1, Math.max(0, 1 - dist / Math.max(petalReach, 0.001)));
      const shade = 0.3 + 0.7 * t;

      // plate
      g.fillStyle = `rgba(226,220,255,${(0.14 + 0.34 * shade).toFixed(3)})`;
      g.fillRect(cx * pitch + 0.5, cy * pitch + 0.5, pitch - 1, pitch - 1);

      // glyph, dense at the rim and lighter toward the middle like the shark hide
      const glyph = RAMP[Math.min(RAMP.length - 1, Math.round((1 - shade) * 8))];
      g.fillStyle = t > 0.5 ? "rgba(38,29,80,0.95)" : "rgba(26,20,58,0.95)";
      g.fillText(glyph, cx * pitch + pitch / 2, cy * pitch + pitch / 2 + 1);
    }
  }

  // pollen centre
  g.fillStyle = "rgba(201,193,255,0.95)";
  g.beginPath();
  g.arc(radius * pitch + pitch / 2, radius * pitch + pitch / 2, pitch * 0.52, 0, Math.PI * 2);
  g.fill();

  return { canvas, px };
}

type Flower = {
  x: number;
  y: number;
  rise: number;
  sway: number;
  phase: number;
  spin: number;
  scale: number;
  sprite: number;
};

export function FlowerBed({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const font = getComputedStyle(document.body).fontFamily || "monospace";

    let width = 0;
    let height = 0;
    let pitch = 9;
    let sprites: Sprite[] = [];
    let flowers: Flower[] = [];

    const build = () => {
      // small = radius 3 cells, medium = radius 5 cells
      sprites = [
        buildSprite(3, pitch, dpr, font),
        buildSprite(5, pitch, dpr, font),
        buildSprite(4, pitch, dpr, font),
      ];
    };

    const seed = () => {
      const count = 11;
      flowers = [];
      for (let i = 0; i < count; i++) {
        const gx = (i * 0.6180339887) % 1;
        const gy = (i * 0.3819660113 + 0.17) % 1;
        const sprite = i % 3 === 0 ? 1 : i % 3 === 1 ? 0 : 2;
        flowers.push({
          x: gx * width,
          y: gy * height,
          rise: sprite === 1 ? 5 : 8,
          sway: sprite === 1 ? 13 : 9,
          phase: (i * 1.7) % (Math.PI * 2),
          spin: (i % 2 === 0 ? 1 : -1) * (0.05 + (i % 3) * 0.02),
          scale: 0.9 + ((i * 0.137) % 0.35),
          sprite,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      width = rect.width;
      height = rect.height;
      pitch = Math.max(7, Math.min(12, Math.round(width / 130)));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      build();
      seed();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const span = height + 160;
      for (const f of flowers) {
        const drift = reduced ? 0 : (t / 1000) * f.rise * 1.2;
        let y = f.y - drift;
        y = (((y + 80) % span) + span) % span - 80;

        const x = f.x + (reduced ? 0 : Math.sin(t / 1000 + f.phase) * f.sway);
        const s = sprites[f.sprite];
        if (!s) continue;
        const size = s.px * f.scale;

        if (reduced) {
          ctx.drawImage(s.canvas, x - size / 2, y - size / 2, size, size);
        } else {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(t / 1400 + f.phase) * f.spin * 2);
          ctx.drawImage(s.canvas, -size / 2, -size / 2, size, size);
          ctx.restore();
        }
      }
    };

    let raf = 0;
    let last = 0;
    const interval = 1000 / TARGET_FPS;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (now - last < interval) return;
      last = now;
      draw(now);
    };

    draw(performance.now());
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (!document.hidden) last = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 20,
        pointerEvents: "none",
        // must stay transparent: this layer sits above the cards
        background: "transparent",
      }}
    />
  );
}
