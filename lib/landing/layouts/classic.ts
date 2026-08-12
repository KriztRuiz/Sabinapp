import type { LandingModeLayout } from "./types";

export const classicLayout: LandingModeLayout = {
  mode: "classic",
  name: "Classic",
  intent:
    "Página completa, tradicional y fácil de leer. Prioriza claridad sobre impacto visual.",
  heroStyle: "informative",
  primaryFocus: ["longDescription", "items", "contactHub"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 10,
      presentation: "normal",
      reason: "El modo clásico debe explicar bien quién es el negocio.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 20,
      presentation: "normal",
      reason: "Los destacados ayudan sin dominar toda la página.",
    },
    gallery: {
      key: "gallery",
      order: 30,
      presentation: "normal",
      reason: "Las fotos complementan la información del negocio.",
    },
    items: {
      key: "items",
      order: 40,
      presentation: "normal",
      reason: "El menú, productos o servicios se muestran de forma completa.",
    },
    hours: {
      key: "hours",
      order: 50,
      presentation: "normal",
      reason: "Los horarios son información básica para negocios locales.",
    },
    locations: {
      key: "locations",
      order: 60,
      presentation: "normal",
      reason: "La ubicación debe estar claramente visible.",
    },
    tags: {
      key: "tags",
      order: 70,
      presentation: "normal",
      reason: "Las etiquetas ayudan a entender el giro del negocio.",
    },
    contactHub: {
      key: "contactHub",
      order: 80,
      presentation: "normal",
      reason: "El contacto se mantiene disponible sin ser agresivo.",
    },
  },
};
