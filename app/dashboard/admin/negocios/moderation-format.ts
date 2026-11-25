export type ReportStatus = "new" | "in_review" | "resolved" | "rejected" | "closed";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  new: "Nuevo",
  in_review: "En revisión",
  resolved: "Resuelto",
  rejected: "Rechazado",
  closed: "Cerrado",
};

export const REPORT_STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
  new: "bg-red-100 text-red-800",
  in_review: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-gray-100 text-gray-700",
  closed: "bg-zinc-100 text-zinc-700",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  incorrect_information: "Información incorrecta",
  suspicious_content: "Contenido sospechoso",
  inappropriate_content: "Lenguaje ofensivo o inapropiado",
  technical_problem: "Problema técnico",
  other: "Otro motivo",
};

export function getSingleRelation<T>(relation: T | T[] | null) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export function formatShortId(value: string | null) {
  if (!value) {
    return "Sin dato";
  }

  return value.slice(0, 8);
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}
