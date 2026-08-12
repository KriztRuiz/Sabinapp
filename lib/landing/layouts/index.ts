import { normalizeLandingVisualMode } from "@/lib/landing/styles";
import type { LandingVisualMode } from "@/lib/landing/styles/types";
import { classicLayout } from "./classic";
import { compactLayout } from "./compact";
import { elegantLayout } from "./elegant";
import { impactLayout } from "./impact";
import { modernLayout } from "./modern";
import type { LandingModeLayout } from "./types";
import { warmLayout } from "./warm";

export const landingLayoutsByMode: Record<
  LandingVisualMode,
  LandingModeLayout
> = {
  classic: classicLayout,
  modern: modernLayout,
  warm: warmLayout,
  compact: compactLayout,
  elegant: elegantLayout,
  impact: impactLayout,
};

export function getLandingModeLayout(mode?: string | null) {
  return landingLayoutsByMode[normalizeLandingVisualMode(mode)];
}

export type {
  LandingModeLayout,
  LandingSectionKey,
  LandingSectionLayout,
  LandingSectionPresentation,
} from "./types";
