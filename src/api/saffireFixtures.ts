import type {
  SaffireAiFocus,
  SaffireAiLanguage,
  SaffireAiSummaryResponse,
  SaffireSpecialCasePayload,
  SpecialCasesListResponse,
  SpecialCaseSummary,
} from "./types";

const COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#22c55e",
];

export const FIXTURE_BESPOKE_NOTICE =
  "Dedykowana analiza SAFFIRE-III (NASA PSI-100): ten 4-sekcyjny układ wykresów (czujniki 30 Hz próbek 1 i 2, kolejność dotarcia płomienia TC7–TC12, animowana oś nagrzewania oraz 1 Hz telemetria statku Cygnus OA-7 + podsumowanie AI) został przygotowany wyłącznie dla tych 2 specjalnych case'ów.";

export const FIXTURE_SPECIAL_CASES: SpecialCaseSummary[] = [
  {
    case_id: "SAFFIRE-III-S1",
    sample_number: 1,
    title:
      "Saffire-III Sample 1 · Large Spacecraft Fire (690 s, 30 Hz + 1 Hz Cygnus)",
    subtitle:
      "Główny pożar w module Cygnus (0.4 × 0.94 m): szczyt 1088 °C na TC11 (247 s po zapłonie), radiometr 169 mW/cm² oraz odpowiedź detektora dymu FIZ2 po 23 s.",
    investigation: "Saffire-III (PSI-100)",
    capsule: "Cygnus OA-7",
    fuel: "Saffire-III Sample 1 (0.4 × 0.94 m)",
    o2_pct: 19.84,
    pressure_kpa: 99.4,
    recording_duration_s: 690.0,
    peak_temp_c: 1088.0,
    peak_heat_flux_mw_cm2: 169.0,
    highlight_badge: "BESPOKE · 1088 °C Peak",
  },
  {
    case_id: "SAFFIRE-III-S2",
    sample_number: 2,
    title:
      "Saffire-III Sample 2 · Companion 30 Hz Sensor Record & Cygnus Downlink (160 s)",
    subtitle:
      "Drugi zestaw 30 Hz (160 s): impuls zapalnika 60.0–68.0 s, szczyt w smudze 48.4 °C (TC3), powierzchnia próbki ≤ 20.0 °C oraz wspólna telemetria 1 Hz statku Cygnus OA-7.",
    investigation: "Saffire-III (PSI-100)",
    capsule: "Cygnus OA-7",
    fuel: "Saffire-III Sample 2",
    o2_pct: 19.88,
    pressure_kpa: 99.4,
    recording_duration_s: 160.0,
    peak_temp_c: 20.0,
    peak_heat_flux_mw_cm2: -3.7,
    highlight_badge: "BESPOKE · 160 s Companion",
  },
];

function buildSample1Series(peak: number, base: number, shift: number) {
  const times = [0, 20, 40, 80, 140, 200, 267, 350, 500, 689.9];
  return times.map((t) => {
    const dt = (t - (267 + shift)) / 95;
    const bell = Math.exp(-dt * dt);
    return [t, Number((base + (peak - base) * bell).toFixed(2))] as [
      number,
      number,
    ];
  });
}

function buildSample2Series(peak: number, base: number) {
  const times = [0, 30, 60, 64, 68, 90, 120, 159.9];
  return times.map((t) => {
    const dt = (t - 65) / 10;
    const bell = Math.exp(-dt * dt);
    return [t, Number((base + (peak - base) * bell).toFixed(2))] as [
      number,
      number,
    ];
  });
}

