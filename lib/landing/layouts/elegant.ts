import type { LandingModeLayout } from "./types";

export const elegantLayout: LandingModeLayout = {
  mode: "elegant",
  name: "Elegant",
  intent:
    "Página sobria, profesional y de confianza. Ideal para servicios formales.",
  heroStyle: "premium",
  primaryFocus: ["longDescription", "items", "contactHub"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 10,
      presentation: "featured",
      reason: "Los servicios profesionales necesitan explicar confianza y valor.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 30,
      presentation: "normal",
      reason: "Los servicios destacados apoyan la decisión del cliente.",
    },
    gallery: {
      key: "gallery",
      order: 60,
      presentation: "compact",
      reason: "Las fotos no deben competir con el tono profesional.",
    },
    items: {
      key: "items",
      order: 20,
      presentation: "featured",
      reason: "Los servicios o paquetes deben quedar claros.",
    },
    hours: {
      key: "hours",
      order: 40,
      presentation: "compact",
      reason: "El horario se muestra de forma discreta.",
    },
    locations: {
      key: "locations",
      order: 50,
      presentation: "normal",
      reason: "La ubicación o zona de atención suma confianza.",
    },
    tags: {
      key: "tags",
      order: 70,
      presentation: "hidden",
      reason: "Las etiquetas pueden restar sobriedad al modo elegante.",
    },
    contactHub: {
      key: "contactHub",
      order: 80,
      presentation: "normal",
      reason: "El contacto debe ser claro, pero no agresivo.",
    },
  },
};
