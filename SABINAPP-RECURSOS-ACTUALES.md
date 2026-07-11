# SABINAPP — RECURSOS ACTUALES DEL PROYECTO

## Contexto general

Sabinapp es un directorio local moderado de negocios de Sabinas Hidalgo, Nuevo León, México.

Stack:
- Next.js 16.2 App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- @supabase/supabase-js
- @supabase/ssr
- Git Bash en Windows

Rutas principales:
- /
- /auth/login
- /auth/sign-up
- /auth/forgot-password
- /auth/update-password
- /dashboard
- /dashboard/negocios
- /dashboard/negocios/[businessId]/edit
- /dev/db-test
- /negocio/[slug]

Estado funcional:
- Auth funcionando.
- Recuperación de contraseña funcionando.
- Dashboard funcionando.
- Landing pública funcionando.
- Ruta pública /negocio/[slug] funcionando.
- Selector visual funcionando.
- Edición de contenido y estilo funcionando.
- Edición/agregado de imágenes funcionando.
- Edición/agregado/orden de Menú y Destacados funcionando.
- Formulario de edición dividido en componentes.

Advertencia conocida:
- Warning de hydration con fdprocessedid causado por extensión del navegador. No bloquear salvo que afecte funcionalidad.

## Git status

```text
?? SABINAPP-RECURSOS-ACTUALES.md
```

## Árbol de archivos del proyecto

```text
app/auth/actions.ts
app/auth/callback/route.ts
app/auth/forgot-password/page.tsx
app/auth/login/page.tsx
app/auth/sign-up/page.tsx
app/auth/sign-up-success/page.tsx
app/auth/update-password/page.tsx
app/auth/update-password/update-password-form.tsx
app/dashboard/negocios/[businessId]/edit/actions.ts
app/dashboard/negocios/[businessId]/edit/business-content-style-form.tsx
app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx
app/dashboard/negocios/[businessId]/edit/business-edit-types.ts
app/dashboard/negocios/[businessId]/edit/business-items-section.tsx
app/dashboard/negocios/[businessId]/edit/business-media-section.tsx
app/dashboard/negocios/[businessId]/edit/page.tsx
app/dashboard/negocios/page.tsx
app/dashboard/page.tsx
app/dev/db-test/page.tsx
app/favicon.ico
app/globals.css
app/layout.tsx
app/negocio/[slug]/page.tsx
app/page.tsx
components/landing/contact-hub.tsx
components/landing/public-business-landing.tsx
lib/landing/business-settings.ts
lib/landing/contact.ts
lib/landing/styles/classic.ts
lib/landing/styles/compact.ts
lib/landing/styles/elegant.ts
lib/landing/styles/impact.ts
lib/landing/styles/index.ts
lib/landing/styles/modern.ts
lib/landing/styles/types.ts
lib/landing/styles/warm.ts
lib/supabase/client.ts
lib/supabase/proxy.ts
lib/supabase/server.ts
```

## Archivos clave


### app/dashboard/page.tsx

```tsx
// app/dashboard/page.tsx

import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type RoleRow = {
  roles: {
    key: string;
    name: string;
  } | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_published: boolean;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para entrar al panel.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, status, is_adult_verified")
    .eq("id", user.id)
    .single();

  const { data: roleRowsRaw } = await supabase
    .from("user_roles")
    .select("roles(key, name)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const roleRows = (roleRowsRaw ?? []) as unknown as RoleRow[];

  const { data: businessesRaw } = await supabase
    .from("businesses")
    .select("id, name, slug, status, is_published")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const businesses = (businessesRaw ?? []) as BusinessRow[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-600">Sabinapp</p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Panel principal
          </h1>

          <p className="mt-2 text-gray-600">
            Esta pantalla confirma que la sesión de Supabase funciona dentro de
            Next.js.
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Tu cuenta</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Correo</dt>
              <dd className="text-gray-950">{profile?.email ?? user.email}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Nombre</dt>
              <dd className="text-gray-950">
                {profile?.full_name || "Sin nombre registrado"}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Estado</dt>
              <dd className="text-gray-950">{profile?.status ?? "active"}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Mayor de edad verificado</dt>
              <dd className="text-gray-950">
                {profile?.is_adult_verified ? "Sí" : "No"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Tus roles</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {roleRows.length > 0 ? (
              roleRows.map((row) =>
                row.roles ? (
                  <span
                    key={row.roles.key}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {row.roles.name}
                  </span>
                ) : null,
              )
            ) : (
              <p className="text-sm text-gray-600">Sin roles activos.</p>
            )}
          </div>
        </article>
      </section>

            <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">
          Administración de landing pages
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Edita el contenido y el estilo visual de tus negocios publicados o en
          revisión.
        </p>

        <Link
          href="/dashboard/negocios"
          className="mt-5 inline-flex rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Ir a mis negocios
        </Link>
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">Tus negocios</h2>

        <p className="mt-2 text-sm text-gray-600">
          Por ahora aparecen los negocios demo que asignamos a tu usuario.
        </p>

        <div className="mt-5 grid gap-3">
          {businesses.length > 0 ? (
            businesses.map((business) => (
              <article
                key={business.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-950">
                      {business.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      /negocio/{business.slug}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {business.status}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {business.is_published ? "Publicado" : "No publicado"}
                    </span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-gray-600">
              Todavía no tienes negocios registrados.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
```

### app/dashboard/negocios/page.tsx

