// components/landing/modes/compact-business-landing.tsx

/* eslint-disable @next/next/no-img-element */

import {
  getContactIcon,
  getExternalLinkProps,
} from "@/lib/landing/contact";
import { getLandingStyles } from "@/lib/landing/styles";
import type { PublicLandingData } from "@/lib/landing/styles/types";

type Props = {
  data: PublicLandingData;
};

type LandingStylesForCompact = ReturnType<typeof getLandingStyles>;

const dayNames: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function getBusinessIcon(businessType: string, category: string) {
  const text = `${businessType} ${category}`.toLowerCase();

  if (text.includes("comida") || text.includes("taquer")) return "🌮";
  if (text.includes("comercio") || text.includes("abarrotes")) return "🛒";
  if (text.includes("técnico") || text.includes("tecnico")) return "🛠️";
  if (text.includes("profesional") || text.includes("contador")) return "💼";
  if (text.includes("sitio") || text.includes("quinta")) return "🏡";
  if (text.includes("ocasión") || text.includes("ocasion")) return "🎪";

  return "★";
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

function getDominantItemType(items: PublicLandingData["items"]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
}

function getCompactCopy(data: PublicLandingData) {
  const dominantType = getDominantItemType(data.items);
  const text = `${data.businessType} ${data.category}`.toLowerCase();

  if (dominantType === "menu_item" || text.includes("comida")) {
    return {
      itemsLabel: "Menú",
      highlightsLabel: "Más pedido",
      optionsLabel: "Opciones del menú",
      emptyLabel: "Menú disponible por contacto.",
    };
  }

  if (dominantType === "product" || text.includes("comercio")) {
    return {
      itemsLabel: "Productos",
      highlightsLabel: "Destacados",
      optionsLabel: "Productos disponibles",
      emptyLabel: "Productos disponibles por contacto.",
    };
  }

  if (dominantType === "service" || text.includes("servicio")) {
    return {
      itemsLabel: "Servicios",
      highlightsLabel: "Servicios clave",
      optionsLabel: "Servicios disponibles",
      emptyLabel: "Servicios disponibles por contacto.",
    };
  }

  if (dominantType === "installation" || text.includes("quinta")) {
    return {
      itemsLabel: "Espacios",
      highlightsLabel: "Espacios destacados",
      optionsLabel: "Instalaciones",
      emptyLabel: "Información disponible por contacto.",
    };
  }

  return {
    itemsLabel: "Opciones",
    highlightsLabel: "Destacados",
    optionsLabel: "Opciones disponibles",
    emptyLabel: "Información disponible por contacto.",
  };
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

function getTodayHour(hours: PublicLandingData["hours"]) {
  const today = new Date().getDay();
  return hours.find((hour) => hour.dayOfWeek === today) ?? hours[0] ?? null;
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

function CompactSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[1.5rem] border border-black/10 bg-white/80 p-4 shadow-sm backdrop-blur"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-slate-950 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="rounded-full border border-black/10 px-3 py-1 text-xs transition group-open:rotate-180">
          ↓
        </span>
      </summary>

      <div className="mt-4">{children}</div>
    </details>
  );
}

function CompactItemCard({
  item,
  styles,
}: {
  item: PublicLandingData["items"][number];
  styles: LandingStylesForCompact;
}) {
  const price =
    item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  return (
    <article className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
      {item.imageUrl ? (
        <div className="h-16 overflow-hidden rounded-xl bg-orange-50">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? item.name}
            className={`h-full w-full ${
              item.type === "product" ? "object-contain p-1" : "object-cover"
            }`}
          />
        </div>
      ) : (
        <div className="flex h-16 items-center justify-center rounded-xl bg-orange-50 text-xl">
          ★
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap gap-1">
          <span className={styles.badge}>{getItemTypeLabel(item.type)}</span>
          {item.isFeatured ? <span className={styles.tag}>Destacado</span> : null}
        </div>

        <h3 className="mt-1 truncate text-sm font-black text-slate-950">
          {item.name}
        </h3>

        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
            {item.description}
          </p>
        ) : null}
      </div>

      {price ? (
        <p className="shrink-0 text-sm font-black text-orange-700">{price}</p>
      ) : null}
    </article>
  );
}

