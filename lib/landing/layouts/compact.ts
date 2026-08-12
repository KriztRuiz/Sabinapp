import type { LandingModeLayout } from "./types";

export const compactLayout: LandingModeLayout = {
  mode: "compact",
  name: "Compact",
  intent:
    "Página rápida y directa. Ideal para servicios técnicos, negocios simples o consultas urgentes.",
  heroStyle: "compact",
  primaryFocus: ["items", "contactHub", "hours", "locations"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 60,
      presentation: "hidden",
      reason: "El modo compacto debe reducir lectura y fricción.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 20,
      presentation: "compact",
      reason: "Los destacados se muestran sin ocupar demasiado espacio.",
    },
    gallery: {
      key: "gallery",
      order: 70,
      presentation: "hidden",
      reason: "La galería extendida no es prioritaria en una página compacta.",
    },
    items: {
      key: "items",
      order: 10,
      presentation: "featured",
      reason: "Los servicios o productos deben aparecer rápido.",
    },
    hours: {
      key: "hours",
      order: 30,
      presentation: "compact",
      reason: "El horario debe consultarse rápido.",
    },
    locations: {
      key: "locations",
      order: 40,
      presentation: "compact",
      reason: "La ubicación debe ser breve y útil.",
    },
    tags: {
      key: "tags",
      order: 80,
      presentation: "hidden",
      reason: "Las etiquetas no son necesarias en una experiencia compacta.",
    },
    contactHub: {
      key: "contactHub",
      order: 50,
      presentation: "featured",
      reason: "El contacto rápido es la prioridad principal.",
    },
  },
};
