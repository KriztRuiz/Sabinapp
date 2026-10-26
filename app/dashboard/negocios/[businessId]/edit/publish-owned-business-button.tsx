"use client";

import { useFormStatus } from "react-dom";

export function PublishOwnedBusinessButton() {
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
          "¿Publicar este negocio? Su página será visible públicamente y podrá aparecer en las búsquedas de Sabinapp.",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Publicando..." : "Publicar negocio"}
    </button>
  );
}
