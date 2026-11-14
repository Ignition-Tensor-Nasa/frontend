import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";
import {
  AlertCircle,
  Camera,
  Clock,
  ExternalLink,
  GitCompare,
  Layers,
  X,
} from "lucide-react";
import { ApiError, getCaseDetail, getDatasetData } from "../api/client";
import type { CaseDetail, Dataset, DatasetColumn, DatasetData } from "../api/types";
import { useExplorer } from "../context/ExplorerContext";
import { cn, downloadDataUrl, formatNumber, kpaToPsi } from "../lib/utils";

const COMPARE_COLORS = ["#22d3ee", "#fb923c", "#a78bfa", "#34d399"];

interface LoadedRunEntry {
  caseDetail: CaseDetail;
  datasetsBySuffix: Record<string, Dataset>;
}

interface ActiveRunTarget {
  run: LoadedRunEntry;
  dataset: Dataset;
  effectiveDataset: Dataset;
  channel: DatasetColumn;
  color: string;
}

interface AxisBucket {
  key: string;
  label: string;
  color: string;
}

function getDatasetSuffix(caseId: string, datasetId: string): string {
  return datasetId.startsWith(`${caseId}-`)
    ? datasetId.slice(caseId.length + 1)
    : datasetId;
}

function getNumericChannels(dataset: Dataset): DatasetColumn[] {
  const xKey = dataset.default_x ?? "time_s";
  return dataset.columns.filter(
    (c) => c.data_type === "number" && c.key !== xKey,
  );
}

function pickDefaultChannel(
  dataset: Dataset,
  preferredKey?: string,
): DatasetColumn | undefined {
  const numericCols = getNumericChannels(dataset);
  if (numericCols.length === 0) return undefined;
  if (preferredKey) {
    const matched = numericCols.find((c) => c.key === preferredKey);
    if (matched) return matched;
  }
  const defaultCandidate = dataset.default_y
    .map((k) => numericCols.find((c) => c.key === k))
    .find((c): c is DatasetColumn => Boolean(c));
  return defaultCandidate ?? numericCols[0];
}

