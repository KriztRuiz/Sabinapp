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