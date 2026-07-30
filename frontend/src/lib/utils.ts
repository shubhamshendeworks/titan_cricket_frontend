import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const CUSTOM_FONT_SIZES = [
  "body-xs", "body-sm", "body-md", "body-lg",
  "data-xs", "data-sm", "data-md", "data-lg", "data-hero",
  "heading-sm", "heading-md", "heading-lg", "heading-xl",
  "display-sm", "display-md", "display-lg", "display-xl", "display-hero",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: CUSTOM_FONT_SIZES }],
    },
  },
});

/** Merge Tailwind classes safely, resolving conflicts via tailwind-merge. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Truncate a string to maxLength characters. */
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

/** Convert a role string to a display-friendly label. */
export function roleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Get initials from a full name (max 2 chars). */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
