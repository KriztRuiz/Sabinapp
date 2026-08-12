import type { LandingVisualMode } from "@/lib/landing/styles/types";

export type LandingSectionKey =
  | "longDescription"
  | "featuredItems"
  | "gallery"
  | "items"
  | "hours"
  | "locations"
  | "tags"
  | "contactHub";

export type LandingSectionPresentation =
  | "hidden"
  | "compact"
  | "normal"
  | "featured";

export type LandingSectionLayout = {
  key: LandingSectionKey;
  order: number;
  presentation: LandingSectionPresentation;
  reason: string;
};

export type LandingModeLayout = {
  mode: LandingVisualMode;
  name: string;
  intent: string;
  heroStyle: "informative" | "visual" | "compact" | "premium" | "promotional";
  primaryFocus: LandingSectionKey[];
  sections: Record<LandingSectionKey, LandingSectionLayout>;
};
