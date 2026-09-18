"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import {
  uploadInterstitialAssets,
  validateInterstitialFiles,
} from "@/lib/ads/interstitial-storage-client";

import {
  submitOwnerAdRequest,
  submitOwnerInterstitialAdRequest,
} from "../actions";

export type AdContactOption = {
  id: string;
  type: string;
  label: string;
  value: string;
};

export type AdBusinessOption = {
  id: string;
  name: string;
  slug: string;
  contacts: AdContactOption[];
};

type Props = {
  businesses: AdBusinessOption[];
};

function SubmitButton({
  isSubmittingInterstitial,
}: {
  isSubmittingInterstitial: boolean;
}) {
  const { pending } = useFormStatus();

  const isSubmitting =
    pending || isSubmittingInterstitial;

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting
        ? "Enviando solicitud..."
        : "Enviar anuncio a revisión"}
    </button>
  );
}

function getContactTypeLabel(type: string) {
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

export function AdRequestForm({ businesses }: Props) {
  const router = useRouter();

  const [campaignType, setCampaignType] =
    useState<"fixed_banner" | "interstitial">(
      "fixed_banner",
    );

  const [businessId, setBusinessId] = useState(
    businesses[0]?.id ?? "",
  );

  const [requestedDays, setRequestedDays] = useState(1);
  const [startMode, setStartMode] = useState("asap");
  const [targetChoice, setTargetChoice] =
    useState("business_page");

  const [
    assetMode,
    setAssetMode,
  ] = useState<"images" | "video">(
    "images",
  );

  const [
    interstitialFiles,
    setInterstitialFiles,
  ] = useState<File[]>([]);

  const [
    interstitialError,
    setInterstitialError,
  ] = useState<string | null>(null);

  const [
    isSubmittingInterstitial,
    setIsSubmittingInterstitial,
  ] = useState(false);

  const selectedBusiness = useMemo(
    () =>
      businesses.find(
        (business) => business.id === businessId,
      ) ?? businesses[0],
    [businessId, businesses],
  );

  const dailyPrice =
    campaignType === "interstitial"
      ? 100
      : 50;

  const totalPrice =
    Number.isFinite(requestedDays) &&
    requestedDays > 0
      ? requestedDays * dailyPrice
      : 0;

  function handleBusinessChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setBusinessId(event.target.value);
    setTargetChoice("business_page");
  }

  function handleInterstitialFilesChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    setInterstitialFiles(files);

    setInterstitialError(
      validateInterstitialFiles(
        files,
        assetMode,
      ),
    );
  }

  function handleAssetModeChange(
    mode: "images" | "video",
  ) {
    setAssetMode(mode);
    setInterstitialFiles([]);
    setInterstitialError(null);
  }

  async function handleInterstitialSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    if (campaignType !== "interstitial") {
      return;
    }

    event.preventDefault();

    if (isSubmittingInterstitial) {
      return;
    }

    const validationError =
      validateInterstitialFiles(
        interstitialFiles,
        assetMode,
      );

    if (validationError) {
      setInterstitialError(
        validationError,
      );

      return;
    }

    const sourceFormData =
      new FormData(event.currentTarget);

    setInterstitialError(null);
    setIsSubmittingInterstitial(true);

    try {
      const uploadedAssets =
        await uploadInterstitialAssets({
          businessId,
          files: interstitialFiles,
          mode: assetMode,
        });

      const requestFormData =
        new FormData();

      const stringFields = [
        "businessId",
        "title",
        "description",
        "requestedDays",
        "startMode",
        "requestedStartAt",
        "targetChoice",
      ];

      for (const field of stringFields) {
        const value =
          sourceFormData.get(field);

        if (typeof value === "string") {
          requestFormData.set(
            field,
            value,
          );
        }
      }

      requestFormData.set(
        "assetMode",
        assetMode,
      );

      for (const asset of uploadedAssets) {
        requestFormData.append(
          "storagePaths",
          asset.storagePath,
        );
      }

      const result =
        await submitOwnerInterstitialAdRequest(
          requestFormData,
        );

      if (!result.ok) {
        setInterstitialError(
          result.error ??
            "No se pudo enviar la campaña emergente.",
        );

        return;
      }

      router.push(
        "/dashboard/anuncios?message=" +
          encodeURIComponent(
            "Tu campaña emergente fue enviada a revisión correctamente.",
          ),
      );

      router.refresh();
    } catch (error) {
      setInterstitialError(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la campaña emergente.",
      );
    } finally {
      setIsSubmittingInterstitial(false);
    }
  }

  return (
    <form
      action={
        campaignType === "fixed_banner"
          ? submitOwnerAdRequest
          : undefined
      }
      onSubmit={
        campaignType === "interstitial"
          ? handleInterstitialSubmit
          : undefined
      }
      className="mt-8 space-y-8"
    >
      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Tipo de publicidad
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-700">
          Elige cómo quieres promocionar tu negocio.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setCampaignType("fixed_banner");
              setInterstitialError(null);
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              campaignType === "fixed_banner"
                ? "border-violet-600 bg-white ring-2 ring-violet-200"
                : "border-violet-200 bg-violet-50 hover:bg-white"
            }`}
          >
            <span className="block text-lg font-black text-gray-950">
              Campaña A
            </span>

            <span className="mt-1 block text-sm font-bold text-violet-800">
              Anuncio fijo
            </span>

            <span className="mt-3 block text-sm text-gray-700">
              $50 MXN por día
            </span>

            <span className="mt-1 block text-xs text-gray-500">
              Una imagen en espacios fijos de Sabinapp.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCampaignType("interstitial");
              setInterstitialError(null);
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              campaignType === "interstitial"
                ? "border-violet-600 bg-white ring-2 ring-violet-200"
                : "border-violet-200 bg-violet-50 hover:bg-white"
            }`}
          >
            <span className="block text-lg font-black text-gray-950">
              Campaña B
            </span>

            <span className="mt-1 block text-sm font-bold text-violet-800">
              Anuncio emergente
            </span>

            <span className="mt-3 block text-sm text-gray-700">
              $100 MXN por día
            </span>

            <span className="mt-1 block text-xs text-gray-500">
              De 1 a 6 imágenes. El video se habilitará en la siguiente fase.
            </span>
          </button>
        </div>

        {interstitialError ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {interstitialError}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Negocio y contenido
        </h2>

        <div className="mt-6 grid gap-5">
          <label>
            <span className="text-sm font-bold text-gray-700">
              Negocio anunciante
            </span>

            <select
              name="businessId"
              required
              value={businessId}
              onChange={handleBusinessChange}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950"
            >
              {businesses.map((business) => (
                <option
                  key={business.id}
                  value={business.id}
                >
                  {business.name}
                </option>
              ))}
            </select>
          </label>

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
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Ej. Tacos al pastor este fin de semana"
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
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Describe brevemente lo que quieres promocionar."
            />
          </label>

          {campaignType === "fixed_banner" ? (
            <label>
              <span className="text-sm font-bold text-gray-700">
                Imagen del anuncio
              </span>

              <input
                name="imageFile"
                type="file"
                required
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />

              <span className="mt-2 block text-xs leading-5 text-gray-500">
                JPEG, PNG o WebP. Máximo 1000 KB. Esta campaña utiliza exactamente una imagen.
              </span>
            </label>
          ) : (
            <div>
              <span className="text-sm font-bold text-gray-700">
                Contenido del anuncio emergente
              </span>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAssetModeChange("images")
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
                    handleAssetModeChange("video")
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

              <label className="mt-5 block">
                <span className="text-sm font-bold text-gray-700">
                  {assetMode === "images"
                    ? "Imágenes del anuncio"
                    : "Video del anuncio"}
                </span>

                <input
                  key={assetMode}
                  type="file"
                  multiple={assetMode === "images"}
                  accept={
                    assetMode === "images"
                      ? "image/jpeg,image/png,image/webp"
                      : "video/mp4,video/webm"
                  }
                  onChange={handleInterstitialFilesChange}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />

                <span className="mt-2 block text-xs leading-5 text-gray-500">
                  {assetMode === "images"
                    ? "Selecciona de 1 a 6 imágenes. Máximo 1000 KB por imagen."
                    : "Selecciona exactamente un video MP4 o WebM. Máximo 16000 KB."}
                </span>

                {interstitialFiles.length > 0 ? (
                  <span className="mt-2 block text-sm font-semibold text-violet-800">
                    {assetMode === "images"
                      ? `${interstitialFiles.length} imagen${
                          interstitialFiles.length === 1
                            ? ""
                            : "es"
                        } seleccionada${
                          interstitialFiles.length === 1
                            ? ""
                            : "s"
                        }.`
                      : "1 video seleccionado."}
                  </span>
                ) : null}
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Duración y precio
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          El precio es fijo: ${dailyPrice} MXN por día.
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
              value={requestedDays}
              onChange={(event) => {
                const value = Number(event.target.value);

                setRequestedDays(
                  Number.isFinite(value) ? value : 1,
                );
              }}
              className="mt-2 w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm"
            />
          </label>

          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total estimado
            </p>

            <p className="mt-2 text-3xl font-black text-violet-950">
              ${totalPrice.toLocaleString("es-MX")} MXN
            </p>

            <p className="mt-1 text-xs font-semibold text-violet-700">
              {requestedDays > 0
                ? `${requestedDays} × $${dailyPrice}`
                : `$${dailyPrice} por día`}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-600">
          El precio definitivo se calcula nuevamente en el
          servidor. No se realizará ningún cobro hasta que el
          anuncio haya sido revisado y aprobado.
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Cuándo quieres que empiece
        </h2>

        <div className="mt-5 grid gap-3">
          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="asap"
              checked={startMode === "asap"}
              onChange={() => setStartMode("asap")}
            />

            <span>
              <span className="block font-bold text-gray-950">
                Lo antes posible
              </span>

              <span className="mt-1 block text-sm text-gray-600">
                Empezará después de ser aprobado y de que el
                pago sea verificado.
              </span>
            </span>
          </label>

          <label className="flex gap-3 rounded-2xl border border-gray-200 p-4">
            <input
              type="radio"
              name="startMode"
              value="scheduled"
              checked={startMode === "scheduled"}
              onChange={() => setStartMode("scheduled")}
            />

            <span>
              <span className="block font-bold text-gray-950">
                Elegir fecha y hora
              </span>

              <span className="mt-1 block text-sm text-gray-600">
                Sabinapp intentará iniciar el anuncio en el
                momento solicitado.
              </span>
            </span>
          </label>
        </div>

        {startMode === "scheduled" ? (
          <label className="mt-5 block">
            <span className="text-sm font-bold text-gray-700">
              Fecha y hora solicitadas
            </span>

            <input
              name="requestedStartAt"
              type="datetime-local"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm sm:max-w-md"
            />
          </label>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Destino del anuncio
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          El anuncio sólo puede llevar a la página o a los
          contactos públicos del negocio seleccionado.
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-gray-700">
            Al tocar el anuncio
          </span>

          <select
            name="targetChoice"
            required
            value={targetChoice}
            onChange={(event) =>
              setTargetChoice(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950"
          >
            <option value="business_page">
              Página de {selectedBusiness?.name ?? "mi negocio"}
            </option>

            {(selectedBusiness?.contacts ?? []).map(
              (contact) => (
                <option
                  key={contact.id}
                  value={`contact:${contact.id}`}
                >
                  {getContactTypeLabel(contact.type)} ·{" "}
                  {contact.label} · {contact.value}
                </option>
              ),
            )}
          </select>
        </label>

        {(selectedBusiness?.contacts ?? []).length === 0 ? (
          <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-900">
            Este negocio no tiene contactos públicos compatibles.
            Puedes utilizar su página como destino.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-black text-blue-950">
          Primero revisaremos el anuncio
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          Al enviarlo no se publicará ni tendrás que pagar
          todavía. Un administrador revisará el contenido y
          podrá aprobarlo, rechazarlo o solicitar correcciones.
        </p>
      </section>

      <SubmitButton
        isSubmittingInterstitial={
          isSubmittingInterstitial
        }
      />
    </form>
  );
}
