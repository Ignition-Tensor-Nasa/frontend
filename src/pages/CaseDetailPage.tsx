import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Download,
  ExternalLink,
  FileSpreadsheet,
  GitCompare,
  Info,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  ApiError,
  downloadDatasetCsv,
  getCaseDetail,
  getCaseNeighbors,
  getDatasetData,
} from "../api/client";
import type {
  CaseDetail,
  CaseNeighborsResponse,
  Dataset,
  DatasetData,
} from "../api/types";
import { CoolFlameLifecycleDeck } from "../components/CoolFlameLifecycleDeck";
import { TelemetryWorkspace } from "../components/TelemetryWorkspace";
import { useExplorer } from "../context/ExplorerContext";
import { cn, formatNumber, formatSignedDelta, kpaToPsi } from "../lib/utils";

export function CaseDetailPage() {
  const { caseId = "" } = useParams<{ caseId: string }>();
  const decodedCaseId = decodeURIComponent(caseId);
  return <CaseDetailView key={decodedCaseId} decodedCaseId={decodedCaseId} />;
}

function CaseDetailView({ decodedCaseId }: { decodedCaseId: string }) {

  const {
    dataSourceMode,
    faultInjection,
    caseCache,
    cacheCaseDetail,
    datasetCache,
    cacheDatasetData,
    comparedCaseIds,
    toggleCompareCase,
    setComparedCases,
    setComparisonOpen,
  } = useExplorer();

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(
    () => caseCache[decodedCaseId] ?? null,
  );
  const [caseLoading, setCaseLoading] = useState<boolean>(
    () => !caseCache[decodedCaseId],
  );
  const [caseError, setCaseError] = useState<{
    status: number;
    message: string;
  } | null>(null);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    () => caseCache[decodedCaseId]?.datasets[0]?.dataset_id ?? null,
  );

  const [datasetData, setDatasetData] = useState<DatasetData | null>(null);
  const [datasetLoading, setDatasetLoading] = useState<boolean>(false);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  const [neighbors, setNeighbors] = useState<CaseNeighborsResponse | null>(null);
  const [neighborsLoading, setNeighborsLoading] = useState<boolean>(false);
  const [neighborsError, setNeighborsError] = useState<string | null>(null);
  const [csvDownloading, setCsvDownloading] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const caseReqIdRef = useRef(0);
  const dataReqIdRef = useRef(0);
  const neighborsReqIdRef = useRef(0);

  const loadCase = useCallback(async () => {
    const reqId = ++caseReqIdRef.current;
    const cached = caseCache[decodedCaseId];
    if (cached) {
      setCaseDetail(cached);
      setCaseError(null);
      setCaseLoading(false);
      setSelectedDatasetId((prev) =>
        prev && cached.datasets.some((d) => d.dataset_id === prev)
          ? prev
          : (cached.datasets[0]?.dataset_id ?? null),
      );
      return;
    }

    const controller = new AbortController();
    setCaseLoading(true);
    setCaseError(null);

    try {
      const detail = await getCaseDetail(
        decodedCaseId,
        { mode: dataSourceMode },
        controller.signal,
      );
      if (reqId !== caseReqIdRef.current) return;
      cacheCaseDetail(detail);
      setCaseDetail(detail);
      setSelectedDatasetId(detail.datasets[0]?.dataset_id ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (reqId !== caseReqIdRef.current) return;
      const status = err instanceof ApiError ? err.status : 0;
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Could not load case metadata.";
      setCaseError({ status, message });
      setCaseDetail(null);
    } finally {
      if (reqId === caseReqIdRef.current) {
        setCaseLoading(false);
      }
    }
  }, [cacheCaseDetail, caseCache, dataSourceMode, decodedCaseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  useEffect(() => {
    if (!caseDetail) {
      setNeighbors(null);
      setNeighborsError(null);
      setNeighborsLoading(false);
      return;
    }
    const reqId = ++neighborsReqIdRef.current;
    const controller = new AbortController();
    setNeighborsLoading(true);
    setNeighborsError(null);

    getCaseNeighbors(caseDetail.case_id, { mode: dataSourceMode }, controller.signal)
      .then((res) => {
        if (reqId !== neighborsReqIdRef.current) return;
        setNeighbors(res);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (reqId !== neighborsReqIdRef.current) return;
        setNeighborsError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load nearest condition cases.",
        );
      })
      .finally(() => {
        if (reqId === neighborsReqIdRef.current) {
          setNeighborsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [caseDetail, dataSourceMode]);

  const selectedDataset: Dataset | undefined = caseDetail?.datasets.find(
    (d) => d.dataset_id === selectedDatasetId,
  );

  const loadDataset = useCallback(
    async (dataset: Dataset, bypassCache = false, signal?: AbortSignal) => {
      const reqId = ++dataReqIdRef.current;
      const cached = !bypassCache ? datasetCache[dataset.dataset_id] : undefined;
      if (cached && faultInjection === "none") {
        setDatasetData(cached);
        setDatasetError(null);
        setDatasetLoading(false);
        return;
      }

      setDatasetLoading(true);
      setDatasetError(null);

      try {
        const data = await getDatasetData(
          dataset.dataset_id,
          dataset,
          { mode: dataSourceMode, fault: faultInjection },
          signal,
        );
        if (reqId !== dataReqIdRef.current) return;
        cacheDatasetData(dataset.dataset_id, data);
        setDatasetData(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (reqId !== dataReqIdRef.current) return;
        const message =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load dataset JSON telemetry.";
        setDatasetError(message);
        setDatasetData(null);
      } finally {
        if (reqId === dataReqIdRef.current) {
          setDatasetLoading(false);
        }
      }
    },
    [cacheDatasetData, dataSourceMode, datasetCache, faultInjection],
  );

  useEffect(() => {
    if (!selectedDataset) {
      setDatasetData(null);
      setDatasetError(null);
      setDatasetLoading(false);
      return;
    }
    const controller = new AbortController();
    void loadDataset(selectedDataset, false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadDataset, selectedDataset]);

  if (caseLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-36 rounded-2xl bg-slate-900/70 border border-slate-800" />
        <div className="h-[460px] rounded-2xl bg-slate-900/70 border border-slate-800" />
      </div>
    );
  }

  if (caseError || !caseDetail) {
    const isNotFound = caseError?.status === 404;
    return (
      <div className="panel-surface rounded-2xl p-8 max-w-2xl mx-auto mt-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/15 border border-rose-500/35 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-rose-400" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold text-white">
            {isNotFound ? "Experiment Case Not Found" : "Case Load Error"}
          </h1>
          <p className="text-sm text-slate-300">
            {caseError?.message ?? `No case record found for "${decodedCaseId}".`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Explorer
          </Link>
          {!isNotFound && (
            <button
              type="button"
              onClick={() => void loadCase()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-panel-in">
      {/* Top Navigation & Case Identity Strip (F05) */}
      <section className="panel-surface-cyan rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Results
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-cyan-500/15 border border-cyan-400/35 text-cyan-200">
              {caseDetail.case_id}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200 font-medium">
              {caseDetail.investigation}
            </span>
            <button
              type="button"
              onClick={() => toggleCompareCase(caseDetail.case_id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer",
                comparedCaseIds.includes(caseDetail.case_id)
                  ? "bg-orange-500/25 border-orange-400/60 text-orange-100"
                  : "bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-orange-400/50 hover:text-orange-200",
              )}
            >
              {comparedCaseIds.includes(caseDetail.case_id) ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>
                {comparedCaseIds.includes(caseDetail.case_id)
                  ? "Pinned to Compare"
                  : "Pin to Compare"}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {caseDetail.title}
          </h1>

          {/* Parameter Strip with Clear Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Fuel
              </span>
              <span className="text-base font-semibold text-orange-300 mt-0.5 block">
                {caseDetail.fuel ?? "Unknown (null)"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Oxygen Concentration
              </span>
              <span className="text-base font-semibold font-mono-telemetry text-cyan-300 mt-0.5 block">
                {caseDetail.o2_pct !== null
                  ? `${formatNumber(caseDetail.o2_pct, 2)} % O₂`
                  : "Unknown (null)"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Chamber Pressure
              </span>
              <span className="text-base font-semibold font-mono-telemetry text-slate-100 mt-0.5 block">
                {caseDetail.pressure_kpa !== null
                  ? `${formatNumber(caseDetail.pressure_kpa, 2)} kPa (${formatNumber(kpaToPsi(caseDetail.pressure_kpa), 2)} psi)`
                  : "Unknown (null)"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Mixture Fraction (Z_st)
              </span>
              <span className="text-base font-semibold font-mono-telemetry text-slate-100 mt-0.5 block">
                {caseDetail.z_st !== null && caseDetail.z_st !== undefined
                  ? formatNumber(caseDetail.z_st, 4)
                  : "Unknown (null)"}
              </span>
            </div>
          </div>
        </div>

        {/* Short Template Explanation (B15) */}
        {caseDetail.explanation && (
          <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/25 px-4 py-3 text-xs sm:text-sm text-slate-200 flex flex-wrap items-start justify-between gap-2.5 leading-relaxed">
            <p className="flex-1 min-w-[240px]">{caseDetail.explanation.text}</p>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-telemetry uppercase tracking-wider bg-slate-900 border border-cyan-500/30 text-cyan-300 shrink-0">
              Origin: {caseDetail.explanation.origin}
            </span>
          </div>
        )}

        {caseDetail.note && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>{caseDetail.note}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-300 shrink-0">
              Source Reference:
            </span>
            <span className="truncate">{caseDetail.source_label}</span>
          </div>
          {caseDetail.source_url && (
            <a
              href={caseDetail.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline underline-offset-4 shrink-0"
            >
              <span>NASA PSI Source</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </section>

      {/* Dataset Selector Strip (F05 / F23) */}
      <section className="panel-surface rounded-xl p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono-telemetry uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
              Selected Dataset:
            </span>
            {caseDetail.datasets.length === 0 ? (
              <span className="text-xs text-slate-400">
                No telemetry datasets attached to this case.
              </span>
            ) : (
              caseDetail.datasets.map((ds) => {
                const active = ds.dataset_id === selectedDatasetId;
                return (
                  <button
                    key={ds.dataset_id}
                    type="button"
                    onClick={() => {
                      setSelectedDatasetId(ds.dataset_id);
                      setCsvError(null);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                      active
                        ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100 shadow-sm"
                        : "bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500",
                    )}
                  >
                    {ds.label}
                  </button>
                );
              })
            )}
          </div>

          {selectedDataset && dataSourceMode === "live" && (
            <button
              type="button"
              disabled={csvDownloading}
              onClick={async () => {
                setCsvDownloading(true);
                setCsvError(null);
                try {
                  await downloadDatasetCsv(selectedDataset.dataset_id);
                } catch (err) {
                  setCsvError(
                    err instanceof ApiError
                      ? err.detail
                      : err instanceof Error
                        ? err.message
                        : "CSV export failed.",
                  );
                } finally {
                  setCsvDownloading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Download backend-exported CSV directly (not used for chart loading)"
            >
              <Download className="h-3.5 w-3.5" />
              {csvDownloading ? "Downloading CSV…" : "Export Raw CSV"}
            </button>
          )}
        </div>

        {csvError && (
          <p role="alert" className="text-xs text-rose-300 font-mono-telemetry">
            CSV Export Failed: {csvError}
          </p>
        )}
      </section>

      {/* F06 Loading / Error / Chart Workspace */}
      {selectedDataset && datasetLoading && (
        <div className="panel-surface rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 w-64 rounded bg-slate-800" />
          <div className="h-[440px] rounded-xl bg-slate-900/80 border border-slate-800" />
        </div>
      )}

      {selectedDataset && !datasetLoading && datasetError && (
        <div
          role="alert"
          className="panel-surface rounded-2xl border border-rose-500/40 bg-rose-950/25 p-6 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-rose-100">
                Dataset Telemetry Load Failed
              </h3>
              <p className="text-xs text-rose-200/90 font-mono-telemetry">
                {datasetError}
              </p>
              {dataSourceMode === "live" && (
                <p className="text-xs text-slate-400 pt-1">
                  Note: Dataset loader requests JSON from{" "}
                  <code>/api/v1/datasets/&#123;dataset_id&#125;/data</code>{" "}
                  (falling back to{" "}
                  <code>/api/v1/datasets/&#123;dataset_id&#125;/csv</code>{" "}
                  when 404). Ensure backend curated data is prepared or switch to Demo Fixtures in the header.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadDataset(selectedDataset, true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 border border-rose-400/50 text-rose-100 hover:bg-rose-500/30 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Dataset Load
          </button>
        </div>
      )}

      {selectedDataset && !datasetLoading && !datasetError && datasetData && (
        <TelemetryWorkspace
          datasetData={datasetData}
          sourceLabel={caseDetail.source_label}
          events={(caseDetail.events ?? []).filter(
            (ev) => ev.dataset_id === selectedDataset.dataset_id,
          )}
        />
      )}

      {/* Synchronized Multi-Dataset Lifecycle Deck (F13) */}
      <CoolFlameLifecycleDeck caseDetail={caseDetail} />

      {/* Research Context (B14) & Nearest Condition Cases (B11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {caseDetail.research_context && (
          <section
            aria-label="Research Context"
            className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">
                  Research Context
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {caseDetail.research_context.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-mono-telemetry uppercase tracking-wider border",
                      tag === "unknown"
                        ? "bg-slate-800/90 border-slate-700 text-slate-300"
                        : "bg-cyan-500/15 border-cyan-400/40 text-cyan-200",
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {caseDetail.research_context.rationale}
            </p>

            {caseDetail.research_context.evidence.length > 0 && (
              <div className="space-y-2">
                {caseDetail.research_context.evidence.map((ev, idx) => (
                  <blockquote
                    key={`${ev.document}-${ev.page}-${idx}`}
                    className="rounded-lg bg-slate-950/70 border border-slate-800/90 px-3 py-2 text-xs space-y-1"
                  >
                    <p className="text-slate-200 italic">“{ev.quote}”</p>
                    <footer className="text-[10px] font-mono-telemetry text-slate-400">
                      {ev.document} · p. {ev.page}
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}

            {caseDetail.research_context.disclaimer && (
              <p className="text-[11px] text-amber-300/85 border-t border-slate-800/70 pt-2">
                {caseDetail.research_context.disclaimer}
              </p>
            )}
          </section>
        )}

        <section
          aria-label="Nearest Condition Cases"
          className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-white">
                Nearest Condition Runs
              </h2>
            </div>
            <span className="text-[11px] font-mono-telemetry text-slate-400">
              (O₂, Pressure)
            </span>
          </div>

          {neighborsLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 rounded-lg bg-slate-800/60" />
              <div className="h-10 rounded-lg bg-slate-800/60" />
            </div>
          )}

          {neighborsError && !neighborsLoading && (
            <p className="text-xs text-rose-300">{neighborsError}</p>
          )}

          {!neighborsLoading && !neighborsError && neighbors && (
            <>
              {neighbors.items.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No nearest neighbors computed for this case (missing O₂ or pressure metadata prevents (o2_pct, pressure_kpa) coordinate distance).
                </p>
              ) : (
                <ul className="space-y-2">
                  {neighbors.items.map((item) => {
                    const deltaO2 = formatSignedDelta(
                      item.case.o2_pct,
                      caseDetail.o2_pct,
                      1,
                      "%",
                    );
                    const deltaP = formatSignedDelta(
                      item.case.pressure_kpa,
                      caseDetail.pressure_kpa,
                      1,
                      "kPa",
                    );
                    return (
                      <li key={item.case.case_id} className="flex items-stretch gap-2">
                        <Link
                          to={`/cases/${encodeURIComponent(item.case.case_id)}`}
                          className="flex-1 min-w-0 flex items-center justify-between gap-3 rounded-xl bg-slate-950/65 border border-slate-800/90 px-3 py-2 hover:border-cyan-400/50 transition-colors group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-telemetry text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                                {item.case.case_id}
                              </span>
                              {item.case.fuel && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-200 border border-orange-500/25">
                                  {item.case.fuel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 truncate mt-0.5">
                              {item.case.o2_pct !== null
                                ? `${formatNumber(item.case.o2_pct, 1)}% O₂`
                                : "null O₂"}
                              {" · "}
                              {item.case.pressure_kpa !== null
                                ? `${formatNumber(item.case.pressure_kpa, 1)} kPa`
                                : "null kPa"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(deltaO2 || deltaP) && (
                              <span className="hidden sm:inline-block font-mono-telemetry text-[10px] text-slate-400">
                                {[deltaO2 && `ΔO₂ ${deltaO2}`, deltaP && `ΔP ${deltaP}`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                            <span className="font-mono-telemetry text-xs text-slate-200 px-2 py-1 rounded-md bg-slate-900 border border-slate-700/80">
                              d = {formatNumber(item.distance, 3)}
                            </span>
                          </div>
                        </Link>
                        <button
                          type="button"
                          title={`Compare ${caseDetail.case_id} with ${item.case.case_id}`}
                          onClick={() => {
                            setComparedCases([caseDetail.case_id, item.case.case_id]);
                            setComparisonOpen(true);
                          }}
                          className="shrink-0 px-2.5 rounded-xl bg-slate-950/65 border border-slate-800/90 text-orange-300 hover:border-orange-400/60 hover:bg-orange-500/15 transition-colors flex items-center justify-center cursor-pointer"
                          aria-label={`Compare with ${item.case.case_id}`}
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="text-[11px] text-slate-400 border-t border-slate-800/70 pt-2 leading-relaxed">
                {neighbors.metric}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
