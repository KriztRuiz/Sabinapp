// components/landing/public-business-landing.tsx

/* eslint-disable @next/next/no-img-element */

import { ContactHub } from "./contact-hub";
import type { PublicLandingData } from "@/lib/landing/styles/types";
import { getLandingStyles } from "@/lib/landing/styles";

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

function getContactIcon(type: string) {
  const icons: Record<string, string> = {
    whatsapp: "💬",
    phone: "📞",
    email: "✉️",
    facebook: "📘",
    instagram: "📸",
    tiktok: "🎵",
    x: "𝕏",
    messenger: "💬",
    website: "🌐",
    map: "📍",
    custom: "🔗",
  };

  return icons[type] ?? "🔗";
}

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
  if (text.includes("técnico") || text.includes("tecnico") || text.includes("clima")) {
    return "🛠️";
  }
  if (text.includes("profesional") || text.includes("contador")) return "💼";
  if (text.includes("sitio") || text.includes("quinta")) return "🏡";
  if (text.includes("ocasión") || text.includes("ocasion") || text.includes("garage")) {
    return "🎪";
  }

  return "★";
}

function getDominantItemType(items: PublicLandingData["items"]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
}

function getMenuCopy(data: PublicLandingData) {
  const dominantType = getDominantItemType(data.items);
  const businessText = `${data.businessType} ${data.category}`.toLowerCase();

  if (dominantType === "menu_item" || businessText.includes("comida")) {
    return {
      label: "Menú",
      title: "Opciones del menú",
      description:
        "Platillos, bebidas, paquetes o especialidades que el negocio quiere mostrar al público.",
    };
  }

  if (dominantType === "product" || businessText.includes("comercio")) {
    return {
      label: "Productos",
      title: "Productos disponibles",
      description:
        "Artículos, productos básicos o mercancía que el negocio quiere enseñar en su página.",
    };
  }

  if (
    dominantType === "service" ||
    dominantType === "package" ||
    businessText.includes("servicio")
  ) {
    return {
      label: "Servicios",
      title: "Servicios disponibles",
      description:
        "Servicios, paquetes o soluciones que el negocio ofrece a sus clientes.",
    };
  }

  if (
    dominantType === "installation" ||
    businessText.includes("quinta") ||
    businessText.includes("sitio")
  ) {
    return {
      label: "Instalaciones",
      title: "Instalaciones y servicios",
      description:
        "Espacios, amenidades, reglas o servicios importantes para quienes visitan el lugar.",
    };
  }

  if (
    dominantType === "activity" ||
    businessText.includes("ocasión") ||
    businessText.includes("ocasion") ||
    businessText.includes("garage")
  ) {
    return {
      label: "Actividades",
      title: "Actividades y artículos disponibles",
      description:
        "Opciones temporales, actividades, artículos o información relevante del evento.",
    };
  }

  return {
    label: "Menú",
    title: "Opciones disponibles",
    description:
      "Productos, servicios, paquetes, actividades o elementos que el negocio quiere listar.",
  };
}

