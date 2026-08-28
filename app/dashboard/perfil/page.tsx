import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfileFromDashboard } from "./actions";

type PageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  birthdate: string | null;
  sex: string | null;
  privacy_accepted_at: string | null;
  profile_completed_at: string | null;
  status: string;
};

function isProfileComplete(profile: ProfileRow | null) {
  return Boolean(
    profile?.full_name?.trim() &&
      profile.birthdate &&
      profile.sex &&
      profile.privacy_accepted_at &&
      profile.profile_completed_at,
  );
}

function getSexLabel(value: string | null) {
  const labels: Record<string, string> = {
    female: "Femenino",
    male: "Masculino",
    prefer_not_to_say: "Prefiero no decir",
  };

  return value ? labels[value] ?? value : "Sin registrar";
}

export default async function DashboardProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para continuar.");
  }

  const { data } = await supabase
    .from("profiles")
    .select(
      "email, full_name, birthdate, sex, privacy_accepted_at, profile_completed_at, status",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;
  const profileComplete = isProfileComplete(profile);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-semibold text-orange-700 transition hover:text-orange-800"
      >
        ← Volver al panel
      </Link>

      <header className="mt-6 border-b border-gray-200 pb-6">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Tu perfil
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          Completa tus datos básicos para participar en la comunidad, comentar
          noticias, publicar reseñas y registrar negocios.
        </p>
      </header>

      {params.message ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {params.message}
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Estado del perfil
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Estos datos no muestran tu correo ni tu teléfono públicamente.
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
              profileComplete
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {profileComplete ? "Completo" : "Incompleto"}
          </span>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-4">
            <dt className="font-semibold text-gray-500">Correo</dt>
            <dd className="mt-1 text-gray-950">{profile?.email ?? user.email}</dd>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <dt className="font-semibold text-gray-500">Nombre</dt>
            <dd className="mt-1 text-gray-950">
              {profile?.full_name || "Sin registrar"}
            </dd>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <dt className="font-semibold text-gray-500">Fecha de nacimiento</dt>
            <dd className="mt-1 text-gray-950">
              {profile?.birthdate || "Sin registrar"}
            </dd>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <dt className="font-semibold text-gray-500">Sexo</dt>
            <dd className="mt-1 text-gray-950">{getSexLabel(profile?.sex ?? null)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">
          Completar datos
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Usa datos reales. Sabinapp los usa para reducir cuentas falsas,
          moderar abusos y proteger a la comunidad.
        </p>

        <form action={updateProfileFromDashboard} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-800"
            >
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              minLength={3}
              maxLength={120}
              autoComplete="name"
              defaultValue={profile?.full_name ?? ""}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              placeholder="Nombre y apellido"
            />
          </div>

          <div>
            <label
              htmlFor="birthdate"
              className="block text-sm font-medium text-gray-800"
            >
              Fecha de nacimiento
            </label>
            <input
              id="birthdate"
              name="birthdate"
              type="date"
              required
              autoComplete="bday"
              defaultValue={profile?.birthdate ?? ""}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="sex"
              className="block text-sm font-medium text-gray-800"
            >
              Sexo
            </label>
            <select
              id="sex"
              name="sex"
              required
              defaultValue={profile?.sex ?? ""}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
              <option value="prefer_not_to_say">Prefiero no decir</option>
            </select>
          </div>

          <label className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <input
              name="privacy_accepted"
              type="checkbox"
              required
              defaultChecked={Boolean(profile?.privacy_accepted_at)}
              className="mt-1 size-4 shrink-0"
            />
            <span>
              Confirmo que los datos proporcionados son reales y acepto que
              Sabinapp los use para proteger la comunidad y moderar cuentas
              falsas o abusivas.
            </span>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Guardar perfil
          </button>
        </form>
      </section>
    </main>
  );
}
