// app/dashboard/negocios/[businessId]/edit/page.tsx

import {
  getBusinessVisualMode,
  type BusinessSettingsRelation,
} from "@/lib/landing/business-settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BusinessEditForm } from "./business-edit-form";

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
  url: string;
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

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  status: string;
  is_published: boolean;
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
      business_settings (
        visual_mode
      ),
      business_media (
        id,
        type,
        url,
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

  const business = {
    id: businessRow.id,
    name: businessRow.name,
    slug: businessRow.slug,
    short_description: businessRow.short_description,
    long_description: businessRow.long_description,
    status: businessRow.status,
    is_published: businessRow.is_published,
    visual_mode: getBusinessVisualMode(businessRow.business_settings),
    media: (businessRow.business_media ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    items: (businessRow.business_items ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
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
          Editar landing
        </h1>

        <p className="mt-2 text-gray-600">
          Editando: <span className="font-semibold">{business.name}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Estado: {business.status}
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {business.is_published ? "Publicado" : "No publicado"}
          </span>

          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
            /negocio/{business.slug}
          </span>

          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
            Estilo: {business.visual_mode}
          </span>
        </div>

        {query.message ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {query.message}
          </div>
        ) : null}
      </header>

      <section className="mt-8">
        <BusinessEditForm business={business} />
      </section>
    </main>
  );
}