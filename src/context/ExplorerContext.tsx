import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SortingState } from "@tanstack/react-table";
import {
  ApiError,
  DEFAULT_DATA_SOURCE_MODE,
  getFilterOptions,
  interpretFilters,
  searchCases,
} from "../api/client";
import {
  diffChangedFilterKeys,
  sanitizeFilters,
  type FilterFieldKey,
} from "../api/filters";
import type {
  CaseDetail,
  CaseSummary,
  DataSourceMode,
  DatasetData,
  DemoFaultInjection,
  FilterOptions,
  Filters,
  InterpretMode,
} from "../api/types";

export interface AssistantResultState {
  lastPrompt: string;
  mode: InterpretMode;
  warnings: string[];
  changedFields: FilterFieldKey[];
  appliedAt: number;
}

interface ExplorerContextValue {
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
  faultInjection: DemoFaultInjection;
  setFaultInjection: (fault: DemoFaultInjection) => void;

  filterOptions: FilterOptions | null;
  optionsLoading: boolean;
  optionsError: string | null;
  reloadOptions: () => void;

  draftFilters: Filters;
  setDraftFilters: React.Dispatch<React.SetStateAction<Filters>>;
  committedFilters: Filters;
  applyFilters: (nextFilters?: Filters) => void;
  removeCommittedFilter: (field: FilterFieldKey, value?: string) => void;
  resetAllFilters: () => void;

  results: CaseSummary[];
  totalResults: number;
  searchLoading: boolean;
  searchError: string | null;
  retrySearch: () => void;
  quickQuery: string;
  setQuickQuery: (query: string) => void;
  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;

  assistantText: string;
  setAssistantText: (text: string) => void;
  assistantLoading: boolean;
  assistantError: string | null;
  assistantResult: AssistantResultState | null;
  highlightedFields: FilterFieldKey[];
  submitScenario: (overrideText?: string) => Promise<void>;

  caseCache: Record<string, CaseDetail>;
  cacheCaseDetail: (detail: CaseDetail) => void;
  datasetCache: Record<string, DatasetData>;
  cacheDatasetData: (datasetId: string, data: DatasetData) => void;
  clearDatasetCache: () => void;

  resetDemoState: () => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const [dataSourceMode, setDataSourceModeState] = useState<DataSourceMode>(
    DEFAULT_DATA_SOURCE_MODE,
  );
  const [faultInjection, setFaultInjection] =
    useState<DemoFaultInjection>("none");

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [optionsLoading, setOptionsLoading] = useState<boolean>(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<Filters>({});
  const [committedFilters, setCommittedFilters] = useState<Filters>({});

  const [results, setResults] = useState<CaseSummary[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [searchLoading, setSearchLoading] = useState<boolean>(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [quickQuery, setQuickQuery] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "case_id", desc: false },
  ]);

  const [assistantText, setAssistantText] = useState<string>("");
  const [assistantLoading, setAssistantLoading] = useState<boolean>(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantResult, setAssistantResult] =
    useState<AssistantResultState | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<FilterFieldKey[]>(
    [],
  );

  const [caseCache, setCaseCache] = useState<Record<string, CaseDetail>>({});
  const [datasetCache, setDatasetCache] = useState<Record<string, DatasetData>>(
    {},
  );

  // Monotonic counters to discard stale async responses
  const filterRevisionRef = useRef<number>(0);
  const searchRequestIdRef = useRef<number>(0);
  const searchAbortRef = useRef<AbortController | null>(null);
  const optionsRequestIdRef = useRef<number>(0);
  const highlightTimerRef = useRef<number | null>(null);

