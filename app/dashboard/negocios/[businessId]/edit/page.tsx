import { getPublicStorageUrl } from "@/lib/storage/public-storage-url";
// app/dashboard/negocios/[businessId]/edit/page.tsx

import {
  getBusinessVisualMode,
  type BusinessSettingsRelation,
} from "@/lib/landing/business-settings";
import { getLandingVisualModeOption } from "@/lib/landing/styles";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BusinessEditForm } from "./business-edit-form";
import { pausePublishedOwnedBusiness,
  publishApprovedOwnedBusiness, submitBusinessForReview } from "./actions";
import { SubmitBusinessReviewButton } from "./submit-business-review-button";
import { PauseOwnedBusinessButton } from "./pause-owned-business-button";
import { PublishOwnedBusinessButton } from "./publish-owned-business-button";

type PageProps = {
  params: Promise<{
    businessId: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

type BusinessMediaRow = {
  id: string;
  type: string;
  url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  alt_text: string | null;
  is_cover: boolean;
  is_active: boolean;
  sort_order: number;
};

type BusinessItemRow = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string;
  show_price: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_storage_bucket: string | null;
  image_storage_path: string | null;
  image_alt: string | null;
  is_active: boolean;
  sort_order: number;
};

type BusinessContactRow = {
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

type BusinessHourRow = {
  id: string;
  day_of_week: number;
  period_order: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  notes: string | null;
};

type BusinessLocationRow = {
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

type BusinessTypeRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  requires_start_end_dates: boolean;
  is_adult_related: boolean;
};

type CategoryRow = {
  id: string;
  business_type_id: string;
  name: string;
  slug: string;
};

function getBusinessStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    pending_review: "Pendiente de revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    published: "Publicado",
    hidden: "Retirado del público",
    suspended: "Suspendido",
    archived: "Archivado",
    expired: "Expirado",
  };

  return labels[status] ?? status;
}

function formatModerationDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  status: string;
  is_published: boolean;
  business_type_id: string;
  category_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  expires_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  hidden_at: string | null;
  business_settings: BusinessSettingsRelation;
  business_media: BusinessMediaRow[] | null;
  business_items: BusinessItemRow[] | null;
  contact_methods: BusinessContactRow[] | null;
  business_hours: BusinessHourRow[] | null;
  business_locations: BusinessLocationRow[] | null;
};

