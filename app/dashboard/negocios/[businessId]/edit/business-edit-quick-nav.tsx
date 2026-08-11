const quickNavItems = [
  { href: "#contenido", label: "Contenido" },
  { href: "#clasificacion", label: "Clasificación" },
  { href: "#personalizacion", label: "Personalización" },
  { href: "#imagenes", label: "Imágenes" },
  { href: "#menu", label: "Menú" },
  { href: "#contactos", label: "Contactos" },
  { href: "#horarios", label: "Horarios" },
  { href: "#ubicaciones", label: "Ubicaciones" },
];

export function BusinessEditQuickNav() {
  return (
    <nav
      aria-label="Guía rápida del editor"
      className="rounded-3xl border border-orange-100 bg-orange-50/70 p-4 shadow-sm"
    >
      <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
        Guía rápida
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 transition hover:border-orange-400 hover:bg-orange-100"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
