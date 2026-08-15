// components/landing/modes/elegant-business-landing.tsx

/* eslint-disable @next/next/no-img-element */

import { ContactHub } from "../contact-hub";
import {
  getContactIcon,
  getExternalLinkProps,
} from "@/lib/landing/contact";
import type { PublicLandingData } from "@/lib/landing/styles/types";

type Props = {
  data: PublicLandingData;
};

const dayNames: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function getDominantItemType(items: PublicLandingData["items"]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
}

function getElegantCopy(data: PublicLandingData) {
  const dominantType = getDominantItemType(data.items);
  const text = `${data.businessType} ${data.category}`.toLowerCase();

  if (dominantType === "service" || text.includes("profesional")) {
    return {
      eyebrow: "Presentación profesional",
      primaryAction: "Solicitar información",
      secondaryAction: "Ver servicios",
      sectionTitle: "Servicios principales",
      sectionDescription:
        "Una selección clara de servicios para conocer la propuesta del negocio sin saturar la página.",
      aboutTitle: "Sobre el servicio",
    };
  }

  if (dominantType === "installation" || text.includes("quinta")) {
    return {
      eyebrow: "Espacio y experiencia",
      primaryAction: "Consultar disponibilidad",
      secondaryAction: "Ver espacios",
      sectionTitle: "Espacios destacados",
      sectionDescription:
        "Elementos principales para evaluar el lugar con una presentación sobria y cuidada.",
      aboutTitle: "Sobre el lugar",
    };
  }

  if (dominantType === "menu_item" || text.includes("comida")) {
    return {
      eyebrow: "Propuesta gastronómica",
      primaryAction: "Consultar menú",
      secondaryAction: "Ver recomendados",
      sectionTitle: "Selección destacada",
      sectionDescription:
        "Opciones principales presentadas con más intención y menos ruido visual.",
      aboutTitle: "Sobre el negocio",
    };
  }

  if (dominantType === "product" || text.includes("comercio")) {
    return {
      eyebrow: "Selección curada",
      primaryAction: "Consultar productos",
      secondaryAction: "Ver selección",
      sectionTitle: "Productos principales",
      sectionDescription:
        "Productos representativos del negocio, mostrados de forma limpia y selectiva.",
      aboutTitle: "Sobre el negocio",
    };
  }

  return {
    eyebrow: "Presentación cuidada",
    primaryAction: "Solicitar información",
    secondaryAction: "Ver opciones",
    sectionTitle: "Opciones principales",
    sectionDescription:
      "Elementos clave del negocio presentados con una estructura simple y profesional.",
    aboutTitle: "Sobre el negocio",
  };
}

function getItemTypeLabel(type: string) {
  const labels: Record<string, string> = {
    menu_item: "Menú",
    product: "Producto",
    service: "Servicio",
    package: "Paquete",
    installation: "Espacio",
    activity: "Actividad",
    rule: "Nota",
    faq: "Pregunta",
    other: "Opción",
  };

  return labels[type] ?? "Opción";
}