function CompactContactLink({
  contact,
}: {
  contact: PublicLandingData["contacts"][number];
}) {
  return (
    <a
      href={contact.href}
      className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm font-bold text-slate-950 shadow-sm"
      {...getExternalLinkProps(contact.href)}
    >
      <span className="text-xl" aria-hidden="true">
        {getContactIcon(contact.type)}
      </span>

      <span>
        <span className="block">{contact.label}</span>
        <span className="block text-xs font-normal text-slate-600">
          {contact.value}
        </span>
      </span>
    </a>
  );
}

export function CompactBusinessLanding({ data }: Props) {
  const styles = getLandingStyles("compact");
  const copy = getCompactCopy(data);

  const photos = getUniquePhotosBySrc(data.photos);
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0] ?? null;
  const galleryPhotos = photos.filter((photo) => photo.id !== coverPhoto?.id);

  const primaryContact =
    data.contacts.find((contact) => contact.isPrimary) ??
    data.contacts[0] ??
    null;

  const phoneContact =
    data.contacts.find((contact) => contact.type === "phone") ?? null;

  const whatsappContact =
    data.contacts.find((contact) => contact.type === "whatsapp") ?? null;

  const mainLocation = data.locations[0] ?? null;
  const todayHour = getTodayHour(data.hours);

  const featuredItems = data.items.filter((item) => item.isFeatured);
  const visibleFeaturedItems =
    featuredItems.length > 0 ? featuredItems.slice(0, 3) : data.items.slice(0, 3);

  const regularItems = data.items.filter(
    (item) => !visibleFeaturedItems.some((featured) => featured.id === item.id),
  );

  const visibleItems = regularItems.slice(0, 4);
  const extraItems = regularItems.slice(4);

  const visiblePhotos = (galleryPhotos.length > 0 ? galleryPhotos : photos).slice(
    0,
    3,
  );

  const businessIcon = getBusinessIcon(data.businessType, data.category);

  return (
    <main className="min-h-screen bg-[#fff7ed] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-24 pt-4">
        <header className="sticky top-3 z-30 rounded-[2rem] border border-black/10 bg-white/85 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <a href="#inicio" className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                {businessIcon}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-black">
                  {data.name}
                </span>
                <span className="block truncate text-xs text-slate-600">
                  {data.category}
                </span>
              </span>
            </a>

            {primaryContact ? (
              <a
                href={primaryContact.href}
                className="shrink-0 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white"
                {...getExternalLinkProps(primaryContact.href)}
              >
                Contactar
              </a>
            ) : null}
          </div>
        </header>

        <section id="inicio" className="pt-6">
          {coverPhoto ? (
            <figure className="overflow-hidden rounded-[2rem] border border-black/10 bg-white p-2 shadow-lg">
              <img
                src={coverPhoto.src}
                alt={coverPhoto.alt}
                className="h-52 w-full rounded-[1.5rem] object-cover sm:h-64"
              />
            </figure>
          ) : null}

          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              <span className={styles.badge}>{data.businessType}</span>
              <span className={styles.tag}>{data.category}</span>
            </div>

            <h1 className="mt-4 text-4xl font-black leading-none tracking-tight sm:text-5xl">
              {data.name}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-700">
              {data.shortDescription}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-base font-black text-white shadow-lg"
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  {getContactIcon(primaryContact.type)} Contactar
                </a>
              ) : null}

              {mainLocation?.mapUrl ? (
                <a
                  href={mainLocation.mapUrl}
                  className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-base font-black text-slate-950 shadow-sm"
                  {...getExternalLinkProps(mainLocation.mapUrl)}
                >
                  📍 Ubicación
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                Giro
              </p>
              <p className="mt-1 text-sm font-black">{data.category}</p>
            </article>

            <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                Hoy
              </p>
              <p className="mt-1 text-sm font-black">
                {todayHour ? formatHour(todayHour) : "Por contacto"}
              </p>
            </article>

            <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                Zona
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-black">
                {mainLocation ? getLocationText(mainLocation) : "Sabinas Hidalgo"}
              </p>
            </article>
          </div>
        </section>

        <section className="mt-5 grid gap-3">
          {visibleFeaturedItems.length > 0 ? (
            <CompactSection title={copy.highlightsLabel} defaultOpen>
              <div className="grid gap-3">
                {visibleFeaturedItems.map((item) => (
                  <CompactItemCard key={item.id} item={item} styles={styles} />
                ))}
              </div>
            </CompactSection>
          ) : null}

          <CompactSection title={copy.optionsLabel} defaultOpen={visibleFeaturedItems.length === 0}>
            {visibleItems.length > 0 ? (
              <div className="grid gap-3">
                {visibleItems.map((item) => (
                  <CompactItemCard key={item.id} item={item} styles={styles} />
                ))}

                {extraItems.length > 0 ? (
                  <details className="rounded-2xl border border-black/10 bg-orange-50 p-3">
                    <summary className="cursor-pointer list-none text-sm font-black text-slate-950 [&::-webkit-details-marker]:hidden">
                      Ver más {copy.itemsLabel.toLowerCase()} ({extraItems.length})
                    </summary>

                    <div className="mt-3 grid gap-3">
                      {extraItems.map((item) => (
                        <CompactItemCard key={item.id} item={item} styles={styles} />
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-600">{copy.emptyLabel}</p>
            )}
          </CompactSection>

          <CompactSection title="Horarios">
            {data.hours.length > 0 ? (
              <div className="grid gap-2">
                {data.hours.slice(0, 7).map((hour) => (
                  <div
                    key={hour.id}
                    className="flex justify-between gap-4 border-b border-black/10 pb-2 text-sm"
                  >
                    <span className="font-bold">
                      {hour.label || dayNames[hour.dayOfWeek]}
                    </span>
                    <span className="text-right text-slate-600">
                      {formatHour(hour)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Horario disponible por contacto.
              </p>
            )}
          </CompactSection>

          <CompactSection title="Ubicación">
            {data.locations.length > 0 ? (
              <div className="grid gap-3">
                {data.locations.slice(0, 3).map((location) => (
                  <article
                    key={location.id}
                    className="rounded-2xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={styles.badge}>
                        {getLocationTypeLabel(location.locationType)}
                      </span>

                      {location.isPrimary ? (
                        <span className={styles.tag}>Principal</span>
                      ) : null}
                    </div>

                    <p className="mt-3 font-black">{getLocationText(location)}</p>

                    {location.neighborhood ? (
                      <p className="mt-1 text-sm text-slate-600">
                        Colonia: {location.neighborhood}
                      </p>
                    ) : null}

                    {location.referenceNotes ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {location.referenceNotes}
                      </p>
                    ) : null}

                    {location.mapUrl ? (
                      <a
                        href={location.mapUrl}
                        className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
                        {...getExternalLinkProps(location.mapUrl)}
                      >
                        Abrir mapa
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Ubicación disponible por contacto.
              </p>
            )}
          </CompactSection>

          {visiblePhotos.length > 0 ? (
            <CompactSection title="Fotos">
              <div className="grid grid-cols-3 gap-2">
                {visiblePhotos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border border-black/10 bg-white p-1"
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="h-24 w-full rounded-xl object-cover"
                    />
                  </figure>
                ))}
              </div>
            </CompactSection>
          ) : null}

          <CompactSection title="Contacto">
            {data.contacts.length > 0 ? (
              <div className="grid gap-3">
                {data.contacts.map((contact) => (
                  <CompactContactLink key={contact.id} contact={contact} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Este negocio todavía no tiene contactos públicos.
              </p>
            )}
          </CompactSection>
        </section>
      </div>

      {data.contacts.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
            {(whatsappContact ?? primaryContact) ? (
              <a
                href={(whatsappContact ?? primaryContact)?.href}
                className="rounded-2xl bg-slate-950 px-3 py-3 text-center text-xs font-black text-white"
                {...getExternalLinkProps((whatsappContact ?? primaryContact)?.href ?? "#")}
              >
                💬 WhatsApp
              </a>
            ) : null}

            {(phoneContact ?? primaryContact) ? (
              <a
                href={(phoneContact ?? primaryContact)?.href}
                className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-center text-xs font-black text-slate-950"
                {...getExternalLinkProps((phoneContact ?? primaryContact)?.href ?? "#")}
              >
                📞 Llamar
              </a>
            ) : null}

            {mainLocation?.mapUrl ? (
              <a
                href={mainLocation.mapUrl}
                className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-center text-xs font-black text-slate-950"
                {...getExternalLinkProps(mainLocation.mapUrl)}
              >
                📍 Mapa
              </a>
            ) : primaryContact ? (
              <a
                href={primaryContact.href}
                className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-center text-xs font-black text-slate-950"
                {...getExternalLinkProps(primaryContact.href)}
              >
                Contacto
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
