// components/landing/modes/modern-business-landing.tsx

/* eslint-disable @next/next/no-img-element */

import { ContactHub } from "../contact-hub";
import {
  getContactIcon,
  getExternalLinkProps,
} from "@/lib/landing/contact";
import { getLandingStyles } from "@/lib/landing/styles";
import type { PublicLandingData } from "@/lib/landing/styles/types";

type Props = {
  data: PublicLandingData;
};

type LandingStylesForModern = ReturnType<typeof getLandingStyles>;

const dayNames: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function getItemTypeLabel(type: string) {
  const labels: Record<string, string> = {
    menu_item: "Menú",
    product: "Producto",
    service: "Servicio",
    package: "Paquete",
    installation: "Instalación",
    activity: "Actividad",
    rule: "Regla",
    faq: "Pregunta",
    other: "Destacado",
  };

  return labels[type] ?? "Destacado";
}

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

function getDominantItemType(items: PublicLandingData["items"]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
}

function getOfferCopy(data: PublicLandingData) {
  const dominantType = getDominantItemType(data.items);
  const businessText = `${data.businessType} ${data.category}`.toLowerCase();

  if (dominantType === "menu_item" || businessText.includes("comida")) {
    return {
      label: "Menú",
      title: "Lo más pedido",
      description:
        "Una selección rápida de opciones para decidir sin revisar todo el menú.",
    };
  }

  if (dominantType === "product" || businessText.includes("comercio")) {
    return {
      label: "Productos",
      title: "Productos destacados",
      description:
        "Artículos principales para conocer rápido qué ofrece este negocio.",
    };
  }

  if (dominantType === "service" || businessText.includes("servicio")) {
    return {
      label: "Servicios",
      title: "Servicios principales",
      description:
        "Opciones importantes para entender rápido cómo puede ayudarte este negocio.",
    };
  }

  if (dominantType === "installation" || businessText.includes("quinta")) {
    return {
      label: "Instalaciones",
      title: "Lo más atractivo del lugar",
      description:
        "Espacios, amenidades o servicios importantes para quienes visitan el lugar.",
    };
  }

  if (dominantType === "activity" || businessText.includes("ocasión")) {
    return {
      label: "Actividades",
      title: "Lo más importante del evento",
      description:
        "Actividades, artículos o información clave para decidir rápido.",
    };
  }

  return {
    label: "Opciones",
    title: "Opciones destacadas",
    description:
      "Productos, servicios o elementos principales del negocio.",
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

function formatHour(hour: PublicLandingData["hours"][number]) {
  if (hour.isClosed) {
    return "Cerrado";
  }

  if (!hour.opensAt || !hour.closesAt) {
    return hour.notes ?? "Horario no especificado";
  }

  return `${hour.opensAt.slice(0, 5)} - ${hour.closesAt.slice(0, 5)}`;
}

function ModernItemCard({
  item,
  styles,
  variant = "normal",
}: {
  item: PublicLandingData["items"][number];
  styles: LandingStylesForModern;
  variant?: "normal" | "featured" | "compact";
}) {
  const price = item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  const imageHeight =
    variant === "featured" ? "h-64" : variant === "compact" ? "h-28" : "h-44";

  return (
    <article
      className={
        variant === "featured"
          ? styles.featuredCard
          : `rounded-[1.5rem] border p-5 ${styles.divider}`
      }
    >
      {item.imageUrl ? (
        <div className="mb-5 overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/5">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? item.name}
            className={`${imageHeight} w-full object-cover transition duration-700 hover:scale-105`}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className={styles.badge}>{getItemTypeLabel(item.type)}</span>

        {item.isFeatured ? (
          <span className={styles.tag}>Destacado</span>
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3
            className={`${styles.heading} ${
              variant === "featured" ? "text-3xl" : "text-xl"
            } font-black`}
          >
            {item.name}
          </h3>

          {item.description ? (
            <p className={`${styles.mutedText} mt-2 leading-7`}>
              {item.description}
            </p>
          ) : null}
        </div>

        {price ? (
          <p className={`${styles.price} shrink-0 text-2xl font-black`}>
            {price}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ModernBusinessLanding({ data }: Props) {
  const styles = getLandingStyles("modern");

  const coverPhoto =
    data.photos.find((photo) => photo.isCover) ?? data.photos[0] ?? null;

  const galleryPhotos = data.photos.filter(
    (photo) => photo.id !== coverPhoto?.id,
  );

  const visibleGalleryPhotos = (
    galleryPhotos.length > 0 ? galleryPhotos : data.photos
  ).slice(0, 7);

  const primaryContact =
    data.contacts.find((contact) => contact.isPrimary) ??
    data.contacts[0] ??
    null;

  const mainLocation = data.locations[0] ?? null;
  const featuredItems = data.items.filter((item) => item.isFeatured);
  const highlightItems =
    featuredItems.length > 0 ? featuredItems.slice(0, 4) : data.items.slice(0, 4);

  const previewItems = data.items.slice(0, 6);
  const extraItems = data.items.slice(6);
  const offerCopy = getOfferCopy(data);
  const businessIcon = getBusinessIcon(data.businessType, data.category);

  return (
    <main className={`${styles.page} relative`}>
      <div className={styles.background} />

      <div className={styles.container}>
        <header className={styles.nav}>
          <div className="flex items-center justify-between gap-4">
            <a href="#inicio" className="flex items-center gap-3">
              <span className={styles.brandIcon}>{businessIcon}</span>

              <span>
                <span
                  className={`block text-sm font-black leading-tight ${styles.heading}`}
                >
                  {data.name}
                </span>
                <span className={`block text-xs ${styles.mutedText}`}>
                  {data.category}
                </span>
              </span>
            </a>

            <nav className="hidden items-center gap-1 md:flex">
              <a href="#inicio" className={styles.navPill}>
                Inicio
              </a>

              {highlightItems.length > 0 ? (
                <a href="#destacados" className={styles.navPill}>
                  Destacados
                </a>
              ) : null}

              {visibleGalleryPhotos.length > 0 ? (
                <a href="#galeria" className={styles.navPill}>
                  Galería
                </a>
              ) : null}

              {previewItems.length > 0 ? (
                <a href="#opciones" className={styles.navPill}>
                  {offerCopy.label}
                </a>
              ) : null}

              <a href="#contacto" className={styles.navPill}>
                Contacto
              </a>
            </nav>

            {primaryContact ? (
              <a
                href={primaryContact.href}
                className={styles.buttonPrimary}
                {...getExternalLinkProps(primaryContact.href)}
              >
                Contactar
              </a>
            ) : null}
          </div>
        </header>

        <section
          id="inicio"
          className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-12 lg:grid-cols-[0.82fr_1.18fr] lg:py-20"
        >
          <div className="relative z-10 order-2 lg:order-1">
            <div className={styles.badge}>{data.businessType}</div>

            <h1
              className={`${styles.heading} mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl`}
            >
              {data.name}
            </h1>

            <p className={`${styles.text} mt-6 max-w-2xl text-xl leading-9`}>
              {data.shortDescription}
            </p>

            {data.longDescription ? (
              <p className={`${styles.mutedText} mt-4 max-w-xl text-sm leading-7`}>
                {data.longDescription}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className={styles.buttonPrimary}
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  {getContactIcon(primaryContact.type)} {primaryContact.label}
                </a>
              ) : null}

              {highlightItems.length > 0 ? (
                <a href="#destacados" className={styles.buttonSecondary}>
                  Ver destacados
                </a>
              ) : null}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <article className={styles.card}>
                <p className={`${styles.sectionLabel} text-xs font-black uppercase tracking-[0.25em]`}>
                  Giro
                </p>
                <p className={`${styles.heading} mt-2 font-black`}>
                  {data.category}
                </p>
              </article>

              <article className={styles.card}>
                <p className={`${styles.sectionLabel} text-xs font-black uppercase tracking-[0.25em]`}>
                  Ubicación
                </p>
                <p className={`${styles.heading} mt-2 font-black`}>
                  {mainLocation ? getLocationText(mainLocation) : "Por contacto"}
                </p>
              </article>

              <article className={styles.card}>
                <p className={`${styles.sectionLabel} text-xs font-black uppercase tracking-[0.25em]`}>
                  Acción
                </p>
                <p className={`${styles.heading} mt-2 font-black`}>
                  {primaryContact ? primaryContact.label : "Contactar"}
                </p>
              </article>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-5 rounded-[3rem] bg-cyan-300/10 blur-3xl" />

            <div className={styles.heroImageCard}>
              {coverPhoto ? (
                <img
                  src={coverPhoto.src}
                  alt={coverPhoto.alt}
                  className={styles.heroImage}
                />
              ) : (
                <div className={styles.heroPlaceholder}>
                  <p className={styles.mutedText}>
                    Este negocio todavía no tiene foto principal.
                  </p>
                </div>
              )}

              <div className={styles.heroOverlay}>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                  Página moderna
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {offerCopy.title}
                </h2>

                <div className="mt-4 grid gap-2">
                  {highlightItems.slice(0, 3).map((item) => {
                    const price =
                      item.showPrice === true
                        ? formatPrice(item.price, item.currency)
                        : null;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm"
                      >
                        <span className="font-bold">{item.name}</span>
                        {price ? (
                          <span className="font-black text-cyan-200">{price}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {highlightItems.length > 0 ? (
          <section id="destacados" className="py-16">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p
                  className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.35em]`}
                >
                  Destacados
                </p>

                <h2
                  className={`${styles.heading} mt-3 max-w-3xl text-4xl font-black sm:text-6xl`}
                >
                  Primero lo que más vende.
                </h2>

                <p className={`${styles.mutedText} mt-4 max-w-2xl leading-8`}>
                  {offerCopy.description}
                </p>
              </div>

              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className={styles.buttonSecondary}
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  Contactar por {primaryContact.label}
                </a>
              ) : null}
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {highlightItems.map((item, index) => (
                <ModernItemCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  variant={index === 0 ? "featured" : "normal"}
                />
              ))}
            </div>
          </section>
        ) : null}

        {visibleGalleryPhotos.length > 0 ? (
          <section id="galeria" className="py-16">
            <p
              className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.35em]`}
            >
              Galería
            </p>

            <h2
              className={`${styles.heading} mt-3 max-w-3xl text-4xl font-black sm:text-6xl`}
            >
              Una vista rápida del negocio.
            </h2>

            <div className="mt-8 grid auto-rows-[14rem] gap-4 md:grid-cols-4">
              {visibleGalleryPhotos.map((photo, index) => (
                <figure
                  key={photo.id}
                  className={`${styles.galleryCard} ${
                    index === 0
                      ? "md:col-span-2 md:row-span-2"
                      : index === 3
                        ? "md:col-span-2"
                        : ""
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-full w-full rounded-[1.5rem] object-cover transition duration-700 hover:scale-105"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {previewItems.length > 0 ? (
          <section id="opciones" className="py-16">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <p
                  className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.35em]`}
                >
                  {offerCopy.label}
                </p>

                <h2
                  className={`${styles.heading} mt-3 text-4xl font-black sm:text-5xl`}
                >
                  {offerCopy.title}
                </h2>

                <p className={`${styles.mutedText} mt-4 leading-8`}>
                  Se muestran primero las opciones principales para no saturar
                  la página. El resto queda disponible para quien quiera revisar más.
                </p>
              </div>

              <div className="grid gap-4">
                {previewItems.map((item) => (
                  <ModernItemCard
                    key={item.id}
                    item={item}
                    styles={styles}
                    variant="compact"
                  />
                ))}

                {extraItems.length > 0 ? (
                  <details className={styles.card}>
                    <summary className={`${styles.heading} cursor-pointer text-lg font-black`}>
                      Ver más opciones ({extraItems.length})
                    </summary>

                    <div className="mt-5 grid gap-4">
                      {extraItems.map((item) => (
                        <ModernItemCard
                          key={item.id}
                          item={item}
                          styles={styles}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section
          id="contacto"
          className="grid gap-6 py-16 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <article className={styles.featuredCard}>
            <p
              className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.35em]`}
            >
              Contacto
            </p>

            <h2 className={`${styles.heading} mt-3 text-4xl font-black sm:text-5xl`}>
              Listo para atenderte.
            </h2>

            <p className={`${styles.mutedText} mt-4 leading-8`}>
              Usa el método que prefieras para comunicarte con el negocio.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {data.contacts.length > 0 ? (
                data.contacts.map((contact) => (
                  <a
                    key={contact.id}
                    href={contact.href}
                    className={`${styles.card} transition hover:-translate-y-1`}
                    {...getExternalLinkProps(contact.href)}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {getContactIcon(contact.type)}
                    </span>

                    <p className={`${styles.heading} mt-3 font-black`}>
                      {contact.label}
                    </p>

                    <p className={`${styles.mutedText} text-sm`}>
                      {contact.value}
                    </p>
                  </a>
                ))
              ) : (
                <p className={styles.mutedText}>
                  Este negocio todavía no tiene contactos públicos registrados.
                </p>
              )}
            </div>
          </article>

          <div className="grid gap-6">
            <article className={styles.card}>
              <p
                className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.35em]`}
              >
                Horarios
              </p>

              <div className="mt-5 space-y-2">
                {data.hours.length > 0 ? (
                  data.hours.slice(0, 7).map((hour) => (
                    <div
                      key={hour.id}
                      className={`flex justify-between gap-4 border-b pb-2 text-sm ${styles.divider}`}
                    >
                      <span className={`${styles.heading} font-bold`}>
                        {hour.label || dayNames[hour.dayOfWeek]}
                      </span>

                      <span className={styles.mutedText}>{formatHour(hour)}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.mutedText}>
                    Horario disponible por contacto.
                  </p>
                )}
              </div>
            </article>

            <article className={styles.card}>
              <p
                className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.35em]`}
              >
                Ubicación
              </p>

              <div className="mt-5 grid gap-3">
                {data.locations.length > 0 ? (
                  data.locations.slice(0, 3).map((location) => (
                    <div
                      key={location.id}
                      className={`rounded-2xl border p-4 ${styles.divider}`}
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className={styles.badge}>
                          {getLocationTypeLabel(location.locationType)}
                        </span>

                        {location.isPrimary ? (
                          <span className={styles.tag}>Principal</span>
                        ) : null}
                      </div>

                      <p className={`${styles.heading} mt-3 font-black`}>
                        {getLocationText(location)}
                      </p>

                      {location.neighborhood ? (
                        <p className={`${styles.mutedText} mt-1 text-sm`}>
                          Colonia: {location.neighborhood}
                        </p>
                      ) : null}

                      {location.mapUrl ? (
                        <a
                          href={location.mapUrl}
                          className={`${styles.buttonSecondary} mt-4`}
                          {...getExternalLinkProps(location.mapUrl)}
                        >
                          Abrir mapa
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className={styles.mutedText}>
                    Ubicación disponible por contacto.
                  </p>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>

      {data.contacts.length > 0 ? (
        <ContactHub contacts={data.contacts} styles={styles.contactHub} />
      ) : null}
    </main>
  );
}
