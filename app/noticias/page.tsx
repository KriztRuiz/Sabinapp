import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type LocalNewsRow = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

export default async function LocalNewsPage() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("local_news")
    .select("id, title, summary, source_name, source_url, published_at")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("published_at", { ascending: false })
    .limit(20);

  const news = (data ?? []) as LocalNewsRow[];

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-sky-50 px-6 py-10 text-gray-950">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-orange-100 pb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            ← Volver a Sabinapp
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-orange-700">
            Noticias locales
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Resumen de noticias relacionadas con Sabinas Hidalgo
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-600">
            Esta página mostrará noticias resumidas previamente por IA y
            guardadas en Supabase. Cada noticia conserva enlace a su fuente
            original.
          </p>
        </header>

        {error ? (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h2 className="text-xl font-black">
              No se pudieron cargar las noticias
            </h2>

            <p className="mt-2 text-sm">
              Revisa que la tabla local_news exista y que tenga política de
              lectura pública para noticias activas.
            </p>
          </section>
        ) : null}

        {!error && news.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black">
              Todavía no hay noticias guardadas
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-gray-600">
              La página ya está lista. El siguiente paso será alimentar
              local_news con noticias reales resumidas, ya sea manualmente al
              inicio o mediante un proceso automático con IA.
            </p>
          </section>
        ) : null}

        {news.length > 0 ? (
          <section className="mt-8 grid gap-5">
            {news.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                      {item.source_name}
                    </p>

                    <h2 className="mt-3 text-2xl font-black">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-gray-500">
                      {formatDate(item.published_at)}
                    </p>
                  </div>

                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-full bg-gray-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    Ver fuente
                  </a>
                </div>

                <p className="mt-5 max-w-3xl leading-7 text-gray-600">
                  {item.summary}
                </p>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
