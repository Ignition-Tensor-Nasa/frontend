import type { Dataset, DatasetData } from "../api/types";

export type DatasetValidationResult =
  | { ok: true; data: DatasetData }
  | { ok: false; error: string };

/**
 * Strictly validate backend JSON DatasetData response (F06):
 * - Descriptor matches the selected dataset metadata when provided
 * - Every row has exact length equal to dataset.columns.length
 * - Numeric columns hold JSON number | null (reject strings, NaN, Infinity)
 * - Nulls remain null and are never coerced to zero
 */
export function validateDatasetData(
  payload: unknown,
  expectedDataset?: Dataset,
): DatasetValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Dataset response is not a JSON object." };
  }

  const candidate = payload as Partial<DatasetData>;
  if (!candidate.dataset || typeof candidate.dataset !== "object") {
    return { ok: false, error: "Dataset response is missing dataset descriptor." };
  }
  if (!Array.isArray(candidate.dataset.columns)) {
    return { ok: false, error: "Dataset descriptor is missing columns array." };
  }
  if (!Array.isArray(candidate.rows)) {
    return { ok: false, error: "Dataset response is missing rows array." };
  }

  const descriptor = candidate.dataset;

  if (expectedDataset) {
    if (descriptor.dataset_id !== expectedDataset.dataset_id) {
      return {
        ok: false,
        error: `Dataset descriptor mismatch: expected "${expectedDataset.dataset_id}", got "${descriptor.dataset_id}".`,
      };
    }
    if (descriptor.columns.length !== expectedDataset.columns.length) {
      return {
        ok: false,
        error: `Descriptor column count mismatch: case metadata defines ${expectedDataset.columns.length} columns, data payload defines ${descriptor.columns.length}.`,
      };
    }
    for (let i = 0; i < expectedDataset.columns.length; i++) {
      const exp = expectedDataset.columns[i];
      const act = descriptor.columns[i];
      if (
        act.key !== exp.key ||
        act.data_type !== exp.data_type ||
        act.unit !== exp.unit
      ) {
        return {
          ok: false,
          error: `Descriptor column mismatch at index ${i} (${exp.key} vs ${act.key}).`,
        };
      }
    }
  }

  const colCount = descriptor.columns.length;
  for (let rowIdx = 0; rowIdx < candidate.rows.length; rowIdx++) {
    const row = candidate.rows[rowIdx];
    if (!Array.isArray(row)) {
      return {
        ok: false,
        error: `Row ${rowIdx} is not an array.`,
      };
    }
    if (row.length !== colCount) {
      return {
        ok: false,
        error: `Descriptor/row shape mismatch at row ${rowIdx}: expected ${colCount} columns, got ${row.length}.`,
      };
    }
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const col = descriptor.columns[colIdx];
      const value = row[colIdx];
      if (value === null) continue;
      if (col.data_type === "number") {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return {
            ok: false,
            error: `Invalid numeric value at row ${rowIdx}, column "${col.key}": expected finite JSON number or null, got ${typeof value === "string" ? `"${value}"` : String(value)}.`,
          };
        }
      } else if (typeof value !== "string") {
        return {
          ok: false,
          error: `Invalid string value at row ${rowIdx}, column "${col.key}".`,
        };
      }
    }
  }

  return {
    ok: true,
    data: {
      dataset: descriptor,
      rows: candidate.rows,
      note: candidate.note ?? null,
    },
  };
}
