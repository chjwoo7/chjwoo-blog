import { motion } from "framer-motion"
import { useEffect, useState, type ReactNode } from "react"

interface FlipCardProps {
  id: number
  front: ReactNode
  back: ReactNode
  globalFlip: boolean
  onGlobalClick: () => void
  randomDelay?: number
  revealMode?: boolean
  useDelay?: boolean
  resetTrigger?: number
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
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setIsHovered(false)
  }, [resetTrigger])

  const isFlipped = globalFlip ? !isHovered : isHovered

  return (
    <div
      onMouseEnter={() => !useDelay && setIsHovered(true)}
      onMouseLeave={() => !useDelay && setIsHovered(false)}
      onClick={onGlobalClick}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        cursor: "pointer",
        perspective: "1000px",
      }}
    >
      <motion.div
        initial={false}
        animate={{ rotateX: isFlipped ? 180 : 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          mass: 1,
          delay: useDelay ? randomDelay / 1000 : 0,
        }}
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            width: "100%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
          }}
        >
          {front}
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            width: "100%",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateX(180deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            backgroundColor: revealMode ? "transparent" : "#6f64eb",
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}
