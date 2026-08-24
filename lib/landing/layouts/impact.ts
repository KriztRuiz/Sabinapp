import type { LandingModeLayout } from "./types";

export const impactLayout: LandingModeLayout = {
  mode: "impact",
  name: "Impact",
  intent:
    "Publicación promocional, fuerte y orientada a conversión. Ideal para eventos, ofertas o ventas temporales.",
  heroStyle: "promotional",
  primaryFocus: ["featuredItems", "items", "contactHub"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 60,
      presentation: "hidden",
      reason: "El modo impacto debe ir directo al valor y la acción.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 10,
      presentation: "featured",
      reason: "Los destacados son el centro de una página promocional.",
    },
    gallery: {
      key: "gallery",
      order: 30,
      presentation: "normal",
      reason: "Las imágenes ayudan a reforzar deseo y urgencia.",
    },
    items: {
      key: "items",
      order: 20,
      presentation: "featured",
      reason: "Los productos, actividades o promociones deben verse pronto.",
    },
    hours: {
      key: "hours",
      order: 40,
      presentation: "compact",
      reason: "El horario importa, pero debe ocupar poco espacio.",
    },
    locations: {
      key: "locations",
      order: 50,
      presentation: "compact",
      reason: "La ubicación se muestra solo como información útil rápida.",
    },
    tags: {
      key: "tags",
      order: 70,
      presentation: "hidden",
      reason: "Las etiquetas distraen en una página de impacto.",
    },
    contactHub: {
      key: "contactHub",
      order: 80,
      presentation: "featured",
      reason: "El contacto debe empujar a la acción inmediata.",
    },
  },
};
