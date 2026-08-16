// lib/landing/styles/index.ts

import { classicStyles } from "./classic";
import { compactStyles } from "./compact";
import { elegantStyles } from "./elegant";
import { impactStyles } from "./impact";
import { modernStyles } from "./modern";
import type { LandingStyles, LandingVisualMode } from "./types";
import { warmStyles } from "./warm";

export const landingVisualModes = [
  "classic",
  "modern",
  "warm",
  "compact",
  "elegant",
  "impact",
] as const satisfies readonly LandingVisualMode[];

export const landingVisualModeOptions: {
  key: LandingVisualMode;
  name: string;
  description: string;
  bestFor: string;
  experience: string;
  warning: string;
}[] = [
  {
    key: "classic",
    name: "Classic",
    description:
      "Ficha completa, clara e informativa. Muestra la información del negocio de forma ordenada.",
    bestFor:
      "Negocios que quieren una página estable, fácil de leer y sin una personalidad visual extrema.",
    experience:
      "Todo visible: descripción, fotos, menú, horarios, ubicación, tags y contacto.",
    warning:
      "No es el más llamativo, pero es el más seguro para casi cualquier negocio.",
  },
  {
    key: "modern",
    name: "Modern",
    description:
      "Visual, oscuro, actual y orientado a contacto rápido. Prioriza fotos, destacados y llamada a la acción.",
    bestFor:
      "Restaurantes, tiendas, servicios o negocios que quieren verse actuales y más comerciales.",
    experience:
      "Hero fuerte, destacados temprano, galería visual, contacto visible y diseño con alto contraste.",
    warning:
      "Funciona mejor cuando el negocio tiene buenas fotos o productos destacados.",
  },
  {
    key: "warm",
    name: "Warm",
    description:
      "Cálido, local y humano. Presenta el negocio como una opción cercana y confiable.",
    bestFor:
      "Taquerías, cafeterías, restaurantes familiares, quintas, negocios de barrio y servicios atendidos por sus dueños.",
    experience:
      "Historia del negocio, álbum de fotos, recomendaciones y contacto con tono amable.",
    warning:
      "No es el estilo más agresivo para promociones; comunica cercanía antes que urgencia.",
  },
  {
    key: "compact",
    name: "Compact",
    description:
      "Mini app de consulta rápida. Reduce scroll y organiza la información en secciones desplegables.",
    bestFor:
      "Negocios con muchos productos, servicios técnicos, tiendas o páginas que se consultan principalmente desde celular.",
    experience:
      "Hero corto, botones grandes, resumen rápido, acordeones, productos limitados y barra inferior de contacto.",
    warning:
      "No busca lucir grande o editorial; busca que el cliente encuentre lo importante rápido.",
  },
  {
    key: "elegant",
    name: "Elegant",
    description:
      "Sobrio, premium y profesional. Presenta el negocio con más espacio, orden y formalidad.",
    bestFor:
      "Contadores, abogados, consultorios, clínicas, estéticas premium, quintas, salones y servicios profesionales.",
    experience:
      "Hero editorial, presentación formal, selección curada, galería mínima y contacto discreto.",
    warning:
      "No conviene si el negocio necesita parecer muy popular, ruidoso o promocional.",
  },
  {
    key: "impact",
    name: "Impact",
    description:
      "Cartel promocional interactivo. Enfatiza lo más fuerte del negocio y empuja al contacto rápido.",
    bestFor:
      "Promociones, comida, eventos, productos destacados, paquetes, quintas y campañas de venta rápida.",
    experience:
      "Nombre enorme, oferta protagonista, franja rápida, accesos grandes, destacados y cierre fuerte de contacto.",
    warning:
      "Es intencionalmente llamativo. No busca sobriedad; busca atención y acción.",
  },
];

export const landingStylesByMode: Record<LandingVisualMode, LandingStyles> = {
  classic: classicStyles,
  modern: modernStyles,
  warm: warmStyles,
  compact: compactStyles,
  elegant: elegantStyles,
  impact: impactStyles,
};

export function isLandingVisualMode(
  mode: string | null | undefined,
): mode is LandingVisualMode {
  if (!mode) {
    return false;
  }

  return landingVisualModes.includes(mode as LandingVisualMode);
}

export function normalizeLandingVisualMode(
  mode?: string | null,
): LandingVisualMode {
  return isLandingVisualMode(mode) ? mode : "modern";
}

export function getLandingStyles(mode?: string | null) {
  return landingStylesByMode[normalizeLandingVisualMode(mode)];
}

export type { LandingStyles, LandingVisualMode };
