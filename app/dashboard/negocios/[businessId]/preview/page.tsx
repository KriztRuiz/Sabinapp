// app/dashboard/negocios/[businessId]/preview/page.tsx

import Link from "next/link";
import { PublicBusinessLanding } from "@/components/landing/public-business-landing";
import {
  getBusinessVisualMode,
  type BusinessSettingsRelation,
} from "@/lib/landing/business-settings";
import type {
  PublicLandingContact,
  PublicLandingData,
  PublicLandingHour,
  PublicLandingItem,
  PublicLandingLocation,
  PublicLandingPhoto,
} from "@/lib/landing/styles/types";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    businessId: string;
  }>;
};

type BusinessQueryRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  business_types: {
    name: string;
  } | null;
  categories: {
    name: string;
  } | null;
  business_settings: BusinessSettingsRelation;
  contact_methods:
    | {
        id: string;
        type: string;
        label: string;
        value: string;
        url: string | null;
        is_primary: boolean;
        sort_order: number | null;
      }[]
    | null;
  business_media:
    | {
        id: string;
        type: string;
        url: string;
        alt_text: string | null;
        is_cover: boolean;
        sort_order: number | null;
      }[]
    | null;
  business_hours:
    | {
        id: string;
        day_of_week: number;
        opens_at: string | null;
        closes_at: string | null;
        is_closed: boolean;
        notes: string | null;
      }[]
    | null;
  business_locations:
    | {
        id: string;
        location_type: string;
        address_text: string | null;
        neighborhood: string | null;
        reference_notes: string | null;
        service_area_text: string | null;
        map_url: string | null;
        is_primary: boolean;
        is_public: boolean;
      }[]
    | null;
  business_items:
    | {
        id: string;
        type: string;
        name: string;
        description: string | null;
        price: number | null;
        currency: string | null;
        show_price: boolean;
        is_featured: boolean;
        image_url: string | null;
        image_alt: string | null;
        sort_order: number | null;
      }[]
    | null;
  business_tags:
    | {
        tags: {
          name: string;
        } | null;
      }[]
    | null;
};

function normalizeContactHref(contact: {
  type: string;
  value: string;
  url: string | null;
}) {
  const explicitUrl = contact.url?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const value = contact.value.trim();

  if (contact.type === "phone") {
    return `tel:${value.replace(/\s+/g, "")}`;
  }

  if (contact.type === "email") {
    return `mailto:${value}`;
  }

  if (contact.type === "whatsapp") {
    const phone = value.replace(/\D/g, "");

    return phone ? `https://wa.me/52${phone}` : value;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return value;
}

function mapBusinessToLandingData(row: BusinessQueryRow): PublicLandingData {
  const visualMode = getBusinessVisualMode(row.business_settings);

  const contacts: PublicLandingContact[] = (row.contact_methods ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((contact) => ({
      id: contact.id,
      type: contact.type,
      label: contact.label,
      value: contact.value,
      href: normalizeContactHref(contact),
      isPrimary: contact.is_primary,
    }));

  const photos: PublicLandingPhoto[] = (row.business_media ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((photo) => ({
      id: photo.id,
      type: photo.type,
      src: photo.url,
      alt: photo.alt_text ?? row.name,
      isCover: photo.is_cover,
    }));

  const hours: PublicLandingHour[] = (row.business_hours ?? [])
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((hour) => ({
      id: hour.id,
      dayOfWeek: hour.day_of_week,
      label: "",
      opensAt: hour.opens_at,
      closesAt: hour.closes_at,
      isClosed: hour.is_closed,
      notes: hour.notes,
    }));

  const locations: PublicLandingLocation[] = (row.business_locations ?? [])
    .filter((location) => location.is_public)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((location) => ({
      id: location.id,
      locationType: location.location_type,
      addressText: location.address_text,
      neighborhood: location.neighborhood,
      referenceNotes: location.reference_notes,
      serviceAreaText: location.service_area_text,
      mapUrl: location.map_url,
      isPrimary: location.is_primary,
    }));

  const items: PublicLandingItem[] = (row.business_items ?? [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      price: item.price,
      currency: item.currency,
      showPrice: item.show_price,
      isFeatured: item.is_featured,
      imageUrl: item.image_url,
      imageAlt: item.image_alt,
    }));

  const tags = (row.business_tags ?? [])
    .map((businessTag) => businessTag.tags?.name)
    .filter((tag): tag is string => Boolean(tag));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    category: row.categories?.name ?? "Sin categoría",
    businessType: row.business_types?.name ?? "Negocio local",
    visualMode,
    contacts,
    photos,
    hours,
    locations,
    items,
    tags,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { businessId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para ver la vista previa.");
  }

  const { data: canReviewBusinesses } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  if (!canReviewBusinesses) {
    redirect("/dashboard");
  }


  const { data } = await supabase
    .from("businesses")
    .select("name, short_description")
    .eq("id", businessId)
    .maybeSingle();

  if (!data) {
    return {
      title: "Negocio no encontrado | Sabinapp",
    };
  }

  return {
    title: `${data.name} | Sabinapp`,
    description: data.short_description,
  };
}

export default async function PublicBusinessPage({ params }: PageProps) {
  const { businessId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      long_description,
      business_types (
        name
      ),
      categories (
        name
      ),
      business_settings (
        visual_mode
      ),
      contact_methods (
        id,
        type,
        label,
        value,
        url,
        is_primary,
        sort_order
      ),
      business_media (
        id,
        type,
        url,
        alt_text,
        is_cover,
        sort_order
      ),
      business_hours (
        id,
        day_of_week,
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
        is_primary,
        is_public
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
        sort_order
      ),
      business_tags (
        tags (
          name
        )
      )
    `,
    )
    .eq("id", businessId)
    .eq("contact_methods.is_active", true)
    .eq("business_media.is_active", true)
    .eq("business_items.is_active", true)
    .eq("business_locations.is_public", true)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const landingData = mapBusinessToLandingData(
    data as unknown as BusinessQueryRow,
  );

  return (
    <>
      <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-4 text-sm text-yellow-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black">Vista previa privada del negocio</p>
            <p className="mt-1">
              Esta vista no es pública. Sirve para revisar cómo se verá la
              negocio antes de enviarlo a revisión o publicarlo.
            </p>
          </div>

          <Link
            href={`/dashboard/negocios/${businessId}/edit`}
            className="rounded-full bg-gray-950 px-4 py-2 text-xs font-black text-white transition hover:bg-gray-800"
          >
            Volver al editor
          </Link>
        </div>
      </div>

      <PublicBusinessLanding data={landingData} />
    </>
  );
}