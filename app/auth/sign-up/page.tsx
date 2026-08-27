import Link from "next/link";
import { signUp } from "../actions";

type SignUpPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-6 inline-flex text-sm font-semibold text-orange-700 transition hover:text-orange-800"
      >
        ← Volver a Sabinapp
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">Crear cuenta</h1>

        <p className="mt-3 text-sm text-gray-600">
          Crea una cuenta para participar en Sabinapp, comentar noticias,
          publicar reseñas y registrar negocios.
        </p>

        {params.message ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {params.message}
          </div>
        ) : null}

        <form action={signUp} className="mt-6 space-y-4">
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
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Este dato ayuda a reducir cuentas falsas y a aplicar reglas de
              edad cuando sea necesario.
            </p>
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
              defaultValue=""
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

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-800"
            >
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-800"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <label className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <input
              name="privacy_accepted"
              type="checkbox"
              required
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
            className="w-full rounded-lg bg-gray-950 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-orange-600 hover:text-orange-700"
          >
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
