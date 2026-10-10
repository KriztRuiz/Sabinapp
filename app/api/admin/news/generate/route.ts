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
  dryRun?: unknown;
};

function readPositiveInteger(value: unknown, fallback: number, max: number) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(numericValue), max));
}

function readBooleanFlag(value: unknown) {
  return value === true || value === "true";
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
  const dryRun = readBooleanFlag(body.dryRun);
  let reservedFetchRunId: string | null = null;

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

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        message:
          "Prueba seca correcta. No se llamó a OpenAI y no se guardaron candidatos.",
        searchQueriesUsed: searchQueries.length,
        existingTitlesFound: existingTitles.length,
        maxCandidates,
        queryLimit,
      });
    }

    // Reservar antes de consumir créditos de OpenAI.
    const { data: reservationData, error: reservationError } =
      await supabase.rpc("reserve_admin_news_generation", {
        p_search_query_count: searchQueries.length,
      });

    if (reservationError) {
      const forbidden = reservationError.code === "42501";

      return NextResponse.json(
        {
          ok: false,
          message: forbidden
            ? "Solo los administradores pueden generar noticias."
            : "No se pudo reservar la generación de noticias.",
        },
        { status: forbidden ? 403 : 500 },
      );
    }

    const reservation = reservationData as {
      ok?: boolean;
      reason?: string | null;
      run_id?: string | null;
    } | null;

    if (!reservation?.ok) {
      if (reservation?.reason === "already_running") {
        return NextResponse.json(
          {
            ok: false,
            message: "Ya existe una generación de noticias en proceso.",
          },
          { status: 409 },
        );
      }

      if (reservation?.reason === "cooldown") {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Debes esperar al menos 5 minutos entre generaciones.",
          },
          { status: 429 },
        );
      }

      throw new Error("Respuesta inesperada al reservar noticias.");
    }

    if (
      typeof reservation.run_id !== "string" ||
      !reservation.run_id
    ) {
      throw new Error("La reserva no devolvió un identificador válido.");
    }

    reservedFetchRunId = reservation.run_id;

    const result = await generateSabinappNewsCandidates({
      searchQueries,
      existingTitles,
      maxCandidates,
    });

    const storedResult = await saveNewsCandidatesResult({
      supabase,
      result,
      searchQueries,
      triggerSource: "admin",
      createdBy: user.id,
      maxCandidatesToStore: maxCandidates,
      reservedFetchRunId,
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
    // Si OpenAI o el guardado falla, liberar la reserva.
    if (reservedFetchRunId) {
      const { error: closeError } = await supabase
        .from("news_fetch_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: getErrorMessage(error).slice(0, 500),
        })
        .eq("id", reservedFetchRunId)
        .eq("status", "running");

      if (closeError) {
        console.error(
          "No se pudo finalizar la reserva de noticias:",
          closeError.code,
        );
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
