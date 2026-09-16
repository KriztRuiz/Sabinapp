import { getPublicStorageUrl } from "@/lib/storage/public-storage-url";
// app/negocio/[slug]/page.tsx

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
  PublicLandingReview,
} from "@/lib/landing/styles/types";
import { getPublicAds } from "@/lib/ads/public-ads";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    reviewMessage?: string;
    reviewError?: string;
  }>;
};

type PublicProfileLabel = {
  id: string;
  display_name: string;
};

type BusinessQueryRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  show_reviews_publicly: boolean;
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
        is_active: boolean | null;
        is_approved: boolean | null;
      }[]
    | null;
  business_media:
    | {
        id: string;
        type: string;
        url: string | null;
        storage_bucket: string | null;
        storage_path: string | null;
        alt_text: string | null;
        is_cover: boolean;
        sort_order: number | null;
        is_active: boolean | null;
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
        image_storage_bucket: string | null;
        image_storage_path: string | null;
        image_alt: string | null;
        sort_order: number | null;
        is_active: boolean | null;
      }[]
    | null;
  business_tags:
    | {
        tags: {
          name: string;
        } | null;
      }[]
    | null;
  reviews:
    | {
        id: string;
        rating: number | null;
        comment: string | null;
        status: string;
        created_at: string;
        updated_at: string;
        user_id: string;
      }[]
    | null;
};

function buildProfileNameMap(labels: PublicProfileLabel[]) {
  return new Map(labels.map((label) => [label.id, label.display_name]));
}

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

function mapBusinessToLandingData(
  row: BusinessQueryRow,
  options?: {
    isAuthenticated?: boolean;
    userId?: string | null;
    profileNames?: Map<string, string>;
    reviewNotice?: PublicLandingData["reviewNotice"];
  },
): PublicLandingData {
  const visualMode = getBusinessVisualMode(row.business_settings);

  const contacts: PublicLandingContact[] = (row.contact_methods ?? [])
    .filter(
      (contact) =>
        contact.is_active !== false && contact.is_approved !== false,
    )
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
    .filter((photo) => photo.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .flatMap((photo) => {
      const src = getPublicStorageUrl({
        bucket: photo.storage_bucket,
        path: photo.storage_path,
        legacyUrl: photo.url,
      });

      if (!src) {
        return [];
      }

      return [
        {
          id: photo.id,
          type: photo.type,
          src,
          alt: photo.alt_text ?? row.name,
          isCover: photo.is_cover,
        },
      ];
    });

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
    .filter((item) => item.is_active !== false)
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
      imageUrl: getPublicStorageUrl({
        bucket: item.image_storage_bucket,
        path: item.image_storage_path,
        legacyUrl: item.image_url,
      }),
      imageAlt: item.image_alt,
    }));

  const tags = (row.business_tags ?? [])
    .map((businessTag) => businessTag.tags?.name)
    .filter((tag): tag is string => Boolean(tag));

  const reviews: PublicLandingReview[] = (row.reviews ?? [])
    .filter((review) => review.status === "published")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      userId: review.user_id,
      authorName: options?.profileNames?.get(review.user_id) ?? "Usuario local",
    }));

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
    reviews,
    reviewForm: {
      isAuthenticated: options?.isAuthenticated ?? false,
      isEnabled: row.show_reviews_publicly,
      userId: options?.userId ?? null,
    },
    reviewNotice: options?.reviewNotice,
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("businesses")
    .select("name, short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_published", true)
    .eq("is_adult_content", false)
    .eq("show_in_search", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
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

export default async function PublicBusinessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const searchParamsValue = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const now = new Date().toISOString();

  const adsResult = await getPublicAds({
    placement: "business_profile",
    includeInterstitial: false,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reviewNotice = searchParamsValue.reviewError
    ? {
        type: "error" as const,
        message: searchParamsValue.reviewError,
      }
    : searchParamsValue.reviewMessage
      ? {
          type: "success" as const,
          message: searchParamsValue.reviewMessage,
        }
      : undefined;

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      long_description,
      show_reviews_publicly,
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
        sort_order,
        is_active,
        is_approved
      ),
      business_media (
        id,
        type,
        url,
        storage_bucket,
        storage_path,
        alt_text,
        is_cover,
        sort_order,
        is_active
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
        image_storage_bucket,
        image_storage_path,
        image_alt,
        sort_order,
        is_active
      ),
      business_tags (
        tags (
          name
        )
      ),
      reviews (
        id,
        rating,
        comment,
        status,
        created_at,
        updated_at,
        user_id
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_published", true)
    .eq("is_adult_content", false)
    .eq("show_in_search", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const businessRow = data as unknown as BusinessQueryRow;
  const reviewUserIds = Array.from(
    new Set((businessRow.reviews ?? []).map((review) => review.user_id)),
  );

  let profileLabels: PublicProfileLabel[] = [];

  if (reviewUserIds.length > 0) {
    const { data: profileLabelsData } = await supabase.rpc(
      "get_public_profile_labels",
      {
        profile_ids: reviewUserIds,
      },
    );

    profileLabels = (profileLabelsData ?? []) as PublicProfileLabel[];
  }

  const landingData = mapBusinessToLandingData(businessRow, {
    isAuthenticated: Boolean(user),
    userId: user?.id ?? null,
    profileNames: buildProfileNameMap(profileLabels),
    reviewNotice,
  });

  return <PublicBusinessLanding data={landingData} fixedAds={adsResult.ads} />;
}
