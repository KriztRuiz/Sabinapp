/**
 * Sabinapp 1.0
 *
 * J10-7C - Política de aparición de Campaña B.
 *
 * Este módulo no utiliza React, Supabase ni localStorage.
 * Puede probarse de forma independiente.
 */

export const INTERSTITIAL_PROBABILITY = 1 / 8;

export const INTERSTITIAL_COOLDOWN_MINUTES = 30;

export const INTERSTITIAL_COOLDOWN_MS =
  INTERSTITIAL_COOLDOWN_MINUTES * 60 * 1000;

export type InterstitialDecisionReason =
  | "show"
  | "no_campaigns"
  | "cooldown"
  | "probability"
  | "invalid_input";

export type InterstitialDecision = {
  shouldShow: boolean;
  reason: InterstitialDecisionReason;
};

export type InterstitialDecisionInput = {
  eligibleCampaignCount: number;

  nowMs: number;

  lastShownAtMs: number | null;

  randomValue: number;

  probability?: number;

  cooldownMs?: number;
};

function deny(
  reason: InterstitialDecisionReason,
): InterstitialDecision {
  return {
    shouldShow: false,
    reason,
  };
}

export function decideInterstitialDisplay({
  eligibleCampaignCount,
  nowMs,
  lastShownAtMs,
  randomValue,
  probability = INTERSTITIAL_PROBABILITY,
  cooldownMs = INTERSTITIAL_COOLDOWN_MS,
}: InterstitialDecisionInput): InterstitialDecision {
  // -------------------------------------------------------
  // Validación de entradas: comportamiento fail-closed.
  // -------------------------------------------------------

  if (
    !Number.isSafeInteger(eligibleCampaignCount) ||
    eligibleCampaignCount < 0 ||
    !Number.isFinite(nowMs) ||
    nowMs < 0 ||
    !Number.isFinite(randomValue) ||
    randomValue < 0 ||
    randomValue >= 1 ||
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1 ||
    !Number.isFinite(cooldownMs) ||
    cooldownMs <= 0
  ) {
    return deny("invalid_input");
  }

  if (
    lastShownAtMs !== null &&
    (
      !Number.isFinite(lastShownAtMs) ||
      lastShownAtMs < 0
    )
  ) {
    return deny("invalid_input");
  }

  // -------------------------------------------------------
  // Sin campañas elegibles, no mostrar nada.
  // -------------------------------------------------------

  if (eligibleCampaignCount === 0) {
    return deny("no_campaigns");
  }

  // -------------------------------------------------------
  // Cooldown global de Campaña B.
  //
  // No depende de la campaña individual.
  // Tampoco establece un máximo por sesión.
  // -------------------------------------------------------

  if (
    lastShownAtMs !== null &&
    nowMs - lastShownAtMs < cooldownMs
  ) {
    return deny("cooldown");
  }

  // -------------------------------------------------------
  // Una oportunidad elegible = una tirada independiente.
  //
  // randomValue debe estar en el intervalo [0, 1).
  // -------------------------------------------------------

  if (randomValue >= probability) {
    return deny("probability");
  }

  return {
    shouldShow: true,
    reason: "show",
  };
}

// =========================================================
// J10-7C-2 - Persistencia del cooldown en navegador.
// =========================================================

export const INTERSTITIAL_LAST_SHOWN_KEY =
  "sabinapp:interstitial:last-shown-at:v1";

type InterstitialStorage = Pick<
  Storage,
  "getItem" | "setItem"
>;

type InterstitialClaimInput = Omit<
  InterstitialDecisionInput,
  "lastShownAtMs" | "probability" | "cooldownMs"
> & {
  storage: InterstitialStorage | null;
};

export type InterstitialClaimDecision =
  | InterstitialDecision
  | {
      shouldShow: false;
      reason:
        | "storage_unavailable"
        | "storage_invalid"
        | "storage_write_failed";
    };

/**
 * Reclama una oportunidad de mostrar Campaña B.
 *
 * La hora se guarda solamente cuando la decisión
 * es mostrar un anuncio.
 *
 * Si localStorage no está disponible o falla,
 * el anuncio no se muestra.
 */
export function claimInterstitialOpportunity({
  eligibleCampaignCount,
  nowMs,
  randomValue,
  storage,
}: InterstitialClaimInput): InterstitialClaimDecision {
  if (!storage) {
    return {
      shouldShow: false,
      reason: "storage_unavailable",
    };
  }

  let storedValue: string | null;

  try {
    storedValue = storage.getItem(
      INTERSTITIAL_LAST_SHOWN_KEY,
    );
  } catch {
    return {
      shouldShow: false,
      reason: "storage_unavailable",
    };
  }

  let lastShownAtMs: number | null = null;

  if (storedValue !== null) {
    if (!/^(0|[1-9]\d*)$/.test(storedValue)) {
      return {
        shouldShow: false,
        reason: "storage_invalid",
      };
    }

    const parsedValue = Number(storedValue);

    if (!Number.isSafeInteger(parsedValue)) {
      return {
        shouldShow: false,
        reason: "storage_invalid",
      };
    }

    lastShownAtMs = parsedValue;
  }

  const decision = decideInterstitialDisplay({
    eligibleCampaignCount,
    nowMs,
    lastShownAtMs,
    randomValue,
  });

  if (!decision.shouldShow) {
    return decision;
  }

  try {
    storage.setItem(
      INTERSTITIAL_LAST_SHOWN_KEY,
      String(nowMs),
    );
  } catch {
    return {
      shouldShow: false,
      reason: "storage_write_failed",
    };
  }

  return decision;
}