export const FIXTURE_SAFFIRE_PAYLOAD: SaffireSpecialCasePayload = {
  case_id: "SAFFIRE-III-S1",
  active_sample_number: 1,
  bespoke_notice: FIXTURE_BESPOKE_NOTICE,
  items: FIXTURE_SPECIAL_CASES,
  samples: {
    "1": {
      sample_number: 1,
      case_id: "SAFFIRE-III-S1",
      tab_label: "Sample 1 · the large burn (690 s)",
      duration_s: 689.96,
      point_limit: 2500,
      igniter_window: [19.9, 26.9],
      presets: {
        "Whole run": [0, 689.96],
        Ignition: [4.9, 86.9],
        "Peak burn": [207.0, 417.0],
      },
      tiles: [
        {
          value: "1088 °C",
          label: "peak sample temperature",
          detail: "TC11, 247 s after ignition",
        },
        {
          value: "169 mW/cm²",
          label: "peak radiant heat flux",
          detail: "Radiometer 4; idle reading is about -18",
        },
        {
          value: "19.84 → 19.40 %",
          label: "oxygen, before → lowest",
          detail: "CO₂ 0.40 → 0.61 %",
        },
        {
          value: "+0.51 kPa",
          label: "ambient pressure rise",
          detail: "from 99.4 kPa",
        },
        {
          value: "25 cm/s",
          label: "air flow through the test section",
          detail: "Anemometer 1, average before ignition",
        },
        {
          value: "23 s",
          label: "smoke wire → Cygnus detector",
          detail: "scatter 0.025 V → peak 1.80 V",
        },
      ],
      stats: {
        duration_s: 689.964,
        igniter_window: [19.9, 26.9],
        peak_sample_tc: "Sample Temp 5 (TC11)",
        peak_sample_temp_c: 1088.0,
        peak_sample_time_s: 266.9,
        peak_after_ignition_s: 247.0,
        peak_plume_tc: "Plume Temp 4 (TC4)",
        peak_plume_temp_c: 942.0,
        peak_radiometer: "Radiometer 4",
        peak_heat_flux_mw_cm2: 169.0,
        idle_heat_flux_mw_cm2: -18.0,
        o2_before_pct: 19.84,
        o2_min_pct: 19.4,
        co2_before_pct: 0.4,
        co2_max_pct: 0.61,
        pressure_before_kpa: 99.4,
        pressure_rise_kpa: 0.51,
        air_flow_cm_s: 25.0,
      },
      burn_panels: [
        {
          id: "sample_temp",
          title: "Sample surface temperature",
          unit: "°C",
          series: [
            { name: "TC7", color: COLORS[0], points: buildSample1Series(860, 22, -65) },
            { name: "TC8", color: COLORS[1], points: buildSample1Series(910, 22, -45) },
            { name: "TC9", color: COLORS[2], points: buildSample1Series(960, 22, -25) },
            { name: "TC10", color: COLORS[3], points: buildSample1Series(1015, 22, -10) },
            { name: "TC11", color: COLORS[4], points: buildSample1Series(1088, 22, 0) },
            { name: "TC12", color: COLORS[5], points: buildSample1Series(945, 22, 18) },
          ],
        },
        {
          id: "radiant_heat_flux",
          title: "Radiant heat flux",
          unit: "mW/cm²",
          series: [
            { name: "Radiometer 1", color: COLORS[0], points: buildSample1Series(120, -18, -10) },
            { name: "Radiometer 2", color: COLORS[1], points: buildSample1Series(142, -18, 0) },
            { name: "Radiometer 3", color: COLORS[2], points: buildSample1Series(131, -17, 5) },
            { name: "Radiometer 4", color: COLORS[3], points: buildSample1Series(169, -18, 0) },
          ],
        },
        {
          id: "plume_temp",
          title: "Plume (gas) temperature",
          unit: "°C",
          series: [
            { name: "TC1", color: COLORS[0], points: buildSample1Series(650, 22, -30) },
            { name: "TC2", color: COLORS[1], points: buildSample1Series(780, 22, -15) },
            { name: "TC3", color: COLORS[2], points: buildSample1Series(880, 22, -5) },
            { name: "TC4", color: COLORS[3], points: buildSample1Series(942, 22, 0) },
            { name: "TC5", color: COLORS[4], points: buildSample1Series(790, 22, 15) },
            { name: "TC6", color: COLORS[5], points: buildSample1Series(640, 22, 25) },
          ],
        },
        {
          id: "oxygen",
          title: "Oxygen",
          unit: "%",
          series: [
            {
              name: "O₂",
              color: COLORS[0],
              points: [
                [0, 19.84],
                [150, 19.65],
                [300, 19.44],
                [450, 19.4],
                [689.9, 19.43],
              ],
            },
          ],
        },
        {
          id: "carbon_dioxide",
          title: "Carbon dioxide",
          unit: "%",
          series: [
            {
              name: "CO₂",
              color: COLORS[0],
              points: [
                [0, 0.4],
                [150, 0.49],
                [300, 0.58],
                [450, 0.61],
                [689.9, 0.59],
              ],
            },
          ],
        },
        {
          id: "ambient_pressure",
          title: "Ambient pressure",
          unit: "kPa",
          series: [
            {
              name: "Pressure",
              color: COLORS[0],
              points: [
                [0, 99.4],
                [180, 99.78],
                [300, 99.91],
                [500, 99.74],
                [689.9, 99.65],
              ],
            },
          ],
        },
        {
          id: "air_flow",
          title: "Air flow speed",
          unit: "cm/s",
          series: [
            {
              name: "Anemometer 1",
              color: COLORS[0],
              points: [
                [0, 25.0],
                [267, 25.4],
                [689.9, 24.9],
              ],
            },
            {
              name: "Anemometer 2",
              color: COLORS[1],
              points: [
                [0, 25.6],
                [267, 26.1],
                [689.9, 25.5],
              ],
            },
          ],
        },
      ],
      arrival: {
        thermocouples: ["TC7", "TC8", "TC9", "TC10", "TC11", "TC12"],
        thresholds_c: [100, 300, 600],
        default_threshold_c: 300,
        arrivals_by_threshold: {
          "100": [38.0, 56.0, 79.0, 102.0, 134.0, 159.0],
          "300": [54.0, 77.0, 103.0, 129.0, 158.0, 188.0],
          "600": [81.0, 108.0, 137.0, 166.0, 198.0, 226.0],
        },
        peaks_c: [860, 910, 960, 1015, 1088, 945],
        max_t: 689.96,
        note: "Thermocouple positions are not given in the files used here, so this shows order and timing, not a spread rate.",
      },
      playback: {
        thermocouples: ["TC7", "TC8", "TC9", "TC10", "TC11", "TC12"],
        step_s: 3.0,
        y_max_c: 1175.0,
        frames: [
          { t_s: 0.0, values_c: [22, 22, 22, 22, 22, 22] },
          { t_s: 60.0, values_c: [390, 210, 85, 34, 24, 22] },
          { t_s: 150.0, values_c: [720, 790, 680, 420, 260, 110] },
          { t_s: 267.0, values_c: [790, 840, 920, 1010, 1088, 915] },
          { t_s: 420.0, values_c: [310, 340, 410, 480, 560, 440] },
          { t_s: 600.0, values_c: [90, 95, 108, 122, 136, 115] },
        ],
      },
    },
    "2": {
      sample_number: 2,
      case_id: "SAFFIRE-III-S2",
      tab_label: "Sample 2 · 160 s recording",
      duration_s: 159.95,
      point_limit: 2500,
      igniter_window: [60.03, 67.98],
      presets: {
        "Whole run": [0, 159.95],
        Ignition: [45.0, 127.98],
      },
      tiles: [
        {
          value: "20.0 °C",
          label: "peak sample temperature",
          detail: "TC12; plume TC3 reached 48.4 °C during igniter",
        },
        {
          value: "-3.7 mW/cm²",
          label: "peak radiant heat flux",
          detail: "Radiometer 2; idle reading is about -17",
        },
        {
          value: "19.88 → 19.69 %",
          label: "oxygen, before → lowest",
          detail: "CO₂ 0.38 → 0.39 %",
        },
        {
          value: "+0.15 kPa",
          label: "ambient pressure rise",
          detail: "from 99.4 kPa",
        },
        {
          value: "21 cm/s",
          label: "air flow through the test section",
          detail: "Anemometer 1, average before ignition",
        },
        {
          value: "23 s",
          label: "smoke wire → Cygnus detector",
          detail: "scatter 0.025 V → peak 1.80 V",
        },
      ],
      stats: {
        duration_s: 159.951,
        igniter_window: [60.027, 67.98],
        peak_sample_tc: "Sample Temp 6 (TC12)",
        peak_sample_temp_c: 20.04,
        peak_sample_time_s: 78.2,
        peak_after_ignition_s: 18.17,
        peak_plume_tc: "Plume Temp 3 (TC3)",
        peak_plume_temp_c: 48.35,
        peak_radiometer: "Radiometer 2",
        peak_heat_flux_mw_cm2: -3.72,
        idle_heat_flux_mw_cm2: -17.5,
        o2_before_pct: 19.88,
        o2_min_pct: 19.69,
        co2_before_pct: 0.38,
        co2_max_pct: 0.39,
        pressure_before_kpa: 99.4,
        pressure_rise_kpa: 0.15,
        air_flow_cm_s: 20.76,
      },
      burn_panels: [
        {
          id: "sample_temp",
          title: "Sample surface temperature",
          unit: "°C",
          series: [
            { name: "TC7", color: COLORS[0], points: buildSample2Series(17.5, 11.2) },
            { name: "TC8", color: COLORS[1], points: buildSample2Series(17.9, 10.6) },
            { name: "TC9", color: COLORS[2], points: buildSample2Series(17.9, 11.0) },
            { name: "TC10", color: COLORS[3], points: buildSample2Series(17.1, 10.5) },
            { name: "TC11", color: COLORS[4], points: buildSample2Series(17.1, 10.1) },
            { name: "TC12", color: COLORS[5], points: buildSample2Series(20.0, 9.8) },
          ],
        },
        {
          id: "radiant_heat_flux",
          title: "Radiant heat flux",
          unit: "mW/cm²",
          series: [
            { name: "Radiometer 1", color: COLORS[0], points: buildSample2Series(-16.7, -17.3) },
            { name: "Radiometer 2", color: COLORS[1], points: buildSample2Series(-3.7, -17.6) },
            { name: "Radiometer 3", color: COLORS[2], points: buildSample2Series(-15.6, -16.2) },
            { name: "Radiometer 4", color: COLORS[3], points: buildSample2Series(-5.6, -17.4) },
          ],
        },
        {
          id: "plume_temp",
          title: "Plume (gas) temperature",
          unit: "°C",
          series: [
            { name: "TC1", color: COLORS[0], points: buildSample2Series(30.2, 20.1) },
            { name: "TC2", color: COLORS[1], points: buildSample2Series(41.9, 20.2) },
            { name: "TC3", color: COLORS[2], points: buildSample2Series(48.4, 20.1) },
            { name: "TC4", color: COLORS[3], points: buildSample2Series(35.8, 20.0) },
            { name: "TC5", color: COLORS[4], points: buildSample2Series(26.1, 19.9) },
            { name: "TC6", color: COLORS[5], points: buildSample2Series(26.8, 19.8) },
          ],
        },
        {
          id: "oxygen",
          title: "Oxygen",
          unit: "%",
          series: [
            {
              name: "O₂",
              color: COLORS[0],
              points: [
                [0, 19.85],
                [65, 19.81],
                [159.95, 19.77],
              ],
            },
          ],
        },
        {
          id: "carbon_dioxide",
          title: "Carbon dioxide",
          unit: "%",
          series: [
            {
              name: "CO₂",
              color: COLORS[0],
              points: [
                [0, 0.38],
                [65, 0.39],
                [159.95, 0.38],
              ],
            },
          ],
        },
        {
          id: "ambient_pressure",
          title: "Ambient pressure",
          unit: "kPa",
          series: [
            {
              name: "Pressure",
              color: COLORS[0],
              points: [
                [0, 99.4],
                [65, 99.55],
                [159.95, 99.48],
              ],
            },
          ],
        },
        {
          id: "air_flow",
          title: "Air flow speed",
          unit: "cm/s",
          series: [
            {
              name: "Anemometer 1",
              color: COLORS[0],
              points: [
                [0, 24.7],
                [65, 21.0],
                [159.95, 22.1],
              ],
            },
            {
              name: "Anemometer 2",
              color: COLORS[1],
              points: [
                [0, 25.4],
                [65, 21.6],
                [159.95, 22.8],
              ],
            },
          ],
        },
      ],
      arrival: {
        thermocouples: ["TC7", "TC8", "TC9", "TC10", "TC11", "TC12"],
        thresholds_c: [15, 17, 100],
        default_threshold_c: 15,
        arrivals_by_threshold: {
          "15": [61.2, 61.5, 61.8, 62.1, 62.4, 60.8],
          "17": [65.1, 65.4, 65.8, 66.0, 66.2, 64.0],
          "100": [null, null, null, null, null, null],
        },
        peaks_c: [17.52, 17.94, 17.94, 17.1, 17.1, 20.04],
        max_t: 159.95,
        note: "Thermocouple positions are not given in the files used here. Sample 2 thermocouples remained ≤ 20.0 °C (≥ 100 °C was never reached); thresholds include 15 °C and 17 °C alongside 100 °C.",
      },
      playback: {
        thermocouples: ["TC7", "TC8", "TC9", "TC10", "TC11", "TC12"],
        step_s: 3.0,
        y_max_c: 22.0,
        frames: [
          { t_s: 0.0, values_c: [11.2, 10.6, 11.0, 10.5, 10.1, 9.8] },
          { t_s: 63.0, values_c: [16.8, 17.1, 17.2, 16.4, 16.2, 19.6] },
          { t_s: 120.0, values_c: [13.2, 12.9, 13.0, 12.6, 12.4, 13.8] },
        ],
      },
    },
  },
  spacecraft: {
    events: {
      igniter1: [5953.845, 5960.845],
      igniter2: [5758.845, 5765.986],
      smoke_wire: [5632.361, 5690.0],
      window: [5480.845, 6899.845],
      scatter_baseline: 0.025,
      scatter_peak: 1.805,
      scatter_peak_t: 6295.372,
      first_rise: 5655.338,
      smoke_lag_s: 22.98,
    },
    presets: {
      Experiment: [5480.845, 6899.845],
      "First smoke": [5602.36, 5782.36],
      "Whole downlink": [0, 6899.845],
    },
    t_max: 6899.845,
    panels: [
      {
        id: "smoke_scatter",
        title: "Cygnus smoke detector FIZ 2, scatterometer",
        unit: "V",
        series: [
          {
            name: "Scatter",
            color: COLORS[0],
            points: [
              [5500, 0.025],
              [5632.4, 0.028],
              [5655.3, 0.09],
              [5960, 0.45],
              [6295.4, 1.805],
              [6890, 0.35],
            ],
          },
        ],
      },
      {
        id: "saffire_radiometers",
        title: "Saffire radiometers, 1 Hz downlink",
        unit: "mW/cm²",
        series: [
          {
            name: "Radiometer 1",
            color: COLORS[0],
            points: [
              [5500, -18],
              [6220, 120],
              [6890, -17],
            ],
          },
          {
            name: "Radiometer 4",
            color: COLORS[3],
            points: [
              [5500, -18],
              [6220, 168],
              [6890, -18],
            ],
          },
        ],
      },
      {
        id: "cabin_pressure",
        title: "Cygnus cabin pressure",
        unit: "kPa",
        series: [
          {
            name: "EPS 1",
            color: COLORS[0],
            points: [
              [5500, 99.4],
              [6220, 99.9],
              [6890, 99.7],
            ],
          },
        ],
      },
      {
        id: "cabin_temp",
        title: "Cygnus cabin air temperature",
        unit: "°C",
        series: [
          {
            name: "Air temperature",
            color: COLORS[0],
            points: [
              [5500, 21.8],
              [6250, 22.9],
              [6890, 22.3],
            ],
          },
        ],
      },
      {
        id: "saffire_airflow",
        title: "Saffire air flow",
        unit: "cm/s",
        series: [
          {
            name: "Anemometer 1",
            color: COLORS[0],
            points: [
              [5500, 25.0],
              [6220, 25.3],
              [6890, 24.8],
            ],
          },
        ],
      },
    ],
  },
  methodology_notes: [
    "Curves are drawn from a min/max envelope of the 30 Hz record (at most 2500 points per curve), keeping peaks and missing-data boundaries without smoothing or interpolation.",
    "Radiometers read about −17 to −18 mW/cm² when idle; values are shown directly as calibrated by NASA PSI-100.",
    "Cygnus channels arrive roughly every 6 s, each on its own row; rows where a channel is absent are skipped, never filled in.",
    "Cygnus FIZ 2 smoke-detector readings are detector output in volts (V) as labelled by the source, not a calibrated smoke concentration.",
    "The 1 Hz telemetry CSV uses its own clock (seconds from downlink start). The Saffire 30 Hz and Cygnus 1 Hz clocks differ by ~1 day in source timestamps, so sections 1–3 and section 4 keep separate time axes.",
  ],
  sources: [
    "Saffire III Sample 1 Sensors.xlsx and Sample 2 Sensors.xlsx, sheet “Calibrated Data” (30 Hz).",
    "Saffire_Data_Table2017.161.00.42.03-EU.csv (1 Hz telemetry); channel units from “Saffire-III 1 Hz Telemetry Data.xlsx”.",
    "Sample dimensions and mission sequence: SAFFIRE-III Operations.pdf. Pressure converted from psi (1 psi = 6.894757 kPa).",
    "NASA PSI-100 Investigation Repository: https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
  ],
};

