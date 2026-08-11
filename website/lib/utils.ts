import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number with Indian locale (lakhs/crores). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Format a date for display. */
export function formatDate(dateStr: string, locale = "en-IN"): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Build a WhatsApp chat URL. */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
