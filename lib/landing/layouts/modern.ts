import type { LandingModeLayout } from "./types";

export const modernLayout: LandingModeLayout = {
  mode: "modern",
  name: "Modern",
  intent:
    "Página visual, actual y de alto contraste. Prioriza impacto inicial y contacto rápido.",
  heroStyle: "visual",
  primaryFocus: ["featuredItems", "gallery", "contactHub"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 40,
      presentation: "compact",
      reason: "El texto largo no debe competir con el impacto visual.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 10,
      presentation: "featured",
      reason: "Los destacados deben aparecer pronto y con fuerza visual.",
    },
    gallery: {
      key: "gallery",
      order: 20,
      presentation: "normal",
      reason: "La galería refuerza el aspecto visual del modo moderno.",
    },
    items: {
      key: "items",
      order: 30,
      presentation: "normal",
      reason: "El listado se mantiene disponible sin ser lo primero.",
    },
    hours: {
      key: "hours",
      order: 50,
      presentation: "compact",
      reason: "El horario debe verse, pero no dominar la página.",
    },
    locations: {
      key: "locations",
      order: 60,
      presentation: "compact",
      reason: "La ubicación se muestra de forma resumida.",
    },
    tags: {
      key: "tags",
      order: 70,
      presentation: "hidden",
      reason: "Las etiquetas pueden ensuciar una presentación moderna.",
    },
    contactHub: {
      key: "contactHub",
      order: 80,
      presentation: "featured",
      reason: "El contacto rápido es clave en una página moderna.",
    },
  },
};