  const triggerHighlight = useCallback((fields: FilterFieldKey[]) => {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    setHighlightedFields(fields);
    if (fields.length > 0) {
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedFields([]);
        highlightTimerRef.current = null;
      }, 3400);
    }
  }, []);

  const runSearch = useCallback(
    async (filtersToRun: Filters, mode: DataSourceMode) => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const requestId = ++searchRequestIdRef.current;

      setSearchLoading(true);
      setSearchError(null);

      try {
        const res = await searchCases(
          filtersToRun,
          { mode },
          controller.signal,
        );
        if (requestId !== searchRequestIdRef.current) return;
        setResults(res.items);
        setTotalResults(res.total);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (requestId !== searchRequestIdRef.current) return;
        const message =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to search cases.";
        setSearchError(message);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearchLoading(false);
        }
      }
    },
    [],
  );

  const loadOptions = useCallback(async (mode: DataSourceMode) => {
    const requestId = ++optionsRequestIdRef.current;
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const opts = await getFilterOptions({ mode });
      if (requestId !== optionsRequestIdRef.current) return;
      setFilterOptions(opts);
    } catch (err) {
      if (requestId !== optionsRequestIdRef.current) return;
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Failed to load filter options.";
      setOptionsError(message);
      setFilterOptions(null);
    } finally {
      if (requestId === optionsRequestIdRef.current) {
        setOptionsLoading(false);
      }
    }
  }, []);

  // Load initial options and unfiltered search on mount and whenever dataSourceMode changes
  useEffect(() => {
    void loadOptions(dataSourceMode);
    void runSearch({}, dataSourceMode);
    return () => {
      searchAbortRef.current?.abort();
    };
  }, [dataSourceMode, loadOptions, runSearch]);

  const bumpFilterRevision = useCallback(() => {
    filterRevisionRef.current += 1;
  }, []);

  const setDraftFiltersWithRevision: React.Dispatch<
    React.SetStateAction<Filters>
  > = useCallback(
    (updater) => {
      bumpFilterRevision();
      setDraftFilters(updater);
    },
    [bumpFilterRevision],
  );

  const applyFilters = useCallback(
    (nextFilters?: Filters) => {
      bumpFilterRevision();
      const target = sanitizeFilters(nextFilters ?? draftFilters);
      setDraftFilters(target);
      setCommittedFilters(target);
      setHighlightedFields([]);
      void runSearch(target, dataSourceMode);
    },
    [bumpFilterRevision, dataSourceMode, draftFilters, runSearch],
  );

  const removeCommittedFilter = useCallback(
    (field: FilterFieldKey, value?: string) => {
      bumpFilterRevision();
      const next: Filters = { ...committedFilters };
      if (field === "investigation" && value !== undefined) {
        const filtered = (next.investigation ?? []).filter((v) => v !== value);
        if (filtered.length > 0) next.investigation = filtered;
        else delete next.investigation;
      } else if (field === "fuel" && value !== undefined) {
        const filtered = (next.fuel ?? []).filter((v) => v !== value);
        if (filtered.length > 0) next.fuel = filtered;
        else delete next.fuel;
      } else {
        delete next[field];
      }
      const clean = sanitizeFilters(next);
      setDraftFilters(clean);
      setCommittedFilters(clean);
      setHighlightedFields([]);
      void runSearch(clean, dataSourceMode);
    },
    [bumpFilterRevision, committedFilters, dataSourceMode, runSearch],
  );

  const resetAllFilters = useCallback(() => {
    bumpFilterRevision();
    setDraftFilters({});
    setCommittedFilters({});
    setQuickQuery("");
    setAssistantResult(null);
    setAssistantError(null);
    setHighlightedFields([]);
    void runSearch({}, dataSourceMode);
  }, [bumpFilterRevision, dataSourceMode, runSearch]);

  const retrySearch = useCallback(() => {
    void runSearch(committedFilters, dataSourceMode);
  }, [committedFilters, dataSourceMode, runSearch]);

  const reloadOptions = useCallback(() => {
    void loadOptions(dataSourceMode);
  }, [dataSourceMode, loadOptions]);

  const submitScenario = useCallback(
    async (overrideText?: string) => {
      if (assistantLoading) return;
      const text = (overrideText ?? assistantText).trim();
      if (!text) {
        setAssistantError("Enter a combustion scenario description first.");
        return;
      }
      if (overrideText !== undefined) {
        setAssistantText(overrideText);
      }

      const startRevision = filterRevisionRef.current;
      const baselineFilters = sanitizeFilters(committedFilters);

      setAssistantLoading(true);
      setAssistantError(null);

      try {
        const res = await interpretFilters(text, baselineFilters, {
          mode: dataSourceMode,
          fault: faultInjection,
        });

        // Discard response if manual filters changed while request was in flight
        if (filterRevisionRef.current !== startRevision) {
          return;
        }

        const nextFilters = sanitizeFilters(res.filters);
        const changed = diffChangedFilterKeys(baselineFilters, nextFilters);

        setDraftFilters(nextFilters);
        setCommittedFilters(nextFilters);
        setAssistantResult({
          lastPrompt: text,
          mode: res.mode,
          warnings: res.warnings,
          changedFields: changed,
          appliedAt: Date.now(),
        });
        triggerHighlight(changed);
        void runSearch(nextFilters, dataSourceMode);
      } catch (err) {
        if (filterRevisionRef.current !== startRevision) {
          return;
        }
        const message =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "AI assistant could not process the scenario.";
        setAssistantError(message);
      } finally {
        setAssistantLoading(false);
      }
    },
    [
      assistantLoading,
      assistantText,
      committedFilters,
      dataSourceMode,
      faultInjection,
      runSearch,
      triggerHighlight,
    ],
  );

  const setDataSourceMode = useCallback(
    (nextMode: DataSourceMode) => {
      if (nextMode === dataSourceMode) return;
      bumpFilterRevision();
      setFaultInjection("none");
      setDraftFilters({});
      setCommittedFilters({});
      setQuickQuery("");
      setAssistantResult(null);
      setAssistantError(null);
      setHighlightedFields([]);
      setCaseCache({});
      setDatasetCache({});
      setDataSourceModeState(nextMode);
    },
    [bumpFilterRevision, dataSourceMode],
  );

  const cacheCaseDetail = useCallback((detail: CaseDetail) => {
    setCaseCache((prev) => ({ ...prev, [detail.case_id]: detail }));
  }, []);

  const cacheDatasetData = useCallback(
    (datasetId: string, data: DatasetData) => {
      setDatasetCache((prev) => ({ ...prev, [datasetId]: data }));
    },
    [],
  );

  const clearDatasetCache = useCallback(() => {
    setDatasetCache({});
  }, []);

  const resetDemoState = useCallback(() => {
    bumpFilterRevision();
    setFaultInjection("none");
    setDraftFilters({});
    setCommittedFilters({});
    setAssistantText("");
    setAssistantError(null);
    setAssistantResult(null);
    setHighlightedFields([]);
    setQuickQuery("");
    setSorting([{ id: "case_id", desc: false }]);
    setCaseCache({});
    setDatasetCache({});
    void loadOptions(dataSourceMode);
    void runSearch({}, dataSourceMode);
  }, [bumpFilterRevision, dataSourceMode, loadOptions, runSearch]);

  const value = useMemo<ExplorerContextValue>(
    () => ({
      dataSourceMode,
      setDataSourceMode,
      faultInjection,
      setFaultInjection,
      filterOptions,
      optionsLoading,
      optionsError,
      reloadOptions,
      draftFilters,
      setDraftFilters: setDraftFiltersWithRevision,
      committedFilters,
      applyFilters,
      removeCommittedFilter,
      resetAllFilters,
      results,
      totalResults,
      searchLoading,
      searchError,
      retrySearch,
      quickQuery,
      setQuickQuery,
      sorting,
      setSorting,
      assistantText,
      setAssistantText,
      assistantLoading,
      assistantError,
      assistantResult,
      highlightedFields,
      submitScenario,
      caseCache,
      cacheCaseDetail,
      datasetCache,
      cacheDatasetData,
      clearDatasetCache,
      resetDemoState,
    }),
    [
      dataSourceMode,
      setDataSourceMode,
      faultInjection,
      filterOptions,
      optionsLoading,
      optionsError,
      reloadOptions,
      draftFilters,
      setDraftFiltersWithRevision,
      committedFilters,
      applyFilters,
      removeCommittedFilter,
      resetAllFilters,
      results,
      totalResults,
      searchLoading,
      searchError,
      retrySearch,
      quickQuery,
      sorting,
      assistantText,
      assistantLoading,
      assistantError,
      assistantResult,
      highlightedFields,
      submitScenario,
      caseCache,
      cacheCaseDetail,
      datasetCache,
      cacheDatasetData,
      clearDatasetCache,
      resetDemoState,
    ],
  );

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
}

export function useExplorer(): ExplorerContextValue {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used inside ExplorerProvider");
  }
  return ctx;
}
