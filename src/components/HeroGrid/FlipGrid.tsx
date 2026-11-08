import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FlipCard from "./FlipCard";
import { AsciiOcean } from "@/lib/ascii-sharks/AsciiOcean";

export default function FlipGrid() {
    const [mounted, setMounted] = useState(false);
    const [globalFlip, setGlobalFlip] = useState(false);
    const [randomDelays, setRandomDelays] = useState<number[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [useFlipDelay, setUseFlipDelay] = useState(false);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth < 768 : false
    );
    const [dimensions, setDimensions] = useState(() => ({
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 800,
    }));

    // Responsive Check & Dimensions
    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Remove Curtain
    useEffect(() => {
        const curtain = document.getElementById("initial-curtain");
        if (curtain) {
            setTimeout(() => {
                curtain.style.transition = "opacity 0.5s ease";
                curtain.style.opacity = "0";
                setTimeout(() => curtain.remove(), 500);
            }, 100);
        }
    }, []);

    // Lock Scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    // Grid Dimensions: Desktop 6x6, Mobile 4x9
    const cols = isMobile ? 4 : 6;
    const rows = isMobile ? 9 : 6;

    const minD = Math.min(dimensions.width, dimensions.height || 1);
    const bgWidth = minD * 0.65;
    const bgHeight = minD * 0.65;

    // Centering offsets
    const xOffset = (bgWidth - dimensions.width) / 2;
    const yOffset = (bgHeight - dimensions.height) / 2;

    // Cell Dimensions
    const cellWidth = dimensions.width / cols;
    const cellHeight = dimensions.height / rows;

    // 36 Cards
    const cards = Array.from({ length: 36 }, (_, i) => ({ id: i }));

    useEffect(() => {
        const delays = cards.map(() => Math.random() * 300);
        setRandomDelays(delays);
    }, []);

    const toggleGlobalFlip = () => {
        if (isTransitioning) return;
        setUseFlipDelay(true);
        setResetTrigger((prev) => prev + 1);
        setGlobalFlip(!globalFlip);
        setTimeout(() => setUseFlipDelay(false), 800);
    };

    const handleEnterSite = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // Unlock Scroll
        document.body.style.overflow = "";

        setUseFlipDelay(true);
        setResetTrigger((prev) => prev + 1);
        setIsTransitioning(true);
        setGlobalFlip(false);

        setTimeout(() => {
            setIsFinished(true);
        }, 1200);
    };

    if (!mounted || isFinished) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                overflow: "hidden",
                backgroundColor: "transparent",
                pointerEvents: isTransitioning ? "none" : "auto",
            }}
        >
            {/* Background blocker */}
            <div
                onClick={toggleGlobalFlip}
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#0D1326",
                    display: isTransitioning ? "none" : "block",
                    zIndex: 1,
                    cursor: "pointer",
                }}
            />

            {/* ASCII shark ocean — the water behind the flipped (purple) card backs.
                Mounted only while flipped so no rAF loop runs on a fresh page load. */}
            {globalFlip && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        backgroundColor: "#000000",
                        opacity: isTransitioning ? 0 : 1,
                        transition: isTransitioning ? "opacity 0.25s ease" : "none",
                        pointerEvents: "none",
                    }}
                >
                    <AsciiOcean
                        className="ascii-ocean"
                        sharks={[
                            { kind: "classic", size: 1 },
                            { kind: "hammerhead", size: 0.78 },
                            { kind: "mako", size: 0.62 },
                        ]}
                    />
                </div>
            )}

            {/* Grid */}
            <div
                onClick={toggleGlobalFlip}
                style={{
                    display: "grid",
                    height: "100%",
                    width: "100%",
                    gap: "4px",
                    padding: "4px",
                    position: "relative",
                    zIndex: 10,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    pointerEvents: isTransitioning ? "none" : "auto",
                }}
            >
                {cards.map((card, index) => {
                    const col = index % cols;
                    const row = Math.floor(index / cols);

                    const bgPosX = -(col * cellWidth) - xOffset;
                    const bgPosY = -(row * cellHeight) - yOffset;

                    return (
                        <div
                            key={index}
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: isMobile ? "4px" : "10px",
                            }}
                        >
                            <FlipCard
                                id={card.id}
                                globalFlip={globalFlip}
                                randomDelay={randomDelays[index] || 0}
                                revealMode={false}
                                useDelay={useFlipDelay}
                                resetTrigger={resetTrigger}
                                onGlobalClick={toggleGlobalFlip}
                                front={
                                    isTransitioning ? (
                                        <div
                                            style={{
                                                height: "100%",
                                                width: "100%",
                                                borderRadius: isMobile ? "4px" : "10px",
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                height: "100%",
                                                width: "100%",
                                                borderRadius: isMobile ? "4px" : "10px",
                                                backgroundImage: "url('/static/hero-mask2.png')",
                                                backgroundSize: `${bgWidth}px ${bgHeight}px`,
                                                backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                                                backgroundRepeat: "no-repeat",
                                                backgroundColor: "#171C33",
                                                transition: "all 0.3s ease",
                                            }}
                                        />
                                    )
                                }
                                back={
                                    <div
                                        style={{
                                            height: "100%",
                                            width: "100%",
                                            borderRadius: isMobile ? "4px" : "10px",
                                            // The flipped card's background IS the ascii ocean:
                                            // transparent pane, hairline edge only, so the card
                                            // grid still reads over the water.
                                            backgroundColor: "transparent",
                                            border: "1px solid rgba(111, 100, 235, 0.22)",
                                            transition: "all 0.3s ease",
                                        }}
                                    />
                                }
                            />
                        </div>
                    );
                })}
            </div>

            {/* Centered Profile Card when Flipped */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    opacity: globalFlip && !isTransitioning ? 1 : 0,
                    transition: isTransitioning ? "none" : "opacity 0.3s ease",
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: "#171C33",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1.5px solid rgba(111, 100, 235, 0.4)",
                        borderRadius: "1.25rem",
                        padding: isMobile ? "1.5rem" : "2.25rem 2.5rem",
                        textAlign: "center",
                        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(111, 100, 235, 0.3)",
                        width: "90%",
                        maxWidth: "420px",
                        transform: globalFlip && !isTransitioning ? "scale(1)" : "scale(0.95)",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        color: "#ffffff",
                        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
                        pointerEvents: globalFlip && !isTransitioning ? "auto" : "none",
                    }}
                >
                    <div style={{ marginBottom: "1rem" }}>
                        <img
                            src="https://media1.tenor.com/m/juxuFY7b89UAAAAd/jiwoo-hearts2hearts.gif"
                            alt="chjwoo profile"
                            style={{
                                width: isMobile ? "80px" : "96px",
                                height: isMobile ? "80px" : "96px",
                                borderRadius: "9999px",
                                border: "2.5px solid #6f64eb",
                                margin: "0 auto",
                                boxShadow: "0 0 20px rgba(111, 100, 235, 0.6)",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>

                    <h1
                        style={{
                            fontSize: isMobile ? "1.75rem" : "2.25rem",
                            fontWeight: 700,
                            color: "#ffffff",
                            marginBottom: "0.4rem",
                            letterSpacing: "0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        chjwoo
                    </h1>

                    <p
                        style={{
                            color: "#9ca3af",
                            fontSize: isMobile ? "0.875rem" : "1rem",
                            fontWeight: 500,
                            marginBottom: "0.25rem",
                            lineHeight: 1.4,
                        }}
                    >
                        Offensive Security & CTF Player
                    </p>

                    <p
                        style={{
                            color: "#c4b5fd",
                            fontSize: isMobile ? "0.875rem" : "1rem",
                            fontWeight: 500,
                            marginBottom: "1.5rem",
                            lineHeight: 1.4,
                        }}
                    >
                        Founder of Nusahack
                    </p>

                    <button
                        type="button"
                        onClick={handleEnterSite}
                        style={{
                            display: "inline-block",
                            padding: isMobile ? "0.7rem 1.75rem" : "0.75rem 2.25rem",
                            borderRadius: "9999px",
                            backgroundColor: "#6f64eb",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: isMobile ? "0.95rem" : "1.05rem",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 0 25px rgba(111, 100, 235, 0.6)",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 0 35px rgba(111, 100, 235, 0.9)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 0 25px rgba(111, 100, 235, 0.6)";
                        }}
                    >
                        Enter Site
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
