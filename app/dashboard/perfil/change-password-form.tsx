"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function ChangePasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const currentPassword = String(formData.get("current_password") ?? "");
    const newPassword = String(formData.get("new_password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    setFeedback(null);

    if (!currentPassword) {
      setFeedback({
        type: "error",
        message: "Ingresa tu contraseña actual.",
      });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({
        type: "error",
        message: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: "error",
        message: "Las contraseñas nuevas no coinciden.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setFeedback({
        type: "error",
        message: "La nueva contraseña debe ser diferente a la actual.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFeedback({
          type: "error",
          message: "Tu sesión no es válida. Vuelve a iniciar sesión.",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        current_password: currentPassword,
        password: newPassword,
      });

      if (error) {
        let message =
          "No se pudo cambiar la contraseña. Verifica tus datos e inténtalo nuevamente.";

        if (
          error.code === "current_password_mismatch" ||
          error.code === "current_password_invalid"
        ) {
          message = "La contraseña actual es incorrecta.";
        } else if (error.code === "same_password") {
          message = "La nueva contraseña debe ser diferente a la anterior.";
        } else if (error.code === "reauthentication_needed") {
          message =
            "Supabase requiere verificar nuevamente tu identidad. Vuelve a iniciar sesión e inténtalo otra vez.";
        }

        setFeedback({ type: "error", message });
        return;
      }

      form.reset();

      setFeedback({
        type: "success",
        message:
          "Contraseña actualizada correctamente. La próxima vez que inicies sesión, utiliza tu nueva contraseña.",
      });
    } catch {
      setFeedback({
        type: "error",
        message:
          "Ocurrió un problema de conexión. Intenta nuevamente sin compartir tus contraseñas.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const inputClassName =
    "mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="profile_current_password"
          className="block text-sm font-medium text-gray-800"
        >
          Contraseña actual
        </label>

        <input
          id="profile_current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSaving}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="profile_new_password"
          className="block text-sm font-medium text-gray-800"
        >
          Nueva contraseña
        </label>

        <input
          id="profile_new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={isSaving}
          className={inputClassName}
        />

        <p className="mt-2 text-xs text-gray-500">
          Mínimo 8 caracteres. Usa una contraseña diferente a la actual.
        </p>
      </div>

      <div>
        <label
          htmlFor="profile_confirm_password"
          className="block text-sm font-medium text-gray-800"
        >
          Confirmar nueva contraseña
        </label>

        <input
          id="profile_confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={isSaving}
          className={inputClassName}
        />
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border p-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Actualizando contraseña..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
