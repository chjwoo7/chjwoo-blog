import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

declare global {
  interface Window {
    __motionReady?: boolean
  }
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function initMotion() {
  const root = document.documentElement

  if (prefersReducedMotion()) {
    root.classList.remove("motion")
    return
  }

  gsap.registerPlugin(ScrollTrigger)

  const reveal = gsap.utils.toArray<HTMLElement>("[data-reveal]")
  if (reveal.length > 0) {
    gsap.set(reveal, { y: 16 })
    gsap.to(reveal, {
      autoAlpha: 1,
      y: 0,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.055,
    })
  }

  gsap.utils.toArray<HTMLElement>("[data-reveal-scale]").forEach((el) => {
    gsap.set(el, { scale: 1.03 })
    gsap.to(el, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.7,
      ease: "power3.out",
    })
  })

  gsap.utils.toArray<HTMLElement>("[data-reveal-content]").forEach((el) => {
    gsap.set(el, { y: 10 })
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.12,
    })
  })

  gsap.utils.toArray<HTMLElement>("[data-reveal-scroll]").forEach((el) => {
    gsap.set(el, { y: 20 })
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    })
  })

  gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
    const items = Array.from(group.children)
    if (items.length === 0) return

    gsap.set(items, { y: 14 })
    gsap.to(items, {
      autoAlpha: 1,
      y: 0,
      duration: 0.45,
      ease: "power3.out",
      stagger: 0.05,
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    })
  })

  gsap.utils.toArray<HTMLElement>("[data-reveal-list]").forEach((list) => {
    const items = Array.from(list.children)
    if (items.length === 0) return

    gsap.set(items, { x: -8 })
    gsap.to(items, {
      autoAlpha: 1,
      x: 0,
      duration: 0.45,
      ease: "power3.out",
      stagger: 0.04,
    })
  })

  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: -4, scale: 1.1 },
      {
        yPercent: 4,
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    )
  })

  window.__motionReady = true
}
