import { useState } from "react";
import { Activity, ScatterChart as ScatterIcon, SlidersHorizontal } from "lucide-react";
import type { CaseEvent, DatasetData } from "../api/types";
import { cn } from "../lib/utils";
import { HeroTimeSeriesChart } from "./HeroTimeSeriesChart";
import { ParallelCoordinatesChart } from "./ParallelCoordinatesChart";
import { ScatterPlotChart } from "./ScatterPlotChart";

type ViewMode = "timeseries" | "scatter" | "parallel";

interface TelemetryWorkspaceProps {
  datasetData: DatasetData;
  sourceLabel: string;
  events?: CaseEvent[];
}

export function TelemetryWorkspace({
  datasetData,
  sourceLabel,
  events = [],
}: TelemetryWorkspaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeseries");

  return (
    <section className="panel-surface rounded-2xl p-4 sm:p-5 space-y-4 animate-panel-in">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            {datasetData.dataset.label}
          </h2>
          <p className="text-xs text-slate-400">
            Interactive telemetry canvas driven directly by loaded JSON dataset (switching views reuses cached data).
          </p>
        </div>

        <div
          className="inline-flex items-center rounded-xl border border-slate-700/80 bg-slate-950/80 p-1 text-xs"
          role="tablist"
          aria-label="Chart visualization mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "timeseries"}
            onClick={() => setViewMode("timeseries")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "timeseries"
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_16px_-4px_rgba(34,211,238,0.8)]"
                : "text-slate-300 hover:text-white",
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Time-Series</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "scatter"}
            onClick={() => setViewMode("scatter")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "scatter"
                ? "bg-orange-400 text-slate-950 shadow-[0_0_16px_-4px_rgba(251,146,60,0.8)]"
                : "text-slate-300 hover:text-white",
            )}
          >
            <ScatterIcon className="h-3.5 w-3.5" />
            <span>Scatter View</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "parallel"}
            onClick={() => setViewMode("parallel")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "parallel"
                ? "bg-violet-400 text-slate-950 shadow-[0_0_16px_-4px_rgba(167,139,250,0.8)]"
                : "text-slate-300 hover:text-white",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Parallel Coords</span>
          </button>
        </div>
      </div>

      {datasetData.note && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-300">
          <span className="font-semibold text-cyan-300 mr-1.5">
            Dataset Note:
          </span>
          {datasetData.note}
        </div>
      )}

      {datasetData.rows.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-10 text-center text-sm text-slate-400">
          This dataset contains 0 sample rows.
        </div>
      ) : viewMode === "timeseries" ? (
        <HeroTimeSeriesChart
          datasetData={datasetData}
          sourceLabel={sourceLabel}
          events={events}
        />
      ) : viewMode === "scatter" ? (
        <ScatterPlotChart
          datasetData={datasetData}
          sourceLabel={sourceLabel}
        />
      ) : (
        <ParallelCoordinatesChart
          datasetData={datasetData}
          sourceLabel={sourceLabel}
        />
      )}
    </section>
  );
}
