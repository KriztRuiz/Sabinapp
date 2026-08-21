import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  approveBusinessForReview,
  archiveBusinessFromAdmin,
  extendBusinessExpiration,
  hideBusinessFromPublic,
  markAllBusinessChangeEventsSeen,
  markAllBusinessChangeEventsSeenForBusiness,
  markBusinessChangeEventSeen,
  publishApprovedBusiness,
  rejectBusinessForReview,
  restoreHiddenBusinessToPublic,
  sendBusinessChangeBackToReview,
} from "./actions";
import { ConfirmAdminActionButton } from "./confirm-admin-action-button";

type NamedRelation =
  | {
      name: string;
    }
  | {
      name: string;
    }[]
  | null;

type PageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type BusinessStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "published"
  | "hidden"
  | "suspended"
  | "archived"
  | "expired";

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

type BusinessReviewRow = {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  is_published: boolean;
  is_adult_content: boolean;
  show_in_search: boolean;
  show_in_home: boolean;
  short_description: string;
  business_type: NamedRelation;
  category: NamedRelation;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  published_at: string | null;
  hidden_at: string | null;
  archived_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<BusinessStatus, string> = {
  draft: "Borrador",
  pending_review: "Pendiente de revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  published: "Publicado",
  hidden: "Oculto",
  suspended: "Suspendido",
  archived: "Archivado",
  expired: "Expirado",
};

const STATUS_BADGE_CLASSES: Record<BusinessStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  published: "bg-green-100 text-green-800",
  hidden: "bg-slate-100 text-slate-800",
  suspended: "bg-orange-100 text-orange-800",
  archived: "bg-zinc-100 text-zinc-800",
  expired: "bg-purple-100 text-purple-800",
};

function getRelationName(relation: NamedRelation) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation.name;
}

const CHANGE_FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  short_description: "Descripción corta",
  long_description: "Descripción larga",
  visual_mode: "Estilo visual",
};

const VISUAL_MODE_LABELS: Record<string, string> = {
  classic: "Clásico",
  modern: "Moderno",
  warm: "Cálido",
  compact: "Compacto",
  elegant: "Elegante",
  impact: "Impacto",
};

