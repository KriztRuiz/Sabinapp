// lib/landing/business-settings.ts

import {
  normalizeLandingVisualMode,
  type LandingVisualMode,
} from "@/lib/landing/styles";

export type BusinessSettingsRelation =
  | {
      visual_mode: string | null;
    }
  | {
      visual_mode: string | null;
    }[]
  | null
  | undefined;

export function getBusinessVisualMode(
  settings: BusinessSettingsRelation,
): LandingVisualMode {
  if (Array.isArray(settings)) {
    return normalizeLandingVisualMode(settings[0]?.visual_mode);
  }

  return normalizeLandingVisualMode(settings?.visual_mode);
}