export function MultiCaseComparisonModal() {
  const navigate = useNavigate();
  const {
    dataSourceMode,
    faultInjection,
    caseCache,
    cacheCaseDetail,
    datasetCache,
    cacheDatasetData,
    comparedCaseIds,
    toggleCompareCase,
    clearComparedCases,
    comparisonOpen,
    setComparisonOpen,
  } = useExplorer();

  const [detailsMap, setDetailsMap] = useState<Record<string, CaseDetail>>({});
  const [loadedDatasets, setLoadedDatasets] = useState<
    Record<string, DatasetData>
  >({});
  const [loadingCases, setLoadingCases] = useState<boolean>(false);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string>("");
  const [selectedChannelKey, setSelectedChannelKey] = useState<string>("");
  const [perRunDatasetId, setPerRunDatasetId] = useState<Record<string, string>>(
    {},
  );
  const [perRunChannelKey, setPerRunChannelKey] = useState<
    Record<string, string>
  >({});
  const [alignToIgnition, setAlignToIgnition] = useState<boolean>(true);

  const isLoading = loadingCases || loadingDatasets;

  useEffect(() => {
    setDetailsMap({});
    setLoadedDatasets({});
  }, [dataSourceMode]);

  const caseCacheRef = useRef(caseCache);
  caseCacheRef.current = caseCache;
  const datasetCacheRef = useRef(datasetCache);
  datasetCacheRef.current = datasetCache;

  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Load CaseDetail records whenever modal opens or comparedCaseIds change
  useEffect(() => {
    if (!comparisonOpen || comparedCaseIds.length === 0) {
      setLoadingCases(false);
      return;
    }

    const currentCaseCache = caseCacheRef.current;
    const initial: Record<string, CaseDetail> = {};
    const missingIds = comparedCaseIds.filter((id) => {
      const cached = currentCaseCache[id];
      if (cached) {
        initial[id] = cached;
        return false;
      }
      return true;
    });

    if (Object.keys(initial).length > 0) {
      setDetailsMap((prev) => ({ ...prev, ...initial }));
    }
    if (missingIds.length === 0) {
      setLoadingCases(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoadingCases(true);
    setError(null);

    Promise.all(
      missingIds.map((id) =>
        getCaseDetail(id, { mode: dataSourceMode }, controller.signal),
      ),
    )
      .then((fetched) => {
        if (cancelled) return;
        const map: Record<string, CaseDetail> = {};
        for (const d of fetched) {
          cacheCaseDetail(d);
          map[d.case_id] = d;
        }
        setDetailsMap((prev) => ({ ...prev, ...map }));
      })
      .catch((err) => {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load compared case metadata.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingCases(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cacheCaseDetail, comparedCaseIds, comparisonOpen, dataSourceMode]);

  const loadedRuns: LoadedRunEntry[] = useMemo(() => {
    return comparedCaseIds
      .map((id) => detailsMap[id])
      .filter((d): d is CaseDetail => Boolean(d))
      .map((caseDetail) => {
        const datasetsBySuffix: Record<string, Dataset> = {};
        for (const ds of caseDetail.datasets) {
          datasetsBySuffix[getDatasetSuffix(caseDetail.case_id, ds.dataset_id)] =
            ds;
        }
        return { caseDetail, datasetsBySuffix };
      });
  }, [comparedCaseIds, detailsMap]);

  // Dataset suffixes shared by at least 2 currently loaded compared runs
  const commonSuffixOptions = useMemo(() => {
    if (loadedRuns.length < 2) return [] as { suffix: string; label: string }[];
    const counts = new Map<string, { suffix: string; label: string; count: number }>();
    for (const run of loadedRuns) {
      const seenForRun = new Set<string>();
      for (const ds of run.caseDetail.datasets) {
        const suffix = getDatasetSuffix(run.caseDetail.case_id, ds.dataset_id);
        if (seenForRun.has(suffix)) continue;
        seenForRun.add(suffix);
        const existing = counts.get(suffix);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(suffix, { suffix, label: ds.label, count: 1 });
        }
      }
    }
    return Array.from(counts.values())
      .filter((entry) => entry.count >= 2)
      .map(({ suffix, label }) => ({ suffix, label }));
  }, [loadedRuns]);

  const isCrossInvestigation =
    loadedRuns.length >= 2 && commonSuffixOptions.length === 0;

  useEffect(() => {
    if (commonSuffixOptions.length === 0) {
      setSelectedSuffix("");
      return;
    }
    if (!commonSuffixOptions.some((o) => o.suffix === selectedSuffix)) {
      setSelectedSuffix(commonSuffixOptions[0].suffix);
    }
  }, [commonSuffixOptions, selectedSuffix]);

  // Runs participating in Shared Mode vs Cross-Investigation Mode
  const sharedParticipatingRuns = useMemo(() => {
    if (!selectedSuffix || commonSuffixOptions.length === 0) return [];
    return loadedRuns.filter((r) => Boolean(r.datasetsBySuffix[selectedSuffix]));
  }, [commonSuffixOptions.length, loadedRuns, selectedSuffix]);

  // Datasets to load (never depends on loadedDatasets to avoid re-fetch loops)
  const targetDatasets: Dataset[] = useMemo(() => {
    if (!comparisonOpen || loadedRuns.length < 2) return [];
    const list: Dataset[] = [];
    const seen = new Set<string>();

    if (!isCrossInvestigation && selectedSuffix) {
      for (const run of sharedParticipatingRuns) {
        const ds = run.datasetsBySuffix[selectedSuffix];
        if (ds && !seen.has(ds.dataset_id)) {
          seen.add(ds.dataset_id);
          list.push(ds);
        }
      }
    } else if (isCrossInvestigation) {
      for (const run of loadedRuns) {
        const chosenId = perRunDatasetId[run.caseDetail.case_id];
        const ds =
          run.caseDetail.datasets.find((d) => d.dataset_id === chosenId) ??
          run.caseDetail.datasets[0];
        if (ds && !seen.has(ds.dataset_id)) {
          seen.add(ds.dataset_id);
          list.push(ds);
        }
      }
    }
    return list;
  }, [
    comparisonOpen,
    isCrossInvestigation,
    loadedRuns,
    perRunDatasetId,
    selectedSuffix,
    sharedParticipatingRuns,
  ]);

  // Load dataset telemetry for all target datasets across active comparison mode
  useEffect(() => {
    if (!comparisonOpen || targetDatasets.length === 0) {
      setLoadingDatasets(false);
      return;
    }

    const currentDatasetCache = datasetCacheRef.current;
    const cachedEntries: Record<string, DatasetData> = {};
    const toFetch = targetDatasets.filter((ds) => {
      const hit = currentDatasetCache[ds.dataset_id];
      if (hit) {
        cachedEntries[ds.dataset_id] = hit;
        return false;
      }
      return true;
    });

    if (Object.keys(cachedEntries).length > 0) {
      setLoadedDatasets((prev) => ({ ...prev, ...cachedEntries }));
    }
    if (toFetch.length === 0) {
      setLoadingDatasets(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoadingDatasets(true);
    setError(null);

    Promise.all(
      toFetch.map((ds) =>
        getDatasetData(
          ds.dataset_id,
          ds,
          { mode: dataSourceMode, fault: faultInjection },
          controller.signal,
        ),
      ),
    )
      .then((fetched) => {
        if (cancelled) return;
        const next: Record<string, DatasetData> = {};
        for (const data of fetched) {
          cacheDatasetData(data.dataset.dataset_id, data);
          next[data.dataset.dataset_id] = data;
        }
        setLoadedDatasets((prev) => ({ ...prev, ...next }));
      })
      .catch((err) => {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load telemetry for comparison.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingDatasets(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    cacheDatasetData,
    comparisonOpen,
    dataSourceMode,
    faultInjection,
    targetDatasets,
  ]);

  // Verified common numeric channels with matching units across participating runs (Shared Mode)
  const commonNumericChannels: DatasetColumn[] = useMemo(() => {
    if (isCrossInvestigation || !selectedSuffix || sharedParticipatingRuns.length < 2) {
      return [];
    }
    const runDatasets = sharedParticipatingRuns
      .map((r) => r.datasetsBySuffix[selectedSuffix])
      .map((ds) => (ds ? loadedDatasets[ds.dataset_id]?.dataset ?? ds : undefined));
    if (runDatasets.some((d) => !d)) return [];

    const first = runDatasets[0]!;
    const xKey = first.default_x ?? "time_s";
    return first.columns.filter((col) => {
      if (col.data_type !== "number" || col.key === xKey) return false;
      return runDatasets.every((other) =>
        other!.columns.some(
          (oc) =>
            oc.key === col.key &&
            oc.data_type === "number" &&
            oc.unit === col.unit,
        ),
      );
    });
  }, [
    isCrossInvestigation,
    loadedDatasets,
    selectedSuffix,
    sharedParticipatingRuns,
  ]);

  useEffect(() => {
    if (isCrossInvestigation || commonNumericChannels.length === 0) {
      setSelectedChannelKey("");
      return;
    }
    if (!commonNumericChannels.some((c) => c.key === selectedChannelKey)) {
      const firstDs = sharedParticipatingRuns[0]?.datasetsBySuffix[selectedSuffix];
      const defaultCandidate = firstDs?.default_y.find((k) =>
        commonNumericChannels.some((c) => c.key === k),
      );
      setSelectedChannelKey(defaultCandidate ?? commonNumericChannels[0].key);
    }
  }, [
    commonNumericChannels,
    isCrossInvestigation,
    selectedChannelKey,
    selectedSuffix,
    sharedParticipatingRuns,
  ]);

  const activeSharedChannel = useMemo(
    () => commonNumericChannels.find((c) => c.key === selectedChannelKey),
    [commonNumericChannels, selectedChannelKey],
  );

  // Resolve active (run, dataset, channel, color) targets across both modes
  const activeRunTargets: ActiveRunTarget[] = useMemo(() => {
    if (loadedRuns.length < 2) return [];

    if (!isCrossInvestigation && selectedSuffix && activeSharedChannel) {
      const list: ActiveRunTarget[] = [];
      loadedRuns.forEach((run, idx) => {
        const ds = run.datasetsBySuffix[selectedSuffix];
        if (!ds) return;
        const effectiveDataset = loadedDatasets[ds.dataset_id]?.dataset ?? ds;
        list.push({
          run,
          dataset: ds,
          effectiveDataset,
          channel: activeSharedChannel,
          color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        });
      });
      return list;
    }

    if (isCrossInvestigation) {
      const list: ActiveRunTarget[] = [];
      loadedRuns.forEach((run, idx) => {
        const chosenId = perRunDatasetId[run.caseDetail.case_id];
        const ds =
          run.caseDetail.datasets.find((d) => d.dataset_id === chosenId) ??
          run.caseDetail.datasets[0];
        if (!ds) return;
        const effectiveDataset = loadedDatasets[ds.dataset_id]?.dataset ?? ds;
        const channel = pickDefaultChannel(
          effectiveDataset,
          perRunChannelKey[run.caseDetail.case_id],
        );
        if (!channel) return;
        list.push({
          run,
          dataset: ds,
          effectiveDataset,
          channel,
          color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        });
      });
      return list;
    }

    return [];
  }, [
    activeSharedChannel,
    isCrossInvestigation,
    loadedDatasets,
    loadedRuns,
    perRunChannelKey,
    perRunDatasetId,
    selectedSuffix,
  ]);

  // Distinct unit-preserving Y-axes
  const { axisBuckets, alignedRuns } = useMemo(() => {
    const buckets: AxisBucket[] = [];
    const bucketIdxByKey = new Map<string, number>();

    const runs = activeRunTargets.map((target) => {
      const data = loadedDatasets[target.dataset.dataset_id];
      const axisKey =
        target.channel.unit !== null
          ? `unit:${target.channel.unit}`
          : `raw:${target.channel.key}`;
      let yAxisIndex = bucketIdxByKey.get(axisKey);
      if (yAxisIndex === undefined) {
        yAxisIndex = buckets.length;
        bucketIdxByKey.set(axisKey, yAxisIndex);
        buckets.push({
          key: axisKey,
          label: target.channel.unit
            ? `${target.channel.label} [${target.channel.unit}]`
            : `${target.channel.label} [raw]`,
          color: target.color,
        });
      }

      const ignitionEvent = (target.run.caseDetail.events ?? []).find(
        (ev) =>
          ev.dataset_id === target.dataset.dataset_id &&
          /ignition/i.test(ev.label),
      );
      const offsetS =
        alignToIgnition && ignitionEvent ? ignitionEvent.time_s : 0;

      const points: [number, number | null][] = [];
      if (data) {
        const xKey = data.dataset.default_x ?? "time_s";
        const xIdx = data.dataset.columns.findIndex((c) => c.key === xKey);
        const yIdx = data.dataset.columns.findIndex(
          (c) => c.key === target.channel.key,
        );
        if (xIdx >= 0 && yIdx >= 0) {
          for (const row of data.rows) {
            const xv = row[xIdx];
            const yv = row[yIdx];
            if (typeof xv !== "number" || !Number.isFinite(xv)) continue;
            const t = Number((xv - offsetS).toFixed(4));
            if (yv === null) {
              points.push([t, null]);
            } else if (typeof yv === "number" && Number.isFinite(yv)) {
              points.push([t, yv]);
            }
          }
        }
      }

      return {
        caseDetail: target.run.caseDetail,
        dataset: target.effectiveDataset,
        channel: target.channel,
        color: target.color,
        yAxisIndex,
        ignitionTimeS: ignitionEvent?.time_s ?? null,
        aligned: Boolean(alignToIgnition && ignitionEvent),
        points,
      };
    });

    return { axisBuckets: buckets, alignedRuns: runs };
  }, [activeRunTargets, alignToIgnition, loadedDatasets]);

  // Mount / clean up ECharts instance whenever modal opens/closes
  useEffect(() => {
    if (!comparisonOpen) {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
        chartInstanceRef.current.dispose();
      }
      chartInstanceRef.current = null;
      return;
    }

    const el = chartRef.current;
    if (!el) return;
    if (
      chartInstanceRef.current &&
      !chartInstanceRef.current.isDisposed() &&
      chartInstanceRef.current.getDom() === el
    ) {
      return;
    }

    if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed()) {
      chartInstanceRef.current.dispose();
    }
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartInstanceRef.current = chart;

    resizeObserverRef.current?.disconnect();
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    resizeObserverRef.current = ro;

    return () => {
      ro.disconnect();
      if (resizeObserverRef.current === ro) {
        resizeObserverRef.current = null;
      }
      if (!chart.isDisposed()) {
        chart.dispose();
      }
      if (chartInstanceRef.current === chart) {
        chartInstanceRef.current = null;
      }
    };
  }, [comparisonOpen, comparedCaseIds.length]);

  // Render or clear ECharts option whenever aligned series update
  useEffect(() => {
    const el = chartRef.current;
    if (!el || !comparisonOpen) return;

    let chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed() || chart.getDom() !== el) {
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
      chart = echarts.init(el, undefined, { renderer: "canvas" });
      chartInstanceRef.current = chart;
      resizeObserverRef.current?.disconnect();
      const ro = new ResizeObserver(() => chart?.resize());
      ro.observe(el);
      resizeObserverRef.current = ro;
    }

    const runsWithData = alignedRuns.filter((r) => r.points.length > 0);
    if (runsWithData.length === 0 || axisBuckets.length === 0) {
      chart.clear();
      return;
    }

    const totalPoints = alignedRuns.reduce((sum, r) => sum + r.points.length, 0);
    const hasUnalignedRuns = alignedRuns.some((r) => !r.aligned);
    const rightAxisCount = Math.max(0, axisBuckets.length - 1);

    chart.resize();
    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: totalPoints <= 6000,
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          backgroundColor: "rgba(9, 14, 28, 0.96)",
          borderColor: "rgba(251, 146, 60, 0.45)",
          textStyle: { color: "#e2e8f0", fontSize: 12 },
        },
        legend: {
          top: 4,
          textStyle: { color: "#cbd5e1", fontSize: 11 },
        },
        grid: {
          top: 44,
          left: 72,
          right: rightAxisCount > 0 ? 72 + (rightAxisCount - 1) * 56 : 28,
          bottom: 58,
        },
        xAxis: {
          type: "value",
          name: alignToIgnition
            ? hasUnalignedRuns
              ? "Time Δt (ignition-aligned where logged; raw t elsewhere) [s]"
              : "Time Δt from logged ignition [s]"
            : "Raw Sensor Time [s]",
          nameLocation: "middle",
          nameGap: 26,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
        },
        yAxis: axisBuckets.map((bucket, idx) => ({
          type: "value",
          position: idx === 0 ? "left" : "right",
          offset: idx > 1 ? (idx - 1) * 56 : 0,
          name: bucket.label,
          nameTextStyle: {
            color: axisBuckets.length > 1 ? bucket.color : "#94a3b8",
            fontSize: 11,
          },
          axisLine: {
            lineStyle: {
              color: axisBuckets.length > 1 ? bucket.color : "#334155",
            },
          },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: {
            show: idx === 0,
            lineStyle: { color: "rgba(51, 65, 85, 0.35)" },
          },
        })),
        dataZoom: [
          { type: "inside", xAxisIndex: 0 },
          {
            type: "slider",
            xAxisIndex: 0,
            height: 18,
            bottom: 4,
            borderColor: "#334155",
            fillerColor: "rgba(34, 211, 238, 0.14)",
          },
        ],
        series: alignedRuns.map((run) => ({
          name: isCrossInvestigation
            ? `${run.caseDetail.case_id} · ${run.channel.key} [${run.channel.unit ?? "raw"}]`
            : `${run.caseDetail.case_id} (${run.caseDetail.o2_pct !== null ? `${run.caseDetail.o2_pct.toFixed(1)}% O₂` : "null O₂"})`,
          type: "line",
          yAxisIndex: run.yAxisIndex,
          showSymbol: false,
          sampling: run.points.length > 1000 ? "lttb" : undefined,
          connectNulls: false,
          lineStyle: { width: 2, color: run.color },
          itemStyle: { color: run.color },
          data: run.points,
        })),
      },
      true,
    );
  }, [
    alignToIgnition,
    alignedRuns,
    axisBuckets,
    comparisonOpen,
    isCrossInvestigation,
  ]);

  if (comparedCaseIds.length === 0) {
    return null;
  }

  const hasRenderedSeries = alignedRuns.some((r) => r.points.length > 0);
  const excludedRunsInShared =
    !isCrossInvestigation && selectedSuffix
      ? loadedRuns.filter((r) => !r.datasetsBySuffix[selectedSuffix])
      : [];

  return (
    <>
      {/* Floating Comparison Tray (F12) */}
      {!comparisonOpen && (
        <aside
          aria-label="Multi-Case Comparison Tray"
          className="fixed bottom-4 right-4 z-40 max-w-xl rounded-2xl border border-orange-500/45 bg-slate-950/95 backdrop-blur-md shadow-2xl px-4 py-3 flex flex-wrap items-center gap-3 animate-panel-in"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-200">
            <GitCompare className="h-4 w-4 text-orange-400" />
            <span>Compare Queue ({comparedCaseIds.length}/4)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {comparedCaseIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-telemetry bg-slate-900 border border-slate-700 text-cyan-200"
              >
                <span>{`Pinned ${id}`}</span>
                <button
                  type="button"
                  onClick={() => toggleCompareCase(id)}
                  aria-label={`Remove ${id} from comparison`}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={clearComparedCases}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={comparedCaseIds.length < 2}
              onClick={() => setComparisonOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-400 text-slate-950 hover:bg-orange-300 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {comparedCaseIds.length < 2
                ? "Select 1 more run"
                : "Open Overlay Comparison"}
            </button>
          </div>
        </aside>
      )}

      {/* Multi-Case Comparison Workspace Modal (F12) */}
      {comparisonOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Multi-Case Telemetry Comparison"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
        >
          <div className="w-full max-w-6xl rounded-2xl border border-slate-700/80 bg-[#070b17] shadow-2xl p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-orange-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Cross-Run Telemetry Comparison (F12)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparing verified channels with preserved native units, separate Y-axes when investigations differ, and documented ignition alignment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setComparisonOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/50 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <X className="h-4 w-4" />
                Close Comparison
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Side-by-side Parameter Comparison Matrix */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Run</th>
                    <th className="py-2.5 px-3">Investigation</th>
                    <th className="py-2.5 px-3">Fuel</th>
                    <th className="py-2.5 px-3">O₂ (%)</th>
                    <th className="py-2.5 px-3">Pressure</th>
                    <th className="py-2.5 px-3">Z_st</th>
                    <th className="py-2.5 px-3">Ignition Event t₀</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {loadedRuns.map((run, idx) => {
                    const c = run.caseDetail;
                    const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
                    const alignedEntry = alignedRuns.find(
                      (a) => a.caseDetail.case_id === c.case_id,
                    );
                    const ignitionEv = (c.events ?? []).find((ev) =>
                      /ignition/i.test(ev.label),
                    );
                    const t0 =
                      alignedEntry?.ignitionTimeS ?? ignitionEv?.time_s ?? null;
                    return (
                      <tr key={c.case_id}>
                        <td className="py-2.5 px-3 font-mono-telemetry font-semibold">
                          <span className="inline-flex items-center gap-2 text-slate-100">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            {`Run ${c.case_id}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {c.investigation}
                        </td>
                        <td className="py-2.5 px-3 text-orange-300">
                          {c.fuel ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono-telemetry text-cyan-200">
                          {c.o2_pct !== null
                            ? `${formatNumber(c.o2_pct, 2)}%`
                            : "null"}
                        </td>
                        <td className="py-2.5 px-3 font-mono-telemetry text-slate-200">
                          {c.pressure_kpa !== null
                            ? `${formatNumber(c.pressure_kpa, 1)} kPa (${formatNumber(kpaToPsi(c.pressure_kpa), 1)} psi)`
                            : "null"}
                        </td>
                        <td className="py-2.5 px-3 font-mono-telemetry text-slate-200">
                          {c.z_st !== null && c.z_st !== undefined
                            ? formatNumber(c.z_st, 4)
                            : "null"}
                        </td>
                        <td className="py-2.5 px-3 font-mono-telemetry text-amber-200">
                          {t0 !== null ? `${t0.toFixed(1)} s` : "No ignition log"}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setComparisonOpen(false);
                              navigate(`/cases/${encodeURIComponent(c.case_id)}`);
                            }}
                            className="inline-flex items-center gap-1 text-cyan-300 hover:underline cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCompareCase(c.case_id)}
                            className="text-slate-400 hover:text-rose-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mode Banner + Dataset / Channel / Alignment Controls */}
            {isCrossInvestigation && (
              <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/20 px-3.5 py-2.5 text-xs text-cyan-100 flex items-start gap-2.5">
                <Layers className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">
                    Cross-Investigation Dual-Axis Mode:
                  </span>{" "}
                  Incompatible units across investigations are plotted on{" "}
                  <span className="text-cyan-300 font-semibold">
                    separate Y-axes
                  </span>{" "}
                  (left vs right) rather than coerced onto a single scale.
                </div>
              </div>
            )}

            {excludedRunsInShared.length > 0 && (
              <div className="rounded-xl border border-amber-500/35 bg-amber-950/20 px-3.5 py-2 text-xs text-amber-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  {`Omitted from ${selectedSuffix} overlay (incompatible dataset family): ${excludedRunsInShared
                    .map((r) => r.caseDetail.case_id)
                    .join(", ")}`}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {loadedRuns.length >= 2 && (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  {!isCrossInvestigation ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label
                          htmlFor="compare-dataset-select"
                          className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400 mb-1"
                        >
                          Common Dataset
                        </label>
                        <select
                          id="compare-dataset-select"
                          value={selectedSuffix}
                          onChange={(e) => setSelectedSuffix(e.target.value)}
                          className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                        >
                          {commonSuffixOptions.map((opt) => (
                            <option key={opt.suffix} value={opt.suffix}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="compare-channel-select"
                          className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400 mb-1"
                        >
                          Common Numeric Channel (Matching Units)
                        </label>
                        <select
                          id="compare-channel-select"
                          value={selectedChannelKey}
                          onChange={(e) => setSelectedChannelKey(e.target.value)}
                          className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                        >
                          {commonNumericChannels.map((col) => (
                            <option key={col.key} value={col.key}>
                              {col.label} [{col.unit ?? "raw"}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1">
                      {loadedRuns.map((run, idx) => {
                        const cid = run.caseDetail.case_id;
                        const color =
                          COMPARE_COLORS[idx % COMPARE_COLORS.length];
                        const chosenDsId =
                          perRunDatasetId[cid] ??
                          run.caseDetail.datasets[0]?.dataset_id ??
                          "";
                        const ds =
                          run.caseDetail.datasets.find(
                            (d) => d.dataset_id === chosenDsId,
                          ) ?? run.caseDetail.datasets[0];
                        const effectiveDs = ds
                          ? loadedDatasets[ds.dataset_id]?.dataset ?? ds
                          : undefined;
                        const channels = effectiveDs
                          ? getNumericChannels(effectiveDs)
                          : [];
                        const activeCol = effectiveDs
                          ? pickDefaultChannel(
                              effectiveDs,
                              perRunChannelKey[cid],
                            )
                          : undefined;
                        return (
                          <div
                            key={cid}
                            className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 flex flex-wrap items-center gap-2"
                          >
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-mono-telemetry font-semibold text-slate-100 min-w-[115px]"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              {`Run ${cid}`}
                            </span>
                            <select
                              aria-label={`${cid} dataset`}
                              value={ds?.dataset_id ?? ""}
                              onChange={(e) => {
                                const nextDsId = e.target.value;
                                setPerRunDatasetId((prev) => ({
                                  ...prev,
                                  [cid]: nextDsId,
                                }));
                                setPerRunChannelKey((prev) => {
                                  const next = { ...prev };
                                  delete next[cid];
                                  return next;
                                });
                              }}
                              className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-cyan-400"
                            >
                              {run.caseDetail.datasets.map((d) => (
                                <option key={d.dataset_id} value={d.dataset_id}>
                                  {d.label}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label={`${cid} channel`}
                              value={activeCol?.key ?? ""}
                              onChange={(e) =>
                                setPerRunChannelKey((prev) => ({
                                  ...prev,
                                  [cid]: e.target.value,
                                }))
                              }
                              className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-cyan-400 flex-1 min-w-[140px]"
                            >
                              {channels.map((col) => (
                                <option key={col.key} value={col.key}>
                                  {col.label} [{col.unit ?? "raw"}]
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAlignToIgnition((v) => !v)}
                      aria-pressed={alignToIgnition}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer",
                        alignToIgnition
                          ? "bg-amber-500/20 border-amber-400/60 text-amber-100"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {alignToIgnition
                          ? "Time: Aligned to Verified Ignition (Δt)"
                          : "Time: Raw Sensor Base (time_s)"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = chartInstanceRef.current?.getDataURL({
                          type: "png",
                          pixelRatio: 2,
                          backgroundColor: "#050812",
                        });
                        if (url) {
                          downloadDataUrl(
                            url,
                            `comparison-${comparedCaseIds.join("-vs-")}.png`,
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Save Snapshot
                    </button>
                  </div>
                </div>
              )}

              {/* Permanently mounted canvas container while dialog is open */}
              <div className="relative rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
                <div
                  ref={chartRef}
                  data-testid="multi-case-compare-canvas"
                  className="w-full h-[350px]"
                />
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#050812]/80 backdrop-blur-[1px]">
                    <span className="text-xs font-mono-telemetry text-cyan-200 animate-pulse">
                      Loading verified telemetry channels for comparison…
                    </span>
                  </div>
                )}
                {!isLoading && !error && !hasRenderedSeries && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#050812]/80 text-xs text-slate-300">
                    {comparedCaseIds.length < 2
                      ? "Pin at least 2 runs to overlay telemetry."
                      : "No plottable numeric telemetry points in the selected datasets."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
