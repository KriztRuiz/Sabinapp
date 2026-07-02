// lib/supabase/server.ts

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el servidor.
 *
 * Úsalo en:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * Este cliente usa cookies para leer la sesión del usuario.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /**
             * En algunos Server Components las cookies pueden ser de solo lectura.
             * Este catch evita que la página truene por eso.
             */
          }
        },
      },
    },
  );
}