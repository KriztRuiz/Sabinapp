"use client";

import { useFormStatus } from "react-dom";

export function SubmitBusinessReviewButton() {
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
          "¿Seguro que quieres enviar este negocio a revisión? Un administrador deberá revisarlo antes de publicarlo.",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar a revisión"}
    </button>
  );
}
