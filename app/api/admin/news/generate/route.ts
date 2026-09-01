import { NextResponse } from "next/server";
import { generateSabinappNewsCandidates } from "@/lib/news-automation/openai-news-client";
import {
  getActiveNewsSearchQueries,
  getExistingLocalNewsTitles,
  saveNewsCandidatesResult,
} from "@/lib/news-automation/store-news-candidates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GenerateNewsRequestBody = {
  maxCandidates?: unknown;
  queryLimit?: unknown;
  model?: unknown;
};

function readPositiveInteger(value: unknown, fallback: number, max: number) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(numericValue), max));
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

async function readRequestBody(request: Request): Promise<GenerateNewsRequestBody> {
  try {
    const body = (await request.json()) as unknown;

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as GenerateNewsRequestBody;
    }

    return {};
  } catch {
    return {};
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Error inesperado al generar candidatos de noticias.";
}

async function requireAdminNewsPermission() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json(
        {
          ok: false,
          message: "Inicia sesión para generar candidatos de noticias.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: canReviewBusinesses } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  if (!canReviewBusinesses) {
    return {
      supabase,
      user,
      response: NextResponse.json(
        {
          ok: false,
          message: "No tienes permiso para generar candidatos de noticias.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    user,
    response: null,
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Usa POST para generar candidatos de noticias. Esta ruta no publica noticias.",
    },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  const { supabase, user, response } = await requireAdminNewsPermission();

  if (response) {
    return response;
  }

  const body = await readRequestBody(request);

  const maxCandidates = readPositiveInteger(body.maxCandidates, 5, 10);
  const queryLimit = readPositiveInteger(body.queryLimit, 10, 10);
  const model = readOptionalString(body.model);

  try {
    const searchQueries = await getActiveNewsSearchQueries(supabase, queryLimit);

    if (searchQueries.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "No hay búsquedas activas para noticias automáticas.",
        },
        { status: 400 },
      );
    }

    const existingTitles = await getExistingLocalNewsTitles(supabase, 50);

    const result = await generateSabinappNewsCandidates({
      searchQueries,
      existingTitles,
      maxCandidates,
      model,
    });

    const storedResult = await saveNewsCandidatesResult({
      supabase,
      result,
      searchQueries,
      triggerSource: "admin",
      createdBy: user.id,
      maxCandidatesToStore: maxCandidates,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Candidatos de noticias generados y guardados. No se publicaron noticias.",
      searchQueriesUsed: searchQueries.length,
      model: result.model,
      candidatesReturnedByAi: result.candidates.length,
      ...storedResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
