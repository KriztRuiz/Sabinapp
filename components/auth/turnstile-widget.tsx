"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Status = "waiting" | "ready" | "expired" | "failed" | "slow";

const messages: Record<Status, string> = {
  waiting: "Esperando la verificación de seguridad…",
  ready: "Verificación completada.",
  expired: "La verificación venció. Vuelve a verificarte para continuar.",
  failed: "No se pudo completar la verificación. Comprueba tu conexión y vuelve a intentarlo.",
  slow: "La verificación está tardando. Puedes esperar o volver a intentarlo.",
};

type WidgetOptions = {
  sitekey: string;
  theme: "light";
  language: "es";
  size: "compact";
  retry: "never";
  "refresh-expired": "manual";
  "refresh-timeout": "manual";
  callback: (token: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  "timeout-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: WidgetOptions) => string;
      remove: (id: string) => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function TurnstileWidget({ submitLabel, className }: {
  submitLabel: string;
  className: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("waiting");
  const [attempt, setAttempt] = useState(0);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    let widgetId: string | undefined;
    let script: HTMLScriptElement | undefined;
    const timer = window.setTimeout(() => {
      if (active) setStatus(current => current === "waiting" ? "slow" : current);
    }, 30000);

    function update(next: Status) {
      if (active) {
        window.clearTimeout(timer);
        setStatus(next);
      }
    }

    function render() {
      if (!active || !container.current || !siteKey) return;
      if (!window.turnstile) {
        update("failed");
        return;
      }

      try {
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme: "light",
          language: "es",
          size: "compact",
          retry: "never",
          "refresh-expired": "manual",
          "refresh-timeout": "manual",
          callback: token => update(token ? "ready" : "failed"),
          "error-callback": () => { update("failed"); return true; },
          "expired-callback": () => update("expired"),
          "timeout-callback": () => update("expired"),
        });
      } catch {
        update("failed");
      }
    }

    if (window.turnstile) {
      render();
    } else {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      script.onerror = () => update("failed");
      document.head.append(script);
    }

    return () => {
      active = false;
      window.clearTimeout(timer);
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
      script?.remove();
    };
  }, [attempt]);

  function retry() {
    setStatus("waiting");
    setAttempt(current => current + 1);
  }

  return (
    <>
      <div ref={container} className="flex justify-center" />
      <p role="status" className="text-sm text-gray-700">
        {siteKey ? messages[status] : "La verificación de seguridad no está configurada."}
      </p>
      {siteKey && (status === "failed" || status === "expired" || status === "slow") && (
        <button type="button" onClick={retry} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">
          Reintentar verificación
        </button>
      )}
      <button type="submit" disabled={status !== "ready" || pending} className={className + " disabled:cursor-not-allowed disabled:opacity-60"}>
        {submitLabel}
      </button>
    </>
  );
}
