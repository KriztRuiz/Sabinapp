// lib/landing/styles/elegant.ts

import type { LandingStyles } from "./types";

export const elegantStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#f5f1ea] text-[#151515]",
  background:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f5f1ea,#ffffff)]",
  container: "relative mx-auto max-w-7xl px-6 py-8 md:px-10",
  nav: "sticky top-4 z-40 rounded-none border-b border-[#d8c9b3] bg-[#f5f1ea]/90 px-0 py-4 text-[#151515] backdrop-blur",
  navPill:
    "px-3 py-1.5 text-sm text-[#6b6358] transition hover:text-[#9a7437]",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-[#151515] text-lg text-white shadow-sm",
  badge:
    "inline-flex w-fit border-b border-[#9a7437] px-0 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#9a7437]",
  heading: "text-[#151515]",
  text: "text-[#312a22]",
  mutedText: "text-[#6b6358]",
  sectionLabel: "text-[#9a7437]",
  heroGrid:
    "grid min-h-[72vh] items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr]",
  heroImageCard:
    "relative overflow-hidden rounded-[2rem] border border-[#d8c9b3] bg-[#e7ded0] shadow-xl",
  heroImage: "h-[520px] w-full object-cover",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center",
  heroOverlay:
    "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white",
  card: "rounded-3xl border border-[#ded6ca] bg-white/80 p-6 shadow-sm",
  featuredCard:
    "rounded-3xl border border-[#ded6ca] bg-[#faf7f1] p-6 shadow-sm",
  galleryCard:
    "overflow-hidden rounded-3xl border border-[#d8c9b3] bg-[#e7ded0] shadow-sm",
  buttonPrimary:
    "rounded-full bg-[#151515] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#9a7437]",
  buttonSecondary:
    "rounded-full border border-[#151515] px-7 py-4 text-center font-semibold text-[#151515] transition hover:bg-[#151515] hover:text-white",
  tag: "rounded-full border border-[#d7c7ad] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5840]",
  price: "text-[#9a7437]",
  divider: "border-[#ded6ca]",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-[#ded6ca] bg-white/95 p-3 shadow-2xl backdrop-blur",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-[#151515] transition hover:bg-[#faf7f1]",
    button:
      "rounded-full bg-[#151515] px-5 py-4 font-semibold text-white shadow-2xl transition hover:scale-105",
  },
};