import type { LandingModeLayout } from "./types";

export const modernLayout: LandingModeLayout = {
  mode: "modern",
  name: "Modern",
  intent:
    "Landing visual, actual y orientada a conversión. Prioriza impacto inicial, destacados, fotos y contacto rápido.",
  heroStyle: "visual",
  primaryFocus: ["featuredItems", "gallery", "contactHub"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 40,
      presentation: "compact",
      reason:
        "El texto largo debe existir solo como apoyo; la primera impresión debe ser visual y directa.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 10,
      presentation: "featured",
      reason:
        "Una landing moderna debe mostrar pronto lo más vendible del negocio.",
    },
    gallery: {
      key: "gallery",
      order: 20,
      presentation: "featured",
      reason:
        "Las fotos deben reforzar confianza, deseo y percepción profesional.",
    },
    items: {
      key: "items",
      order: 30,
      presentation: "normal",
      reason:
        "El listado completo se mantiene disponible, pero no debe ser lo primero.",
    },
    hours: {
      key: "hours",
      order: 50,
      presentation: "compact",
      reason:
        "El horario importa, pero debe consultarse rápido sin ocupar demasiado espacio.",
    },
    locations: {
      key: "locations",
      order: 60,
      presentation: "compact",
      reason:
        "La ubicación se muestra como dato práctico, no como sección protagonista.",
    },
    tags: {
      key: "tags",
      order: 70,
      presentation: "hidden",
      reason:
        "Las etiquetas pueden ensuciar una presentación moderna y distraer del contacto.",
    },
    contactHub: {
      key: "contactHub",
      order: 80,
      presentation: "featured",
      reason:
        "El contacto rápido es el principal valor de una landing moderna local.",
    },
  },
};
