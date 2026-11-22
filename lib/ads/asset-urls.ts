import "server-only";

import { getPublicStorageUrl } from "@/lib/storage/public-storage-url";
import { createAdsAdminClient } from "@/lib/supabase/ads-admin";

type AssetSource = Parameters<typeof getPublicStorageUrl>[0];

export async function resolveAdAssetUrls(sources: AssetSource[]) {
  const paths = [...new Set(sources.flatMap(({ bucket, path }) =>
    bucket === "ad-assets" && path ? [path] : [],
  ))];
  const signedUrls = new Map<string, string>();

  if (paths.length > 0) {
    try {
      const { data } = await createAdsAdminClient().storage
        .from("ad-assets")
        .createSignedUrls(paths, 600);

      for (const entry of data ?? []) {
        if (entry.path && entry.signedUrl && !entry.error) {
          signedUrls.set(entry.path, entry.signedUrl);
        }
      }
    } catch {
      // Let callers handle missing media without issuing public storage URLs.
    }
  }

  return sources.map((source) =>
    source.bucket === "ad-assets"
      ? signedUrls.get(source.path ?? "") ?? null
      : getPublicStorageUrl(source),
  );
}