function formatPrice(price: number | null, currency: string | null) {
  if (price === null) {
    return null;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency ?? "MXN",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatHour(hour: PublicLandingData["hours"][number]) {
  if (hour.isClosed) {
    return "Cerrado";
  }

  if (!hour.opensAt || !hour.closesAt) {
    return hour.notes ?? "Horario no especificado";
  }

  return `${hour.opensAt.slice(0, 5)} - ${hour.closesAt.slice(0, 5)}`;
}

function getLocationTypeLabel(locationType: string) {
  const labels: Record<string, string> = {
    physical_location: "Local físico",
    home_service: "Servicio a domicilio",
    pickup_point: "Punto de entrega",
    contact_only: "Solo por contacto",
    temporary_event: "Evento temporal",
    service_area: "Área de servicio",
  };

  return labels[locationType] ?? locationType;
}

function getLocationText(location: PublicLandingData["locations"][number]) {
  return (
    location.addressText ||
    location.serviceAreaText ||
    location.referenceNotes ||
    "Ubicación disponible por contacto"
  );
}

function getUniquePhotosBySrc(photos: PublicLandingData["photos"]) {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    const key = photo.src.trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function ElegantItemCard({
  item,
  variant = "normal",
}: {
  item: PublicLandingData["items"][number];
  variant?: "normal" | "featured";
}) {
  const price =
    item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  return (
    <article
      className={
        variant === "featured"
          ? "grid gap-6 rounded-[2rem] border border-stone-300 bg-white p-6 shadow-xl shadow-stone-200/80 md:grid-cols-[0.8fr_1.2fr]"
          : "rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm"
      }
    >
      {item.imageUrl ? (
        <div className="overflow-hidden rounded-[1.5rem] bg-stone-50">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? item.name}
            className={`h-56 w-full ${
              item.type === "product" ? "object-contain p-4" : "object-cover"
            }`}
          />
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-stone-600">
            {getItemTypeLabel(item.type)}
          </span>

          {item.isFeatured ? (
            <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Principal
            </span>
          ) : null}
        </div>

        <h3
          className={`mt-5 font-serif font-black leading-tight text-stone-950 ${
            variant === "featured" ? "text-3xl" : "text-2xl"
          }`}
        >
          {item.name}
        </h3>

        {item.description ? (
          <p className="mt-3 leading-7 text-stone-600">{item.description}</p>
        ) : null}

        {price ? (
          <p className="mt-5 text-2xl font-black text-stone-950">{price}</p>
        ) : null}
      </div>
    </article>
  );
}

export function ElegantBusinessLanding({ data }: Props) {
  const copy = getElegantCopy(data);

  const photos = getUniquePhotosBySrc(data.photos);
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0] ?? null;
  const galleryPhotos = photos.filter((photo) => photo.id !== coverPhoto?.id);

  const primaryContact =
    data.contacts.find((contact) => contact.isPrimary) ??
    data.contacts[0] ??
    null;

  const mainLocation = data.locations[0] ?? null;

  const featuredItems = data.items.filter((item) => item.isFeatured);
  const selectedItems =
    featuredItems.length > 0 ? featuredItems.slice(0, 4) : data.items.slice(0, 4);

  const extraItems = data.items.filter(
    (item) => !selectedItems.some((selected) => selected.id === item.id),
  );

  const minimalGallery = galleryPhotos.slice(0, 3);
  const initials = getInitials(data.name);

  const elegantContactHubStyles = {
    wrapper: "fixed bottom-5 right-5 z-50 hidden md:block",
    panel:
      "mb-3 grid gap-2 rounded-[1.5rem] border border-stone-200 bg-white/95 p-3 shadow-2xl shadow-stone-300/50 backdrop-blur-xl",
    item:
      "flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-950 transition hover:-translate-y-0.5 hover:bg-stone-50",
    button:
      "inline-flex min-h-12 min-w-[8.5rem] items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-stone-300 transition hover:scale-105",
  };

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-stone-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40 rounded-full border border-stone-200 bg-[#f8f5ef]/85 px-5 py-3 shadow-lg shadow-stone-200/60 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <a href="#inicio" className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white font-serif text-sm font-black tracking-tight">
                {initials}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-black">
                  {data.name}
                </span>
                <span className="block truncate text-xs text-stone-500">
                  {data.category}
                </span>
              </span>
            </a>

            <nav className="hidden items-center gap-1 md:flex">
              <a href="#presentacion" className="rounded-full px-4 py-2 text-sm font-bold text-stone-600 hover:bg-white">
                Presentación
              </a>
              <a href="#seleccion" className="rounded-full px-4 py-2 text-sm font-bold text-stone-600 hover:bg-white">
                Selección
              </a>
              <a href="#detalles" className="rounded-full px-4 py-2 text-sm font-bold text-stone-600 hover:bg-white">
                Detalles
              </a>
              <a href="#contacto" className="rounded-full px-4 py-2 text-sm font-bold text-stone-600 hover:bg-white">
                Contacto
              </a>
            </nav>

            {primaryContact ? (
              <a
                href={primaryContact.href}
                className="hidden rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-stone-300 transition hover:-translate-y-0.5 md:inline-flex"
                {...getExternalLinkProps(primaryContact.href)}
              >
                {copy.primaryAction}
              </a>
            ) : null}
          </div>
        </header>

        <section
          id="inicio"
          className="grid items-center gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-20"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-stone-500">
              {copy.eyebrow}
            </p>

            <h1 className="mt-6 max-w-4xl font-serif text-5xl font-black leading-[0.98] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
              {data.name}
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-9 text-stone-700">
              {data.shortDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-stone-300 transition hover:-translate-y-0.5"
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  {getContactIcon(primaryContact.type)} {copy.primaryAction}
                </a>
              ) : null}

              {selectedItems.length > 0 ? (
                <a
                  href="#seleccion"
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-black text-stone-950 shadow-sm transition hover:-translate-y-0.5"
                >
                  {copy.secondaryAction}
                </a>
              ) : null}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <article className="border-t border-stone-300 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
                  Tipo
                </p>
                <p className="mt-2 font-black">{data.businessType}</p>
              </article>

              <article className="border-t border-stone-300 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
                  Categoría
                </p>
                <p className="mt-2 font-black">{data.category}</p>
              </article>

              <article className="border-t border-stone-300 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
                  Ubicación
                </p>
                <p className="mt-2 line-clamp-2 font-black">
                  {mainLocation ? getLocationText(mainLocation) : "Por contacto"}
                </p>
              </article>
            </div>
          </div>

          <div className="relative">
            {coverPhoto ? (
              <figure className="overflow-hidden rounded-[2.25rem] border border-stone-200 bg-white p-3 shadow-2xl shadow-stone-300/70">
                <img
                  src={coverPhoto.src}
                  alt={coverPhoto.alt}
                  className="h-[34rem] w-full rounded-[1.75rem] object-cover"
                />
              </figure>
            ) : (
              <div className="flex h-[28rem] items-center justify-center rounded-[2.25rem] border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
                Este negocio todavía no tiene foto principal.
              </div>
            )}

            <div className="absolute bottom-6 left-6 max-w-xs rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-500">
                Perfil
              </p>
              <p className="mt-2 font-serif text-2xl font-black text-stone-950">
                Presentación cuidada y profesional.
              </p>
            </div>
          </div>
        </section>

        <section id="presentacion" className="border-y border-stone-300 py-14">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-stone-500">
                Presentación
              </p>
              <h2 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-5xl">
                {copy.aboutTitle}
              </h2>
            </div>

            <div>
              <p className="max-w-3xl text-xl leading-10 text-stone-700">
                {data.longDescription || data.shortDescription}
              </p>
            </div>
          </div>
        </section>

        {selectedItems.length > 0 ? (
          <section id="seleccion" className="py-16">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-stone-500">
                  Selección
                </p>
                <h2 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-5xl">
                  {copy.sectionTitle}
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-stone-600">
                  {copy.sectionDescription}
                </p>
              </div>

              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-black text-stone-950 shadow-sm"
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  Consultar
                </a>
              ) : null}
            </div>

            <div className="mt-10 grid gap-5">
              {selectedItems.map((item, index) => (
                <ElegantItemCard
                  key={item.id}
                  item={item}
                  variant={index === 0 ? "featured" : "normal"}
                />
              ))}

              {extraItems.length > 0 ? (
                <details className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
                  <summary className="cursor-pointer text-lg font-black text-stone-950">
                    Ver más opciones ({extraItems.length})
                  </summary>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {extraItems.map((item) => (
                      <ElegantItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </section>
        ) : null}

        <section id="detalles" className="grid gap-6 border-y border-stone-300 py-14 lg:grid-cols-3">
          <article className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-stone-500">
              Horarios
            </p>

            <div className="mt-5 space-y-2">
              {data.hours.length > 0 ? (
                data.hours.slice(0, 7).map((hour) => (
                  <div
                    key={hour.id}
                    className="flex justify-between gap-4 border-b border-stone-200 pb-2 text-sm"
                  >
                    <span className="font-bold">
                      {hour.label || dayNames[hour.dayOfWeek]}
                    </span>
                    <span className="text-right text-stone-600">
                      {formatHour(hour)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-stone-600">Horario disponible por contacto.</p>
              )}
            </div>
          </article>

          <article className="rounded-[1.5rem] bg-white p-6 shadow-sm lg:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-stone-500">
              Ubicación
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {data.locations.length > 0 ? (
                data.locations.slice(0, 2).map((location) => (
                  <div
                    key={location.id}
                    className="rounded-2xl border border-stone-200 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold text-stone-600">
                        {getLocationTypeLabel(location.locationType)}
                      </span>

                      {location.isPrimary ? (
                        <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">
                          Principal
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 font-black">{getLocationText(location)}</p>

                    {location.neighborhood ? (
                      <p className="mt-1 text-sm text-stone-600">
                        Colonia: {location.neighborhood}
                      </p>
                    ) : null}

                    {location.mapUrl ? (
                      <a
                        href={location.mapUrl}
                        className="mt-4 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white"
                        {...getExternalLinkProps(location.mapUrl)}
                      >
                        Abrir mapa
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-stone-600">Ubicación disponible por contacto.</p>
              )}
            </div>
          </article>
        </section>

        {minimalGallery.length > 0 ? (
          <section className="py-14">
            <div className="grid gap-4 md:grid-cols-3">
              {minimalGallery.map((photo) => (
                <figure
                  key={photo.id}
                  className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white p-2 shadow-sm"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-64 w-full rounded-[1rem] object-cover"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section id="contacto" className="pb-16 pt-8">
          <article className="rounded-[2rem] bg-stone-950 p-8 text-white shadow-2xl shadow-stone-300">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-stone-300">
                  Contacto
                </p>

                <h2 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-5xl">
                  Solicita información del negocio.
                </h2>

                <p className="mt-4 leading-8 text-stone-300">
                  Usa el método de contacto que prefieras para consultar
                  disponibilidad, servicios o información adicional.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {data.contacts.length > 0 ? (
                  data.contacts.map((contact) => (
                    <a
                      key={contact.id}
                      href={contact.href}
                      className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 text-white transition hover:bg-white/15"
                      {...getExternalLinkProps(contact.href)}
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {getContactIcon(contact.type)}
                      </span>
                      <p className="mt-3 font-black">{contact.label}</p>
                      <p className="text-sm text-stone-300">{contact.value}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-stone-300">
                    Este negocio todavía no tiene contactos públicos.
                  </p>
                )}
              </div>
            </div>
          </article>
        </section>
      </div>

      {data.contacts.length > 0 ? (
        <ContactHub contacts={data.contacts} styles={elegantContactHubStyles} />
      ) : null}
    </main>
  );
}
