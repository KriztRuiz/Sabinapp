"use client";

import { useFormStatus } from "react-dom";

export function PublishOwnedBusinessButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Publicando..." : "Publicar negocio"}
    </button>
  );
}
