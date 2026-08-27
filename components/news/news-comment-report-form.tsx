import Link from "next/link";
import { reportNewsComment } from "@/lib/reports/actions";

type Props = {
  newsId: string;
  commentId: string;
  commentUserId: string;
  currentUserId: string | null;
  isAuthenticated: boolean;
};

export function NewsCommentReportForm({
  newsId,
  commentId,
  commentUserId,
  currentUserId,
  isAuthenticated,
}: Props) {
  const reportComment = reportNewsComment.bind(null, newsId, commentId);

  if (currentUserId && currentUserId === commentUserId) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <details className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <summary className="cursor-pointer text-sm font-bold text-gray-700">
          Reportar comentario
        </summary>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Para reportar un comentario necesitas iniciar sesión.
        </p>

        <Link
          href="/auth/login?message=Inicia+sesi%C3%B3n+para+reportar+un+comentario."
          className="mt-4 inline-flex rounded-full bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          Iniciar sesión
        </Link>
      </details>
    );
  }

  return (
    <details className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <summary className="cursor-pointer text-sm font-bold text-gray-700">
        Reportar comentario
      </summary>

      <form action={reportComment} className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-gray-800">Motivo</span>
          <select
            name="reason"
            required
            defaultValue="inappropriate_content"
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="incorrect_information">Información incorrecta</option>
            <option value="suspicious_content">Contenido sospechoso</option>
            <option value="inappropriate_content">
              Lenguaje ofensivo o inapropiado
            </option>
            <option value="technical_problem">Problema técnico</option>
            <option value="other">Otro motivo</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-gray-800">
            Describe el problema
          </span>
          <textarea
            name="description"
            rows={3}
            minLength={10}
            maxLength={1000}
            required
            placeholder="Explica brevemente por qué este comentario debería revisarse."
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
        >
          Enviar reporte
        </button>

        <p className="text-xs leading-5 text-gray-500">
          El reporte no oculta el comentario automáticamente. Un administrador
          lo revisará.
        </p>
      </form>
    </details>
  );
}
