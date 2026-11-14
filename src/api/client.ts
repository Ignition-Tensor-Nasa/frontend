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
  import.meta.env.MODE === "test" || import.meta.env.VITE_USE_FIXTURES === "true"
    ? "fixtures"
    : "live";

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

  const raw = await fetchJson<unknown>(
    `/api/v1/datasets/${encodeURIComponent(datasetId)}/data`,
    { signal },
  );

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
