// components/landing/modes/warm-business-landing.tsx

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

type LandingStylesForWarm = ReturnType<typeof getLandingStyles>;

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
  if (text.includes("profesional") || text.includes("contador")) return "🤝";
  if (text.includes("sitio") || text.includes("quinta")) return "🏡";
  if (text.includes("ocasión") || text.includes("ocasion")) return "🎉";

  return "☀️";
}

function getItemTypeLabel(type: string) {
  const labels: Record<string, string> = {
    menu_item: "De la casa",
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

function getWarmCopy(data: PublicLandingData) {
  const dominantType = getDominantItemType(data.items);
  const text = `${data.businessType} ${data.category}`.toLowerCase();

  if (dominantType === "menu_item" || text.includes("comida")) {
    return {
      navLabel: "Menú",
      recommendationTitle: "Recomendados de la casa",
      recommendationDescription:
        "Opciones que el negocio quiere destacar para quienes llegan por primera vez.",
      optionsTitle: "Sabores y opciones disponibles",
      storyTitle: "Una opción local para comer bien",
    };
  }

  if (dominantType === "product" || text.includes("comercio")) {
    return {
      navLabel: "Productos",
      recommendationTitle: "Favoritos del barrio",
      recommendationDescription:
        "Productos prácticos y representativos para conocer rápido lo que ofrece el negocio.",
      optionsTitle: "Productos disponibles",
      storyTitle: "Una tienda local para resolver lo cotidiano",
    };
  }

  if (dominantType === "service" || text.includes("servicio")) {
    return {
      navLabel: "Servicios",
      recommendationTitle: "Servicios recomendados",
      recommendationDescription:
        "Opciones principales para entender cómo puede ayudarte este negocio.",
      optionsTitle: "Servicios disponibles",
      storyTitle: "Servicio cercano y trato directo",
    };
  }

  if (dominantType === "installation" || text.includes("quinta")) {
    return {
      navLabel: "Espacios",
      recommendationTitle: "Espacios destacados",
      recommendationDescription:
        "Detalles importantes para conocer mejor el lugar antes de visitarlo.",
      optionsTitle: "Instalaciones y amenidades",
      storyTitle: "Un espacio pensado para compartir",
    };
  }

  return {
    navLabel: "Opciones",
    recommendationTitle: "Recomendaciones",
    recommendationDescription:
      "Elementos principales para conocer mejor este negocio local.",
    optionsTitle: "Opciones disponibles",
    storyTitle: "Un negocio local con atención cercana",
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

function WarmItemCard({
  item,
  styles,
  variant = "normal",
}: {
  item: PublicLandingData["items"][number];
  styles: LandingStylesForWarm;
  variant?: "normal" | "featured";
}) {
  const price =
    item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  return (
    <article
      className={
        variant === "featured"
          ? `${styles.featuredCard} overflow-hidden`
          : `${styles.card} overflow-hidden`
      }
    >
      {item.imageUrl ? (
        <div className="mb-5 overflow-hidden rounded-[1.5rem] bg-white/70">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? item.name}
            className={`w-full ${
              item.type === "product"
                ? "h-52 object-contain p-3"
                : "h-52 object-cover"
            }`}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className={styles.badge}>{getItemTypeLabel(item.type)}</span>

        {item.isFeatured ? <span className={styles.tag}>Recomendado</span> : null}
      </div>

      <h3
        className={`${styles.heading} mt-4 ${
          variant === "featured" ? "text-3xl" : "text-2xl"
        } font-black`}
      >
        {item.name}
      </h3>

      {item.description ? (
        <p className={`${styles.mutedText} mt-2 leading-7`}>
          {item.description}
        </p>
      ) : null}

      {price ? (
        <p className={`${styles.price} mt-5 text-3xl font-black`}>{price}</p>
      ) : null}
    </article>
  );
}

export function WarmBusinessLanding({ data }: Props) {
  const styles = getLandingStyles("warm");
  const warmCopy = getWarmCopy(data);

  const photos = getUniquePhotosBySrc(data.photos);
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0] ?? null;
  const galleryPhotos = photos.filter((photo) => photo.id !== coverPhoto?.id);

  const visibleGalleryPhotos = galleryPhotos.slice(0, 5);

  const primaryContact =
    data.contacts.find((contact) => contact.isPrimary) ??
    data.contacts[0] ??
    null;

  const mainLocation = data.locations[0] ?? null;

  const featuredItems = data.items.filter((item) => item.isFeatured);
  const recommendedItems =
    featuredItems.length > 0 ? featuredItems.slice(0, 3) : data.items.slice(0, 3);

  const remainingItems = data.items.filter(
    (item) => !recommendedItems.some((recommended) => recommended.id === item.id),
  );

  const visibleItems = remainingItems.slice(0, 6);
  const extraItems = remainingItems.slice(6);

  const businessIcon = getBusinessIcon(data.businessType, data.category);

  const warmContactHubStyles = {
    ...styles.contactHub,
    wrapper: `${styles.contactHub.wrapper} hidden md:block`,
  };

  return (
    <main className={`${styles.page} relative`}>
      <div className={styles.background} />

      <div className={styles.container}>
        <header className={styles.nav}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a href="#inicio" className="flex items-center gap-3">
              <span className={styles.brandIcon}>{businessIcon}</span>

              <span>
                <span className={`${styles.heading} block text-sm font-black`}>
                  {data.name}
                </span>
                <span className={`${styles.mutedText} block text-xs`}>
                  {data.category}
                </span>
              </span>
            </a>

            <nav className="hidden items-center gap-2 md:flex">
              <a href="#historia" className={styles.navPill}>
                Historia
              </a>

              {recommendedItems.length > 0 ? (
                <a href="#recomendados" className={styles.navPill}>
                  Recomendados
                </a>
              ) : null}

              {visibleGalleryPhotos.length > 0 ? (
                <a href="#album" className={styles.navPill}>
                  Fotos
                </a>
              ) : null}

              {visibleItems.length > 0 ? (
                <a href="#opciones" className={styles.navPill}>
                  {warmCopy.navLabel}
                </a>
              ) : null}

              <a href="#visitanos" className={styles.navPill}>
                Visítanos
              </a>
            </nav>

            {primaryContact ? (
              <a
                href={primaryContact.href}
                className={`${styles.buttonPrimary} hidden md:inline-flex`}
                {...getExternalLinkProps(primaryContact.href)}
              >
                {getContactIcon(primaryContact.type)} Escríbenos
              </a>
            ) : null}
          </div>
        </header>

        <section
          id="inicio"
          className="grid items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-14"
        >
          <div>
            <div className={styles.badge}>{data.businessType}</div>

            <h1
              className={`${styles.heading} mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl`}
            >
              {data.name}
            </h1>

            <p className={`${styles.text} mt-6 max-w-2xl text-xl leading-9`}>
              {data.shortDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className={styles.buttonPrimary}
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  {getContactIcon(primaryContact.type)} Contactar
                </a>
              ) : null}

              {mainLocation?.mapUrl ? (
                <a
                  href={mainLocation.mapUrl}
                  className={styles.buttonSecondary}
                  {...getExternalLinkProps(mainLocation.mapUrl)}
                >
                  Ver ubicación
                </a>
              ) : (
                <a href="#visitanos" className={styles.buttonSecondary}>
                  Ver detalles
                </a>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className={styles.card}>
                <p className={`${styles.sectionLabel} text-xs font-black uppercase tracking-[0.22em]`}>
                  Trato local
                </p>
                <p className={`${styles.heading} mt-2 text-xl font-black`}>
                  Atención cercana
                </p>
              </article>

              <article className={styles.card}>
                <p className={`${styles.sectionLabel} text-xs font-black uppercase tracking-[0.22em]`}>
                  Zona
                </p>
                <p className={`${styles.heading} mt-2 text-xl font-black`}>
                  {mainLocation ? getLocationText(mainLocation) : "Sabinas Hidalgo"}
                </p>
              </article>
            </div>
          </div>

          <div className="relative">
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
                <p className="text-sm font-black uppercase tracking-[0.25em]">
                  Negocio local
                </p>
                <p className="mt-2 text-2xl font-black">
                  Cercano, práctico y listo para atenderte.
                </p>
              </div>
            </div>

            {visibleGalleryPhotos[0] ? (
              <div className="absolute bottom-6 left-6 hidden w-40 overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-2xl xl:block">
                <img
                  src={visibleGalleryPhotos[0].src}
                  alt={visibleGalleryPhotos[0].alt}
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>

        <section id="historia" className="py-10 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p
                className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
              >
                Historia
              </p>

              <h2 className={`${styles.heading} mt-3 text-4xl font-black sm:text-5xl`}>
                {warmCopy.storyTitle}
              </h2>
            </div>

            <article className={styles.featuredCard}>
              <p className={`${styles.text} text-lg leading-9`}>
                {data.longDescription || data.shortDescription}
              </p>

              {data.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {data.tags.slice(0, 6).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          </div>
        </section>

        {visibleGalleryPhotos.length > 0 ? (
          <section id="album" className="py-10 lg:py-12">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p
                  className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
                >
                  Álbum
                </p>

                <h2
                  className={`${styles.heading} mt-3 max-w-3xl text-4xl font-black sm:text-5xl`}
                >
                  Un vistazo al ambiente del negocio.
                </h2>
              </div>

              <p className={`${styles.mutedText} max-w-md leading-7`}>
                Fotos para conocer el lugar, los productos o el tipo de atención
                que ofrece.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-5">
              {visibleGalleryPhotos.map((photo, index) => (
                <figure
                  key={photo.id}
                  className={`${styles.galleryCard} ${
                    index === 0 ? "md:col-span-3 md:row-span-2" : "md:col-span-2"
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className={`w-full rounded-[1.5rem] object-cover ${
                      index === 0 ? "h-[28rem]" : "h-56"
                    }`}
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {recommendedItems.length > 0 ? (
          <section id="recomendados" className="py-10 lg:py-12">
            <p
              className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
            >
              Recomendados
            </p>

            <h2
              className={`${styles.heading} mt-3 max-w-3xl text-4xl font-black sm:text-5xl`}
            >
              {warmCopy.recommendationTitle}
            </h2>

            <p className={`${styles.mutedText} mt-4 max-w-2xl leading-8`}>
              {warmCopy.recommendationDescription}
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {recommendedItems.map((item, index) => (
                <WarmItemCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  variant={index === 0 ? "featured" : "normal"}
                />
              ))}
            </div>
          </section>
        ) : null}

        {visibleItems.length > 0 ? (
          <section id="opciones" className="py-10 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p
                  className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
                >
                  {warmCopy.navLabel}
                </p>

                <h2 className={`${styles.heading} mt-3 text-4xl font-black sm:text-5xl`}>
                  {warmCopy.optionsTitle}
                </h2>

                <p className={`${styles.mutedText} mt-4 leading-8`}>
                  Una selección clara para revisar sin perder la sensación de
                  trato cercano.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {visibleItems.map((item) => (
                  <WarmItemCard key={item.id} item={item} styles={styles} />
                ))}

                {extraItems.length > 0 ? (
                  <details className={`${styles.card} md:col-span-2`}>
                    <summary className={`${styles.heading} cursor-pointer text-xl font-black`}>
                      Ver más opciones ({extraItems.length})
                    </summary>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {extraItems.map((item) => (
                        <WarmItemCard key={item.id} item={item} styles={styles} />
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section id="visitanos" className="grid gap-6 py-10 lg:grid-cols-2 lg:py-12">
          <article className={styles.featuredCard}>
            <p
              className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
            >
              Contacto
            </p>

            <h2 className={`${styles.heading} mt-3 text-4xl font-black sm:text-5xl`}>
              Estamos para atenderte.
            </h2>

            <p className={`${styles.mutedText} mt-4 leading-8`}>
              Comunícate con el negocio por el medio que te resulte más cómodo.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {data.contacts.length > 0 ? (
                data.contacts.map((contact) => (
                  <a
                    key={contact.id}
                    href={contact.href}
                    className={styles.card}
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
                  Este negocio todavía no tiene contactos públicos.
                </p>
              )}
            </div>
          </article>

          <div className="grid gap-6">
            <article className={styles.card}>
              <p
                className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
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
                className={`${styles.sectionLabel} text-sm font-black uppercase tracking-[0.3em]`}
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

                      {location.referenceNotes ? (
                        <p className={`${styles.mutedText} mt-1 text-sm`}>
                          {location.referenceNotes}
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
        <ContactHub contacts={data.contacts} styles={warmContactHubStyles} />
      ) : null}
    </main>
  );
}
