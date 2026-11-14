import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as echarts from "echarts";
import {
  ApiError,
  downloadDatasetCsv,
  getDatasetData,
  parseContentDispositionFilename,
} from "../api/client";
import {
  filtersEqual,
  matchesFilters,
  sanitizeFilters,
  validateFilters,
} from "../api/filters";
import {
  FIXTURE_CASES,
  FIXTURE_CASE_DETAILS,
  getFixtureCaseNeighbors,
  interpretFixtureFilters,
  searchFixtureCases,
} from "../api/fixtures";
import { validateDatasetData } from "../utils/datasetValidation";
import type { CaseSummary, Dataset } from "../api/types";
import App from "../App";

describe("Filter sanitization, validation, and search semantics (F02/F03)", () => {
  it("omits empty category arrays and empty ranges", () => {
    expect(
      sanitizeFilters({
        investigation: [],
        fuel: ["propane", "butane", "propane"],
        o2_pct: {},
        pressure_kpa: { min: 100 },
      }),
    ).toEqual({
      fuel: ["butane", "propane"],
      pressure_kpa: { min: 100 },
    });
    expect(
      filtersEqual(
        { fuel: ["propane", "butane"], pressure_kpa: { max: 300, min: 100 } },
        { pressure_kpa: { min: 100, max: 300 }, fuel: ["butane", "propane"] },
      ),
    ).toBe(true);
  });

  it("blocks invalid O2 and pressure ranges", () => {
    expect(validateFilters({ o2_pct: { min: -1 } }).o2_pct).toBeTruthy();
    expect(validateFilters({ o2_pct: { max: 105 } }).o2_pct).toBeTruthy();
    expect(
      validateFilters({ o2_pct: { min: 40, max: 20 } }).o2_pct,
    ).toBeTruthy();
    expect(
      validateFilters({ pressure_kpa: { min: -5 } }).pressure_kpa,
    ).toBeTruthy();
    expect(
      validateFilters({ pressure_kpa: { min: 300, max: 100 } }).pressure_kpa,
    ).toBeTruthy();
    expect(validateFilters({ z_st: { min: -0.1 } }).z_st).toBeTruthy();
    expect(validateFilters({ z_st: { max: 1.2 } }).z_st).toBeTruthy();
    expect(validateFilters({ z_st: { min: 0.4, max: 0.1 } }).z_st).toBeTruthy();
  });

  it("enforces AND across fields, OR within categories, inclusive bounds, and rejects null metadata", () => {
    const nullCase: CaseSummary = {
      case_id: "NULL-1",
      title: "Missing metadata",
      investigation: "ACME CFI-G",
      fuel: null,
      o2_pct: null,
      pressure_kpa: null,
      z_st: null,
    };

    expect(matchesFilters(nullCase, {})).toBe(true);
    expect(matchesFilters(nullCase, { fuel: ["butane"] })).toBe(false);
    expect(matchesFilters(nullCase, { o2_pct: { min: 10 } })).toBe(false);
    expect(matchesFilters(nullCase, { pressure_kpa: { max: 200 } })).toBe(
      false,
    );
    expect(matchesFilters(nullCase, { z_st: { min: 0.05 } })).toBe(false);

    const zHigh = searchFixtureCases({ z_st: { min: 0.2 } });
    expect(zHigh.total).toBeGreaterThan(0);
    expect(zHigh.items.every((c) => (c.z_st ?? -1) >= 0.2)).toBe(true);
    expect(
      zHigh.items.some((c) => c.investigation === "CFI (FLEX)"),
    ).toBe(false);

    const butaneHigh = searchFixtureCases({
      fuel: ["butane"],
      o2_pct: { min: 39 },
      pressure_kpa: { min: 200 },
    });
    expect(butaneHigh.total).toBe(6);
    expect(butaneHigh.items.map((c) => c.case_id)).toContain("CFIG-21291C1");

    const orFuels = searchFixtureCases({ fuel: ["ethane", "propane"] });
    expect(
      orFuels.items.every(
        (c) => c.fuel === "ethane" || c.fuel === "propane",
      ),
    ).toBe(true);
    expect(orFuels.total).toBeGreaterThan(0);
  });
});

