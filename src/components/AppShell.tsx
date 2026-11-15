import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Compass,
  Database,
  Flame,
  Presentation,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useExplorer } from "../context/ExplorerContext";
import type { DemoFaultInjection } from "../api/types";
import { cn } from "../lib/utils";
import { MultiCaseComparisonModal } from "./MultiCaseComparisonModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    dataSourceMode,
    setDataSourceMode,
    faultInjection,
    setFaultInjection,
    clearDatasetCache,
    resetDemoState,
  } = useExplorer();
  const location = useLocation();
  const [diagOpen, setDiagOpen] = useState(false);

  const handleFaultChange = (fault: DemoFaultInjection) => {
    setFaultInjection(fault);
    if (
      fault === "dataset_unavailable" ||
      fault === "dataset_shape_mismatch" ||
      fault === "none"
    ) {
      clearDatasetCache();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#060a16]/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-1 -mx-1"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500/25 via-sky-500/15 to-orange-500/25 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_-6px_rgba(34,211,238,0.6)] group-hover:border-cyan-300 transition-colors">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                    PSI-LENS
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono-telemetry uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                    Microgravity Combustion
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate hidden md:block">
                  PSI Analysis Dashboard
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <Link
              to={location.pathname === "/pitch" ? "/" : "/pitch"}
              data-testid="nav-pitch-deck"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500/20 to-cyan-500/20 border border-orange-400/45 text-orange-100 hover:border-cyan-400/70 hover:text-white transition-all shadow-[0_0_16px_-6px_rgba(251,146,60,0.6)]"
            >
              {location.pathname === "/pitch" ? (
                <>
                  <Compass className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                  <span>Live Explorer</span>
                </>
              ) : (
                <>
                  <Presentation className="h-3.5 w-3.5 text-orange-300 shrink-0" />
                  <span>3-Min Pitch</span>
                </>
              )}
            </Link>

            {/* Visible Data Source Mode Switcher (F01 / F09) */}
            <div
              className="inline-flex items-center rounded-lg border border-slate-700/80 bg-slate-900/80 p-0.5 text-xs"
              role="group"
              aria-label="Data source mode"
            >
              <button
                type="button"
                onClick={() => setDataSourceMode("fixtures")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  dataSourceMode === "fixtures"
                    ? "bg-orange-500/20 text-orange-200 border border-orange-400/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 border border-transparent",
                )}
              >
                <Database className="h-3 w-3" />
                <span>Demo Fixtures</span>
              </button>
              <button
                type="button"
                onClick={() => setDataSourceMode("live")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  dataSourceMode === "live"
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 border border-transparent",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    dataSourceMode === "live"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-slate-500",
                  )}
                />
                <span>Live API</span>
              </button>
            </div>

            {/* Fault / Demo Rehearsal Menu (only in fixtures mode) */}
            {dataSourceMode === "fixtures" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDiagOpen((v) => !v)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer",
                    faultInjection !== "none"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-200"
                      : "bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-slate-600",
                  )}
                  title="Simulate failure modes for demo verification"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {faultInjection === "none" ? "Fault Sim" : "Fault Active"}
                  </span>
                </button>
                {diagOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl panel-surface p-3 z-50 border border-slate-700 shadow-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Failure Rehearsal (Demo)
                      </span>
                      <button
                        type="button"
                        onClick={() => setDiagOpen(false)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {(
                        [
                          ["none", "Normal fixture responses"],
                          [
                            "ai_unavailable",
                            "Simulate AI 503 unavailable",
                          ],
                          [
                            "dataset_unavailable",
                            "Simulate Dataset 503 failure",
                          ],
                          [
                            "dataset_shape_mismatch",
                            "Simulate Descriptor/Row mismatch",
                          ],
                        ] as [DemoFaultInjection, string][]
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            handleFaultChange(val);
                            setDiagOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer",
                            faultInjection === val
                              ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-200"
                              : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {location.pathname === "/" && (
              <button
                type="button"
                onClick={resetDemoState}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 border border-slate-700/80 text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reset filters, assistant, and sorting to initial demo state"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Visible mode notice strip when in Demo Fixtures mode or Fault Injection */}
        {(dataSourceMode === "fixtures" || faultInjection !== "none") && (
          <div className="border-t border-orange-500/20 bg-orange-950/25 px-4 sm:px-6 py-1.5">
            <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-2 text-[11px] text-orange-200/90">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-orange-300">
                    DEMO / FIXTURE MODE:
                  </strong>{" "}
                  Displaying curated NASA PSI sample fixtures &amp; rehearsed AI filter mappings (no live backend call).
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 py-5">
        {children}
      </main>
      <MultiCaseComparisonModal />
    </div>
  );
}
