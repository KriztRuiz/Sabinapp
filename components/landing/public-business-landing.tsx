// components/landing/public-business-landing.tsx

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

export function PublicBusinessLanding({ data }: Props) {
  /*
    Router visual del negocio público.

    Cada modo visual tiene su propio componente.
    Classic queda como base segura y fallback.
  */

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
