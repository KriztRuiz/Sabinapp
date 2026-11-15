import { createAdsAdminClient } from "@/lib/supabase/ads-admin";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type AdEventType = "appearance" | "impression" | "click";

type AdEventBody = {
  eventType?: unknown;
  campaignId?: unknown;
  assetId?: unknown;
  pagePath?: unknown;
  businessId?: unknown;
  sessionKey?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedExactPagePaths = new Set([
  "/",
  "/negocios",
  "/productos",
  "/noticias",
  "/clima",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.length > maxLength) {
    return null;
  }

  return trimmedValue;
}

function readOptionalString(value: unknown, maxLength: number) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return readString(value, maxLength);
}

function readUuid(value: unknown) {
  const text = readString(value, 80);

  if (!text || !uuidPattern.test(text)) {
    return null;
  }

  return text;
}

function readOptionalUuid(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return readUuid(value);
}

function readEventType(value: unknown): AdEventType | null {
  if (value === "appearance" || value === "impression" || value === "click") {
    return value;
  }

  return null;
}

function isAllowedPublicPagePath(pagePath: string) {
  if (allowedExactPagePaths.has(pagePath)) {
    return true;
  }

  return /^\/negocio\/[^/]+$/.test(pagePath);
}

export async function POST(request: NextRequest) {
  let parsedBody: unknown;

  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Empty body");

    const decoder = new TextDecoder();
    let text = "";
    let size = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return NextResponse.json(
          { ok: false, error: "Solicitud demasiado grande." },
          { status: 413 },
        );
      }

      text += decoder.decode(value, { stream: true });
    }

    text += decoder.decode();
    parsedBody = JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Solicitud inválida.",
      },
      { status: 400 },
    );
  }

  if (!isRecord(parsedBody)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Solicitud inválida.",
      },
      { status: 400 },
    );
  }

  const body = parsedBody as AdEventBody;
  const eventType = readEventType(body.eventType);
  const campaignId = readUuid(body.campaignId);
  const assetId =
    body.assetId === null
      ? null
      : readUuid(body.assetId);
  const pagePath = readString(body.pagePath, 300);
  const businessId = readOptionalUuid(body.businessId);
  const sessionKey = readOptionalString(body.sessionKey, 120);

  const validAsset =
    eventType === "appearance"
      ? body.assetId === null
      : assetId !== null;

  if (
    !eventType ||
    !campaignId ||
    !validAsset ||
    !pagePath ||
    !sessionKey ||
    sessionKey.length < 8
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Faltan datos obligatorios del evento.",
      },
      { status: 400 },
    );
  }

  if (!isAllowedPublicPagePath(pagePath)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ruta pública no permitida para métricas de anuncios.",
      },
      { status: 400 },
    );
  }

  const supabase = createAdsAdminClient();
  const { data, error } = await supabase.rpc(
    "register_public_ad_event",
    {
      p_event_type: eventType,
      p_campaign_id: campaignId,
      p_asset_id: assetId,
      p_page_path: pagePath,
      p_business_id: businessId,
      p_session_key: sessionKey,
    },
  );

  if (error) {
    console.error("Error registering ad event:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo registrar el evento del anuncio.",
      },
      { status: 500 },
    );
  }

  if (data !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "Evento publicitario no permitido.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
