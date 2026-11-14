import { useMemo } from "react";
import { AlertCircle, Check, Filter, RotateCcw, Zap } from "lucide-react";
import { useExplorer } from "../context/ExplorerContext";
import {
  filtersEqual,
  sanitizeFilters,
  validateFilters,
  type FilterFieldKey,
} from "../api/filters";
import type { Filters, Range } from "../api/types";
import { cn, formatNumber, kpaToPsi } from "../lib/utils";

const QUICK_PRESETS: { id: string; label: string; filters: Filters }[] = [
  {
    id: "earth-like",
    label: "Earth-like (20–22% O₂, 95–105 kPa)",
    filters: {
      o2_pct: { min: 20, max: 22 },
      pressure_kpa: { min: 95, max: 105 },
    },
  },
  {
    id: "low-pressure",
    label: "Low Pressure (45–55 kPa)",
    filters: { pressure_kpa: { min: 45, max: 55 } },
  },
  {
    id: "high-zst",
    label: "High Z_st (≥ 0.25)",
    filters: { z_st: { min: 0.25 } },
  },
  {
    id: "flex-droplets",
    label: "CFI (FLEX) Droplets",
    filters: { investigation: ["CFI (FLEX)"] },
  },
];

export function FilterRail() {
  const {
    filterOptions,
    optionsLoading,
    optionsError,
    reloadOptions,
    draftFilters,
    setDraftFilters,
    committedFilters,
    applyFilters,
    resetAllFilters,
    highlightedFields,
  } = useExplorer();

  const validation = useMemo(() => validateFilters(draftFilters), [draftFilters]);
  const hasValidationError = Boolean(
    validation.o2_pct || validation.pressure_kpa || validation.z_st,
  );
  const hasPendingChanges = !filtersEqual(draftFilters, committedFilters);
  const hasAnyFilter =
    Object.keys(sanitizeFilters(draftFilters)).length > 0 ||
    Object.keys(sanitizeFilters(committedFilters)).length > 0;

  const isHighlighted = (field: FilterFieldKey) =>
    highlightedFields.includes(field);

  const toggleCategory = (field: "investigation" | "fuel", item: string) => {
    setDraftFilters((prev) => {
      const current = prev[field] ?? [];
      const exists = current.includes(item);
      const nextList = exists
        ? current.filter((v) => v !== item)
        : [...current, item];
      const next = { ...prev };
      if (nextList.length > 0) next[field] = nextList;
      else delete next[field];
      return next;
    });
  };

  const updateRangeBound = (
    field: "o2_pct" | "pressure_kpa" | "z_st",
    bound: "min" | "max",
    raw: string,
  ) => {
    setDraftFilters((prev) => {
      const current: Range = { ...(prev[field] ?? {}) };
      if (raw.trim() === "") {
        delete current[bound];
      } else {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          current[bound] = parsed;
        }
      }
      const next = { ...prev };
      if (current.min === undefined && current.max === undefined) {
        delete next[field];
      } else {
        next[field] = current;
      }
      return next;
    });
  };

  const o2Bounds = filterOptions?.o2_pct ?? null;
  const pBounds = filterOptions?.pressure_kpa ?? null;
  const zBounds = filterOptions?.z_st ?? null;

  return (
    <aside className="panel-surface rounded-xl p-4 space-y-5 h-fit">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Test Parameters
          </h2>
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {optionsLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-lg bg-slate-800/60" />
          <div className="h-20 rounded-lg bg-slate-800/60" />
          <div className="h-24 rounded-lg bg-slate-800/60" />
        </div>
      )}

      {optionsError && !optionsLoading && (
        <div className="rounded-lg border border-rose-500/35 bg-rose-950/30 p-3 text-xs text-rose-200 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{optionsError}</span>
          </div>
          <button
            type="button"
            onClick={reloadOptions}
            className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-400/40 text-rose-100 hover:bg-rose-500/30 cursor-pointer"
          >
            Retry Options
          </button>
        </div>
      )}

      {!optionsLoading && filterOptions && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!hasValidationError) applyFilters();
          }}
          className="space-y-5"
        >
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Quick Presets
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => {
                const active = filtersEqual(committedFilters, preset.filters);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyFilters(preset.filters)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all text-left cursor-pointer",
                      active
                        ? "bg-cyan-500/20 border-cyan-400/70 text-cyan-100"
                        : "bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-100",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Investigation Selector */}
          {filterOptions.investigation.length > 0 && (
            <div
              className={cn(
                "rounded-lg p-2.5 border transition-colors",
                isHighlighted("investigation")
                  ? "animate-assistant-highlight border-cyan-400/70 bg-cyan-950/25"
                  : "border-slate-800/70 bg-slate-900/40",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">
                  Investigation
                </span>
                {draftFilters.investigation?.length ? (
                  <span className="text-[11px] font-mono-telemetry text-cyan-300">
                    {draftFilters.investigation.length} selected
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.investigation.map((inv) => {
                  const active = (draftFilters.investigation ?? []).includes(
                    inv,
                  );
                  return (
                    <button
                      key={inv}
                      type="button"
                      onClick={() => toggleCategory("investigation", inv)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer",
                        active
                          ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100"
                          : "bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-slate-500",
                      )}
                    >
                      {active && <Check className="h-3 w-3 text-cyan-300" />}
                      <span>{inv}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fuel Selector */}
          {filterOptions.fuel.length > 0 && (
            <div
              className={cn(
                "rounded-lg p-2.5 border transition-colors",
                isHighlighted("fuel")
                  ? "animate-assistant-highlight border-cyan-400/70 bg-cyan-950/25"
                  : "border-slate-800/70 bg-slate-900/40",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">
                  Fuel
                </span>
                {draftFilters.fuel?.length ? (
                  <span className="text-[11px] font-mono-telemetry text-orange-300">
                    {draftFilters.fuel.length} selected
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.fuel.map((fuel) => {
                  const active = (draftFilters.fuel ?? []).includes(fuel);
                  return (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => toggleCategory("fuel", fuel)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer",
                        active
                          ? "bg-orange-500/20 border-orange-400/60 text-orange-100"
                          : "bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-slate-500",
                      )}
                    >
                      {active && <Check className="h-3 w-3 text-orange-300" />}
                      <span>{fuel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Oxygen Concentration (% O2) */}
          {o2Bounds && (
            <div
              className={cn(
                "rounded-lg p-2.5 border space-y-2.5 transition-colors",
                isHighlighted("o2_pct")
                  ? "animate-assistant-highlight border-cyan-400/70 bg-cyan-950/25"
                  : "border-slate-800/70 bg-slate-900/40",
              )}
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="o2-min-input"
                  className="text-xs font-medium text-slate-300"
                >
                  Oxygen Concentration (% O₂)
                </label>
                <span className="text-[11px] font-mono-telemetry text-slate-400">
                  obs {formatNumber(o2Bounds.min, 1)}–{formatNumber(o2Bounds.max, 1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Min (%)
                  </span>
                  <input
                    id="o2-min-input"
                    type="number"
                    step="0.5"
                    min={0}
                    max={100}
                    placeholder={formatNumber(o2Bounds.min, 1)}
                    value={draftFilters.o2_pct?.min ?? ""}
                    onChange={(e) =>
                      updateRangeBound("o2_pct", "min", e.target.value)
                    }
                    className="w-full rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-mono-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Max (%)
                  </span>
                  <input
                    id="o2-max-input"
                    type="number"
                    step="0.5"
                    min={0}
                    max={100}
                    placeholder={formatNumber(o2Bounds.max, 1)}
                    value={draftFilters.o2_pct?.max ?? ""}
                    onChange={(e) =>
                      updateRangeBound("o2_pct", "max", e.target.value)
                    }
                    className="w-full rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-mono-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Dual sliders for quick touch/mouse exploration */}
              <div className="space-y-1 pt-0.5">
                <input
                  type="range"
                  aria-label="Minimum O2 percent slider"
                  min={0}
                  max={100}
                  step={0.5}
                  value={draftFilters.o2_pct?.min ?? Math.floor(o2Bounds.min)}
                  onChange={(e) =>
                    updateRangeBound("o2_pct", "min", e.target.value)
                  }
                  className="w-full h-1.5 telemetry-slider cursor-pointer"
                />
                <input
                  type="range"
                  aria-label="Maximum O2 percent slider"
                  min={0}
                  max={100}
                  step={0.5}
                  value={draftFilters.o2_pct?.max ?? Math.ceil(o2Bounds.max)}
                  onChange={(e) =>
                    updateRangeBound("o2_pct", "max", e.target.value)
                  }
                  className="w-full h-1.5 telemetry-slider cursor-pointer"
                />
              </div>

              {validation.o2_pct && (
                <p className="text-[11px] text-rose-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {validation.o2_pct}
                </p>
              )}
            </div>
          )}

          {/* Pressure (kPa absolute + live psi conversion) */}
          {pBounds && (
            <div
              className={cn(
                "rounded-lg p-2.5 border space-y-2.5 transition-colors",
                isHighlighted("pressure_kpa")
                  ? "animate-assistant-highlight border-cyan-400/70 bg-cyan-950/25"
                  : "border-slate-800/70 bg-slate-900/40",
              )}
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="pressure-min-input"
                  className="text-xs font-medium text-slate-300"
                >
                  Pressure (kPa abs)
                </label>
                <span className="text-[11px] font-mono-telemetry text-slate-400">
                  obs {formatNumber(pBounds.min, 0)}–{formatNumber(pBounds.max, 0)} kPa
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Min (kPa)
                  </span>
                  <input
                    id="pressure-min-input"
                    type="number"
                    step="1"
                    min={0}
                    placeholder={formatNumber(pBounds.min, 0)}
                    value={draftFilters.pressure_kpa?.min ?? ""}
                    onChange={(e) =>
                      updateRangeBound("pressure_kpa", "min", e.target.value)
                    }
                    className="w-full rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-mono-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  {draftFilters.pressure_kpa?.min !== undefined && (
                    <span className="block text-[10px] font-mono-telemetry text-slate-500 mt-0.5">
                      ≈ {formatNumber(kpaToPsi(draftFilters.pressure_kpa.min), 2)} psi
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Max (kPa)
                  </span>
                  <input
                    id="pressure-max-input"
                    type="number"
                    step="1"
                    min={0}
                    placeholder={formatNumber(pBounds.max, 0)}
                    value={draftFilters.pressure_kpa?.max ?? ""}
                    onChange={(e) =>
                      updateRangeBound("pressure_kpa", "max", e.target.value)
                    }
                    className="w-full rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-mono-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  {draftFilters.pressure_kpa?.max !== undefined && (
                    <span className="block text-[10px] font-mono-telemetry text-slate-500 mt-0.5">
                      ≈ {formatNumber(kpaToPsi(draftFilters.pressure_kpa.max), 2)} psi
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1 pt-0.5">
                <input
                  type="range"
                  aria-label="Minimum pressure kPa slider"
                  min={0}
                  max={Math.max(350, Math.ceil(pBounds.max))}
                  step={5}
                  value={draftFilters.pressure_kpa?.min ?? Math.floor(pBounds.min)}
                  onChange={(e) =>
                    updateRangeBound("pressure_kpa", "min", e.target.value)
                  }
                  className="w-full h-1.5 telemetry-slider cursor-pointer"
                />
                <input
                  type="range"
                  aria-label="Maximum pressure kPa slider"
                  min={0}
                  max={Math.max(350, Math.ceil(pBounds.max))}
                  step={5}
                  value={draftFilters.pressure_kpa?.max ?? Math.ceil(pBounds.max)}
                  onChange={(e) =>
                    updateRangeBound("pressure_kpa", "max", e.target.value)
                  }
                  className="w-full h-1.5 telemetry-slider cursor-pointer"
                />
              </div>

              {validation.pressure_kpa && (
                <p className="text-[11px] text-rose-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {validation.pressure_kpa}
                </p>
              )}
            </div>
          )}

          {/* Stoichiometric Mixture Fraction Z_st (B10) */}
          {zBounds && (
            <div
              className={cn(
                "rounded-lg p-2.5 border space-y-2.5 transition-colors",
                isHighlighted("z_st")
                  ? "animate-assistant-highlight border-cyan-400/70 bg-cyan-950/25"
                  : "border-slate-800/70 bg-slate-900/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="zst-min-input"
                  className="text-xs font-medium text-slate-300"
                >
                  Mixture Fraction (Z_st)
                </label>
                <span className="text-[11px] font-mono-telemetry text-slate-400">
                  obs {formatNumber(zBounds.min, 3)}–{formatNumber(zBounds.max, 3)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Min
                  </span>
                  <input
                    id="zst-min-input"
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    placeholder={formatNumber(zBounds.min, 3)}
                    value={draftFilters.z_st?.min ?? ""}
                    onChange={(e) =>
                      updateRangeBound("z_st", "min", e.target.value)
                    }
                    className="w-full rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-mono-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Max
                  </span>
                  <input
                    id="zst-max-input"
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    placeholder={formatNumber(zBounds.max, 3)}
                    value={draftFilters.z_st?.max ?? ""}
                    onChange={(e) =>
                      updateRangeBound("z_st", "max", e.target.value)
                    }
                    className="w-full rounded-md bg-slate-950/90 border border-slate-700/80 px-2.5 py-1.5 text-xs font-mono-telemetry text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-0.5">
                <input
                  type="range"
                  aria-label="Minimum Z_st slider"
                  min={0}
                  max={1}
                  step={0.01}
                  value={draftFilters.z_st?.min ?? Math.floor(zBounds.min * 100) / 100}
                  onChange={(e) =>
                    updateRangeBound("z_st", "min", e.target.value)
                  }
                  className="w-full h-1.5 telemetry-slider cursor-pointer"
                />
                <input
                  type="range"
                  aria-label="Maximum Z_st slider"
                  min={0}
                  max={1}
                  step={0.01}
                  value={draftFilters.z_st?.max ?? Math.ceil(zBounds.max * 100) / 100}
                  onChange={(e) =>
                    updateRangeBound("z_st", "max", e.target.value)
                  }
                  className="w-full h-1.5 telemetry-slider cursor-pointer"
                />
              </div>

              {validation.z_st && (
                <p className="text-[11px] text-rose-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {validation.z_st}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={hasValidationError}
              onClick={() => {
                if (!hasValidationError) applyFilters();
              }}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer",
                hasValidationError
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  : hasPendingChanges
                    ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_-6px_rgba(34,211,238,0.85)]"
                    : "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30",
              )}
            >
              {hasPendingChanges ? "Apply Filters" : "Apply / Refresh"}
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
