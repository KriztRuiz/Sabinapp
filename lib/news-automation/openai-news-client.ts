const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export type NewsCandidateSource = {
  sourceName: string;
  sourceUrl: string;
  sourceTitle: string | null;
  sourcePublishedAt: string | null;
  excerpt: string | null;
  isPrimary: boolean;
};

export type NewsCandidate = {
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  localRelevance: string;
  relevanceScore: number;
  confidenceScore: number;
  dedupeKey: string;
  aiNotes: string;
  sources: NewsCandidateSource[];
};

export type GenerateNewsCandidatesInput = {
  searchQueries: string[];
  existingTitles?: string[];
  maxCandidates?: number;
  model?: string;
};

export type GenerateNewsCandidatesResult = {
  model: string;
  rawText: string;
  candidates: NewsCandidate[];
};

type JsonRecord = Record<string, unknown>;

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY.");
  }

  return apiKey;
}

function getNewsModel(inputModel?: string) {
  return (
    inputModel?.trim() ||
    process.env.SABINAPP_NEWS_MODEL?.trim() ||
    "gpt-5-mini"
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function readNullableString(value: unknown) {
  const text = readString(value);

  return text.length > 0 ? text : null;
}

function readScore(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  if (numericValue < 0) {
    return 0;
  }

  if (numericValue > 1) {
    return 1;
  }

  return Number(numericValue.toFixed(3));
}

function extractOutputText(payload: unknown) {
  if (!isRecord(payload)) {
    return "";
  }

  const directOutput = readString(payload.output_text);

  if (directOutput) {
    return directOutput;
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  const parts: string[] = [];

  for (const outputItem of payload.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (!isRecord(contentItem)) {
        continue;
      }

      const text = readString(contentItem.text);

      if (text) {
        parts.push(text);
      }
    }
  }

  return parts.join("\n").trim();
}

function parseJsonFromText(text: string): unknown {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("OpenAI no devolvió texto para analizar.");
  }

  const withoutMarkdownFence = trimmedText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutMarkdownFence);
}

function normalizeSources(value: unknown): NewsCandidateSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((source) => ({
      sourceName: readString(source.sourceName || source.source_name, "Fuente"),
      sourceUrl: readString(source.sourceUrl || source.source_url),
      sourceTitle: readNullableString(source.sourceTitle || source.source_title),
      sourcePublishedAt: readNullableString(
        source.sourcePublishedAt || source.source_published_at,
      ),
      excerpt: readNullableString(source.excerpt),
      isPrimary: Boolean(source.isPrimary || source.is_primary),
    }))
    .filter((source) => source.sourceUrl.startsWith("http"));
}

function normalizeCandidates(parsed: unknown): NewsCandidate[] {
  if (!isRecord(parsed) || !Array.isArray(parsed.candidates)) {
    return [];
  }

  return parsed.candidates
    .filter(isRecord)
    .map((candidate) => {
      const sourceName = readString(
        candidate.sourceName || candidate.source_name,
        "Fuente",
      );

      const sourceUrl = readString(candidate.sourceUrl || candidate.source_url);

      const sources = normalizeSources(candidate.sources);

      const primarySource =
        sources.find((source) => source.isPrimary) ?? sources[0] ?? null;

      return {
        title: readString(candidate.title).slice(0, 200),
        summary: readString(candidate.summary).slice(0, 2000),
        sourceName: primarySource?.sourceName ?? sourceName,
        sourceUrl: primarySource?.sourceUrl ?? sourceUrl,
        sourcePublishedAt: readNullableString(
          candidate.sourcePublishedAt || candidate.source_published_at,
        ),
        localRelevance: readString(
          candidate.localRelevance || candidate.local_relevance,
        ),
        relevanceScore: readScore(
          candidate.relevanceScore || candidate.relevance_score,
        ),
        confidenceScore: readScore(
          candidate.confidenceScore || candidate.confidence_score,
        ),
        dedupeKey: readString(candidate.dedupeKey || candidate.dedupe_key),
        aiNotes: readString(candidate.aiNotes || candidate.ai_notes),
        sources,
      };
    })
    .filter(
      (candidate) =>
        candidate.title.length >= 5 &&
        candidate.summary.length >= 20 &&
        candidate.sourceUrl.startsWith("http") &&
        candidate.dedupeKey.length >= 8,
    );
}

function buildPrompt(input: Required<GenerateNewsCandidatesInput>) {
  return `Eres un asistente editorial para Sabinapp, un directorio local moderado de Sabinas Hidalgo, Nuevo León, México.

Tu tarea:
Buscar y analizar noticias relacionadas con Sabinas Hidalgo o noticias regionales que afecten claramente a Sabinas Hidalgo.

Reglas:
- No inventes noticias.
- No uses rumores sin fuente.
- No publiques temas generales sin impacto local.
- Cada noticia debe tener fuente principal verificable.
- Prioriza seguridad, clima, servicios, movilidad, economía local, avisos oficiales, comunidad, eventos y negocios locales.
- Máximo de candidatos: ${input.maxCandidates}.
- Si una noticia ya parece estar cubierta por títulos existentes, no la repitas.

Búsquedas configuradas:
${input.searchQueries.map((query) => `- ${query}`).join("\n")}

Títulos ya existentes:
${
  input.existingTitles.length > 0
    ? input.existingTitles.map((title) => `- ${title}`).join("\n")
    : "- Sin títulos existentes proporcionados."
}

Responde únicamente JSON válido con esta forma:
{
  "candidates": [
    {
      "title": "Título claro para Sabinapp",
      "summary": "Resumen breve y útil para la comunidad.",
      "sourceName": "Nombre de la fuente principal",
      "sourceUrl": "https://...",
      "sourcePublishedAt": "ISO date o null",
      "localRelevance": "Por qué importa a Sabinas Hidalgo.",
      "relevanceScore": 0.0,
      "confidenceScore": 0.0,
      "dedupeKey": "clave-estable-de-deduplicacion",
      "aiNotes": "Notas internas breves.",
      "sources": [
        {
          "sourceName": "Nombre de fuente",
          "sourceUrl": "https://...",
          "sourceTitle": "Título original o null",
          "sourcePublishedAt": "ISO date o null",
          "excerpt": "Extracto breve o null",
          "isPrimary": true
        }
      ]
    }
  ]
}`;
}

export async function generateSabinappNewsCandidates(
  input: GenerateNewsCandidatesInput,
): Promise<GenerateNewsCandidatesResult> {
  const apiKey = getOpenAiApiKey();
  const model = getNewsModel(input.model);
  const maxCandidates = input.maxCandidates ?? 5;

  const normalizedInput: Required<GenerateNewsCandidatesInput> = {
    searchQueries: input.searchQueries.filter((query) => query.trim().length > 0),
    existingTitles: input.existingTitles ?? [],
    maxCandidates,
    model,
  };

  if (normalizedInput.searchQueries.length === 0) {
    throw new Error("No hay búsquedas activas para noticias automáticas.");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search" }],
      input: buildPrompt(normalizedInput),
    }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const errorMessage = isRecord(payload)
      ? readString(payload.error, response.statusText)
      : response.statusText;

    throw new Error(`OpenAI respondió con error: ${errorMessage}`);
  }

  const rawText = extractOutputText(payload);
  const parsed = parseJsonFromText(rawText);

  return {
    model,
    rawText,
    candidates: normalizeCandidates(parsed),
  };
}
