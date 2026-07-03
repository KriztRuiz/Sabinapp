// app/dashboard/negocios/[businessId]/edit/page.tsx

import {
  normalizeLandingVisualMode,
  type LandingVisualMode,
} from "@/lib/landing/styles";
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

type BusinessSettingsRow = {
  visual_mode: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  status: string;
  is_published: boolean;
  business_settings: BusinessSettingsRow[] | BusinessSettingsRow | null;
};

function getBusinessVisualMode(
  settings: BusinessRow["business_settings"],
): LandingVisualMode {
  if (Array.isArray(settings)) {
    return normalizeLandingVisualMode(settings[0]?.visual_mode);
  }

  return normalizeLandingVisualMode(settings?.visual_mode);
}

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