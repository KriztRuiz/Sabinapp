"use client";

import { useState } from "react";

import { InterstitialAdModal } from "@/components/ads/interstitial-ad-modal";

import type {
  PublicAdCampaign,
} from "@/lib/ads/public-ads";

type Props = {
  campaigns: PublicAdCampaign[];
  readError: string | null;
};

export function InterstitialAdPreview({
  campaigns,
  readError,
}: Props) {
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const selectedCampaign =
    campaigns.find(
      (campaign) =>
        campaign.id === selectedId,
    ) ?? null;

  return (
    <section className="space-y-4 rounded-3xl border border-violet-200 bg-violet-50 p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">
          J10-7B · Solo desarrollo
        </p>

        <h2 className="mt-2 text-2xl font-black text-gray-950">
          Vista previa de Campaña B
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-700">
          Prueba los anuncios emergentes con archivos
          reales de Storage, sin activar campañas ni
          registrar métricas.
        </p>
      </div>

      {readError ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
          Error al consultar archivos: {readError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() =>
              setSelectedId(campaign.id)
            }
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"
          >
            Probar {campaign.assets[0]?.type === "video"
              ? "video"
              : `${campaign.assets.length} imágenes`}
          </button>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-gray-700">
          No se encontraron composiciones válidas.
          Comprueba que las campañas de prueba y sus
          archivos sean visibles para tu sesión.
        </p>
      ) : null}

      {selectedCampaign ? (
        <InterstitialAdModal
          key={selectedCampaign.id}
          campaign={selectedCampaign}
          onClose={() =>
            setSelectedId(null)
          }
        />
      ) : null}
    </section>
  );
}
