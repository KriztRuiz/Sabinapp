"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  InterstitialAdModal,
} from "@/components/ads/interstitial-ad-modal";

import {
  claimViewerInterstitialOpportunity,
} from "@/lib/ads/interstitial-policy";

import type {
  PublicAdCampaign,
} from "@/lib/ads/public-ads";

type Props = {
  ads: PublicAdCampaign[];
  enabled: boolean;
  viewerId: string | null;
  businessId?: string | null;
};

function hasValidComposition(
  campaign: PublicAdCampaign,
) {
  if (
    campaign.type !== "interstitial"
  ) {
    return false;
  }

  const assets = campaign.assets;

  const validImages =
    assets.length >= 1 &&
    assets.length <= 6 &&
    assets.every(
      (asset) =>
        asset.type === "image" &&
        Boolean(asset.url),
    );

  const validVideo =
    assets.length === 1 &&
    assets[0].type === "video" &&
    Boolean(assets[0].url);

  return validImages || validVideo;
}

function selectRandomCampaign(
  campaigns: PublicAdCampaign[],
): PublicAdCampaign | null {
  if (campaigns.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * campaigns.length,
  );

  return campaigns[randomIndex] ?? null;
}

export function PublicInterstitial({
  ads,
  enabled,
  viewerId,
  businessId = null,
}: Props) {
  const attemptedRef = useRef(false);

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState<PublicAdCampaign | null>(
    null,
  );

  useEffect(() => {
    if (
      !enabled ||
      attemptedRef.current
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (attemptedRef.current) {
        return;
      }

      const eligible = ads.filter(
        hasValidComposition,
      );

      if (eligible.length === 0) {
        return;
      }

      // Registrar la oportunidad únicamente cuando
      // haya campañas elegibles y se vaya a evaluar.

      attemptedRef.current = true;

      let storage: Storage | null = null;

      try {
        storage = window.localStorage;
      } catch {
        storage = null;
      }

      const decision =
        claimViewerInterstitialOpportunity({
          viewerId,

          eligibleCampaignCount:
            eligible.length,

          nowMs: Date.now(),

          randomValue:
            Math.random(),

          storage,
        });

      if (!decision.shouldShow) {
        return;
      }

      // Selección uniforme: todas las campañas
      // elegibles tienen la misma probabilidad.

      const campaign =
        selectRandomCampaign(eligible);

      if (!campaign) {
        return;
      }

      setSelectedCampaign(campaign);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    ads,
    enabled,
    viewerId,
  ]);

  if (
    !enabled ||
    !selectedCampaign
  ) {
    return null;
  }

  return (
    <InterstitialAdModal
      campaign={selectedCampaign}
      trackMetrics={true}
      businessId={businessId}
      onClose={() =>
        setSelectedCampaign(null)
      }
    />
  );
}