```tsx
// app/dashboard/negocios/page.tsx

import {
  getBusinessVisualMode,
  type BusinessSettingsRelation,
} from "@/lib/landing/business-settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_published: boolean;
  short_description: string;
  business_settings: BusinessSettingsRelation;
};

export default async function DashboardBusinessesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para administrar negocios.");
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
      short_description,
      business_settings (
        visual_mode
      )
    `,
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">Mis negocios</h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar tus negocios. Intenta de nuevo.
        </div>
      </main>
    );
  }

  const businesses = (businessesRaw ?? []) as unknown as BusinessRow[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">Mis negocios</h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Administra el contenido básico y el estilo visual de las landing pages
          públicas.
        </p>
      </header>

      <section className="mt-8 grid gap-4">
        {businesses.length > 0 ? (
          businesses.map((business) => {
            const visualMode = getBusinessVisualMode(
              business.business_settings,
            );

            return (
              <article
                key={business.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      {business.name}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm text-gray-600">
                      {business.short_description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Estado: {business.status}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {business.is_published ? "Publicado" : "No publicado"}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                        Estilo: {visualMode}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    <Link
                      href={`/dashboard/negocios/${business.id}/edit`}
                      className="rounded-lg bg-gray-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Editar landing
                    </Link>

                    {business.is_published ? (
                      <Link
                        href={`/negocio/${business.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Ver pública
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
            Todavía no tienes negocios registrados.
          </div>
        )}
      </section>
    </main>
  );
}
```

### app/dashboard/negocios/[businessId]/edit/page.tsx

```tsx
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
```

### app/dashboard/negocios/[businessId]/edit/actions.ts

```tsx
// app/dashboard/negocios/[businessId]/edit/actions.ts

"use server";

import { isBusinessItemType } from "./business-edit-types";
import { isLandingVisualMode } from "@/lib/landing/styles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateBusinessLanding(
  businessId: string,
  formData: FormData,
) {
  const name = getFormValue(formData, "name");
  const shortDescription = getFormValue(formData, "short_description");
  const longDescription = getFormValue(formData, "long_description");
  const visualMode = getFormValue(formData, "visual_mode");

  if (!name || !shortDescription) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        "Nombre y descripción corta son obligatorios.",
      )}`,
    );
  }

  if (shortDescription.length < 10) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        "La descripción corta debe tener al menos 10 caracteres.",
      )}`,
    );
  }

  if (!isLandingVisualMode(visualMode)) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        "Selecciona un estilo visual válido.",
      )}`,
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para guardar cambios.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirect(
      `/dashboard/negocios?message=${encodeURIComponent(
        "No se encontró el negocio o no tienes permiso.",
      )}`,
    );
  }

  const { data: updatedBusiness, error: updateBusinessError } = await supabase
    .from("businesses")
    .update({
      name,
      short_description: shortDescription,
      long_description: longDescription || null,
    })
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .select("id, name, short_description, long_description, slug")
    .single();

  if (updateBusinessError || !updatedBusiness) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        `No se pudo actualizar el contenido del negocio: ${
          updateBusinessError?.message ?? "sin filas actualizadas"
        }`,
      )}`,
    );
  }

  const { data: updatedSettings, error: upsertSettingsError } = await supabase
    .from("business_settings")
    .upsert(
      {
        business_id: businessId,
        visual_mode: visualMode,
      },
      {
        onConflict: "business_id",
      },
    )
    .select("business_id, visual_mode")
    .single();

  if (upsertSettingsError || !updatedSettings) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        `El contenido se guardó, pero no se pudo guardar el estilo visual: ${
          upsertSettingsError?.message ?? "sin configuración actualizada"
        }`,
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");
  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      "Cambios guardados correctamente.",
    )}`,
  );
}

function isValidMediaUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function redirectToEditBusiness(businessId: string, message: string): never {
  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function updateBusinessMediaDetails(
  businessId: string,
  mediaId: string,
  formData: FormData,
) {
  const url = getFormValue(formData, "url");
  const altText = getFormValue(formData, "alt_text");
  const isActive = formData.get("is_active") === "on";

  if (!url) {
    redirectToEditBusiness(businessId, "La URL de la imagen es obligatoria.");
  }

  if (!isValidMediaUrl(url)) {
    redirectToEditBusiness(
      businessId,
      "La URL de la imagen debe iniciar con http:// o https://.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar imágenes.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirectToEditBusiness(
      businessId,
      "No se encontró el negocio o no tienes permiso.",
    );
  }

  const { data: updatedMedia, error: updateMediaError } = await supabase
    .from("business_media")
    .update({
      url,
      alt_text: altText || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateMediaError || !updatedMedia) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar la imagen: ${
        updateMediaError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Imagen actualizada correctamente.");
}

export async function setBusinessMediaAsCover(
  businessId: string,
  mediaId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar imágenes.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirectToEditBusiness(
      businessId,
      "No se encontró el negocio o no tienes permiso.",
    );
  }

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from("business_media")
    .select("id")
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .single();

  if (existingMediaError || !existingMedia) {
    redirectToEditBusiness(
      businessId,
      "No se encontró la imagen seleccionada.",
    );
  }

  const { error: resetCoverError } = await supabase
    .from("business_media")
    .update({
      type: "gallery",
      is_cover: false,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .neq("id", mediaId);

  if (resetCoverError) {
    redirectToEditBusiness(
      businessId,
      `No se pudo limpiar la portada anterior: ${resetCoverError.message}`,
    );
  }

  const { data: updatedCover, error: updateCoverError } = await supabase
    .from("business_media")
    .update({
      type: "cover",
      is_cover: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateCoverError || !updatedCover) {
    redirectToEditBusiness(
      businessId,
      `No se pudo cambiar la portada: ${
        updateCoverError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Portada actualizada correctamente.");
}

export async function addBusinessMedia(businessId: string, formData: FormData) {
  const url = getFormValue(formData, "url");
  const altText = getFormValue(formData, "alt_text");

  if (!url) {
    redirectToEditBusiness(businessId, "La URL de la imagen es obligatoria.");
  }

  if (!isValidMediaUrl(url)) {
    redirectToEditBusiness(
      businessId,
      "La URL de la imagen debe iniciar con http:// o https://.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para agregar imágenes.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirectToEditBusiness(
      businessId,
      "No se encontró el negocio o no tienes permiso.",
    );
  }

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from("business_media")
    .select("id, sort_order")
    .eq("business_id", businessId);

  if (existingMediaError) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron revisar las imágenes actuales: ${existingMediaError.message}`,
    );
  }

  const mediaCount = existingMedia?.length ?? 0;

  const maxSortOrder = (existingMedia ?? []).reduce(
    (currentMax, media) => Math.max(currentMax, media.sort_order ?? 0),
    0,
  );

  const shouldBeCover = mediaCount === 0;

  const { data: createdMedia, error: insertMediaError } = await supabase
    .from("business_media")
    .insert({
      business_id: businessId,
      type: shouldBeCover ? "cover" : "gallery",
      url,
      alt_text: altText || null,
      is_active: true,
      is_cover: shouldBeCover,
      sort_order: maxSortOrder + 1,
    })
    .select("id")
    .single();

  if (insertMediaError || !createdMedia) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar la imagen: ${
        insertMediaError?.message ?? "sin imagen creada"
      }`,
    );
  }

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Imagen agregada correctamente.");
}

export async function updateBusinessItemDetails(
  businessId: string,
  itemId: string,
  formData: FormData,
) {
  const type = getFormValue(formData, "type");
  const name = getFormValue(formData, "name");
  const description = getFormValue(formData, "description");
  const priceValue = getFormValue(formData, "price").replace(",", ".");
  const currency = getFormValue(formData, "currency") || "MXN";
  const imageUrl = getFormValue(formData, "image_url");
  const imageAlt = getFormValue(formData, "image_alt");
  const sortOrderValue = getFormValue(formData, "sort_order");
  const showPrice = formData.get("show_price") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!isBusinessItemType(type)) {
    redirectToEditBusiness(businessId, "Selecciona un tipo de item válido.");
  }

  if (!name) {
    redirectToEditBusiness(businessId, "El nombre del item es obligatorio.");
  }

  let sortOrder = 0;

  if (sortOrderValue) {
    const numericSortOrder = Number(sortOrderValue);

    if (!Number.isInteger(numericSortOrder) || numericSortOrder < 0) {
      redirectToEditBusiness(
        businessId,
        "El orden debe ser un número entero mayor o igual a cero.",
      );
    }

    sortOrder = numericSortOrder;
  }

  let price: number | null = null;

  if (priceValue) {
    const numericPrice = Number(priceValue);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      redirectToEditBusiness(
        businessId,
        "El precio debe ser un número válido mayor o igual a cero.",
      );
    }

    price = numericPrice;
  }

  if (imageUrl && !isValidMediaUrl(imageUrl)) {
    redirectToEditBusiness(
      businessId,
      "La URL de imagen del item debe iniciar con http:// o https://.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar items.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirectToEditBusiness(
      businessId,
      "No se encontró el negocio o no tienes permiso.",
    );
  }

  const { data: updatedItem, error: updateItemError } = await supabase
    .from("business_items")
    .update({
      type,
      name,
      description: description || null,
      price,
      currency,
      show_price: showPrice,
      is_featured: isFeatured,
      is_active: isActive,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateItemError || !updatedItem) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar el item: ${
        updateItemError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Item actualizado correctamente.");
}

export async function addBusinessItem(businessId: string, formData: FormData) {
  const type = getFormValue(formData, "type");
  const name = getFormValue(formData, "name");
  const description = getFormValue(formData, "description");
  const priceValue = getFormValue(formData, "price").replace(",", ".");
  const currency = getFormValue(formData, "currency") || "MXN";
  const imageUrl = getFormValue(formData, "image_url");
  const imageAlt = getFormValue(formData, "image_alt");

  const showPrice = formData.get("show_price") === "on";
  const isFeatured = formData.get("is_featured") === "on";

  if (!isBusinessItemType(type)) {
    redirectToEditBusiness(businessId, "Selecciona un tipo de item válido.");
  }

  if (!name) {
    redirectToEditBusiness(businessId, "El nombre del item es obligatorio.");
  }

  let price: number | null = null;

  if (priceValue) {
    const numericPrice = Number(priceValue);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      redirectToEditBusiness(
        businessId,
        "El precio debe ser un número válido mayor o igual a cero.",
      );
    }

    price = numericPrice;
  }

  if (imageUrl && !isValidMediaUrl(imageUrl)) {
    redirectToEditBusiness(
      businessId,
      "La URL de imagen del item debe iniciar con http:// o https://.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para agregar items.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirectToEditBusiness(
      businessId,
      "No se encontró el negocio o no tienes permiso.",
    );
  }

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("business_items")
    .select("id, sort_order")
    .eq("business_id", businessId);

  if (existingItemsError) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron revisar los items actuales: ${existingItemsError.message}`,
    );
  }

  const maxSortOrder = (existingItems ?? []).reduce(
    (currentMax, item) => Math.max(currentMax, item.sort_order ?? 0),
    0,
  );

  const { data: createdItem, error: insertItemError } = await supabase
    .from("business_items")
    .insert({
      business_id: businessId,
      type,
      name,
      description: description || null,
      price,
      currency,
      show_price: showPrice,
      is_featured: isFeatured,
      is_active: true,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
      sort_order: maxSortOrder + 1,
    })
    .select("id")
    .single();

  if (insertItemError || !createdItem) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar el item: ${
        insertItemError?.message ?? "sin item creado"
      }`,
    );
  }

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Item agregado correctamente.");
}
```

### app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

```tsx
// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { BusinessContentStyleForm } from "./business-content-style-form";
import { BusinessMediaSection } from "./business-media-section";
import { BusinessItemsSection } from "./business-items-section";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessEditFormProps = {
  business: BusinessEditBusiness;
};

export function BusinessEditForm({ business }: BusinessEditFormProps) {


  return (
    <div className="space-y-8">
      <BusinessContentStyleForm business={business} />

      <BusinessMediaSection business={business} />

      <BusinessItemsSection business={business} />

    </div>
  );
}
```

### app/dashboard/negocios/[businessId]/edit/business-edit-types.ts

```tsx
// app/dashboard/negocios/[businessId]/edit/business-edit-types.ts

export type BusinessMedia = {
  id: string;
  type: string;
  url: string;
  alt_text: string | null;
  is_cover: boolean;
  is_active: boolean;
  sort_order: number;
};

export type BusinessItem = {
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

export type BusinessEditBusiness = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  status: string;
  is_published: boolean;
  visual_mode: string;
  media: BusinessMedia[];
  items: BusinessItem[];
};

export const businessItemTypeOptions = [
  { value: "menu_item", label: "Menú" },
  { value: "product", label: "Producto" },
  { value: "service", label: "Servicio" },
  { value: "package", label: "Paquete" },
  { value: "faq", label: "Pregunta frecuente" },
  { value: "installation", label: "Instalación / amenidad" },
  { value: "rule", label: "Regla" },
  { value: "activity", label: "Actividad" },
  { value: "other", label: "Otro" },
] as const;

export type BusinessItemType =
  (typeof businessItemTypeOptions)[number]["value"];

export const businessItemTypeValues = businessItemTypeOptions.map(
  (option) => option.value,
);

export function isBusinessItemType(value: string): value is BusinessItemType {
  return businessItemTypeValues.includes(value as BusinessItemType);
}

export function formatItemPrice(item: BusinessItem) {
  if (!item.show_price || item.price === null) {
    return "Precio oculto";
  }

  const numericPrice = Number(item.price);

  if (Number.isNaN(numericPrice)) {
    return `${item.price} ${item.currency}`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: item.currency || "MXN",
  }).format(numericPrice);
}

```

### app/dashboard/negocios/[businessId]/edit/business-content-style-form.tsx

```tsx
// app/dashboard/negocios/[businessId]/edit/business-content-style-form.tsx

import { landingVisualModeOptions } from "@/lib/landing/styles";
import { updateBusinessLanding } from "./actions";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessContentStyleFormProps = {
  business: BusinessEditBusiness;
};

export function BusinessContentStyleForm({
  business,
}: BusinessContentStyleFormProps) {
  const updateBusinessLandingWithId = updateBusinessLanding.bind(
    null,
    business.id,
  );

  return (
    <form action={updateBusinessLandingWithId} className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">
          Contenido de la landing
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Esta información alimenta la página pública del negocio.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-800"
            >
              Nombre del negocio
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={business.name}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="short_description"
              className="block text-sm font-semibold text-gray-800"
            >
              Descripción corta
            </label>

            <textarea
              id="short_description"
              name="short_description"
              required
              rows={3}
              defaultValue={business.short_description}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="long_description"
              className="block text-sm font-semibold text-gray-800"
            >
              Descripción larga
            </label>

            <textarea
              id="long_description"
              name="long_description"
              rows={5}
              defaultValue={business.long_description ?? ""}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">Estilo visual</h2>

        <p className="mt-2 text-sm text-gray-600">
          Elige cómo se verá la landing pública. Esta sección va debajo del
          contenido porque primero se edita la información y después se decide
          cómo presentarla.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {landingVisualModeOptions.map((mode) => (
            <label
              key={mode.key}
              className="cursor-pointer rounded-2xl border border-gray-200 p-4 transition hover:border-orange-300 hover:bg-orange-50"
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="visual_mode"
                  value={mode.key}
                  defaultChecked={business.visual_mode === mode.key}
                  className="mt-1"
                />

                <span>
                  <span className="block font-bold text-gray-950">
                    {mode.name}
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-gray-600">
                    {mode.description}
                  </span>
                </span>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Guardar contenido y estilo
        </button>

        {business.is_published ? (
          <a
            href={`/negocio/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Ver página pública
          </a>
        ) : null}
      </div>
    </form>
  );
}

```

### app/dashboard/negocios/[businessId]/edit/business-media-section.tsx

```tsx
// app/dashboard/negocios/[businessId]/edit/business-media-section.tsx

import {
  addBusinessMedia,
  setBusinessMediaAsCover,
  updateBusinessMediaDetails,
} from "./actions";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessMediaSectionProps = {
  business: BusinessEditBusiness;
};

export function BusinessMediaSection({ business }: BusinessMediaSectionProps) {
  const addBusinessMediaWithId = addBusinessMedia.bind(null, business.id);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-950">Imágenes actuales</h2>

      <p className="mt-2 text-sm text-gray-600">
        Edita las URLs de imágenes, el texto alternativo y cuál imagen se usa
        como portada.
      </p>

      <form
        action={addBusinessMediaWithId}
        className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5"
      >
        <h3 className="text-lg font-bold text-gray-950">
          Agregar nueva imagen
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          Pega una URL pública de imagen. Si el negocio no tiene imágenes, se
          usará como portada automáticamente.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="new-media-url"
              className="block text-sm font-semibold text-gray-800"
            >
              URL de imagen
            </label>

            <input
              id="new-media-url"
              name="url"
              type="url"
              required
              placeholder="https://..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="new-media-alt"
              className="block text-sm font-semibold text-gray-800"
            >
              Texto alternativo
            </label>

            <input
              id="new-media-alt"
              name="alt_text"
              type="text"
              placeholder="Ej. Fachada del negocio"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Agregar imagen
        </button>
      </form>

      {business.media.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {business.media.map((media) => {
            const updateMediaDetailsWithIds = updateBusinessMediaDetails.bind(
              null,
              business.id,
              media.id,
            );

            const setMediaAsCoverWithIds = setBusinessMediaAsCover.bind(
              null,
              business.id,
              media.id,
            );

            return (
              <article
                key={media.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt={media.alt_text ?? business.name}
                  className="h-48 w-full object-cover"
                />

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Tipo: {media.type}
                    </span>

                    {media.is_cover ? (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                        Portada actual
                      </span>
                    ) : null}

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      {media.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <form
                    action={updateMediaDetailsWithIds}
                    className="space-y-3"
                  >
                    <div>
                      <label
                        htmlFor={`media-url-${media.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        URL de imagen
                      </label>

                      <input
                        id={`media-url-${media.id}`}
                        name="url"
                        type="url"
                        required
                        defaultValue={media.url}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`media-alt-${media.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Texto alternativo
                      </label>

                      <input
                        id={`media-alt-${media.id}`}
                        name="alt_text"
                        type="text"
                        defaultValue={media.alt_text ?? ""}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={media.is_active}
                      />
                      Imagen activa
                    </label>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Guardar imagen
                    </button>
                  </form>

                  {!media.is_cover ? (
                    <form action={setMediaAsCoverWithIds}>
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
                      >
                        Usar como portada
                      </button>
                    </form>
                  ) : (
                    <p className="rounded-lg bg-orange-50 px-4 py-2 text-center text-sm font-semibold text-orange-800">
                      Esta imagen es la portada actual.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene imágenes registradas.
        </div>
      )}
    </section>
  );
}

```

### app/dashboard/negocios/[businessId]/edit/business-items-section.tsx

```tsx
// app/dashboard/negocios/[businessId]/edit/business-items-section.tsx

import {
  addBusinessItem,
  updateBusinessItemDetails,
} from "./actions";
import {
  businessItemTypeOptions,
  formatItemPrice,
  type BusinessEditBusiness,
} from "./business-edit-types";

type BusinessItemsSectionProps = {
  business: BusinessEditBusiness;
};

export function BusinessItemsSection({ business }: BusinessItemsSectionProps) {
  const addBusinessItemWithId = addBusinessItem.bind(null, business.id);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/70 to-white shadow-sm">
      <div className="border-b border-orange-100 bg-white/80 p-6">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
          Oferta del negocio
        </p>

        <h2 className="mt-2 text-2xl font-black text-gray-950">
          Menú y destacados
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Aquí se controla lo que el cliente verá como productos, servicios,
          paquetes, reglas, amenidades o elementos destacados en la landing
          pública.
        </p>
      </div>

      <form
        action={addBusinessItemWithId}
        className="border-b border-orange-100 bg-orange-50/60 p-6"
      >
        <div className="rounded-[1.5rem] border border-orange-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
                Nuevo elemento
              </p>

              <h3 className="mt-1 text-xl font-black text-gray-950">
                Agregar al menú o destacados
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Puedes agregar productos, servicios, paquetes, actividades,
                amenidades o reglas del negocio.
              </p>
            </div>

            <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
              Activo por defecto
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="new-item-type"
                className="block text-sm font-bold text-gray-800"
              >
                Tipo
              </label>

              <select
                id="new-item-type"
                name="type"
                defaultValue="product"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                {businessItemTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-item-name"
                className="block text-sm font-bold text-gray-800"
              >
                Nombre
              </label>

              <input
                id="new-item-name"
                name="name"
                type="text"
                required
                placeholder="Ej. Combo familiar"
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="new-item-description"
              className="block text-sm font-bold text-gray-800"
            >
              Descripción
            </label>

            <textarea
              id="new-item-description"
              name="description"
              rows={3}
              placeholder="Describe brevemente este producto o servicio."
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="new-item-price"
                className="block text-sm font-bold text-gray-800"
              >
                Precio
              </label>

              <input
                id="new-item-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="new-item-currency"
                className="block text-sm font-bold text-gray-800"
              >
                Moneda
              </label>

              <input
                id="new-item-currency"
                name="currency"
                type="text"
                defaultValue="MXN"
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm uppercase text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="new-item-image-url"
                className="block text-sm font-bold text-gray-800"
              >
                URL de imagen
              </label>

              <input
                id="new-item-image-url"
                name="image_url"
                type="url"
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="new-item-image-alt"
                className="block text-sm font-bold text-gray-800"
              >
                Texto alternativo de imagen
              </label>

              <input
                id="new-item-image-alt"
                name="image_alt"
                type="text"
                placeholder="Ej. Producto en mostrador"
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" name="show_price" defaultChecked />
              Mostrar precio
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" name="is_featured" />
              Destacado
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-600 to-gray-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Agregar item
          </button>
        </div>
      </form>

      {business.items.length > 0 ? (
        <div className="grid gap-5 p-6 lg:grid-cols-2">
          {business.items.map((item) => {
            const updateBusinessItemWithIds = updateBusinessItemDetails.bind(
              null,
              business.id,
              item.id,
            );

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-800 to-orange-900">
                  {item.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.image_alt ?? item.name}
                        className="h-full w-full object-cover opacity-90 transition duration-500 hover:scale-105"
                      />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center">
                      <div>
                        <p className="text-4xl">⭐</p>

                        <p className="mt-3 text-sm font-semibold text-white/80">
                          Sin imagen registrada
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow">
                      Orden {item.sort_order}
                    </span>

                    {item.is_featured ? (
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow">
                        Destacado
                      </span>
                    ) : null}

                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-950 shadow">
                      {item.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/55 p-4 text-white backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                      {item.type}
                    </p>

                    <h3 className="mt-1 text-xl font-black">{item.name}</h3>

                    <p className="mt-1 text-sm font-semibold text-white/90">
                      {formatItemPrice(item)}
                    </p>
                  </div>
                </div>

                <form
                  action={updateBusinessItemWithIds}
                  className="space-y-4 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`item-type-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Tipo
                      </label>

                      <select
                        id={`item-type-${item.id}`}
                        name="type"
                        defaultValue={item.type}
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        {businessItemTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`item-name-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Nombre
                      </label>

                      <input
                        id={`item-name-${item.id}`}
                        name="name"
                        type="text"
                        required
                        defaultValue={item.name}
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`item-description-${item.id}`}
                      className="block text-sm font-bold text-gray-800"
                    >
                      Descripción
                    </label>

                    <textarea
                      id={`item-description-${item.id}`}
                      name="description"
                      rows={3}
                      defaultValue={item.description ?? ""}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`item-price-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Precio
                      </label>

                      <input
                        id={`item-price-${item.id}`}
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.price ?? ""}
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`item-currency-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Moneda
                      </label>

                      <input
                        id={`item-currency-${item.id}`}
                        name="currency"
                        type="text"
                        defaultValue={item.currency || "MXN"}
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm uppercase text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`item-sort-order-${item.id}`}
                      className="block text-sm font-bold text-gray-800"
                    >
                      Orden de aparición
                    </label>

                    <input
                      id={`item-sort-order-${item.id}`}
                      name="sort_order"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={item.sort_order}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      Menor número aparece primero. Ejemplo: 1, 2, 3.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor={`item-image-url-${item.id}`}
                      className="block text-sm font-bold text-gray-800"
                    >
                      URL de imagen
                    </label>

                    <input
                      id={`item-image-url-${item.id}`}
                      name="image_url"
                      type="url"
                      defaultValue={item.image_url ?? ""}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`item-image-alt-${item.id}`}
                      className="block text-sm font-bold text-gray-800"
                    >
                      Texto alternativo de imagen
                    </label>

                    <input
                      id={`item-image-alt-${item.id}`}
                      name="image_alt"
                      type="text"
                      defaultValue={item.image_alt ?? ""}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="show_price"
                        defaultChecked={item.show_price}
                      />
                      Mostrar precio
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_featured"
                        defaultChecked={item.is_featured}
                      />
                      Destacado
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={item.is_active}
                      />
                      Activo
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-gray-950 to-orange-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Guardar item
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-6">
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-6 text-sm text-gray-600">
            Este negocio todavía no tiene items registrados.
          </div>
        </div>
      )}
    </section>
  );
}

```

### app/negocio/[slug]/page.tsx

```tsx
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
} from "@/lib/landing/styles/types";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
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

  const locations: PublicLandingLocation[] = (row.business_locations ?? []).map(
    (location) => ({
      id: location.id,
      locationType: location.location_type,
      addressText: location.address_text,
      neighborhood: location.neighborhood,
      referenceNotes: location.reference_notes,
      serviceAreaText: location.service_area_text,
      mapUrl: location.map_url,
    }),
  );

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
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("name, short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_published", true)
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
  const { slug } = await params;
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
        map_url
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
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_published", true)
    .eq("contact_methods.is_active", true)
    .eq("business_media.is_active", true)
    .eq("business_items.is_active", true)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const landingData = mapBusinessToLandingData(
    data as unknown as BusinessQueryRow,
  );

  return <PublicBusinessLanding data={landingData} />;
}
```

### components/landing/public-business-landing.tsx

```tsx
// components/landing/public-business-landing.tsx

/* eslint-disable @next/next/no-img-element */

import { ContactHub } from "./contact-hub";
import {
  getContactIcon,
  getExternalLinkProps,
} from "@/lib/landing/contact";
import { getLandingStyles } from "@/lib/landing/styles";
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
              <span className={styles.brandIcon}>
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
              <a
                href={primaryContact.href}
                className={styles.buttonPrimary}
                {...getExternalLinkProps(primaryContact.href)}
              >
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
                <a
                  href={primaryContact.href}
                  className={styles.buttonPrimary}
                  {...getExternalLinkProps(primaryContact.href)}
                >
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
              <div className={styles.heroPlaceholder}>
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
            {(galleryPhotos.length > 0 ? galleryPhotos : data.photos).length > 0 ? (
              (galleryPhotos.length > 0 ? galleryPhotos : data.photos).map((photo) => (
                <figure key={photo.id} className={styles.galleryCard}>
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-72 w-full object-cover transition duration-500 hover:scale-105"
                  />
                </figure>
              ))
            ) : (
              <article className={styles.card}>
                <p className={styles.mutedText}>
                  Este negocio todavía no tiene fotos adicionales registradas.
                </p>
              </article>
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
              {data.hours.length > 0 ? (
                data.hours.map((hour) => (
                  <div
                    key={hour.id}
                    className={`flex justify-between gap-4 border-b pb-3 text-sm ${styles.divider}`}
                  >
                    <span className={`${styles.heading} font-semibold`}>
                      {hour.label || dayNames[hour.dayOfWeek]}
                    </span>

                    <span className={styles.mutedText}>{formatHour(hour)}</span>
                  </div>
                ))
              ) : (
                <p className={styles.mutedText}>
                  Este negocio todavía no tiene horarios registrados.
                </p>
              )}
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
              {data.contacts.length > 0 ? (
                data.contacts.map((contact) => (
                  <a
                    key={contact.id}
                    href={contact.href}
                    className={`${styles.card} transition hover:-translate-y-1`}
                    {...getExternalLinkProps(contact.href)}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {getContactIcon(contact.type)}
                    </span>

                    <p className={`${styles.heading} mt-3 font-bold`}>
                      {contact.label}
                    </p>

                    <p className={`${styles.mutedText} text-sm`}>{contact.value}</p>
                  </a>
                ))
              ) : (
                <article className={styles.card}>
                  <p className={styles.mutedText}>
                    Este negocio todavía no tiene contactos públicos registrados.
                  </p>
                </article>
              )}

              {mainLocation?.mapUrl ? (
                <a
                  href={mainLocation.mapUrl}
                  className={`${styles.card} transition hover:-translate-y-1`}
                  {...getExternalLinkProps(mainLocation.mapUrl)}
                >
                  <span className="text-2xl" aria-hidden="true">
                    📍
                  </span>

                  <p className={`${styles.heading} mt-3 font-bold`}>Ver ubicación</p>

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
```

### components/landing/contact-hub.tsx

```tsx
"use client";

import {
  getContactIcon,
  getExternalLinkProps,
} from "@/lib/landing/contact";
import type { PublicLandingContact } from "@/lib/landing/styles/types";
import type { LandingStyles } from "@/lib/landing/styles";
import { useState } from "react";

type ContactHubProps = {
  contacts: PublicLandingContact[];
  styles: LandingStyles["contactHub"];
};

const CONTACT_HUB_PANEL_ID = "landing-contact-hub-panel";

export function ContactHub({ contacts, styles }: ContactHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (contacts.length === 0) {
    return null;
  }

  return (
    <aside className={styles.wrapper} aria-label="Opciones de contacto">
      {isOpen ? (
        <div id={CONTACT_HUB_PANEL_ID} className={styles.panel}>
          {contacts.map((contact) => (
            <a
              key={contact.id}
              href={contact.href}
              className={styles.item}
              {...getExternalLinkProps(contact.href)}
            >
              <span aria-hidden="true">{getContactIcon(contact.type)}</span>

              <span>
                <span className="block text-sm font-bold">
                  {contact.label}
                </span>

                <span className="block text-xs opacity-70">
                  {contact.value}
                </span>
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.button}
        aria-expanded={isOpen}
        aria-controls={CONTACT_HUB_PANEL_ID}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        {isOpen ? "Cerrar contacto" : "Contactar ahora"}
      </button>
    </aside>
  );
}
```

### lib/landing/contact.ts

```tsx
// lib/landing/contact.ts

export function getContactIcon(type: string) {
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

export function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

type ExternalLinkProps = {
  target?: "_blank";
  rel?: "noopener noreferrer";
};

export function getExternalLinkProps(href: string): ExternalLinkProps {
  if (!isExternalHref(href)) {
    return {};
  }

  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}
```

### lib/landing/business-settings.ts

```tsx
// lib/landing/business-settings.ts

import {
  normalizeLandingVisualMode,
  type LandingVisualMode,
} from "@/lib/landing/styles";

export type BusinessSettingsRelation =
  | {
      visual_mode: string | null;
    }
  | {
      visual_mode: string | null;
    }[]
  | null
  | undefined;

export function getBusinessVisualMode(
  settings: BusinessSettingsRelation,
): LandingVisualMode {
  if (Array.isArray(settings)) {
    return normalizeLandingVisualMode(settings[0]?.visual_mode);
  }

  return normalizeLandingVisualMode(settings?.visual_mode);
}
```

### lib/landing/styles/types.ts

```tsx
// lib/landing/styles/types.ts

//import type { LandingVisualMode } from "@/lib/landing/styles/types.tsx";

export type PublicLandingContact = {
  id: string;
  type: string;
  label: string;
  value: string;
  href: string;
  isPrimary: boolean;
};

export type PublicLandingPhoto = {
  id: string;
  type: string;
  src: string;
  alt: string;
  isCover: boolean;
};

export type PublicLandingHour = {
  id: string;
  dayOfWeek: number;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  notes: string | null;
};

export type PublicLandingItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  showPrice: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type PublicLandingLocation = {
  id: string;
  locationType: string;
  addressText: string | null;
  neighborhood: string | null;
  referenceNotes: string | null;
  serviceAreaText: string | null;
  mapUrl: string | null;
};

export type PublicLandingData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  category: string;
  businessType: string;
  visualMode: LandingVisualMode;
  contacts: PublicLandingContact[];
  photos: PublicLandingPhoto[];
  hours: PublicLandingHour[];
  locations: PublicLandingLocation[];
  items: PublicLandingItem[];
  tags: string[];
};

export type LandingVisualMode =
  | "classic"
  | "modern"
  | "warm"
  | "compact"
  | "elegant"
  | "impact";

export type LandingStyles = {
  page: string;
  background: string;
  container: string;
  nav: string;
  navPill: string;
  brandIcon: string;
  badge: string;
  heading: string;
  text: string;
  mutedText: string;
  sectionLabel: string;
  heroGrid: string;
  heroImageCard: string;
  heroImage: string;
  heroPlaceholder: string;
  heroOverlay: string;
  card: string;
  featuredCard: string;
  galleryCard: string;
  buttonPrimary: string;
  buttonSecondary: string;
  tag: string;
  price: string;
  divider: string;
  contactHub: {
    wrapper: string;
    panel: string;
    item: string;
    button: string;
  };
};
```

### lib/landing/styles/index.ts

```tsx
// lib/landing/styles/index.ts

import { classicStyles } from "./classic";
import { compactStyles } from "./compact";
import { elegantStyles } from "./elegant";
import { impactStyles } from "./impact";
import { modernStyles } from "./modern";
import type { LandingStyles, LandingVisualMode } from "./types";
import { warmStyles } from "./warm";

export const landingVisualModes = [
  "classic",
  "modern",
  "warm",
  "compact",
  "elegant",
  "impact",
] as const satisfies readonly LandingVisualMode[];

export const landingVisualModeOptions: {
  key: LandingVisualMode;
  name: string;
  description: string;
}[] = [
  {
    key: "modern",
    name: "Modern",
    description: "Oscuro, llamativo, con alto contraste y estética actual.",
  },
  {
    key: "classic",
    name: "Classic",
    description: "Tradicional, claro, ordenado y fácil de leer.",
  },
  {
    key: "warm",
    name: "Warm",
    description:
      "Cálido, cercano, ideal para comida, eventos o negocios familiares.",
  },
  {
    key: "compact",
    name: "Compact",
    description:
      "Simple, directo y funcional para servicios técnicos o listados rápidos.",
  },
  {
    key: "elegant",
    name: "Elegant",
    description: "Sobrio, profesional y premium para servicios formales.",
  },
  {
    key: "impact",
    name: "Impact",
    description:
      "Fuerte, promocional y visualmente agresivo para eventos o anuncios.",
  },
];

export const landingStylesByMode: Record<LandingVisualMode, LandingStyles> = {
  classic: classicStyles,
  modern: modernStyles,
  warm: warmStyles,
  compact: compactStyles,
  elegant: elegantStyles,
  impact: impactStyles,
};

export function isLandingVisualMode(
  mode: string | null | undefined,
): mode is LandingVisualMode {
  if (!mode) {
    return false;
  }

  return landingVisualModes.includes(mode as LandingVisualMode);
}

export function normalizeLandingVisualMode(
  mode?: string | null,
): LandingVisualMode {
  return isLandingVisualMode(mode) ? mode : "modern";
}

export function getLandingStyles(mode?: string | null) {
  return landingStylesByMode[normalizeLandingVisualMode(mode)];
}

export type { LandingStyles, LandingVisualMode };
```

### lib/landing/styles/classic.ts

```tsx
// lib/landing/styles/classic.ts

import type { LandingStyles } from "./types";

export const classicStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#f8f1e7] text-[#21170f]",
  background:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f8f1e7,#fffaf3)]",
  container: "relative mx-auto max-w-7xl px-5 py-6 sm:px-8",
  nav: "sticky top-4 z-40 rounded-2xl border border-[#dfcdb4] bg-[#fffaf3]/90 px-5 py-3 text-[#21170f] shadow-sm backdrop-blur",
  navPill:
    "rounded-xl px-3 py-1.5 text-sm text-[#6d5945] transition hover:bg-[#efe1cf] hover:text-[#21170f]",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-[#21170f] text-lg text-white",
  badge:
    "inline-flex w-fit rounded-full border border-[#d6b98e] bg-[#f3e2c9] px-4 py-2 text-sm font-semibold text-[#7c4f1d]",
  heading: "text-[#1d130b]",
  text: "text-[#3f3022]",
  mutedText: "text-[#716252]",
  sectionLabel: "text-[#9a641f]",
  heroGrid:
    "grid min-h-[72vh] items-center gap-10 py-14 lg:grid-cols-[1fr_0.9fr]",
  heroImageCard:
    "relative rounded-[1.5rem] border border-[#d8c3a3] bg-[#efe1cf] p-3 shadow-xl shadow-[#5c3b14]/10",
  heroImage: "h-[500px] w-full rounded-[1rem] object-cover",
  heroPlaceholder:
  "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-[#d6b98e] bg-[#fff7ed] p-8 text-center",
  heroOverlay:
    "absolute bottom-6 left-6 right-6 rounded-2xl bg-[#21170f]/85 p-5 text-white",
  card: "rounded-2xl border border-[#dfcdb4] bg-white/80 p-6 shadow-sm",
  featuredCard:
    "rounded-2xl border border-[#d6b98e] bg-[#fffaf3] p-5 shadow-md shadow-[#5c3b14]/5",
  galleryCard:
    "overflow-hidden rounded-2xl border border-[#dfcdb4] bg-white shadow-sm",
  buttonPrimary:
    "rounded-full bg-[#21170f] px-7 py-4 text-center font-bold text-white transition hover:bg-[#7c4f1d]",
  buttonSecondary:
    "rounded-full border border-[#21170f] bg-transparent px-7 py-4 text-center font-bold text-[#21170f] transition hover:bg-[#21170f] hover:text-white",
  tag: "rounded-full border border-[#d6b98e] bg-white/70 px-3 py-1 text-xs font-medium text-[#7c4f1d]",
  price: "text-[#9a641f]",
  divider: "border-[#dfcdb4]",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-2xl border border-[#dfcdb4] bg-[#fffaf3]/95 p-3 shadow-xl backdrop-blur",
    item: "flex items-center gap-3 rounded-xl px-3 py-3 text-[#21170f] transition hover:bg-[#efe1cf]",
    button:
      "rounded-full bg-[#21170f] px-5 py-4 font-semibold text-white shadow-xl transition hover:scale-105",
  },
};
```

### lib/landing/styles/modern.ts

```tsx
// lib/landing/styles/modern.ts

import type { LandingStyles } from "./types";

export const modernStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#080605] text-orange-50",
  background:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_34%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.20),transparent_28%),linear-gradient(180deg,#080605,#140d09)]",
  container: "relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8",
  nav: "sticky top-4 z-40 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-orange-50 shadow-2xl shadow-black/30 backdrop-blur-xl",
  navPill:
    "rounded-full px-3 py-1.5 text-sm text-orange-100/75 transition hover:bg-white/10 hover:text-white",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-orange-500 text-lg text-white shadow-lg shadow-orange-950/40",
  badge:
    "inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200",
  heading: "text-white",
  text: "text-orange-50/90",
  mutedText: "text-orange-100/60",
  sectionLabel: "text-orange-300",
  heroGrid:
    "grid min-h-[78vh] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]",
  heroImageCard:
    "relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl",
  heroImage: "h-[520px] w-full rounded-[1.5rem] object-cover",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-orange-400/30 bg-white/5 p-8 text-center",
  heroOverlay:
    "absolute bottom-7 left-7 right-7 rounded-3xl border border-white/15 bg-black/45 p-5 text-white backdrop-blur-xl",
  card: "rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/25 backdrop-blur-xl",
  featuredCard:
    "rounded-[2rem] border border-orange-400/30 bg-gradient-to-br from-orange-500/15 via-white/[0.06] to-red-500/10 p-5 shadow-2xl shadow-black/30",
  galleryCard:
    "overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-xl shadow-black/25",
  buttonPrimary:
    "rounded-full bg-orange-500 px-7 py-4 text-center font-bold text-white shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400",
  buttonSecondary:
    "rounded-full border border-white/15 bg-white/[0.06] px-7 py-4 text-center font-bold text-orange-50 transition hover:-translate-y-0.5 hover:bg-white/[0.12]",
  tag: "rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-100",
  price: "text-orange-300",
  divider: "border-white/10",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-white/10 bg-[#130d09]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-orange-50 transition hover:bg-white/10",
    button:
      "rounded-full bg-orange-500 px-5 py-4 font-semibold text-white shadow-2xl shadow-orange-950/50 transition hover:scale-105 hover:bg-orange-400",
  },
};
```

### lib/landing/styles/warm.ts

```tsx
// lib/landing/styles/warm.ts

import type { LandingStyles } from "./types";

export const warmStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#fff7ed] text-[#431407]",
  background:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.35),transparent_34%),linear-gradient(180deg,#fff7ed,#fffbeb)]",
  container: "relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8",
  nav: "sticky top-4 z-40 rounded-full border border-orange-200 bg-white/75 px-5 py-3 text-stone-900 shadow-sm shadow-orange-900/5 backdrop-blur-xl",
  navPill:
    "rounded-full px-3 py-1.5 text-sm text-stone-700 transition hover:bg-orange-100 hover:text-orange-700",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-orange-600 text-lg text-white shadow-lg shadow-orange-900/20",
  badge:
    "inline-flex w-fit rounded-full border border-orange-200 bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800",
  heading: "text-stone-950",
  text: "text-stone-800",
  mutedText: "text-stone-600",
  sectionLabel: "text-orange-700",
  heroGrid:
    "grid min-h-[76vh] items-center gap-10 py-16 lg:grid-cols-[1fr_1fr]",
  heroImageCard:
    "relative rounded-[2rem] border border-orange-200 bg-white/80 p-3 shadow-2xl shadow-orange-900/10 backdrop-blur-xl",
  heroImage: "h-[520px] w-full rounded-[1.5rem] object-cover",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-orange-300 bg-orange-50 p-8 text-center",
  heroOverlay:
    "absolute bottom-7 left-7 right-7 rounded-3xl bg-orange-950/80 p-5 text-white backdrop-blur",
  card: "rounded-[2rem] border border-orange-200 bg-white/75 p-6 shadow-lg shadow-orange-900/5 backdrop-blur-xl",
  featuredCard:
    "rounded-[2rem] border border-orange-300 bg-gradient-to-br from-orange-100 via-white to-amber-50 p-5 shadow-xl shadow-orange-900/10",
  galleryCard:
    "overflow-hidden rounded-[2rem] border border-orange-200 bg-white/75 shadow-lg shadow-orange-900/5",
  buttonPrimary:
    "rounded-full bg-stone-950 px-7 py-4 text-center font-bold text-white shadow-lg shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-700",
  buttonSecondary:
    "rounded-full border border-orange-300 bg-white/70 px-7 py-4 text-center font-bold text-stone-900 transition hover:-translate-y-0.5 hover:bg-orange-100",
  tag: "rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800",
  price: "text-orange-700",
  divider: "border-orange-200",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-orange-200 bg-white/95 p-3 shadow-2xl shadow-orange-900/20 backdrop-blur-xl",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-stone-800 transition hover:bg-orange-100",
    button:
      "rounded-full bg-stone-950 px-5 py-4 font-semibold text-white shadow-2xl shadow-orange-900/30 transition hover:scale-105",
  },
};
```

### lib/landing/styles/compact.ts

```tsx
// lib/landing/styles/compact.ts

import type { LandingStyles } from "./types";

export const compactStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-slate-50 text-slate-950",
  background: "pointer-events-none absolute inset-0 bg-slate-50",
  container: "relative mx-auto max-w-5xl px-4 py-4 sm:px-6",
  nav: "sticky top-3 z-40 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-950 shadow-sm",
  navPill:
    "rounded-lg px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-lg text-white",
  badge:
    "inline-flex w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700",
  heading: "text-slate-950",
  text: "text-slate-700",
  mutedText: "text-slate-500",
  sectionLabel: "text-slate-500",
  heroGrid:
    "grid min-h-[58vh] items-center gap-6 py-10 lg:grid-cols-[1fr_0.8fr]",
  heroImageCard:
    "relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm",
  heroImage: "h-[360px] w-full rounded-xl object-cover",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center",
  heroOverlay:
    "absolute bottom-4 left-4 right-4 rounded-xl bg-slate-950/80 p-4 text-white",
  card: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
  featuredCard:
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
  galleryCard:
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
  buttonPrimary:
    "rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800",
  buttonSecondary:
    "rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-slate-100",
  tag: "rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  price: "text-slate-950",
  divider: "border-slate-200",
  contactHub: {
    wrapper: "fixed bottom-4 right-4 z-50",
    panel:
      "mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl",
    item: "flex items-center gap-3 rounded-xl px-3 py-2 text-slate-800 transition hover:bg-slate-100",
    button:
      "rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105",
  },
};
```

### lib/landing/styles/elegant.ts

```tsx
// lib/landing/styles/elegant.ts

import type { LandingStyles } from "./types";

export const elegantStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-[#f5f1ea] text-[#151515]",
  background:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f5f1ea,#ffffff)]",
  container: "relative mx-auto max-w-7xl px-6 py-8 md:px-10",
  nav: "sticky top-4 z-40 rounded-none border-b border-[#d8c9b3] bg-[#f5f1ea]/90 px-0 py-4 text-[#151515] backdrop-blur",
  navPill:
    "px-3 py-1.5 text-sm text-[#6b6358] transition hover:text-[#9a7437]",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-[#151515] text-lg text-white shadow-sm",
  badge:
    "inline-flex w-fit border-b border-[#9a7437] px-0 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#9a7437]",
  heading: "text-[#151515]",
  text: "text-[#312a22]",
  mutedText: "text-[#6b6358]",
  sectionLabel: "text-[#9a7437]",
  heroGrid:
    "grid min-h-[72vh] items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr]",
  heroImageCard:
    "relative overflow-hidden rounded-[2rem] border border-[#d8c9b3] bg-[#e7ded0] shadow-xl",
  heroImage: "h-[520px] w-full object-cover",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center",
  heroOverlay:
    "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white",
  card: "rounded-3xl border border-[#ded6ca] bg-white/80 p-6 shadow-sm",
  featuredCard:
    "rounded-3xl border border-[#ded6ca] bg-[#faf7f1] p-6 shadow-sm",
  galleryCard:
    "overflow-hidden rounded-3xl border border-[#d8c9b3] bg-[#e7ded0] shadow-sm",
  buttonPrimary:
    "rounded-full bg-[#151515] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#9a7437]",
  buttonSecondary:
    "rounded-full border border-[#151515] px-7 py-4 text-center font-semibold text-[#151515] transition hover:bg-[#151515] hover:text-white",
  tag: "rounded-full border border-[#d7c7ad] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5840]",
  price: "text-[#9a7437]",
  divider: "border-[#ded6ca]",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-[#ded6ca] bg-white/95 p-3 shadow-2xl backdrop-blur",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-[#151515] transition hover:bg-[#faf7f1]",
    button:
      "rounded-full bg-[#151515] px-5 py-4 font-semibold text-white shadow-2xl transition hover:scale-105",
  },
};
```

### lib/landing/styles/impact.ts

```tsx
// lib/landing/styles/impact.ts

import type { LandingStyles } from "./types";

export const impactStyles: LandingStyles = {
  page: "min-h-screen overflow-hidden bg-black text-white",
  background:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.38),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.25),transparent_28%),linear-gradient(180deg,#000000,#111111)]",
  container: "relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8",
  nav: "sticky top-4 z-40 rounded-full border border-white/15 bg-black/70 px-5 py-3 text-white shadow-2xl backdrop-blur-xl",
  navPill:
    "rounded-full px-3 py-1.5 text-sm text-white/70 transition hover:bg-white hover:text-black",
  brandIcon:
    "grid h-10 w-10 place-items-center rounded-full bg-rose-500 text-lg text-white shadow-lg shadow-rose-950/40",
  badge:
    "inline-flex w-fit rounded-full bg-rose-500 px-4 py-2 text-sm font-black uppercase tracking-wide text-white",
  heading: "text-white",
  text: "text-white/85",
  mutedText: "text-white/60",
  sectionLabel: "text-yellow-300",
  heroGrid:
    "grid min-h-[80vh] items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr]",
  heroImageCard:
    "relative rounded-[2.5rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-rose-950/40",
  heroImage: "h-[540px] w-full rounded-[2rem] object-cover contrast-110 saturate-125",
  heroPlaceholder:
    "grid h-[420px] place-items-center rounded-[1.5rem] border border-dashed border-rose-300/60 bg-rose-950/20 p-8 text-center",
  heroOverlay:
    "absolute bottom-7 left-7 right-7 rounded-[2rem] bg-black/70 p-5 text-white backdrop-blur-xl",
  card: "rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30",
  featuredCard:
    "rounded-[2rem] border border-rose-400/40 bg-gradient-to-br from-rose-500/25 to-yellow-400/10 p-5 shadow-2xl shadow-rose-950/30",
  galleryCard:
    "overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl shadow-black/30",
  buttonPrimary:
    "rounded-full bg-rose-500 px-7 py-4 text-center font-black uppercase tracking-wide text-white shadow-2xl shadow-rose-950/50 transition hover:-translate-y-1 hover:bg-yellow-400 hover:text-black",
  buttonSecondary:
    "rounded-full border border-white/20 bg-white/10 px-7 py-4 text-center font-black uppercase tracking-wide text-white transition hover:-translate-y-1 hover:bg-white hover:text-black",
  tag: "rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white",
  price: "text-yellow-300",
  divider: "border-white/15",
  contactHub: {
    wrapper: "fixed bottom-5 right-5 z-50",
    panel:
      "mb-3 w-72 rounded-3xl border border-white/15 bg-black/90 p-3 shadow-2xl shadow-rose-950/40 backdrop-blur-xl",
    item: "flex items-center gap-3 rounded-2xl px-3 py-3 text-white transition hover:bg-white/10",
    button:
      "rounded-full bg-rose-500 px-5 py-4 font-black text-white shadow-2xl shadow-rose-950/50 transition hover:scale-105 hover:bg-yellow-400 hover:text-black",
  },
};
```

### lib/supabase/client.ts

```tsx
// lib/supabase/client.ts

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 *
 * Úsalo en componentes con "use client".
 * Ejemplo futuro:
 * - formularios
 * - botones de login/logout
 * - interacciones del usuario en el browser
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

### lib/supabase/server.ts

```tsx
// lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el servidor.
 *
 * Úsalo en:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * Este cliente usa cookies para leer la sesión del usuario.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /**
             * En algunos Server Components las cookies pueden ser de solo lectura.
             * Este catch evita que la página truene por eso.
             */
          }
        },
      },
    },
  );
}
```

### lib/supabase/proxy.ts

```tsx
// lib/supabase/proxy.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/sign-up");

  const isProtectedPage = pathname.startsWith("/dashboard");

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone();

    url.pathname = "/auth/login";
    url.searchParams.set("message", "Inicia sesión para continuar.");

    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### proxy.ts

```tsx
// proxy.ts

import { updateSession } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ejecuta proxy en rutas normales, pero evita assets internos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### app/layout.tsx

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sabinapp",
  description: "Directorio local de negocios de Sabinas Hidalgo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

### app/globals.css

```tsx
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: Arial, Helvetica, sans-serif;
  --font-mono: "Courier New", Consolas, monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

```
