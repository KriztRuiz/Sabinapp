"use client";

import type { PublicLandingContact } from "@/lib/landing/styles/types";
import type { LandingStyles } from "@/lib/landing/styles";
import { useState } from "react";

type ContactHubProps = {
  contacts: PublicLandingContact[];
  styles: LandingStyles["contactHub"];
};

function getContactIcon(type: string) {
  const icons: Record<string, string> = {
    whatsapp: "💬",
    phone: "📞",
    email: "✉️",
    facebook: "📘",
    instagram: "📸",
    tiktok: "🎵",
    x: "𝕏",
    messenger: "💬",
    website: "🌐",
    map: "📍",
    custom: "🔗",
  };

  return icons[type] ?? "🔗";
}

export function ContactHub({ contacts, styles }: ContactHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (contacts.length === 0) {
    return null;
  }

  return (
    <aside className={styles.wrapper}>
      {isOpen ? (
        <div className={styles.panel}>
          {contacts.slice(0, 5).map((contact) => (
            <a
              key={contact.id}
              href={contact.href}
              className={styles.item}
              target={
                contact.href.startsWith("http") &&
                !contact.href.startsWith("https://wa.me")
                  ? "_blank"
                  : undefined
              }
              rel={
                contact.href.startsWith("http") &&
                !contact.href.startsWith("https://wa.me")
                  ? "noreferrer"
                  : undefined
              }
            >
              <span>{getContactIcon(contact.type)}</span>

              <span>
                <span className="block text-sm font-bold">{contact.label}</span>
                <span className="block text-xs opacity-70">{contact.value}</span>
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.button}
        aria-expanded={isOpen}
        aria-controls="landing-contact-hub-panel"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        {isOpen ? "Cerrar contacto" : "Contactar ahora"}
      </button>
    </aside>
  );
}