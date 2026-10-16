import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GenerateNewsCandidatesResult,
  NewsCandidate,
  NewsCandidateSource,
} from "./openai-news-client";

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

export async function saveNewsCandidatesResult(input: {
  supabase: SupabaseClient;
  result: GenerateNewsCandidatesResult;
  searchQueries: string[];
  maxCandidatesToStore?: number;
  reservedFetchRunId: string;
}): Promise<StoredNewsAutomationResult> {
  if (!input.reservedFetchRunId) {
    throw new Error("Falta la reserva de generación de noticias.");
  }

  const limit = Math.min(
    normalizeLimit(input.maxCandidatesToStore, 5),
    10,
  );

  const candidatesToStore = input.result.candidates
    .slice(0, limit)
    .map((candidate) => ({
      ...candidate,
      dedupeKey: getSafeDedupeKey(candidate),
      sourcePublishedAt: normalizeDate(candidate.sourcePublishedAt),
      sources: normalizeCandidateSources(candidate).map((source) => ({
        ...source,
        sourcePublishedAt: normalizeDate(source.sourcePublishedAt),
      })),
    }));

  // Una RPC realiza inserciones y cierre en una sola transaccion PostgreSQL.
  const { data, error } = await input.supabase.rpc(
    "complete_admin_news_generation",
    {
      p_run_id: input.reservedFetchRunId,
      p_model_name: input.result.model,
      p_search_query_count: input.searchQueries.length,
      p_raw_text: input.result.rawText,
      p_candidates: candidatesToStore,
      p_candidates_found: input.result.candidates.length,
    },
  );

  if (error) {
    throw new Error(
      "No pudimos completar el guardado atómico de noticias: " +
        getErrorMessage(error),
    );
  }

  const storedResult = data as StoredNewsAutomationResult | null;

  if (
    !storedResult ||
    storedResult.fetchRunId !== input.reservedFetchRunId ||
    storedResult.candidatesFound !== input.result.candidates.length ||
    !Number.isInteger(storedResult.candidatesStored) ||
    !Number.isInteger(storedResult.duplicatesSkipped) ||
    storedResult.candidatesStored < 0 ||
    storedResult.duplicatesSkipped < 0 ||
    storedResult.candidatesStored + storedResult.duplicatesSkipped !==
      candidatesToStore.length ||
    storedResult.candidatesPublished !== 0
  ) {
    throw new Error(
      "La función de guardado atómico devolvió una respuesta inesperada.",
    );
  }

  return storedResult;
}
