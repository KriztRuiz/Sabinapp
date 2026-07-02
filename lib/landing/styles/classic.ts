// lib/landing/styles/classic.ts

import type { LandingStyles } from "./types";

export const classicStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#f8f1e7] text-[#21170f]",
  background:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f8f1e7,#fffaf3)]",
  container: "relative mx-auto max-w-7xl px-5 py-6 sm:px-8",
  nav: "sticky top-4 z-40 rounded-2xl border border-[#dfcdb4] bg-[#fffaf3]/90 px-5 py-3 text-[#21170f] shadow-sm backdrop-blur",
  navPill:
    "rounded-xl px-3 py-1.5 text-sm text-[#6d5945] transition hover:bg-[#efe1cf] hover:text-[#21170f]",
  badge:
    "inline-flex w-fit rounded-full border border-[#d6b98e] bg-[#f3e2c9] px-4 py-2 text-sm font-semibold text-[#7c4f1d]",
  heading: "text-[#1d130b]",
  text: "text-[#3f3022]",
  mutedText: "text-[#716252]",
  sectionLabel: "text-[#9a641f]",
  heroGrid:
    "grid min-h-[72vh] items-center gap-10 py-14 lg:grid-cols-[1fr_0.9fr]",
  heroImageCard:
    "relative rounded-[1.5rem] border border-[#d8c3a3] bg-[#efe1cf] p-3 shadow-xl shadow-[#5c3b14]/10",
  heroImage: "h-[500px] w-full rounded-[1rem] object-cover",
  heroOverlay:
    "absolute bottom-6 left-6 right-6 rounded-2xl bg-[#21170f]/85 p-5 text-white",
  card: "rounded-2xl border border-[#dfcdb4] bg-white/80 p-6 shadow-sm",
  featuredCard:
    "rounded-2xl border border-[#d6b98e] bg-[#fffaf3] p-5 shadow-md shadow-[#5c3b14]/5",
  galleryCard:
    "overflow-hidden rounded-2xl border border-[#dfcdb4] bg-white shadow-sm",
  buttonPrimary:
    "rounded-full bg-[#21170f] px-7 py-4 text-center font-bold text-white transition hover:bg-[#7c4f1d]",
  buttonSecondary:
    "rounded-full border border-[#21170f] bg-transparent px-7 py-4 text-center font-bold text-[#21170f] transition hover:bg-[#21170f] hover:text-white",
  tag: "rounded-full border border-[#d6b98e] bg-white/70 px-3 py-1 text-xs font-medium text-[#7c4f1d]",
  price: "text-[#9a641f]",
  divider: "border-[#dfcdb4]",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-2xl border border-[#dfcdb4] bg-[#fffaf3]/95 p-3 shadow-xl backdrop-blur",
    item: "flex items-center gap-3 rounded-xl px-3 py-3 text-[#21170f] transition hover:bg-[#efe1cf]",
    button:
      "rounded-full bg-[#21170f] px-5 py-4 font-semibold text-white shadow-xl transition hover:scale-105",
  },
};