export type Range = {
  min?: number;
  max?: number;
};

export type Filters = {
  investigation?: string[];
  fuel?: string[];
  o2_pct?: Range;
  pressure_kpa?: Range;
  z_st?: Range;
};

export type FilterOptions = {
  investigation: string[];
  fuel: string[];
  o2_pct: { min: number; max: number } | null;
  pressure_kpa: { min: number; max: number } | null;
  z_st?: { min: number; max: number } | null;
};

export type CaseSummary = {
  case_id: string;
  title: string;
  investigation: string;
  fuel: string | null;
  o2_pct: number | null;
  pressure_kpa: number | null;
  z_st?: number | null;
};

export type DatasetColumn = {
  key: string;
  label: string;
  data_type: "number" | "string";
  unit: string | null;
};

export type Dataset = {
  dataset_id: string;
  label: string;
  columns: DatasetColumn[];
  default_x: string | null;
  default_y: string[];
  note?: string | null;
};

export type CaseEvent = {
  label: string;
  time_s: number;
  dataset_id: string;
  source: string;
};

export type CaseEvidence = {
  document: string;
  page: number;
  quote: string;
};

export type CaseResearchContext = {
  tags: ("prevention" | "detection" | "suppression" | "unknown")[];
  rationale: string;
  evidence: CaseEvidence[];
  disclaimer: string;
};

export type CaseExplanation = {
  text: string;
  origin: "template" | "curated" | "generated";
};

export type CaseNeighborItem = {
  case: CaseSummary;
  distance: number;
};

export type CaseNeighborsResponse = {
  metric: string;
  items: CaseNeighborItem[];
};

export type CaseDetail = CaseSummary & {
  source_label: string;
  source_url: string | null;
  note: string | null;
  datasets: Dataset[];
  events?: CaseEvent[];
  research_context?: CaseResearchContext;
  explanation?: CaseExplanation | null;
};

export type DatasetData = {
  dataset: Dataset;
  rows: (number | string | null)[][];
  note: string | null;
};

export type SearchRequest = {
  filters?: Filters;
};

export type SearchResponse = {
  items: CaseSummary[];
  total: number;
};

export type InterpretRequest = {
  text: string;
  current_filters?: Filters;
};

export type InterpretMode = "live" | "demo";

export type InterpretResponse = {
  filters: Filters;
  warnings: string[];
  mode: InterpretMode;
  searchable: boolean;
};

export type DataSourceMode = "fixtures" | "live";

export type DemoFaultInjection =
  | "none"
  | "ai_unavailable"
  | "dataset_unavailable"
  | "dataset_shape_mismatch";
