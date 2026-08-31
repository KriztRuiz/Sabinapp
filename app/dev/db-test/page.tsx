import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DbTestPage() {
  noStore();

  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .limit(5);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-gray-950">
        Prueba de conexión a base de datos
      </h1>

      <p className="mt-3 text-gray-700">
        Esta pantalla sólo debe estar disponible en desarrollo local.
      </p>

      {error ? (
        <pre className="mt-6 overflow-auto rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : (
        <pre className="mt-6 overflow-auto rounded-2xl bg-gray-950 p-4 text-sm text-white">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
