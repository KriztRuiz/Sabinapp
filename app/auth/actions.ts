"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const ALLOWED_SEX_VALUES = ["male", "female", "prefer_not_to_say"] as const;

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

export async function login(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect("/auth/login?message=Ingresa correo y contraseña.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/auth/login?message=${encodeURIComponent(
        "No se pudo iniciar sesión. Revisa tus datos.",
      )}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");
  const fullName = getFormValue(formData, "full_name");
  const birthdate = getFormValue(formData, "birthdate");
  const sex = getFormValue(formData, "sex");
  const privacyAccepted = formData.get("privacy_accepted") === "on";

  if (!fullName || fullName.length < 3) {
    redirect("/auth/sign-up?message=Ingresa tu nombre completo.");
  }

  if (!birthdate) {
    redirect("/auth/sign-up?message=Ingresa tu fecha de nacimiento.");
  }

  const age = getAgeFromBirthdate(birthdate);

  if (age === null || age < 13 || age > 120) {
    redirect(
      "/auth/sign-up?message=Ingresa una fecha de nacimiento válida.",
    );
  }

  if (!isAllowedSex(sex)) {
    redirect("/auth/sign-up?message=Selecciona una opción válida de sexo.");
  }

  if (!privacyAccepted) {
    redirect(
      "/auth/sign-up?message=Debes aceptar el uso de tus datos para crear la cuenta.",
    );
  }

  if (!email || !password) {
    redirect("/auth/sign-up?message=Ingresa correo y contraseña.");
  }

  if (password.length < 8) {
    redirect(
      "/auth/sign-up?message=La contraseña debe tener al menos 8 caracteres.",
    );
  }

  const now = new Date().toISOString();

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        birthdate,
        sex,
        privacy_accepted_at: now,
        profile_completed_at: now,
      },
    },
  });

  if (error) {
    redirect(
      `/auth/sign-up?message=${encodeURIComponent(
        "No se pudo crear la cuenta. Intenta con otro correo o contraseña.",
      )}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/auth/sign-up-success");
}

export async function resetPassword(formData: FormData) {
  const email = getFormValue(formData, "email");

  if (!email) {
    redirect("/auth/forgot-password?message=Ingresa tu correo.");
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    redirect(
      `/auth/forgot-password?message=${encodeURIComponent(
        "No se pudo enviar el correo de recuperación. Intenta de nuevo.",
      )}`,
    );
  }

  redirect(
    `/auth/forgot-password?message=${encodeURIComponent(
      "Si el correo existe en Sabinapp, recibirás una liga para cambiar tu contraseña.",
    )}`,
  );
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/auth/login?message=Sesión cerrada correctamente.");
}