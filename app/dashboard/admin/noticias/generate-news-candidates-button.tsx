"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  candidatesFound?: number;
  candidatesStored?: number;
  duplicatesSkipped?: number;
};

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();

  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    return {
      ok: false,
      message: text || "Respuesta inválida del servidor.",
    };
  }
}

function buildAdminNewsUrl(type: "message" | "error", message: string) {
  const params = new URLSearchParams();
  params.set(type, message);

  return `/dashboard/admin/noticias?${params.toString()}`;
}

export function GenerateNewsCandidatesButton() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateCandidates() {
    const confirmed = window.confirm(
      [
        "¿Buscar noticias recientes?",
        "",
        "Esto llamará a OpenAI y puede consumir crédito de API.",
        "Se guardarán noticias candidatas para revisión.",
        "No se publicará nada automáticamente.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/news/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dryRun: false,
          maxCandidates: 5,
          queryLimit: 4,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.ok) {
        router.push(
          buildAdminNewsUrl(
            "error",
            data.message || "No se pudieron generar candidatos.",
          ),
        );
        return;
      }

      const message = [
        data.message || "Noticias candidatas generadas correctamente.",
        `Encontrados: ${data.candidatesFound ?? 0}.`,
        `Guardados: ${data.candidatesStored ?? 0}.`,
        `Duplicados omitidos: ${data.duplicatesSkipped ?? 0}.`,
      ].join(" ");

      router.push(buildAdminNewsUrl("message", message));
      router.refresh();
    } catch {
      router.push(
        buildAdminNewsUrl(
          "error",
          "Error de conexión al generar candidatos.",
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={generateCandidates}
      disabled={isGenerating}
      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating ? "Buscando noticias..." : "Buscar noticias"}
    </button>
  );
}
