/* eslint-disable @next/next/no-img-element */
"use client";

import type { PublicAdCampaign } from "@/lib/ads/public-ads";
import { useEffect, useMemo, useState } from "react";

type FixedAdBannerProps = {
  ads: PublicAdCampaign[];
  heading?: string;
};

function isExternalUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function FixedAdBanner({
  ads,
  heading = "Promocion local",
}: FixedAdBannerProps) {
  const campaign = useMemo(
    () =>
      ads.find(
        (ad) =>
          ad.type === "fixed_banner" &&
          ad.assets.some((asset) => asset.type === "image"),
      ) ?? null,
    [ads],
  );

  const assets = useMemo(
    () => campaign?.assets.filter((asset) => asset.type === "image") ?? [],
    [campaign],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (assets.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % assets.length);
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [assets.length]);

  if (!campaign || assets.length === 0) {
    return null;
  }

  const normalizedActiveIndex = activeIndex % assets.length;
  const activeAsset = assets[normalizedActiveIndex];
  const targetUrl = campaign.targetUrl;
  const targetLabel = campaign.targetLabel || "Ver promocion";
  const shouldOpenInNewTab = targetUrl ? isExternalUrl(targetUrl) : false;

  return (
    <aside className="overflow-hidden rounded-[2rem] border border-orange-200 bg-white shadow-xl shadow-orange-900/10">
      <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-64 overflow-hidden bg-orange-100 md:min-h-80">
          <img
            src={activeAsset.url}
            alt={activeAsset.altText}
            className="h-full min-h-64 w-full object-cover md:min-h-80"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute bottom-5 left-5 right-5">
            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
              Anuncio
            </span>

            <h3 className="mt-3 max-w-xl text-2xl font-black text-white md:text-3xl">
              {campaign.title}
            </h3>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-700">
              {heading}
            </p>

            {campaign.description ? (
              <p className="mt-4 text-base leading-7 text-gray-700">
                {campaign.description}
              </p>
            ) : (
              <p className="mt-4 text-base leading-7 text-gray-700">
                Conoce esta promocion disponible dentro de Sabinapp.
              </p>
            )}
          </div>

          <div className="space-y-5">
            {assets.length > 1 ? (
              <div className="flex gap-2">
                {assets.map((asset, index) => (
                  <button
                    key={asset.id}
                    type="button"
                    aria-label={`Ver imagen ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                    className={
                      index === normalizedActiveIndex
                        ? "h-2.5 w-8 rounded-full bg-orange-600"
                        : "h-2.5 w-2.5 rounded-full bg-orange-200"
                    }
                  />
                ))}
              </div>
            ) : null}

            {targetUrl ? (
              <a
                href={targetUrl}
                target={shouldOpenInNewTab ? "_blank" : undefined}
                rel={shouldOpenInNewTab ? "noreferrer" : undefined}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-700 md:w-auto"
              >
                {targetLabel}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
