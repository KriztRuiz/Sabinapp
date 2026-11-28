"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function OwnerAdNotice({ message }: { message: string }) {
  const currentMessage = useSearchParams().get("message");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentMessage !== message || url.searchParams.get("message") !== message) {
      return;
    }

    url.searchParams.delete("message");
    window.history.replaceState(null, "", url);
  }, [currentMessage, message]);

  return (
    <section role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
      {message}
    </section>
  );
}
