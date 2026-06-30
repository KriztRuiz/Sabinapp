"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState<string | null>(
    "Validando enlace de recuperación...",
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function prepareRecoverySession() {
      const hash = window.location.hash;

      /**
       * Soporte para enlaces antiguos tipo:
       * /auth/update-password#access_token=...
       */
      if (hash) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (accessToken && refreshToken && type === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setMessage("No se pudo activar la sesión de recuperación.");
            setIsReady(false);
            return;
          }

          window.history.replaceState(
            {},
            document.title,
            "/auth/update-password",
          );

          setMessage(null);
          setIsReady(true);
          return;
        }
      }

      /**
       * Flujo recomendado con @supabase/ssr:
       * Supabase manda code → /auth/callback intercambia sesión →
       * /auth/update-password ya llega con sesión activa.
       */
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setMessage(
          "No se encontró una sesión de recuperación activa. Solicita otra liga desde “Olvidé mi contraseña”.",
        );
        setIsReady(false);
        return;
      }

      setMessage(null);
      setIsReady(true);
    }

    prepareRecoverySession();
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsSaving(false);

    if (error) {
      setMessage("No se pudo actualizar la contraseña. Solicita otra liga.");
      return;
    }

    await supabase.auth.signOut();

    router.push(
      "/auth/login?message=Contraseña actualizada. Inicia sesión con tu nueva contraseña.",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-800"
        >
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          disabled={!isReady || isSaving}
          suppressHydrationWarning
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          className="block text-sm font-medium text-gray-800"
        >
          Confirmar contraseña
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          disabled={!isReady || isSaving}
          suppressHydrationWarning
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
          placeholder="Repite la contraseña"
        />
      </div>

      <button
        type="submit"
        disabled={!isReady || isSaving}
        suppressHydrationWarning
        className="w-full rounded-lg bg-gray-950 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isSaving ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}