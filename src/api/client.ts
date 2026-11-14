import {
  FIXTURE_CASE_DETAILS,
  FIXTURE_FILTER_OPTIONS,
  getFixtureCaseNeighbors,
  getFixtureDatasetData,
  interpretFixtureFilters,
  searchFixtureCases,
} from "./fixtures";
import { sanitizeFilters, validateFilters } from "./filters";
import type {
  CaseDetail,
  CaseNeighborsResponse,
  DataSourceMode,
  Dataset,
  DatasetData,
  DemoFaultInjection,
  FilterOptions,
  Filters,
  InterpretResponse,
  SearchResponse,
} from "./types";
import { validateDatasetData } from "../utils/datasetValidation";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/$/, "");

export const DEFAULT_DATA_SOURCE_MODE: DataSourceMode =
  import.meta.env.VITE_USE_FIXTURES === "false" ? "live" : "fixtures";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function formatFastApiDetail(raw: unknown, fallback: string): string {
  if (!raw || typeof raw !== "object") return fallback;
  const detail = (raw as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const loc = Array.isArray((item as { loc?: unknown }).loc)
            ? (item as { loc: unknown[] }).loc.join(".")
            : "";
          const msg = (item as { msg?: string }).msg ?? "Validation error";
          return loc ? `${loc}: ${msg}` : msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  return fallback;
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "Unable to reach the backend API. Ensure the FastAPI server is running or switch to Demo Fixtures mode.",
    );
  }

  let body: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    const text = await response.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { detail: text };
      }
    }
  }

  if (!response.ok) {
    const detail = formatFastApiDetail(
      body,
      `Backend returned HTTP ${response.status}`,
    );
    throw new ApiError(response.status, detail);
  }

  return body as T;
}

export interface ApiClientConfig {
  mode: DataSourceMode;
  fault?: DemoFaultInjection;
}

export async function getFilterOptions(
  config: ApiClientConfig,
  signal?: AbortSignal,
): Promise<FilterOptions> {
  if (config.mode === "fixtures") {
    return FIXTURE_FILTER_OPTIONS;
  }
  return fetchJson<FilterOptions>("/api/v1/filters", { signal });
}

export async function searchCases(
  filters: Filters,
  config: ApiClientConfig,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const clean = sanitizeFilters(filters);
  const errors = validateFilters(clean);
  if (errors.o2_pct || errors.pressure_kpa || errors.z_st) {
    throw new ApiError(
      422,
      errors.o2_pct ?? errors.pressure_kpa ?? errors.z_st ?? "Invalid filters",
    );
  }

  if (config.mode === "fixtures") {
    try {
      return searchFixtureCases(clean);
    } catch (err) {
      throw new ApiError(
        422,
        err instanceof Error ? err.message : "Invalid search filters",
      );
    }
  }

  return fetchJson<SearchResponse>("/api/v1/cases/search", {
    method: "POST",
    body: JSON.stringify({ filters: clean }),
    signal,
  });
}

export async function getCaseDetail(
  caseId: string,
  config: ApiClientConfig,
  signal?: AbortSignal,
): Promise<CaseDetail> {
  if (config.mode === "fixtures") {
    const found = FIXTURE_CASE_DETAILS[caseId];
    if (!found) {
      throw new ApiError(404, `Unknown case: ${caseId}`);
    }
    return found;
  }

  return fetchJson<CaseDetail>(`/api/v1/cases/${encodeURIComponent(caseId)}`, {
    signal,
  });
}

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseBackendNormalizedCsv(
  csvText: string,
  expectedDataset: Dataset,
): DatasetData {
  const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new ApiError(422, "Backend CSV response is empty.");
  }

  const header = parseCsvRow(lines[0]);
  const expectedKeys = expectedDataset.columns.map((c) => c.key);
  if (
    header.length !== expectedKeys.length ||
    header.some((key, idx) => key !== expectedKeys[idx])
  ) {
    throw new ApiError(
      422,
      `CSV header mismatch: expected [${expectedKeys.join(", ")}], received [${header.join(", ")}].`,
    );
  }

  const rows: (number | string | null)[][] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvRow(lines[i]);
    if (cells.length !== expectedDataset.columns.length) {
      throw new ApiError(
        422,
        `CSV row ${i} column count (${cells.length}) does not match descriptor (${expectedDataset.columns.length}).`,
      );
    }
    const row = cells.map((cell, colIdx) => {
      if (cell === "") return null;
      const col = expectedDataset.columns[colIdx];
      if (col.data_type === "number") {
        const num = Number(cell);
        return Number.isFinite(num) ? num : cell;
      }
      return cell;
    });
    rows.push(row);
  }

  return {
    dataset: expectedDataset,
    rows,
    note: expectedDataset.note ?? null,
  };
}

export async function getCaseNeighbors(
  caseId: string,
  config: ApiClientConfig,
  signal?: AbortSignal,
): Promise<CaseNeighborsResponse> {
  if (config.mode === "fixtures") {
    const found = getFixtureCaseNeighbors(caseId);
    if (!found) {
      throw new ApiError(404, `Unknown case: ${caseId}`);
    }
    return found;
  }

  return fetchJson<CaseNeighborsResponse>(
    `/api/v1/cases/${encodeURIComponent(caseId)}/neighbors`,
    { signal },
  );
}

