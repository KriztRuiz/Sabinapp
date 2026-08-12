// lib/landing/styles/index.ts

import { classicStyles } from "./classic";
import { compactStyles } from "./compact";
import { elegantStyles } from "./elegant";
import { impactStyles } from "./impact";
import { modernStyles } from "./modern";
import type { LandingStyles, LandingVisualMode } from "./types";
import { warmStyles } from "./warm";

export const landingVisualModes = [
  "classic",
  "modern",
  "warm",
  "compact",
  "elegant",
  "impact",
] as const satisfies readonly LandingVisualMode[];

export const landingVisualModeOptions: {
  key: LandingVisualMode;
  name: string;
  description: string;
}[] = [
  {
    key: "modern",
    name: "Modern",
    description:
      "Visual, actual y orientado a contacto rápido. Destaca fotos, productos fuertes y llamada a la acción.",
  },
  {
    key: "classic",
    name: "Classic",
    description: "Tradicional, claro, ordenado y fácil de leer.",
  },
  {
    key: "warm",
    name: "Warm",
    description:
      "Cálido, cercano, ideal para comida, eventos o negocios familiares.",
  },
  {
    key: "compact",
    name: "Compact",
    description:
      "Simple, directo y funcional para servicios técnicos o listados rápidos.",
  },
  {
    key: "elegant",
    name: "Elegant",
    description: "Sobrio, profesional y premium para servicios formales.",
  },
  {
    key: "impact",
    name: "Impact",
    description:
      "Fuerte, promocional y visualmente agresivo para eventos o anuncios.",
  },
];

export const landingStylesByMode: Record<LandingVisualMode, LandingStyles> = {
  classic: classicStyles,
  modern: modernStyles,
  warm: warmStyles,
  compact: compactStyles,
  elegant: elegantStyles,
  impact: impactStyles,
};

export function isLandingVisualMode(
  mode: string | null | undefined,
): mode is LandingVisualMode {
  if (!mode) {
    return false;
  }

  return landingVisualModes.includes(mode as LandingVisualMode);
}

export function normalizeLandingVisualMode(
  mode?: string | null,
): LandingVisualMode {
  return isLandingVisualMode(mode) ? mode : "modern";
}

export function getLandingStyles(mode?: string | null) {
  return landingStylesByMode[normalizeLandingVisualMode(mode)];
}

export type { LandingStyles, LandingVisualMode };