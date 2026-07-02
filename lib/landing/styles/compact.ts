// lib/landing/styles/compact.ts

import type { LandingStyles } from "./types";

export const compactStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-slate-50 text-slate-950",
  background: "pointer-events-none absolute inset-0 bg-slate-50",
  container: "relative mx-auto max-w-5xl px-4 py-4 sm:px-6",
  nav: "sticky top-3 z-40 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-950 shadow-sm",
  navPill:
    "rounded-lg px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
  badge:
    "inline-flex w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700",
  heading: "text-slate-950",
  text: "text-slate-700",
  mutedText: "text-slate-500",
  sectionLabel: "text-slate-500",
  heroGrid:
    "grid min-h-[58vh] items-center gap-6 py-10 lg:grid-cols-[1fr_0.8fr]",
  heroImageCard:
    "relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm",
  heroImage: "h-[360px] w-full rounded-xl object-cover",
  heroOverlay:
    "absolute bottom-4 left-4 right-4 rounded-xl bg-slate-950/80 p-4 text-white",
  card: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
  featuredCard:
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
  galleryCard:
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
  buttonPrimary:
    "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800",
  buttonSecondary:
    "rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-slate-100",
  tag: "rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  price: "text-slate-950",
  divider: "border-slate-200",
  contactHub: {
    wrapper: "fixed bottom-4 right-4 z-50",
    panel:
      "mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl",
    item: "flex items-center gap-3 rounded-xl px-3 py-2 text-slate-800 transition hover:bg-slate-100",
    button:
      "rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105",
  },
};