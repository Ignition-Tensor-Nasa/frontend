import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const KPA_PER_PSI = 6.894757293168;

export function kpaToPsi(kpa: number): number {
  return kpa / KPA_PER_PSI;
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}

export function formatSignedDelta(
  current: number | null | undefined,
  baseline: number | null | undefined,
  decimals = 1,
  unit = "",
): string | null {
  if (
    current === null ||
    current === undefined ||
    baseline === null ||
    baseline === undefined ||
    !Number.isFinite(current) ||
    !Number.isFinite(baseline)
  ) {
    return null;
  }
  const diff = current - baseline;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
