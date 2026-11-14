import { X } from "lucide-react";
import { useExplorer } from "../context/ExplorerContext";
import { sanitizeFilters, type FilterFieldKey } from "../api/filters";
import { cn, formatNumber, kpaToPsi } from "../lib/utils";

interface Chip {
  id: string;
  field: FilterFieldKey;
  value?: string;
  label: string;
}

export function ActiveFilterChips() {
  const {
    committedFilters,
    removeCommittedFilter,
    resetAllFilters,
    highlightedFields,
  } = useExplorer();

  const clean = sanitizeFilters(committedFilters);
  const chips: Chip[] = [];

  for (const inv of clean.investigation ?? []) {
    chips.push({
      id: `inv-${inv}`,
      field: "investigation",
      value: inv,
      label: `Investigation: ${inv}`,
    });
  }
  for (const fuel of clean.fuel ?? []) {
    chips.push({
      id: `fuel-${fuel}`,
      field: "fuel",
      value: fuel,
      label: `Fuel: ${fuel}`,
    });
  }
  if (clean.o2_pct) {
    const { min, max } = clean.o2_pct;
    const text =
      min !== undefined && max !== undefined
        ? `${min}–${max}% O₂`
        : min !== undefined
          ? `≥ ${min}% O₂`
          : `≤ ${max}% O₂`;
    chips.push({
      id: "o2-range",
      field: "o2_pct",
      label: `O₂: ${text}`,
    });
  }
  if (clean.pressure_kpa) {
    const { min, max } = clean.pressure_kpa;
    const text =
      min !== undefined && max !== undefined
        ? `${min}–${max} kPa (${formatNumber(kpaToPsi(min), 1)}–${formatNumber(kpaToPsi(max), 1)} psi)`
        : min !== undefined
          ? `≥ ${min} kPa (≥ ${formatNumber(kpaToPsi(min), 1)} psi)`
          : max !== undefined
            ? `≤ ${max} kPa (≤ ${formatNumber(kpaToPsi(max), 1)} psi)`
            : "";
    chips.push({
      id: "pressure-range",
      field: "pressure_kpa",
      label: `Pressure: ${text}`,
    });
  }
  if (clean.z_st) {
    const { min, max } = clean.z_st;
    const text =
      min !== undefined && max !== undefined
        ? `${min}–${max}`
        : min !== undefined
          ? `≥ ${min}`
          : max !== undefined
            ? `≤ ${max}`
            : "";
    chips.push({
      id: "z-st-range",
      field: "z_st",
      label: `Z_st: ${text}`,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400">
        Active Filters:
      </span>
      {chips.map((chip) => {
        const highlighted = highlightedFields.includes(chip.field);
        return (
          <span
            key={chip.id}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
              highlighted
                ? "animate-assistant-highlight bg-cyan-500/20 border-cyan-300 text-cyan-100"
                : "bg-slate-900/90 border-slate-700/80 text-slate-200",
            )}
          >
            <span>{chip.label}</span>
            <button
              type="button"
              onClick={() => removeCommittedFilter(chip.field, chip.value)}
              aria-label={`Remove ${chip.label}`}
              className="rounded-full p-0.5 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={resetAllFilters}
        className="text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-4 ml-1 cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
}
