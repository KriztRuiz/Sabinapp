// lib/landing/contact.ts

export function getContactIcon(type: string) {
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

export function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

type ExternalLinkProps = {
  target?: "_blank";
  rel?: "noopener noreferrer";
};

export function getExternalLinkProps(href: string): ExternalLinkProps {
  if (!isExternalHref(href)) {
    return {};
  }

  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}