export async function getDatasetData(
  datasetId: string,
  expectedDataset: Dataset | undefined,
  config: ApiClientConfig,
  signal?: AbortSignal,
): Promise<DatasetData> {
  if (config.mode === "fixtures") {
    if (config.fault === "dataset_unavailable") {
      throw new ApiError(
        503,
        "Simulated 503: Dataset telemetry service temporarily unavailable.",
      );
    }
    const fixture = getFixtureDatasetData(datasetId);
    if (!fixture) {
      throw new ApiError(404, `Unknown dataset: ${datasetId}`);
    }
    if (config.fault === "dataset_shape_mismatch") {
      const brokenPayload: unknown = {
        ...fixture,
        rows: [
          ...(fixture.rows.slice(0, 2) ?? []),
          [0, "not-a-number"], // deliberate shape & type mismatch for F06 verification
        ],
      };
      const check = validateDatasetData(brokenPayload, expectedDataset);
      if (!check.ok) {
        throw new ApiError(422, check.error);
      }
    }
    const validation = validateDatasetData(fixture, expectedDataset);
    if (!validation.ok) {
      throw new ApiError(422, validation.error);
    }
    return validation.data;
  }

  let raw: unknown;
  try {
    raw = await fetchJson<unknown>(
      `/api/v1/datasets/${encodeURIComponent(datasetId)}/data`,
      { signal },
    );
  } catch (err) {
    // Backend polars-analysis-2 exposes pre-normalized CSV at /datasets/{id}/csv (B05)
    if (err instanceof ApiError && err.status === 404 && expectedDataset) {
      let csvResp: Response;
      try {
        csvResp = await fetch(getDatasetCsvDownloadUrl(datasetId), { signal });
      } catch (fetchErr) {
        if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
          throw fetchErr;
        }
        throw new ApiError(
          0,
          "Unable to reach the backend API while loading dataset CSV.",
        );
      }
      if (!csvResp.ok) {
        const text = await csvResp.text().catch(() => "");
        let detail = `Backend returned HTTP ${csvResp.status}`;
        if (text) {
          try {
            detail = formatFastApiDetail(JSON.parse(text), detail);
          } catch {
            detail = text;
          }
        }
        throw new ApiError(csvResp.status, detail);
      }
      const csvText = await csvResp.text();
      raw = parseBackendNormalizedCsv(csvText, expectedDataset);
    } else {
      throw err;
    }
  }

  const validation = validateDatasetData(raw, expectedDataset);
  if (!validation.ok) {
    throw new ApiError(422, validation.error);
  }
  return validation.data;
}

export async function interpretFilters(
  text: string,
  currentFilters: Filters,
  config: ApiClientConfig,
  signal?: AbortSignal,
): Promise<InterpretResponse> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 4000) {
    throw new ApiError(
      422,
      "Scenario description must be between 1 and 4,000 characters.",
    );
  }

  if (config.mode === "fixtures") {
    if (config.fault === "ai_unavailable") {
      throw new ApiError(
        503,
        "Simulated 503: AI assistant provider is currently unavailable. Manual filters remain usable.",
      );
    }
    return interpretFixtureFilters(trimmed, currentFilters);
  }

  return fetchJson<InterpretResponse>("/api/v1/filters/interpret", {
    method: "POST",
    body: JSON.stringify({
      text: trimmed,
      current_filters: sanitizeFilters(currentFilters),
    }),
    signal,
  });
}

export function getDatasetCsvDownloadUrl(datasetId: string): string {
  return `${API_BASE_URL}/api/v1/datasets/${encodeURIComponent(datasetId)}/csv`;
}

export function parseContentDispositionFilename(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  const starMatch = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;\n]+)/i.exec(
    header,
  );
  if (starMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(starMatch[1].trim().replace(/^"|"$/g, ""));
      const base = decoded.split(/[\\/]/).pop()?.trim();
      if (base) return base;
    } catch {
      // fall through to standard filename parameter
    }
  }
  const plainMatch = /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;\s]+)/i.exec(
    header,
  );
  const raw = (plainMatch?.[1] ?? plainMatch?.[2] ?? "").trim();
  const base = raw.split(/[\\/]/).pop()?.trim();
  return base || fallback;
}

export async function downloadDatasetCsv(datasetId: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(getDatasetCsvDownloadUrl(datasetId), {
      headers: { Accept: "text/csv,application/json" },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "Unable to reach the backend API while downloading CSV.",
    );
  }

  if (!response.ok) {
    let body: unknown = null;
    const text = await response.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { detail: text };
      }
    }
    throw new ApiError(
      response.status,
      formatFastApiDetail(body, `Backend returned HTTP ${response.status}`),
    );
  }

  const filename = parseContentDispositionFilename(
    response.headers.get("content-disposition"),
    `${datasetId}.csv`,
  );
  const blob = await response.blob();

  if (
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function" &&
    typeof document !== "undefined"
  ) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return filename;
}
