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
  searchable?: boolean;
};

export type DataSourceMode = "fixtures" | "live";

export type DemoFaultInjection =
  | "none"
  | "ai_unavailable"
  | "dataset_unavailable"
  | "dataset_shape_mismatch";

export type SpecialCaseSummary = {
  case_id: string;
  sample_number: number;
  title: string;
  subtitle: string;
  investigation: string;
  capsule: string;
  fuel: string;
  o2_pct: number;
  pressure_kpa: number;
  recording_duration_s: number;
  peak_temp_c: number;
  peak_heat_flux_mw_cm2: number;
  highlight_badge: string;
};

export type SpecialCasesListResponse = {
  bespoke_notice: string;
  items: SpecialCaseSummary[];
  total: number;
};

export type SaffireTile = {
  value: string;
  label: string;
  detail: string;
};

export type SaffireSeries = {
  name: string;
  color: string;
  points: [number, number | null][];
};

export type SaffirePanel = {
  id: string;
  title: string;
  unit: string;
  series: SaffireSeries[];
};

export type SaffireSampleStats = {
  duration_s: number;
  igniter_window: [number, number] | null;
  peak_sample_tc: string;
  peak_sample_temp_c: number;
  peak_sample_time_s: number;
  peak_after_ignition_s: number;
  peak_plume_tc: string;
  peak_plume_temp_c: number;
  peak_radiometer: string;
  peak_heat_flux_mw_cm2: number;
  idle_heat_flux_mw_cm2: number;
  o2_before_pct: number;
  o2_min_pct: number;
  co2_before_pct: number;
  co2_max_pct: number;
  pressure_before_kpa: number;
  pressure_rise_kpa: number;
  air_flow_cm_s: number;
};

export type SaffireSamplePayload = {
  sample_number: number;
  case_id: string;
  tab_label: string;
  duration_s: number;
  point_limit: number;
  igniter_window: [number, number] | null;
  presets: Record<string, [number, number]>;
  tiles: SaffireTile[];
  stats: SaffireSampleStats;
  burn_panels: SaffirePanel[];
  arrival: {
    thermocouples: string[];
    thresholds_c: number[];
    default_threshold_c: number;
    arrivals_by_threshold: Record<string, (number | null)[]>;
    peaks_c: number[];
    max_t: number;
    note: string;
  };
  playback: {
    thermocouples: string[];
    step_s: number;
    y_max_c: number;
    frames: { t_s: number; values_c: number[] }[];
  };
};

export type SaffireSpacecraftEvents = {
  igniter1: number[];
  igniter2: number[];
  smoke_wire: number[];
  window: [number, number];
  scatter_baseline: number;
  scatter_peak: number;
  scatter_peak_t: number;
  first_rise: number;
  smoke_lag_s: number;
};

export type SaffireSpacecraftPayload = {
  events: SaffireSpacecraftEvents;
  presets: Record<string, [number, number]>;
  t_max: number;
  panels: SaffirePanel[];
};

export type SaffireSpecialCasePayload = {
  case_id: string;
  active_sample_number: number;
  bespoke_notice: string;
  items: SpecialCaseSummary[];
  samples: Record<string, SaffireSamplePayload>;
  spacecraft: SaffireSpacecraftPayload;
  methodology_notes: string[];
  sources: string[];
};

export type SaffireAiFocus =
  | "overview"
  | "burn_plume"
  | "flame_spread"
  | "spacecraft_cabin";

export type SaffireAiLanguage = "pl" | "en";

export type SaffireAiSummaryRequest = {
  focus?: SaffireAiFocus;
  language?: SaffireAiLanguage;
  custom_prompt?: string | null;
};

export type SaffireAiSummaryBody = {
  headline: string;
  executive_summary: string;
  key_findings: string[];
  spacecraft_telemetry_insight: string;
  methodological_caveats: string[];
};

export type SaffireAiSummaryResponse = {
  case_id: string;
  sample_number: number;
  focus: SaffireAiFocus;
  language: SaffireAiLanguage;
  mode: InterpretMode;
  summary: SaffireAiSummaryBody;
};
