import type { CaseSummary, FilterOptions, Filters, Range } from "./types";

export type FilterFieldKey = keyof Filters;

export type FilterValidationErrors = {
  o2_pct?: string;
  pressure_kpa?: string;
  z_st?: string;
};

function sanitizeRange(range: Range | undefined): Range | undefined {
  if (!range) return undefined;
  const out: Range = {};
  if (typeof range.min === "number" && Number.isFinite(range.min)) {
    out.min = range.min;
  }
  if (typeof range.max === "number" && Number.isFinite(range.max)) {
    out.max = range.max;
  }
  return out.min === undefined && out.max === undefined ? undefined : out;
}

/**
 * Normalize a Filters object to match backend validation rules:
 * - Omit unset keys
 * - Omit empty category arrays
 * - Omit empty range objects
 */
export function sanitizeFilters(filters: Filters | undefined | null): Filters {
  if (!filters) return {};
  const out: Filters = {};
  if (filters.investigation && filters.investigation.length > 0) {
    out.investigation = Array.from(new Set(filters.investigation)).sort();
  }
  if (filters.fuel && filters.fuel.length > 0) {
    out.fuel = Array.from(new Set(filters.fuel)).sort();
  }
  const o2 = sanitizeRange(filters.o2_pct);
  if (o2) out.o2_pct = o2;
  const pressure = sanitizeRange(filters.pressure_kpa);
  if (pressure) out.pressure_kpa = pressure;
  const zSt = sanitizeRange(filters.z_st);
  if (zSt) out.z_st = zSt;
  return out;
}

export function validateFilters(filters: Filters): FilterValidationErrors {
  const errors: FilterValidationErrors = {};

  if (filters.o2_pct) {
    const { min, max } = filters.o2_pct;
    if (min !== undefined && (!Number.isFinite(min) || min < 0 || min > 100)) {
      errors.o2_pct = "O₂ min must be between 0 and 100%.";
    } else if (
      max !== undefined &&
      (!Number.isFinite(max) || max < 0 || max > 100)
    ) {
      errors.o2_pct = "O₂ max must be between 0 and 100%.";
    } else if (min !== undefined && max !== undefined && min > max) {
      errors.o2_pct = "O₂ min cannot exceed O₂ max.";
    }
  }

  if (filters.pressure_kpa) {
    const { min, max } = filters.pressure_kpa;
    if (min !== undefined && (!Number.isFinite(min) || min < 0)) {
      errors.pressure_kpa = "Pressure min must be ≥ 0 kPa.";
    } else if (max !== undefined && (!Number.isFinite(max) || max < 0)) {
      errors.pressure_kpa = "Pressure max must be ≥ 0 kPa.";
    } else if (min !== undefined && max !== undefined && min > max) {
      errors.pressure_kpa = "Pressure min cannot exceed Pressure max.";
    }
  }

  if (filters.z_st) {
    const { min, max } = filters.z_st;
    if (min !== undefined && (!Number.isFinite(min) || min < 0 || min > 1)) {
      errors.z_st = "Z_st min must be between 0 and 1.";
    } else if (max !== undefined && (!Number.isFinite(max) || max < 0 || max > 1)) {
      errors.z_st = "Z_st max must be between 0 and 1.";
    } else if (min !== undefined && max !== undefined && min > max) {
      errors.z_st = "Z_st min cannot exceed Z_st max.";
    }
  }

  return errors;
}

export function validateFiltersAgainstOptions(
  filters: Filters,
  options: FilterOptions | null,
): string | null {
  const rangeErrors = validateFilters(filters);
  if (rangeErrors.o2_pct) return rangeErrors.o2_pct;
  if (rangeErrors.pressure_kpa) return rangeErrors.pressure_kpa;
  if (rangeErrors.z_st) return rangeErrors.z_st;
  if (!options) return null;

  if (filters.investigation) {
    const allowed = new Set(options.investigation);
    const unknown = filters.investigation.filter((v) => !allowed.has(v));
    if (unknown.length > 0) {
      return `Unknown investigation value(s): ${unknown.join(", ")}`;
    }
  }
  if (filters.fuel) {
    const allowed = new Set(options.fuel);
    const unknown = filters.fuel.filter((v) => !allowed.has(v));
    if (unknown.length > 0) {
      return `Unknown fuel value(s): ${unknown.join(", ")}`;
    }
  }
  return null;
}

/**
 * Exact search semantics matching backend/app/services/catalogue.py:
 * - AND across fields
 * - OR within category arrays
 * - Inclusive numeric bounds
 * - Null metadata fails any active constraint
 */
export function matchesFilters(item: CaseSummary, rawFilters: Filters): boolean {
  const filters = sanitizeFilters(rawFilters);

  if (filters.investigation) {
    if (!filters.investigation.includes(item.investigation)) {
      return false;
    }
  }

  if (filters.fuel) {
    if (item.fuel === null || !filters.fuel.includes(item.fuel)) {
      return false;
    }
  }

  if (filters.o2_pct) {
    if (item.o2_pct === null) return false;
    if (filters.o2_pct.min !== undefined && item.o2_pct < filters.o2_pct.min) {
      return false;
    }
    if (filters.o2_pct.max !== undefined && item.o2_pct > filters.o2_pct.max) {
      return false;
    }
  }

  if (filters.pressure_kpa) {
    if (item.pressure_kpa === null) return false;
    if (
      filters.pressure_kpa.min !== undefined &&
      item.pressure_kpa < filters.pressure_kpa.min
    ) {
      return false;
    }
    if (
      filters.pressure_kpa.max !== undefined &&
      item.pressure_kpa > filters.pressure_kpa.max
    ) {
      return false;
    }
  }

  if (filters.z_st) {
    if (item.z_st === null || item.z_st === undefined) return false;
    if (filters.z_st.min !== undefined && item.z_st < filters.z_st.min) {
      return false;
    }
    if (filters.z_st.max !== undefined && item.z_st > filters.z_st.max) {
      return false;
    }
  }

  return true;
}

function sameList(a?: string[], b?: string[]): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const sa = Array.from(new Set(a)).sort();
  const sb = Array.from(new Set(b)).sort();
  return sa.length === sb.length && sa.every((val, idx) => val === sb[idx]);
}

function sameRange(a?: Range, b?: Range): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.min === b.min && a.max === b.max;
}

export function filtersEqual(a: Filters, b: Filters): boolean {
  const sa = sanitizeFilters(a);
  const sb = sanitizeFilters(b);
  return (
    sameList(sa.investigation, sb.investigation) &&
    sameList(sa.fuel, sb.fuel) &&
    sameRange(sa.o2_pct, sb.o2_pct) &&
    sameRange(sa.pressure_kpa, sb.pressure_kpa) &&
    sameRange(sa.z_st, sb.z_st)
  );
}

export function diffChangedFilterKeys(
  prev: Filters,
  next: Filters,
): FilterFieldKey[] {
  const a = sanitizeFilters(prev);
  const b = sanitizeFilters(next);
  const keys: FilterFieldKey[] = [
    "investigation",
    "fuel",
    "o2_pct",
    "pressure_kpa",
    "z_st",
  ];
  return keys.filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
}

export function countActiveFilters(filters: Filters): number {
  const clean = sanitizeFilters(filters);
  let count = 0;
  if (clean.investigation?.length) count += clean.investigation.length;
  if (clean.fuel?.length) count += clean.fuel.length;
  if (clean.o2_pct) count += 1;
  if (clean.pressure_kpa) count += 1;
  if (clean.z_st) count += 1;
  return count;
}
