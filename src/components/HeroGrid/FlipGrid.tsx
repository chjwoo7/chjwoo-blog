import { useState, useEffect } from "react";
import FlipCard from "./FlipCard";

export default function FlipGrid() {
    const [globalFlip, setGlobalFlip] = useState(false);
    const [randomDelays, setRandomDelays] = useState<number[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isFinished, setIsFinished] = useState(false); // New state to hide grid after transition
    const [useFlipDelay, setUseFlipDelay] = useState(false); // Only use random delay during global transitions
    const [resetTrigger, setResetTrigger] = useState(0); // Trigger to force reset hover states
    const [isMobile, setIsMobile] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Responsive Check & Dimensions
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Remove Curtain
    useEffect(() => {
        const curtain = document.getElementById('initial-curtain');
        if (curtain) {
            setTimeout(() => {
                curtain.style.transition = 'opacity 0.5s ease';
                curtain.style.opacity = '0';
                setTimeout(() => curtain.remove(), 500);
            }, 100);
        }
    }, []);

    // Lock Scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Grid Dimensions: Desktop 6x6, Mobile 4x9
    const cols = isMobile ? 4 : 6;
    const rows = isMobile ? 9 : 6;

    // --- MANUAL SIZING (CONTAINED) ---

    const minD = Math.min(dimensions.width, dimensions.height || 1);
    const bgWidth = minD * 0.65;
    const bgHeight = minD * 0.65;



    // Centering offsets
    const xOffset = (bgWidth - dimensions.width) / 2;
    const yOffset = (bgHeight - dimensions.height) / 2;

    // Cell Dimensions
    const cellWidth = dimensions.width / cols;
    const cellHeight = dimensions.height / rows;

    // Create exact 6x6 grid = 36 cards
    const cards = Array.from({ length: 36 }, (_, i) => ({ id: i }));

    // Generate random delays once on mount
    // Generate random delays once on mount
    useEffect(() => {
        const delays = cards.map(() => Math.random() * 300); // Random 0-300ms
        setRandomDelays(delays);
    }, []);

    const toggleGlobalFlip = () => {
        if (isTransitioning) return;
        setUseFlipDelay(true);
        setResetTrigger(prev => prev + 1); // Force reset all hover states
        setGlobalFlip(!globalFlip);
        // Reset delay usage after animation completes so hovers are instant
        setTimeout(() => setUseFlipDelay(false), 800);
    };

    const handleEnterSite = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        // Unlock Scroll
        document.body.style.overflow = '';

        setUseFlipDelay(true);    // Activate delay for transition
        setResetTrigger(prev => prev + 1); // Force reset all hover states
        setIsTransitioning(true); // 1. Set mode transisi (Front jadi transparan)
        setGlobalFlip(false);     // 2. Flip balik ke Front

        // 3. Remove Grid from DOM after animation completes so user can interact with site
        setTimeout(() => {
            setIsFinished(true);
        }, 1200);
    };

    // If animation finished, don't render anything (allow interaction with underlying site)
    if (isFinished) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-transparent pointer-events-none">
            {/* Background blocker: Prevents leaks through gaps initially. Hidden instantly on click. */}
            <div className={`absolute inset-0 bg-[#0D1326] ${isTransitioning ? 'hidden' : 'block'}`} />

            {/* STRICT 6x6 Grid: 6 Columns x 6 Rows = 36 Cards */}
            <div className={`grid h-full w-full gap-1 p-1 relative z-10 ${isTransitioning ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                {cards.map((card, index) => {
                    // Calculate Grid Position (Dynamic)
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    console.log(col, row);

                    // Specific Position for this card (Front - Centered)
                    const bgPosX = -(col * cellWidth) - xOffset;
                    const bgPosY = -(row * cellHeight) - yOffset;

                    // BACK CARD: Center-Top Aligned
                    // X: Centered (Use xOffset)
                    // Y: Top (No yOffset)
                    const bgPosXBack = -(col * cellWidth) - xOffset;
                    const bgPosYBack = -(row * cellHeight);

                    return (
                        <div key={index} className="w-full h-full relative overflow-hidden rounded-[4px] sm:rounded-[10px]">
                            <FlipCard
                                id={card.id}
                                index={index}
                                globalFlip={globalFlip}
                                randomDelay={randomDelays[index] || 0}
                                revealMode={false} // Unused for this logic
                                useDelay={useFlipDelay} // Pass the DELAY state here, correct prop name
                                resetTrigger={resetTrigger} // Pass reset trigger
                                onGlobalClick={toggleGlobalFlip}
                                front={
                                    isTransitioning ? (
                                        // Transition Mode: Transparent Front (Reveal Iframe)
                                        <div className="h-full w-full rounded-[4px] sm:rounded-[10px] bg-transparent" />
                                    ) : (
                                        // Normal Mode: Image Mask
                                        <div
                                            className="h-full w-full transition-all duration-300 relative group rounded-[4px] sm:rounded-[10px]"
                                            style={{
                                                backgroundImage: "url('/static/hero-mask2.png')",
                                                backgroundSize: `${bgWidth}px ${bgHeight}px`, // Use calculated PX size
                                                backgroundPosition: `${bgPosX}px ${bgPosY}px`, // Use calculated PX position
                                                backgroundRepeat: 'no-repeat',
                                                backgroundColor: '#171C33'
                                            }}
                                        />
                                    )
                                }
                                back={
                                    <div
                                        className="h-full w-full transition-all duration-300 relative group rounded-[4px] sm:rounded-[10px]"
                                        style={{
                                            backgroundImage: "url('/static/hero-flipped-mask.svg')",
                                            backgroundSize: `${bgWidth}px ${bgHeight}px`, // Same scale logic
                                            backgroundPosition: `${bgPosXBack}px ${bgPosYBack}px`, // Top-Left Aligned
                                            backgroundRepeat: 'no-repeat',
                                            backgroundColor: '#6f64eb'
                                        }}
                                    />
                                }
                            />
                        </div>
                    );
                })}
            </div>

            {/* Centered Info when Flipped */}
            <div className={`absolute inset-0 pointer-events-none flex items-center justify-center z-20 ${isTransitioning ? 'duration-0' : 'transition-opacity duration-300'} ${globalFlip && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className={`bg-[#171C33] backdrop-blur-xl p-6 sm:p-8 rounded-2xl text-center shadow-2xl transition-all duration-300 w-[90%] max-w-sm sm:max-w-md translate-y-12 sm:translate-y-32 ${globalFlip && !isTransitioning ? 'pointer-events-auto scale-100' : 'pointer-events-none scale-95'}`}>
                    <div className="shrink-0 mb-4">
                        <img
                            src="https://media1.tenor.com/m/juxuFY7b89UAAAAd/jiwoo-hearts2hearts.gif"
                            alt="Profile"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#6f64eb] mx-auto shadow-[0_0_15px_rgba(111,100,235,0.5)] object-cover"
                        />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-wide font-outfit">
                        chjwoo
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base font-medium mb-0 font-space-grotesk">
                        Offensive Security & CTF Player
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base font-medium mb-6 font-space-grotesk">
                        Founder of Nusahack
                    </p>

                    <a
                        href="#"
                        onClick={handleEnterSite}
                        className="inline-block px-6 py-3 sm:px-8 sm:py-3 rounded-full bg-[#6f64eb] text-white font-bold text-sm sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(111,100,235,0.6)] active:scale-95 cursor-pointer"
                        data-astro-prefetch="tap"
                    >
                        Enter Site
                    </a>
                </div>
            </div>
        </div>
    );
}
