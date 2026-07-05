// lib/landing/styles/modern.ts

import type { LandingStyles } from "./types";

export const modernStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#080605] text-orange-50",
  background:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_34%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.20),transparent_28%),linear-gradient(180deg,#080605,#140d09)]",
  container: "relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8",
  nav: "sticky top-4 z-40 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-orange-50 shadow-2xl shadow-black/30 backdrop-blur-xl",
  navPill:
    "rounded-full px-3 py-1.5 text-sm text-orange-100/75 transition hover:bg-white/10 hover:text-white",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-orange-500 text-lg text-white shadow-lg shadow-orange-950/40",
  badge:
    "inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200",
  heading: "text-white",
  text: "text-orange-50/90",
  mutedText: "text-orange-100/60",
  sectionLabel: "text-orange-300",
  heroGrid:
    "grid min-h-[78vh] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]",
  heroImageCard:
    "relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl",
  heroImage: "h-[520px] w-full rounded-[1.5rem] object-cover",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-orange-400/30 bg-white/5 p-8 text-center",
  heroOverlay:
    "absolute bottom-7 left-7 right-7 rounded-3xl border border-white/15 bg-black/45 p-5 text-white backdrop-blur-xl",
  card: "rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/25 backdrop-blur-xl",
  featuredCard:
    "rounded-[2rem] border border-orange-400/30 bg-gradient-to-br from-orange-500/15 via-white/[0.06] to-red-500/10 p-5 shadow-2xl shadow-black/30",
  galleryCard:
    "overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-xl shadow-black/25",
  buttonPrimary:
    "rounded-full bg-orange-500 px-7 py-4 text-center font-bold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400",
  buttonSecondary:
    "rounded-full border border-white/15 bg-white/[0.06] px-7 py-4 text-center font-bold text-orange-50 transition hover:-translate-y-0.5 hover:bg-white/[0.12]",
  tag: "rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-100",
  price: "text-orange-300",
  divider: "border-white/10",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-white/10 bg-[#130d09]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-orange-50 transition hover:bg-white/10",
    button:
      "rounded-full bg-orange-500 px-5 py-4 font-semibold text-white shadow-2xl shadow-orange-950/50 transition hover:scale-105 hover:bg-orange-400",
  },
};