describe("Assistant prompt interpretation (F04)", () => {
  it("maps Polish and English rehearsed prompts to complete filter states labelled demo", () => {
    const pl = interpretFixtureFilters(
      "Pokaż testy z butanem powyżej 200 kPa i ponad 39% tlenu!",
      { investigation: ["CFI (PSI-39)"] },
    );
    expect(pl.mode).toBe("demo");
    expect(pl.warnings).toEqual([]);
    expect(pl.filters).toEqual({
      fuel: ["butane"],
      o2_pct: { min: 39 },
      pressure_kpa: { min: 200 },
    });
  });

  it("leaves current filters unchanged with warning for unknown prompts", () => {
    const res = interpretFixtureFilters("show safe Mars habitat margins", {
      fuel: ["ethane"],
    });
    expect(res.mode).toBe("demo");
    expect(res.filters).toEqual({ fuel: ["ethane"] });
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});

describe("DatasetData JSON validation (F06/F07)", () => {
  const descriptor: Dataset = {
    dataset_id: "DS-1",
    label: "Test DS",
    columns: [
      { key: "time_s", label: "Time", data_type: "number", unit: "s" },
      { key: "sig", label: "Signal", data_type: "number", unit: "V" },
    ],
    default_x: "time_s",
    default_y: ["sig"],
  };

  it("preserves null samples without coercing to zero", () => {
    const res = validateDatasetData(
      {
        dataset: descriptor,
        rows: [
          [0, 1.5],
          [1, null],
          [2, 2.5],
        ],
        note: null,
      },
      descriptor,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.rows[1][1]).toBeNull();
    }
  });

  it("rejects numeric strings, NaN, and row/descriptor shape mismatches", () => {
    const badString = validateDatasetData(
      {
        dataset: descriptor,
        rows: [[0, "1.5"]],
        note: null,
      },
      descriptor,
    );
    expect(badString.ok).toBe(false);

    const badWidth = validateDatasetData(
      {
        dataset: descriptor,
        rows: [[0]],
        note: null,
      },
      descriptor,
    );
    expect(badWidth.ok).toBe(false);

    const badNan = validateDatasetData(
      {
        dataset: descriptor,
        rows: [[0, Number.NaN]],
        note: null,
      },
      descriptor,
    );
    expect(badNan.ok).toBe(false);
  });
});

describe("End-to-end Explorer -> Case -> Back journey (F00–F09)", () => {
  it("runs scenario filter assistant, preserves state across case navigation, and handles reset", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Demo badge and disclaimer are visible
    expect(screen.getByText(/DEMO \/ FIXTURE MODE:/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Research demo, not a safety assessment/i).length,
    ).toBeGreaterThan(0);

    // Full initial catalogue loaded
    expect(
      await screen.findByText(`${FIXTURE_CASES.length} matching runs`),
    ).toBeInTheDocument();

    // Click example scenario chip (Butane >200 kPa & >39% O2)
    await user.click(
      screen.getByRole("button", { name: /Butane >200 kPa & >39% O₂/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("6 matching runs")).toBeInTheDocument();
    });
    expect(screen.getByText(/AI Mode: demo/i)).toBeInTheDocument();
    expect(screen.getByText("Fuel: butane")).toBeInTheDocument();

    // Open CFIG-21291C1
    await user.click(screen.getByText("CFIG-21291C1"));
    expect(
      await screen.findByText(/5 transitions from hot to cool flame/i),
    ).toBeInTheDocument();

    // B15 template explanation, B13 event annotations, B14 research context, B11 neighbors
    expect(screen.getByText(/Origin: template/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ignition and retraction @ 23\.8 s/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Research Context")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Nearest Condition Cases"),
    ).toBeInTheDocument();
    expect(screen.getByText("CFIG-21174C3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Export PNG/i }),
    ).toBeInTheDocument();

    // Toggling all channels off keeps the ECharts DOM node mounted and restores cleanly
    const chartNode = screen.getByTestId("hero-timeseries-canvas");
    await user.click(
      screen.getByRole("button", { name: /Radiometer \+30, low gain/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Photomultiplier PMT1/i }),
    );
    await user.click(screen.getByRole("button", { name: /MFC A3 fuel flow/i }));
    expect(chartNode).toHaveClass("hidden");
    await user.click(
      screen.getByRole("button", { name: /Restore Default Channels/i }),
    );
    expect(screen.getByTestId("hero-timeseries-canvas")).toBe(chartNode);
    expect(chartNode).not.toHaveClass("hidden");

    // Toggle to Scatter View (F08) without refetching
    await user.click(screen.getByRole("tab", { name: /Scatter View/i }));
    expect(
      await screen.findByText(/40 plotted points/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Export PNG/i }),
    ).toBeInTheDocument();

    // Navigate directly to a nearest-condition neighbor and confirm fresh case state resets
    await user.click(screen.getByRole("link", { name: /CFIG-21174C3/i }));
    expect(
      await screen.findByText(/cool-flame run, PCI-D/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Time-Series/i }),
    ).toHaveAttribute("aria-selected", "true");

    // Return to results and verify filter state was preserved in memory
    await user.click(screen.getByRole("link", { name: /Back to Results/i }));
    expect(await screen.findByText("6 matching runs")).toBeInTheDocument();
    expect(screen.getByText("Fuel: butane")).toBeInTheDocument();

    // Quick preset (F20 / B10) applies z_st >= 0.25 and quickQuery persists across navigation
    await user.click(screen.getByRole("button", { name: /High Z_st \(≥ 0\.25\)/i }));
    await waitFor(() => {
      expect(screen.getByText("4 matching runs")).toBeInTheDocument();
    });
    const quickFilter = screen.getByLabelText("Quick filter matching runs");
    await user.type(quickFilter, "21153");
    await waitFor(() => {
      expect(screen.getByText("CFIG-21153A2")).toBeInTheDocument();
      expect(screen.getByText("CFIG-21153C7")).toBeInTheDocument();
      expect(screen.queryByText("CFIG-21162A2")).not.toBeInTheDocument();
    });
    await user.click(screen.getByText("CFIG-21153A2"));
    expect(
      await screen.findByRole("link", { name: /Back to Results/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Back to Results/i }));
    expect(screen.getByLabelText("Quick filter matching runs")).toHaveValue("21153");
    expect(screen.getByText("4 matching runs (2 shown)")).toBeInTheDocument();

    // Reset Demo clears quick filter as well as committed filters
    await user.click(screen.getByRole("button", { name: /Reset Demo/i }));
    await waitFor(() => {
      expect(screen.getByText("43 matching runs")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Quick filter matching runs")).toHaveValue("");

    // Fault-injected AI 503 leaves manual search usable
    await user.click(screen.getByRole("button", { name: /Fault Sim/i }));
    await user.click(
      screen.getByRole("button", { name: /Simulate AI 503 unavailable/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Low pressure 45–55 kPa/i }),
    );
    expect(await screen.findByText(/Assistant unavailable:/i)).toBeInTheDocument();
    // Manual filter button still works
    await user.click(screen.getByRole("button", { name: "propane" }));
    await user.click(screen.getByRole("button", { name: /Apply Filters/i }));
    await waitFor(() => {
      expect(screen.getByText("6 matching runs")).toBeInTheDocument();
    });
  }, 30000);
});

describe("43-case benchmark fixture parity with backend manifest", () => {
  it("matches exact benchmark case counts across investigations, atmosphere, fuel, and Z_st", () => {
    expect(FIXTURE_CASES).toHaveLength(43);
    expect(
      searchFixtureCases({
        o2_pct: { min: 20, max: 22 },
        pressure_kpa: { min: 95, max: 105 },
      }).total,
    ).toBe(10);
    expect(
      searchFixtureCases({ pressure_kpa: { min: 45, max: 55 } }).total,
    ).toBe(9);
    expect(searchFixtureCases({ z_st: { min: 0.25 } }).total).toBe(4);
    expect(searchFixtureCases({ fuel: ["propane"] }).total).toBe(6);
  });
});

describe("Backend main API compatibility (/datasets/{id}/data, /csv export & B11 neighbors)", () => {
  it("computes B11 neighbors within same investigation and returns empty when O2 is null (FLEX-1213)", () => {
    const flex1213 = getFixtureCaseNeighbors("FLEX-1213");
    expect(flex1213?.items).toEqual([]);

    const flex1249 = getFixtureCaseNeighbors("FLEX-1249");
    expect(flex1249?.items.length).toBeGreaterThan(0);
    expect(
      flex1249?.items.every((n) => n.case.investigation === "CFI (FLEX)"),
    ).toBe(true);
  });

  it("loads native Parquet JSON from /data in live mode and surfaces 404 without /csv fallback", async () => {
    const descriptor = FIXTURE_CASE_DETAILS["FLEX-1249"].datasets[3];
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            dataset: descriptor,
            rows: [
              [0.6, 17.084, null],
              [4.667, 15.589, 15.5618],
            ],
            note: "Derived for this project",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Unknown dataset: missing-id" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );

    try {
      const loaded = await getDatasetData(descriptor.dataset_id, descriptor, {
        mode: "live",
      });
      expect(loaded.rows).toEqual([
        [0.6, 17.084, null],
        [4.667, 15.589, 15.5618],
      ]);
      expect(loaded.note).toBe("Derived for this project");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
        `/api/v1/datasets/${descriptor.dataset_id}/data`,
      );

      await expect(
        getDatasetData("missing-id", descriptor, { mode: "live" }),
      ).rejects.toThrow("Unknown dataset: missing-id");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("extracts Content-Disposition filenames and surfaces backend HTTP errors in downloadDatasetCsv", async () => {
    expect(
      parseContentDispositionFilename(
        'attachment; filename="CFIG-21291C1-sensors.csv"',
        "fallback.csv",
      ),
    ).toBe("CFIG-21291C1-sensors.csv");
    expect(
      parseContentDispositionFilename(
        "attachment; filename*=UTF-8''FLEX%201249.csv",
        "fallback.csv",
      ),
    ).toBe("FLEX 1249.csv");

    const origCreateObjectUrl = URL.createObjectURL;
    const origRevokeObjectUrl = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:mock-csv");
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("time_s,val\n0,1\n", {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="FLEX-1249-d2-fit.csv"',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Curated catalogue missing" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      );

    try {
      const savedName = await downloadDatasetCsv("FLEX-1249-d2-fit");
      expect(savedName).toBe("FLEX-1249-d2-fit.csv");
      expect(clickSpy).toHaveBeenCalledTimes(1);

      await expect(downloadDatasetCsv("missing")).rejects.toThrowError(
        expect.objectContaining({
          name: "ApiError",
          status: 503,
          detail: "Curated catalogue missing",
        }),
      );
      expect(ApiError).toBeDefined();
    } finally {
      clickSpy.mockRestore();
      fetchMock.mockRestore();
      URL.createObjectURL = origCreateObjectUrl;
      URL.revokeObjectURL = origRevokeObjectUrl;
    }
  });
});

describe("Optional Hackathon Modules (F10, F11, F12, F13, F15, F18, F19, F20)", () => {
  it("renders Atmosphere Heatmap, Galaxy & Z_st Regimes, Safety Context Matrix, and Multi-Case Comparison", async () => {
    window.history.pushState({}, "", "/");
    const user = userEvent.setup();
    render(<App />);

    expect(
      await screen.findByText(`${FIXTURE_CASES.length} matching runs`),
    ).toBeInTheDocument();

    // F10 Heatmap is visible by default on Explorer
    expect(
      screen.getByTestId("atmosphere-heatmap-canvas"),
    ).toBeInTheDocument();

    // Switch to F19 / F15 Condition Galaxy & Stoichiometric Regime Map
    await user.click(
      screen.getByRole("tab", { name: /Condition Galaxy & Z_st/i }),
    );
    expect(
      screen.getByTestId("experiment-galaxy-canvas"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Stoichiometric Regime Map/i }),
    );
    expect(
      screen.getByText(/droplet runs omitted \(Z_st = null\)/i),
    ).toBeInTheDocument();

    // Switch to F18 Prevention / Detection / Suppression Matrix
    await user.click(
      screen.getByRole("tab", { name: /Safety Context Matrix/i }),
    );
    expect(
      screen.getByText(/CFI_PSI-39 PDF · p\. 23/i),
    ).toBeInTheDocument();

    // Launch curated 1-click Hot vs Cool Flame Comparison (F12)
    await user.click(
      screen.getByRole("button", {
        name: /Hot vs Cool Flame \(21174C2 vs 21174C3\)/i,
      }),
    );
    expect(
      await screen.findByRole("dialog", {
        name: /Multi-Case Telemetry Comparison/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Run CFIG-21174C2")).toBeInTheDocument();
    expect(screen.getByText("Run CFIG-21174C3")).toBeInTheDocument();

    await waitFor(() => {
      const canvas = screen.getByTestId("multi-case-compare-canvas");
      const inst = echarts.getInstanceByDom(canvas);
      expect(inst).toBeDefined();
      const opt = inst?.getOption() as
        | { series?: Array<{ data?: unknown[] }>; yAxis?: unknown[] }
        | undefined;
      expect(opt?.series).toHaveLength(2);
      expect((opt?.series?.[0]?.data ?? []).length).toBeGreaterThan(0);
      expect((opt?.series?.[1]?.data ?? []).length).toBeGreaterThan(0);
    });

    // Close modal cleanly
    await user.click(
      screen.getByRole("button", { name: /Close Comparison/i }),
    );

    // Replace CFIG-21174C3 with FLEX-1249 to verify Cross-Investigation Dual-Axis Mode
    await user.click(
      screen.getAllByRole("button", {
        name: /Remove CFIG-21174C3 from comparison/i,
      })[0],
    );
    await user.click(
      screen.getByRole("button", { name: /Pin FLEX-1249 to comparison/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Open Overlay Comparison/i }),
    );
    expect(
      await screen.findByText(/Cross-Investigation Dual-Axis Mode/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      const canvas = screen.getByTestId("multi-case-compare-canvas");
      const inst = echarts.getInstanceByDom(canvas);
      expect(inst).toBeDefined();
      const opt = inst?.getOption() as
        | { series?: Array<{ data?: unknown[] }>; yAxis?: unknown[] }
        | undefined;
      expect(opt?.series).toHaveLength(2);
      expect(opt?.yAxis).toHaveLength(2);
      expect((opt?.series?.[0]?.data ?? []).length).toBeGreaterThan(0);
      expect((opt?.series?.[1]?.data ?? []).length).toBeGreaterThan(0);
    });

    await user.click(
      screen.getByRole("button", { name: /Close Comparison/i }),
    );
  }, 15000);

  it("renders Cool-Flame Droplet Lifecycle Deck (F13) and Parallel Coordinates (F11) on FLEX-1249", async () => {
    window.history.pushState({}, "", "/cases/FLEX-1249");
    const user = userEvent.setup();
    render(<App />);

    // Cool-Flame Droplet Lifecycle Deck (F13) expands automatically for CFI (FLEX)
    expect(
      await screen.findByText(/Cool-Flame Droplet Lifecycle Deck \(F13\)/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Tier 1 · Droplet D² & Backend Linear Fit/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tier 2 · Cool-Flame Diameter/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tier 3 · Radiometer Radiant Power/i),
    ).toBeInTheDocument();

    // Switch main chart workspace to Parallel Coordinates (F11)
    await user.click(screen.getByRole("tab", { name: /Parallel Coords/i }));
    expect(screen.getByTestId("parallel-coords-canvas")).toBeInTheDocument();
    expect(
      screen.getByText(/complete rows plotted/i),
    ).toBeInTheDocument();
  });
});
