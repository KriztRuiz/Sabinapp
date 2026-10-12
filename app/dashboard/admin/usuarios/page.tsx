import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubadminRoleAction } from "./subadmin-role-action";

const PAGE_SIZE = 25;
const MAX_ROLE_ASSIGNMENTS = 500;
const MONTERREY_OFFSET = "-06:00";

function getRecentCutoffIso(days: number): string {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return new Date(
    Date.now() - days * millisecondsPerDay,
  ).toISOString();
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
};

type RoleInfo = {
  id: string;
  key: string;
  name: string;
};

type UserRoleRow = {
  user_id: string;
  roles: {
    key: string;
    name: string;
  } | {
    key: string;
    name: string;
  }[] | null;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    role?: string;
    recent?: string;
    day?: string;
    month?: string;
    page?: string;
    message?: string;
    error?: string;
  }>;
};

function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : "";
}

function validMonth(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return "";

  const year = Number(value.slice(0, 4));

  return year >= 2000 && year <= 9999 ? value : "";
}

function nextDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function nextMonth(value: string) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));

  return new Date(Date.UTC(year, month, 1))
    .toISOString()
    .slice(0, 7);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeZone: "America/Monterrey",
  }).format(date);
}

export default async function AdminUsersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("has_role", {
      role_key: "admin",
    });

  if (adminError || !isAdmin) {
    redirect("/dashboard");
  }

  // Filtros recibidos mediante la URL.
  const name = (params.q ?? "").trim().slice(0, 80);

  const status = ["active", "other"].includes(
    params.status ?? "",
  )
    ? params.status ?? ""
    : "";

  const recent = ["7", "30"].includes(params.recent ?? "")
    ? params.recent ?? ""
    : "";

  const day = validDay(params.day ?? "");
  const month = validMonth(params.month ?? "");

  const rawPage = Number(params.page ?? "1");

  const page =
    Number.isSafeInteger(rawPage) &&
    rawPage >= 1 &&
    rawPage <= 10000
      ? rawPage
      : 1;

  // Obtener opciones reales de roles.
  const {
    data: roleOptionsRaw,
    error: roleOptionsError,
  } = await supabase
    .from("roles")
    .select("id, key, name")
    .order("name");

  const roleOptions = (roleOptionsRaw ?? []) as RoleInfo[];

  const selectedRole = roleOptions.find(
    (role) => role.key === params.role,
  );

  const role = selectedRole?.key ?? "";

  // Obtener los IDs que tienen el rol seleccionado.
  // Para el MVP se establece un limite explicito;
  // si se rebasa, no se muestran resultados incompletos.
  let roleUserIds: string[] | null = null;
  let rolesErrorMessage: string | null = null;

  if (!roleOptionsError && selectedRole) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", selectedRole.id)
      .eq("is_active", true)
      .limit(MAX_ROLE_ASSIGNMENTS + 1);

    if (error) {
      rolesErrorMessage = error.message;
    } else if ((data ?? []).length > MAX_ROLE_ASSIGNMENTS) {
      rolesErrorMessage =
        "El filtro de rol supera el límite actual de consulta.";
    } else {
      roleUserIds = (data ?? []).map((item) => item.user_id);
    }
  }

  let profiles: ProfileRow[] = [];
  let total = 0;
  let profilesErrorMessage: string | null = null;

  const canQueryProfiles =
    !roleOptionsError &&
    !rolesErrorMessage &&
    (!selectedRole || (roleUserIds?.length ?? 0) > 0);

  if (canQueryProfiles) {
    let query = supabase
      .from("profiles")
      .select(
        "id, full_name, email, status, created_at",
        { count: "exact" },
      );

    // Búsqueda por nombre sin distinguir mayúsculas.
    if (name) {
      const escapedName = name.replace(
        /[\\%_]/g,
        (character) => `\\${character}`,
      );

      query = query.ilike(
        "full_name",
        `%${escapedName}%`,
      );
    }

    if (status === "active") {
      query = query.eq("status", "active");
    } else if (status === "other") {
      query = query.neq("status", "active");
    }

    if (roleUserIds !== null) {
      query = query.in("id", roleUserIds);
    }

    if (recent) {
      const start = getRecentCutoffIso(Number(recent));

      query = query.gte("created_at", start);
    }

    // Fechas locales de Sabinas Hidalgo, Nuevo León.
    if (day) {
      query = query
        .gte(
          "created_at",
          `${day}T00:00:00${MONTERREY_OFFSET}`,
        )
        .lt(
          "created_at",
          `${nextDay(day)}T00:00:00${MONTERREY_OFFSET}`,
        );
    }

    if (month) {
      query = query
        .gte(
          "created_at",
          `${month}-01T00:00:00${MONTERREY_OFFSET}`,
        )
        .lt(
          "created_at",
          `${nextMonth(month)}-01T00:00:00${MONTERREY_OFFSET}`,
        );
    }

    const {
      data,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE - 1,
      );

    if (error) {
      profilesErrorMessage = error.message;
    } else {
      profiles = (data ?? []) as ProfileRow[];
      total = count ?? 0;
    }
  }

  // Consultar los roles activos de los usuarios
  // de la página actual, no solo el rol filtrado.
  const userIds = profiles.map((profile) => profile.id);

  let roleRows: UserRoleRow[] = [];

  if (userIds.length > 0 && !profilesErrorMessage) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, roles(key, name)")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (error) {
      rolesErrorMessage = error.message;
    } else {
      roleRows = (data ?? []) as unknown as UserRoleRow[];
    }
  }

  const rolesByUser = new Map<
    string,
    { key: string; name: string }[]
  >();

  for (const row of roleRows) {
    const roles = Array.isArray(row.roles)
      ? row.roles
      : row.roles
        ? [row.roles]
        : [];

    rolesByUser.set(row.user_id, [
      ...(rolesByUser.get(row.user_id) ?? []),
      ...roles,
    ]);
  }

  const hasError = Boolean(
    roleOptionsError ||
    rolesErrorMessage ||
    profilesErrorMessage,
  );

  const activeOnPage = profiles.filter(
    (profile) => profile.status === "active",
  ).length;

  const hasNext = page * PAGE_SIZE < total;

  function pageHref(pageNumber: number) {
    const url = new URLSearchParams();

    const filters = {
      q: name,
      status,
      role,
      recent,
      day,
      month,
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value) url.set(key, value);
    }

    url.set("page", String(pageNumber));

    return `/dashboard/admin/usuarios?${url.toString()}`;
  }

  const returnQuery = pageHref(page).split("?")[1] ?? "";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-orange-700 hover:underline"
        >
          ← Volver al dashboard
        </Link>

        <p className="mt-6 text-xs font-black uppercase tracking-widest text-orange-700">
          Administración
        </p>

        <h1 className="mt-3 text-3xl font-black text-gray-950">
          Usuarios y roles
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Busca usuarios, consulta sus estados y revisa
          los roles que tienen asignados.
        </p>
      </header>

      {params.message ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800"
        >
          {params.message}
        </div>
      ) : null}

      {params.error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
        >
          {params.error}
        </div>
      ) : null}

      <form
        method="GET"
        action="/dashboard/admin/usuarios"
        className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold text-gray-950">
          Buscar y filtrar usuarios
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            Buscar por nombre
            <input
              type="search"
              name="q"
              defaultValue={name}
              maxLength={80}
              placeholder="Nombre del usuario..."
              className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-950"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            Estado
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="other">No activos</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            Rol
            <select
              name="role"
              defaultValue={role}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950"
            >
              <option value="">Todos los roles</option>
              {roleOptions.map((option) => (
                <option key={option.id} value={option.key}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            Usuarios recientes
            <select
              name="recent"
              defaultValue={recent}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950"
            >
              <option value="">Cualquier fecha</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            Día exacto de registro
            <input
              type="date"
              name="day"
              defaultValue={day}
              className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-950"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            Mes de registro
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-950"
            />
          </label>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Los filtros pueden combinarse. Las fechas se
          interpretan en horario de Sabinas Hidalgo.
          Para comenzar de nuevo, utiliza Limpiar filtros.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700"
          >
            Aplicar filtros
          </button>

          <Link
            href="/dashboard/admin/usuarios"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Limpiar filtros
          </Link>
        </div>
      </form>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Coincidencias totales
          </p>
          <p className="mt-2 text-3xl font-black text-gray-950">
            {hasError ? "—" : total}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Perfiles activos en esta página
          </p>
          <p className="mt-2 text-3xl font-black text-gray-950">
            {hasError ? "—" : activeOnPage}
          </p>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-950">
            Resultados de búsqueda
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Hasta {PAGE_SIZE} usuarios por página,
            ordenados del más reciente al más antiguo.
          </p>
        </div>

        {hasError ? (
          <p className="p-5 text-sm text-red-700">
            No fue posible cargar los usuarios con los
            filtros solicitados. Revisa los permisos
            de Supabase o el límite del filtro de roles.
          </p>
        ) : profiles.length === 0 ? (
          <p className="p-5 text-sm text-gray-600">
            No encontramos usuarios que coincidan
            con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4">Usuario</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Roles activos</th>
                  <th className="px-5 py-4">Registro</th>
                  <th className="px-5 py-4">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => {
                  const roles = rolesByUser.get(profile.id) ?? [];

                  const isProtected =
                    profile.id === user.id ||
                    roles.some((item) => item.key === "admin");

                  const isSubadmin = roles.some(
                    (item) => item.key === "subadmin",
                  );

                  const isActive = profile.status === "active";

                  return (
                    <tr key={profile.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-950">
                          {profile.full_name || "Sin nombre"}
                        </p>
                        <p className="mt-1 text-gray-500">
                          {profile.email || "Sin correo"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            profile.status === "active"
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
                              : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                          }
                        >
                          {profile.status === "active"
                            ? "Activo"
                            : profile.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {roles.length > 0 ? (
                            roles.map((item) => (
                              <span
                                key={item.key}
                                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800"
                              >
                                {item.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">
                              Sin roles activos
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(profile.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        {isProtected ? (
                          <span className="text-xs font-semibold text-gray-500">
                            Cuenta protegida
                          </span>
                        ) : !isActive ? (
                          <span className="text-xs text-gray-500">
                            No disponible
                          </span>
                        ) : (
                          <SubadminRoleAction
                            targetUserId={profile.id}
                            userName={
                              profile.full_name ||
                              profile.email ||
                              "este usuario"
                            }
                            hasRole={isSubadmin}
                            returnQuery={returnQuery}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!hasError && total > PAGE_SIZE ? (
        <nav
          aria-label="Paginación de usuarios"
          className="mt-5 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-gray-600">
            Mostrando{" "}
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)}{" "}
            de {total} resultados
          </p>

          <div className="flex gap-3">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                ← Anterior
              </Link>
            ) : null}

            {hasNext ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Siguiente →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
