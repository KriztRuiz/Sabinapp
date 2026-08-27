import Link from "next/link";
import { submitNewsComment } from "@/lib/news-comments/actions";

type Props = {
  newsId: string;
  isAuthenticated: boolean;
};

export function NewsCommentForm({ newsId, isAuthenticated }: Props) {
  const saveComment = submitNewsComment.bind(null, newsId);

  if (!isAuthenticated) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
        <p className="text-sm font-bold text-gray-950">
          ¿Quieres comentar esta noticia?
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-600">
          Inicia sesión con tu cuenta de Sabinapp para participar.
        </p>

        <Link
          href="/auth/login?message=Inicia+sesi%C3%B3n+para+comentar+noticias."
          className="mt-4 inline-flex rounded-full bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      action={saveComment}
      className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4"
    >
      <label className="block">
        <span className="text-sm font-black text-gray-900">
          Agregar comentario
        </span>

        <textarea
          name="comment"
          rows={3}
          minLength={3}
          maxLength={1000}
          required
          placeholder="Comparte una opinión o aporta contexto para la comunidad."
          className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <button
        type="submit"
        className="mt-3 rounded-full bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
      >
        Publicar comentario
      </button>
    </form>
  );
}
