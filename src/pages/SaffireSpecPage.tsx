import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as echarts from "echarts";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Flame,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Satellite,
  Sparkles,
} from "lucide-react";
import {
  ApiError,
  generateSpecialCaseAiSummary,
  getSpecialCaseDetail,
} from "../api/client";
import type {
  SaffireAiFocus,
  SaffireAiLanguage,
  SaffireAiSummaryResponse,
  SaffirePanel,
  SaffireSamplePayload,
  SaffireSpacecraftPayload,
  SaffireSpecialCasePayload,
} from "../api/types";
import { useExplorer } from "../context/ExplorerContext";
import { cn, downloadDataUrl, formatNumber } from "../lib/utils";

const AI_FOCUS_OPTIONS: { id: SaffireAiFocus; label: string }[] = [
  { id: "overview", label: "Mission Overview" },
  { id: "burn_plume", label: "1. 30 Hz Burn & Plume" },
  { id: "flame_spread", label: "2–3. Flame Arrival & Replay" },
  { id: "spacecraft_cabin", label: "4. Cygnus 1 Hz Cabin" },
];

function buildStackedPanelsOption({
  panels,
  xAxisTitle,
  windowRange,
  xMax,
  igniterBands,
  verticalMarkers = [],
}: {
  panels: SaffirePanel[];
  xAxisTitle: string;
  windowRange: [number, number];
  xMax: number;
  igniterBands: { start: number; end: number; label: string }[];
  verticalMarkers?: number[];
}): echarts.EChartsCoreOption {
  const n = panels.length;
  const topPad = 48;
  const bottomPad = 76;
  const gapPct = 4.8;
  const usablePct = 81 - (n - 1) * gapPct;
  const panelHeightPct = usablePct / n;

  const titles: echarts.TitleComponentOption[] = [];
  const grids: echarts.GridComponentOption[] = [];
  const xAxes: echarts.XAXisComponentOption[] = [];
  const yAxes: echarts.YAXisComponentOption[] = [];
  const series: echarts.SeriesOption[] = [];

  panels.forEach((panel, idx) => {
    const topPct = 8.5 + idx * (panelHeightPct + gapPct);
    const isLast = idx === n - 1;

    titles.push({
      text: `${panel.title} (${panel.unit})`,
      left: 72,
      top: `${(topPct - 2.6).toFixed(2)}%`,
      textStyle: {
        color: "#e2e8f0",
        fontSize: 12,
        fontWeight: 600,
      },
    });

    grids.push({
      left: 72,
      right: 28,
      top: `${topPct.toFixed(2)}%`,
      height: `${panelHeightPct.toFixed(2)}%`,
      containLabel: false,
    });

    xAxes.push({
      type: "value",
      gridIndex: idx,
      min: 0,
      max: xMax,
      name: isLast ? xAxisTitle : undefined,
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: "#94a3b8", fontSize: 11 },
      axisLine: { lineStyle: { color: "#334155" } },
      axisTick: { show: isLast, lineStyle: { color: "#475569" } },
      axisLabel: { show: isLast, color: "#94a3b8", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.3)" } },
    });

    yAxes.push({
      type: "value",
      gridIndex: idx,
      scale: true,
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
      splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.3)" } },
    });

    const markAreaData =
      igniterBands.length > 0
        ? igniterBands.map((band) => [
            {
              xAxis: band.start,
              name: idx === 0 ? band.label : "",
              itemStyle: { color: "rgba(250, 204, 21, 0.18)" },
              label: {
                show: idx === 0,
                position: "insideTopLeft",
                color: "#fde68a",
                fontSize: 10,
              },
            },
            { xAxis: band.end },
          ])
        : undefined;

    const markLineData =
      verticalMarkers.length > 0
        ? verticalMarkers.map((t) => ({ xAxis: t }))
        : undefined;

    panel.series.forEach((s, sIdx) => {
      const baseSeries: Record<string, unknown> = {
        name: panel.series.length > 1 ? s.name : `${panel.title} · ${s.name}`,
        type: "line",
        xAxisIndex: idx,
        yAxisIndex: idx,
        showSymbol: false,
        connectNulls: false,
        sampling: "lttb",
        lineStyle: { width: 1.75, color: s.color },
        itemStyle: { color: s.color },
        data: s.points,
      };
      if (sIdx === 0 && markAreaData) {
        baseSeries.markArea = { silent: true, data: markAreaData };
      }
      if (sIdx === 0 && markLineData) {
        baseSeries.markLine = {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#94a3b8", width: 1, type: "dotted" },
          label: { show: false },
          data: markLineData,
        };
      }
      series.push(baseSeries as echarts.SeriesOption);
    });
  });

  const allAxisIndices = panels.map((_, idx) => idx);

  return {
    backgroundColor: "transparent",
    animation: false,
    title: titles,
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    axisPointer: {
      link: [{ xAxisIndex: "all" }],
      label: { backgroundColor: "#0f172a" },
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: "rgba(9, 14, 28, 0.96)",
      borderColor: "rgba(56, 189, 248, 0.45)",
      textStyle: { color: "#e2e8f0", fontSize: 11 },
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgba(34, 211, 238, 0.55)", width: 1 },
      },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: allAxisIndices,
        startValue: windowRange[0],
        endValue: windowRange[1],
      },
      {
        type: "slider",
        xAxisIndex: allAxisIndices,
        bottom: 14,
        height: 24,
        borderColor: "#1e293b",
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        fillerColor: "rgba(34, 211, 238, 0.16)",
        handleStyle: { color: "#38bdf8" },
        textStyle: { color: "#94a3b8", fontSize: 10 },
        startValue: windowRange[0],
        endValue: windowRange[1],
      },
    ],
    legend: {
      type: "scroll",
      top: 4,
      right: 16,
      left: 16,
      textStyle: { color: "#cbd5e1", fontSize: 11 },
      pageTextStyle: { color: "#94a3b8" },
    },
    // Padding safeguard
    ...(topPad && bottomPad ? {} : {}),
    series,
  };
}

