"use server";

import { randomUUID } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectAdError(message: string): never {
  redirect(
    `/dashboard/anuncios/nuevo?error=${encodeURIComponent(message)}`,
  );
}

function redirectAdEditError(
  campaignId: string,
  message: string,
): never {
  redirect(
    `/dashboard/anuncios/${campaignId}/editar?error=${encodeURIComponent(
      message,
    )}`,
  );
}

function getRequiredText(
  formData: FormData,
  key: string,
  label: string,
) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    redirectAdError(`Falta el campo: ${label}.`);
  }

  return value;
}

function parseScheduledDate(value: string) {
  const cleanValue = value.trim();

  const validFormat =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(cleanValue);

  if (!validFormat) {
    redirectAdError("La fecha y hora de inicio no son válidas.");
  }

  const withSeconds =
    cleanValue.length === 16
      ? `${cleanValue}:00`
      : cleanValue;

  const date = new Date(`${withSeconds}-06:00`);

  if (Number.isNaN(date.getTime())) {
    redirectAdError("La fecha y hora de inicio no son válidas.");
  }

  return date.toISOString();
}


const AD_ASSETS_BUCKET = "ad-assets";
const AD_IMAGE_MAX_BYTES = 1000 * 1024;

const AD_IMAGE_EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function getAdImageFile(
  formData: FormData,
  key = "imageFile",
): File | null {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size <= 0) {
    return null;
  }

  return value;
}

function getAdImageValidationError(
  file: File,
): string | null {
  if (
    !Object.prototype.hasOwnProperty.call(
      AD_IMAGE_EXTENSION_BY_MIME,
      file.type,
    )
  ) {
    return "La imagen debe ser JPEG, PNG o WebP.";
  }

  if (file.size > AD_IMAGE_MAX_BYTES) {
    return "La imagen del anuncio no puede superar 1000 KB.";
  }

  return null;
}

function getAdImageExtension(file: File) {
  return AD_IMAGE_EXTENSION_BY_MIME[
    file.type as keyof typeof AD_IMAGE_EXTENSION_BY_MIME
  ];
}

function createAdStoragePath(
  businessId: string,
  file: File,
) {
  return `${businessId}/campaigns/${randomUUID()}.${getAdImageExtension(file)}`;
}

async function cleanupAdStorageObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  bucket: string | null | undefined,
  storagePath: string | null | undefined,
) {
  if (
    bucket !== AD_ASSETS_BUCKET ||
    !storagePath ||
    !storagePath.startsWith(`${businessId}/`)
  ) {
    return;
  }

  await supabase.storage
    .from(AD_ASSETS_BUCKET)
    .remove([storagePath]);
}


