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
    <aside className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
      <p className="font-black">{title}</p>

      <p className="mt-1 leading-6 text-sky-900">{description}</p>

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
    </aside>
  );
}
