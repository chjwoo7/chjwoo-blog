import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface FlipCardProps {
    id: number;
    front: React.ReactNode;
    back: React.ReactNode;
    globalFlip: boolean;
    onGlobalClick: () => void;
    index?: number;
    randomDelay?: number;
    revealMode?: boolean;
    useDelay?: boolean;
    resetTrigger?: number; // New prop to force reset hover
}

export default function FlipCard({
    front,
    back,
    globalFlip,
    onGlobalClick,
    randomDelay = 0,
    revealMode = false,
    useDelay = false,
    resetTrigger = 0,
}: FlipCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Reset hover state when global trigger fires
    useEffect(() => {
        setIsHovered(false);
    }, [resetTrigger]);

    // Card flips if globally flipped OR locally hovered
    const isFlipped = globalFlip ? !isHovered : isHovered;

    return (
        <div
            className="relative h-full w-full cursor-pointer perspective-1000"
            onMouseEnter={() => !useDelay && setIsHovered(true)} // Disable hover during global transition
            onMouseLeave={() => !useDelay && setIsHovered(false)}
            onClick={onGlobalClick}
        >
            <motion.div
                className="relative h-full w-full preserve-3d"
                initial={false}
                animate={{ rotateX: isFlipped ? 180 : 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    mass: 1,
                    delay: useDelay ? randomDelay / 1000 : 0, // Delay ONLY if useDelay is true
                }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front Face */}
                <div className="absolute inset-0 h-full w-full backface-hidden">
                    <div className="h-full w-full flex items-center justify-center rounded-[10px] transition-colors duration-300">
                        {front}
                    </div>
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 h-full w-full backface-hidden"
                    style={{ transform: "rotateX(180deg)" }}
                >
                    {revealMode ? (
                        // Reveal Mode: Transparent to show Iframe
                        <div className="h-full w-full rounded-[10px]" />
                    ) : (
                        // Normal Mode: Purple Back
                        <div className="h-full w-full flex items-center justify-center bg-[#6f64eb] text-black rounded-[10px]">
                            {back}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
