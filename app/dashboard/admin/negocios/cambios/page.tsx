import { requireModerationAccess } from "../moderation-access";
import { ModerationPage, type PageProps } from "../moderation-page";
import { ConfirmAdminActionButton } from "../confirm-admin-action-button";
import {
  markAllBusinessChangeEventsSeen,
  markAllBusinessChangeEventsSeenForBusiness,
  markBusinessChangeEventSeen,
  sendBusinessChangeBackToReview,
} from "../actions";
import { formatDate } from "../moderation-format";

type BusinessChangeEventRow = {
  id: string;
  business_id: string | null;
  business_name_snapshot: string;
  business_slug_snapshot: string;
  actor_email_snapshot: string | null;
  action_key: string;
  target_table: string;
  target_id: string | null;
  summary: string;
  before_data: Record<string, unknown>;
  after_data: Record<string, unknown>;
  review_status: string;
  created_at: string;
};

type BusinessChangeSummaryRow = {
  business_id: string | null;
  business_name_snapshot: string;
  business_slug_snapshot: string;
  action_key: string;
  review_status: string;
  created_at: string;
};

const CHANGE_FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  short_description: "Descripción corta",
  long_description: "Descripción larga",
  visual_mode: "Estilo visual",
  type: "Tipo",
  label: "Etiqueta",
  value: "Valor visible",
  url: "Enlace",
  is_primary: "Contacto principal",
  is_active: "Activo",
  sort_order: "Orden",
  day_of_week: "Día",
  period_order: "Orden del horario",
  opens_at: "Abre",
  closes_at: "Cierra",
  is_closed: "Cerrado",
  notes: "Notas",
  location_type: "Tipo de ubicación",
  address_text: "Dirección",
  neighborhood: "Colonia",
  reference_notes: "Referencias",
  service_area_text: "Área de servicio",
  map_url: "Enlace de mapa",
  is_public: "Visible públicamente",
  media_type: "Tipo de imagen",
  image_url: "Imagen",
  alt_text: "Texto alternativo",
  is_cover: "Portada",
  cover_media_id: "ID de imagen de portada",
  cover_image_url: "Imagen de portada",
  cover_alt_text: "Texto alternativo de portada",
  item_type: "Tipo",
  description: "Descripción",
  price: "Precio",
  currency: "Moneda",
  show_price: "Mostrar precio",
  is_featured: "Destacado",
  image_alt: "Texto alternativo de imagen",
};

const VISUAL_MODE_LABELS: Record<string, string> = {
  classic: "Clásico",
  modern: "Moderno",
  warm: "Cálido",
  compact: "Compacto",
  elegant: "Elegante",
  impact: "Impacto",
};

const CHANGE_ACTION_LABELS: Record<string, string> = {
  business_public_content_updated: "Contenido o estilo actualizado",
  business_contact_added: "Contacto agregado",
  business_contact_updated: "Contacto actualizado",
  business_contact_deleted: "Contacto eliminado",
  business_hour_added: "Horario agregado",
  business_hour_updated: "Horario actualizado",
  business_hour_deleted: "Horario eliminado",
  business_location_added: "Ubicación agregada",
  business_location_updated: "Ubicación actualizada",
  business_location_deleted: "Ubicación eliminada",
  business_media_added: "Imagen agregada",
  business_media_updated: "Imagen actualizada",
  business_media_deleted: "Imagen eliminada",
  business_media_cover_changed: "Portada cambiada",
  business_item_added: "Item agregado",
  business_item_updated: "Item actualizado",
  business_item_deleted: "Item eliminado",
};

function formatChangeActionKey(actionKey: string) {
  return CHANGE_ACTION_LABELS[actionKey] ?? actionKey;
}

