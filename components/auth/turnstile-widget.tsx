"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "light";
      language: string;
      "response-field": boolean;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current !== null
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(
      containerRef.current,
      {
        sitekey: siteKey,
        theme: "light",
        language: "es",
        "response-field": true,
      },
    );
  }, [siteKey]);

  useEffect(() => {
    renderWidget();

    return () => {
      const widgetId = widgetIdRef.current;

      if (widgetId !== null) {
        window.turnstile?.remove(widgetId);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!siteKey) {
    return (
      <p className="text-sm text-red-700">
        La verificación de seguridad no está configurada.
      </p>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
    </div>
  );
}
