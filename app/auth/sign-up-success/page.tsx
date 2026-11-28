import Link from "next/link";
import TurnstileWidget from "@/components/auth/turnstile-widget";
import { resendSignupConfirmation } from "../actions";

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-3 py-6 sm:px-6 sm:py-12">
      <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Cuenta creada
        </h1>

        <p className="mt-4 text-sm text-gray-600">
          Tu cuenta fue creada. Si se solicita confirmación de correo,
          revisa tu bandeja de entrada. Si no requiere confirmación, ya puedes
          iniciar sesión.
        </p>

        <form action={resendSignupConfirmation} className="mt-6 space-y-3 text-left">
          {message && (
            <p role="status" className="text-sm text-gray-700">{message}</p>
          )}
          <label htmlFor="confirmation-email" className="block text-sm font-medium text-gray-950">
            Correo de registro
          </label>
          <input
            id="confirmation-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950"
          />
          <TurnstileWidget
            submitLabel="Reenviar correo de confirmación"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-950 hover:bg-gray-50"
          />
        </form>

        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-lg bg-gray-950 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800"
        >
          Ir a iniciar sesión
        </Link>
      </section>
    </main>
  );
}