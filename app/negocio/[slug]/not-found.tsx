import Link from "next/link";

export default function BusinessNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-5 py-12">
      <p className="text-sm font-semibold text-orange-700">Sabinapp · 404</p>
      <h1 className="text-3xl font-bold text-gray-950">Este negocio no está disponible</h1>
      <p className="text-gray-700">Puedes buscar otros negocios de Sabinas Hidalgo en el directorio.</p>
      <Link href="/negocios" className="self-start rounded-lg bg-gray-950 px-4 py-3 font-semibold text-white">
        Volver al directorio
      </Link>
    </main>
  );
}
