import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireModerationAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: canReview } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  if (!canReview) {
    redirect("/dashboard");
  }

  const { data: canManageReports } = await supabase.rpc("has_permission", {
    permission_key: "admin.manage_reports",
  });


  return { supabase, canManageReports };
}
