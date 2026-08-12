import type { LandingModeLayout } from "./types";

export const warmLayout: LandingModeLayout = {
  mode: "warm",
  name: "Warm",
  intent:
    "Página cercana, humana y visual. Ideal para comida, eventos y negocios familiares.",
  heroStyle: "visual",
  primaryFocus: ["gallery", "longDescription", "featuredItems", "contactHub"],
  sections: {
    longDescription: {
      key: "longDescription",
      order: 20,
      presentation: "normal",
      reason: "El modo cálido necesita contar mejor la historia del negocio.",
    },
    featuredItems: {
      key: "featuredItems",
      order: 30,
      presentation: "featured",
      reason: "Los destacados transmiten antojo, cercanía o atractivo.",
    },
    gallery: {
      key: "gallery",
      order: 10,
      presentation: "featured",
      reason: "Las fotos deben tener mucho peso en un modo cálido.",
    },
    items: {
      key: "items",
      order: 40,
      presentation: "normal",
      reason: "El menú o productos siguen siendo importantes.",
    },
    hours: {
      key: "hours",
      order: 50,
      presentation: "normal",
      reason: "El usuario necesita saber cuándo puede visitar o contactar.",
    },
    locations: {
      key: "locations",
      order: 60,
      presentation: "normal",
      reason: "La ubicación refuerza confianza y cercanía local.",
    },
    tags: {
      key: "tags",
      order: 70,
      presentation: "compact",
      reason: "Las etiquetas pueden ayudar, pero deben verse discretas.",
    },
    contactHub: {
      key: "contactHub",
      order: 80,
      presentation: "featured",
      reason: "El contacto debe ser fácil y cercano.",
    },
  },
};
