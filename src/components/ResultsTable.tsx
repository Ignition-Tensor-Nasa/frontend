import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Search,
  SearchX,
  X,
} from "lucide-react";
import type { CaseSummary } from "../api/types";
import { useExplorer } from "../context/ExplorerContext";
import { formatNumber, kpaToPsi } from "../lib/utils";
import { ActiveFilterChips } from "./ActiveFilterChips";

const columnHelper = createColumnHelper<CaseSummary>();

export function ResultsTable() {
  const navigate = useNavigate();
  const {
    results,
    totalResults,
    searchLoading,
    searchError,
    assistantError,
    assistantResult,
    retrySearch,
    quickQuery,
    setQuickQuery,
    sorting,
    setSorting,
    resetAllFilters,
  } = useExplorer();

  const columns = useMemo(
    () => [
      columnHelper.accessor("case_id", {
        header: "Run / Case",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="min-w-[220px]">
              <div className="flex items-center gap-2">
                <span className="font-mono-telemetry text-xs font-semibold text-cyan-300">
                  {row.case_id}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-100 line-clamp-1 mt-0.5">
                {row.title}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("investigation", {
        header: "Investigation",
        cell: (info) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700/80 whitespace-nowrap">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("fuel", {
        header: "Fuel",
        cell: (info) => {
          const val = info.getValue();
          return val ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-500/15 text-orange-200 border border-orange-500/30">
              {val}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono-telemetry">
              —
            </span>
          );
        },
      }),
      columnHelper.accessor("o2_pct", {
        header: "O₂ (%)",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="font-mono-telemetry text-xs text-slate-200 whitespace-nowrap">
              {val !== null ? `${formatNumber(val, 1)}%` : "—"}
            </span>
          );
        },
      }),
      columnHelper.accessor("pressure_kpa", {
        header: "Pressure",
        cell: (info) => {
          const val = info.getValue();
          if (val === null) {
            return (
              <span className="font-mono-telemetry text-xs text-slate-500">
                —
              </span>
            );
          }
          return (
            <div className="font-mono-telemetry text-xs whitespace-nowrap">
              <span className="text-slate-200">{formatNumber(val, 1)} kPa</span>
              <span className="text-slate-500 ml-1.5">
                ({formatNumber(kpaToPsi(val), 1)} psi)
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("z_st", {
        header: "Z_st",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="font-mono-telemetry text-xs text-slate-200 whitespace-nowrap">
              {val !== null && val !== undefined ? formatNumber(val, 3) : "—"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Open</span>,
        cell: (info) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/cases/${encodeURIComponent(info.row.original.case_id)}`);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-200 border border-cyan-500/35 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Open Run</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      }),
    ],
    [navigate],
  );

  const filteredResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter((item) => {
      const haystack = [
        item.case_id,
        item.title,
        item.investigation,
        item.fuel ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [quickQuery, results]);

  const table = useReactTable({
    data: filteredResults,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <section className="panel-surface rounded-xl p-4 sm:p-5 space-y-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Experiment Run Catalogue
          </h2>
          <p className="text-xs text-slate-400">
            Select a test run to inspect synchronized sensor telemetry and phase-space plots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Filter by case ID, title, fuel…"
              aria-label="Quick filter matching runs"
              className="w-52 sm:w-56 rounded-lg bg-slate-950/90 border border-slate-700/80 pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {quickQuery && (
              <button
                type="button"
                onClick={() => setQuickQuery("")}
                aria-label="Clear quick filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono-telemetry bg-slate-900 border border-slate-700/80 text-cyan-300">
            {searchLoading
              ? "Searching…"
              : quickQuery.trim()
                ? `${totalResults} matching runs (${filteredResults.length} shown)`
                : `${totalResults} matching runs`}
          </span>
        </div>
      </div>

      <ActiveFilterChips />

      {searchError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">
                Could not retrieve matching runs
              </p>
              <p className="text-xs text-rose-200/80 mt-0.5">{searchError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={retrySearch}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 border border-rose-400/50 text-rose-100 hover:bg-rose-500/30 cursor-pointer"
          >
            Retry Search
          </button>
        </div>
      )}

      {!searchError && searchLoading && results.length === 0 && (
        <div className="space-y-2 animate-pulse py-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-12 rounded-lg bg-slate-800/50" />
          ))}
        </div>
      )}

      {!searchError && !searchLoading && assistantError && results.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">
          The scenario was not searched. Try again or use the manual filters.
        </p>
      )}

      {!searchError && !searchLoading && !assistantError && results.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center space-y-3">
          <div className="mx-auto h-11 w-11 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <SearchX className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {assistantResult
                ? assistantResult.searchable
                  ? "No experiment runs match this prompt"
                  : "No supported search could be created from this prompt"
                : "No experiment runs match the active constraints"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {assistantResult && !assistantResult.searchable
                ? "Try a description using the available fuel, investigation, oxygen, pressure or mixture fraction filters."
                : "Matching uses strict intersection across fields; runs with unknown (null) metadata are excluded when a constraint is active."}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {!searchError && results.length > 0 && filteredResults.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-center space-y-2.5">
          <p className="text-xs text-slate-300">
            No matching runs match quick filter{" "}
            <span className="font-mono-telemetry text-cyan-300">
              “{quickQuery.trim()}”
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => setQuickQuery("")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:border-cyan-400/50 cursor-pointer"
          >
            Clear Quick Filter
          </button>
        </div>
      )}

      {!searchError && filteredResults.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-mono-telemetry uppercase tracking-wider text-slate-400"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th key={header.id} className="py-3 px-3.5 font-medium">
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sorted === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-cyan-400" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="h-3 w-3 text-cyan-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600" />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    navigate(
                      `/cases/${encodeURIComponent(row.original.case_id)}`,
                    )
                  }
                  className="group hover:bg-cyan-950/20 transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-3.5 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
