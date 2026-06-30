import Link from "next/link";
import { login } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Iniciar sesión
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Entra con tu cuenta para administrar negocios, revisar tu perfil o
          acceder al panel.
        </p>

        {params.message ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {params.message}
          </div>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
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
            <div className="flex items-center justify-between gap-3">
                <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-800"
                >
                Contraseña
                </label>

                <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                Olvidé mi contraseña
                </Link>
            </div>

            <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                placeholder="Tu contraseña"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-950 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-orange-600 hover:text-orange-700"
          >
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}