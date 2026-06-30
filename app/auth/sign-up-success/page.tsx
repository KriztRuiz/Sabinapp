import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Cuenta creada
        </h1>

        <p className="mt-4 text-sm text-gray-600">
          Tu cuenta fue creada. Si Supabase requiere confirmación de correo,
          revisa tu bandeja de entrada. Si no requiere confirmación, ya puedes
          iniciar sesión.
        </p>

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