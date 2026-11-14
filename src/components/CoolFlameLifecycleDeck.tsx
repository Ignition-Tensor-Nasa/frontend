import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
  RefreshCw,
} from "lucide-react";
import { ApiError, getDatasetData } from "../api/client";
import type { CaseDetail, CaseEvent, DatasetData } from "../api/types";
import { useExplorer } from "../context/ExplorerContext";
import { cn } from "../lib/utils";

interface CoolFlameLifecycleDeckProps {
  caseDetail: CaseDetail;
}

interface PanelSeriesSpec {
  name: string;
  color: string;
  dashed?: boolean;
  data: [number, number | null][];
}

interface SynchronizedPanelSpec {
  id: string;
  title: string;
  subtitle: string;
  yAxisLabel: string;
  series: PanelSeriesSpec[];
  events?: CaseEvent[];
}

function extractTimeSeriesPairs(
  data: DatasetData | undefined,
  xKey: string,
  yKey: string,
  transformY?: (v: number) => number,
): [number, number | null][] {
  if (!data) return [];
  const xIdx = data.dataset.columns.findIndex((c) => c.key === xKey);
  const yIdx = data.dataset.columns.findIndex((c) => c.key === yKey);
  if (xIdx < 0 || yIdx < 0) return [];
  const out: [number, number | null][] = [];
  for (const row of data.rows) {
    const xv = row[xIdx];
    const yv = row[yIdx];
    if (typeof xv !== "number" || !Number.isFinite(xv)) continue;
    if (yv === null) {
      out.push([xv, null]);
    } else if (typeof yv === "number" && Number.isFinite(yv)) {
      out.push([xv, transformY ? transformY(yv) : yv]);
    }
  }
  return out;
}

function SynchronizedTierChart({
  spec,
  connectGroup,
  heightClass = "h-[200px]",
}: {
  spec: SynchronizedPanelSpec;
  connectGroup: string;
  heightClass?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chart.group = connectGroup;
    instanceRef.current = chart;
    echarts.connect(connectGroup);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      instanceRef.current = null;
    };
  }, [connectGroup]);

  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;

    const totalPoints = spec.series.reduce((sum, s) => sum + s.data.length, 0);
    const markLineData = (spec.events ?? []).map((ev) => ({
      name: ev.label,
      xAxis: ev.time_s,
      label: {
        formatter: `${ev.label} @ ${ev.time_s.toFixed(1)}s`,
        color: "#fde68a",
        fontSize: 10,
        position: "insideEndTop",
      },
      lineStyle: {
        color: "#f59e0b",
        type: "dashed",
        width: 1.4,
      },
    }));

    chart.resize();
    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: totalPoints <= 5000,
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          backgroundColor: "rgba(9, 14, 28, 0.96)",
          borderColor: "rgba(56, 189, 248, 0.45)",
          textStyle: { color: "#e2e8f0", fontSize: 11 },
        },
        legend: {
          top: 2,
          right: 12,
          textStyle: { color: "#cbd5e1", fontSize: 11 },
        },
        grid: {
          top: 30,
          left: 64,
          right: 22,
          bottom: 36,
        },
        xAxis: {
          type: "value",
          name: "t [s]",
          nameTextStyle: { color: "#94a3b8", fontSize: 10 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.3)" } },
        },
        yAxis: {
          type: "value",
          name: spec.yAxisLabel,
          nameTextStyle: { color: "#94a3b8", fontSize: 10 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.3)" } },
        },
        dataZoom: [
          { type: "inside", xAxisIndex: 0 },
        ],
        series: spec.series.map((s, idx) => ({
          name: s.name,
          type: "line",
          showSymbol: false,
          sampling: s.data.length > 1000 ? "lttb" : undefined,
          connectNulls: false,
          lineStyle: {
            width: 2,
            color: s.color,
            type: s.dashed ? "dashed" : "solid",
          },
          itemStyle: { color: s.color },
          markLine:
            idx === 0 && markLineData.length > 0
              ? { symbol: ["none", "none"], silent: true, data: markLineData }
              : undefined,
          data: s.data,
        })),
      },
      true,
    );
  }, [spec]);

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#050812]/90 p-3 space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-slate-100">
          {spec.title}
        </span>
        <span className="text-[11px] text-slate-400">{spec.subtitle}</span>
      </div>
      <div
        ref={containerRef}
        data-testid={`lifecycle-panel-${spec.id}`}
        className={cn("w-full", heightClass)}
      />
    </div>
  );
}

