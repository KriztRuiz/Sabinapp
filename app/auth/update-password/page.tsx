import UpdatePasswordForm from "./update-password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Crear nueva contraseña
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Escribe una nueva contraseña para tu cuenta.
        </p>

        <UpdatePasswordForm />
      </section>
    </main>
  );
}