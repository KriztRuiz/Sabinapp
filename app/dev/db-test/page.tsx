import { createClient } from "@/lib/supabase/server";

export default async function DbTestPage() {
  const supabase = await createClient();

  /**
   * Probamos una tabla pública y segura:
   * business_types tiene RLS permitiendo lectura pública de tipos activos.
   */
  const { data: businessTypes, error } = await supabase
    .from("business_types")
    .select("id, key, name, description, display_order")
    .order("display_order", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Prueba de conexión Supabase</h1>

      <p className="mt-3 text-gray-600">
        Esta página verifica que Next.js pueda leer datos desde Supabase.
      </p>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <h2 className="font-semibold">Error de Supabase</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      ) : (
        <section className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold">
            Tipos de negocio encontrados: {businessTypes?.length ?? 0}
          </h2>

          <div className="grid gap-3">
            {businessTypes?.map((type) => (
              <article
                key={type.id}
                className="rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <h3 className="font-semibold">{type.name}</h3>
                <p className="text-sm text-gray-500">{type.key}</p>
                <p className="mt-2 text-sm text-gray-700">
                  {type.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}