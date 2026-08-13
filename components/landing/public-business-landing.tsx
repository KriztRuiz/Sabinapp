// components/landing/public-business-landing.tsx

import { ClassicBusinessLanding } from "./modes/classic-business-landing";
import { CompactBusinessLanding } from "./modes/compact-business-landing";
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
    Router visual de landing.

    Classic queda como base segura.
    Por ahora los demás modos caen en Classic mientras creamos
    componentes propios para Modern, Compact, Warm, Elegant e Impact.
  */

  switch (data.visualMode) {
    case "modern":
      return <ModernBusinessLanding data={data} />;

    case "compact":
      return <CompactBusinessLanding data={data} />;

    case "warm":
      return <WarmBusinessLanding data={data} />;

    case "elegant":
      return <ClassicBusinessLanding data={getClassicLandingData(data)} />;

    case "impact":
      return <ClassicBusinessLanding data={getClassicLandingData(data)} />;

    case "classic":
    default:
      return <ClassicBusinessLanding data={getClassicLandingData(data)} />;
  }
}