function formatChangeValue(fieldKey: string, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  if (fieldKey === "visual_mode" && typeof value === "string") {
    return VISUAL_MODE_LABELS[value] ?? value;
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
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

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

function getPublicVisibilityStatus(business: BusinessReviewRow) {
  const isExpired = business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;

  if (business.status === "pending_review") {
    return {
      label: "En revisión",
      detail: "Pendiente de revisión administrativa.",
      canOpenPublicPage: false,
      badgeClass: "bg-yellow-100 text-yellow-800",
    };
  }

  if (business.status === "approved" && !business.is_published) {
    return {
      label: "Aprobado, falta publicar",
      detail: "Ya está aprobado, pero falta publicarlo.",
      canOpenPublicPage: false,
      badgeClass: "bg-blue-100 text-blue-800",
    };
  }

  if (business.status === "rejected") {
    return {
      label: "Rechazado",
      detail: "No aparece públicamente porque fue rechazado.",
      canOpenPublicPage: false,
      badgeClass: "bg-red-100 text-red-800",
    };
  }

  if (business.status === "hidden" || business.hidden_at) {
    return {
      label: "Oculto",
      detail: "No aparece públicamente porque fue ocultado.",
      canOpenPublicPage: false,
      badgeClass: "bg-gray-200 text-gray-800",
    };
  }

  if (business.status === "suspended") {
    return {
      label: "Suspendido",
      detail: "No aparece públicamente porque está suspendido.",
      canOpenPublicPage: false,
      badgeClass: "bg-orange-100 text-orange-800",
    };
  }

  if (business.status === "archived") {
    return {
      label: "Archivado",
      detail: "No aparece públicamente porque está archivado.",
      canOpenPublicPage: false,
      badgeClass: "bg-zinc-100 text-zinc-800",
    };
  }

  if (business.status === "expired" || isExpired) {
    return {
      label: "Vencido",
      detail: "No aparece públicamente porque su vigencia expiró.",
      canOpenPublicPage: false,
      badgeClass: "bg-purple-100 text-purple-800",
    };
  }

  if (!business.is_published || business.status !== "published") {
    return {
      label: "No publicado",
      detail: "No aparece públicamente porque todavía no está publicado.",
      canOpenPublicPage: false,
      badgeClass: "bg-gray-100 text-gray-700",
    };
  }

  if (business.is_adult_content) {
    return {
      label: "Contenido adulto",
      detail: "No aparece en el directorio público general por contenido adulto.",
      canOpenPublicPage: false,
      badgeClass: "bg-red-100 text-red-800",
    };
  }

  if (!business.show_in_search) {
    return {
      label: "Fuera de búsqueda",
      detail: "Está publicado, pero no aparece en el directorio público.",
      canOpenPublicPage: false,
      badgeClass: "bg-slate-100 text-slate-800",
    };
  }

  if (!business.show_in_home) {
    return {
      label: "Visible sin portada",
      detail: "Aparece en el directorio, pero no se destacará en portada.",
      canOpenPublicPage: true,
      badgeClass: "bg-green-100 text-green-800",
    };
  }

  return {
    label: "Visible públicamente",
    detail: "Aparece en el directorio público.",
    canOpenPublicPage: true,
    badgeClass: "bg-green-100 text-green-800",
  };
}

function canOpenPublicPage(business: BusinessReviewRow) {
  const isExpired = business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;

  return (
    business.status === "published" &&
    business.is_published === true &&
    business.is_adult_content === false &&
    business.show_in_search === true &&
    !isExpired
  );
}

function isBusinessExpired(business: BusinessReviewRow) {
  return business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;
}

function getAdminGroupStatus(business: BusinessReviewRow): BusinessStatus {
  const isExpired = business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;

  if (business.status === "published" && isExpired) {
    return "expired";
  }

  return business.status;
}

function groupByStatus(businesses: BusinessReviewRow[]) {
  return businesses.reduce<Record<BusinessStatus, BusinessReviewRow[]>>(
    (groups, business) => {
      groups[getAdminGroupStatus(business)].push(business);
      return groups;
    },
    {
      draft: [],
      pending_review: [],
      approved: [],
      rejected: [],
      published: [],
      hidden: [],
      suspended: [],
      archived: [],
      expired: [],
    },
  );
}

export default async function AdminBusinessesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: canReview } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  if (!canReview) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      status,
      is_published,
      is_adult_content,
      show_in_search,
      show_in_home,
      short_description,
      business_type:business_types (
        name
      ),
      category:categories (
        name
      ),
      submitted_at,
      approved_at,
      rejected_at,
      rejection_reason,
      suspended_at,
      suspension_reason,
      published_at,
      hidden_at,
      archived_at,
      starts_at,
      ends_at,
      expires_at,
      created_at,
      updated_at
    `,
    )
    .order("updated_at", { ascending: false });

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
    .order("created_at", { ascending: false })
    .limit(30);

  const changeEvents =
    (changeEventsRaw ?? []) as unknown as BusinessChangeEventRow[];

  const groupedChangeEvents = groupChangeEventsByBusiness(changeEvents);

  const businesses = (data ?? []) as unknown as BusinessReviewRow[];
  const grouped = groupByStatus(businesses);

  const reviewQueue: BusinessStatus[] = [
    "pending_review",
    "approved",
    "published",
    "hidden",
    "rejected",
    "expired",
    "archived",
    "suspended",
    "draft",
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-950">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-gray-200 pb-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            ← Volver al dashboard
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-orange-700">
            Administración
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Revisión de negocios
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                Panel interno para revisar el estado de los negocios registrados
                en Sabinapp. En esta fase solo mostramos la información; las
                acciones de aprobar o rechazar se agregan después.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-500">Total</p>
              <p className="mt-1 text-4xl font-black">{businesses.length}</p>
            </div>
          </div>
        </header>

        {params.message ? (
          <section className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-6 text-green-800">
            <p className="font-bold">{params.message}</p>
          </section>
        ) : null}

        {params.error ? (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-bold">{params.error}</p>
          </section>
        ) : null}

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
                              <p className="text-sm font-black text-gray-950">
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

                          <div className="mt-4 grid gap-3">
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

                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                                        {field.beforeValue}
                                      </p>
                                    </div>

                                    <div className="rounded-2xl bg-green-50 p-3">
                                      <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                                        Después
                                      </p>

                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
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
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!error ? (
          <section className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {reviewQueue.map((status) => (
              <article
                key={status}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-bold text-gray-500">
                  {STATUS_LABELS[status]}
                </p>

                <p className="mt-2 text-3xl font-black">
                  {grouped[status].length}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        {!error ? (
          <section className="mt-8 space-y-8">
            {reviewQueue.map((status) => {
              const items = grouped[status];

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={status}>
                  <h2 className="text-2xl font-black">
                    {STATUS_LABELS[status]}
                  </h2>

                  <div className="mt-4 grid gap-4">
                    {items.map((business) => (
                      <article
                        key={business.id}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${STATUS_BADGE_CLASSES[business.status]}`}
                              >
                                {STATUS_LABELS[business.status]}
                              </span>

                              {(() => {
                                const publicVisibility =
                                  getPublicVisibilityStatus(business);

                                return (
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-black ${publicVisibility.badgeClass}`}
                                  >
                                    {publicVisibility.label}
                                  </span>
                                );
                              })()}
                            </div>

                            <h3 className="mt-4 text-2xl font-black">
                              {business.name}
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-gray-500">
                              /negocio/{business.slug}
                            </p>

                            <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                              {business.short_description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                                Tipo: {getRelationName(business.business_type) ?? "Sin tipo"}
                              </span>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                                Categoría: {getRelationName(business.category) ?? "Sin categoría"}
                              </span>
                            </div>

                            {business.rejection_reason ? (
                              <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">
                                Motivo de rechazo: {business.rejection_reason}
                              </p>
                            ) : null}

                            {business.suspension_reason ? (
                              <p className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm font-semibold text-orange-800">
                                Motivo de suspensión:{" "}
                                {business.suspension_reason}
                              </p>
                            ) : null}

                            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-800">
                              Visibilidad:{" "}
                              {getPublicVisibilityStatus(business).detail}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 text-sm text-gray-600 lg:min-w-72">
                            <p>
                              <strong>Creado:</strong>{" "}
                              {formatDate(business.created_at)}
                            </p>

                            <p>
                              <strong>Actualizado:</strong>{" "}
                              {formatDate(business.updated_at)}
                            </p>

                            <p>
                              <strong>Enviado:</strong>{" "}
                              {formatDate(business.submitted_at)}
                            </p>

                            <p>
                              <strong>Aprobado:</strong>{" "}
                              {formatDate(business.approved_at)}
                            </p>

                            <p>
                              <strong>Publicado:</strong>{" "}
                              {formatDate(business.published_at)}
                            </p>

                            <p>
                              <strong>Vence:</strong>{" "}
                              {formatDate(business.expires_at)}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {getPublicVisibilityStatus(business)
                                .canOpenPublicPage ? (
                                <Link
                                  href={`/negocio/${business.slug}`}
                                  className="rounded-full bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
                                >
                                  Ver pública
                                </Link>
                              ) : null}

                              {business.status !== "archived" ? (


                                <Link


                                  href={`/dashboard/negocios/${business.id}/edit`}


                                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"


                                >


                                  Editar


                                </Link>


                              ) : (


                                <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-500">


                                  Archivado sin edición


                                </span>


                              )}

                                {!canOpenPublicPage(business) ? (
                                  <Link
                                    href={`/dashboard/admin/negocios/${business.id}/preview`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                                  >
                                    Vista previa
                                  </Link>
                                ) : null}
                            </div>

                            <div id="admin-actions" className="mt-5 space-y-3">

                              {business.status === "pending_review" ? (
                                <form action={approveBusinessForReview}>
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres aprobar la revisión de este negocio? Quedará aprobado, pero todavía no será publicado."
                                    className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
                                  >
                                    Aprobar revisión
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}

                              {business.status === "approved" ? (
                                <form action={publishApprovedBusiness}>
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres publicar este negocio? Aparecerá públicamente en Sabinapp."
                                    className="w-full rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:bg-green-700"
                                  >
                                    Publicar negocio
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}

                              {business.status === "pending_review" ||
                              business.status === "approved" ? (
                                <form
                                  action={rejectBusinessForReview}
                                  className="rounded-2xl border border-red-100 bg-red-50 p-3"
                                >
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <label
                                    htmlFor={`rejection-${business.id}`}
                                    className="text-xs font-black uppercase tracking-[0.18em] text-red-700"
                                  >
                                    Motivo de rechazo
                                  </label>

                                  <textarea
                                    id={`rejection-${business.id}`}
                                    name="rejectionReason"
                                    minLength={10}
                                    rows={3}
                                    placeholder="Ejemplo: falta información verificable del negocio."
                                    className="mt-2 w-full rounded-xl border border-red-200 bg-white p-3 text-sm text-gray-950 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                  />

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres rechazar este negocio? Se guardará el motivo de rechazo y dejará de estar publicado."
                                    className="mt-3 w-full rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-700"
                                  >
                                    Rechazar
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}

                              {business.status === "hidden" ? (
                                <form action={restoreHiddenBusinessToPublic}>
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres volver a mostrar este negocio? Aparecerá públicamente si no está vencido."
                                    className="w-full rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:bg-green-700"
                                  >
                                    Volver a mostrar
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}

                              {business.status === "hidden" ||
                              business.status === "rejected" ||
                              business.status === "expired" ||
                              (business.status === "published" &&
                                isBusinessExpired(business)) ? (
                                <form action={archiveBusinessFromAdmin}>
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres archivar este negocio? No se borrará físicamente, pero saldrá del flujo normal."
                                    className="w-full rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white transition hover:bg-red-800"
                                  >
                                    Archivar negocio
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}

                              {business.expires_at ? (
                                <form
                                  action={extendBusinessExpiration}
                                  className="rounded-2xl border border-purple-100 bg-purple-50 p-3"
                                >
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <label
                                    htmlFor={`days-${business.id}`}
                                    className="text-xs font-black uppercase tracking-[0.18em] text-purple-700"
                                  >
                                    Actualizar vigencia
                                  </label>

                                  <select
                                    id={`days-${business.id}`}
                                    name="days"
                                    defaultValue="30"
                                    className="mt-2 w-full rounded-xl border border-purple-200 bg-white p-3 text-sm text-gray-950 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                  >
                                    <option value="30">Extender 30 días</option>
                                    <option value="90">Extender 90 días</option>
                                    <option value="180">Extender 180 días</option>
                                    <option value="365">Extender 365 días</option>
                                  </select>

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres extender la vigencia de este negocio?"
                                    className="mt-3 w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-black text-white transition hover:bg-purple-700"
                                  >
                                    Extender vigencia
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}

                              {business.status === "published" &&
                              !isBusinessExpired(business) ? (
                                <form action={hideBusinessFromPublic}>
                                  <input
                                    type="hidden"
                                    name="businessId"
                                    value={business.id}
                                  />

                                  <ConfirmAdminActionButton
                                    confirmMessage="¿Seguro que quieres ocultar este negocio? Dejará de aparecer públicamente en Sabinapp."
                                    className="w-full rounded-full bg-gray-700 px-4 py-2 text-sm font-black text-white transition hover:bg-gray-800"
                                  >
                                    Ocultar
                                  </ConfirmAdminActionButton>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
