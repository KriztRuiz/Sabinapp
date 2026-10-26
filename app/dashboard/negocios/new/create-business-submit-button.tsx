"use client";

import { useFormStatus } from "react-dom";

export function CreateBusinessSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creando negocio..." : "Crear negocio"}
    </button>
  );
}