export function getFixtureSpecialCasesList(): SpecialCasesListResponse {
  return {
    bespoke_notice: FIXTURE_BESPOKE_NOTICE,
    items: FIXTURE_SPECIAL_CASES,
    total: FIXTURE_SPECIAL_CASES.length,
  };
}

export function getFixtureSpecialCaseDetail(
  caseId: string,
): SaffireSpecialCasePayload | null {
  const norm = caseId.trim().toUpperCase();
  if (norm === "SAFFIRE-III" || norm === "SAFFIRE-III-S1") {
    return { ...FIXTURE_SAFFIRE_PAYLOAD, case_id: "SAFFIRE-III-S1", active_sample_number: 1 };
  }
  if (norm === "SAFFIRE-III-S2") {
    return { ...FIXTURE_SAFFIRE_PAYLOAD, case_id: "SAFFIRE-III-S2", active_sample_number: 2 };
  }
  return null;
}

export function generateFixtureSaffireAiSummary(
  caseId: string,
  focus: SaffireAiFocus,
  language: SaffireAiLanguage,
  customPrompt?: string | null,
): SaffireAiSummaryResponse {
  const sampleNumber = caseId.trim().toUpperCase() === "SAFFIRE-III-S2" ? 2 : 1;
  const canonical = sampleNumber === 2 ? "SAFFIRE-III-S2" : "SAFFIRE-III-S1";
  const promptNote =
    customPrompt && customPrompt.trim()
      ? language === "pl"
        ? ` Uwzględniono zapytanie: „${customPrompt.trim()}”.`
        : ` Addressed custom question: “${customPrompt.trim()}”.`
      : "";

  if (language === "en") {
    if (sampleNumber === 1) {
      return {
        case_id: canonical,
        sample_number: 1,
        focus,
        language,
        mode: "demo",
        summary: {
          headline:
            "Saffire-III Sample 1: 1088 °C Microgravity Burn & 23 s Cygnus Smoke Response",
          executive_summary: `30 Hz chamber telemetry and 1 Hz Cygnus downlink capture the 0.4 × 0.94 m Sample 1 burn reaching 1088 °C (TC11) and 169 mW/cm² (Radiometer 4) while O₂ dropped from 19.84% to 19.40%.${promptNote}`,
          key_findings: [
            "Peak surface temperature (1088 °C on TC11) occurred 247 s after ignition under 25 cm/s airflow.",
            "Ambient pressure rose +0.51 kPa from 99.4 kPa while CO₂ increased from 0.40% to 0.61%.",
            "Cygnus FIZ 2 scatterometer responded 23 s after the first smoke-wire pulse (0.025 V → peak 1.80 V).",
          ],
          spacecraft_telemetry_insight:
            "Downlinked 1 Hz telemetry links Sample 2 and Sample 1 igniter pulses with cabin smoke scatterometer FIZ 2 and EPS pressure shifts.",
          methodological_caveats: [
            "Thermocouple coordinates are omitted in the processed table, so section 2 shows arrival sequence rather than flame-spread speed.",
            "Saffire 30 Hz and Cygnus 1 Hz clocks keep separate time axes due to ~1 day source timestamp offset.",
          ],
        },
      };
    }
    return {
      case_id: canonical,
      sample_number: 2,
      focus,
      language,
      mode: "demo",
      summary: {
        headline:
          "Saffire-III Sample 2: 8.0 s Igniter Pulse & Plume Signature (≤ 20.0 °C Surface)",
        executive_summary: `Sample 2 spans 160 s at 30 Hz with igniter activation at t=60.0–68.0 s, raising plume TC3 to 48.4 °C while surface TCs stayed ≤ 20.0 °C.${promptNote}`,
        key_findings: [
          "Sample surface thermocouples TC7–TC12 did not reach 100 °C.",
          "Pre-ignition duct flow averaged 21 cm/s at 99.4 kPa and 19.88% O₂.",
        ],
        spacecraft_telemetry_insight:
          "Cygnus 1 Hz downlink places Sample 2 igniter activation (~195 s before Sample 1 ignition) alongside the full cabin telemetry timeline.",
        methodological_caveats: [
          "Sub-ignition thresholds (15 °C, 17 °C) are included alongside 100 °C because surface thermocouples stayed ≤ 20.0 °C.",
        ],
      },
    };
  }

  if (sampleNumber === 1) {
    return {
      case_id: canonical,
      sample_number: 1,
      focus,
      language,
      mode: "demo",
      summary: {
        headline:
          "Saffire-III Sample 1: Pożar do 1088 °C i reakcja detektora dymu Cygnus po 23 s",
        executive_summary: `Połączone dane 30 Hz z komory oraz 1 Hz ze statku Cygnus OA-7 rejestrują duży pożar próbki 0.4 × 0.94 m o szczycie 1088 °C (TC11) i 169 mW/cm² (Radiometr 4) przy spadku O₂ z 19.84% do 19.40%.${promptNote}`,
        key_findings: [
          "Maksimum temperatury powierzchni (1088 °C na TC11) wystąpiło 247 s po zapłonie przy przepływie 25 cm/s.",
          "Ciśnienie w komorze wzrosło o +0.51 kPa (od 99.4 kPa), a stężenie CO₂ wzrosło z 0.40% do 0.61%.",
          "Kabinowy detektor dymu FIZ 2 zareagował po 23 s od pierwszego impulsu drutu dymnego (0.025 V → szczyt 1.80 V).",
        ],
        spacecraft_telemetry_insight:
          "Telemetria 1 Hz statku Cygnus zestawia impulsy obu zapalników z krzywą rozpraszania dymu FIZ 2 oraz ciśnieniem kabinowym EPS.",
        methodological_caveats: [
          "Brak współrzędnych geometrycznych termopar TC7–TC12 — sekcja 2 pokazuje kolejność i czasy dotarcia, nie prędkość płomienia.",
          "Zegary 30 Hz (Saffire) i 1 Hz (Cygnus) zachowują odrębne osie czasu z uwagi na różnicę ~1 doby w danych źródłowych.",
        ],
      },
    };
  }

  return {
    case_id: canonical,
    sample_number: 2,
    focus,
    language,
    mode: "demo",
    summary: {
      headline:
        "Saffire-III Sample 2: Impuls zapalnika (8.0 s) i nagrzanie gazu do 48.4 °C bez dużego pożaru",
      executive_summary: `Zapis Sample 2 trwa 160 s (30 Hz) i dokumentuje impuls zapalnika t=60.0–68.0 s, który podniósł temperaturę w smudze gazu TC3 do 48.4 °C przy powierzchni próbki ≤ 20.0 °C.${promptNote}`,
      key_findings: [
        "Termopary powierzchniowe TC7–TC12 nie przekroczyły 20.0 °C (próg 100 °C nieosiągnięty).",
        "Przepływ w kanale przed zapłonem wynosił ok. 21 cm/s przy 99.4 kPa i 19.88% O₂.",
      ],
      spacecraft_telemetry_insight:
        "Telemetria 1 Hz statku Cygnus lokalizuje zapalnik Sample 2 (~195 s przed Sample 1) na wspólnej osi pojazdu.",
      methodological_caveats: [
        "Ponieważ powierzchnia próbki nie przekroczyła 20.0 °C, sekcja 2 prezentuje także progi podzapłonowe 15 °C i 17 °C obok 100 °C.",
      ],
    },
  };
}
