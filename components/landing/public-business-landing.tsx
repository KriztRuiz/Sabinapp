// components/landing/public-business-landing.tsx

import { BusinessReviewsSection } from "./business-reviews-section";
import { ClassicBusinessLanding } from "./modes/classic-business-landing";
import { CompactBusinessLanding } from "./modes/compact-business-landing";
import { ElegantBusinessLanding } from "./modes/elegant-business-landing";
import { ImpactBusinessLanding } from "./modes/impact-business-landing";
import { ModernBusinessLanding } from "./modes/modern-business-landing";
import { WarmBusinessLanding } from "./modes/warm-business-landing";
import type { PublicLandingData } from "@/lib/landing/styles/types";

type Props = {
  data: PublicLandingData;
};

function getClassicLandingData(data: PublicLandingData): PublicLandingData {
  return {
    ...data,
    visualMode: "classic",
  };
}

function getLandingByMode(data: PublicLandingData) {
  switch (data.visualMode) {
    case "modern":
      return <ModernBusinessLanding data={data} />;

    case "compact":
      return <CompactBusinessLanding data={data} />;

    case "warm":
      return <WarmBusinessLanding data={data} />;

    case "elegant":
      return <ElegantBusinessLanding data={data} />;

    case "impact":
      return <ImpactBusinessLanding data={data} />;

    case "classic":
    default:
      return <ClassicBusinessLanding data={getClassicLandingData(data)} />;
  }
}

export function PublicBusinessLanding({ data }: Props) {
  return (
    <>
      {getLandingByMode(data)}
      <BusinessReviewsSection data={data} />
    </>
  );
}
