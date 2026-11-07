import type { SvgComponent } from "astro/types"
import GitHub from "@/assets/icons/github.svg"
import RSS from "@/assets/icons/rss.svg"
import Twitter from "@/assets/icons/twitter.svg"

export const SITE = {
  title: "chjwoo",
  description: "This is my personal website for my portofolio and blog related to Cybersecurity",
  locale: "en-US",
  dir: "ltr",
  defaultPageImage: "/static/opengraph-image.png",
  defaultPostImage: "/static/1200x630.png",
} as const

export const NAVIGATION = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
]

export const SOCIALS: { href: string; label: string; icon: SvgComponent }[] = [
  { href: "https://github.com/chjwoo7", label: "GitHub", icon: GitHub },
  { href: "https://x.com/chjwoo7", label: "Twitter", icon: Twitter },
  { href: "/rss.xml", label: "RSS", icon: RSS },
]
