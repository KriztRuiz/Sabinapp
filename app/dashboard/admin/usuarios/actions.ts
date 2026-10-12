"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const USERS_PATH = "/dashboard/admin/usuarios";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RoleActionResult = {
  ok?: boolean;
  userId?: string;
  role?: string;
  enabled?: boolean;
  changed?: boolean;
};

function getSafeReturnParams(raw: string): URLSearchParams {
  const incoming = new URLSearchParams(raw);
  const safe = new URLSearchParams();

  const q = (incoming.get("q") ?? "").trim().slice(0, 80);
  if (q) safe.set("q", q);

  const status = incoming.get("status") ?? "";
  if (["active", "other"].includes(status)) {
    safe.set("status", status);
  }

  const role = incoming.get("role") ?? "";
  const allowedRoles = [
    "admin",
    "subadmin",
    "registered_user",
    "business_owner",
    "business_assistant",
  ];

  if (allowedRoles.includes(role)) {
    safe.set("role", role);
  }

  const recent = incoming.get("recent") ?? "";
  if (["7", "30"].includes(recent)) {
    safe.set("recent", recent);
  }

  const day = incoming.get("day") ?? "";
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) {
    safe.set("day", day);
  }

  const month = incoming.get("month") ?? "";
  if (/^\\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    safe.set("month", month);
  }

  const page = incoming.get("page") ?? "";
  if (/^[1-9]\\d{0,3}$/.test(page)) {
    safe.set("page", page);
  }

  return safe;
}

function redirectWithMessage(
  type: "message" | "error",
  message: string,
  returnQuery: string,
): never {
  const params = getSafeReturnParams(returnQuery);
  params.set(type, message);

  redirect(`${USERS_PATH}?${params.toString()}`);
}

export async function setSubadminRole(
  formData: FormData,
) {
  const supabase = await createClient();

  const rawReturnQuery = formData.get("returnQuery");

  const returnQuery =
    typeof rawReturnQuery === "string" &&
    rawReturnQuery.length <= 1000
      ? rawReturnQuery
      : "";

  function redirectResult(
    type: "message" | "error",
    message: string,
  ): never {
    redirectWithMessage(type, message, returnQuery);
  }

  // 1. Verificar identidad.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Solo el administrador principal puede
  // gestionar subadministradores.
  const {
    data: isAdmin,
    error: adminError,
  } = await supabase.rpc("has_role", {
    role_key: "admin",
  });

  if (adminError || !isAdmin) {
    redirect("/dashboard");
  }

  // 3. Validar los parametros recibidos.
  const rawTargetId = formData.get("targetUserId");
  const rawAction = formData.get("roleAction");

  const targetUserId =
    typeof rawTargetId === "string"
      ? rawTargetId.trim()
      : "";

  const action =
    typeof rawAction === "string"
      ? rawAction.trim()
      : "";

  if (!UUID_PATTERN.test(targetUserId)) {
    redirectResult(
      "error",
      "El identificador del usuario no es válido.",
    );
  }

  if (action !== "assign" && action !== "revoke") {
    redirectResult(
      "error",
      "La operación solicitada no es válida.",
    );
  }

  if (targetUserId === user.id) {
    redirectResult(
      "error",
      "No puedes modificar tus propios roles.",
    );
  }

  const enabled = action === "assign";

  // 4. PostgreSQL valida el destinatario,
  // administra el rol y registra la auditoría.
  const { data, error } = await supabase.rpc(
    "admin_set_subadmin",
    {
      p_target_user_id: targetUserId,
      p_enabled: enabled,
    },
  );

  if (error) {
    console.error(
      "Error al administrar rol subadmin:",
      error.code,
      error.message,
    );

    if (error.code === "42501") {
      redirectResult(
        "error",
        "La operación no está permitida para esta cuenta.",
      );
    }

    if (error.code === "P0002") {
      redirectResult(
        "error",
        "El usuario no está disponible o su perfil no está activo.",
      );
    }

    redirectResult(
      "error",
      "No fue posible actualizar el rol. Inténtalo nuevamente.",
    );
  }

  const result = data as RoleActionResult | null;

  // 5. Nunca informar éxito sin validar
  // la respuesta de PostgreSQL.
  if (
    !result ||
    result.ok !== true ||
    result.userId !== targetUserId ||
    result.role !== "subadmin" ||
    result.enabled !== enabled ||
    typeof result.changed !== "boolean"
  ) {
    redirectResult(
      "error",
      "PostgreSQL devolvió una respuesta inesperada.",
    );
  }

  // 6. Actualizar vistas administrativas.
  revalidatePath(USERS_PATH);
  revalidatePath("/dashboard");

  if (!result.changed) {
    redirectResult(
      "message",
      "El usuario ya tenía el estado de rol solicitado.",
    );
  }

  redirectResult(
    "message",
    enabled
      ? "Subadministrador asignado correctamente."
      : "Rol de subadministrador revocado correctamente.",
  );
}
