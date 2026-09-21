"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  PublicAdCampaign,
} from "@/lib/ads/public-ads";

import {
  sendAdEvent,
} from "@/lib/ads/ad-events-client";

type Props = {
  campaign: PublicAdCampaign;
  onClose: () => void;
  trackMetrics?: boolean;
  businessId?: string | null;
};

const REQUIRED_SECONDS = 10;
const IMAGE_INTERVAL_MS = 2500;

function getSafeTargetUrl(
  value: string | null,
) {
  const url = value?.trim() ?? "";

  if (
    /^(https?:\/\/|tel:|mailto:)/i.test(url)
  ) {
    return url;
  }

  if (
    url.startsWith("/") &&
    !url.startsWith("//")
  ) {
    return url;
  }

  return null;
}

export function InterstitialAdModal({
  campaign,
  onClose,
  trackMetrics = false,
  businessId = null,
}: Props) {
  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(REQUIRED_SECONDS);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const registeredImpressionsRef = useRef(
    new Set<string>(),
  );

  const [isMuted, setIsMuted] = useState(true);

  const images =
    campaign.assets.filter(
      (asset) =>
        asset.type === "image",
    );

  const validImages =
    images.length >= 1 &&
    images.length <= 6 &&
    images.length ===
      campaign.assets.length;

  const validVideo =
    campaign.assets.length === 1 &&
    campaign.assets[0].type ===
      "video";

  const validCampaign =
    campaign.type ===
      "interstitial" &&
    (
      validImages ||
      validVideo
    );

  const canClose =
    remainingSeconds === 0;

  const activeImage =
    validImages
      ? images[
          activeIndex %
            images.length
        ]
      : null;

  const activeVideo =
    validVideo
      ? campaign.assets[0]
      : null;

  const targetUrl =
    getSafeTargetUrl(
      campaign.targetUrl,
    );

  const opensNewTab =
    targetUrl
      ? /^https?:\/\//i.test(targetUrl) ||
        targetUrl.startsWith("/")
      : false;

  function toggleSound() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextMuted = !video.muted;

    if (!nextMuted && video.volume === 0) {
      video.volume = 1;
    }

    video.muted = nextMuted;
    setIsMuted(nextMuted);
  }

  // -------------------------------------------------------
  // Contador obligatorio de 10 segundos.
  // -------------------------------------------------------

  useEffect(() => {
    if (!validCampaign) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setRemainingSeconds(
            (current) =>
              Math.max(
                0,
                current - 1,
              ),
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [validCampaign]);

  // -------------------------------------------------------
  // Rotación automática de imágenes.
  // -------------------------------------------------------

  useEffect(() => {
    if (
      !validImages ||
      images.length <= 1
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setActiveIndex(
            (current) =>
              (
                current + 1
              ) % images.length,
          );
        },
        IMAGE_INTERVAL_MS,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    validImages,
    images.length,
  ]);

  // -------------------------------------------------------
  // Impedir scroll del fondo mientras está abierto.
  // -------------------------------------------------------

  useEffect(() => {
    if (!validCampaign) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [validCampaign]);

  // -------------------------------------------------------
  // Escape funciona solamente después de 10 segundos.
  // -------------------------------------------------------

  useEffect(() => {
    if (
      !validCampaign ||
      !canClose
    ) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    validCampaign,
    canClose,
    onClose,
  ]);

  // -------------------------------------------------------
  // Archivo visible actualmente.
  //
  // En imágenes cambia durante la rotación.
  // En video permanece fijo.
  // -------------------------------------------------------

  const activeAsset =
    activeImage ?? activeVideo;

  // -------------------------------------------------------
  // Impresiones de Campaña B.
  //
  // Cada archivo se registra una sola vez durante
  // esta aparición del anuncio.
  // -------------------------------------------------------

  useEffect(() => {
    if (
      !trackMetrics ||
      !validCampaign ||
      !activeAsset
    ) {
      return;
    }

    const impressionKey =
      `${campaign.id}:${activeAsset.id}`;

    if (
      registeredImpressionsRef.current.has(
        impressionKey,
      )
    ) {
      return;
    }

    registeredImpressionsRef.current.add(
      impressionKey,
    );

    sendAdEvent({
      eventType: "impression",
      campaignId: campaign.id,
      assetId: activeAsset.id,
      pagePath: window.location.pathname,
      businessId,
    });
  }, [
    activeAsset,
    businessId,
    campaign.id,
    trackMetrics,
    validCampaign,
  ]);

  // -------------------------------------------------------
  // Clic publicitario.
  //
  // Un evento contiene:
  // - campaignId: clic total de la publicidad.
  // - assetId: imagen o video que recibió el clic.
  //
  // NO enviamos dos eventos por un mismo clic.
  // -------------------------------------------------------

  function handleAdClick() {
    if (
      !trackMetrics ||
      !validCampaign ||
      !activeAsset
    ) {
      return;
    }

    sendAdEvent({
      eventType: "click",
      campaignId: campaign.id,
      assetId: activeAsset.id,
      pagePath: window.location.pathname,
      businessId,
    });
  }

  if (!validCampaign) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interstitial-ad-title"
      aria-describedby="interstitial-ad-description"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6"
    >
      <section className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-7">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-800">
            Anuncio
          </span>

          <button
            type="button"
            disabled={!canClose}
            onClick={onClose}
            aria-label={
              canClose
                ? "Cerrar anuncio"
                : `Podrás cerrar el anuncio en ${remainingSeconds} segundos`
            }
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-black text-gray-950 transition enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {canClose
              ? "✕ Cerrar"
              : `Cerrar en ${remainingSeconds}s`}
          </button>
        </header>

        <div className="relative bg-gray-950">
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                activeImage.url
              }
              alt={
                activeImage.altText
              }
              className="mx-auto max-h-[50dvh] min-h-48 w-full object-contain"
            />
          ) : null}

          {activeVideo ? (
            <video
              ref={videoRef}
              src={
                activeVideo.url
              }
              autoPlay
              muted={isMuted}
              playsInline
              loop
              controls
              preload="metadata"
              onVolumeChange={(event) => {
                const video = event.currentTarget;

                setIsMuted(
                  video.muted || video.volume === 0,
                );
              }}
              className="mx-auto max-h-[50dvh] min-h-48 w-full object-contain"
            >
              Tu navegador no puede reproducir este video.
            </video>
          ) : null}

          {activeVideo ? (
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!isMuted}
              aria-label={
                isMuted
                  ? "Activar sonido del anuncio"
                  : "Silenciar anuncio"
              }
              className="absolute right-3 top-3 z-10 rounded-full border border-white/40 bg-black/85 px-5 py-3 text-sm font-black text-white shadow-xl backdrop-blur-sm transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:right-5 sm:top-5"
            >
              {isMuted
                ? "🔊 Activar sonido"
                : "🔇 Silenciar"}
            </button>
          ) : null}
        </div>

        {validImages &&
        images.length > 1 ? (
          <div className="flex justify-center gap-2 border-b border-gray-100 px-5 py-3">
            {images.map(
              (image, index) => (
                <button
                  key={
                    image.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      index,
                    )
                  }
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-current={
                    index ===
                    activeIndex %
                      images.length
                      ? "true"
                      : undefined
                  }
                  className={
                    index ===
                    activeIndex %
                      images.length
                      ? "h-2.5 w-8 rounded-full bg-violet-700"
                      : "h-2.5 w-2.5 rounded-full bg-gray-300"
                  }
                />
              ),
            )}
          </div>
        ) : null}

        <div className="space-y-4 p-5 sm:p-7">
          <h2
            id="interstitial-ad-title"
            className="text-2xl font-black text-gray-950"
          >
            {campaign.title}
          </h2>

          <p
            id="interstitial-ad-description"
            className="text-sm leading-6 text-gray-600"
          >
            {campaign.description ??
              "Conoce esta promoción local."}
          </p>

          {targetUrl ? (
            <a
              onClick={handleAdClick}
              href={
                targetUrl
              }
              target={
                opensNewTab
                  ? "_blank"
                  : undefined
              }
              rel={
                opensNewTab
                  ? "noopener noreferrer"
                  : undefined
              }
              className="inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-800"
            >
              {campaign.targetLabel ||
                "Ver negocio"}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
