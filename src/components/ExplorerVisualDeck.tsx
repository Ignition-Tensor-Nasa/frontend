import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";
import {
  Compass,
  Flame,
  GitCompare,
  Grid3X3,
  Orbit,
  Plus,
  Check,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  computeStandardizedNeighbors,
  RESEARCH_CONTEXT_BY_INVESTIGATION,
} from "../api/fixtures";
import type { CaseSummary } from "../api/types";
import { useExplorer } from "../context/ExplorerContext";
import { cn, formatNumber, kpaToPsi } from "../lib/utils";

type DeckTab = "heatmap" | "galaxy" | "matrix";
type HeatmapMetric = "count" | "mean_zst";
type GalaxyMode = "condition_galaxy" | "regime_zst";

const O2_BINS = [
  { label: "16–20% O₂", min: 16, max: 20 },
  { label: "20–24% O₂", min: 20, max: 24 },
  { label: "24–32% O₂", min: 24, max: 32 },
  { label: "32–37% O₂", min: 32, max: 37 },
  { label: "37–41% O₂", min: 37, max: 41 },
];

const PRESSURE_BINS = [
  { label: "45–75 kPa\n(7–11 psi)", min: 45, max: 75 },
  { label: "75–130 kPa\n(11–19 psi)", min: 75, max: 130 },
  { label: "130–250 kPa\n(19–36 psi)", min: 130, max: 250 },
  { label: "250–520 kPa\n(36–75 psi)", min: 250, max: 520 },
];

const FUEL_COLORS: Record<string, string> = {
  butane: "#fb923c", // orange
  ethane: "#22d3ee", // cyan
  propane: "#a78bfa", // violet
  dodecane: "#34d399", // emerald
};

const HABITAT_PRESETS = [
  {
    id: "iss",
    label: "ISS Cabin (20–22% O₂, 95–105 kPa)",
    note: "Nominal 1-atm sea-level cabin baseline (illustrative reference)",
    filters: { o2_pct: { min: 20, max: 22 }, pressure_kpa: { min: 95, max: 105 } },
  },
  {
    id: "exploration",
    label: "Low-Pressure Habitat (45–60 kPa)",
    note: "Exploration / hypobaric atmosphere regime (~7–8.7 psi, illustrative)",
    filters: { pressure_kpa: { min: 45, max: 60 } },
  },
  {
    id: "elevated_o2",
    label: "Elevated O₂ Enriched (≥ 33% O₂)",
    note: "Oxygen-enriched test envelope used for cool-flame / flammability boundary studies",
    filters: { o2_pct: { min: 33 } },
  },
  {
    id: "all",
    label: "Clear Atmosphere Preset",
    note: "Restore unfiltered atmosphere view",
    filters: {},
  },
];

const CURATED_COMPARE_PAIRS: {
  id: string;
  label: string;
  subtitle: string;
  caseIds: string[];
}[] = [
  {
    id: "hot-vs-cool",
    label: "Hot vs Cool Flame (21174C2 vs 21174C3)",
    subtitle: "30% butane at ~39.6% O₂, 202.7 kPa — hot vs PCI-D cool flame",
    caseIds: ["CFIG-21174C2", "CFIG-21174C3"],
  },
  {
    id: "o2-ethane",
    label: "Ethane O₂ Span (21088P1 vs 21088H1)",
    subtitle: "18.0% O₂ vs 37.6% O₂ near ~100 kPa",
    caseIds: ["CFIG-21088P1", "CFIG-21088H1"],
  },
  {
    id: "flex-droplets",
    label: "FLEX Dodecane Droplets (FLEX-1249 vs FLEX-1226)",
    subtitle: "Elevated vs hypobaric cool-flame droplet extinction",
    caseIds: ["FLEX-1249", "FLEX-1226"],
  },
];

function findBinIndex(
  value: number,
  bins: { min: number; max: number }[],
): number {
  for (let i = 0; i < bins.length; i += 1) {
    const isLast = i === bins.length - 1;
    if (value >= bins[i].min && (isLast ? value <= bins[i].max : value < bins[i].max)) {
      return i;
    }
  }
  return -1;
}

