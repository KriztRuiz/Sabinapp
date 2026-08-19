"use client";

import { useFormStatus } from "react-dom";

export function PauseOwnedBusinessButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }

        const confirmed = window.confirm(
          "¿Seguro que quieres retirar este negocio del público? Dejará de aparecer en Sabinapp y tendrás que enviarlo nuevamente a revisión para publicarlo otra vez.",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Retirando..." : "Retirar del público"}
    </button>
  );
}
