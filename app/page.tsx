// app/page.tsx

import Link from "next/link";

const demoBusinesses = [
  {
    name: "Taquería El Primo",
    slug: "taqueria-el-primo",
    description: "Ejemplo de restaurante local con menú y destacados.",
  },
  {
    name: "Abarrotes La Esquina",
    slug: "abarrotes-la-esquina",
    description: "Ejemplo de comercio local con productos y horarios.",
  },
  {
    name: "Climas del Norte",
    slug: "climas-del-norte",
    description: "Ejemplo de servicio técnico local.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-orange-50 text-gray-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-orange-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Sabinapp
          </Link>

          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href="/auth/login"
              className="rounded-full border border-orange-300 bg-white px-4 py-2 text-gray-800 transition hover:bg-orange-100"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/auth/sign-up"
              className="rounded-full bg-gray-950 px-4 py-2 text-white transition hover:bg-gray-800"
            >
              Registrar negocio
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-700">
              Directorio local moderado
            </p>

            <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Encuentra negocios de Sabinas Hidalgo en un solo lugar.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
              Sabinapp ayuda a negocios locales a mostrar su información,
              horarios, productos, servicios, ubicación, imágenes y formas de
              contacto mediante páginas públicas fáciles de compartir.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/negocios"
                className="rounded-full bg-gray-950 px-7 py-4 text-center font-bold text-white transition hover:bg-gray-800"
              >
                Administrar mis negocios
              </Link>

              <Link
                href="/negocio/taqueria-el-primo"
                className="rounded-full border border-orange-300 bg-white px-7 py-4 text-center font-bold text-gray-900 transition hover:bg-orange-100"
              >
                Ver landing demo
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-orange-200 bg-white p-6 shadow-xl shadow-orange-900/10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-700">
              Negocios demo
            </p>

            <div className="mt-5 grid gap-4">
              {demoBusinesses.map((business) => (
                <Link
                  key={business.slug}
                  href={`/negocio/${business.slug}`}
                  className="rounded-2xl border border-gray-200 bg-orange-50/60 p-4 transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-100"
                >
                  <h2 className="text-lg font-black">{business.name}</h2>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {business.description}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-orange-700">
                    /negocio/{business.slug}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
