import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Flame,
  RefreshCw,
  Satellite,
  Sparkles,
} from "lucide-react";
import { ApiError, getSpecialCases } from "../api/client";
import type { SpecialCasesListResponse } from "../api/types";
import { useExplorer } from "../context/ExplorerContext";
import { formatNumber } from "../lib/utils";

export function SpecialCasesTile() {
  const navigate = useNavigate();
  const { dataSourceMode } = useExplorer();

  const [data, setData] = useState<SpecialCasesListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSpecialCases({ mode: dataSourceMode }, signal);
        setData(res);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load special curated cases.",
        );
      } finally {
        setLoading(false);
      }
    },
    [dataSourceMode],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <section
      data-testid="special-cases-tile"
      aria-label="Special Curated Cases (SAFFIRE-III)"
      className="panel-surface rounded-2xl border border-orange-400/35 bg-gradient-to-br from-[#0b1326]/95 via-[#091122]/95 to-[#170f13]/90 p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-500/20 border border-orange-400/45 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-300" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Special Featured Cases · SAFFIRE-III (NASA PSI-100)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono-telemetry bg-orange-500/20 border border-orange-400/45 text-orange-200">
              {data ? `${data.total} special cases` : "Loading…"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-telemetry uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Bespoke View Only + AI Summary
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            {data?.bespoke_notice ??
              "Dedykowana analiza SAFFIRE-III (saffire3): 4-sekcyjny układ wykresów (30 Hz czujniki próbek 1 i 2, kolejność płomienia TC7–TC12, animacja nagrzewania oraz 1 Hz telemetria statku Cygnus OA-7 + podsumowanie AI) przygotowany wyłącznie dla tych specjalnych case'ów."}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono-telemetry bg-slate-950/80 border border-slate-700/80 text-slate-300 shrink-0">
          <Satellite className="h-3.5 w-3.5 text-cyan-400" />
          Cygnus OA-7 · 30 Hz + 1 Hz
        </span>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
          <div className="h-28 rounded-xl bg-slate-900/70 border border-slate-800" />
          <div className="h-28 rounded-xl bg-slate-900/70 border border-slate-800" />
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Special cases unavailable: {error}</span>
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-100 hover:bg-rose-500/30 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.items.map((item) => (
            <button
              key={item.case_id}
              data-testid={`special-case-open-${item.case_id}`}
              type="button"
              onClick={() =>
                navigate(`/special-cases/${encodeURIComponent(item.case_id)}`)
              }
              className="group text-left rounded-xl border border-slate-700/80 bg-slate-950/75 hover:border-orange-400/65 hover:bg-slate-900/90 p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-telemetry text-xs font-semibold text-orange-300">
                      {item.case_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-telemetry bg-orange-500/15 border border-orange-400/35 text-orange-200">
                      {item.highlight_badge}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                    Open Bespoke View + AI
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {item.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-telemetry text-slate-300 pt-2 border-t border-slate-800/80">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  O₂ {formatNumber(item.o2_pct, 2)}%
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  P {formatNumber(item.pressure_kpa, 1)} kPa
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Duration {formatNumber(item.recording_duration_s, 0)} s
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-orange-200">
                  Peak {formatNumber(item.peak_temp_c, 1)} °C
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