export function CoolFlameLifecycleDeck({
  caseDetail,
}: CoolFlameLifecycleDeckProps) {
  const { dataSourceMode, faultInjection, datasetCache, cacheDatasetData } =
    useExplorer();
  const datasetCacheRef = useRef(datasetCache);
  datasetCacheRef.current = datasetCache;

  const isFlex = caseDetail.investigation === "CFI (FLEX)";
  const [expanded, setExpanded] = useState<boolean>(isFlex);
  const [dropletMode, setDropletMode] = useState<"d2" | "d">("d2");
  const [loadedMap, setLoadedMap] = useState<Record<string, DatasetData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  useEffect(() => {
    setExpanded(caseDetail.investigation === "CFI (FLEX)");
    setLoadedMap({});
    setError(null);
  }, [caseDetail.case_id, caseDetail.investigation]);

  useEffect(() => {
    if (!expanded || caseDetail.datasets.length === 0) return;

    const currentCache = datasetCacheRef.current;
    const initialMap: Record<string, DatasetData> = {};
    const toFetch = caseDetail.datasets.filter((ds) => {
      const cached = currentCache[ds.dataset_id];
      if (cached) {
        initialMap[ds.dataset_id] = cached;
        return false;
      }
      return true;
    });

    setLoadedMap((prev) => ({ ...prev, ...initialMap }));
    if (toFetch.length === 0) {
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(
      toFetch.map(async (ds) => {
        const data = await getDatasetData(
          ds.dataset_id,
          ds,
          { mode: dataSourceMode, fault: faultInjection },
          controller.signal,
        );
        return data;
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const next: Record<string, DatasetData> = { ...initialMap };
        for (const data of results) {
          cacheDatasetData(data.dataset.dataset_id, data);
          next[data.dataset.dataset_id] = data;
        }
        setLoadedMap((prev) => ({ ...prev, ...next }));
      })
      .catch((err) => {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        const msg =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Could not load synchronized datasets.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    cacheDatasetData,
    caseDetail.datasets,
    dataSourceMode,
    expanded,
    faultInjection,
    reloadNonce,
  ]);

  const panels: SynchronizedPanelSpec[] = useMemo(() => {
    if (!expanded) return [];

    if (isFlex) {
      const dropletDs = caseDetail.datasets.find((d) =>
        d.dataset_id.endsWith("-droplet"),
      );
      const d2FitDs = caseDetail.datasets.find((d) =>
        d.dataset_id.endsWith("-d2-fit"),
      );
      const coolDs = caseDetail.datasets.find((d) =>
        d.dataset_id.endsWith("-coolflame"),
      );
      const radDs = caseDetail.datasets.find((d) =>
        d.dataset_id.endsWith("-radiometer"),
      );

      const dropletData = dropletDs ? loadedMap[dropletDs.dataset_id] : undefined;
      const d2FitData = d2FitDs ? loadedMap[d2FitDs.dataset_id] : undefined;
      const coolData = coolDs ? loadedMap[coolDs.dataset_id] : undefined;
      const radData = radDs ? loadedMap[radDs.dataset_id] : undefined;

      const list: SynchronizedPanelSpec[] = [];

      if (dropletData || d2FitData) {
        if (dropletMode === "d2" && d2FitData) {
          list.push({
            id: "droplet-d2-fit",
            title: "Tier 1 · Droplet D² & Backend Linear Fit",
            subtitle: `Backend dataset: ${d2FitData.dataset.label}`,
            yAxisLabel: "D² [mm²]",
            series: [
              {
                name: "D² (mm²)",
                color: "#22d3ee",
                data: extractTimeSeriesPairs(d2FitData, "time_s", "D2_mm2"),
              },
              {
                name: "Least-squares fit window (D²_fit)",
                color: "#facc15",
                dashed: true,
                data: extractTimeSeriesPairs(d2FitData, "time_s", "D2_fit_mm2"),
              },
            ],
          });
        } else if (dropletMode === "d2" && dropletData) {
          list.push({
            id: "droplet-d2-client",
            title: "Tier 1 · Droplet Diameter Squared (D²)",
            subtitle: "Client transform: D² = (DropletDiameter_mm)² from source mm",
            yAxisLabel: "D² [mm²]",
            series: [
              {
                name: "D² (computed from DropletDiameter_mm)",
                color: "#22d3ee",
                data: extractTimeSeriesPairs(
                  dropletData,
                  "time_s",
                  "DropletDiameter_mm",
                  (v) => Number((v * v).toFixed(4)),
                ),
              },
            ],
          });
        } else if (dropletData) {
          list.push({
            id: "droplet-d",
            title: "Tier 1 · Droplet Diameter (D)",
            subtitle: `Backend dataset: ${dropletData.dataset.label}`,
            yAxisLabel: "D [mm]",
            series: [
              {
                name: "Droplet Diameter (mm)",
                color: "#38bdf8",
                data: extractTimeSeriesPairs(
                  dropletData,
                  "time_s",
                  "DropletDiameter_mm",
                ),
              },
            ],
          });
        }
      }

      if (coolData) {
        list.push({
          id: "coolflame",
          title: "Tier 2 · Cool-Flame Diameter (FWHM & Peak-to-Peak)",
          subtitle: `Backend dataset: ${coolData.dataset.label}`,
          yAxisLabel: "Diameter [mm]",
          series: [
            {
              name: "Cool-Flame FWHM (mm)",
              color: "#a78bfa",
              data: extractTimeSeriesPairs(
                coolData,
                "time_s",
                "CoolFlameDiameterFWHM_mm",
              ),
            },
            {
              name: "Cool-Flame P2P (mm)",
              color: "#fb923c",
              data: extractTimeSeriesPairs(
                coolData,
                "time_s",
                "CoolFlameDiameterP2P_mm",
              ),
            },
          ],
        });
      }

      if (radData) {
        list.push({
          id: "radiometer",
          title: "Tier 3 · Radiometer Radiant Power",
          subtitle: `Backend dataset: ${radData.dataset.label}`,
          yAxisLabel: "Power [W]",
          series: [
            {
              name: "Narrow-Band Power (W)",
              color: "#34d399",
              data: extractTimeSeriesPairs(
                radData,
                "time_s",
                "TotalNarrowBandPower_W",
              ),
            },
            {
              name: "Wide-Band Power (W)",
              color: "#f472b6",
              data: extractTimeSeriesPairs(
                radData,
                "time_s",
                "TotalWideBandPower_W",
              ),
            },
          ],
        });
      }

      return list;
    }

    // ACME CFI-G synchronized sensors + MFC setpoints
    const sensorsDs = caseDetail.datasets.find((d) =>
      d.dataset_id.endsWith("-sensors"),
    );
    const setpointsDs = caseDetail.datasets.find((d) =>
      d.dataset_id.endsWith("-mfc-setpoints"),
    );
    const sensorsData = sensorsDs ? loadedMap[sensorsDs.dataset_id] : undefined;
    const setpointsData = setpointsDs
      ? loadedMap[setpointsDs.dataset_id]
      : undefined;

    const list: SynchronizedPanelSpec[] = [];
    if (sensorsData) {
      list.push({
        id: "cfig-sensors",
        title: "Tier 1 · Synchronized Flame Sensors",
        subtitle: "Radiometer +30, PMT1, and Burner TC with verified script events",
        yAxisLabel: "raw",
        events: (caseDetail.events ?? []).filter(
          (ev) => ev.dataset_id === sensorsData.dataset.dataset_id,
        ),
        series: [
          {
            name: "Radiometer +30 LoGain",
            color: "#22d3ee",
            data: extractTimeSeriesPairs(
              sensorsData,
              "time_s",
              "Radiometer3+30LoGain",
            ),
          },
          {
            name: "Photomultiplier PMT1",
            color: "#fb923c",
            data: extractTimeSeriesPairs(sensorsData, "time_s", "PMT1"),
          },
          {
            name: "Burner TC",
            color: "#a78bfa",
            data: extractTimeSeriesPairs(sensorsData, "time_s", "TCBurner"),
          },
        ],
      });
    }
    if (setpointsData) {
      list.push({
        id: "cfig-setpoints",
        title: "Tier 2 · Commanded Mass-Flow Controller Setpoints",
        subtitle: "MFC A1 / A2 / A3 commanded voltage along shared time_s",
        yAxisLabel: "Setpoint [V]",
        series: [
          {
            name: "MFC A1 Setpoint (V)",
            color: "#34d399",
            data: extractTimeSeriesPairs(
              setpointsData,
              "time_s",
              "MFCA1Setpoint(V)",
            ),
          },
          {
            name: "MFC A2 Setpoint (V)",
            color: "#38bdf8",
            data: extractTimeSeriesPairs(
              setpointsData,
              "time_s",
              "MFCA2Setpoint(V)",
            ),
          },
          {
            name: "MFC A3 Fuel Setpoint (V)",
            color: "#f472b6",
            data: extractTimeSeriesPairs(
              setpointsData,
              "time_s",
              "MFCA3Setpoint(V)",
            ),
          },
        ],
      });
    }
    return list;
  }, [caseDetail.datasets, caseDetail.events, dropletMode, expanded, isFlex, loadedMap]);

  if (caseDetail.datasets.length < 2) {
    return null;
  }

  const connectGroup = `lifecycle-${caseDetail.case_id}`;

  return (
    <section
      aria-label="Synchronized Multi-Dataset Lifecycle"
      className="panel-surface rounded-2xl p-4 sm:p-5 space-y-4 animate-panel-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            {isFlex ? (
              <Flame className="h-4 w-4 text-orange-400" />
            ) : (
              <Layers className="h-4 w-4 text-cyan-400" />
            )}
            <h2 className="text-base font-semibold text-white tracking-tight">
              {isFlex
                ? "Cool-Flame Droplet Lifecycle Deck (F13)"
                : "Synchronized Multi-Dataset Deck (F13)"}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-orange-500/15 border border-orange-400/35 text-orange-200">
              {caseDetail.datasets.length} linked datasets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isFlex
              ? "Linked crosshair & zoom across Droplet D/D², Cool-Flame FWHM/P2P, and Radiometer power along shared time_s."
              : "Align sensor telemetry with commanded MFC voltage profiles and verified test-point log events along time_s."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {expanded && isFlex && (
            <div className="inline-flex items-center rounded-lg border border-slate-700/80 bg-slate-950/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDropletMode("d2")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors",
                  dropletMode === "d2"
                    ? "bg-cyan-500/25 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Show D² (mm²)
              </button>
              <button
                type="button"
                onClick={() => setDropletMode("d")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors",
                  dropletMode === "d"
                    ? "bg-cyan-500/25 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Show D (mm)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700/85 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              {expanded
                ? "Collapse Lifecycle Deck"
                : "Launch Synchronized Multi-Dataset View (F13)"}
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-44 rounded-xl bg-slate-900/80 border border-slate-800" />
          <div className="h-44 rounded-xl bg-slate-900/80 border border-slate-800" />
        </div>
      )}

      {expanded && error && !loading && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-100 hover:bg-rose-500/30 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Synchronized Load
          </button>
        </div>
      )}

      {expanded && !loading && !error && panels.length > 0 && (
        <div className="space-y-3">
          {panels.map((spec) => (
            <SynchronizedTierChart
              key={spec.id}
              spec={spec}
              connectGroup={connectGroup}
            />
          ))}
        </div>
      )}
    </section>
  );
}