export async function submitOwnerAdRequest(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const businessId = getRequiredText(
    formData,
    "businessId",
    "negocio",
  );

  const title = getRequiredText(
    formData,
    "title",
    "título",
  );

  const description =
    String(formData.get("description") ?? "").trim();

  const requestedDaysRaw = getRequiredText(
    formData,
    "requestedDays",
    "duración",
  );

  const requestedDays = Number(requestedDaysRaw);

  if (
    !Number.isInteger(requestedDays) ||
    requestedDays < 1
  ) {
    redirectAdError(
      "La duración debe ser de al menos un día.",
    );
  }

  const startMode = getRequiredText(
    formData,
    "startMode",
    "tipo de inicio",
  );

  if (!["asap", "scheduled"].includes(startMode)) {
    redirectAdError(
      "La opción de inicio seleccionada no es válida.",
    );
  }

  let requestedStartAt: string | null = null;

  if (startMode === "scheduled") {
    requestedStartAt = parseScheduledDate(
      getRequiredText(
        formData,
        "requestedStartAt",
        "fecha y hora de inicio",
      ),
    );
  }

  const targetChoice = getRequiredText(
    formData,
    "targetChoice",
    "destino",
  );

  let targetKind = "";
  let targetContactMethodId: string | null = null;

  if (targetChoice === "business_page") {
    targetKind = "business_page";
  } else if (targetChoice.startsWith("contact:")) {
    const contactId = targetChoice.slice("contact:".length).trim();

    if (!contactId) {
      redirectAdError(
        "El contacto seleccionado no es válido.",
      );
    }

    targetKind = "contact";
    targetContactMethodId = contactId;
  } else {
    redirectAdError(
      "El destino seleccionado no es válido.",
    );
  }

  const imageFile = getAdImageFile(
    formData,
    "imageFile",
  );

  if (!imageFile) {
    redirectAdError(
      "Selecciona una imagen para el anuncio.",
    );
  }

  const imageValidationError =
    getAdImageValidationError(imageFile);

  if (imageValidationError) {
    redirectAdError(imageValidationError);
  }

  const storagePath = createAdStoragePath(
    businessId,
    imageFile,
  );

  const { error: uploadError } =
    await supabase.storage
      .from(AD_ASSETS_BUCKET)
      .upload(
        storagePath,
        imageFile,
        {
          contentType: imageFile.type,
          upsert: false,
        },
      );

  if (uploadError) {
    redirectAdError(
      `No se pudo subir la imagen del anuncio: ${uploadError.message}`,
    );
  }

  const { error } = await supabase.rpc(
    "submit_ad_request_storage",
    {
      p_business_id: businessId,
      p_title: title,
      p_description: description || null,
      p_requested_days: requestedDays,
      p_start_mode: startMode,
      p_requested_start_at: requestedStartAt,
      p_target_kind: targetKind,
      p_target_contact_method_id: targetContactMethodId,
      p_storage_bucket: AD_ASSETS_BUCKET,
      p_storage_path: storagePath,
    },
  );

  if (error) {
    await cleanupAdStorageObject(
      supabase,
      businessId,
      AD_ASSETS_BUCKET,
      storagePath,
    );

    redirectAdError(
      error.message ||
        "No se pudo enviar la solicitud del anuncio.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/dashboard/admin/anuncios");

  redirect(
    "/dashboard/anuncios?message=" +
      encodeURIComponent(
        "Tu anuncio fue enviado a revisión correctamente.",
      ),
  );
}


export async function resubmitOwnerAdRequest(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const campaignId = String(
    formData.get("campaignId") ?? "",
  ).trim();

  if (!campaignId) {
    redirect("/dashboard/anuncios");
  }

  function getEditRequiredText(
    key: string,
    label: string,
  ) {
    const value = String(
      formData.get(key) ?? "",
    ).trim();

    if (!value) {
      redirectAdEditError(
        campaignId,
        `Falta el campo: ${label}.`,
      );
    }

    return value;
  }

  const title = getEditRequiredText(
    "title",
    "título",
  );

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const requestedDaysRaw = getEditRequiredText(
    "requestedDays",
    "duración",
  );

  const requestedDays = Number(
    requestedDaysRaw,
  );

  if (
    !Number.isInteger(requestedDays) ||
    requestedDays < 1
  ) {
    redirectAdEditError(
      campaignId,
      "La duración debe ser de al menos un día.",
    );
  }

  const startMode = getEditRequiredText(
    "startMode",
    "tipo de inicio",
  );

  if (!["asap", "scheduled"].includes(startMode)) {
    redirectAdEditError(
      campaignId,
      "La opción de inicio seleccionada no es válida.",
    );
  }

  let requestedStartAt: string | null = null;

  if (startMode === "scheduled") {
    const requestedStartValue =
      getEditRequiredText(
        "requestedStartAt",
        "fecha y hora de inicio",
      );

    const cleanValue =
      requestedStartValue.trim();

    const validFormat =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(
        cleanValue,
      );

    if (!validFormat) {
      redirectAdEditError(
        campaignId,
        "La fecha y hora de inicio no son válidas.",
      );
    }

    const withSeconds =
      cleanValue.length === 16
        ? `${cleanValue}:00`
        : cleanValue;

    const date = new Date(
      `${withSeconds}-06:00`,
    );

    if (Number.isNaN(date.getTime())) {
      redirectAdEditError(
        campaignId,
        "La fecha y hora de inicio no son válidas.",
      );
    }

    requestedStartAt = date.toISOString();
  }

  const targetChoice = getEditRequiredText(
    "targetChoice",
    "destino",
  );

  let targetKind = "";
  let targetContactMethodId: string | null = null;

  if (targetChoice === "business_page") {
    targetKind = "business_page";
  } else if (
    targetChoice.startsWith("contact:")
  ) {
    const contactId = targetChoice
      .slice("contact:".length)
      .trim();

    if (!contactId) {
      redirectAdEditError(
        campaignId,
        "El contacto seleccionado no es válido.",
      );
    }

    targetKind = "contact";
    targetContactMethodId = contactId;
  } else {
    redirectAdEditError(
      campaignId,
      "El destino seleccionado no es válido.",
    );
  }

  const {
    data: campaignStorageContext,
    error: campaignStorageError,
  } = await supabase
    .from("ad_campaigns")
    .select("advertiser_business_id")
    .eq("id", campaignId)
    .single();

  if (
    campaignStorageError ||
    !campaignStorageContext?.advertiser_business_id
  ) {
    redirectAdEditError(
      campaignId,
      "No se pudo identificar el negocio anunciante.",
    );
  }

  const businessId =
    campaignStorageContext.advertiser_business_id;

  const {
    data: currentAsset,
    error: currentAssetError,
  } = await supabase
    .from("ad_assets")
    .select(
      "id, storage_bucket, storage_path",
    )
    .eq("campaign_id", campaignId)
    .single();

  if (currentAssetError || !currentAsset) {
    redirectAdEditError(
      campaignId,
      "No se pudo localizar la imagen actual del anuncio.",
    );
  }

  const imageFile = getAdImageFile(
    formData,
    "imageFile",
  );

  let storageBucket =
    currentAsset.storage_bucket;

  let storagePath =
    currentAsset.storage_path;

  let uploadedStoragePath: string | null = null;

  if (imageFile) {
    const imageValidationError =
      getAdImageValidationError(imageFile);

    if (imageValidationError) {
      redirectAdEditError(
        campaignId,
        imageValidationError,
      );
    }

    const newStoragePath =
      createAdStoragePath(
        businessId,
        imageFile,
      );

    const { error: uploadError } =
      await supabase.storage
        .from(AD_ASSETS_BUCKET)
        .upload(
          newStoragePath,
          imageFile,
          {
            contentType: imageFile.type,
            upsert: false,
          },
        );

    if (uploadError) {
      redirectAdEditError(
        campaignId,
        `No se pudo subir la nueva imagen: ${uploadError.message}`,
      );
    }

    storageBucket = AD_ASSETS_BUCKET;
    storagePath = newStoragePath;
    uploadedStoragePath = newStoragePath;
  }

  if (
    storageBucket !== AD_ASSETS_BUCKET ||
    !storagePath
  ) {
    redirectAdEditError(
      campaignId,
      "Este anuncio todavía utiliza una imagen antigua. Selecciona un archivo nuevo antes de reenviarlo.",
    );
  }

  const { error } = await supabase.rpc(
    "resubmit_ad_request_storage",
    {
      p_campaign_id: campaignId,
      p_title: title,
      p_description:
        description || null,
      p_requested_days: requestedDays,
      p_start_mode: startMode,
      p_requested_start_at:
        requestedStartAt,
      p_target_kind: targetKind,
      p_target_contact_method_id:
        targetContactMethodId,
      p_storage_bucket: storageBucket,
      p_storage_path: storagePath,
    },
  );

  if (error) {
    if (uploadedStoragePath) {
      await cleanupAdStorageObject(
        supabase,
        businessId,
        AD_ASSETS_BUCKET,
        uploadedStoragePath,
      );
    }

    redirectAdEditError(
      campaignId,
      error.message ||
        "No se pudo reenviar el anuncio.",
    );
  }

  if (
    uploadedStoragePath &&
    currentAsset.storage_bucket &&
    currentAsset.storage_path
  ) {
    await cleanupAdStorageObject(
      supabase,
      businessId,
      currentAsset.storage_bucket,
      currentAsset.storage_path,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath(
    "/dashboard/admin/anuncios",
  );

  redirect(
    "/dashboard/anuncios?message=" +
      encodeURIComponent(
        "El anuncio fue corregido y enviado nuevamente a revisión.",
      ),
  );
}



export async function submitOwnerInterstitialAdRequest(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para solicitar un anuncio.",
    };
  }

  const businessId = String(
    formData.get("businessId") ?? "",
  ).trim();

  const title = String(
    formData.get("title") ?? "",
  ).trim();

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const requestedDaysRaw = String(
    formData.get("requestedDays") ?? "",
  ).trim();

  const startMode = String(
    formData.get("startMode") ?? "",
  ).trim();

  const requestedStartValue = String(
    formData.get("requestedStartAt") ?? "",
  ).trim();

  const targetChoice = String(
    formData.get("targetChoice") ?? "",
  ).trim();

  const assetMode = String(
    formData.get("assetMode") ?? "",
  ).trim();

  const storagePaths = formData
    .getAll("storagePaths")
    .map((value) => String(value).trim())
    .filter(Boolean);

  async function cleanupUploadedAssets() {
    if (
      !businessId ||
      storagePaths.length === 0
    ) {
      return;
    }

    const expectedPrefix =
      `${businessId}/campaigns/interstitial/`;

    const safePaths = Array.from(
      new Set(
        storagePaths.filter((storagePath) =>
          storagePath.startsWith(expectedPrefix),
        ),
      ),
    );

    if (safePaths.length === 0) {
      return;
    }

    await supabase.storage
      .from(AD_ASSETS_BUCKET)
      .remove(safePaths);
  }

  async function fail(message: string) {
    await cleanupUploadedAssets();

    return {
      ok: false,
      error: message,
    };
  }

  if (!businessId) {
    return fail(
      "No se pudo identificar el negocio anunciante.",
    );
  }

  if (
    title.length < 3 ||
    title.length > 120
  ) {
    return fail(
      "El título debe tener entre 3 y 120 caracteres.",
    );
  }

  if (description.length > 500) {
    return fail(
      "La descripción no puede superar 500 caracteres.",
    );
  }

  const requestedDays =
    Number(requestedDaysRaw);

  if (
    !Number.isInteger(requestedDays) ||
    requestedDays < 1
  ) {
    return fail(
      "La duración debe ser de al menos un día.",
    );
  }

  if (
    startMode !== "asap" &&
    startMode !== "scheduled"
  ) {
    return fail(
      "La opción de inicio seleccionada no es válida.",
    );
  }

  let requestedStartAt:
    string | null = null;

  if (startMode === "scheduled") {
    const validFormat =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(
        requestedStartValue,
      );

    if (!validFormat) {
      return fail(
        "La fecha y hora de inicio no son válidas.",
      );
    }

    const withSeconds =
      requestedStartValue.length === 16
        ? `${requestedStartValue}:00`
        : requestedStartValue;

    const date = new Date(
      `${withSeconds}-06:00`,
    );

    if (Number.isNaN(date.getTime())) {
      return fail(
        "La fecha y hora de inicio no son válidas.",
      );
    }

    requestedStartAt =
      date.toISOString();
  }

  let targetKind = "";
  let targetContactMethodId:
    string | null = null;

  if (targetChoice === "business_page") {
    targetKind = "business_page";
  } else if (
    targetChoice.startsWith("contact:")
  ) {
    const contactId = targetChoice
      .slice("contact:".length)
      .trim();

    if (!contactId) {
      return fail(
        "El contacto seleccionado no es válido.",
      );
    }

    targetKind = "contact";
    targetContactMethodId =
      contactId;
  } else {
    return fail(
      "El destino seleccionado no es válido.",
    );
  }

  if (
    assetMode !== "images" &&
    assetMode !== "video"
  ) {
    return fail(
      "El formato del anuncio emergente no es válido.",
    );
  }

  if (assetMode === "images") {
    if (
      storagePaths.length < 1 ||
      storagePaths.length > 6
    ) {
      return fail(
        "La campaña emergente debe contener entre 1 y 6 imágenes.",
      );
    }
  }

  if (
    assetMode === "video" &&
    storagePaths.length !== 1
  ) {
    return fail(
      "La campaña emergente con video debe contener exactamente un archivo.",
    );
  }

  if (
    new Set(storagePaths).size !==
    storagePaths.length
  ) {
    return fail(
      "No puedes utilizar el mismo archivo más de una vez.",
    );
  }

  const expectedStoragePrefix =
    `${businessId}/campaigns/interstitial/`;

  if (
    storagePaths.some(
      (storagePath) =>
        !storagePath.startsWith(
          expectedStoragePrefix,
        ),
    )
  ) {
    return fail(
      "Uno de los archivos no pertenece al negocio seleccionado.",
    );
  }

  const { error } = await supabase.rpc(
    "submit_interstitial_ad_request_storage",
    {
      p_business_id:
        businessId,

      p_title:
        title,

      p_description:
        description || null,

      p_requested_days:
        requestedDays,

      p_start_mode:
        startMode,

      p_requested_start_at:
        requestedStartAt,

      p_target_kind:
        targetKind,

      p_target_contact_method_id:
        targetContactMethodId,

      p_asset_mode:
        assetMode,

      p_storage_paths:
        storagePaths,
    },
  );

  if (error) {
    await cleanupUploadedAssets();

    return {
      ok: false,
      error:
        error.message ||
        "No se pudo enviar la campaña emergente a revisión.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath(
    "/dashboard/admin/anuncios",
  );

  return {
    ok: true,
    error: null,
  };
}



export async function resubmitOwnerInterstitialAdRequest(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para corregir el anuncio.",
    };
  }

  const campaignId = String(
    formData.get("campaignId") ?? "",
  ).trim();

  if (!campaignId) {
    return {
      ok: false,
      error: "No se recibió el identificador del anuncio.",
    };
  }

  const {
    data: campaign,
    error: campaignError,
  } = await supabase
    .from("ad_campaigns")
    .select(
      "id, advertiser_business_id, campaign_type, status, correction_requested_at",
    )
    .eq("id", campaignId)
    .single();

  if (
    campaignError ||
    !campaign
  ) {
    return {
      ok: false,
      error: "No se encontró el anuncio.",
    };
  }

  if (
    campaign.campaign_type !==
    "interstitial"
  ) {
    return {
      ok: false,
      error:
        "Este flujo sólo admite campañas emergentes.",
    };
  }

  if (
    campaign.status !== "draft" ||
    !campaign.correction_requested_at
  ) {
    return {
      ok: false,
      error:
        "Este anuncio no está disponible para correcciones.",
    };
  }

  const businessId =
    campaign.advertiser_business_id;

  if (!businessId) {
    return {
      ok: false,
      error:
        "El anuncio no tiene un negocio anunciante válido.",
    };
  }

  const {
    data: business,
    error: businessError,
  } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .eq("status", "published")
    .eq("is_published", true)
    .single();

  if (
    businessError ||
    !business
  ) {
    return {
      ok: false,
      error:
        "El negocio ya no está disponible para publicidad.",
    };
  }

  const {
    data: currentAssetsRaw,
    error: currentAssetsError,
  } = await supabase
    .from("ad_assets")
    .select(
      "storage_bucket, storage_path",
    )
    .eq("campaign_id", campaignId);

  if (currentAssetsError) {
    return {
      ok: false,
      error:
        "No se pudieron cargar los archivos actuales del anuncio.",
    };
  }

  const currentStoragePaths =
    (currentAssetsRaw ?? [])
      .filter(
        (asset) =>
          asset.storage_bucket ===
            AD_ASSETS_BUCKET &&
          Boolean(asset.storage_path),
      )
      .map(
        (asset) =>
          asset.storage_path as string,
      );

  const currentPathSet =
    new Set(currentStoragePaths);

  const storagePaths = formData
    .getAll("storagePaths")
    .map((value) =>
      String(value).trim(),
    )
    .filter(Boolean);

  const expectedStoragePrefix =
    `${businessId}/campaigns/interstitial/`;

  const newStoragePaths =
    Array.from(
      new Set(
        storagePaths.filter(
          (storagePath) =>
            !currentPathSet.has(
              storagePath,
            ) &&
            storagePath.startsWith(
              expectedStoragePrefix,
            ),
        ),
      ),
    );

  async function cleanupNewStorage() {
    if (
      newStoragePaths.length === 0
    ) {
      return;
    }

    await supabase.storage
      .from(AD_ASSETS_BUCKET)
      .remove(newStoragePaths);
  }

  async function fail(
    message: string,
  ) {
    await cleanupNewStorage();

    return {
      ok: false,
      error: message,
    };
  }

  const title = String(
    formData.get("title") ?? "",
  ).trim();

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const requestedDaysRaw = String(
    formData.get("requestedDays") ?? "",
  ).trim();

  const startMode = String(
    formData.get("startMode") ?? "",
  ).trim();

  const requestedStartValue = String(
    formData.get("requestedStartAt") ?? "",
  ).trim();

  const targetChoice = String(
    formData.get("targetChoice") ?? "",
  ).trim();

  const assetMode = String(
    formData.get("assetMode") ?? "",
  ).trim();

  if (
    title.length < 3 ||
    title.length > 120
  ) {
    return fail(
      "El título debe tener entre 3 y 120 caracteres.",
    );
  }

  if (description.length > 500) {
    return fail(
      "La descripción no puede superar 500 caracteres.",
    );
  }

  const requestedDays =
    Number(requestedDaysRaw);

  if (
    !Number.isInteger(requestedDays) ||
    requestedDays < 1
  ) {
    return fail(
      "La duración debe ser de al menos un día.",
    );
  }

  if (
    startMode !== "asap" &&
    startMode !== "scheduled"
  ) {
    return fail(
      "La opción de inicio seleccionada no es válida.",
    );
  }

  let requestedStartAt:
    string | null = null;

  if (startMode === "scheduled") {
    const validFormat =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(
        requestedStartValue,
      );

    if (!validFormat) {
      return fail(
        "La fecha y hora de inicio no son válidas.",
      );
    }

    const withSeconds =
      requestedStartValue.length === 16
        ? `${requestedStartValue}:00`
        : requestedStartValue;

    const date = new Date(
      `${withSeconds}-06:00`,
    );

    if (Number.isNaN(date.getTime())) {
      return fail(
        "La fecha y hora de inicio no son válidas.",
      );
    }

    requestedStartAt =
      date.toISOString();
  }

  let targetKind = "";
  let targetContactMethodId:
    string | null = null;

  if (
    targetChoice ===
    "business_page"
  ) {
    targetKind =
      "business_page";
  } else if (
    targetChoice.startsWith(
      "contact:",
    )
  ) {
    const contactId =
      targetChoice
        .slice(
          "contact:".length,
        )
        .trim();

    if (!contactId) {
      return fail(
        "El contacto seleccionado no es válido.",
      );
    }

    targetKind = "contact";
    targetContactMethodId =
      contactId;
  } else {
    return fail(
      "El destino seleccionado no es válido.",
    );
  }

  if (
    assetMode !== "images" &&
    assetMode !== "video"
  ) {
    return fail(
      "El formato del anuncio emergente no es válido.",
    );
  }

  if (
    assetMode === "images" &&
    (
      storagePaths.length < 1 ||
      storagePaths.length > 6
    )
  ) {
    return fail(
      "La campaña emergente debe contener entre 1 y 6 imágenes.",
    );
  }

  if (
    assetMode === "video" &&
    storagePaths.length !== 1
  ) {
    return fail(
      "La campaña emergente con video debe contener exactamente un archivo.",
    );
  }

  if (
    new Set(storagePaths).size !==
    storagePaths.length
  ) {
    return fail(
      "No puedes utilizar el mismo archivo más de una vez.",
    );
  }

  if (
    storagePaths.some(
      (storagePath) =>
        !storagePath.startsWith(
          expectedStoragePrefix,
        ),
    )
  ) {
    return fail(
      "Uno de los archivos no pertenece al negocio anunciante.",
    );
  }

  const { error } =
    await supabase.rpc(
      "resubmit_interstitial_ad_request_storage",
      {
        p_campaign_id:
          campaignId,

        p_title:
          title,

        p_description:
          description || null,

        p_requested_days:
          requestedDays,

        p_start_mode:
          startMode,

        p_requested_start_at:
          requestedStartAt,

        p_target_kind:
          targetKind,

        p_target_contact_method_id:
          targetContactMethodId,

        p_asset_mode:
          assetMode,

        p_storage_paths:
          storagePaths,
      },
    );

  if (error) {
    await cleanupNewStorage();

    return {
      ok: false,
      error:
        error.message ||
        "No se pudo reenviar la campaña emergente.",
    };
  }

  const submittedPathSet =
    new Set(storagePaths);

  const replacedOldPaths =
    currentStoragePaths.filter(
      (storagePath) =>
        !submittedPathSet.has(
          storagePath,
        ),
    );

  if (
    replacedOldPaths.length > 0
  ) {
    const {
      error: cleanupOldError,
    } = await supabase.storage
      .from(AD_ASSETS_BUCKET)
      .remove(
        replacedOldPaths,
      );

    if (cleanupOldError) {
      console.error(
        "No se pudieron eliminar archivos antiguos de la campaña emergente:",
        cleanupOldError.message,
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(
    "/dashboard/anuncios",
  );
  revalidatePath(
    "/dashboard/admin/anuncios",
  );

  return {
    ok: true,
    error: null,
  };
}


export async function reportOwnerAdPayment(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const campaignId = String(
    formData.get("campaignId") ?? "",
  ).trim();

  const reportedReference = String(
    formData.get("reportedReference") ?? "",
  ).trim();

  if (!campaignId) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "No se recibió el identificador del anuncio.",
        ),
    );
  }

  if (reportedReference.length < 3) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "Escribe el folio o referencia de tu transferencia.",
        ),
    );
  }

  if (reportedReference.length > 160) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "La referencia del pago es demasiado larga.",
        ),
    );
  }

  const { error } = await supabase.rpc(
    "report_ad_payment",
    {
      p_campaign_id: campaignId,
      p_reported_reference:
        reportedReference,
    },
  );

  if (error) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          error.message ||
            "No se pudo reportar el pago.",
        ),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath(
    "/dashboard/admin/anuncios",
  );

  redirect(
    "/dashboard/anuncios?message=" +
      encodeURIComponent(
        "Pago reportado correctamente. Un administrador verificará la transferencia.",
      ),
  );
}
