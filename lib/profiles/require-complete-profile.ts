import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ProfileCompletionRow = {
  full_name: string | null;
  birthdate: string | null;
  sex: string | null;
  privacy_accepted_at: string | null;
  profile_completed_at: string | null;
  status: string;
};

function isProfileComplete(profile: ProfileCompletionRow | null) {
  return Boolean(
    profile?.status === "active" &&
      profile.full_name?.trim() &&
      profile.birthdate &&
      profile.sex &&
      profile.privacy_accepted_at &&
      profile.profile_completed_at,
  );
}

export async function requireCompleteProfile(
  supabase: SupabaseServerClient,
  userId: string,
  message = "Completa tu perfil para continuar.",
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, birthdate, sex, privacy_accepted_at, profile_completed_at, status",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!isProfileComplete(profile as ProfileCompletionRow | null)) {
    redirect(`/dashboard/perfil?message=${encodeURIComponent(message)}`);
  }

  return profile as ProfileCompletionRow;
}
