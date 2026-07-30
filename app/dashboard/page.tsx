// app/dashboard/page.tsx

import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

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

          <p className="mt-2 max-w-2xl text-gray-600">
            Administra tus negocios, revisa su estado y actualiza la información
            que aparece en sus páginas públicas.
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
              <dt className="font-medium text-gray-500">Estado de cuenta</dt>
              <dd className="text-gray-950">{profile?.status ?? "active"}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">
                Mayor de edad verificado
              </dt>
              <dd className="text-gray-950">
                {profile?.is_adult_verified ? "Sí" : "No"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Tus permisos</h2>

          <p className="mt-2 text-sm text-gray-600">
            Los permisos definen qué acciones puedes realizar dentro de
            Sabinapp.
          </p>

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
              <p className="text-sm text-gray-600">Sin permisos especiales.</p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">
          Administración de negocios
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Edita contenido, imágenes, menú, destacados, contactos, horarios y
          estilo visual de tus páginas públicas.
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
          Estos son los negocios asociados a tu cuenta.
        </p>

        <div className="mt-5 grid gap-3">
          {businesses.length > 0 ? (
            businesses.map((business) => (
              <article
                key={business.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-950">
                      {business.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      /negocio/{business.slug}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Estado: {business.status}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {business.is_published ? "Publicado" : "No publicado"}
                    </span>

                    <Link
                      href={`/dashboard/negocios/${business.id}/edit`}
                      className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 transition hover:bg-orange-200"
                    >
                      Editar
                    </Link>
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
