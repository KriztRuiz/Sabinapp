import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

type PublishCandidateResult = {
  candidateId: string;
  publishedNewsId: string;
  title: string;
  sourceUrl: string;
};

type NewsCandidateRow = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  source_published_at: string | null;
  status: string;
  published_news_id: string | null;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function isSupabaseErrorLike(value: unknown): value is SupabaseErrorLike {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isSupabaseErrorLike(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Error desconocido.";
}

function normalizeCandidateId(value: string) {
  return value.trim();
}

function getPublishedAt(value: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

export async function publishNewsCandidate(input: {
  supabase: SupabaseClient;
  candidateId: string;
}): Promise<PublishCandidateResult> {
  const candidateId = normalizeCandidateId(input.candidateId);

  if (!candidateId) {
    throw new Error("Falta el candidato de noticia.");
  }

  const { data: candidateData, error: candidateError } = await input.supabase
    .from("news_candidates")
    .select(
      `
      id,
      title,
      summary,
      source_name,
      source_url,
      source_published_at,
      status,
      published_news_id
    `,
    )
    .eq("id", candidateId)
    .maybeSingle();

  if (candidateError) {
    throw new Error(
      `No pudimos cargar el candidato: ${getErrorMessage(candidateError)}`,
    );
  }

  if (!candidateData) {
    throw new Error("No encontramos el candidato de noticia.");
  }

  const candidate = candidateData as NewsCandidateRow;

  if (candidate.published_news_id) {
    throw new Error("Este candidato ya fue publicado.");
  }

  if (!["candidate", "needs_review", "approved"].includes(candidate.status)) {
    throw new Error(
      "Este candidato no está disponible para publicación manual.",
    );
  }

  const { data: existingNews } = await input.supabase
    .from("local_news")
    .select("id")
    .eq("source_url", candidate.source_url)
    .maybeSingle();

  if (existingNews) {
    const { error: duplicateUpdateError } = await input.supabase
      .from("news_candidates")
      .update({
        status: "duplicate",
        rejection_reason:
          "Ya existe una noticia pública con la misma fuente principal.",
      })
      .eq("id", candidate.id);

    if (duplicateUpdateError) {
      throw new Error(
        `La noticia ya existía, pero no pudimos marcar el candidato como duplicado: ${getErrorMessage(
          duplicateUpdateError,
        )}`,
      );
    }

    throw new Error("Ya existe una noticia pública con esta fuente.");
  }

  const { data: insertedNews, error: insertError } = await input.supabase
    .from("local_news")
    .insert({
      title: candidate.title,
      summary: candidate.summary,
      source_name: candidate.source_name,
      source_url: candidate.source_url,
      published_at: getPublishedAt(candidate.source_published_at),
      is_active: true,
      expires_at: null,
    })
    .select("id")
    .single();

  if (insertError || !insertedNews) {
    throw new Error(
      `No pudimos publicar la noticia: ${getErrorMessage(insertError)}`,
    );
  }

  const publishedNewsId = String(insertedNews.id);

  const { error: updateError } = await input.supabase
    .from("news_candidates")
    .update({
      status: "published",
      published_news_id: publishedNewsId,
    })
    .eq("id", candidate.id);

  if (updateError) {
    throw new Error(
      `La noticia fue publicada, pero no pudimos actualizar el candidato: ${getErrorMessage(
        updateError,
      )}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/noticias");

  return {
    candidateId: candidate.id,
    publishedNewsId,
    title: candidate.title,
    sourceUrl: candidate.source_url,
  };
}
