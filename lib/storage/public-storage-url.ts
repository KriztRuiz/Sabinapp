// lib/storage/public-storage-url.ts

type PublicStorageSource = {
  bucket?: string | null;
  path?: string | null;
  legacyUrl?: string | null;
};

/**
 * Devuelve la URL pública utilizable por <img>, <video>, etc.
 *
 * Prioridad:
 * 1. Supabase Storage: bucket + path.
 * 2. URL legacy durante la migración.
 * 3. null si no existe ninguna fuente válida.
 *
 * La URL pública NO se guarda como dato canónico.
 * PostgreSQL conserva únicamente bucket + path.
 */
export function getPublicStorageUrl({
  bucket,
  path,
  legacyUrl,
}: PublicStorageSource): string | null {
  const normalizedBucket = bucket?.trim() ?? "";
  const normalizedPath = path?.trim() ?? "";
  const normalizedLegacyUrl = legacyUrl?.trim() ?? "";

  if (normalizedBucket && normalizedPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ?.trim()
      .replace(/\/+$/, "");

    if (supabaseUrl) {
      const encodedBucket = encodeURIComponent(normalizedBucket);

      const encodedPath = normalizedPath
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");

      if (encodedPath) {
        return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
      }
    }
  }

  return normalizedLegacyUrl || null;
}
