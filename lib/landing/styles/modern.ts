import type { LandingStyles } from "./types";

export const modernStyles: LandingStyles = {
  page:
    "min-h-screen overflow-hidden bg-slate-950 text-white selection:bg-cyan-300 selection:text-slate-950",

  background:
    "pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.26),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_32%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.14),transparent_36%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]",

  container:
    "mx-auto w-full max-w-7xl px-5 py-5 sm:px-6 lg:px-8",

  nav:
    "sticky top-4 z-40 rounded-full border border-white/10 bg-slate-950/75 px-5 py-3 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl",

  navPill:
    "rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white",

  brandIcon:
    "flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-2xl shadow-lg shadow-cyan-950/40",

  badge:
    "inline-flex w-fit items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-200",

  heading:
    "text-white",

  text:
    "text-slate-100",

  mutedText:
    "text-slate-300",

  sectionLabel:
    "text-cyan-300",

  heroGrid:
    "grid min-h-[calc(100vh-7rem)] items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-24",

  heroImageCard:
    "group relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-white/5 p-2 shadow-2xl shadow-cyan-950/50 ring-1 ring-white/10 md:min-h-[30rem]",

  heroImage:
    "h-full min-h-[22rem] w-full rounded-[1.5rem] object-cover transition duration-700 group-hover:scale-105 md:min-h-[30rem]",

  heroPlaceholder:
    "flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-dashed border-cyan-300/30 bg-white/5 p-8 text-center md:min-h-[30rem]",

  heroOverlay:
    "absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/10 bg-slate-950/75 p-4 text-white shadow-2xl backdrop-blur-xl md:inset-x-6 md:bottom-6 md:p-5",

  card:
    "rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/30 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.09]",

  featuredCard:
    "rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-white/[0.12] via-white/[0.07] to-cyan-300/[0.08] p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/50",

  galleryCard:
    "group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-2 shadow-xl shadow-slate-950/40 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40",

  buttonPrimary:
    "inline-flex items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/40 transition hover:-translate-y-0.5 hover:bg-white",

  buttonSecondary:
    "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/30 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-300/10",

  tag:
    "inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200",

  price:
    "text-cyan-300",

  divider:
    "border-white/10 bg-white/[0.04]",

  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 grid gap-2 rounded-[1.5rem] border border-cyan-300/20 bg-slate-950/85 p-3 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl",
    item:
      "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-100 transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-300/10",
    button:
      "inline-flex min-h-14 min-w-[9.5rem] items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-2xl shadow-cyan-950/60 transition hover:scale-105 hover:bg-white",
  },
};
