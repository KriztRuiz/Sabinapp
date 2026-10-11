import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

type PublishCandidateResult = {
  candidateId: string;
  publishedNewsId: string;
  title: string;
  sourceUrl: string;
};

export class PublishNewsCandidateError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PublishNewsCandidateError";
    this.statusCode = statusCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function publishNewsCandidate(input: {
  supabase: SupabaseClient;
  candidateId: string;
}): Promise<PublishCandidateResult> {
  const candidateId = input.candidateId.trim();

  if (!candidateId) {
    throw new PublishNewsCandidateError("Falta el candidato de noticia.", 400);
  }

  // PostgreSQL realiza toda la publicacion en una transaccion.
  const { data, error } = await input.supabase.rpc(
    "publish_news_candidate_atomic",
    {
      p_candidate_id: candidateId,
    },
  );

  if (error) {
    if (error.code === "P0002") {
      throw new PublishNewsCandidateError("No encontramos el candidato de noticia.", 404);
    }

    if (error.code === "P0001") {
      throw new PublishNewsCandidateError(error.message, 409);
    }

    if (error.code === "42501") {
      throw new PublishNewsCandidateError("No tienes permiso para publicar noticias.", 403);
    }

    if (error.code === "22P02" || error.code === "22023") {
      throw new PublishNewsCandidateError(
        "Identificador de candidato inválido.",
        400,
      );
    }

    if (error.code === "23505") {
      throw new PublishNewsCandidateError(
        "Ya existe una noticia con esta fuente.",
        409,
      );
    }

    throw new Error(
      `No pudimos publicar la noticia: ${error.message}`,
    );
  }

  // La fuente ya existia: PostgreSQL marco el candidato
  // como duplicado sin insertar una nueva noticia.
  if (
    isRecord(data) &&
    data.ok === false &&
    data.reason === "duplicate"
  ) {
    revalidatePath("/dashboard/admin/noticias");

    throw new PublishNewsCandidateError(
      "Ya existe una noticia pública con esta fuente.",
      409,
    );
  }

  // Validar la respuesta antes de informar de un exito.
  if (
    !isRecord(data) ||
    data.ok !== true ||
    data.candidateId !== candidateId ||
    typeof data.publishedNewsId !== "string" ||
    typeof data.title !== "string" ||
    typeof data.sourceUrl !== "string"
  ) {
    throw new Error(
      "La publicación devolvió una respuesta inesperada.",
    );
  }

  revalidatePath("/");
  revalidatePath("/noticias");
  revalidatePath("/dashboard/admin/noticias");

  return {
    candidateId: data.candidateId,
    publishedNewsId: data.publishedNewsId,
    title: data.title,
    sourceUrl: data.sourceUrl,
  };
}
