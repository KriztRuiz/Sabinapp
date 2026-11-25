import Link from "next/link";

const base = "/dashboard/admin/negocios";
const sections = {
  "por-estado": "Negocios por estado",
  cambios: "Cambios de negocios",
  resenas: "Reportes de reseñas",
  comentarios: "Reportes de comentarios",
} as const;

export type PageProps = {
  searchParams: Promise<{ message?: string; error?: string }>;
};

export function ModerationPage({ section, reports, message, error, children }: {
  section?: keyof typeof sections;
  reports: boolean;
  message?: string;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-950 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href={section ? base : "/dashboard"} className="font-semibold text-orange-800 underline">
          {section ? "← Revisión de negocios" : "← Volver al dashboard"}
        </Link>
        <h1 className="my-6 text-3xl font-black">{section ? sections[section] : "Revisión de negocios"}</h1>
        <nav aria-label="Secciones de moderación" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(sections).filter(([key]) => reports || (key !== "resenas" && key !== "comentarios")).map(([key, label]) => (
            <Link key={key} href={base + "/" + key} aria-current={key === section ? "page" : undefined}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold hover:border-orange-600 focus-visible:outline-orange-700 aria-[current=page]:bg-gray-950 aria-[current=page]:text-white">
              {label}
            </Link>
          ))}
        </nav>
        {message && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-900">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-900">{error}</p>}
        {children}
      </div>
    </main>
  );
}
