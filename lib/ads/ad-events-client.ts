"use client";

type AdMetricEventType = "impression" | "click";

type SendAdEventParams = {
  eventType: AdMetricEventType;
  campaignId: string;
  assetId: string;
  pagePath: string;
  businessId?: string | null;
};

function getAdSessionKey() {
  const storageKey = "sabinapp_ad_session_key";

  try {
    const existingKey = window.sessionStorage.getItem(storageKey);

    if (existingKey) {
      return existingKey;
    }

    const newKey =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.sessionStorage.setItem(storageKey, newKey);

    return newKey;
  } catch {
    return null;
  }
}

export function sendAdEvent({
  eventType,
  campaignId,
  assetId,
  pagePath,
  businessId = null,
}: SendAdEventParams) {
  const payload = {
    eventType,
    campaignId,
    assetId,
    pagePath,
    businessId,
    sessionKey: getAdSessionKey(),
  };

  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], {
        type: "application/json",
      });

      const didQueue = navigator.sendBeacon("/api/ads/events", blob);

      if (didQueue) {
        return;
      }
    }

    void fetch("/api/ads/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  } catch (error) {
    console.error("Error sending ad event:", error);
  }
}

