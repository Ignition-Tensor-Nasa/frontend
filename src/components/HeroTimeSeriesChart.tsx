import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { Camera, RotateCcw, ZoomIn } from "lucide-react";
import type { CaseEvent, DatasetColumn, DatasetData } from "../api/types";
import { cn, downloadDataUrl } from "../lib/utils";

const SERIES_COLORS = [
  "#22d3ee", // cyan
  "#fb923c", // combustion orange
  "#a78bfa", // violet
  "#34d399", // emerald
  "#f472b6", // rose
  "#facc15", // amber
];

interface HeroTimeSeriesChartProps {
  datasetData: DatasetData;
  sourceLabel: string;
  events?: CaseEvent[];
}

function unitLabel(unit: string | null): string {
  return unit === null ? "raw (unitless)" : unit;
}

function formatEventTime(timeS: number): string {
  return `${Number(timeS.toFixed(1))} s`;
}

export function HeroTimeSeriesChart({
  datasetData,
  sourceLabel,
  events = [],
}: HeroTimeSeriesChartProps) {
  const { dataset, rows } = datasetData;

  const numericColumns = useMemo(
    () => dataset.columns.filter((col) => col.data_type === "number"),
    [dataset.columns],
  );

  const xColumn: DatasetColumn | null = useMemo(() => {
    if (dataset.default_x) {
      const found = numericColumns.find((c) => c.key === dataset.default_x);
      if (found) return found;
    }
    return numericColumns[0] ?? null;
  }, [dataset.default_x, numericColumns]);

  const yCandidates = useMemo(
    () =>
      numericColumns.filter((c) => !xColumn || c.key !== xColumn.key),
    [numericColumns, xColumn],
  );

  const defaultChannels = useMemo(() => {
    const allowed = new Set(yCandidates.map((c) => c.key));
    const curated = dataset.default_y.filter((k) => allowed.has(k));
    if (curated.length > 0) return curated;
    return yCandidates.slice(0, 3).map((c) => c.key);
  }, [dataset.default_y, yCandidates]);

  const [selectedChannels, setSelectedChannels] =
    useState<string[]>(defaultChannels);
  const [zoomKey, setZoomKey] = useState<number>(0);

  // Sync default channels whenever dataset changes
  useEffect(() => {
    setSelectedChannels(defaultChannels);
    setZoomKey((k) => k + 1);
  }, [dataset.dataset_id, defaultChannels]);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const activeColumns = useMemo(
    () => yCandidates.filter((c) => selectedChannels.includes(c.key)),
    [yCandidates, selectedChannels],
  );

  // Group active channels by unit so incompatible units never share one scale
  const unitGroups = useMemo(() => {
    const groups: { unitKey: string; displayUnit: string; cols: DatasetColumn[] }[] = [];
    const byKey = new Map<string, { unitKey: string; displayUnit: string; cols: DatasetColumn[] }>();
    for (const col of activeColumns) {
      const unitKey = col.unit ?? "__unitless__";
      let group = byKey.get(unitKey);
      if (!group) {
        group = {
          unitKey,
          displayUnit: unitLabel(col.unit),
          cols: [],
        };
        byKey.set(unitKey, group);
        groups.push(group);
      }
      group.cols.push(col);
    }
    return groups;
  }, [activeColumns]);

  const useTwoPanels = unitGroups.length >= 2;

  const toggleChannel = (key: string) => {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartInstanceRef.current = chart;

    const ro = new ResizeObserver(() => {
      chart.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    if (activeColumns.length === 0 || rows.length === 0) {
      chart.clear();
      return;
    }

    const colIndexByKey = new Map<string, number>();
    dataset.columns.forEach((c, idx) => colIndexByKey.set(c.key, idx));
    const xIdx = xColumn ? (colIndexByKey.get(xColumn.key) ?? -1) : -1;

    const xAxisTitle = xColumn
      ? xColumn.unit
        ? `${xColumn.label} [${xColumn.unit}]`
        : xColumn.label
      : "Sample Index";

    // Build ECharts grids & axes separating incompatible units cleanly
    const grids: echarts.GridComponentOption[] = useTwoPanels
      ? [
        { left: 68, right: unitGroups.length > 2 ? 72 : 34, top: 36, height: "34%" },
        { left: 68, right: unitGroups.length > 2 ? 72 : 34, top: "53%", height: "31%" },
      ]
      : [{ left: 68, right: 34, top: 40, bottom: 78 }];

    const xAxes: echarts.XAXisComponentOption[] = useTwoPanels
      ? [
        {
          type: "value",
          gridIndex: 0,
          scale: true,
          axisLabel: { show: false },
          axisLine: { lineStyle: { color: "#334155" } },
          splitLine: { lineStyle: { color: "rgba(51,65,85,0.35)" } },
        },
        {
          type: "value",
          gridIndex: 1,
          scale: true,
          name: xAxisTitle,
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLabel: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          splitLine: { lineStyle: { color: "rgba(51,65,85,0.35)" } },
        },
      ]
      : [
        {
          type: "value",
          gridIndex: 0,
          scale: true,
          name: xAxisTitle,
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLabel: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          splitLine: { lineStyle: { color: "rgba(51,65,85,0.35)" } },
        },
      ];

    const yAxes: echarts.YAXisComponentOption[] = [];
    const series: echarts.SeriesOption[] = [];
    const markedGrids = new Set<number>();

    unitGroups.forEach((group, groupIdx) => {
      const gridIndex = useTwoPanels ? (groupIdx === 0 ? 0 : 1) : 0;
      const isRightSecondary = useTwoPanels && groupIdx >= 2;
      const yAxisIndex = yAxes.length;

      yAxes.push({
        type: "value",
        gridIndex,
        scale: true,
        position: isRightSecondary ? "right" : "left",
        name: group.displayUnit,
        nameTextStyle: {
          color: "#cbd5e1",
          fontSize: 11,
          fontWeight: 600,
          align: isRightSecondary ? "right" : "left",
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (val: number) =>
            Math.abs(val) >= 10000 || (Math.abs(val) > 0 && Math.abs(val) < 0.001)
              ? val.toExponential(2)
              : String(Number(val.toPrecision(4))),
        },
        axisLine: { lineStyle: { color: "#334155" } },
        splitLine: {
          show: !isRightSecondary,
          lineStyle: { color: "rgba(51,65,85,0.35)" },
        },
      });

      group.cols.forEach((col) => {
        const yIdx = colIndexByKey.get(col.key) ?? -1;
        if (yIdx < 0) return;

        const colorIdx = activeColumns.findIndex((c) => c.key === col.key);
        const color = SERIES_COLORS[colorIdx % SERIES_COLORS.length];

        // Preserve nulls explicitly as gaps (connectNulls: false)
        const points: [number, number | null][] = [];
        rows.forEach((row, rowIdx) => {
          const rawX = xIdx >= 0 ? row[xIdx] : rowIdx;
          if (typeof rawX !== "number" || !Number.isFinite(rawX)) return;
          const rawY = row[yIdx];
          points.push([rawX, typeof rawY === "number" ? rawY : null]);
        });

        series.push({
          name: col.unit ? `${col.label} [${col.unit}]` : col.label,
          type: "line",
          xAxisIndex: gridIndex,
          yAxisIndex,
          data: points,
          connectNulls: false,
          showSymbol: points.length <= 60,
          symbolSize: 5,
          smooth: false,
          sampling: points.length > 1000 ? "lttb" : undefined,
          lineStyle: {
            width: 2,
            color,
          },
          itemStyle: {
            color,
          },
          emphasis: {
            focus: "series",
          },
          ...(events.length > 0 && !markedGrids.has(gridIndex)
            ? (() => {
              markedGrids.add(gridIndex);
              return {
                markLine: {
                  symbol: ["none", "none"],
                  silent: false,
                  lineStyle: {
                    color: "#f59e0b",
                    type: "dashed" as const,
                    width: 1.5,
                  },
                  label: {
                    show: gridIndex === 0,
                    position: "insideEndTop" as const,
                    formatter: (param: { name?: string }) => param.name ?? "",
                    color: "#fde68a",
                    backgroundColor: "rgba(15, 23, 42, 0.85)",
                    padding: [2, 5],
                    borderRadius: 4,
                    fontSize: 10,
                  },
                  data: events.map((ev) => ({
                    name: `${ev.label} (${ev.time_s.toFixed(1)}s)`,
                    xAxis: ev.time_s,
                  })),
                },
              };
            })()
            : {}),
        });
      });
    });

    const option: echarts.EChartsOption = {
      animation: rows.length <= 5000,
      animationDuration: 300,
      animationDurationUpdate: 220,
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.96)",
        borderColor: "rgba(34, 211, 238, 0.45)",
        borderWidth: 1,
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        axisPointer: {
          type: "cross",
          lineStyle: { color: "rgba(34, 211, 238, 0.5)", type: "dashed" },
        },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          if (list.length === 0) return "";
          const first = list[0] as { axisValue?: number };
          const xVal = first.axisValue;
          const xUnit = xColumn?.unit ? ` ${xColumn.unit}` : "";
          const header = `<div style="font-family:monospace;color:#67e8f9;margin-bottom:4px;font-weight:600;">${xColumn?.label ?? "Sample"}: ${xVal ?? "—"}${xUnit}</div>`;
          const lines = list
            .map((entry) => {
              const item = entry as {
                marker?: string;
                seriesName?: string;
                value?: [number, number | null];
              };
              const yVal = item.value?.[1];
              const formatted =
                yVal === null || yVal === undefined
                  ? '<span style="color:#94a3b8;font-style:italic">null (gap)</span>'
                  : `<span style="font-family:monospace;font-weight:600">${Number(yVal.toPrecision(5))}</span>`;
              return `<div style="display:flex;justify-content:space-between;gap:14px;align-items:center;"><span>${item.marker ?? ""} ${item.seriesName ?? ""}</span>${formatted}</div>`;
            })
            .join("");
          return header + lines;
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: "all" }],
      },
      legend: {
        type: "scroll",
        top: 4,
        left: 16,
        right: 16,
        textStyle: { color: "#cbd5e1", fontSize: 11 },
        inactiveColor: "#475569",
      },
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: useTwoPanels ? [0, 1] : [0],
          filterMode: "none",
        },
        {
          type: "slider",
          xAxisIndex: useTwoPanels ? [0, 1] : [0],
          bottom: 10,
          height: 22,
          borderColor: "rgba(51,65,85,0.8)",
          backgroundColor: "rgba(15,23,42,0.8)",
          fillerColor: "rgba(34,211,238,0.16)",
          handleStyle: { color: "#22d3ee" },
          textStyle: { color: "#94a3b8", fontSize: 10 },
          filterMode: "none",
        },
      ],
      toolbox: {
        right: 14,
        top: 2,
        feature: {
          dataZoom: {
            yAxisIndex: "none",
            title: { zoom: "Box Zoom", back: "Undo Zoom" },
          },
        },
        iconStyle: {
          borderColor: "#94a3b8",
        },
      },
      series,
    };

    chart.resize();
    chart.setOption(option, { notMerge: true });
  }, [
    activeColumns,
    dataset.columns,
    events,
    rows,
    unitGroups,
    useTwoPanels,
    xColumn,
    zoomKey,
  ]);

  const handleResetZoom = () => {
    setZoomKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Channel Selector & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400 mr-1">
            Channels:
          </span>
          {yCandidates.map((col) => {
            const active = selectedChannels.includes(col.key);
            const activeIdx = activeColumns.findIndex((c) => c.key === col.key);
            const dotColor =
              active && activeIdx >= 0
                ? SERIES_COLORS[activeIdx % SERIES_COLORS.length]
                : undefined;

            return (
              <button
                key={col.key}
                type="button"
                onClick={() => toggleChannel(col.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer",
                  active
                    ? "bg-slate-800/95 border-cyan-400/50 text-slate-100 shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor ?? "#475569" }}
                />
                <span>{col.label}</span>
                <span className="text-[10px] font-mono-telemetry text-slate-400">
                  [{col.unit ?? "raw"}]
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedChannels(defaultChannels)}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Default Channels
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ZoomIn className="h-3 w-3" />
            Reset Zoom
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
                downloadDataUrl(url, `${dataset.dataset_id}-timeseries.png`);
              }
            }}
            disabled={activeColumns.length === 0}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="h-3 w-3" />
            Export PNG
          </button>
        </div>
      </div>

      {/* Unit separation notice */}
      {unitGroups.length > 1 && (
        <div className="text-[11px] text-cyan-200/80 bg-cyan-950/25 border border-cyan-500/25 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <span>
            Incompatible sensor units ({unitGroups.map((g) => g.displayUnit).join(" · ")}) are separated across linked panels/axes rather than merged on one scale.
          </span>
          <span className="font-mono-telemetry text-slate-400">
            Null samples render as gaps
          </span>
        </div>
      )}

      {/* Event log marker notice (B13) */}
      {events.length > 0 && (
        <div className="text-[11px] text-amber-200/90 bg-amber-950/25 border border-amber-500/30 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-amber-300">
              Test-point script log (*_TP.txt), ~1 s resolution:
            </span>
            {events.map((ev, idx) => (
              <span
                key={`${ev.label}-${idx}`}
                className="font-mono-telemetry px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-100"
              >
                {ev.label} @ {formatEventTime(ev.time_s)}
              </span>
            ))}
          </div>
          <span className="font-mono-telemetry text-slate-400">
            Source: {Array.from(new Set(events.map((e) => e.source))).join(", ")}
          </span>
        </div>
      )}

      {/* Main ECharts Canvas */}
      <div className="relative rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        {activeColumns.length === 0 && (
          <div className="h-[440px] flex flex-col items-center justify-center text-center gap-2 text-sm text-slate-400">
            <p>Select at least one telemetry channel above to render the time series.</p>
            <button
              type="button"
              onClick={() => setSelectedChannels(defaultChannels)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 cursor-pointer"
            >
              Restore Default Channels
            </button>
          </div>
        )}
        <div
          ref={chartContainerRef}
          data-testid="hero-timeseries-canvas"
          className={cn(
            "w-full",
            useTwoPanels ? "h-[540px]" : "h-[440px]",
            activeColumns.length === 0 && "hidden",
          )}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>Source: {sourceLabel}</span>
        <span className="font-mono-telemetry">
          {rows.length} samples · Drag slider or scroll to zoom · Box zoom via top-right icon
        </span>
      </div>
    </div>
  );
}
