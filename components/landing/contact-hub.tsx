"use client";

import type { PublicLandingContact } from "@/lib/landing/styles/types";
import type { LandingStyles } from "@/lib/landing/styles";
import { useState } from "react";

type ContactHubProps = {
  contacts: PublicLandingContact[];
  styles: LandingStyles["contactHub"];
};

const CONTACT_HUB_PANEL_ID = "landing-contact-hub-panel";

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

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function ContactHub({ contacts, styles }: ContactHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (contacts.length === 0) {
    return null;
  }

  return (
    <aside className={styles.wrapper} aria-label="Opciones de contacto">
      {isOpen ? (
        <div id={CONTACT_HUB_PANEL_ID} className={styles.panel}>
          {contacts.map((contact) => {
            const isExternal = isExternalHref(contact.href);

            return (
              <a
                key={contact.id}
                href={contact.href}
                className={styles.item}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                <span aria-hidden="true">{getContactIcon(contact.type)}</span>

                <span>
                  <span className="block text-sm font-bold">
                    {contact.label}
                  </span>

                  <span className="block text-xs opacity-70">
                    {contact.value}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.button}
        aria-expanded={isOpen}
        aria-controls={CONTACT_HUB_PANEL_ID}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        {isOpen ? "Cerrar contacto" : "Contactar ahora"}
      </button>
    </aside>
  );
}