function BurnSection({
  samples,
  activeSampleNumber,
  onSelectSample,
}: {
  samples: Record<string, SaffireSamplePayload>;
  activeSampleNumber: number;
  onSelectSample: (sampleNumber: number) => void;
}) {
  const sample = samples[String(activeSampleNumber)] ?? samples["1"];
  const presetEntries = useMemo(
    () => Object.entries(sample.presets),
    [sample.presets],
  );
  const [windowRange, setWindowRange] = useState<[number, number]>(
    () => presetEntries[0]?.[1] ?? [0, sample.duration_s],
  );
  const [activePreset, setActivePreset] = useState<string>(
    presetEntries[0]?.[0] ?? "Whole run",
  );

  useEffect(() => {
    const first = Object.entries(sample.presets)[0];
    setActivePreset(first?.[0] ?? "Whole run");
    setWindowRange(first?.[1] ?? [0, sample.duration_s]);
  }, [sample]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const option = buildStackedPanelsOption({
      panels: sample.burn_panels,
      xAxisTitle: "Time since recording start (s)",
      windowRange,
      xMax: sample.duration_s,
      igniterBands: sample.igniter_window
        ? [
            {
              start: sample.igniter_window[0],
              end: sample.igniter_window[1],
              label: "igniter on",
            },
          ]
        : [],
    });
    chart.setOption(option, true);
  }, [sample, windowRange]);

  const handleSnapshot = () => {
    const chart = chartRef.current;
    if (!chart) return;
    downloadDataUrl(
      chart.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#060b19",
      }),
      `${sample.case_id}-burn-30hz.png`,
    );
  };

  return (
    <section
      aria-label="Section 1: The burn sensor by sensor"
      className="panel-surface rounded-2xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">
            1. The burn, sensor by sensor (30 Hz)
          </h2>
          <p className="text-xs text-slate-400">
            Every panel shares one time axis with synchronized crosshair &amp; zoom. Yellow band marks active igniter current.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["1", "2"]
            .filter((k) => Boolean(samples[k]))
            .map((key) => {
              const s = samples[key];
              const active = s.sample_number === activeSampleNumber;
              return (
                <button
                  key={s.case_id}
                  type="button"
                  onClick={() => onSelectSample(s.sample_number)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                    active
                      ? "bg-orange-500/20 border-orange-400/60 text-orange-100"
                      : "bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-cyan-400/50",
                  )}
                >
                  {s.tab_label}
                </button>
              );
            })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400 mr-1">
            Window:
          </span>
          {presetEntries.map(([label, range]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setActivePreset(label);
                setWindowRange(range);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                activePreset === label
                  ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100"
                  : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-cyan-400/50",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSnapshot}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer"
        >
          <Camera className="h-3.5 w-3.5" />
          Save Snapshot
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        <div
          ref={containerRef}
          data-testid="saffire-burn-canvas"
          className="w-full h-[1180px]"
        />
      </div>
    </section>
  );
}

function ArrivalSection({ sample }: { sample: SaffireSamplePayload }) {
  const { arrival } = sample;
  const [threshold, setThreshold] = useState<number>(
    arrival.default_threshold_c,
  );

  useEffect(() => {
    setThreshold(arrival.default_threshold_c);
  }, [arrival.default_threshold_c, sample.case_id]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  const times = useMemo(
    () =>
      arrival.arrivals_by_threshold[String(threshold)] ??
      arrival.thermocouples.map(() => null),
    [arrival.arrivals_by_threshold, arrival.thermocouples, threshold],
  );

  const missingCount = useMemo(
    () => times.filter((v) => v === null).length,
    [times],
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const points = arrival.thermocouples
      .map(
        (
          tc,
          idx,
        ): { value: [number, string]; peakC: number | null } | null => {
          const tVal = times[idx];
          if (tVal === null || tVal === undefined) return null;
          return {
            value: [tVal, tc],
            peakC: arrival.peaks_c[idx] ?? null,
          };
        },
      )
      .filter(
        (item): item is { value: [number, string]; peakC: number | null } =>
          item !== null,
      );

    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { top: 36, right: 64, bottom: 48, left: 76 },
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(9, 14, 28, 0.96)",
          borderColor: "rgba(251, 146, 60, 0.45)",
          textStyle: { color: "#e2e8f0", fontSize: 12 },
          formatter: (params: unknown) => {
            const p = params as {
              data?: { value?: [number, string]; peakC?: number | null };
            };
            if (!p?.data?.value) return "";
            const [tSec, tc] = p.data.value;
            return `<b>${tc}</b> first reached <b>≥ ${threshold} °C</b> at <b>${tSec.toFixed(1)} s</b>${
              typeof p.data.peakC === "number"
                ? `<br/>Peak recorded: <b>${p.data.peakC.toFixed(0)} °C</b>`
                : ""
            }`;
          },
        },
        xAxis: {
          type: "value",
          min: 0,
          max: arrival.max_t,
          name: "Time since recording start (s)",
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
        },
        yAxis: {
          type: "category",
          data: arrival.thermocouples,
          inverse: true,
          name: "Sample TC",
          nameGap: 10,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#e2e8f0", fontSize: 11, fontWeight: 600 },
        },
        series: [
          {
            type: "scatter",
            symbolSize: 16,
            itemStyle: {
              color: "#eb6834",
              borderColor: "#fed7aa",
              borderWidth: 1.5,
            },
            label: {
              show: true,
              position: "right",
              color: "#e2e8f0",
              fontSize: 11,
              formatter: (params: unknown) => {
                const p = params as { data?: { value?: [number, string] } };
                const tVal = p?.data?.value?.[0];
                return typeof tVal === "number" ? `${tVal.toFixed(0)} s` : "";
              },
            },
            data: points,
          },
        ],
      },
      true,
    );
  }, [arrival.max_t, arrival.peaks_c, arrival.thermocouples, threshold, times]);

  return (
    <section
      aria-label="Section 2: Following the flame across the sample"
      className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            2. Following the flame across the sample (TC7–TC12)
          </h2>
          <p className="text-xs text-slate-400">
            Time when each surface thermocouple first crossed the selected temperature threshold.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {arrival.thresholds_c.map((thr) => (
            <button
              key={thr}
              type="button"
              onClick={() => setThreshold(thr)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-mono-telemetry font-semibold border transition-colors cursor-pointer",
                threshold === thr
                  ? "bg-orange-500/25 border-orange-400/60 text-orange-100"
                  : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-orange-400/45",
              )}
            >
              ≥ {thr} °C
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        <div
          ref={containerRef}
          data-testid="saffire-arrival-canvas"
          className="w-full h-[300px]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>{arrival.note}</span>
        {missingCount > 0 && (
          <span className="font-mono-telemetry text-amber-300">
            {missingCount} of {arrival.thermocouples.length} thermocouples never reached ≥ {threshold} °C.
          </span>
        )}
      </div>
    </section>
  );
}

function PlaybackSection({ sample }: { sample: SaffireSamplePayload }) {
  const { playback } = sample;
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    setFrameIndex(0);
    setPlaying(false);
  }, [sample.case_id]);

  useEffect(() => {
    if (!playing || playback.frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= playback.frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 65);
    return () => window.clearInterval(id);
  }, [playing, playback.frames.length]);

  const currentFrame = playback.frames[frameIndex] ??
    playback.frames[0] ?? {
      t_s: 0,
      values_c: playback.thermocouples.map(() => 0),
    };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        grid: { top: 36, right: 24, bottom: 48, left: 68 },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "rgba(9, 14, 28, 0.96)",
          borderColor: "rgba(251, 146, 60, 0.45)",
          textStyle: { color: "#e2e8f0", fontSize: 12 },
          formatter: (params: unknown) => {
            const arr = Array.isArray(params) ? params : [];
            const first = arr[0] as { name?: string; value?: number } | undefined;
            if (!first) return "";
            return `<b>${first.name}</b> @ t=${currentFrame.t_s.toFixed(0)} s: <b>${Number(first.value ?? 0).toFixed(1)} °C</b>`;
          },
        },
        xAxis: {
          type: "category",
          data: playback.thermocouples,
          name: "Sample thermocouple",
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#e2e8f0", fontSize: 11, fontWeight: 600 },
        },
        yAxis: {
          type: "value",
          min: 0,
          max: playback.y_max_c,
          name: "°C",
          nameGap: 10,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
        },
        series: [
          {
            type: "bar",
            barWidth: "52%",
            data: currentFrame.values_c,
            itemStyle: {
              color: "#eb6834",
              borderRadius: [6, 6, 0, 0],
            },
          },
        ],
      },
      true,
    );
  }, [currentFrame, playback.thermocouples, playback.y_max_c]);

  return (
    <section
      aria-label="Section 3: Replay the sample heating up"
      className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            3. Replay the sample heating up ({playback.step_s}-s bins)
          </h2>
          <p className="text-xs text-slate-400">
            Highest reading in each {playback.step_s}-second bin across TC7–TC12 through ignition, peak burn, and cooldown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!playing && frameIndex >= playback.frames.length - 1) {
                setFrameIndex(0);
              }
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 border border-orange-400/55 text-orange-100 hover:bg-orange-500 hover:text-slate-950 transition-colors cursor-pointer"
          >
            {playing ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Play
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setFrameIndex(0);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <span className="px-2.5 py-1 rounded-md font-mono-telemetry text-xs bg-slate-950 border border-cyan-500/35 text-cyan-200">
            t = {currentFrame.t_s.toFixed(0)} s
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="text-[11px] font-mono-telemetry text-slate-400 shrink-0">
          0 s
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, playback.frames.length - 1)}
          value={frameIndex}
          aria-label="Playback time frame"
          onChange={(e) => {
            setPlaying(false);
            setFrameIndex(Number(e.target.value));
          }}
          className="w-full accent-orange-400 cursor-pointer"
        />
        <span className="text-[11px] font-mono-telemetry text-slate-400 shrink-0">
          {playback.frames[playback.frames.length - 1]?.t_s.toFixed(0) ?? 0} s
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        <div
          ref={containerRef}
          data-testid="saffire-playback-canvas"
          className="w-full h-[300px]"
        />
      </div>
    </section>
  );
}

