/**
 * Soft flowers drifting over the purple water while the board is flipped.
 * Deterministic placement (no Math.random at render) so they don't jump on re-render.
 */
const FLOWERS = [
    { x: 8, y: 18, size: 18, dur: 19, delay: -2, hue: "#ded9ff", spin: 1 },
    { x: 21, y: 62, size: 26, dur: 24, delay: -9, hue: "#c9c1ff", spin: -1 },
    { x: 34, y: 12, size: 14, dur: 17, delay: -5, hue: "#efeaff", spin: 1 },
    { x: 47, y: 74, size: 22, dur: 26, delay: -13, hue: "#d6d0ff", spin: -1 },
    { x: 58, y: 28, size: 16, dur: 20, delay: -7, hue: "#e6e1ff", spin: 1 },
    { x: 69, y: 66, size: 28, dur: 28, delay: -16, hue: "#cdc5ff", spin: -1 },
    { x: 78, y: 20, size: 15, dur: 18, delay: -4, hue: "#efeaff", spin: 1 },
    { x: 88, y: 54, size: 24, dur: 23, delay: -11, hue: "#d9d3ff", spin: -1 },
    { x: 15, y: 86, size: 20, dur: 22, delay: -6, hue: "#c4bcff", spin: 1 },
    { x: 63, y: 90, size: 17, dur: 21, delay: -15, hue: "#e2ddff", spin: -1 },
] as const;

function Flower({ size, color }: { size: number; color: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse
                    key={deg}
                    cx="12"
                    cy="6.4"
                    rx="3.1"
                    ry="5.1"
                    fill={color}
                    opacity="0.9"
                    transform={`rotate(${deg} 12 12)`}
                />
            ))}
            <circle cx="12" cy="12" r="2.4" fill="#a99fff" opacity="0.95" />
        </svg>
    );
}

export function FloatingFlowers() {
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 20,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {FLOWERS.map((f, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: `${f.x}%`,
                        top: `${f.y}%`,
                        opacity: 0.55,
                        animation: `flower-float ${f.dur}s ease-in-out ${f.delay}s infinite alternate`,
                        willChange: "transform",
                    }}
                >
                    <Flower size={f.size} color={f.hue} />
                </div>
            ))}
        </div>
    );
}
