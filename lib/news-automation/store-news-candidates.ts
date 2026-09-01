import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GenerateNewsCandidatesResult,
  NewsCandidate,
  NewsCandidateSource,
} from "./openai-news-client";

type TriggerSource = "manual" | "cron" | "admin" | "system";

type StoredNewsAutomationResult = {
  fetchRunId: string;
  candidatesFound: number;
  candidatesStored: number;
  duplicatesSkipped: number;
  candidatesPublished: number;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
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

function isDuplicateError(error: unknown) {
  return isSupabaseErrorLike(error) && error.code === "23505";
}

function normalizeLimit(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(value), 50));
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildFallbackDedupeKey(candidate: NewsCandidate) {
  const base = `${candidate.title}-${candidate.sourceName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

  if (base.length >= 8) {
    return base;
  }

  return `noticia-${candidate.sourceUrl}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function getCandidateStatus(candidate: NewsCandidate) {
  if (candidate.relevanceScore >= 0.85 && candidate.confidenceScore >= 0.85) {
    return "needs_review";
  }

  return "candidate";
}

function getSafeDedupeKey(candidate: NewsCandidate) {
  const providedKey = candidate.dedupeKey.trim();

  if (providedKey.length >= 8) {
    return providedKey.slice(0, 200);
  }

  return buildFallbackDedupeKey(candidate);
}

function fallbackSource(candidate: NewsCandidate): NewsCandidateSource {
  return {
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.title,
    sourcePublishedAt: candidate.sourcePublishedAt,
    excerpt: null,
    isPrimary: true,
  };
}

function normalizeCandidateSources(candidate: NewsCandidate) {
  const initialSources =
    candidate.sources.length > 0 ? candidate.sources : [fallbackSource(candidate)];

  const uniqueSources = new Map<string, NewsCandidateSource>();

  for (const source of initialSources) {
    if (!source.sourceUrl.startsWith("http")) {
      continue;
    }

    const key = source.sourceUrl.toLowerCase();
    const existingSource = uniqueSources.get(key);

    if (!existingSource) {
      uniqueSources.set(key, source);
      continue;
    }

    uniqueSources.set(key, {
      ...existingSource,
      isPrimary: existingSource.isPrimary || source.isPrimary,
    });
  }

  const sources = Array.from(uniqueSources.values());

  if (sources.length === 0) {
    return [];
  }

  const hasPrimary = sources.some((source) => source.isPrimary);

  return sources.map((source, index) => ({
    ...source,
    isPrimary: hasPrimary ? source.isPrimary : index === 0,
  }));
}

export async function getActiveNewsSearchQueries(
  supabase: SupabaseClient,
  limit = 10,
) {
  const { data, error } = await supabase
    .from("news_search_queries")
    .select("query")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .limit(normalizeLimit(limit, 10));

  if (error) {
    throw new Error(
      `No pudimos cargar búsquedas de noticias: ${getErrorMessage(error)}`,
    );
  }

  return (data ?? [])
    .map((item) => String(item.query ?? "").trim())
    .filter((query) => query.length > 0);
}

export async function getExistingLocalNewsTitles(
  supabase: SupabaseClient,
  limit = 50,
) {
  const { data, error } = await supabase
    .from("local_news")
    .select("title")
    .order("published_at", { ascending: false })
    .limit(normalizeLimit(limit, 50));

  if (error) {
    throw new Error(
      `No pudimos cargar títulos existentes: ${getErrorMessage(error)}`,
    );
  }

  return (data ?? [])
    .map((item) => String(item.title ?? "").trim())
    .filter((title) => title.length > 0);
}

async function insertCandidateSources(
  supabase: SupabaseClient,
  candidateId: string,
  candidate: NewsCandidate,
) {
  const sources = normalizeCandidateSources(candidate);

  if (sources.length === 0) {
    return 0;
  }

  const rows = sources.map((source) => ({
    candidate_id: candidateId,
    source_name: source.sourceName,
    source_url: source.sourceUrl,
    source_title: source.sourceTitle,
    source_published_at: normalizeDate(source.sourcePublishedAt),
    excerpt: source.excerpt,
    is_primary: source.isPrimary,
  }));

  const { error } = await supabase.from("news_candidate_sources").insert(rows);

  if (error && !isDuplicateError(error)) {
    throw new Error(
      `No pudimos guardar fuentes de noticia: ${getErrorMessage(error)}`,
    );
  }

  return rows.length;
}

export async function saveNewsCandidatesResult(input: {
  supabase: SupabaseClient;
  result: GenerateNewsCandidatesResult;
  searchQueries: string[];
  triggerSource?: TriggerSource;
  createdBy?: string | null;
  maxCandidatesToStore?: number;
}): Promise<StoredNewsAutomationResult> {
  const candidatesToStore = input.result.candidates.slice(
    0,
    normalizeLimit(input.maxCandidatesToStore, 20),
  );

  let fetchRunId: string | null = null;
  let candidatesStored = 0;
  let duplicatesSkipped = 0;
  let sourceCount = 0;

  try {
    const { data: fetchRun, error: fetchRunError } = await input.supabase
      .from("news_fetch_runs")
      .insert({
        status: "running",
        trigger_source: input.triggerSource ?? "manual",
        model_name: input.result.model,
        search_query_count: input.searchQueries.length,
        source_count: 0,
        candidates_found: input.result.candidates.length,
        candidates_published: 0,
        created_by: input.createdBy ?? null,
        raw_result: {
          rawText: input.result.rawText,
          candidatesReturned: input.result.candidates.length,
        },
      })
      .select("id")
      .single();

    if (fetchRunError || !fetchRun) {
      throw new Error(
        `No pudimos crear ejecución de noticias: ${getErrorMessage(
          fetchRunError,
        )}`,
      );
    }

    fetchRunId = String(fetchRun.id);

    for (const candidate of candidatesToStore) {
      const sources = normalizeCandidateSources(candidate);
      sourceCount += sources.length;

      const { data: insertedCandidate, error: candidateError } =
        await input.supabase
          .from("news_candidates")
          .insert({
            fetch_run_id: fetchRunId,
            title: candidate.title,
            summary: candidate.summary,
            source_name: candidate.sourceName,
            source_url: candidate.sourceUrl,
            source_published_at: normalizeDate(candidate.sourcePublishedAt),
            local_relevance: candidate.localRelevance,
            relevance_score: candidate.relevanceScore,
            confidence_score: candidate.confidenceScore,
            status: getCandidateStatus(candidate),
            dedupe_key: getSafeDedupeKey(candidate),
            ai_notes: candidate.aiNotes,
            raw_payload: candidate,
          })
          .select("id")
          .single();

      if (candidateError) {
        if (isDuplicateError(candidateError)) {
          duplicatesSkipped += 1;
          continue;
        }

        throw new Error(
          `No pudimos guardar candidato de noticia: ${getErrorMessage(
            candidateError,
          )}`,
        );
      }

      await insertCandidateSources(
        input.supabase,
        String(insertedCandidate.id),
        candidate,
      );

      candidatesStored += 1;
    }

    const { error: updateError } = await input.supabase
      .from("news_fetch_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        source_count: sourceCount,
        candidates_found: input.result.candidates.length,
        candidates_published: 0,
      })
      .eq("id", fetchRunId);

    if (updateError) {
      throw new Error(
        `No pudimos cerrar ejecución de noticias: ${getErrorMessage(
          updateError,
        )}`,
      );
    }

    return {
      fetchRunId,
      candidatesFound: input.result.candidates.length,
      candidatesStored,
      duplicatesSkipped,
      candidatesPublished: 0,
    };
  } catch (error) {
    if (fetchRunId) {
      await input.supabase
        .from("news_fetch_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: getErrorMessage(error),
        })
        .eq("id", fetchRunId);
    }

    throw error;
  }
}
