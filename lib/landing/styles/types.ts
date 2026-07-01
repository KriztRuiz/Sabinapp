//import type { LandingVisualMode } from "@/lib/landing/styles/types.tsx";

export type PublicLandingContact = {
  id: string;
  type: string;
  label: string;
  value: string;
  href: string;
  isPrimary: boolean;
};

export type PublicLandingPhoto = {
  id: string;
  type: string;
  src: string;
  alt: string;
  isCover: boolean;
};

export type PublicLandingHour = {
  id: string;
  dayOfWeek: number;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  notes: string | null;
};

export type PublicLandingItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  showPrice: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type PublicLandingLocation = {
  id: string;
  locationType: string;
  addressText: string | null;
  neighborhood: string | null;
  referenceNotes: string | null;
  serviceAreaText: string | null;
  mapUrl: string | null;
};

export type PublicLandingData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  category: string;
  businessType: string;
  visualMode: LandingVisualMode;
  contacts: PublicLandingContact[];
  photos: PublicLandingPhoto[];
  hours: PublicLandingHour[];
  locations: PublicLandingLocation[];
  items: PublicLandingItem[];
  tags: string[];
};

export type LandingVisualMode =
  | "classic"
  | "modern"
  | "warm"
  | "compact"
  | "elegant"
  | "impact";

export type LandingStyles = {
  page: string;
  background: string;
  container: string;
  nav: string;
  navPill: string;
  badge: string;
  heading: string;
  text: string;
  mutedText: string;
  sectionLabel: string;
  heroGrid: string;
  heroImageCard: string;
  heroImage: string;
  heroOverlay: string;
  card: string;
  featuredCard: string;
  galleryCard: string;
  buttonPrimary: string;
  buttonSecondary: string;
  tag: string;
  price: string;
  divider: string;
  contactHub: {
    wrapper: string;
    panel: string;
    item: string;
    button: string;
  };
};