export default async function EditBusinessPage({
  params,
  searchParams,
}: PageProps) {
  const { businessId } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar negocios.");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      long_description,
      status,
      is_published,
      business_type_id,
      category_id,
      starts_at,
      ends_at,
      expires_at,
      submitted_at,
      approved_at,
      rejected_at,
      rejection_reason,
      published_at,
      hidden_at,
      business_settings (
        visual_mode
      ),
      business_media (
        id,
        type,
        url,
        storage_bucket,
        storage_path,
        alt_text,
        is_cover,
        is_active,
        sort_order
      ),
      business_items (
        id,
        type,
        name,
        description,
        price,
        currency,
        show_price,
        is_featured,
        image_url,
        image_storage_bucket,
        image_storage_path,
        image_alt,
        is_active,
        sort_order
      ),
      contact_methods (
        id,
        type,
        label,
        value,
        url,
        is_primary,
        is_active,
        is_approved,
        sort_order
      ),
      business_hours (
        id,
        day_of_week,
        period_order,
        opens_at,
        closes_at,
        is_closed,
        notes
      ),
      business_locations (
        id,
        location_type,
        address_text,
        neighborhood,
        reference_notes,
        service_area_text,
        map_url,
        latitude,
        longitude,
        is_primary,
        is_public
      )
    `,
    )
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const businessRow = data as unknown as BusinessRow;

  if (businessRow.status === "archived") {
    redirect(
      `/dashboard/negocios?message=${encodeURIComponent(
        "Este negocio está archivado y ya no se puede editar.",
      )}`,
    );
  }

  const business = {
    id: businessRow.id,
    name: businessRow.name,
    slug: businessRow.slug,
    short_description: businessRow.short_description,
    long_description: businessRow.long_description,
    status: businessRow.status,
    is_published: businessRow.is_published,
    business_type_id: businessRow.business_type_id,
    category_id: businessRow.category_id,
    starts_at: businessRow.starts_at,
    ends_at: businessRow.ends_at,
    expires_at: businessRow.expires_at,
    submitted_at: businessRow.submitted_at,
    approved_at: businessRow.approved_at,
    rejected_at: businessRow.rejected_at,
    rejection_reason: businessRow.rejection_reason,
    published_at: businessRow.published_at,
    hidden_at: businessRow.hidden_at,
    visual_mode: getBusinessVisualMode(businessRow.business_settings),
    media: (businessRow.business_media ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((media) => ({
        ...media,
        url:
          getPublicStorageUrl({
            bucket: media.storage_bucket,
            path: media.storage_path,
            legacyUrl: media.url,
          }) ?? "",
      })),
    items: (businessRow.business_items ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        ...item,
        image_url: getPublicStorageUrl({
          bucket: item.image_storage_bucket,
          path: item.image_storage_path,
          legacyUrl: item.image_url,
        }),
      })),
    contacts: (businessRow.contact_methods ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    hours: (businessRow.business_hours ?? []).sort(
      (a, b) =>
        a.day_of_week - b.day_of_week || a.period_order - b.period_order,
    ),
    locations: (businessRow.business_locations ?? []).sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.location_type.localeCompare(b.location_type),
    ),
  };

  const { data: businessTypesRaw, error: businessTypesError } = await supabase
    .from("business_types")
    .select(
      "id, key, name, description, requires_start_end_dates, is_adult_related",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const { data: categoriesRaw, error: categoriesError } = await supabase
    .from("categories")
    .select("id, business_type_id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (businessTypesError || categoriesError) {
    redirect(
      `/dashboard/negocios?message=${encodeURIComponent(
        "No se pudieron cargar los catálogos de clasificación.",
      )}`,
    );
  }

  const businessTypes = (businessTypesRaw ?? []) as BusinessTypeRow[];
  const categories = (categoriesRaw ?? []) as CategoryRow[];

  const canSubmitForReview = ["draft", "rejected", "hidden"].includes(
    business.status,
  );

  const canPublishApprovedBusiness = business.status === "approved";
  const canPausePublishedBusiness =
    business.status === "published" && business.is_published;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard/negocios"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Volver a mis negocios
        </Link>

        <p className="mt-6 text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Editar negocio
        </h1>

        <p className="mt-2 text-gray-600">
          Editando: <span className="font-semibold">{business.name}</span>
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {business.status === "published" && business.is_published ? (
            <Link
              href={`/negocio/${business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
            >
              Ver pública
            </Link>
          ) : (
            <Link
              href={`/dashboard/negocios/${business.id}/preview`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
            >
              Vista previa
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Estado: {getBusinessStatusLabel(business.status)}
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {business.is_published ? "Publicado" : "No publicado"}
          </span>

          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
            /negocio/{business.slug}
          </span>

          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
            Estilo: {getLandingVisualModeOption(business.visual_mode).name}
          </span>
        </div>

        {query.message ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {query.message}
          </div>
        ) : null}

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-gray-950">
            Historial de moderación
          </h2>

          <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
            <p>
              <strong>Enviado a revisión:</strong>{" "}
              {formatModerationDate(business.submitted_at)}
            </p>

            <p>
              <strong>Aprobado:</strong>{" "}
              {formatModerationDate(business.approved_at)}
            </p>

            <p>
              <strong>Publicado:</strong>{" "}
              {formatModerationDate(business.published_at)}
            </p>

            <p>
              <strong>Retirado/Ocultado:</strong>{" "}
              {formatModerationDate(business.hidden_at)}
            </p>
          </div>

          {business.rejection_reason ? (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-black">Motivo de rechazo</p>
              <p className="mt-2">{business.rejection_reason}</p>
            </div>
          ) : null}
        </section>

        {canSubmitForReview ? (
          <form
            action={submitBusinessForReview.bind(null, business.id)}
            className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5"
          >
            <h2 className="text-lg font-black text-blue-950">
              Enviar a revisión
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-900">
              Cuando termines de editar la información, envía este negocio a
              revisión. Un administrador deberá aprobarlo antes de que pueda
              publicarse.
            </p>

            <div className="mt-4">
              <SubmitBusinessReviewButton />
            </div>
          </form>
        ) : null}

        {canPublishApprovedBusiness ? (
          <form
            action={publishApprovedOwnedBusiness.bind(null, business.id)}
            className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-5"
          >
            <h2 className="text-lg font-black text-green-950">
              Negocio aprobado
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-green-900">
              Este negocio ya fue aprobado por administración. Puedes
              publicarlo cuando quieras que aparezca en Sabinapp.
            </p>

            <div className="mt-4">
              <PublishOwnedBusinessButton />
            </div>
          </form>
        ) : null}

        {canPausePublishedBusiness ? (
          <form
            action={pausePublishedOwnedBusiness.bind(null, business.id)}
            className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-5"
          >
            <h2 className="text-lg font-black text-amber-950">
              Negocio publicado
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900">
              Si necesitas pausar la publicación, puedes retirar este negocio
              del público. Para volver a publicarlo, deberás enviarlo nuevamente
              a revisión.
            </p>

            <div className="mt-4">
              <PauseOwnedBusinessButton />
            </div>
          </form>
        ) : null}

        {business.status === "pending_review" ? (
          <div className="mt-6 rounded-3xl border border-yellow-100 bg-yellow-50 p-5">
            <h2 className="text-lg font-black text-yellow-950">
              Negocio en revisión
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-yellow-900">
              Tu negocio ya fue enviado. Un administrador debe revisarlo antes
              de aprobarlo o publicarlo.
            </p>
          </div>
        ) : null}
      </header>

      <section className="mt-8">
        <BusinessEditForm
          business={business}
          businessTypes={businessTypes}
          categories={categories}
        />
      </section>
    </main>
  );
}