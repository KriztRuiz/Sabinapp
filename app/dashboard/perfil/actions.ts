"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_SEX_VALUES = [
  "male",
  "female",
  "prefer_not_to_say",
] as const;

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isAllowedSex(value: string) {
  return ALLOWED_SEX_VALUES.includes(
    value as (typeof ALLOWED_SEX_VALUES)[number],
  );
}

function getAgeFromBirthdate(birthdate: string) {
  const birthDateValue = new Date(`${birthdate}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birthDateValue.getTime())) {
    return null;
  }

  let age = today.getFullYear() - birthDateValue.getFullYear();
  const monthDifference =
    today.getMonth() - birthDateValue.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDateValue.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function redirectProfileError(message: string): never {
  redirect(
    `/dashboard/perfil?message=${encodeURIComponent(message)}`,
  );
}

export async function updateProfileFromDashboard(
  formData: FormData,
) {
  const fullName = getFormValue(formData, "full_name");
  const usernameInput = getFormValue(formData, "username");
  const phoneInput = getFormValue(formData, "phone");
  const birthdate = getFormValue(formData, "birthdate");
  const sex = getFormValue(formData, "sex");

  const privacyAccepted =
    formData.get("privacy_accepted") === "on";

  const username = usernameInput
    ? usernameInput.toLowerCase()
    : null;

  const phone = phoneInput || null;

  // Validacion del nombre completo.

  if (
    !fullName ||
    fullName.length < 3 ||
    fullName.length > 120
  ) {
    redirectProfileError("Ingresa tu nombre completo.");
  }

  // Nombre de usuario opcional.

  if (
    username !== null &&
    !USERNAME_PATTERN.test(username)
  ) {
    redirectProfileError(
      "El nombre de usuario debe tener entre 3 y 30 caracteres, comenzar con una letra y contener solo letras, números o guion bajo.",
    );
  }

  // Telefono opcional.

  if (
    phone !== null &&
    !PHONE_PATTERN.test(phone)
  ) {
    redirectProfileError(
      "El teléfono debe contener entre 10 y 15 dígitos, con un signo + opcional al principio.",
    );
  }

  // Validaciones existentes.

  if (!birthdate) {
    redirectProfileError(
      "Ingresa tu fecha de nacimiento.",
    );
  }

  const age = getAgeFromBirthdate(birthdate);

  if (age === null || age < 13 || age > 120) {
    redirectProfileError(
      "Ingresa una fecha de nacimiento válida.",
    );
  }

  if (!isAllowedSex(sex)) {
    redirectProfileError(
      "Selecciona una opción válida de sexo.",
    );
  }

  if (!privacyAccepted) {
    redirectProfileError(
      "Debes aceptar el uso de tus datos para completar el perfil.",
    );
  }

  // Autenticacion.

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth/login?message=Inicia sesión para continuar.",
    );
  }

  // Conservar la aceptacion de privacidad existente.

  const { data: currentProfile, error: profileError } =
    await supabase
      .from("profiles")
      .select("privacy_accepted_at")
      .eq("id", user.id)
      .single();

  if (profileError || !currentProfile) {
    redirectProfileError(
      "No pudimos encontrar tu perfil. Intenta iniciar sesión nuevamente.",
    );
  }

  const now = new Date().toISOString();

  // Guardar exclusivamente el perfil autenticado.

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      phone,
      full_name: fullName,
      birthdate,
      is_adult_verified: age >= 18,
      sex,
      privacy_accepted_at:
        currentProfile.privacy_accepted_at ?? now,
      profile_completed_at: now,
      updated_at: now,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    if (
      error.code === "23505" &&
      error.message.includes("profiles_username_key")
    ) {
      redirectProfileError(
        "Ese nombre de usuario ya está ocupado. Elige otro.",
      );
    }

    redirectProfileError(
      "No pudimos actualizar tu perfil. Intenta de nuevo.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");

  redirect(
    `/dashboard/perfil?message=${encodeURIComponent(
      "Perfil actualizado correctamente.",
    )}`,
  );
}
