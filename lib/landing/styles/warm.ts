// lib/landing/styles/warm.ts

import type { LandingStyles } from "./types";

export const warmStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#fff7ed] text-[#431407]",
  background:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.35),transparent_34%),linear-gradient(180deg,#fff7ed,#fffbeb)]",
  container: "relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8",
  nav: "sticky top-4 z-40 rounded-full border border-orange-200 bg-white/75 px-5 py-3 text-stone-900 shadow-sm shadow-orange-900/5 backdrop-blur-xl",
  navPill:
    "rounded-full px-3 py-1.5 text-sm text-stone-700 transition hover:bg-orange-100 hover:text-orange-700",
  badge:
    "inline-flex w-fit rounded-full border border-orange-200 bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800",
  heading: "text-stone-950",
  text: "text-stone-800",
  mutedText: "text-stone-600",
  sectionLabel: "text-orange-700",
  heroGrid:
    "grid min-h-[76vh] items-center gap-10 py-16 lg:grid-cols-[1fr_1fr]",
  heroImageCard:
    "relative rounded-[2rem] border border-orange-200 bg-white/80 p-3 shadow-2xl shadow-orange-900/10 backdrop-blur-xl",
  heroImage: "h-[520px] w-full rounded-[1.5rem] object-cover",
  heroOverlay:
    "absolute bottom-7 left-7 right-7 rounded-3xl bg-orange-950/80 p-5 text-white backdrop-blur",
  card: "rounded-[2rem] border border-orange-200 bg-white/75 p-6 shadow-lg shadow-orange-900/5 backdrop-blur-xl",
  featuredCard:
    "rounded-[2rem] border border-orange-300 bg-gradient-to-br from-orange-100 via-white to-amber-50 p-5 shadow-xl shadow-orange-900/10",
  galleryCard:
    "overflow-hidden rounded-[2rem] border border-orange-200 bg-white/75 shadow-lg shadow-orange-900/5",
  buttonPrimary:
    "rounded-full bg-stone-950 px-7 py-4 text-center font-bold text-white shadow-lg shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-700",
  buttonSecondary:
    "rounded-full border border-orange-300 bg-white/70 px-7 py-4 text-center font-bold text-stone-900 transition hover:-translate-y-0.5 hover:bg-orange-100",
  tag: "rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800",
  price: "text-orange-700",
  divider: "border-orange-200",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-orange-200 bg-white/95 p-3 shadow-2xl shadow-orange-900/20 backdrop-blur-xl",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-stone-800 transition hover:bg-orange-100",
    button:
      "rounded-full bg-stone-950 px-5 py-4 font-semibold text-white shadow-2xl shadow-orange-900/30 transition hover:scale-105",
  },
};