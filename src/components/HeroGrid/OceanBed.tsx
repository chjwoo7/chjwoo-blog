import { useEffect, useRef } from "react";
import { OceanEngine } from "@/lib/ascii-sharks/engine";

/** Same purple as the "Enter Site" button. */
export const CARD_PURPLE = "#6f64eb";

/**
 * One shark simulation, painted into every `canvas[data-ocean-slice]` on the page.
 *
 * The engine renders a full-viewport master canvas that is never shown. Each frame we
 * copy the slice of that master that sits under each slice canvas, so the art appears
 * *inside* the card that owns the canvas — clipped by the card's own box and radius,
 * with no full-bleed background anywhere.
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
            ]);
            // The scene's faint cell grid would read as hairlines inside every card.
            engine.setGridVisible(false);
            // Water is the site purple, not black, so the cards and the Enter Site
            // button share one colour.
            engine.setBackground(CARD_PURPLE);
        } catch {
            return;
        }

        let raf = 0;
        let stopped = false;
        const sizes = new WeakMap<HTMLCanvasElement, { w: number; h: number }>();

        const frame = () => {
            if (stopped) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const mr = master.getBoundingClientRect();
            const slices = Array.from(
                document.querySelectorAll<HTMLCanvasElement>("canvas[data-ocean-slice]")
            );

            // Pass 1: read every rect. Pass 2: write canvas bitmaps. Interleaving reads and
            // writes would force a layout per card per frame.
            const rects = slices.map((c) => c.getBoundingClientRect());

            for (let i = 0; i < slices.length; i++) {
                const canvas = slices[i];
                const r = rects[i];
                if (r.width < 1 || r.height < 1) continue;

                const bw = Math.round(r.width * dpr);
                const bh = Math.round(r.height * dpr);
                const prev = sizes.get(canvas);
                if (!prev || prev.w !== bw || prev.h !== bh) {
                    canvas.width = bw;
                    canvas.height = bh;
                    sizes.set(canvas, { w: bw, h: bh });
                }

                const ctx = canvas.getContext("2d");
                if (!ctx) continue;

                ctx.clearRect(0, 0, bw, bh);
                ctx.drawImage(
                    master,
                    Math.round((r.left - mr.left) * dpr),
                    Math.round((r.top - mr.top) * dpr),
                    bw,
                    bh,
                    0,
                    0,
                    bw,
                    bh
                );
            }

            raf = requestAnimationFrame(frame);
        };

        raf = requestAnimationFrame(frame);

        return () => {
            stopped = true;
            cancelAnimationFrame(raf);
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
