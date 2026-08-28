"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_SEX_VALUES = ["male", "female", "prefer_not_to_say"] as const;

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isAllowedSex(value: string) {
  return ALLOWED_SEX_VALUES.includes(value as (typeof ALLOWED_SEX_VALUES)[number]);
}

function getAgeFromBirthdate(birthdate: string) {
  const birthDateValue = new Date(`${birthdate}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birthDateValue.getTime())) {
    return null;
  }

  let age = today.getFullYear() - birthDateValue.getFullYear();
  const monthDifference = today.getMonth() - birthDateValue.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDateValue.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function redirectProfileError(message: string) {
  redirect(`/dashboard/perfil?message=${encodeURIComponent(message)}`);
}

export async function updateProfileFromDashboard(formData: FormData) {
  const fullName = getFormValue(formData, "full_name");
  const birthdate = getFormValue(formData, "birthdate");
  const sex = getFormValue(formData, "sex");
  const privacyAccepted = formData.get("privacy_accepted") === "on";

  if (!fullName || fullName.length < 3 || fullName.length > 120) {
    redirectProfileError("Ingresa tu nombre completo.");
  }

  if (!birthdate) {
    redirectProfileError("Ingresa tu fecha de nacimiento.");
  }

  const age = getAgeFromBirthdate(birthdate);

  if (age === null || age < 13 || age > 120) {
    redirectProfileError("Ingresa una fecha de nacimiento válida.");
  }

  if (!isAllowedSex(sex)) {
    redirectProfileError("Selecciona una opción válida de sexo.");
  }

  if (!privacyAccepted) {
    redirectProfileError("Debes aceptar el uso de tus datos para completar el perfil.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para continuar.");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("privacy_accepted_at")
    .eq("id", user.id)
    .maybeSingle();

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      birthdate,
      is_adult_verified: age !== null && age >= 18,
      sex,
      privacy_accepted_at: currentProfile?.privacy_accepted_at ?? now,
      profile_completed_at: now,
      updated_at: now,
    })
    .eq("id", user.id);

  if (error) {
    redirectProfileError("No pudimos actualizar tu perfil. Intenta de nuevo.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");

  redirect(
    `/dashboard/perfil?message=${encodeURIComponent(
      "Perfil actualizado correctamente.",
    )}`,
  );
}
