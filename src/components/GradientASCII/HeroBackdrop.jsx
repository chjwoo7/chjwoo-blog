import { useEffect, useState } from "react"
import GradientASCII from "./GradientASCII.jsx"

export default function HeroBackdrop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      setShow(true)
    }

    window.addEventListener("flipgrid:enter", reveal)
    const fallback = window.setTimeout(reveal, 6000)

    return () => {
      window.removeEventListener("flipgrid:enter", reveal)
      window.clearTimeout(fallback)
    }
  }, [])

  if (!show) return null

  return (
    <GradientASCII
      colors={["#2930c3", "#6d73fe"]}
      shape="horizon"
      characters=" =+xX0S8#@"
      cellSize={16}
      density={0.6}
      glyphOpacity={0.72}
      gradientOpacity={0.45}
      glow={0.3}
      depthOfField={0.31}
      softness={0.23}
      scale={1.7}
      flow={1.2}
      speed={0.5}
      grain={0.05}
      scrambleRadius={0.15}
      style={{ width: "100%", height: "100%" }}
    />
  )
}