export function ExplorerVisualDeck() {
  const navigate = useNavigate();
  const {
    results,
    quickQuery,
    committedFilters,
    applyFilters,
    comparedCaseIds,
    toggleCompareCase,
    setComparedCases,
    setComparisonOpen,
  } = useExplorer();

  const [activeTab, setActiveTab] = useState<DeckTab>("heatmap");
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("count");
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [galaxyMode, setGalaxyMode] = useState<GalaxyMode>("condition_galaxy");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const visibleCases = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter((item) =>
      [item.case_id, item.title, item.investigation, item.fuel ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [quickQuery, results]);

  // Default or keep selected case inside visibleCases for Condition Galaxy
  const effectiveSelectedCaseId = useMemo(() => {
    if (
      selectedCaseId &&
      visibleCases.some((c) => c.case_id === selectedCaseId)
    ) {
      return selectedCaseId;
    }
    const defaultHero =
      visibleCases.find((c) => c.case_id === "CFIG-21291C1") ??
      visibleCases.find(
        (c) => c.o2_pct !== null && c.pressure_kpa !== null,
      ) ??
      null;
    return defaultHero?.case_id ?? null;
  }, [selectedCaseId, visibleCases]);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Build Atmosphere Heatmap matrix (F10)
  const heatmapData = useMemo(() => {
    const cellCases: Record<string, CaseSummary[]> = {};
    let omittedCount = 0;

    for (const c of visibleCases) {
      if (c.o2_pct === null || c.pressure_kpa === null) {
        omittedCount += 1;
        continue;
      }
      const xi = findBinIndex(c.o2_pct, O2_BINS);
      const yi = findBinIndex(c.pressure_kpa, PRESSURE_BINS);
      if (xi < 0 || yi < 0) {
        omittedCount += 1;
        continue;
      }
      const key = `${xi}-${yi}`;
      if (!cellCases[key]) cellCases[key] = [];
      cellCases[key].push(c);
    }

    const matrixPoints: [number, number, number | "-"][] = [];
    let maxVal = 0;

    for (let xi = 0; xi < O2_BINS.length; xi += 1) {
      for (let yi = 0; yi < PRESSURE_BINS.length; yi += 1) {
        const list = cellCases[`${xi}-${yi}`] ?? [];
        if (list.length === 0) {
          matrixPoints.push([xi, yi, "-"]);
          continue;
        }
        if (heatmapMetric === "count") {
          matrixPoints.push([xi, yi, list.length]);
          if (list.length > maxVal) maxVal = list.length;
        } else {
          const zVals = list
            .map((c) => c.z_st)
            .filter((z): z is number => typeof z === "number" && Number.isFinite(z));
          if (zVals.length === 0) {
            matrixPoints.push([xi, yi, "-"]);
          } else {
            const avg = zVals.reduce((a, b) => a + b, 0) / zVals.length;
            const rounded = Number(avg.toFixed(3));
            matrixPoints.push([xi, yi, rounded]);
            if (rounded > maxVal) maxVal = rounded;
          }
        }
      }
    }

    return {
      cellCases,
      matrixPoints,
      maxVal: maxVal > 0 ? maxVal : 1,
      omittedCount,
    };
  }, [heatmapMetric, visibleCases]);

  // Compute nearest standardized neighbors (F19 / B11) on visibleCases
  const selectedNeighbors = useMemo(() => {
    if (!effectiveSelectedCaseId) return null;
    return computeStandardizedNeighbors(effectiveSelectedCaseId, visibleCases);
  }, [effectiveSelectedCaseId, visibleCases]);

  const selectedCase = useMemo(
    () =>
      visibleCases.find((c) => c.case_id === effectiveSelectedCaseId) ?? null,
    [effectiveSelectedCaseId, visibleCases],
  );

  // Initialize ECharts canvas whenever activeTab needs a chart ("heatmap" or "galaxy")
  useEffect(() => {
    if (activeTab === "matrix") {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      return;
    }

    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartInstanceRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [activeTab]);

  // Render active visual into ECharts
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || activeTab === "matrix") return;

    chart.off("click");
    chart.resize();

    if (activeTab === "heatmap") {
      chart.on("click", (params: unknown) => {
        const p = params as { value?: [number, number, number | "-"] };
        if (!Array.isArray(p?.value)) return;
        const [xi, yi, v] = p.value;
        if (v !== "-") {
          setSelectedCell({ x: xi, y: yi });
        }
      });

      chart.setOption(
        {
          backgroundColor: "transparent",
          animation: false,
          tooltip: {
            position: "top",
            backgroundColor: "rgba(9, 14, 28, 0.96)",
            borderColor: "rgba(56, 189, 248, 0.45)",
            textStyle: { color: "#e2e8f0", fontSize: 12 },
            formatter: (params: unknown) => {
              const p = params as { value?: [number, number, number | "-"] };
              if (!Array.isArray(p?.value)) return "";
              const [xi, yi] = p.value;
              const list = heatmapData.cellCases[`${xi}-${yi}`] ?? [];
              if (list.length === 0) {
                return `<b>${O2_BINS[xi].label}</b> × <b>${PRESSURE_BINS[yi].label.replace("\n", " ")}</b><br/>Empty cell (0 curated runs)`;
              }
              const previewIds = list
                .slice(0, 4)
                .map((c) => c.case_id)
                .join(", ");
              const extra = list.length > 4 ? ` +${list.length - 4} more` : "";
              const metricLine =
                heatmapMetric === "count"
                  ? `Curated runs: <b>${list.length}</b>`
                  : `Mean Z_st: <b>${p.value[2] === "-" ? "null (droplet runs)" : p.value[2]}</b> (${list.length} runs)`;
              return `<b>${O2_BINS[xi].label}</b> × <b>${PRESSURE_BINS[yi].label.replace("\n", " ")}</b><br/>${metricLine}<br/><span style="color:#94a3b8">${previewIds}${extra}</span><br/><span style="color:#22d3ee">Click cell to inspect runs</span>`;
            },
          },
          grid: {
            top: 24,
            right: 28,
            bottom: 64,
            left: 118,
          },
          xAxis: {
            type: "category",
            data: O2_BINS.map((b) => b.label),
            splitArea: { show: false },
            axisLine: { lineStyle: { color: "#334155" } },
            axisLabel: { color: "#cbd5e1", fontSize: 11 },
          },
          yAxis: {
            type: "category",
            data: PRESSURE_BINS.map((b) => b.label),
            splitArea: { show: false },
            axisLine: { lineStyle: { color: "#334155" } },
            axisLabel: { color: "#cbd5e1", fontSize: 10, lineHeight: 13 },
          },
          visualMap: {
            min: heatmapMetric === "count" ? 1 : 0.05,
            max: heatmapData.maxVal,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: 4,
            itemWidth: 12,
            itemHeight: 160,
            text:
              heatmapMetric === "count"
                ? ["More runs", "1 run"]
                : ["High Z_st", "Low Z_st"],
            textStyle: { color: "#94a3b8", fontSize: 10 },
            inRange: {
              color:
                heatmapMetric === "count"
                  ? ["#0e7490", "#06b6d4", "#22d3ee", "#fb923c"]
                  : ["#1e3a8a", "#38bdf8", "#a78bfa", "#f97316"],
            },
          },
          series: [
            {
              name: "Atmosphere Coverage",
              type: "heatmap",
              data: heatmapData.matrixPoints,
              label: {
                show: true,
                color: "#f8fafc",
                fontWeight: "bold",
                fontSize: 12,
                formatter: (p: unknown) => {
                  const val = (p as { value?: [number, number, number | "-"] })
                    ?.value?.[2];
                  return val === "-" ? "" : String(val);
                },
              },
              itemStyle: {
                borderColor: "#0f172a",
                borderWidth: 3,
                borderRadius: 6,
              },
              emphasis: {
                itemStyle: {
                  borderColor: "#f8fafc",
                  borderWidth: 2,
                },
              },
            },
          ],
        },
        true,
      );
      return;
    }

    // Tab 2: Experiment Galaxy (F19) or Stoichiometric Regime Map (F15)
    if (galaxyMode === "condition_galaxy") {
      chart.on("click", (params: unknown) => {
        const p = params as { data?: { caseId?: string } };
        if (p?.data?.caseId) {
          setSelectedCaseId(p.data.caseId);
        }
      });

      const byFuel = new Map<
        string,
        {
          value: [number, number];
          caseId: string;
          investigation: string;
          fuel: string;
          zSt: number | null;
          symbol: string;
          symbolSize: number;
        }[]
      >();

      for (const c of visibleCases) {
        if (c.o2_pct === null || c.pressure_kpa === null) continue;
        const fuelKey = c.fuel ?? "unknown";
        const arr = byFuel.get(fuelKey) ?? [];
        const isSelected = c.case_id === effectiveSelectedCaseId;
        arr.push({
          value: [c.o2_pct, c.pressure_kpa],
          caseId: c.case_id,
          investigation: c.investigation,
          fuel: fuelKey,
          zSt: c.z_st ?? null,
          symbol: c.investigation === "CFI (FLEX)" ? "diamond" : "circle",
          symbolSize: isSelected ? 18 : 11,
        });
        byFuel.set(fuelKey, arr);
      }

      const neighborLines =
        selectedCase &&
        selectedCase.o2_pct !== null &&
        selectedCase.pressure_kpa !== null &&
        selectedNeighbors
          ? selectedNeighbors.items
              .filter(
                (n) => n.case.o2_pct !== null && n.case.pressure_kpa !== null,
              )
              .map((n) => ({
                coords: [
                  [
                    selectedCase.o2_pct as number,
                    selectedCase.pressure_kpa as number,
                  ],
                  [n.case.o2_pct as number, n.case.pressure_kpa as number],
                ],
              }))
          : [];

      chart.setOption(
        {
          backgroundColor: "transparent",
          animation: false,
          legend: {
            top: 4,
            textStyle: { color: "#cbd5e1", fontSize: 11 },
          },
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(9, 14, 28, 0.96)",
            borderColor: "rgba(56, 189, 248, 0.45)",
            textStyle: { color: "#e2e8f0", fontSize: 12 },
            formatter: (params: unknown) => {
              const p = params as {
                data?: {
                  caseId?: string;
                  investigation?: string;
                  fuel?: string;
                  zSt?: number | null;
                  value?: [number, number];
                };
              };
              if (!p?.data?.caseId || !p.data.value) return "";
              const [o2, pKpa] = p.data.value;
              return `<b>${p.data.caseId}</b> (${p.data.investigation})<br/>Fuel: <b>${p.data.fuel}</b><br/>O₂: <b>${o2.toFixed(1)}%</b> · Pressure: <b>${pKpa.toFixed(1)} kPa</b> (${kpaToPsi(pKpa).toFixed(1)} psi)${
                p.data.zSt !== null && p.data.zSt !== undefined
                  ? `<br/>Z_st: <b>${p.data.zSt.toFixed(4)}</b>`
                  : ""
              }<br/><span style="color:#22d3ee">Click point to trace B11 neighbors</span>`;
            },
          },
          grid: {
            top: 44,
            right: 28,
            bottom: 48,
            left: 68,
          },
          xAxis: {
            type: "value",
            name: "O₂ Concentration [%]",
            nameLocation: "middle",
            nameGap: 28,
            min: 14,
            max: 42,
            nameTextStyle: { color: "#94a3b8", fontSize: 11 },
            axisLine: { lineStyle: { color: "#334155" } },
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
          },
          yAxis: {
            type: "value",
            name: "Pressure [kPa]",
            min: 20,
            max: 540,
            nameTextStyle: { color: "#94a3b8", fontSize: 11 },
            axisLine: { lineStyle: { color: "#334155" } },
            axisLabel: { color: "#94a3b8", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
          },
          series: [
            ...Array.from(byFuel.entries()).map(([fuel, pts]) => ({
              name: fuel,
              type: "scatter",
              data: pts,
              itemStyle: {
                color: FUEL_COLORS[fuel] ?? "#94a3b8",
                borderColor: "#020617",
                borderWidth: 1,
              },
              emphasis: { scale: 1.35 },
            })),
            // Neighbor vector lines + ISS/Exploration illustrative reference stars
            {
              name: "Neighbor Links (B11)",
              type: "lines",
              coordinateSystem: "cartesian2d",
              data: neighborLines,
              lineStyle: {
                color: "#22d3ee",
                width: 1.6,
                type: "dashed",
                opacity: 0.8,
              },
              effect: {
                show: neighborLines.length > 0,
                period: 3.5,
                trailLength: 0.25,
                symbolSize: 5,
                color: "#67e8f9",
              },
              silent: true,
              z: 3,
            },
            {
              name: "Habitat Ref (Illustrative)",
              type: "scatter",
              symbol: "pin",
              symbolSize: 22,
              itemStyle: { color: "#facc15" },
              data: [
                {
                  name: "ISS Ref (21% O₂, 101.3 kPa)",
                  value: [21, 101.325],
                },
                {
                  name: "Exploration Habitat Ref (34% O₂, 56.5 kPa)",
                  value: [34, 56.5],
                },
              ],
              tooltip: {
                formatter: (p: unknown) => {
                  const item = p as { name?: string };
                  return `<b>${item?.name ?? "Habitat Ref"}</b><br/><span style="color:#facc15">Illustrative design atmosphere — not a measured test or safety limit</span>`;
                },
              },
              z: 5,
            },
          ],
        },
        true,
      );
      return;
    }

    // Mode B: F15 Stoichiometric & Flame Regime Map (Z_st vs O2%)
    chart.on("click", (params: unknown) => {
      const p = params as { data?: { caseId?: string } };
      if (p?.data?.caseId) {
        setSelectedCaseId(p.data.caseId);
      }
    });

    const zByFuel = new Map<
      string,
      {
        value: [number, number];
        caseId: string;
        pressureKpa: number | null;
        fuel: string;
        symbolSize: number;
      }[]
    >();
    for (const c of visibleCases) {
      if (
        c.z_st === null ||
        c.z_st === undefined ||
        c.o2_pct === null
      ) {
        continue;
      }
      const fuelKey = c.fuel ?? "unknown";
      const arr = zByFuel.get(fuelKey) ?? [];
      arr.push({
        value: [c.z_st, c.o2_pct],
        caseId: c.case_id,
        pressureKpa: c.pressure_kpa,
        fuel: fuelKey,
        symbolSize: c.case_id === effectiveSelectedCaseId ? 18 : 11,
      });
      zByFuel.set(fuelKey, arr);
    }

    chart.setOption(
      {
        backgroundColor: "transparent",
        animationDuration: 250,
        legend: {
          top: 4,
          textStyle: { color: "#cbd5e1", fontSize: 11 },
        },
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(9, 14, 28, 0.96)",
          borderColor: "rgba(251, 146, 60, 0.45)",
          textStyle: { color: "#e2e8f0", fontSize: 12 },
          formatter: (params: unknown) => {
            const p = params as {
              data?: {
                caseId?: string;
                fuel?: string;
                pressureKpa?: number | null;
                value?: [number, number];
              };
            };
            if (!p?.data?.caseId || !p.data.value) return "";
            const [zst, o2] = p.data.value;
            return `<b>${p.data.caseId}</b> (${p.data.fuel})<br/>Z_st: <b>${zst.toFixed(4)}</b><br/>O₂: <b>${o2.toFixed(1)}%</b> · Pressure: <b>${
              typeof p.data.pressureKpa === "number"
                ? `${p.data.pressureKpa.toFixed(1)} kPa`
                : "null"
            }</b>`;
          },
        },
        grid: {
          top: 44,
          right: 28,
          bottom: 48,
          left: 68,
        },
        xAxis: {
          type: "value",
          name: "Stoichiometric Mixture Fraction Z_st [unitless]",
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
        },
        yAxis: {
          type: "value",
          name: "O₂ [%]",
          min: 14,
          max: 42,
          nameTextStyle: { color: "#94a3b8", fontSize: 11 },
          axisLine: { lineStyle: { color: "#334155" } },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          splitLine: { lineStyle: { color: "rgba(51, 65, 85, 0.35)" } },
        },
        series: Array.from(zByFuel.entries()).map(([fuel, pts]) => ({
          name: fuel,
          type: "scatter",
          data: pts,
          itemStyle: {
            color: FUEL_COLORS[fuel] ?? "#94a3b8",
            borderColor: "#020617",
            borderWidth: 1,
          },
        })),
      },
      true,
    );
  }, [
    activeTab,
    effectiveSelectedCaseId,
    galaxyMode,
    heatmapData,
    heatmapMetric,
    selectedCase,
    selectedNeighbors,
    visibleCases,
  ]);

  const selectedCellCases = useMemo(() => {
    if (!selectedCell) return [];
    return heatmapData.cellCases[`${selectedCell.x}-${selectedCell.y}`] ?? [];
  }, [heatmapData.cellCases, selectedCell]);

  const nullZstCount = useMemo(
    () =>
      visibleCases.filter(
        (c) => c.z_st === null || c.z_st === undefined,
      ).length,
    [visibleCases],
  );

  // Matrix grouping for F18
  const matrixGroups = useMemo(() => {
    const prevention: CaseSummary[] = [];
    const detection: CaseSummary[] = [];
    const unknown: CaseSummary[] = [];
    for (const c of visibleCases) {
      const tags = RESEARCH_CONTEXT_BY_INVESTIGATION[c.investigation]?.tags ?? [
        "unknown",
      ];
      if (tags.includes("prevention")) {
        prevention.push(c);
      }
      if (tags.includes("detection")) {
        detection.push(c);
      }
      if (!tags.includes("prevention") && !tags.includes("detection")) {
        unknown.push(c);
      }
    }
    return { prevention, detection, unknown };
  }, [visibleCases]);

  const isPresetActive = (presetFilters: Record<string, unknown>) => {
    if (Object.keys(presetFilters).length === 0) {
      return Object.keys(committedFilters).length === 0;
    }
    return (
      JSON.stringify(committedFilters) === JSON.stringify(presetFilters)
    );
  };

  return (
    <section
      aria-label="Mission Analytics Deck"
      className="panel-surface rounded-xl p-4 sm:p-5 space-y-4 animate-panel-in"
    >
      {/* Deck Header + View Switcher + Quick Compare Launchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Mission Analytics &amp; Regime Explorer
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-cyan-500/15 border border-cyan-400/35 text-cyan-200">
              {visibleCases.length} runs plotted
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore atmospheric test coverage, standardized condition neighbors, Z_st flammability regimes, and NASA research-context evidence.
          </p>
        </div>

        <div
          className="inline-flex flex-wrap items-center rounded-xl border border-slate-700/80 bg-slate-950/85 p-1 text-xs"
          role="tablist"
          aria-label="Explorer analytical deck view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "heatmap"}
            onClick={() => setActiveTab("heatmap")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              activeTab === "heatmap"
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_16px_-4px_rgba(34,211,238,0.75)]"
                : "text-slate-300 hover:text-white",
            )}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>Atmosphere Heatmap (F10)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "galaxy"}
            onClick={() => setActiveTab("galaxy")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              activeTab === "galaxy"
                ? "bg-orange-400 text-slate-950 shadow-[0_0_16px_-4px_rgba(251,146,60,0.75)]"
                : "text-slate-300 hover:text-white",
            )}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span>Condition Galaxy &amp; Z_st (F19/F15)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "matrix"}
            onClick={() => setActiveTab("matrix")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              activeTab === "matrix"
                ? "bg-emerald-400 text-slate-950 shadow-[0_0_16px_-4px_rgba(52,211,153,0.75)]"
                : "text-slate-300 hover:text-white",
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Safety Context Matrix (F18)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: F10 Heatmap + F20 Habitat Reference Strip */}
      {activeTab === "heatmap" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400 mr-1">
                Habitat Presets (F20):
              </span>
              {HABITAT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.note}
                  onClick={() => {
                    setSelectedCell(null);
                    applyFilters(preset.filters);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer",
                    isPresetActive(preset.filters)
                      ? "bg-amber-500/20 border-amber-400/60 text-amber-100"
                      : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-cyan-400/50",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/70 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setHeatmapMetric("count")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors",
                  heatmapMetric === "count"
                    ? "bg-cyan-500/25 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Metric: Case Count
              </button>
              <button
                type="button"
                onClick={() => setHeatmapMetric("mean_zst")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors",
                  heatmapMetric === "mean_zst"
                    ? "bg-violet-500/25 text-violet-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Metric: Mean Z_st
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
            <div
              ref={chartRef}
              data-testid="atmosphere-heatmap-canvas"
              className="w-full h-[270px]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Empty cells represent 0 curated runs in that (O₂, Pressure) bin (no safety boundary is interpolated).
              {heatmapData.omittedCount > 0 &&
                ` ${heatmapData.omittedCount} run excluded due to null atmosphere coordinate.`}
            </span>
            <span className="text-amber-300/85">
              Habitat presets filter by illustrative reference conditions, not certified lunar/Mars limits.
            </span>
          </div>

          {selectedCell && (
            <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-cyan-200">
                  Selected Bin: {O2_BINS[selectedCell.x].label} ×{" "}
                  {PRESSURE_BINS[selectedCell.y].label.replace("\n", " ")} (
                  {selectedCellCases.length} runs)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCellCases.map((c) => {
                  const pinned = comparedCaseIds.includes(c.case_id);
                  return (
                    <div
                      key={c.case_id}
                      className="inline-flex items-center rounded-lg border border-slate-700/80 bg-slate-900/90 overflow-hidden text-xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/cases/${encodeURIComponent(c.case_id)}`)
                        }
                        className="px-2.5 py-1 font-mono-telemetry text-cyan-300 hover:bg-slate-800 cursor-pointer"
                      >
                        {`Run ${c.case_id}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompareCase(c.case_id)}
                        title={pinned ? "Remove from comparison" : "Pin to comparison"}
                        className={cn(
                          "px-2 py-1 border-l border-slate-700/80 cursor-pointer transition-colors",
                          pinned
                            ? "bg-orange-500/25 text-orange-200"
                            : "text-slate-400 hover:text-white",
                        )}
                      >
                        {pinned ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: F19 Condition Galaxy + F15 Stoichiometric Regime Map */}
      {activeTab === "galaxy" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950/70 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setGalaxyMode("condition_galaxy")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors",
                  galaxyMode === "condition_galaxy"
                    ? "bg-cyan-500/25 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Condition Galaxy (O₂ × Pressure + B11 Neighbors)
              </button>
              <button
                type="button"
                onClick={() => setGalaxyMode("regime_zst")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors",
                  galaxyMode === "regime_zst"
                    ? "bg-orange-500/25 text-orange-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                Stoichiometric Regime Map (Z_st × O₂ · F15)
              </button>
            </div>

            {galaxyMode === "regime_zst" && nullZstCount > 0 && (
              <span className="text-[11px] font-mono-telemetry text-amber-300/90">
                {nullZstCount} droplet runs omitted (Z_st = null)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-3">
            <div className="relative rounded-xl border border-slate-800 bg-[#050812]/90 p-2">
              <div
                ref={chartRef}
                data-testid="experiment-galaxy-canvas"
                className="w-full h-[290px]"
              />
            </div>

            {/* Selected Run + B11 Nearest Condition Neighbors Sidecard */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex flex-col justify-between gap-3">
              {selectedCase ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Compass className="h-3 w-3 text-cyan-400" />
                        Selected Galaxy Node
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/cases/${encodeURIComponent(selectedCase.case_id)}`,
                          )
                        }
                        className="text-xs font-mono-telemetry font-semibold text-cyan-300 hover:underline cursor-pointer"
                      >
                        {`Open ${selectedCase.case_id}`}
                      </button>
                    </div>
                    <p className="text-xs text-slate-100 font-medium line-clamp-2">
                      {selectedCase.title}
                    </p>
                    <p className="text-[11px] font-mono-telemetry text-slate-400">
                      {selectedCase.fuel ?? "unknown"} ·{" "}
                      {formatNumber(selectedCase.o2_pct, 1)}% O₂ ·{" "}
                      {formatNumber(selectedCase.pressure_kpa, 1)} kPa
                    </p>

                    <div className="border-t border-slate-800 pt-2 space-y-1">
                      <span className="text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                        Nearest Same-Investigation Runs
                      </span>
                      {selectedNeighbors && selectedNeighbors.items.length > 0 ? (
                        <ul className="space-y-1">
                          {selectedNeighbors.items.slice(0, 3).map((n) => (
                            <li
                              key={n.case.case_id}
                              className="flex items-center justify-between text-[11px] bg-slate-900/80 border border-slate-800 rounded-md px-2 py-1"
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedCaseId(n.case.case_id)}
                                className="font-mono-telemetry text-cyan-300 hover:text-white cursor-pointer"
                              >
                                {`Run ${n.case.case_id}`}
                              </button>
                              <span className="font-mono-telemetry text-slate-400">
                                d={formatNumber(n.distance, 3)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          No standardized neighbors (missing O₂ or pressure).
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const ids = [
                        selectedCase.case_id,
                        ...(selectedNeighbors?.items
                          .slice(0, 1)
                          .map((i) => i.case.case_id) ?? []),
                      ];
                      if (ids.length >= 2) {
                        setComparedCases(ids);
                        setComparisonOpen(true);
                      } else {
                        toggleCompareCase(selectedCase.case_id);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 border border-orange-400/50 text-orange-100 hover:bg-orange-500 hover:text-slate-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    Compare With Nearest Neighbor
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  No matching runs in view.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: F18 Prevention / Detection / Suppression Research Context Matrix */}
      {activeTab === "matrix" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Column 1: Prevention */}
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/15 p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-emerald-400" />
                    Prevention
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                    {matrixGroups.prevention.length} runs
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {RESEARCH_CONTEXT_BY_INVESTIGATION["CFI (FLEX)"].rationale}
                </p>
                <blockquote className="rounded-lg bg-slate-950/70 border border-slate-800 px-2.5 py-2 text-[11px] text-slate-300 italic">
                  “{RESEARCH_CONTEXT_BY_INVESTIGATION["CFI (FLEX)"].evidence[0]?.quote}”
                  <footer className="not-italic text-[10px] font-mono-telemetry text-slate-400 mt-1">
                    CFI_PSI-39 PDF · p. 23
                  </footer>
                </blockquote>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                <div className="flex flex-wrap gap-1">
                  {matrixGroups.prevention.slice(0, 5).map((c) => (
                    <button
                      key={c.case_id}
                      type="button"
                      onClick={() =>
                        navigate(`/cases/${encodeURIComponent(c.case_id)}`)
                      }
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono-telemetry text-emerald-300 hover:border-emerald-400 cursor-pointer"
                    >
                      {`Run ${c.case_id}`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => applyFilters({ investigation: ["CFI (FLEX)"] })}
                  className="text-[11px] text-emerald-300 hover:underline cursor-pointer"
                >
                  Filter catalogue to CFI (FLEX) →
                </button>
              </div>
            </div>

            {/* Column 2: Detection */}
            {matrixGroups.detection.length > 0 ? (
              <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/15 p-3.5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-cyan-200">
                      Detection
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-cyan-500/20 text-cyan-200 border border-cyan-500/40">
                      {matrixGroups.detection.length} runs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {RESEARCH_CONTEXT_BY_INVESTIGATION["SAME-R"].rationale}
                  </p>
                  <blockquote className="rounded-lg bg-slate-950/70 border border-slate-800 px-2.5 py-2 text-[11px] text-slate-300 italic">
                    “{RESEARCH_CONTEXT_BY_INVESTIGATION["SAME-R"].evidence[0]?.quote}”
                    <footer className="not-italic text-[10px] font-mono-telemetry text-slate-400 mt-1">
                      SAME-R_PSI-101 · SAME Benefits.pdf · p. 1
                    </footer>
                  </blockquote>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-cyan-500/20">
                  <div className="flex flex-wrap gap-1">
                    {matrixGroups.detection.slice(0, 5).map((c) => (
                      <button
                        key={c.case_id}
                        type="button"
                        onClick={() =>
                          navigate(`/cases/${encodeURIComponent(c.case_id)}`)
                        }
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono-telemetry text-cyan-300 hover:border-cyan-400 cursor-pointer"
                      >
                        {`Run ${c.case_id}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => applyFilters({ investigation: ["SAME-R"] })}
                      className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                    >
                      Filter SAME-R →
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyFilters({ investigation: ["Saffire-III"] })
                      }
                      className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                    >
                      Filter Saffire-III →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2 flex flex-col justify-between opacity-85">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Detection
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-slate-800 text-slate-400 border border-slate-700">
                      0 curated runs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    No detection-tagged run is visible in the active filter slice (switch to live 6-investigation mode or clear filters for SAME-R / Saffire-III).
                  </p>
                </div>
                <span className="text-[10px] font-mono-telemetry text-slate-500">
                  Status: None in current filter slice
                </span>
              </div>
            )}

            {/* Column 3: Suppression */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2 flex flex-col justify-between opacity-85">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Suppression
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-slate-800 text-slate-400 border border-slate-700">
                    0 curated runs
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Burner flow termination (FT) and self-extinction (SE) log entries record test-script endpoints only, not fire-suppression certification.
                </p>
              </div>
              <span className="text-[10px] font-mono-telemetry text-slate-500">
                Status: Not asserted in current curated bundle
              </span>
            </div>

            {/* Column 4: Unclassified / Operations */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100">
                    Unknown / Ops Logs
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry bg-slate-800 text-cyan-200 border border-slate-700">
                    {matrixGroups.unknown.length} runs
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {RESEARCH_CONTEXT_BY_INVESTIGATION["ACME CFI-G"].rationale}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap gap-1">
                  {matrixGroups.unknown.slice(0, 5).map((c) => (
                    <button
                      key={c.case_id}
                      type="button"
                      onClick={() =>
                        navigate(`/cases/${encodeURIComponent(c.case_id)}`)
                      }
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono-telemetry text-cyan-300 hover:border-cyan-400 cursor-pointer"
                    >
                      {`Run ${c.case_id}`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => applyFilters({ investigation: ["ACME CFI-G"] })}
                  className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                >
                  Filter catalogue to ACME CFI-G →
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-amber-300/85">
            {RESEARCH_CONTEXT_BY_INVESTIGATION["CFI (FLEX)"].disclaimer}
          </p>
        </div>
      )}

      {/* Curated Cross-Run Comparison Quick Strip (F12 Launchers) */}
      <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-orange-300 flex items-center gap-1 mr-1">
            <GitCompare className="h-3.5 w-3.5" />
            Instant Comparisons (F12):
          </span>
          {CURATED_COMPARE_PAIRS.map((pair) => (
            <button
              key={pair.id}
              type="button"
              title={pair.subtitle}
              onClick={() => {
                setComparedCases(pair.caseIds);
                setComparisonOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:border-orange-400/60 hover:text-orange-200 transition-colors cursor-pointer"
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
