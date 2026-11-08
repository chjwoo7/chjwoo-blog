import { useEffect, useRef } from "react";
import { OceanEngine } from "@/lib/ascii-sharks/engine";

/** Same purple as the "Enter Site" button. */
export const CARD_PURPLE = "#6f64eb";

type Slice = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };

/**
 * One shark simulation, painted into every `canvas[data-ocean-slice]` on the page.
 *
 * The engine renders a full-viewport master canvas that is never shown. Each frame we
 * copy the slice of that master sitting under each slice canvas, so the art appears
 * inside the card that owns the canvas — clipped by the card's own box and radius.
 *
 * Performance:
 * - the slice list and their screen rects are cached; they are re-measured only on
 *   resize and for a short window after mounting (while the flip animation settles),
 *   which removes 36 forced layout reads from every frame
 * - rect + bitmap sizes are only written when they actually change
 * - the loop idles while the tab is hidden, and never draws without a visible canvas
 */
export function OceanBed({ active }: { active: boolean }) {
    const masterRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!active) return;
        const master = masterRef.current;
        if (!master) return;

        let engine: OceanEngine;
        try {
            engine = new OceanEngine(master, [
                { kind: "classic", size: 1 },
                { kind: "hammerhead", size: 0.78 },
                { kind: "mako", size: 0.62 },
                { kind: "tiger", size: 0.88 },
                { kind: "thresher", size: 0.7 },
            ]);
            // The scene's faint cell grid would read as hairlines inside every card.
            engine.setGridVisible(false);
            // Water is the site purple, not black, so the cards and the Enter Site
            // button share one colour.
            engine.setBackground(CARD_PURPLE);
        } catch {
            return;
        }

        let stopped = false;
        let raf = 0;
        let slices: Slice[] = [];
        let rects: { x: number; y: number; w: number; h: number }[] = [];
        let dirty = true;
        let lastMeasure = 0;

        const measure = () => {
            const mr = master.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const nodes = Array.from(
                document.querySelectorAll<HTMLCanvasElement>("canvas[data-ocean-slice]")
            );

            const nextSlices: Slice[] = [];
            const nextRects: typeof rects = [];

            for (const canvas of nodes) {
                const r = canvas.getBoundingClientRect();
                if (r.width < 1 || r.height < 1) continue;
                const ctx = canvas.getContext("2d");
                if (!ctx) continue;

                const w = Math.round(r.width * dpr);
                const h = Math.round(r.height * dpr);
                if (canvas.width !== w || canvas.height !== h) {
                    canvas.width = w;
                    canvas.height = h;
                }
                nextSlices.push({ canvas, ctx, w, h });
                nextRects.push({
                    x: Math.round((r.left - mr.left) * dpr),
                    y: Math.round((r.top - mr.top) * dpr),
                    w,
                    h,
                });
            }

            slices = nextSlices;
            rects = nextRects;
            dirty = false;
            lastMeasure = performance.now();
        };

        const frame = () => {
            if (stopped) return;
            raf = requestAnimationFrame(frame);
            if (document.hidden) return;

            // Re-measure while the flip animation is still settling, then fall back to a
            // cheap periodic refresh so a stray layout change can't leave slices stale.
            const since = performance.now() - lastMeasure;
            if (dirty || since > 2500) {
                measure();
            }

            for (let i = 0; i < slices.length; i++) {
                const s = slices[i];
                const r = rects[i];
                s.ctx.clearRect(0, 0, s.w, s.h);
                s.ctx.drawImage(master, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
            }
        };

        // The cards animate for ~400ms after mount; measure a few times during that.
        const kicks = [0, 120, 300, 520].map((ms) =>
            window.setTimeout(() => {
                dirty = true;
            }, ms)
        );

        const onResize = () => {
            dirty = true;
        };
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);

        raf = requestAnimationFrame(frame);

        return () => {
            stopped = true;
            cancelAnimationFrame(raf);
            for (const t of kicks) clearTimeout(t);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            engine.destroy();
        };
    }, [active]);

    return (
        <canvas
            ref={masterRef}
            aria-hidden="true"
            className="ascii-ocean"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                visibility: "hidden",
                pointerEvents: "none",
            }}
        />
    );
}