function getFeaturedCopy(data: PublicLandingData) {
  const businessText = `${data.businessType} ${data.category}`.toLowerCase();

  if (businessText.includes("comida") || businessText.includes("taquer")) {
    return {
      title: "Especialidades recomendadas",
      description:
        "Los platillos que más conviene destacar visualmente para provocar antojo rápido.",
    };
  }

  if (businessText.includes("comercio") || businessText.includes("abarrotes")) {
    return {
      title: "Productos destacados",
      description:
        "Los productos más útiles, buscados o representativos del negocio.",
    };
  }

  if (
    businessText.includes("técnico") ||
    businessText.includes("tecnico") ||
    businessText.includes("clima")
  ) {
    return {
      title: "Servicios principales",
      description:
        "Servicios clave que ayudan al cliente a entender rápido qué puede contratar.",
    };
  }

  if (businessText.includes("profesional") || businessText.includes("contador")) {
    return {
      title: "Servicios profesionales destacados",
      description:
        "Áreas de atención o paquetes que transmiten confianza y claridad al cliente.",
    };
  }

  if (businessText.includes("sitio") || businessText.includes("quinta")) {
    return {
      title: "Lo más atractivo del lugar",
      description:
        "Instalaciones, amenidades o características que hacen que el lugar destaque.",
    };
  }

  if (
    businessText.includes("ocasión") ||
    businessText.includes("ocasion") ||
    businessText.includes("garage")
  ) {
    return {
      title: "Lo más importante del evento",
      description:
        "Actividades o artículos destacados para comunicar rápido el valor del evento temporal.",
    };
  }

  return {
    title: "Recomendaciones principales",
    description:
      "Elementos destacados con más peso visual que ayudan a vender mejor el negocio.",
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

export function PublicBusinessLanding({ data }: Props) {
  const styles = getLandingStyles(data.visualMode);

  const coverPhoto =
    data.photos.find((photo) => photo.isCover) ?? data.photos[0] ?? null;

  const galleryPhotos = data.photos.filter(
    (photo) => photo.id !== coverPhoto?.id,
  );

  const primaryContact =
    data.contacts.find((contact) => contact.isPrimary) ??
    data.contacts[0] ??
    null;

  const mainLocation = data.locations[0] ?? null;

  const featuredItems = data.items.filter((item) => item.isFeatured);
  const menuItems = data.items;
  const menuCopy = getMenuCopy(data);
  const featuredCopy = getFeaturedCopy(data);
  const businessIcon = getBusinessIcon(data.businessType, data.category);

  return (
    <main className={`${styles.page} relative`}>
      <div className={styles.background} />

      <div className={styles.container}>
        <header className={styles.nav}>
          <div className="flex items-center justify-between gap-4">
            <a href="#inicio" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-500 text-lg text-white">
                {businessIcon}
              </span>

              <span>
                <span
                  className={`block text-sm font-bold leading-tight ${styles.heading}`}
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
              <a href="#menu" className={styles.navPill}>
                {menuCopy.label}
              </a>
              <a href="#destacados" className={styles.navPill}>
                Destacados
              </a>
              <a href="#galeria" className={styles.navPill}>
                Galería
              </a>
              <a href="#contacto" className={styles.navPill}>
                Contacto
              </a>
            </nav>

            {primaryContact ? (
              <a href={primaryContact.href} className={styles.buttonPrimary}>
                Contactar
              </a>
            ) : null}
          </div>
        </header>

        <section id="inicio" className={styles.heroGrid}>
          <div>
            <div className={styles.badge}>{data.businessType}</div>

            <h1
              className={`${styles.heading} mt-6 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl`}
            >
              {data.name}
            </h1>

            <p className={`${styles.text} mt-6 max-w-2xl text-lg leading-8`}>
              {data.shortDescription}
            </p>

            {data.longDescription ? (
              <p className={`${styles.mutedText} mt-4 max-w-2xl leading-7`}>
                {data.longDescription}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryContact ? (
                <a href={primaryContact.href} className={styles.buttonPrimary}>
                  {getContactIcon(primaryContact.type)} {primaryContact.label}
                </a>
              ) : null}

              <a href="#menu" className={styles.buttonSecondary}>
                Ver {menuCopy.label.toLowerCase()}
              </a>
            </div>

            {data.tags.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.heroImageCard}>
            {coverPhoto ? (
              <img
                src={coverPhoto.src}
                alt={coverPhoto.alt}
                className={styles.heroImage}
              />
            ) : (
              <div className="grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-current/20 p-8 text-center">
                <p className={styles.mutedText}>
                  Este negocio todavía no tiene foto principal.
                </p>
              </div>
            )}

            <div className={styles.heroOverlay}>
              <p className="text-sm opacity-75">{data.category}</p>
              <h2 className="mt-1 text-2xl font-black">{data.businessType}</h2>

              {mainLocation ? (
                <p className="mt-2 text-sm opacity-75">
                  {mainLocation.addressText ??
                    mainLocation.serviceAreaText ??
                    mainLocation.referenceNotes ??
                    "Ubicación disponible por contacto"}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          <article className={styles.card}>
            <span className="text-3xl">🏷️</span>
            <h3 className={`${styles.heading} mt-4 text-xl font-black`}>
              Categoría
            </h3>
            <p className={`${styles.mutedText} mt-2 leading-7`}>
              {data.category}
            </p>
          </article>

          <article className={styles.card}>
            <span className="text-3xl">📍</span>
            <h3 className={`${styles.heading} mt-4 text-xl font-black`}>
              Ubicación
            </h3>
            <p className={`${styles.mutedText} mt-2 leading-7`}>
              {mainLocation?.addressText ??
                mainLocation?.serviceAreaText ??
                mainLocation?.referenceNotes ??
                "Consulta ubicación por contacto."}
            </p>
          </article>

          <article className={styles.card}>
            <span className="text-3xl">💬</span>
            <h3 className={`${styles.heading} mt-4 text-xl font-black`}>
              Contacto rápido
            </h3>
            <p className={`${styles.mutedText} mt-2 leading-7`}>
              {primaryContact
                ? `${primaryContact.label}: ${primaryContact.value}`
                : "Sin contacto público todavía."}
            </p>
          </article>
        </section>

        <section id="menu" className="py-20">
          <p
            className={`${styles.sectionLabel} text-sm font-bold uppercase tracking-[0.3em]`}
          >
            {menuCopy.label}
          </p>

          <div className="mt-3 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <h2
                className={`${styles.heading} text-4xl font-black sm:text-5xl`}
              >
                {menuCopy.title}
              </h2>

              <p className={`${styles.mutedText} mt-4 max-w-xl leading-8`}>
                {menuCopy.description}
              </p>
            </div>

            <div className="grid gap-3">
              {menuItems.length > 0 ? (
                menuItems.map((item) => {
                  const price =
                    item.showPrice === true
                      ? formatPrice(item.price, item.currency)
                      : null;

                  return (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-4 ${styles.divider}`}
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={styles.badge}>
                              {getItemTypeLabel(item.type)}
                            </span>

                            {item.isFeatured ? (
                              <span className={styles.tag}>Destacado</span>
                            ) : null}
                          </div>

                          <h3
                            className={`${styles.heading} mt-3 text-xl font-black`}
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
                          <p
                            className={`${styles.price} shrink-0 text-xl font-black`}
                          >
                            {price}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className={styles.card}>
                  <p className={styles.mutedText}>
                    Este negocio todavía no tiene opciones registradas.
                  </p>
                </article>
              )}
            </div>
          </div>
        </section>

        <section id="destacados" className="py-20">
          <p
            className={`${styles.sectionLabel} text-sm font-bold uppercase tracking-[0.3em]`}
          >
            Destacados
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2
                className={`${styles.heading} text-4xl font-black sm:text-5xl`}
              >
                {featuredCopy.title}
              </h2>

              <p className={`${styles.mutedText} mt-4 max-w-2xl leading-8`}>
                {featuredCopy.description}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredItems.length > 0 ? (
              featuredItems.map((item) => {
                const price =
                  item.showPrice === true
                    ? formatPrice(item.price, item.currency)
                    : null;

                return (
                  <article key={item.id} className={styles.featuredCard}>
                    {item.imageUrl ? (
                      <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10">
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt ?? item.name}
                          className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <span className={styles.badge}>
                      {getItemTypeLabel(item.type)}
                    </span>

                    <h3 className={`${styles.heading} mt-3 text-2xl font-black`}>
                      {item.name}
                    </h3>

                    {item.description ? (
                      <p className={`${styles.mutedText} mt-2 leading-7`}>
                        {item.description}
                      </p>
                    ) : null}

                    {price ? (
                      <p className={`${styles.price} mt-5 text-3xl font-black`}>
                        {price}
                      </p>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <article className={styles.card}>
                <p className={styles.mutedText}>
                  Este negocio todavía no tiene destacados.
                </p>
              </article>
            )}
          </div>
        </section>

        <section id="galeria" className="py-16">
          <p
            className={`${styles.sectionLabel} text-sm font-bold uppercase tracking-[0.3em]`}
          >
            Galería
          </p>

          <h2
            className={`${styles.heading} mt-3 text-4xl font-black sm:text-5xl`}
          >
            Fotos del negocio
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(galleryPhotos.length > 0 ? galleryPhotos : data.photos).map(
              (photo) => (
                <figure key={photo.id} className={styles.galleryCard}>
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-72 w-full object-cover transition duration-500 hover:scale-105"
                  />
                </figure>
              ),
            )}
          </div>
        </section>

        <section
          id="contacto"
          className="grid gap-6 py-20 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <article className={styles.card}>
            <p
              className={`${styles.sectionLabel} text-sm font-bold uppercase tracking-[0.3em]`}
            >
              Horarios
            </p>

            <h2 className={`${styles.heading} mt-3 text-4xl font-black`}>
              Cuándo atiende
            </h2>

            <div className="mt-6 space-y-3">
              {data.hours.map((hour) => (
                <div
                  key={hour.id}
                  className={`flex justify-between gap-4 border-b pb-3 text-sm ${styles.divider}`}
                >
                  <span className={`${styles.heading} font-semibold`}>
                    {hour.label || dayNames[hour.dayOfWeek]}
                  </span>
                  <span className={styles.mutedText}>{formatHour(hour)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.featuredCard}>
            <h2 className={`${styles.heading} text-4xl font-black`}>
              Contacto y ubicación
            </h2>

            <p className={`${styles.mutedText} mt-4 leading-8`}>
              Usa cualquiera de los métodos disponibles para comunicarte con el
              negocio.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {data.contacts.map((contact) => (
                <a
                  key={contact.id}
                  href={contact.href}
                  className={`${styles.card} transition hover:-translate-y-1`}
                >
                  <span className="text-2xl">{getContactIcon(contact.type)}</span>
                  <p className={`${styles.heading} mt-3 font-bold`}>
                    {contact.label}
                  </p>
                  <p className={`${styles.mutedText} text-sm`}>
                    {contact.value}
                  </p>
                </a>
              ))}

              {mainLocation?.mapUrl ? (
                <a
                  href={mainLocation.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.card} transition hover:-translate-y-1`}
                >
                  <span className="text-2xl">📍</span>
                  <p className={`${styles.heading} mt-3 font-bold`}>
                    Ver ubicación
                  </p>
                  <p className={`${styles.mutedText} text-sm`}>Abrir mapa</p>
                </a>
              ) : null}
            </div>
          </article>
        </section>
      </div>

      <ContactHub contacts={data.contacts} styles={styles.contactHub} />
    </main>
  );
}