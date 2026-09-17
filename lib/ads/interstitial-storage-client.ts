import { createClient } from "@/lib/supabase/client";

export const INTERSTITIAL_ASSETS_BUCKET = "ad-assets";

export const INTERSTITIAL_MAX_IMAGES = 6;
export const INTERSTITIAL_IMAGE_MAX_BYTES = 1000 * 1024;
export const INTERSTITIAL_VIDEO_MAX_BYTES = 16000 * 1024;

export type InterstitialAssetMode =
  | "images"
  | "video";

export type UploadedInterstitialAsset = {
  storagePath: string;
  mimeType: string;
  size: number;
};

const IMAGE_EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const VIDEO_EXTENSION_BY_MIME = {
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;

const IMAGE_MIME_TYPES = Object.keys(
  IMAGE_EXTENSION_BY_MIME,
);

const VIDEO_MIME_TYPES = Object.keys(
  VIDEO_EXTENSION_BY_MIME,
);

function createAssetStoragePath(
  businessId: string,
  file: File,
) {
  const extension =
    IMAGE_EXTENSION_BY_MIME[
      file.type as keyof typeof IMAGE_EXTENSION_BY_MIME
    ] ??
    VIDEO_EXTENSION_BY_MIME[
      file.type as keyof typeof VIDEO_EXTENSION_BY_MIME
    ];

  if (!extension) {
    throw new Error(
      "El tipo de archivo no está permitido.",
    );
  }

  return [
    businessId,
    "campaigns",
    "interstitial",
    `${crypto.randomUUID()}.${extension}`,
  ].join("/");
}

export function validateInterstitialFiles(
  files: File[],
  mode: InterstitialAssetMode,
): string | null {
  if (mode === "images") {
    if (
      files.length < 1 ||
      files.length > INTERSTITIAL_MAX_IMAGES
    ) {
      return `Selecciona entre 1 y ${INTERSTITIAL_MAX_IMAGES} imágenes.`;
    }

    for (const file of files) {
      if (!IMAGE_MIME_TYPES.includes(file.type)) {
        return "Las imágenes deben ser JPEG, PNG o WebP.";
      }

      if (file.size <= 0) {
        return "Una de las imágenes está vacía.";
      }

      if (
        file.size >
        INTERSTITIAL_IMAGE_MAX_BYTES
      ) {
        return "Cada imagen puede pesar como máximo 1000 KB.";
      }
    }

    return null;
  }

  if (files.length !== 1) {
    return "Selecciona exactamente un video.";
  }

  const [file] = files;

  if (!VIDEO_MIME_TYPES.includes(file.type)) {
    return "El video debe ser MP4 o WebM.";
  }

  if (file.size <= 0) {
    return "El video está vacío.";
  }

  if (
    file.size >
    INTERSTITIAL_VIDEO_MAX_BYTES
  ) {
    return "El video puede pesar como máximo 16000 KB.";
  }

  return null;
}

export async function removeInterstitialAssets(
  storagePaths: string[],
) {
  if (storagePaths.length === 0) {
    return;
  }

  const supabase = createClient();

  const { error } = await supabase.storage
    .from(INTERSTITIAL_ASSETS_BUCKET)
    .remove(storagePaths);

  if (error) {
    throw new Error(
      `No se pudieron limpiar los archivos temporales: ${error.message}`,
    );
  }
}

export async function uploadInterstitialAssets({
  businessId,
  files,
  mode,
}: {
  businessId: string;
  files: File[];
  mode: InterstitialAssetMode;
}): Promise<UploadedInterstitialAsset[]> {
  const cleanBusinessId =
    businessId.trim();

  if (!cleanBusinessId) {
    throw new Error(
      "No se pudo identificar el negocio anunciante.",
    );
  }

  const validationError =
    validateInterstitialFiles(
      files,
      mode,
    );

  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createClient();

  const uploadedAssets:
    UploadedInterstitialAsset[] = [];

  try {
    for (const file of files) {
      const storagePath =
        createAssetStoragePath(
          cleanBusinessId,
          file,
        );

      const { error } =
        await supabase.storage
          .from(
            INTERSTITIAL_ASSETS_BUCKET,
          )
          .upload(
            storagePath,
            file,
            {
              contentType: file.type,
              upsert: false,
            },
          );

      if (error) {
        throw new Error(
          `No se pudo subir ${file.name}: ${error.message}`,
        );
      }

      uploadedAssets.push({
        storagePath,
        mimeType: file.type,
        size: file.size,
      });
    }

    return uploadedAssets;
  } catch (error) {
    const uploadedPaths =
      uploadedAssets.map(
        (asset) =>
          asset.storagePath,
      );

    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from(
          INTERSTITIAL_ASSETS_BUCKET,
        )
        .remove(uploadedPaths);
    }

    throw error;
  }
}
