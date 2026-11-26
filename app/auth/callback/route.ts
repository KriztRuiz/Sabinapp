import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // Render forwards requests to an internal host. Email links need the public origin.
  const origin = new URL(process.env.RENDER_EXTERNAL_URL || requestUrl.origin).origin;
  const recovery = requestUrl.searchParams.get("next") === "/auth/update-password";
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  let destination = new URL("/dashboard", origin);
  if (next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    const candidate = new URL(next, origin);
    if (candidate.origin === origin) destination = candidate;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(destination);
  }

  const retry = new URL(recovery ? "/auth/forgot-password" : "/auth/login", origin);
  retry.searchParams.set("message", "El enlace no es válido o ya caducó. Solicita uno nuevo.");
  return NextResponse.redirect(retry);
}
