import { NextResponse } from "next/server";
import { publishNewsCandidate } from "@/lib/news-automation/publish-news-candidate";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PublishCandidateRequestBody = {
  candidateId?: unknown;
};

async function readRequestBody(request: Request): Promise<PublishCandidateRequestBody> {
  try {
    const body = (await request.json()) as unknown;

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as PublishCandidateRequestBody;
    }

    return {};
  } catch {
    return {};
  }
}

function readCandidateId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Error inesperado al publicar candidato de noticia.";
}

async function requireAdminNewsPermission() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      response: NextResponse.json(
        {
          ok: false,
          message: "Inicia sesión para publicar candidatos de noticias.",
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
      response: NextResponse.json(
        {
          ok: false,
          message: "No tienes permiso para publicar candidatos de noticias.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    response: null,
  };
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Usa POST para publicar manualmente un candidato. Esta ruta requiere admin.",
    },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  const { supabase, response } = await requireAdminNewsPermission();

  if (response) {
    return response;
  }

  const body = await readRequestBody(request);
  const candidateId = readCandidateId(body.candidateId);

  if (!candidateId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Falta candidateId.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await publishNewsCandidate({
      supabase,
      candidateId,
    });

    return NextResponse.json({
      ok: true,
      message: "Candidato publicado como noticia local.",
      ...result,
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
