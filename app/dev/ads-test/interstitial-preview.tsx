"use client";

import { useState } from "react";

import {
  claimInterstitialOpportunity,
  INTERSTITIAL_LAST_SHOWN_KEY,
} from "@/lib/ads/interstitial-policy";

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

  const [
    decisionMessage,
    setDecisionMessage,
  ] = useState("Sin probar");

  const selectedCampaign =
    campaigns.find(
      (campaign) =>
        campaign.id === selectedId,
    ) ?? null;

  function testProbability() {
    let storage: Storage | null = null;

    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }

    const result = claimInterstitialOpportunity({
      eligibleCampaignCount: campaigns.length,
      nowMs: Date.now(),
      randomValue: Math.random(),
      storage,
    });

    setDecisionMessage(result.reason);

    if (result.shouldShow) {
      setSelectedId(campaigns[0].id);
    }
  }

  function resetDevelopmentCooldown() {
    try {
      window.localStorage.removeItem(
        INTERSTITIAL_LAST_SHOWN_KEY,
      );

      setDecisionMessage(
        "Cooldown reiniciado para pruebas",
      );
    } catch {
      setDecisionMessage(
        "No se pudo reiniciar localStorage",
      );
    }
  }

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

      <div className="rounded-2xl border border-violet-200 bg-white p-5">
        <h3 className="font-black text-gray-950">
          Prueba de probabilidad y cooldown
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Cada clic representa una oportunidad elegible.
          Si aparece el anuncio, comienza un cooldown
          de 30 minutos que persiste al recargar la página.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={testProbability}
            className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white hover:bg-gray-800"
          >
            Probar aparición 1/8
          </button>

          <button
            type="button"
            onClick={resetDevelopmentCooldown}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Reiniciar cooldown de prueba
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className="mt-4 text-sm font-bold text-violet-800"
        >
          Resultado: {decisionMessage}
        </p>
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