function SpacecraftSection({
  spacecraft,
}: {
  spacecraft: SaffireSpacecraftPayload;
}) {
  const presetEntries = useMemo(
    () => Object.entries(spacecraft.presets),
    [spacecraft.presets],
  );
  const [windowRange, setWindowRange] = useState<[number, number]>(
    () => presetEntries[0]?.[1] ?? spacecraft.events.window,
  );
  const [activePreset, setActivePreset] = useState<string>(
    presetEntries[0]?.[0] ?? "Experiment",
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const bands: { start: number; end: number; label: string }[] = [];
    if (spacecraft.events.igniter2.length >= 2) {
      bands.push({
        start: spacecraft.events.igniter2[0],
        end: spacecraft.events.igniter2[1] + 1,
        label: "Sample 2 igniter",
      });
    }
    if (spacecraft.events.igniter1.length >= 2) {
      bands.push({
        start: spacecraft.events.igniter1[0],
        end: spacecraft.events.igniter1[1] + 1,
        label: "Sample 1 igniter",
      });
    }

    const option = buildStackedPanelsOption({
      panels: spacecraft.panels,
      xAxisTitle: "Telemetry time (s)",
      windowRange,
      xMax: spacecraft.t_max,
      igniterBands: bands,
      verticalMarkers: spacecraft.events.smoke_wire,
    });
    chart.setOption(option, true);
  }, [spacecraft, windowRange]);

  const handleSnapshot = () => {
    const chart = chartRef.current;
    if (!chart) return;
    downloadDataUrl(
      chart.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#060b19",
      }),
      "SAFFIRE-III-cygnus-1hz-telemetry.png",
    );
  };

  return (
    <section
      aria-label="Section 4: What the spacecraft itself noticed"
      className="panel-surface rounded-2xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Satellite className="h-4 w-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              4. What the spacecraft itself noticed (Cygnus 1 Hz telemetry)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-4xl">
            Dotted vertical lines mark smoke-wire pulses; yellow bands mark Sample 2 &amp; Sample 1 igniter activation. Cygnus smoke detector FIZ 2 answered the first pulse about{" "}
            {formatNumber(spacecraft.events.smoke_lag_s, 0)} s later before climbing during Sample 1 burning.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSnapshot}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 cursor-pointer shrink-0"
        >
          <Camera className="h-3.5 w-3.5" />
          Save Snapshot
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400 mr-1">
          Telemetry Window:
        </span>
        {presetEntries.map(([label, range]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setActivePreset(label);
              setWindowRange(range);
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
              activePreset === label
                ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100"
                : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-cyan-400/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
        <div
          ref={containerRef}
          data-testid="saffire-spacecraft-canvas"
          className="w-full h-[940px]"
        />
      </div>
    </section>
  );
}

export function SaffireSpecPage() {
  const { caseId = "SAFFIRE-III-S1" } = useParams<{ caseId: string }>();
  const decodedCaseId = decodeURIComponent(caseId);
  const navigate = useNavigate();
  const { dataSourceMode, faultInjection } = useExplorer();

  const [payload, setPayload] = useState<SaffireSpecialCasePayload | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSampleNum, setActiveSampleNum] = useState<number>(() =>
    decodedCaseId.toUpperCase() === "SAFFIRE-III-S2" ? 2 : 1,
  );

  const [aiFocus, setAiFocus] = useState<SaffireAiFocus>("overview");
  const [aiLang, setAiLang] = useState<SaffireAiLanguage>("pl");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<SaffireAiSummaryResponse | null>(
    null,
  );
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadSpecialCase = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSpecialCaseDetail(
          decodedCaseId,
          { mode: dataSourceMode },
          signal,
        );
        setPayload(res);
        setActiveSampleNum(res.active_sample_number);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load special SAFFIRE-III dataset.",
        );
      } finally {
        setLoading(false);
      }
    },
    [dataSourceMode, decodedCaseId],
  );

  useEffect(() => {
    const targetSample =
      decodedCaseId.toUpperCase() === "SAFFIRE-III-S2" ? 2 : 1;
    if (payload && payload.samples[String(targetSample)]) {
      setActiveSampleNum(targetSample);
      return;
    }
    const controller = new AbortController();
    void loadSpecialCase(controller.signal);
    return () => controller.abort();
  }, [decodedCaseId, loadSpecialCase, payload]);

  // Clear payload when dataSourceMode changes so Live API vs Fixtures reloads cleanly
  useEffect(() => {
    setPayload(null);
  }, [dataSourceMode]);

  const activeSample = useMemo(() => {
    if (!payload) return null;
    return (
      payload.samples[String(activeSampleNum)] ?? payload.samples["1"] ?? null
    );
  }, [activeSampleNum, payload]);

  const fetchAiSummary = useCallback(
    async (
      targetCaseId: string,
      focus: SaffireAiFocus,
      language: SaffireAiLanguage,
      promptText: string,
      signal?: AbortSignal,
    ) => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await generateSpecialCaseAiSummary(
          targetCaseId,
          {
            focus,
            language,
            custom_prompt: promptText.trim() || null,
          },
          { mode: dataSourceMode, fault: faultInjection },
          signal,
        );
        setAiSummary(res);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAiError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "AI summary request failed.",
        );
      } finally {
        setAiLoading(false);
      }
    },
    [dataSourceMode, faultInjection],
  );

  useEffect(() => {
    if (!activeSample) return;
    const controller = new AbortController();
    void fetchAiSummary(
      activeSample.case_id,
      aiFocus,
      aiLang,
      "",
      controller.signal,
    );
    return () => controller.abort();
  }, [activeSample?.case_id, aiFocus, aiLang, fetchAiSummary]);

  const handleSelectSample = (sampleNumber: number) => {
    const nextCaseId =
      sampleNumber === 2 ? "SAFFIRE-III-S2" : "SAFFIRE-III-S1";
    setActiveSampleNum(sampleNumber);
    navigate(`/special-cases/${nextCaseId}`, { replace: true });
  };

  if (loading && !payload) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-44 rounded-lg bg-slate-800" />
        <div className="h-44 rounded-2xl bg-slate-900/70 border border-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-900/70 border border-slate-800" />
      </div>
    );
  }

  if (error || !payload || !activeSample) {
    return (
      <div className="panel-surface rounded-2xl border border-rose-500/40 bg-rose-950/25 p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-white">
              Special SAFFIRE-III View Unavailable
            </h1>
            <p className="text-sm text-rose-200/90 font-mono-telemetry">
              {error ?? `Unknown special case: ${decodedCaseId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Explorer
          </Link>
          <button
            type="button"
            onClick={() => void loadSpecialCase()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-panel-in">
      {/* Header & Bespoke Notice */}
      <section className="panel-surface-cyan rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Explorer
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-orange-500/20 border border-orange-400/45 text-orange-200 inline-flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              {activeSample.case_id}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 font-mono-telemetry">
              NASA PSI-100 · Cygnus OA-7
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 font-medium">
              Mission Overview
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Saffire-III: A Fire, Lit on Purpose, Aboard a Spacecraft
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              After Cygnus left the ISS, Saffire-III ignited a ~0.4 × 0.94 m sample inside the vehicle. Below are the calibrated 30 Hz chamber measurements (Sections 1–3) and 1 Hz Cygnus downlink telemetry (Section 4), prepared specifically for these SAFFIRE-III cases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {payload.items.map((item) => (
              <button
                key={item.case_id}
                data-testid={`saffire-switch-${item.case_id}`}
                type="button"
                onClick={() => handleSelectSample(item.sample_number)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                  item.sample_number === activeSample.sample_number
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_16px_-4px_rgba(34,211,238,0.8)]"
                    : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-400/50",
                )}
              >
                Sample {item.sample_number} (
                {formatNumber(item.recording_duration_s, 0)} s)
              </button>
            ))}
          </div>
        </div>

        {/* 6 Headline Fact Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-1">
          {activeSample.tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-xl bg-slate-950/75 border border-slate-800/90 px-3.5 py-3 flex flex-col justify-between gap-1"
            >
              <span className="text-lg sm:text-xl font-bold font-mono-telemetry text-cyan-200 leading-tight">
                {tile.value}
              </span>
              <div>
                <span className="block text-xs font-semibold text-slate-200">
                  {tile.label}
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {tile.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Mission & Telemetry Summary Card (LLM API use) */}
      <section
        data-testid="saffire-ai-summary-card"
        aria-label="AI Mission & Telemetry Summary"
        className="panel-surface rounded-2xl border border-cyan-500/35 p-4 sm:p-5 space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">
                AI Mission &amp; Telemetry Summary (LLM Analysis)
              </h2>
              <p className="text-xs text-slate-400">
                Synthesizes verified 30 Hz sample metrics and 1 Hz Cygnus cabin events via backend LLM API.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aiSummary && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-telemetry uppercase tracking-wider border",
                  aiSummary.mode === "live"
                    ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                    : "bg-orange-500/15 border-orange-400/40 text-orange-200",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    aiSummary.mode === "live" ? "bg-emerald-400" : "bg-orange-400",
                  )}
                />
                AI Mode: {aiSummary.mode}
              </span>
            )}

            <div
              className="inline-flex rounded-lg border border-slate-700/80 bg-slate-950/80 p-0.5 text-xs"
              role="group"
              aria-label="AI summary language"
            >
              {(["pl", "en"] as SaffireAiLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setAiLang(lang)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-mono-telemetry font-semibold uppercase cursor-pointer transition-colors",
                    aiLang === lang
                      ? "bg-cyan-500/25 text-cyan-200"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {AI_FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAiFocus(opt.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                  aiFocus === opt.id
                    ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100"
                    : "bg-slate-900/85 border-slate-700/80 text-slate-300 hover:border-cyan-400/45",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void fetchAiSummary(
              activeSample.case_id,
              aiFocus,
              aiLang,
              customPrompt,
            );
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            maxLength={1000}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={
              aiLang === "pl"
                ? "Opcjonalne pytanie do AI o telemetrię SAFFIRE-III (np. Opóźnienie detektora FIZ2)…"
                : "Optional AI telemetry question (e.g. Compare peak heat flux vs FIZ2 delay)…"
            }
            aria-label="Custom AI summary question"
            className="flex-1 rounded-xl bg-slate-950/90 border border-slate-700/85 px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 hover:from-cyan-400 hover:to-sky-300 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Regenerate AI Summary
              </>
            )}
          </button>
        </form>

        {aiError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/35 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>AI summary unavailable: {aiError} All interactive telemetry charts remain operational below.</span>
          </div>
        )}

        {aiSummary && !aiError && (
          <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-4 space-y-3">
            <h3 className="text-sm sm:text-base font-semibold text-cyan-100">
              {aiSummary.summary.headline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {aiSummary.summary.executive_summary}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-3 space-y-1.5">
                <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-cyan-300">
                  Key Measured Findings
                </span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                  {aiSummary.summary.key_findings.map((finding, idx) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2.5">
                <div className="rounded-lg bg-slate-900/70 border border-slate-800 p-3 space-y-1">
                  <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-orange-300">
                    Spacecraft Cabin Downlink Insight
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiSummary.summary.spacecraft_telemetry_insight}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-950/20 border border-amber-500/25 p-3 space-y-1">
                  <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-amber-300">
                    Measurement Scope &amp; Caveats
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-amber-200/90 list-disc pl-4">
                    {aiSummary.summary.methodological_caveats.map((cav, idx) => (
                      <li key={idx}>{cav}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sections 1-4 from saffire3.py */}
      <BurnSection
        samples={payload.samples}
        activeSampleNumber={activeSample.sample_number}
        onSelectSample={handleSelectSample}
      />

      <ArrivalSection sample={activeSample} />

      <PlaybackSection sample={activeSample} />

      <SpacecraftSection spacecraft={payload.spacecraft} />

      {/* Sources & Methodological Notes */}
      <section className="panel-surface rounded-2xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs text-slate-400">
        <div className="space-y-2">
          <h3 className="text-xs font-mono-telemetry uppercase tracking-wider text-slate-300">
            Measurement &amp; Downsampling Methodology
          </h3>
          <ul className="space-y-1 list-disc pl-4 leading-relaxed">
            {payload.methodology_notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-mono-telemetry uppercase tracking-wider text-slate-300">
            NASA PSI-100 Primary Sources
          </h3>
          <ul className="space-y-1 list-disc pl-4 leading-relaxed">
            {payload.sources.map((src, idx) => (
              <li key={idx}>{src}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
