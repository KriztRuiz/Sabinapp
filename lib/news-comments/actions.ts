"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function buildNewsCommentRedirect(
  newsId: string,
  type: "commentMessage" | "commentError",
  message: string,
) {
  return `/noticias?${type}=${encodeURIComponent(message)}#noticia-${newsId}`;
}

function normalizeComment(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function submitNewsComment(newsId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Inicia sesión para comentar noticias.",
      )}`,
    );
  }

  const comment = normalizeComment(formData.get("comment"));

  if (comment.length < 3 || comment.length > 1000) {
    redirect(
      buildNewsCommentRedirect(
        newsId,
        "commentError",
        "El comentario debe tener entre 3 y 1000 caracteres.",
      ),
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) {
    redirect(
      buildNewsCommentRedirect(
        newsId,
        "commentError",
        "Tu cuenta no puede comentar noticias en este momento.",
      ),
    );
  }

  const now = new Date().toISOString();

  const { data: news } = await supabase
    .from("local_news")
    .select("id")
    .eq("id", newsId)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();

  if (!news) {
    redirect(
      buildNewsCommentRedirect(
        newsId,
        "commentError",
        "Esta noticia no está disponible para comentarios.",
      ),
    );
  }

  const { error } = await supabase.from("news_comments").insert({
    news_id: newsId,
    user_id: user.id,
    comment,
    status: "published",
  });

  if (error) {
    redirect(
      buildNewsCommentRedirect(
        newsId,
        "commentError",
        "No pudimos guardar tu comentario. Intenta de nuevo.",
      ),
    );
  }

  revalidatePath("/noticias");

  redirect(
    buildNewsCommentRedirect(
      newsId,
      "commentMessage",
      "Tu comentario se publicó correctamente.",
    ),
  );
}
