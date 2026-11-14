PSI-Lens — Hackathon PoC API reference
Optional reference only: both agent guides contain their own integration details. This describes the demo-critical integration path, not a ceiling on optional features. Endpoints are planned, not a claim that they exist. Keep both implementations aligned when changing shapes.

Deliberately small architecture
One FastAPI app, one curated Parquet catalogue, and pre-normalized selected CSVs.
Roughly 20–50 useful cases to start; under 200 total. Return all search matches; the frontend sorts them locally. Freeze the dataset for the demo.
No pagination, revision protocol, dynamic registry, per-field evidence graph, universal ETL, chart-shaped JSON, or separate production infrastructure.
Backend filters data and calls the LLM. Browser parses selected CSVs and plots.
Real data stays real. Curated metadata is acceptable; invented observations are not. Rehearsed AI responses require an explicit demo mode and visible labelling.
The broader visualization/data ideas remain optional features in the agent guides. Add fields or artifact delivery only when a selected optional hackathon feature needs them. This contract introduces no additional feature scope.

Payloads
type Range = { min?: number; max?: number };
type Filters = {
  investigation?: string[]; fuel?: string[];
  o2_pct?: Range; pressure_kpa?: Range;
};
type FilterOptions = {
  investigation: string[]; fuel: string[];
  o2_pct: { min: number; max: number } | null;
  pressure_kpa: { min: number; max: number } | null;
};
type CaseSummary = {
  case_id: string; title: string; investigation: string;
  fuel: string | null; o2_pct: number | null; pressure_kpa: number | null;
};
type Dataset = {
  dataset_id: string; label: string;
  columns: { key: string; label: string;
    data_type: "number" | "string"; unit: string | null }[];
  default_x: string | null; default_y: string[];
};
type CaseDetail = CaseSummary & {
  source_label: string; source_url: string | null; note: string | null;
  datasets: Dataset[];
};
Endpoints
Endpoint	Request	Successful response
GET /api/v1/filters	None	FilterOptions
POST /api/v1/cases/search	{ filters?: Filters }	{ items: CaseSummary[], total: number }
GET /api/v1/cases/{case_id}	Case ID	CaseDetail
GET /api/v1/datasets/{dataset_id}/csv	Dataset ID	One normalized CSV
POST /api/v1/filters/interpret	{ text: string }	`{ filters: Filters, warnings: string[], mode: "live" | "demo", searchable: boolean }`
Filtering
Empty filters match the curated catalogue. AND across fields, OR within category arrays, inclusive numeric bounds with at least one present. Omit an unset key; do not send empty category arrays. Null metadata fails an active constraint. Categories come from the catalogue; numeric options are observed bounds or null when unavailable. Valid searches can lie outside observed bounds.

O₂ uses percentage points (0–100); pressure is nonnegative kPa absolute. 1 psi = 6.894757293168 kPa. Reject unknown keys/categories, wrong types, reversed/ nonfinite ranges, and out-of-domain values. No silent relaxation or invented scores. Search returns all matches ordered by case ID; total = items.length.

Interpretation
Input text is trimmed, nonempty, ≤4,000 characters. Every prompt starts with empty filters; the legacy `current_filters` field is ignored. The server validates the complete returned filter state. It returns no scientific answer or search results. Unknown/ambiguous concepts generate warnings, not guessed thresholds. `searchable: false` means no supported search was recognised: show no results and do not search the empty filters. `searchable: true` with empty filters can represent an explicit request to show all cases.

mode: "live" means a real provider call. Explicit demo configuration may use reviewed responses for exact rehearsed prompts; unknown prompts are not searchable and include a warning. Demo responses return mode: "demo". A failed live request must not silently become a successful cached response.

CSV and errors
Serve a single allowlisted dataset ID, never a request-supplied filesystem path. CSV is UTF-8, comma-delimited, one descriptor-matching header row, standard quoting, decimal-point numbers, empty cells for nulls, and no metadata preamble. Default axes/channels refer to existing numeric columns or are null/empty. Use text/csv; charset=utf-8 and a safe Content-Disposition filename exposed via CORS. Keep units/source context; explicitly label any preparation-time sampling in the case note. Small full series are preferable. No hidden truncation/interpolation.

Use FastAPI-style { detail: string } errors; default 422 validation may contain an array in detail. Use 404 for missing IDs, 422 for invalid input, and 503 for unavailable data/AI, including provider timeouts or invalid output. No custom error taxonomy or extra health endpoint is required; the existing hello route can stay.
