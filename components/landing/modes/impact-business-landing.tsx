// components/landing/modes/impact-business-landing.tsx

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

function getDominantItemType(items: PublicLandingData["items"]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
}

function getImpactCopy(data: PublicLandingData) {
  const dominantType = getDominantItemType(data.items);
  const text = `${data.businessType} ${data.category}`.toLowerCase();

  if (dominantType === "menu_item" || text.includes("comida")) {
    return {
      badge: "Lo más antojable",
      punch: "Pide, visita o pregunta hoy.",
      heroLabel: "Imperdible",
      primaryAction: "Pedir por WhatsApp",
      secondaryAction: "Ver menú",
      quickOne: "Lo más pedido",
      quickTwo: "Menú",
      quickThree: "Contacto",
      featuredTitle: "Lo más pedido",
      restTitle: "Más opciones del menú",
      closeTitle: "¿Listo para pedir?",
    };
  }

  if (dominantType === "product" || text.includes("comercio")) {
    return {
      badge: "Productos destacados",
      punch: "Encuentra lo que necesitas rápido.",
      heroLabel: "Producto fuerte",
      primaryAction: "Consultar producto",
      secondaryAction: "Ver productos",
      quickOne: "Destacados",
      quickTwo: "Productos",
      quickThree: "Contacto",
      featuredTitle: "Destacados de la tienda",
      restTitle: "Más productos",
      closeTitle: "¿Quieres preguntar disponibilidad?",
    };
  }

  if (dominantType === "service" || text.includes("servicio")) {
    return {
      badge: "Solución rápida",
      punch: "Pregunta disponibilidad y agenda contacto.",
      heroLabel: "Servicio clave",
      primaryAction: "Solicitar servicio",
      secondaryAction: "Ver servicios",
      quickOne: "Servicios clave",
      quickTwo: "Opciones",
      quickThree: "Contacto",
      featuredTitle: "Servicios principales",
      restTitle: "Más servicios",
      closeTitle: "¿Necesitas este servicio?",
    };
  }

  if (dominantType === "installation" || text.includes("quinta")) {
    return {
      badge: "Hazlo memorable",
      punch: "Consulta fechas y disponibilidad.",
      heroLabel: "Espacio destacado",
      primaryAction: "Consultar disponibilidad",
      secondaryAction: "Ver espacios",
      quickOne: "Espacios",
      quickTwo: "Detalles",
      quickThree: "Contacto",
      featuredTitle: "Espacios destacados",
      restTitle: "Más detalles",
      closeTitle: "¿Quieres consultar fechas?",
    };
  }

  return {
    badge: "Destacado local",
    punch: "Conoce lo principal y contacta rápido.",
    heroLabel: "Punto fuerte",
    primaryAction: "Contactar negocio",
    secondaryAction: "Ver opciones",
    quickOne: "Destacados",
    quickTwo: "Opciones",
    quickThree: "Contacto",
    featuredTitle: "Puntos fuertes",
    restTitle: "Más opciones",
    closeTitle: "¿Te interesa este negocio?",
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

function getTodayHour(hours: PublicLandingData["hours"]) {
  const today = new Date().getDay();
  return hours.find((hour) => hour.dayOfWeek === today) ?? hours[0] ?? null;
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

function ImpactHeroOffer({
  item,
  label,
  contactHref,
}: {
  item: PublicLandingData["items"][number] | null;
  label: string;
  contactHref: string | null;
}) {
  if (!item) {
    return (
      <div className="grid min-h-[30rem] place-items-center rounded-[2.5rem] border-[3px] border-yellow-300 bg-yellow-300 p-8 text-center text-black shadow-2xl shadow-yellow-950/40">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em]">
            {label}
          </p>
          <h2 className="mt-4 text-5xl font-black uppercase leading-none tracking-[-0.06em]">
            Destacado local
          </h2>
          <p className="mt-4 text-lg font-bold">
            Este negocio todavía no tiene productos destacados.
          </p>
        </div>
      </div>
    );
  }

  const price =
    item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  return (
    <article className="overflow-hidden rounded-[2.5rem] border-[3px] border-yellow-300 bg-yellow-300 text-black shadow-2xl shadow-yellow-950/40">
      {item.imageUrl ? (
        <div className="bg-white">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? item.name}
            className={`h-[22rem] w-full ${
              item.type === "product" ? "object-contain p-5" : "object-cover"
            }`}
          />
        </div>
      ) : null}

      <div className="p-6 sm:p-8">
        <p className="inline-flex rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
          {label}
        </p>

        <h2 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">
          {item.name}
        </h2>

        {item.description ? (
          <p className="mt-4 max-w-xl text-lg font-bold leading-8 text-black/75">
            {item.description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {price ? (
            <p className="rounded-2xl bg-black px-5 py-3 text-4xl font-black text-yellow-300">
              {price}
            </p>
          ) : null}

          {contactHref ? (
            <a
              href={contactHref}
              className="rounded-full border-[3px] border-black px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-yellow-300"
              {...getExternalLinkProps(contactHref)}
            >
              Preguntar
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ImpactShowcaseCard({
  item,
  contactHref,
}: {
  item: PublicLandingData["items"][number];
  contactHref: string | null;
}) {
  const price =
    item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  return (
    <article className="overflow-hidden rounded-[2rem] border-2 border-white/15 bg-white/10 shadow-xl shadow-black/30 backdrop-blur">
      {item.imageUrl ? (
        <div className="bg-white">
          <img
            src={item.imageUrl}
            alt={item.imageAlt ?? item.name}
            className={`h-64 w-full ${
              item.type === "product" ? "object-contain p-4" : "object-cover"
            }`}
          />
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-black">
            {getItemTypeLabel(item.type)}
          </span>

          {item.isFeatured ? (
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
              Destacado
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.04em] text-white">
          {item.name}
        </h3>

        {item.description ? (
          <p className="mt-3 line-clamp-3 leading-7 text-white/70">
            {item.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {price ? (
            <p className="text-3xl font-black text-yellow-300">{price}</p>
          ) : (
            <span />
          )}

          {contactHref ? (
            <a
              href={contactHref}
              className="rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black transition hover:bg-white"
              {...getExternalLinkProps(contactHref)}
            >
              Preguntar
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ImpactListItem({
  item,
}: {
  item: PublicLandingData["items"][number];
}) {
  const price =
    item.showPrice === true ? formatPrice(item.price, item.currency) : null;

  return (
    <article className="grid gap-3 border-b border-white/10 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-yellow-300/30 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-yellow-300">
            {getItemTypeLabel(item.type)}
          </span>
        </div>

        <h3 className="mt-2 text-xl font-black text-white">{item.name}</h3>

        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/60">
            {item.description}
          </p>
        ) : null}
      </div>

      {price ? (
        <p className="text-2xl font-black text-yellow-300 sm:text-right">
          {price}
        </p>
      ) : null}
    </article>
  );
}

export function ImpactBusinessLanding({ data }: Props) {
  const copy = getImpactCopy(data);

  const photos = getUniquePhotosBySrc(data.photos);
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0] ?? null;

  const primaryContact =
    data.contacts.find((contact) => contact.isPrimary) ??
    data.contacts[0] ??
    null;

  const whatsappContact =
    data.contacts.find((contact) => contact.type === "whatsapp") ?? null;

  const phoneContact =
    data.contacts.find((contact) => contact.type === "phone") ?? null;

  const mainLocation = data.locations[0] ?? null;
  const todayHour = getTodayHour(data.hours);

  const featuredItems = data.items.filter((item) => item.isFeatured);
  const heroItem = featuredItems[0] ?? data.items[0] ?? null;

  const showcaseItems =
    featuredItems.length > 0 ? featuredItems.slice(0, 4) : data.items.slice(0, 4);

  const remainingItems = data.items.filter(
    (item) => !showcaseItems.some((featured) => featured.id === item.id),
  );

  const visibleRemainingItems = remainingItems.slice(0, 8);
  const extraItems = remainingItems.slice(8);

  const contactHref = primaryContact?.href ?? null;
  const mapHref = mainLocation?.mapUrl ?? null;

  const impactContactHubStyles = {
    wrapper: "fixed bottom-5 right-5 z-50 hidden md:block",
    panel:
      "mb-3 grid gap-2 rounded-[1.5rem] border border-yellow-300/30 bg-black/90 p-3 shadow-2xl backdrop-blur-xl",
    item:
      "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-yellow-300/10",
    button:
      "inline-flex min-h-14 min-w-[9rem] items-center justify-center rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black shadow-2xl transition hover:scale-105 hover:bg-white",
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black pb-24 text-white md:pb-0">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.35),transparent_30%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.32),transparent_34%),linear-gradient(135deg,#000000_0%,#111827_48%,#450a0a_100%)]" />

      <header className="sticky top-0 z-40 border-b-2 border-yellow-300 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-2xl text-black">
              ⚡
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase tracking-[0.18em]">
                {data.name}
              </span>
              <span className="block truncate text-xs font-bold text-yellow-300">
                {data.category}
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-2 md:flex">
            <a href="#oferta" className="rounded-full px-4 py-2 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
              Oferta
            </a>
            <a href="#destacados" className="rounded-full px-4 py-2 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
              Destacados
            </a>
            <a href="#opciones" className="rounded-full px-4 py-2 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
              Opciones
            </a>
            <a href="#contacto" className="rounded-full px-4 py-2 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
              Contacto
            </a>
          </nav>

          {primaryContact ? (
            <a
              href={primaryContact.href}
              className="hidden rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black transition hover:bg-white md:inline-flex"
              {...getExternalLinkProps(primaryContact.href)}
            >
              {copy.primaryAction}
            </a>
          ) : null}
        </div>
      </header>

      <section id="inicio" className="relative">
        {coverPhoto ? (
          <img
            src={coverPhoto.src}
            alt={coverPhoto.alt}
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black" />

        <div className="relative mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="inline-flex rotate-[-2deg] rounded-xl bg-red-500 px-5 py-3 text-sm font-black uppercase tracking-[0.25em] text-white shadow-2xl">
              {copy.badge}
            </p>

            <h1 className="mt-7 max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white sm:text-8xl lg:text-9xl">
              {data.name}
            </h1>

            <p className="mt-7 max-w-3xl text-3xl font-black uppercase leading-none tracking-[-0.04em] text-yellow-300 sm:text-5xl">
              {copy.punch}
            </p>

            <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white/75">
              {data.shortDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryContact ? (
                <a
                  href={primaryContact.href}
                  className="inline-flex items-center justify-center rounded-full bg-yellow-300 px-8 py-4 text-base font-black text-black shadow-2xl transition hover:-translate-y-0.5 hover:bg-white"
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  {getContactIcon(primaryContact.type)} {copy.primaryAction}
                </a>
              ) : null}

              <a
                href="#destacados"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/20 bg-white/10 px-8 py-4 text-base font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-yellow-300"
              >
                {copy.secondaryAction}
              </a>
            </div>
          </div>

          <div id="oferta">
            <ImpactHeroOffer
              item={heroItem}
              label={copy.heroLabel}
              contactHref={contactHref}
            />
          </div>
        </div>
      </section>

      <section className="border-y-2 border-yellow-300 bg-yellow-300 text-black">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
          <article className="border-black/20 py-4 md:border-r md:pr-6">
            <p className="text-xs font-black uppercase tracking-[0.25em]">
              Hoy
            </p>
            <p className="mt-2 text-2xl font-black">
              {todayHour ? formatHour(todayHour) : "Por contacto"}
            </p>
          </article>

          <article className="border-t border-black/20 py-4 md:border-r md:border-t-0 md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.25em]">
              Contacto
            </p>
            <p className="mt-2 text-2xl font-black">
              {primaryContact ? primaryContact.label : "Por definir"}
            </p>
          </article>

          <article className="border-t border-black/20 py-4 md:border-t-0 md:pl-6">
            <p className="text-xs font-black uppercase tracking-[0.25em]">
              Zona
            </p>
            <p className="mt-2 line-clamp-2 text-2xl font-black">
              {mainLocation ? getLocationText(mainLocation) : "Sabinas Hidalgo"}
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <a
          href="#destacados"
          className="group rounded-[2rem] border-2 border-white/10 bg-white/10 p-6 shadow-xl shadow-black/30 backdrop-blur transition hover:-translate-y-1 hover:border-yellow-300"
        >
          <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-300">
            01
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.05em]">
            {copy.quickOne}
          </h2>
          <p className="mt-3 text-white/60 group-hover:text-white">
            Mira primero lo más fuerte del negocio.
          </p>
        </a>

        <a
          href="#opciones"
          className="group rounded-[2rem] border-2 border-white/10 bg-white/10 p-6 shadow-xl shadow-black/30 backdrop-blur transition hover:-translate-y-1 hover:border-yellow-300"
        >
          <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-300">
            02
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.05em]">
            {copy.quickTwo}
          </h2>
          <p className="mt-3 text-white/60 group-hover:text-white">
            Revisa más opciones sin perder tiempo.
          </p>
        </a>

        <a
          href="#contacto"
          className="group rounded-[2rem] border-2 border-yellow-300 bg-yellow-300 p-6 text-black shadow-xl shadow-yellow-950/40 transition hover:-translate-y-1 hover:bg-white"
        >
          <p className="text-sm font-black uppercase tracking-[0.3em]">
            03
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.05em]">
            {copy.quickThree}
          </h2>
          <p className="mt-3 font-bold text-black/70">
            Pregunta directo por WhatsApp, llamada o mapa.
          </p>
        </a>
      </section>

      {showcaseItems.length > 0 ? (
        <section id="destacados" className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
                Destacados
              </p>
              <h2 className="mt-4 max-w-4xl text-6xl font-black uppercase leading-[0.85] tracking-[-0.07em] sm:text-7xl">
                {copy.featuredTitle}
              </h2>
            </div>

            {primaryContact ? (
              <a
                href={primaryContact.href}
                className="inline-flex items-center justify-center rounded-full bg-yellow-300 px-7 py-4 text-base font-black text-black shadow-xl transition hover:bg-white"
                {...getExternalLinkProps(primaryContact.href)}
              >
                Contactar ahora
              </a>
            ) : null}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {showcaseItems.map((item) => (
              <ImpactShowcaseCard
                key={item.id}
                item={item}
                contactHref={contactHref}
              />
            ))}
          </div>
        </section>
      ) : null}

      {visibleRemainingItems.length > 0 ? (
        <section id="opciones" className="mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border-2 border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
              Lista rápida
            </p>

            <h2 className="mt-4 text-5xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">
              {copy.restTitle}
            </h2>

            <div className="mt-6">
              {visibleRemainingItems.map((item) => (
                <ImpactListItem key={item.id} item={item} />
              ))}
            </div>

            {extraItems.length > 0 ? (
              <details className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <summary className="cursor-pointer text-lg font-black">
                  Ver más opciones ({extraItems.length})
                </summary>

                <div className="mt-4">
                  {extraItems.map((item) => (
                    <ImpactListItem key={item.id} item={item} />
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-[2rem] border-2 border-white/10 bg-white/10 p-6 backdrop-blur">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
            Horarios
          </p>

          <div className="mt-5 grid gap-2">
            {data.hours.length > 0 ? (
              data.hours.slice(0, 7).map((hour) => (
                <div
                  key={hour.id}
                  className="flex justify-between gap-4 border-b border-white/10 pb-2 text-sm"
                >
                  <span className="font-bold">
                    {hour.label || dayNames[hour.dayOfWeek]}
                  </span>
                  <span className="text-right text-white/70">
                    {formatHour(hour)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-white/70">Horario disponible por contacto.</p>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border-2 border-white/10 bg-white/10 p-6 backdrop-blur">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-300">
            Ubicación
          </p>

          <div className="mt-5 grid gap-4">
            {data.locations.length > 0 ? (
              data.locations.slice(0, 2).map((location) => (
                <div
                  key={location.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <p className="font-black">{getLocationText(location)}</p>

                  {location.neighborhood ? (
                    <p className="mt-1 text-sm text-white/70">
                      Colonia: {location.neighborhood}
                    </p>
                  ) : null}

                  {location.referenceNotes ? (
                    <p className="mt-1 text-sm text-white/70">
                      {location.referenceNotes}
                    </p>
                  ) : null}

                  {location.mapUrl ? (
                    <a
                      href={location.mapUrl}
                      className="mt-4 inline-flex rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-black"
                      {...getExternalLinkProps(location.mapUrl)}
                    >
                      Abrir mapa
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-white/70">Ubicación disponible por contacto.</p>
            )}
          </div>
        </article>
      </section>

      <section id="contacto" className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 lg:px-8">
        <article className="rounded-[2.5rem] border-[3px] border-yellow-300 bg-yellow-300 p-8 text-black shadow-2xl shadow-yellow-950/40">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em]">
                Acción final
              </p>

              <h2 className="mt-4 text-6xl font-black uppercase leading-[0.85] tracking-[-0.07em] sm:text-7xl">
                {copy.closeTitle}
              </h2>

              <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-black/70">
                Usa el método disponible para preguntar precios, disponibilidad,
                ubicación o detalles antes de visitar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {data.contacts.length > 0 ? (
                data.contacts.slice(0, 4).map((contact) => (
                  <a
                    key={contact.id}
                    href={contact.href}
                    className="rounded-[1.5rem] bg-black p-5 text-white shadow-xl transition hover:-translate-y-0.5"
                    {...getExternalLinkProps(contact.href)}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {getContactIcon(contact.type)}
                    </span>
                    <p className="mt-3 font-black">{contact.label}</p>
                    <p className="text-sm text-white/60">{contact.value}</p>
                  </a>
                ))
              ) : (
                <p className="font-bold text-black/70">
                  Este negocio todavía no tiene contactos públicos.
                </p>
              )}

              {mapHref ? (
                <a
                  href={mapHref}
                  className="rounded-[1.5rem] border-2 border-black p-5 text-black transition hover:bg-black hover:text-yellow-300"
                  {...getExternalLinkProps(mapHref)}
                >
                  <span className="text-2xl" aria-hidden="true">
                    📍
                  </span>
                  <p className="mt-3 font-black">Ver mapa</p>
                  <p className="text-sm font-bold opacity-70">
                    Abrir ubicación
                  </p>
                </a>
              ) : null}
            </div>
          </div>
        </article>
      </section>

      {data.contacts.length > 0 ? (
        <>
          <ContactHub contacts={data.contacts} styles={impactContactHubStyles} />

          <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-yellow-300 bg-black/95 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
              {(whatsappContact ?? primaryContact) ? (
                <a
                  href={(whatsappContact ?? primaryContact)?.href}
                  className="rounded-2xl bg-yellow-300 px-3 py-3 text-center text-xs font-black text-black"
                  {...getExternalLinkProps((whatsappContact ?? primaryContact)?.href ?? "#")}
                >
                  💬 WhatsApp
                </a>
              ) : null}

              {(phoneContact ?? primaryContact) ? (
                <a
                  href={(phoneContact ?? primaryContact)?.href}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center text-xs font-black text-white"
                  {...getExternalLinkProps((phoneContact ?? primaryContact)?.href ?? "#")}
                >
                  📞 Llamar
                </a>
              ) : null}

              {mapHref ? (
                <a
                  href={mapHref}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center text-xs font-black text-white"
                  {...getExternalLinkProps(mapHref)}
                >
                  📍 Mapa
                </a>
              ) : primaryContact ? (
                <a
                  href={primaryContact.href}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center text-xs font-black text-white"
                  {...getExternalLinkProps(primaryContact.href)}
                >
                  Contacto
                </a>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
