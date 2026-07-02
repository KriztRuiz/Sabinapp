// lib/landing/styles/index.ts

import { classicStyles } from "./classic";
import { compactStyles } from "./compact";
import { elegantStyles } from "./elegant";
import { impactStyles } from "./impact";
import { modernStyles } from "./modern";
import type { LandingStyles, LandingVisualMode } from "./types";
import { warmStyles } from "./warm";

export const landingStylesByMode: Record<LandingVisualMode, LandingStyles> = {
  classic: classicStyles,
  modern: modernStyles,
  warm: warmStyles,
  compact: compactStyles,
  elegant: elegantStyles,
  impact: impactStyles,
};

export function getLandingStyles(mode?: string | null) {
  if (
    mode === "classic" ||
    mode === "modern" ||
    mode === "warm" ||
    mode === "compact" ||
    mode === "elegant" ||
    mode === "impact"
  ) {
    return landingStylesByMode[mode];
  }

  return landingStylesByMode.modern;
}

export type { LandingStyles, LandingVisualMode };