function formatChangeValue(fieldKey: string, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  if (fieldKey === "visual_mode" && typeof value === "string") {
    return VISUAL_MODE_LABELS[value] ?? value;
  }

  if (fieldKey === "day_of_week" && typeof value === "number") {
    const dayLabels: Record<number, string> = {
      0: "Domingo",
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
      6: "Sábado",
    };

    return dayLabels[value] ?? String(value);
  }

  if (
    (fieldKey === "opens_at" || fieldKey === "closes_at") &&
    typeof value === "string"
  ) {
    return value.slice(0, 5);
  }

  if (fieldKey === "item_type" && typeof value === "string") {
    const itemTypeLabels: Record<string, string> = {
      menu_item: "Menú",
      product: "Producto",
      service: "Servicio",
      promotion: "Promoción",
      other: "Otro",
    };

    return itemTypeLabels[value] ?? value;
  }

  if (fieldKey === "price" && typeof value === "number") {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (fieldKey === "media_type" && typeof value === "string") {
    const mediaTypeLabels: Record<string, string> = {
      cover: "Portada",
      gallery: "Galería",
    };

    return mediaTypeLabels[value] ?? value;
  }

  if (fieldKey === "location_type" && typeof value === "string") {
    const locationTypeLabels: Record<string, string> = {
      physical_location: "Local físico",
      home_service: "Servicio a domicilio",
      pickup_point: "Punto de entrega",
      contact_only: "Sólo contacto",
      temporary_event: "Evento temporal",
      service_area: "Área de servicio",
    };

    return locationTypeLabels[value] ?? value;
  }

  if (fieldKey === "type" && typeof value === "string") {
    const contactTypeLabels: Record<string, string> = {
      phone: "Teléfono",
      whatsapp: "WhatsApp",
      email: "Correo electrónico",
      facebook: "Facebook",
      instagram: "Instagram",
      website: "Sitio web",
      other: "Otro",
    };

    return contactTypeLabels[value] ?? value;
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function getDisplayDataForCreatedOrDeletedChange(
  data: Record<string, unknown>,
) {
  return Object.keys(data).map((key) => ({
    key,
    label: CHANGE_FIELD_LABELS[key] ?? key,
    value: formatChangeValue(key, data[key]),
    rawValue: data[key],
  }));
}

function isUrlLikeValue(value: unknown) {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:"))
  );
}

function getChangedFields(event: BusinessChangeEventRow) {
  const beforeData = event.before_data ?? {};
  const afterData = event.after_data ?? {};

  const keys = Array.from(
    new Set([...Object.keys(beforeData), ...Object.keys(afterData)]),
  );

  return keys
    .filter((key) => {
      return JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key]);
    })
    .map((key) => ({
      key,
      label: CHANGE_FIELD_LABELS[key] ?? key,
      beforeValue: formatChangeValue(key, beforeData[key]),
      afterValue: formatChangeValue(key, afterData[key]),
    }));
}

function groupChangeEventsByBusiness(events: BusinessChangeEventRow[]) {
  const groups = new Map<
    string,
    {
      businessId: string | null;
      businessName: string;
      businessSlug: string;
      latestCreatedAt: string;
      events: BusinessChangeEventRow[];
    }
  >();

  for (const event of events) {
    const groupKey = event.business_id ?? event.business_slug_snapshot;
    const currentGroup = groups.get(groupKey);

    if (!currentGroup) {
      groups.set(groupKey, {
        businessId: event.business_id,
        businessName: event.business_name_snapshot,
        businessSlug: event.business_slug_snapshot,
        latestCreatedAt: event.created_at,
        events: [event],
      });

      continue;
    }

    currentGroup.events.push(event);

    if (
      new Date(event.created_at).getTime() >
      new Date(currentGroup.latestCreatedAt).getTime()
    ) {
      currentGroup.latestCreatedAt = event.created_at;
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) =>
      new Date(b.latestCreatedAt).getTime() -
      new Date(a.latestCreatedAt).getTime(),
  );
}

function countChangeEventsByPrefix(
  events: BusinessChangeEventRow[],
  prefix: string,
) {
  return events.filter((event) => event.action_key.startsWith(prefix)).length;
}

function groupAllChangeEventsByBusiness(events: BusinessChangeSummaryRow[]) {
  const groups = new Map<
    string,
    {
      businessId: string | null;
      businessName: string;
      businessSlug: string;
      total: number;
      unseen: number;
      seen: number;
      sentToReview: number;
      other: number;
      latestCreatedAt: string;
    }
  >();

  for (const event of events) {
    const groupKey = event.business_id ?? event.business_slug_snapshot;
    const currentGroup = groups.get(groupKey);

    if (!currentGroup) {
      groups.set(groupKey, {
        businessId: event.business_id,
        businessName: event.business_name_snapshot,
        businessSlug: event.business_slug_snapshot,
        total: 1,
        unseen: event.review_status === "unseen" ? 1 : 0,
        seen: event.review_status === "seen" ? 1 : 0,
        sentToReview: event.review_status === "sent_to_review" ? 1 : 0,
        other:
          event.review_status !== "unseen" &&
          event.review_status !== "seen" &&
          event.review_status !== "sent_to_review"
            ? 1
            : 0,
        latestCreatedAt: event.created_at,
      });

      continue;
    }

    currentGroup.total += 1;

    if (event.review_status === "unseen") {
      currentGroup.unseen += 1;
    } else if (event.review_status === "seen") {
      currentGroup.seen += 1;
    } else if (event.review_status === "sent_to_review") {
      currentGroup.sentToReview += 1;
    } else {
      currentGroup.other += 1;
    }

    if (
      new Date(event.created_at).getTime() >
      new Date(currentGroup.latestCreatedAt).getTime()
    ) {
      currentGroup.latestCreatedAt = event.created_at;
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) =>
      new Date(b.latestCreatedAt).getTime() -
      new Date(a.latestCreatedAt).getTime(),
  );
}

