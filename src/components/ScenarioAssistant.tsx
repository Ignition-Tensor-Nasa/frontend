import { AlertTriangle, Loader2, Sparkles, Terminal } from "lucide-react";
import { EXAMPLE_PROMPTS } from "../api/fixtures";
import { useExplorer } from "../context/ExplorerContext";
import { cn } from "../lib/utils";

export function ScenarioAssistant() {
  const {
    assistantText,
    setAssistantText,
    assistantLoading,
    assistantError,
    assistantResult,
    submitScenario,
  } = useExplorer();

  return (
    <section
      aria-label="Scenario Filter Assistant"
      className="panel-surface-cyan rounded-2xl p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Scenario Filter Assistant
            </h1>
            <p className="text-xs text-slate-400">
              Translate a natural-language combustion scenario (PL/EN) directly into validated search filters.
            </p>
          </div>
        </div>

        {assistantResult && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-telemetry uppercase tracking-wider border",
              assistantResult.mode === "live"
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                : "bg-orange-500/15 border-orange-400/40 text-orange-200",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                assistantResult.mode === "live"
                  ? "bg-emerald-400"
                  : "bg-orange-400",
              )}
            />
            AI Mode: {assistantResult.mode}
          </span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitScenario();
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <Terminal className="h-4 w-4 text-cyan-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            maxLength={4000}
            value={assistantText}
            onChange={(e) => setAssistantText(e.target.value)}
            placeholder='e.g. "Show butane tests above 200 kPa with more than 39% oxygen"'
            aria-label="Combustion scenario description"
            className="w-full rounded-xl bg-slate-950/90 border border-slate-700/85 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={assistantLoading || assistantText.trim().length === 0}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer",
            assistantLoading || assistantText.trim().length === 0
              ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 hover:from-cyan-400 hover:to-sky-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.8)]",
          )}
        >
          {assistantLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Interpreting…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Apply Scenario</span>
            </>
          )}
        </button>
      </form>

      {/* Rehearsed Example Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400">
          Examples:
        </span>
        {EXAMPLE_PROMPTS.map((ex) => (
          <button
            key={ex.label}
            type="button"
            disabled={assistantLoading}
            onClick={() => void submitScenario(ex.prompt)}
            className="px-2.5 py-1 rounded-full text-xs bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 hover:bg-cyan-950/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Non-blocking Assistant Error (manual search stays operational) */}
      {assistantError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/35 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2.5"
        >
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-100">
              Assistant unavailable:
            </span>{" "}
            {assistantError} Manual parameter filters remain active below.
          </div>
        </div>
      )}

      {/* Compact Last Request / Warnings display */}
      {assistantResult && !assistantError && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-xs space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
            <span className="truncate">
              <span className="text-slate-500">Prompt:</span> “
              {assistantResult.lastPrompt}”
            </span>
            <span className="font-mono-telemetry text-[11px] text-cyan-300">
              {!assistantResult.searchable
                ? "No supported search"
                : assistantResult.changedFields.length > 0
                ? `Updated: ${assistantResult.changedFields.join(", ")}`
                : "No filter changes"}
            </span>
          </div>
          {assistantResult.warnings.length > 0 && (
            <ul className="space-y-1 text-amber-200/95">
              {assistantResult.warnings.map((w, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
