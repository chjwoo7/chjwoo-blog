import { useEffect, useRef } from "react";

/**
 * ASCII flowers drifting over the flipped board — glyphs on a canvas, matching the
 * shark art, instead of DOM nodes. One canvas, one rAF loop, capped frame rate.
 *
 * Performance notes:
 * - single canvas, ~24fps cap (flowers are slow; 60fps is wasted work)
 * - no allocations per frame; every flower is precomputed once
 * - device pixel ratio capped at 1.5 (decorative layer)
 * - paused when the tab is hidden, and static under prefers-reduced-motion
 */
const CELL = 9; // px per glyph cell
const TARGET_FPS = 24;

type Flower = {
    /** base position in px */
    x: number;
    y: number;
    /** petal distance in cells: 1 = small, 2 = medium */
    radius: number;
    /** px per second upward drift */
    rise: number;
    /** horizontal sway amplitude, px */
    sway: number;
    /** radians per second */
    phase: number;
    glyphs: string[];
};

// petal offsets for the small and medium shapes (col, row) around the centre
const SMALL_PETALS: [number, number][] = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
];
const MEDIUM_PETALS: [number, number][] = [
    [0, -2],
    [-2, 0],
    [2, 0],
    [0, 2],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
];

const PETAL_CHARS = ["*", "+", "x", "o"];
const CENTRE_CHAR = "@";

function makeFlowers(width: number, height: number): Flower[] {
    const count = 11;
    const out: Flower[] = [];
    for (let i = 0; i < count; i++) {
        // deterministic scatter: golden-ratio spacing keeps them from clumping
        const gx = (i * 0.6180339887) % 1;
        const gy = (i * 0.3819660113 + 0.17) % 1;
        const medium = i % 3 === 0;
        out.push({
            x: gx * width,
            y: gy * height,
            radius: medium ? 2 : 1,
            rise: medium ? 5.5 : 8,
            sway: medium ? 14 : 9,
            phase: (i * 1.7) % (Math.PI * 2),
            glyphs: [PETAL_CHARS[i % PETAL_CHARS.length]],
        });
    }
    return out;
}

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

        let width = 0;
        let height = 0;
        let flowers: Flower[] = [];
        let cw = CELL;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) return;
            width = rect.width;
            height = rect.height;
            cw = Math.max(7, Math.min(12, Math.round(width / 130)));
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            flowers = makeFlowers(width, height);
        };
        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        ctx.font = `600 ${Math.round(cw * 0.9)}px ${getComputedStyle(canvas).fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const draw = (t: number) => {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            for (const f of flowers) {
                const drift = reduced ? 0 : ((t * f.rise) / 1000) * 6;
                let y = f.y - drift;
                // wrap so the column of flowers is endless
                const span = height + 80;
                y = ((y + 40) % span + span) % span - 40;

                const x = f.x + (reduced ? 0 : Math.sin(t / 1000 + f.phase) * f.sway);
                const petals = f.radius === 1 ? SMALL_PETALS : MEDIUM_PETALS;
                const step = f.radius === 1 ? cw * 0.55 : cw * 0.52;
                const span2 = f.radius === 1 ? 1 : 2;

                ctx.fillStyle = "rgba(226,220,255,0.62)";
                for (const [dx, dy] of petals) {
                    ctx.fillText(f.glyphs[0], x + dx * step, y + dy * step);
                }
                ctx.fillStyle = "rgba(169,159,255,0.85)";
                ctx.fillText(CENTRE_CHAR, x, y);
                void span2;
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
            if (!document.hidden) {
                last = 0;
            }
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
            className="ascii-ocean"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 20,
                pointerEvents: "none",
            }}
        />
    );
}
