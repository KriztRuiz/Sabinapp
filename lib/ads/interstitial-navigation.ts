"use client";

const CLICKED_DESTINATION_KEY =
  "sabinapp:interstitial:clicked-destination:v1";

const DESTINATION_TTL_MS = 2 * 60 * 1000;

type ClickedDestination = {
  campaignId: string;
  pathname: string;
  expiresAt: number;
};

function clearClickedDestination() {
  try {
    window.localStorage.removeItem(
      CLICKED_DESTINATION_KEY,
    );
  } catch {
    // La navegación debe funcionar sin localStorage.
  }
}

/**
 * Registrar el destino de un clic real en Campaña B.
 *
 * Solo aplica a páginas internas de negocios.
 * No cambia enlaces externos, tel: ni mailto:.
 */
export function rememberClickedInterstitialDestination(
  campaignId: string,
  targetUrl: string | null,
) {
  if (!targetUrl) {
    return;
  }

  let destination: URL;

  try {
    destination = new URL(
      targetUrl,
      window.location.origin,
    );
  } catch {
    return;
  }

  if (
    destination.origin !== window.location.origin ||
    !/^\/negocio\/[^/]+\/?$/.test(
      destination.pathname,
    )
  ) {
    return;
  }

  const pending: ClickedDestination = {
    campaignId,
    pathname: destination.pathname,
    expiresAt: Date.now() + DESTINATION_TTL_MS,
  };

  try {
    window.localStorage.setItem(
      CLICKED_DESTINATION_KEY,
      JSON.stringify(pending),
    );
  } catch {
    // No impedimos que el enlace funcione.
  }
}

/**
 * Consumir una sola vez la exclusión en el destino.
 *
 * Si el visitante llega a otra página, conserva
 * el dato hasta visitar el destino o expirar.
 */
export function consumeClickedInterstitialDestination():
  string | null {
  let raw: string | null;

  try {
    raw = window.localStorage.getItem(
      CLICKED_DESTINATION_KEY,
    );
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    clearClickedDestination();
    return null;
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    clearClickedDestination();
    return null;
  }

  const pending =
    parsed as Partial<ClickedDestination>;

  if (
    typeof pending.campaignId !== "string" ||
    !pending.campaignId ||
    typeof pending.pathname !== "string" ||
    typeof pending.expiresAt !== "number" ||
    !Number.isFinite(pending.expiresAt)
  ) {
    clearClickedDestination();
    return null;
  }

  if (Date.now() >= pending.expiresAt) {
    clearClickedDestination();
    return null;
  }

  if (
    window.location.pathname !==
    pending.pathname
  ) {
    return null;
  }

  clearClickedDestination();

  return pending.campaignId;
}
