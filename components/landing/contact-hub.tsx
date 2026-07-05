"use client";

import {
  getContactIcon,
  getExternalLinkProps,
} from "@/lib/landing/contact";
import type { PublicLandingContact } from "@/lib/landing/styles/types";
import type { LandingStyles } from "@/lib/landing/styles";
import { useState } from "react";

type ContactHubProps = {
  contacts: PublicLandingContact[];
  styles: LandingStyles["contactHub"];
};

const CONTACT_HUB_PANEL_ID = "landing-contact-hub-panel";

export function ContactHub({ contacts, styles }: ContactHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (contacts.length === 0) {
    return null;
  }

  return (
    <aside className={styles.wrapper} aria-label="Opciones de contacto">
      {isOpen ? (
        <div id={CONTACT_HUB_PANEL_ID} className={styles.panel}>
          {contacts.map((contact) => (
            <a
              key={contact.id}
              href={contact.href}
              className={styles.item}
              {...getExternalLinkProps(contact.href)}
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
          ))}
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