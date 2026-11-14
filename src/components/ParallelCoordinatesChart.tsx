import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { AlertCircle, Camera, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { DatasetColumn, DatasetData } from "../api/types";
import { cn, downloadDataUrl } from "../lib/utils";

interface ParallelCoordinatesChartProps {
  datasetData: DatasetData;
  sourceLabel: string;
}

const MAX_PARALLEL_AXES = 7;
const MAX_PARALLEL_POLYLINES = 1500;

function formatParallelAxisLabel(col: DatasetColumn): string {
  const unit = col.unit ?? "raw";
  const shortLabel = col.label.length > 22 ? col.key : col.label;
  return `${shortLabel}\n[${unit}]`;
}

export function ParallelCoordinatesChart({
  datasetData,
  sourceLabel,
}: ParallelCoordinatesChartProps) {
  const { dataset, rows } = datasetData;

  const numericColumns = useMemo(
    () => dataset.columns.filter((c) => c.data_type === "number"),
    [dataset.columns],
  );

  const defaultSelectedKeys = useMemo(() => {
    const keys: string[] = [];
    const available = new Set(numericColumns.map((c) => c.key));
    if (dataset.default_x && available.has(dataset.default_x)) {
      keys.push(dataset.default_x);
    }
    for (const k of dataset.default_y) {
      if (available.has(k) && !keys.includes(k)) {
        keys.push(k);
      }
    }
    for (const col of numericColumns) {
      if (keys.length >= 5) break;
      if (!keys.includes(col.key)) {
        keys.push(col.key);
      }
    }
    return keys.slice(0, MAX_PARALLEL_AXES);
  }, [dataset.default_x, dataset.default_y, numericColumns]);

  const [selectedKeys, setSelectedKeys] =
    useState<string[]>(defaultSelectedKeys);

  useEffect(() => {
    setSelectedKeys(defaultSelectedKeys);
  }, [dataset.dataset_id, defaultSelectedKeys]);

  const activeColumns = useMemo(
    () => numericColumns.filter((c) => selectedKeys.includes(c.key)),
    [numericColumns, selectedKeys],
  );

  const { plottedRows, completeCount, excludedCount, isStrided } = useMemo(() => {
    if (activeColumns.length < 2) {
      return {
        plottedRows: [] as number[][],
        completeCount: 0,
        excludedCount: rows.length,
        isStrided: false,
      };
    }

    const colIndices = activeColumns.map((col) =>
      dataset.columns.findIndex((c) => c.key === col.key),
    );
    const complete: number[][] = [];
    let excluded = 0;

    for (const row of rows) {
      const tuple: number[] = [];
      let valid = true;
      for (const idx of colIndices) {
        const val = idx >= 0 ? row[idx] : null;
        if (typeof val !== "number" || !Number.isFinite(val)) {
          valid = false;
          break;
        }
        tuple.push(val);
      }
      if (valid) {
        complete.push(tuple);
      } else {
        excluded += 1;
      }
    }

    if (complete.length <= MAX_PARALLEL_POLYLINES) {
      return {
        plottedRows: complete,
        completeCount: complete.length,
        excludedCount: excluded,
        isStrided: false,
      };
    }

    const step = (complete.length - 1) / (MAX_PARALLEL_POLYLINES - 1);
    const sampled: number[][] = [];
    for (let i = 0; i < MAX_PARALLEL_POLYLINES; i += 1) {
      sampled.push(complete[Math.round(i * step)]);
    }
    return {
      plottedRows: sampled,
      completeCount: complete.length,
      excludedCount: excluded,
      isStrided: true,
    };
  }, [activeColumns, dataset.columns, rows]);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    instanceRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart || activeColumns.length < 2) return;

    const firstCol = activeColumns[0];
    let minFirst = Infinity;
    let maxFirst = -Infinity;
    for (const row of plottedRows) {
      const v = row[0];
      if (v < minFirst) minFirst = v;
      if (v > maxFirst) maxFirst = v;
    }
    if (!Number.isFinite(minFirst) || !Number.isFinite(maxFirst)) {
      minFirst = 0;
      maxFirst = 1;
    }
    if (minFirst === maxFirst) {
      maxFirst = minFirst + 1;
    }

    chart.resize();
    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: plottedRows.length <= 600,
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(9, 14, 28, 0.96)",
          borderColor: "rgba(56, 189, 248, 0.45)",
          textStyle: { color: "#e2e8f0", fontSize: 12 },
          formatter: (params: unknown) => {
            const p = params as { value?: number[] };
            if (!Array.isArray(p?.value)) return "";
            return activeColumns
              .map((col, idx) => {
                const rawVal = p.value?.[idx];
                const formatted =
                  typeof rawVal === "number" ? rawVal.toPrecision(5) : "null";
                return `<b>${col.label}</b>: ${formatted}${col.unit ? ` ${col.unit}` : ""}`;
              })
              .join("<br/>");
          },
        },
        visualMap: {
          show: true,
          type: "continuous",
          dimension: 0,
          min: minFirst,
          max: maxFirst,
          orient: "horizontal",
          left: "center",
          bottom: 4,
          itemWidth: 12,
          itemHeight: 160,
          text: [
            `High ${firstCol.key}`,
            `Low ${firstCol.key}`,
          ],
          textStyle: { color: "#94a3b8", fontSize: 10 },
          inRange: {
            color: ["#06b6d4", "#38bdf8", "#a78bfa", "#fb923c"],
          },
        },
        parallelAxis: activeColumns.map((col, idx) => ({
          dim: idx,
          name: formatParallelAxisLabel(col),
          nameLocation: "end",
          nameGap: 18,
          nameTextStyle: {
            color: "#cbd5e1",
            fontSize: 11,
            lineHeight: 14,
          },
          axisLine: { lineStyle: { color: "#475569", width: 1.5 } },
          axisTick: { lineStyle: { color: "#64748b" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          areaSelectStyle: {
            width: 18,
            borderWidth: 1,
            borderColor: "rgba(34, 211, 238, 0.9)",
            color: "rgba(34, 211, 238, 0.16)",
          },
        })),
        parallel: {
          top: 56,
          left: 64,
          right: 64,
          bottom: 54,
          parallelAxisDefault: {
            type: "value",
            realtime: true,
          },
        },
        series: [
          {
            name: dataset.label,
            type: "parallel",
            smooth: 0.15,
            lineStyle: {
              width: 1.4,
              opacity: plottedRows.length > 400 ? 0.35 : 0.65,
            },
            emphasis: {
              lineStyle: {
                width: 2.8,
                opacity: 1,
                color: "#f8fafc",
              },
            },
            data: plottedRows,
          },
        ],
      },
      true,
    );
  }, [activeColumns, dataset.label, plottedRows]);

  const toggleAxis = (key: string) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 2) return prev;
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= MAX_PARALLEL_AXES) {
        return [...prev.slice(1), key];
      }
      return [...prev, key];
    });
  };

  if (numericColumns.length < 2) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-400">
        This dataset has fewer than two numeric columns, so a parallel coordinates view cannot be constructed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-violet-400" />
            <span>
              Drag along any vertical axis inside the canvas to brush samples locally across channels (2–{MAX_PARALLEL_AXES} axes).
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-slate-900 border border-slate-700/80 text-slate-200">
            {isStrided
              ? `${plottedRows.length} strided samples (${completeCount} complete rows)`
              : `${completeCount} complete rows plotted`}
          </span>
          {excludedCount > 0 && (
            <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-amber-500/15 border border-amber-500/35 text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              {excludedCount} row{excludedCount === 1 ? "" : "s"} excluded (null/non-numeric)
            </span>
          )}
          <button
            type="button"
            onClick={() => setSelectedKeys(defaultSelectedKeys)}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Defaults
          </button>
          <button
            type="button"
            onClick={() => {
              const url = instanceRef.current?.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#050812",
              });
              if (url) {
                downloadDataUrl(url, `${dataset.dataset_id}-parallel.png`);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-violet-400/50 hover:text-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="h-3 w-3" />
            Export PNG
          </button>
        </div>
      </div>

      {/* Axis selector pills */}
      <div className="flex flex-wrap gap-1.5">
        {numericColumns.map((col) => {
          const active = selectedKeys.includes(col.key);
          return (
            <button
              key={col.key}
              type="button"
              onClick={() => toggleAxis(col.key)}
              aria-pressed={active}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs border transition-all flex items-center gap-1.5 cursor-pointer",
                active
                  ? "bg-violet-500/20 border-violet-400/60 text-violet-100"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700",
              )}
            >
              <span>{col.label}</span>
              <span className="text-[10px] font-mono-telemetry opacity-75">
                [{col.unit ?? "raw"}]
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        <div
          ref={chartRef}
          data-testid="parallel-coords-canvas"
          className="w-full h-[460px]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>Source: {sourceLabel}</span>
        <span>
          Brushing filters local telemetry trajectories only; null samples are never coerced to zero.
        </span>
      </div>
    </div>
  );
}
