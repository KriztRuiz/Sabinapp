import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RejectCandidateRequestBody = {
  candidateId?: unknown;
  rejectionReason?: unknown;
};

type CandidateRow = {
  id: string;
  title: string;
  status: string;
  published_news_id: string | null;
};

async function readRequestBody(request: Request): Promise<RejectCandidateRequestBody> {
  try {
    const body = (await request.json()) as unknown;

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as RejectCandidateRequestBody;
    }

    return {};
  } catch {
    return {};
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Error inesperado al rechazar candidato de noticia.";
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
          message: "Inicia sesión para rechazar candidatos de noticias.",
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
          message: "No tienes permiso para rechazar candidatos de noticias.",
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
        "Usa POST para rechazar manualmente un candidato. Esta ruta requiere admin.",
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
  const candidateId = readString(body.candidateId);
  const rejectionReason =
    readString(body.rejectionReason) ||
    "Rechazado manualmente desde revisión admin.";

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
    const { data: candidateData, error: candidateError } = await supabase
      .from("news_candidates")
      .select("id, title, status, published_news_id")
      .eq("id", candidateId)
      .maybeSingle();

    if (candidateError) {
      throw new Error(
        `No pudimos cargar el candidato: ${getErrorMessage(candidateError)}`,
      );
    }

    if (!candidateData) {
      return NextResponse.json(
        {
          ok: false,
          message: "No encontramos el candidato de noticia.",
        },
        { status: 404 },
      );
    }

    const candidate = candidateData as CandidateRow;

    if (candidate.status === "published" || candidate.published_news_id) {
      return NextResponse.json(
        {
          ok: false,
          message: "No puedes rechazar un candidato que ya fue publicado.",
        },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("news_candidates")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);

    if (updateError) {
      throw new Error(
        `No pudimos rechazar el candidato: ${getErrorMessage(updateError)}`,
      );
    }

    revalidatePath("/dashboard/admin/noticias");

    return NextResponse.json({
      ok: true,
      message: "Candidato rechazado correctamente.",
      candidateId: candidate.id,
      title: candidate.title,
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
