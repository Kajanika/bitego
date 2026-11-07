import type { QuantityUnit } from "@bitego/shared";

// Colours and sizes from the "BiteGo Mobile App Design" prototype (src/index.css), used by the seller screens.
// The rest of the app uses lib/theme.ts (owner: Kalindu), which is why this is a separate file.
export const color = {
  primary: "#C64F00",
  primaryDark: "#6E2900",
  mid: "#E0661A",
  light: "#F48A3F",
  tint: "#FFE5D0",
  tintSoft: "#FFF3E8",
  amber: "#EBA42E",
  amberTint: "#FAEBC6",
  amberSoft: "#FFF8E6",
  warnText: "#8A5A0A",
  cream: "#FFF8EF",
  page: "#F1E9E1",
  surface: "#FFFFFF",
  surface2: "#F7F1EB",
  line: "#EDE4DB",
  lineStrong: "#E3D3C5",
  text: "#2E241B",
  muted: "#7A6E64",
  muted2: "#A39588",
  error: "#DC2626",
  errorTint: "#FEF2F2",
} as const;

export const shadow = {
  shadowColor: "#C64F00",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

// ---------- Text formatting ----------

export function formatMoney(value: number): string {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `Rs. ${text.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export const formatPrice = (value: number) => (value === 0 ? "FREE" : formatMoney(value));

export function savePercent(originalPrice: number, price: number): number {
  return originalPrice > 0 && price < originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
}

const UNIT_NAMES: Record<QuantityUnit, [string, string]> = {
  PORTION: ["portion", "portions"],
  PIECE: ["piece", "pieces"],
  PACK: ["pack", "packs"],
  KG: ["kg", "kg"],
};

export const formatQuantity = (quantity: number, unit: QuantityUnit) =>
  `${quantity} ${UNIT_NAMES[unit][quantity === 1 ? 0 : 1]}`;

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function formatDay(date: Date): string {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatWindow(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = startOfDay(start).getTime() === startOfDay(end).getTime();
  return sameDay
    ? `${formatDay(start)}, ${formatTime(start)} – ${formatTime(end)}`
    : `${formatDay(start)} ${formatTime(start)} – ${formatDay(end)} ${formatTime(end)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || "?").toUpperCase();
}
