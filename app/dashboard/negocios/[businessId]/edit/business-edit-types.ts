// app/dashboard/negocios/[businessId]/edit/business-edit-types.ts

export type BusinessMedia = {
  id: string;
  type: string;
  url: string;
  alt_text: string | null;
  is_cover: boolean;
  is_active: boolean;
  sort_order: number;
};

export type BusinessItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string;
  show_price: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_alt: string | null;
  is_active: boolean;
  sort_order: number;
};

export type BusinessContact = {
  id: string;
  type: string;
  label: string;
  value: string;
  url: string | null;
  is_primary: boolean;
  is_active: boolean;
  is_approved: boolean;
  sort_order: number;
};

export type BusinessHour = {
  id: string;
  day_of_week: number;
  period_order: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  notes: string | null;
};

export type BusinessLocation = {
  id: string;
  location_type: string;
  address_text: string | null;
  neighborhood: string | null;
  reference_notes: string | null;
  service_area_text: string | null;
  map_url: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  is_primary: boolean;
  is_public: boolean;
};

export const businessLocationTypeOptions = [
  { value: "physical_location", label: "Local físico" },
  { value: "home_service", label: "Servicio a domicilio" },
  { value: "pickup_point", label: "Punto de entrega" },
  { value: "contact_only", label: "Solo por contacto" },
  { value: "temporary_event", label: "Evento temporal" },
  { value: "service_area", label: "Área de servicio" },
] as const;

export type BusinessLocationType =
  (typeof businessLocationTypeOptions)[number]["value"];

export const businessLocationTypeValues = businessLocationTypeOptions.map(
  (option) => option.value,
);

export function isBusinessLocationType(
  value: string,
): value is BusinessLocationType {
  return businessLocationTypeValues.includes(value as BusinessLocationType);
}

export type BusinessEditBusiness = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  status: string;
  is_published: boolean;
  visual_mode: string;
  media: BusinessMedia[];
  items: BusinessItem[];
  contacts: BusinessContact[];
  hours: BusinessHour[];
  locations: BusinessLocation[];
};

export const businessItemTypeOptions = [
  { value: "menu_item", label: "Menú" },
  { value: "product", label: "Producto" },
  { value: "service", label: "Servicio" },
  { value: "package", label: "Paquete" },
  { value: "faq", label: "Pregunta frecuente" },
  { value: "installation", label: "Instalación / amenidad" },
  { value: "rule", label: "Regla" },
  { value: "activity", label: "Actividad" },
  { value: "other", label: "Otro" },
] as const;

export type BusinessItemType =
  (typeof businessItemTypeOptions)[number]["value"];

export const businessItemTypeValues = businessItemTypeOptions.map(
  (option) => option.value,
);

export function isBusinessItemType(value: string): value is BusinessItemType {
  return businessItemTypeValues.includes(value as BusinessItemType);
}

export function formatItemPrice(item: BusinessItem) {
  if (!item.show_price || item.price === null) {
    return "Precio oculto";
  }

  const numericPrice = Number(item.price);

  if (Number.isNaN(numericPrice)) {
    return `${item.price} ${item.currency}`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: item.currency || "MXN",
  }).format(numericPrice);
}
