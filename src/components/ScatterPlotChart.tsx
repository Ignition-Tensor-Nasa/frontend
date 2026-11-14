import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import { AlertCircle, Camera } from "lucide-react";
import type { DatasetColumn, DatasetData } from "../api/types";
import { downloadDataUrl } from "../lib/utils";

interface ScatterPlotChartProps {
  datasetData: DatasetData;
  sourceLabel: string;
}

function formatAxisName(col: DatasetColumn | undefined): string {
  if (!col) return "";
  return col.unit ? `${col.label} [${col.unit}]` : `${col.label} [raw]`;
}

export function ScatterPlotChart({
  datasetData,
  sourceLabel,
}: ScatterPlotChartProps) {
  const { dataset, rows } = datasetData;

  const numericColumns = useMemo(
    () => dataset.columns.filter((c) => c.data_type === "number"),
    [dataset.columns],
  );

  // Curated numeric X/Y defaults (F08): pick first two default_y channels if >= 2 exist,
  // otherwise fall back to default_x vs default_y[0]
  const [defaultXKey, defaultYKey] = useMemo(() => {
    const numKeys = new Set(numericColumns.map((c) => c.key));
    const validY = dataset.default_y.filter((k) => numKeys.has(k));
    if (validY.length >= 2) {
      return [validY[0], validY[1]];
    }
    const xFallback =
      dataset.default_x && numKeys.has(dataset.default_x)
        ? dataset.default_x
        : (numericColumns[0]?.key ?? "");
    const yFallback =
      validY[0] ??
      numericColumns.find((c) => c.key !== xFallback)?.key ??
      xFallback;
    return [xFallback, yFallback];
  }, [dataset.default_x, dataset.default_y, numericColumns]);

  const [xKey, setXKey] = useState<string>(defaultXKey);
  const [yKey, setYKey] = useState<string>(defaultYKey);

  useEffect(() => {
    setXKey(defaultXKey);
    setYKey(defaultYKey);
  }, [dataset.dataset_id, defaultXKey, defaultYKey]);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const xCol = numericColumns.find((c) => c.key === xKey);
  const yCol = numericColumns.find((c) => c.key === yKey);

  const { points, excludedCount } = useMemo(() => {
    const xIdx = dataset.columns.findIndex((c) => c.key === xKey);
    const yIdx = dataset.columns.findIndex((c) => c.key === yKey);
    if (xIdx < 0 || yIdx < 0) {
      return { points: [] as [number, number, number][], excludedCount: rows.length };
    }
    const valid: [number, number, number][] = [];
    let excluded = 0;
    rows.forEach((row, idx) => {
      const xv = row[xIdx];
      const yv = row[yIdx];
      if (
        typeof xv === "number" &&
        Number.isFinite(xv) &&
        typeof yv === "number" &&
        Number.isFinite(yv)
      ) {
        valid.push([xv, yv, idx]);
      } else {
        excluded += 1;
      }
    });
    return { points: valid, excludedCount: excluded };
  }, [dataset.columns, rows, xKey, yKey]);

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
    if (!chart) return;
    if (!xCol || !yCol) {
      chart.clear();
      return;
    }

    const option: echarts.EChartsOption = {
      animation: points.length <= 5000,
      animationDuration: 260,
      backgroundColor: "transparent",
      grid: { left: 72, right: 34, top: 32, bottom: 56 },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.96)",
        borderColor: "rgba(251, 146, 60, 0.5)",
        borderWidth: 1,
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (param: unknown) => {
          const p = param as { value?: [number, number, number] };
          if (!p.value) return "";
          const [xv, yv, rowIdx] = p.value;
          return [
            `<div style="font-family:monospace;color:#fdba74;font-weight:600;margin-bottom:4px;">Sample #${rowIdx}</div>`,
            `<div>${formatAxisName(xCol)}: <strong style="font-family:monospace">${Number(xv.toPrecision(5))}</strong></div>`,
            `<div>${formatAxisName(yCol)}: <strong style="font-family:monospace">${Number(yv.toPrecision(5))}</strong></div>`,
          ].join("");
        },
      },
      xAxis: {
        type: "value",
        scale: true,
        name: formatAxisName(xCol),
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: "#cbd5e1", fontSize: 11 },
        axisLabel: { color: "#94a3b8", fontSize: 11 },
        axisLine: { lineStyle: { color: "#334155" } },
        splitLine: { lineStyle: { color: "rgba(51,65,85,0.35)" } },
      },
      yAxis: {
        type: "value",
        scale: true,
        name: formatAxisName(yCol),
        nameTextStyle: { color: "#cbd5e1", fontSize: 11 },
        axisLabel: { color: "#94a3b8", fontSize: 11 },
        axisLine: { lineStyle: { color: "#334155" } },
        splitLine: { lineStyle: { color: "rgba(51,65,85,0.35)" } },
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0, filterMode: "none" },
        { type: "inside", yAxisIndex: 0, filterMode: "none" },
      ],
      series: [
        {
          type: "scatter",
          data: points,
          large: points.length > 2000,
          largeThreshold: 2000,
          symbolSize: 8,
          itemStyle: {
            color: "#fb923c",
            borderColor: "#22d3ee",
            borderWidth: 1,
            opacity: 0.88,
          },
          emphasis: {
            scale: 1.45,
          },
        },
      ],
    };

    chart.setOption(option, { notMerge: true });
  }, [points, xCol, yCol]);

  if (numericColumns.length < 2) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
        This dataset has fewer than two numeric columns, so a 2D scatter plot cannot be constructed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label
              htmlFor="scatter-x-select"
              className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400 mb-1"
            >
              X-Axis Channel
            </label>
            <select
              id="scatter-x-select"
              value={xKey}
              onChange={(e) => setXKey(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700/85 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key}>
                  {formatAxisName(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="scatter-y-select"
              className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400 mb-1"
            >
              Y-Axis Channel
            </label>
            <select
              id="scatter-y-select"
              value={yKey}
              onChange={(e) => setYKey(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700/85 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              {numericColumns.map((c) => (
                <option key={c.key} value={c.key}>
                  {formatAxisName(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-slate-900 border border-slate-700/80 text-slate-200">
            {points.length} plotted points
          </span>
          {excludedCount > 0 && (
            <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-amber-500/15 border border-amber-500/35 text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              {excludedCount} row{excludedCount === 1 ? "" : "s"} excluded (null/non-numeric)
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              const url = instanceRef.current?.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#050812",
              });
              if (url) {
                downloadDataUrl(url, `${dataset.dataset_id}-scatter.png`);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-orange-400/50 hover:text-orange-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="h-3 w-3" />
            Export PNG
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        <div ref={chartRef} className="w-full h-[460px]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>Source: {sourceLabel}</span>
        <span>
          Intra-run sensor-space view only (scroll to zoom; does not measure cross-case similarity).
        </span>
      </div>
    </div>
  );
}
