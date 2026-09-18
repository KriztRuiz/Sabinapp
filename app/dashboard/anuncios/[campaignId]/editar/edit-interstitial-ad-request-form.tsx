"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  type InterstitialAssetMode,
  uploadInterstitialAssets,
  validateInterstitialFiles,
} from "@/lib/ads/interstitial-storage-client";

import {
  resubmitOwnerInterstitialAdRequest,
} from "../../actions";

import type {
  EditAdContact,
} from "./edit-ad-request-form";

export type EditInterstitialAsset = {
  id: string;
  assetType: "image" | "video";
  storagePath: string;
  publicUrl: string;
};

type Props = {
  campaignId: string;
  businessId: string;
  businessName: string;

  title: string;
  description: string;

  requestedDays: number;

  startMode: string;
  requestedStartAt: string;

  targetChoice: string;

  contacts: EditAdContact[];

  correctionNotes: string;

  assets: EditInterstitialAsset[];
};

function getContactTypeLabel(
  type: string,
) {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    phone: "Teléfono",
    email: "Correo",
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
    messenger: "Messenger",
    website: "Sitio web",
    custom: "Contacto",
  };

  return labels[type] ?? "Contacto";
}

export function EditInterstitialAdRequestForm({
  campaignId,
  businessId,
  businessName,
  title,
  description,
  requestedDays,
  startMode: initialStartMode,
  requestedStartAt,
  targetChoice: initialTargetChoice,
  contacts,
  correctionNotes,
  assets,
}: Props) {
  const router = useRouter();

  const initialAssetMode:
    InterstitialAssetMode =
    assets[0]?.assetType === "video"
      ? "video"
      : "images";

  const [
    assetMode,
    setAssetMode,
  ] = useState<InterstitialAssetMode>(
    initialAssetMode,
  );

  const [
    replacementFiles,
    setReplacementFiles,
  ] = useState<File[]>([]);

  const [
    assetError,
    setAssetError,
  ] = useState<string | null>(
    null,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    days,
    setDays,
  ] = useState(requestedDays);

  const [
    startMode,
    setStartMode,
  ] = useState(initialStartMode);

  const [
    targetChoice,
    setTargetChoice,
  ] = useState(
    initialTargetChoice,
  );

  const totalPrice =
    Number.isFinite(days) &&
    days > 0
      ? days * 100
      : 0;

  function handleAssetModeChange(
    mode: InterstitialAssetMode,
  ) {
    setAssetMode(mode);
    setReplacementFiles([]);
    setAssetError(null);
  }

  function handleFilesChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const files =
      Array.from(
        event.target.files ?? [],
      );

    setReplacementFiles(files);

    if (files.length === 0) {
      setAssetError(null);
      return;
    }

    setAssetError(
      validateInterstitialFiles(
        files,
        assetMode,
      ),
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setAssetError(null);

    const form =
      event.currentTarget;

    const sourceFormData =
      new FormData(form);

    let storagePaths:
      string[] = [];

    if (
      replacementFiles.length > 0
    ) {
      const validationError =
        validateInterstitialFiles(
          replacementFiles,
          assetMode,
        );

      if (validationError) {
        setAssetError(
          validationError,
        );
        return;
      }
    } else {
      if (
        assetMode !==
        initialAssetMode
      ) {
        setAssetError(
          "Selecciona archivos nuevos para cambiar el formato de la campaña.",
        );
        return;
      }

      storagePaths =
        assets.map(
          (asset) =>
            asset.storagePath,
        );
    }

    setIsSubmitting(true);

    try {
      if (
        replacementFiles.length > 0
      ) {
        const uploadedAssets =
          await uploadInterstitialAssets({
            businessId,
            files:
              replacementFiles,
            mode:
              assetMode,
          });

        storagePaths =
          uploadedAssets.map(
            (asset) =>
              asset.storagePath,
          );
      }

      const requestFormData =
        new FormData();

      requestFormData.set(
        "campaignId",
        campaignId,
      );

      requestFormData.set(
        "title",
        String(
          sourceFormData.get(
            "title",
          ) ?? "",
        ),
      );

      requestFormData.set(
        "description",
        String(
          sourceFormData.get(
            "description",
          ) ?? "",
        ),
      );

      requestFormData.set(
        "requestedDays",
        String(
          sourceFormData.get(
            "requestedDays",
          ) ?? "",
        ),
      );

      requestFormData.set(
        "startMode",
        String(
          sourceFormData.get(
            "startMode",
          ) ?? "",
        ),
      );

      requestFormData.set(
        "requestedStartAt",
        String(
          sourceFormData.get(
            "requestedStartAt",
          ) ?? "",
        ),
      );

      requestFormData.set(
        "targetChoice",
        String(
          sourceFormData.get(
            "targetChoice",
          ) ?? "",
        ),
      );

      requestFormData.set(
        "assetMode",
        assetMode,
      );

      for (
        const storagePath
        of storagePaths
      ) {
        requestFormData.append(
          "storagePaths",
          storagePath,
        );
      }

      const result =
        await resubmitOwnerInterstitialAdRequest(
          requestFormData,
        );

      if (!result.ok) {
        setAssetError(
          result.error ??
            "No se pudo reenviar la campaña emergente.",
        );
        return;
      }

      router.push(
        "/dashboard/anuncios?message=" +
          encodeURIComponent(
            "Tu campaña emergente fue reenviada a revisión correctamente.",
          ),
      );

      router.refresh();
    } catch (error) {
      setAssetError(
        error instanceof Error
          ? error.message
          : "No se pudo reenviar la campaña emergente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-8"
    >
      <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
          Correcciones solicitadas
        </p>

        <h2 className="mt-2 text-xl font-black text-orange-950">
          Revisa las observaciones antes de reenviar
        </h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-orange-900">
          {correctionNotes}
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Negocio y contenido
        </h2>

        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-sm font-bold text-gray-700">
              Negocio anunciante
            </p>

            <p className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-black text-gray-950">
              {businessName}
            </p>
          </div>

          <label>
            <span className="text-sm font-bold text-gray-700">
              Título del anuncio
            </span>

            <input
              name="title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              defaultValue={title}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-gray-700">
              Descripción
            </span>

            <textarea
              name="description"
              maxLength={500}
              rows={4}
              defaultValue={
                description
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
          Campaña emergente
        </p>

        <h2 className="mt-2 text-xl font-black text-gray-950">
          Contenido del anuncio
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Puedes conservar los archivos actuales o reemplazar toda la composición.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {assets.map(
            (asset, index) => (
              <article
                key={asset.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <p className="text-sm font-black text-gray-950">
                  Archivo{" "}
                  {index + 1} ·{" "}
                  {asset.assetType ===
                  "video"
                    ? "Video"
                    : "Imagen"}
                </p>

                {asset.assetType ===
                "image" ? (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        asset.publicUrl
                      }
                      alt={`Archivo ${index + 1} de ${title}`}
                      className="max-h-72 w-full rounded-xl border border-gray-200 bg-white object-contain"
                    />
                  </div>
                ) : null}

                {asset.assetType ===
                "video" ? (
                  <video
                    src={
                      asset.publicUrl
                    }
                    controls
                    preload="metadata"
                    className="mt-3 max-h-96 w-full rounded-xl border border-gray-200 bg-black object-contain"
                  >
                    Tu navegador no puede reproducir este video.
                  </video>
                ) : null}
              </article>
            ),
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold text-gray-700">
            Formato de la nueva composición
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                handleAssetModeChange(
                  "images",
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                assetMode === "images"
                  ? "border-violet-600 bg-violet-50 ring-2 ring-violet-200"
                  : "border-gray-200 bg-white hover:border-violet-300"
              }`}
            >
              <span className="block font-black text-gray-950">
                Imágenes
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-600">
                De 1 a 6 JPEG, PNG o WebP. Máximo 1000 KB cada una.
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleAssetModeChange(
                  "video",
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                assetMode === "video"
                  ? "border-violet-600 bg-violet-50 ring-2 ring-violet-200"
                  : "border-gray-200 bg-white hover:border-violet-300"
              }`}
            >
              <span className="block font-black text-gray-950">
                Video
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-600">
                Exactamente 1 MP4 o WebM. Máximo 16000 KB.
              </span>
            </button>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-gray-700">
            {assetMode ===
            "images"
              ? "Nuevas imágenes"
              : "Nuevo video"}
          </span>

          <input
            key={assetMode}
            type="file"
            multiple={
              assetMode ===
              "images"
            }
            accept={
              assetMode ===
              "images"
                ? "image/jpeg,image/png,image/webp"
                : "video/mp4,video/webm"
            }
            onChange={
              handleFilesChange
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
          />

          <span className="mt-2 block text-xs leading-5 text-gray-500">
            Si no eliges archivos nuevos y mantienes el mismo formato, se conservarán los archivos actuales.
          </span>
        </label>

        {replacementFiles.length >
        0 ? (
          <p className="mt-3 text-sm font-semibold text-violet-800">
            {assetMode ===
            "images"
              ? `${replacementFiles.length} imagen${
                  replacementFiles.length ===
                  1
                    ? ""
                    : "es"
                } seleccionada${
                  replacementFiles.length ===
                  1
                    ? ""
                    : "s"
                }.`
              : "1 video seleccionado."}
          </p>
        ) : null}

        {assetError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {assetError}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Duración y precio
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          La campaña emergente cuesta $100 MXN por día.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="text-sm font-bold text-gray-700">
              Número de días
            </span>

            <input
              name="requestedDays"
              type="number"
              required
              min="1"
              step="1"
              value={days}
              onChange={(event) => {
                const value =
                  Number(
                    event.target
                      .value,
                  );

                setDays(
                  Number.isFinite(
                    value,
                  )
                    ? value
                    : 1,
                );
              }}
              className="mt-2 w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm"
            />
          </label>

          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total actualizado
            </p>

            <p className="mt-2 text-3xl font-black text-violet-950">
              $
              {totalPrice.toLocaleString(
                "es-MX",
              )}{" "}
              MXN
            </p>

            <p className="mt-1 text-xs font-semibold text-violet-700">
              {days > 0
                ? `${days} × $100`
                : "$100 por día"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Inicio solicitado
        </h2>

        <div className="mt-5 grid gap-3">
          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="asap"
              checked={
                startMode ===
                "asap"
              }
              onChange={() =>
                setStartMode(
                  "asap",
                )
              }
            />

            <span>
              <span className="block font-bold text-gray-950">
                Lo antes posible
              </span>

              <span className="mt-1 block text-sm text-gray-600">
                Empezará después de la aprobación y verificación del pago.
              </span>
            </span>
          </label>

          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="scheduled"
              checked={
                startMode ===
                "scheduled"
              }
              onChange={() =>
                setStartMode(
                  "scheduled",
                )
              }
            />

            <span className="font-bold text-gray-950">
              Elegir fecha y hora
            </span>
          </label>
        </div>

        {startMode ===
        "scheduled" ? (
          <label className="mt-5 block">
            <span className="text-sm font-bold text-gray-700">
              Nueva fecha y hora
            </span>

            <input
              name="requestedStartAt"
              type="datetime-local"
              required
              defaultValue={
                requestedStartAt
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:max-w-md"
            />
          </label>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Destino del anuncio
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Sigue limitado a la página o a los contactos públicos del mismo negocio.
        </p>

        <select
          name="targetChoice"
          required
          value={targetChoice}
          onChange={(event) =>
            setTargetChoice(
              event.target.value,
            )
          }
          className="mt-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950"
        >
          <option value="business_page">
            Página de{" "}
            {businessName}
          </option>

          {contacts.map(
            (contact) => (
              <option
                key={contact.id}
                value={`contact:${contact.id}`}
              >
                {getContactTypeLabel(
                  contact.type,
                )}{" "}
                · {contact.label} ·{" "}
                {contact.value}
              </option>
            ),
          )}
        </select>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-black text-blue-950">
          Volverá a revisión
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          Al reenviar, la campaña volverá a revisión administrativa. Todavía no se generará ningún pago.
        </p>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Reenviando..."
          : "Reenviar a revisión"}
      </button>
    </form>
  );
}
