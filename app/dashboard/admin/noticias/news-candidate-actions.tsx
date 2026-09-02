"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  candidateId: string;
  title: string;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
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

export function NewsCandidateActions({ candidateId, title }: Props) {
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<
    "publish" | "reject" | null
  >(null);

  function redirectWithMessage(type: "message" | "error", message: string) {
    router.push(buildAdminNewsUrl(type, message));
  }

  async function publishCandidate() {
    const confirmed = window.confirm(
      `¿Publicar este candidato como noticia local?\n\n${title}`,
    );

    if (!confirmed) {
      return;
    }

    setPendingAction("publish");

    try {
      const response = await fetch("/api/admin/news/candidates/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.ok) {
        redirectWithMessage(
          "error",
          data.message || "No se pudo publicar el candidato.",
        );
        return;
      }

      redirectWithMessage(
        "message",
        data.message || "Candidato publicado correctamente.",
      );
    } catch {
      redirectWithMessage("error", "Error de conexión al publicar candidato.");
    } finally {
      setPendingAction(null);
    }
  }

  async function rejectCandidate() {
    const rejectionReason = window.prompt(
      "Motivo del rechazo:",
      "No tiene suficiente relación confirmada con Sabinas Hidalgo.",
    );

    if (rejectionReason === null) {
      return;
    }

    const normalizedReason = rejectionReason.trim();

    if (!normalizedReason) {
      redirectWithMessage("error", "Escribe un motivo para rechazar.");
      return;
    }

    setPendingAction("reject");

    try {
      const response = await fetch("/api/admin/news/candidates/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId,
          rejectionReason: normalizedReason,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.ok) {
        redirectWithMessage(
          "error",
          data.message || "No se pudo rechazar el candidato.",
        );
        return;
      }

      redirectWithMessage(
        "message",
        data.message || "Candidato rechazado correctamente.",
      );
    } catch {
      redirectWithMessage("error", "Error de conexión al rechazar candidato.");
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = Boolean(pendingAction);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={publishCandidate}
        disabled={isBusy}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendingAction === "publish" ? "Publicando..." : "Publicar"}
      </button>

      <button
        type="button"
        onClick={rejectCandidate}
        disabled={isBusy}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendingAction === "reject" ? "Rechazando..." : "Rechazar"}
      </button>
    </div>
  );
}