export default async function Page({ searchParams }: PageProps) {
  const { supabase, canManageReports } = await requireModerationAccess();
  const { data: changeEventsRaw, error: changeEventsError } = await supabase
    .from("business_change_events")
    .select(
      `
      id,
      business_id,
      business_name_snapshot,
      business_slug_snapshot,
      actor_email_snapshot,
      action_key,
      target_table,
      target_id,
      summary,
      before_data,
      after_data,
      review_status,
      created_at
    `,
    )
    .eq("review_status", "unseen")
    .order("created_at", { ascending: false });

  const changeEvents =
    (changeEventsRaw ?? []) as unknown as BusinessChangeEventRow[];

  const { data: allChangeEventsRaw, error: allChangeEventsError } =
    await supabase
      .from("business_change_events")
      .select(
        `
        business_id,
        business_name_snapshot,
        business_slug_snapshot,
        action_key,
        review_status,
        created_at
      `,
      )
      .order("created_at", { ascending: false });

  const allChangeEvents =
    (allChangeEventsRaw ?? []) as unknown as BusinessChangeSummaryRow[];

  const groupedAllChangeEvents =
    groupAllChangeEventsByBusiness(allChangeEvents);

  const allChangeEventsSeenCount = allChangeEvents.filter(
    (event) => event.review_status === "seen",
  ).length;

  const allChangeEventsSentToReviewCount = allChangeEvents.filter(
    (event) => event.review_status === "sent_to_review",
  ).length;

  const groupedChangeEvents = groupChangeEventsByBusiness(changeEvents);

  const changeSummaryCards = [
    {
      label: "Cambios sin ver",
      value: changeEvents.length,
    },
    {
      label: "Negocios con cambios pendientes",
      value: groupedChangeEvents.length,
    },
    {
      label: "Cambios registrados",
      value: allChangeEvents.length,
    },
    {
      label: "Negocios con historial",
      value: groupedAllChangeEvents.length,
    },
    {
      label: "Cambios vistos",
      value: allChangeEventsSeenCount,
    },
    {
      label: "Enviados a revisión",
      value: allChangeEventsSentToReviewCount,
    },
    {
      label: "Contactos pendientes",
      value: countChangeEventsByPrefix(changeEvents, "business_contact_"),
    },
    {
      label: "Contenido pendiente",
      value: changeEvents.filter(
        (event) => event.action_key === "business_public_content_updated",
      ).length,
    },
  ];

  return (
    <ModerationPage section="cambios" reports={Boolean(canManageReports)} {...await searchParams}>
      {changeEventsError ? (
        <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h2 className="text-xl font-black">
            No se pudieron cargar los avisos de cambios
          </h2>

          <p className="mt-2 text-sm">
            Los negocios cargaron correctamente, pero no se pudieron cargar
            los cambios pendientes de revisión.
          </p>
        </section>
      ) : null}

      {!changeEventsError ? (
        <section className="mt-8 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700">
                Resumen de cambios
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-950">
                Cambios pendientes por revisar
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Este resumen separa los cambios pendientes del historial
                completo de actividad. La información detallada se mantiene
                agrupada para evitar saturar la página.
              </p>
            </div>

            {allChangeEventsError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
                No se pudo cargar el historial completo de cambios.
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {changeSummaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
              >
                <p className="text-sm font-bold text-gray-600">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black text-gray-950">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {!allChangeEventsError && groupedAllChangeEvents.length > 0 ? (
            <details className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-amber-900">
                Ver actividad histórica por negocio
              </summary>

              <div className="mt-4 grid gap-3">
                {groupedAllChangeEvents.map((group) => (
                  <article
                    key={group.businessId ?? group.businessSlug}
                    className="rounded-2xl border border-amber-100 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-black text-gray-950">
                          {group.businessName}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          /negocio/{group.businessSlug}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Último cambio: {formatDate(group.latestCreatedAt)}
                        </p>
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-700">
                          Total: {group.total}
                        </span>

                        <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-900">
                          Sin ver: {group.unseen}
                        </span>

                        <span className="rounded-full bg-green-100 px-3 py-1 font-bold text-green-800">
                          Vistos: {group.seen}
                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-800">
                          A revisión: {group.sentToReview}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      {!changeEventsError && changeEvents.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700">
                Cambios pendientes
              </p>

              <h2 className="mt-2 text-2xl font-black text-amber-950">
                Cambios hechos por dueños en negocios publicados
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                Los cambios se agrupan por negocio. Sólo se muestran los
                campos que realmente cambiaron.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:items-center">
              <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">
                {changeEvents.length} cambio
                {changeEvents.length === 1 ? "" : "s"} sin ver
              </span>

              <form action={markAllBusinessChangeEventsSeen}>
                <ConfirmAdminActionButton
                  confirmMessage="¿Marcar todos los cambios pendientes de todos los negocios como vistos?"
                  className="w-full rounded-full bg-gray-950 px-4 py-2 text-sm font-black text-white transition hover:bg-gray-800"
                >
                  Marcar todos vistos
                </ConfirmAdminActionButton>
              </form>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {groupedChangeEvents.map((group) => (
              <article
                key={group.businessId ?? group.businessSlug}
                className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
                        {group.events.length} cambio
                        {group.events.length === 1 ? "" : "s"} sin ver
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                        Más reciente: {formatDate(group.latestCreatedAt)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-gray-950">
                      {group.businessName}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      /negocio/{group.businessSlug}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                    {group.businessId ? (
                      <form action={markAllBusinessChangeEventsSeenForBusiness}>
                        <input
                          type="hidden"
                          name="businessId"
                          value={group.businessId}
                        />

                        <ConfirmAdminActionButton
                          confirmMessage="¿Marcar todos los cambios de este negocio como vistos?"
                          className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-800 transition hover:bg-gray-50"
                        >
                          Marcar negocio visto
                        </ConfirmAdminActionButton>
                      </form>
                    ) : null}

                    {group.events[0]?.business_id ? (
                      <form action={sendBusinessChangeBackToReview}>
                        <input
                          type="hidden"
                          name="changeEventId"
                          value={group.events[0].id}
                        />

                        <ConfirmAdminActionButton
                          confirmMessage="¿Retirar este negocio del público y mandarlo nuevamente a revisión? El negocio dejará de aparecer públicamente."
                          className="w-full rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white transition hover:bg-red-800"
                        >
                          Retirar y revisar
                        </ConfirmAdminActionButton>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {group.events.map((event) => {
                    const changedFields = getChangedFields(event);

                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                                {formatChangeActionKey(event.action_key)}
                              </span>
                            </div>

                            <p className="mt-3 text-sm font-black text-gray-950">
                              {event.summary}
                            </p>

                            <div className="mt-2 grid gap-1 text-xs font-semibold text-gray-500 sm:grid-cols-2">
                              <p>
                                Usuario:{" "}
                                {event.actor_email_snapshot ?? "Sin correo"}
                              </p>

                              <p>Fecha: {formatDate(event.created_at)}</p>
                            </div>
                          </div>

                          <form action={markBusinessChangeEventSeen}>
                            <input
                              type="hidden"
                              name="changeEventId"
                              value={event.id}
                            />

                            <ConfirmAdminActionButton
                              confirmMessage="¿Marcar este cambio como visto?"
                              className="w-full rounded-full bg-gray-950 px-4 py-2 text-sm font-black text-white transition hover:bg-gray-800"
                            >
                              Marcar visto
                            </ConfirmAdminActionButton>
                          </form>
                        </div>

                        <div className="mt-4">
                          {(() => {
                            const isCreatedChange =
                              Object.keys(event.before_data ?? {}).length ===
                                0 &&
                              Object.keys(event.after_data ?? {}).length > 0;

                            const isDeletedChange =
                              Object.keys(event.after_data ?? {}).length ===
                                0 &&
                              Object.keys(event.before_data ?? {}).length > 0;

                            if (isCreatedChange || isDeletedChange) {
                              const displayFields =
                                getDisplayDataForCreatedOrDeletedChange(
                                  isCreatedChange
                                    ? event.after_data
                                    : event.before_data,
                                );

                              return (
                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                                    {isCreatedChange
                                      ? "Datos agregados"
                                      : "Datos eliminados"}
                                  </p>

                                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    {displayFields.map((field) => (
                                      <div
                                        key={field.key}
                                        className="rounded-2xl bg-gray-50 p-3"
                                      >
                                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                                          {field.label}
                                        </p>

                                        {isUrlLikeValue(field.rawValue) ? (
                                          <a
                                            href={String(field.rawValue)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 block break-words text-sm font-bold leading-6 text-orange-700 hover:text-orange-800"
                                          >
                                            {field.value}
                                          </a>
                                        ) : (
                                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                                            {field.value}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="grid gap-3">
                                {changedFields.length > 0 ? (
                                  changedFields.map((field) => (
                                    <div
                                      key={field.key}
                                      className="rounded-2xl border border-gray-200 bg-white p-4"
                                    >
                                      <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                                        {field.label}
                                      </p>

                                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                        <div className="rounded-2xl bg-red-50 p-3">
                                          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
                                            Antes
                                          </p>

                                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                                            {field.beforeValue}
                                          </p>
                                        </div>

                                        <div className="rounded-2xl bg-green-50 p-3">
                                          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                                            Después
                                          </p>

                                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                                            {field.afterValue}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                                    No se detectaron diferencias específicas en este
                                    aviso.
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </ModerationPage>
  );
}
