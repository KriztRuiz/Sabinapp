import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AdRequestForm,
  type AdBusinessOption,
} from "./ad-request-form";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type ContactRow = {
  id: string;
  type: string;
  label: string;
  value: string;
  url: string | null;
  is_active: boolean;
  is_approved: boolean;
  sort_order: number | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_published: boolean;
  contact_methods: ContactRow[] | null;
};

function isCompatibleContact(contact: ContactRow) {
  if (!contact.is_active || !contact.is_approved) {
    return false;
  }

  const explicitUrl = contact.url?.trim() ?? "";
  const value = contact.value.trim();

  if (
    explicitUrl.startsWith("http://") ||
    explicitUrl.startsWith("https://") ||
    explicitUrl.startsWith("tel:") ||
    explicitUrl.startsWith("mailto:")
  ) {
    return true;
  }

  if (
    ["phone", "email", "whatsapp"].includes(contact.type)
  ) {
    return Boolean(value);
  }

  return (
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export default async function NewOwnerAdPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: businessesRaw, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      status,
      is_published,
      contact_methods (
        id,
        type,
        label,
        value,
        url,
        is_active,
        is_approved,
        sort_order
      )
      `,
    )
    .eq("owner_id", user.id)
    .eq("status", "published")
    .eq("is_published", true)
    .eq("contact_methods.is_active", true)
    .eq("contact_methods.is_approved", true)
    .order("name", { ascending: true });

  if (error) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "No se pudieron cargar tus negocios publicados.",
        ),
    );
  }

  const businesses =
    (businessesRaw ?? []) as unknown as BusinessRow[];

  if (businesses.length === 0) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "Necesitas al menos un negocio publicado para solicitar un anuncio.",
        ),
    );
  }

  const options: AdBusinessOption[] = businesses.map(
    (business) => ({
      id: business.id,
      name: business.name,
      slug: business.slug,
      contacts: (business.contact_methods ?? [])
        .filter(isCompatibleContact)
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0),
        )
        .map((contact) => ({
          id: contact.id,
          type: contact.type,
          label: contact.label,
          value: contact.value,
        })),
    }),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard/anuncios"
          className="text-sm font-semibold text-violet-700 hover:text-violet-800"
        >
          ← Volver a Mis Anuncios
        </Link>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-violet-700">
          Publicidad
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Solicitar anuncio
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Elige entre un anuncio fijo de $50 MXN al día o
          una campaña emergente de $100 MXN al día.
        </p>
      </header>

      {query.error ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {query.error}
        </section>
      ) : null}

      <AdRequestForm businesses={options} />
    </main>
  );
}
