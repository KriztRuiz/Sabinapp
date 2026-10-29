"use client";

import { useFormStatus } from "react-dom";

export function SaveProfileButton() {
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
          "¿Guardar los cambios realizados en tu perfil?"
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando perfil..." : "Guardar perfil"}
    </button>
  );
}
