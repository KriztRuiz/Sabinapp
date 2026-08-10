"use client";

type FieldGuideProps = {
  title: string;
  description: string;
  goodExample?: string;
  avoid?: string;
};

export function FieldGuide({
  title,
  description,
  goodExample,
  avoid,
}: FieldGuideProps) {
  return (
    <details className="group mt-3 rounded-2xl border border-sky-100 bg-sky-50 text-sm text-sky-950">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black transition hover:bg-sky-100/70 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>

        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-sky-700">
          <span className="group-open:hidden">Ver guía</span>
          <span className="hidden group-open:inline">Ocultar</span>
        </span>
      </summary>

      <div className="border-t border-sky-100 px-4 pb-4 pt-3">
        <p className="leading-6 text-sky-900">{description}</p>

        {goodExample ? (
          <div className="mt-3 rounded-xl bg-white/70 p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
              Buen ejemplo
            </p>

            <p className="mt-1 leading-6 text-sky-950">“{goodExample}”</p>
          </div>
        ) : null}

        {avoid ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
              Evita
            </p>

            <p className="mt-1 leading-6 text-amber-950">{avoid}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}
