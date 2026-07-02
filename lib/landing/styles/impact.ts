// lib/landing/styles/impact.ts

import type { LandingStyles } from "./types";

export const impactStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-black text-white",
  background:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.38),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.25),transparent_28%),linear-gradient(180deg,#000000,#111111)]",
  container: "relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8",
  nav: "sticky top-4 z-40 rounded-full border border-white/15 bg-black/70 px-5 py-3 text-white shadow-2xl backdrop-blur-xl",
  navPill:
    "rounded-full px-3 py-1.5 text-sm text-white/70 transition hover:bg-white hover:text-black",
  badge:
    "inline-flex w-fit rounded-full bg-rose-500 px-4 py-2 text-sm font-black uppercase tracking-wide text-white",
  heading: "text-white",
  text: "text-white/85",
  mutedText: "text-white/60",
  sectionLabel: "text-yellow-300",
  heroGrid:
    "grid min-h-[80vh] items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr]",
  heroImageCard:
    "relative rounded-[2.5rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-rose-950/40",
  heroImage: "h-[540px] w-full rounded-[2rem] object-cover contrast-110 saturate-125",
  heroOverlay:
    "absolute bottom-7 left-7 right-7 rounded-[2rem] bg-black/70 p-5 text-white backdrop-blur-xl",
  card: "rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30",
  featuredCard:
    "rounded-[2rem] border border-rose-400/40 bg-gradient-to-br from-rose-500/25 to-yellow-400/10 p-5 shadow-2xl shadow-rose-950/30",
  galleryCard:
    "overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl shadow-black/30",
  buttonPrimary:
    "rounded-full bg-rose-500 px-7 py-4 text-center font-black uppercase tracking-wide text-white shadow-2xl shadow-rose-950/50 transition hover:-translate-y-1 hover:bg-yellow-400 hover:text-black",
  buttonSecondary:
    "rounded-full border border-white/20 bg-white/10 px-7 py-4 text-center font-black uppercase tracking-wide text-white transition hover:-translate-y-1 hover:bg-white hover:text-black",
  tag: "rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white",
  price: "text-yellow-300",
  divider: "border-white/15",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-white/15 bg-black/90 p-3 shadow-2xl shadow-rose-950/40 backdrop-blur-xl",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-white transition hover:bg-white/10",
    button:
      "rounded-full bg-rose-500 px-5 py-4 font-black text-white shadow-2xl shadow-rose-950/50 transition hover:scale-105 hover:bg-yellow-400 hover:text-black",
  },
};