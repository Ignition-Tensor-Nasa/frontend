/** Curated 43-case NASA PSI fixture catalogue (29 ACME CFI-G + 14 CFI FLEX) aligned with backend/data_prep/manifest.json. */
import { matchesFilters, sanitizeFilters, validateFiltersAgainstOptions } from "./filters";
import type {
  CaseDetail,
  CaseNeighborItem,
  CaseNeighborsResponse,
  CaseResearchContext,
  CaseSummary,
  Dataset,
  DatasetData,
  FilterOptions,
  Filters,
  InterpretResponse,
  SearchResponse,
} from "./types";

const CFIG_RESEARCH_CONTEXT: CaseResearchContext = {
  tags: ["unknown"],
  rationale:
    "The documents shipped with PSI-159 (engineering implementation report, daily logs) describe hardware and operations; no statement tying CFI-G to fire prevention, detection or suppression was found in them.",
  evidence: [],
  disclaimer:
    "Research-context grouping only; it does not certify fire-safety performance of any material, atmosphere or system.",
};

const FLEX_RESEARCH_CONTEXT: CaseResearchContext = {
  tags: ["prevention"],
  rationale:
    "The source presents cool flames as a re-ignition hazard to understand, which is fire-prevention context. No detection or suppression claim is made for these runs.",
  evidence: [
    {
      document:
        "CFI_PSI-39/pdf/Cool Flames in Space, a Hot Prospect on Earth_CFI.pdf",
      page: 23,
      quote:
        "These cool flames produce partially oxidized fuel and potentially re-ignite to hot flames posing fire safety concerns in spacecraft environments",
    },
    {
      document:
        "CFI_PSI-39/pdf/Cool Flames in Space, a Hot Prospect on Earth_CFI.pdf",
      page: 3,
      quote:
        "Microgravity droplet combustion experiments aimed at understanding the flammability boundaries of liquid fuels in a variety of ambient conditions – spacecraft fire safety",
    },
  ],
  disclaimer:
    "Research-context grouping only; it does not certify fire-safety performance of any material, atmosphere or system.",
};

export const RESEARCH_CONTEXT_BY_INVESTIGATION: Record<
  string,
  CaseResearchContext
> = {
  "ACME CFI-G": CFIG_RESEARCH_CONTEXT,
  "CFI (FLEX)": FLEX_RESEARCH_CONTEXT,
};

const CFIG_SENSOR_COLUMNS: Dataset["columns"] = [
  { key: "time_s", label: "Elapsed time", data_type: "number", unit: "s" },
  {
    key: "Radiometer3+30LoGain",
    label: "Radiometer +30, low gain (raw)",
    data_type: "number",
    unit: null,
  },
  {
    key: "PMT1",
    label: "Photomultiplier PMT1 (raw)",
    data_type: "number",
    unit: null,
  },
  {
    key: "MFCA3FuelFlow",
    label: "MFC A3 fuel flow (raw)",
    data_type: "number",
    unit: null,
  },
  {
    key: "TCBurner",
    label: "Burner thermocouple (raw)",
    data_type: "number",
    unit: null,
  },
  {
    key: "IonCurrent",
    label: "Ion current (raw)",
    data_type: "number",
    unit: null,
  },
  {
    key: "PTA1",
    label: "Pressure transducer PTA1 (raw)",
    data_type: "number",
    unit: null,
  },
];

const CFIG_SETPOINT_COLUMNS: Dataset["columns"] = [
  { key: "time_s", label: "Elapsed time", data_type: "number", unit: "s" },
  { key: "MFCA1Setpoint(V)", label: "MFC A1 setpoint", data_type: "number", unit: "V" },
  { key: "MFCA2Setpoint(V)", label: "MFC A2 setpoint", data_type: "number", unit: "V" },
  { key: "MFCA3Setpoint(V)", label: "MFC A3 setpoint", data_type: "number", unit: "V" },
];

const FLEX_DROPLET_COLUMNS: Dataset["columns"] = [
  { key: "time_s", label: "Time (source time base)", data_type: "number", unit: "s" },
  { key: "DropletDiameter_mm", label: "Droplet diameter", data_type: "number", unit: "mm" },
];

const FLEX_COOLFLAME_COLUMNS: Dataset["columns"] = [
  { key: "time_s", label: "Time (source time base)", data_type: "number", unit: "s" },
  {
    key: "CoolFlameDiameterFWHM_mm",
    label: "Cool-flame diameter (FWHM)",
    data_type: "number",
    unit: "mm",
  },
  {
    key: "CoolFlameDiameterP2P_mm",
    label: "Cool-flame diameter (peak to peak)",
    data_type: "number",
    unit: "mm",
  },
];

const FLEX_RADIOMETER_COLUMNS: Dataset["columns"] = [
  { key: "time_s", label: "Time (source time base)", data_type: "number", unit: "s" },
  {
    key: "TotalWideBandPower_W",
    label: "Total wide-band power",
    data_type: "number",
    unit: "W",
  },
  {
    key: "TotalNarrowBandPower_W",
    label: "Total narrow-band power",
    data_type: "number",
    unit: "W",
  },
];

const FLEX_D2_FIT_COLUMNS: Dataset["columns"] = [
  { key: "time_s", label: "Time (source time base)", data_type: "number", unit: "s" },
  { key: "D2_mm2", label: "Droplet diameter squared", data_type: "number", unit: "mm²" },
  {
    key: "D2_fit_mm2",
    label: "Least-squares line (fit window only)",
    data_type: "number",
    unit: "mm²",
  },
];

function flexDatasets(testId: string, includeD2Fit = false): Dataset[] {
  const list: Dataset[] = [
    {
      dataset_id: `${testId}-droplet`,
      label: "Droplet diameter history",
      columns: FLEX_DROPLET_COLUMNS,
      default_x: "time_s",
      default_y: ["DropletDiameter_mm"],
    },
    {
      dataset_id: `${testId}-coolflame`,
      label: "Cool-flame diameter",
      columns: FLEX_COOLFLAME_COLUMNS,
      default_x: "time_s",
      default_y: ["CoolFlameDiameterFWHM_mm", "CoolFlameDiameterP2P_mm"],
    },
    {
      dataset_id: `${testId}-radiometer`,
      label: "Radiometer power",
      columns: FLEX_RADIOMETER_COLUMNS,
      default_x: "time_s",
      default_y: ["TotalNarrowBandPower_W"],
    },
  ];
  if (includeD2Fit) {
    list.push({
      dataset_id: `${testId}-d2-fit`,
      label: "D² history with linear fit (K = 0.417 mm²/s)",
      columns: FLEX_D2_FIT_COLUMNS,
      default_x: "time_s",
      default_y: ["D2_mm2", "D2_fit_mm2"],
    });
  }
  return list;
}

function cfigDatasets(caseId: string, includeSetpoints = true): Dataset[] {
  const list: Dataset[] = [
    {
      dataset_id: `${caseId}-sensors`,
      label: "Sensor recording (raw channels)",
      columns: CFIG_SENSOR_COLUMNS,
      default_x: "time_s",
      default_y: ["Radiometer3+30LoGain", "PMT1", "MFCA3FuelFlow"],
    },
  ];
  if (includeSetpoints) {
    list.push({
      dataset_id: `${caseId}-mfc-setpoints`,
      label: "MFC setpoints (commanded)",
      columns: CFIG_SETPOINT_COLUMNS,
      default_x: "time_s",
      default_y: ["MFCA1Setpoint(V)", "MFCA2Setpoint(V)", "MFCA3Setpoint(V)"],
    });
  }
  return list;
}

export const FIXTURE_CASE_DETAILS: Record<string, CaseDetail> = {
  "CFIG-21291C1": {
    case_id: "CFIG-21291C1",
    title: "CFI-G 21291C1: 30% butane, 39.4% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 39.423,
    pressure_kpa: 202.66,
    z_st: 0.202014347,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21291C1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21291C1_data.csv",
    source_url: null,
    note: "Demo highlight: the source table records 5 transitions from hot to cool flame in one run. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1 mg/s; hot ignition: Yes; burn time 246 s; ended by flow termination (FT); cool flame: yes, PCI-F. Source comment: “5 transitions from hot to cool, 6 hot and 5 cool flames”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈24 s; “MFCs off” at t≈271 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21291C1", true),
    events: [{"label": "Ignition and retraction", "time_s": 23.829, "dataset_id": "CFIG-21291C1-sensors", "source": "PSI-159_Raw Data_21291C1_TP.txt"}, {"label": "MFCs off", "time_s": 270.829, "dataset_id": "CFIG-21291C1-sensors", "source": "PSI-159_Raw Data_21291C1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 39.4% oxygen and about 203 kPa. It ignited, burned for 246 s and was ended by stopping the fuel flow. The table marks a cool flame in this run.", "origin": "template"},
  },
  "CFIG-21174C3": {
    case_id: "CFIG-21174C3",
    title: "CFI-G 21174C3: 30% butane, 39.5% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 39.537,
    pressure_kpa: 202.66,
    z_st: 0.202455226,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174C3: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174C3_data.csv",
    source_url: null,
    note: "Cool-flame run; compare with 21174C2, the hot-flame run just before it at nearly the same conditions. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: Yes; burn time 35 s; ended by self-extinction (SE); cool flame: yes, PCI-D. Source comment: “Cool flame!”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈23 s; “Extinction detected” at t≈70 s; “MFCs off” at t≈73 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174C3", true),
    events: [{"label": "Ignition and retraction", "time_s": 23.291, "dataset_id": "CFIG-21174C3-sensors", "source": "PSI-159_Raw Data_21174C3_TP.txt"}, {"label": "Extinction detected", "time_s": 70.291, "dataset_id": "CFIG-21174C3-sensors", "source": "PSI-159_Raw Data_21174C3_TP.txt"}, {"label": "MFCs off", "time_s": 73.291, "dataset_id": "CFIG-21174C3-sensors", "source": "PSI-159_Raw Data_21174C3_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 39.5% oxygen and about 203 kPa. It ignited, burned for 35 s and went out by itself. The table marks a cool flame in this run.", "origin": "template"},
  },
  "CFIG-21174C2": {
    case_id: "CFIG-21174C2",
    title: "CFI-G 21174C2: 30% butane, 39.7% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 39.655,
    pressure_kpa: 202.66,
    z_st: 0.202908798,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174C2: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174C2_data.csv",
    source_url: null,
    note: "Hot-flame counterpart of cool-flame run 21174C3. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 2 mg/s; hot ignition: Yes; burn time 29 s; ended by self-extinction (SE); cool flame: no, PCI-hot. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈23 s; “Extinction detected” at t≈64 s; “MFCs off” at t≈67 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174C2", true),
    events: [{"label": "Ignition and retraction", "time_s": 23.38, "dataset_id": "CFIG-21174C2-sensors", "source": "PSI-159_Raw Data_21174C2_TP.txt"}, {"label": "Extinction detected", "time_s": 64.38, "dataset_id": "CFIG-21174C2-sensors", "source": "PSI-159_Raw Data_21174C2_TP.txt"}, {"label": "MFCs off", "time_s": 67.38, "dataset_id": "CFIG-21174C2-sensors", "source": "PSI-159_Raw Data_21174C2_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 39.7% oxygen and about 203 kPa. It ignited, burned for 29 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21174C4": {
    case_id: "CFIG-21174C4",
    title: "CFI-G 21174C4: 30% butane, 39.4% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 39.431,
    pressure_kpa: 202.66,
    z_st: 0.202044348,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174C4: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174C4_data.csv",
    source_url: null,
    note: "Cool-flame run at a lower fuel flow than 21174C3. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1 mg/s; hot ignition: Yes; burn time 90 s; ended by self-extinction (SE); cool flame: yes, PCI-B. Source comment: “Cool flame!”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈23 s; “Extinction detected” at t≈125 s; “MFCs off” at t≈128 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174C4", true),
    events: [{"label": "Ignition and retraction", "time_s": 23.168, "dataset_id": "CFIG-21174C4-sensors", "source": "PSI-159_Raw Data_21174C4_TP.txt"}, {"label": "Extinction detected", "time_s": 125.168, "dataset_id": "CFIG-21174C4-sensors", "source": "PSI-159_Raw Data_21174C4_TP.txt"}, {"label": "MFCs off", "time_s": 128.168, "dataset_id": "CFIG-21174C4-sensors", "source": "PSI-159_Raw Data_21174C4_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 39.4% oxygen and about 203 kPa. It ignited, burned for 90 s and went out by itself. The table marks a cool flame in this run.", "origin": "template"},
  },
  "CFIG-21174D1": {
    case_id: "CFIG-21174D1",
    title: "CFI-G 21174D1: 30% butane, 39.2% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 39.249,
    pressure_kpa: 202.66,
    z_st: 0.201339463,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174D1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174D1_data.csv",
    source_url: null,
    note: "Cool-flame run at conditions close to 21174C4. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1 mg/s; hot ignition: Yes; burn time 83 s; ended by self-extinction (SE); cool flame: yes, PCI-C. Source comment: “Cool flame!”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈21 s; “Extinction detected” at t≈118 s; “MFCs off” at t≈121 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174D1", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.998, "dataset_id": "CFIG-21174D1-sensors", "source": "PSI-159_Raw Data_21174D1_TP.txt"}, {"label": "Extinction detected", "time_s": 117.998, "dataset_id": "CFIG-21174D1-sensors", "source": "PSI-159_Raw Data_21174D1_TP.txt"}, {"label": "MFCs off", "time_s": 120.998, "dataset_id": "CFIG-21174D1-sensors", "source": "PSI-159_Raw Data_21174D1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 39.2% oxygen and about 203 kPa. It ignited, burned for 83 s and went out by itself. The table marks a cool flame in this run.", "origin": "template"},
  },
  "CFIG-21174F1": {
    case_id: "CFIG-21174F1",
    title: "CFI-G 21174F1: 30% butane, 39.1% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 39.082,
    pressure_kpa: 202.66,
    z_st: 0.200688619,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174F1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174F1_data.csv",
    source_url: null,
    note: "Cool-flame run. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: Yes; burn time 40 s; ended by self-extinction (SE); cool flame: yes, PCI-E. Source comment: “Cool flame!”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈30 s; “Extinction detected” at t≈84 s; “MFCs off” at t≈87 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174F1", true),
    events: [{"label": "Ignition and retraction", "time_s": 30.009, "dataset_id": "CFIG-21174F1-sensors", "source": "PSI-159_Raw Data_21174F1_TP.txt"}, {"label": "Extinction detected", "time_s": 84.009, "dataset_id": "CFIG-21174F1-sensors", "source": "PSI-159_Raw Data_21174F1_TP.txt"}, {"label": "MFCs off", "time_s": 87.009, "dataset_id": "CFIG-21174F1-sensors", "source": "PSI-159_Raw Data_21174F1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 39.1% oxygen and about 203 kPa. It ignited, burned for 40 s and went out by itself. The table marks a cool flame in this run.", "origin": "template"},
  },
  "CFIG-21106F5": {
    case_id: "CFIG-21106F5",
    title: "CFI-G 21106F5: 50% butane, 35.3% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 35.294,
    pressure_kpa: 50.665,
    z_st: 0.1371645,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21106F5: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21106F5_data.csv",
    source_url: null,
    note: "Source comment reports a direct cool flame with no hot ignition. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 0.5 mg/s; hot ignition: No. Source comment: “direct cool - no hot ignition”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈32 s; “Extinction detected” at t≈67 s; “MFCs off” at t≈70 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21106F5", true),
    events: [{"label": "Ignition and retraction", "time_s": 32.455, "dataset_id": "CFIG-21106F5-sensors", "source": "PSI-159_Raw Data_21106F5_TP.txt"}, {"label": "Extinction detected", "time_s": 67.455, "dataset_id": "CFIG-21106F5-sensors", "source": "PSI-159_Raw Data_21106F5_TP.txt"}, {"label": "MFCs off", "time_s": 70.455, "dataset_id": "CFIG-21106F5-sensors", "source": "PSI-159_Raw Data_21106F5_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 50% butane in 35.3% oxygen and about 51 kPa. The source table records no hot ignition.", "origin": "template"},
  },
  "CFIG-21106F2": {
    case_id: "CFIG-21106F2",
    title: "CFI-G 21106F2: 50% butane, 35.4% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 35.424,
    pressure_kpa: 50.665,
    z_st: 0.137580333,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21106F2: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21106F2_data.csv",
    source_url: null,
    note: "Source comment reports a direct cool flame with no hot ignition. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 0.8 mg/s; hot ignition: No. Source comment: “direct cool - no hot ignition”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈33 s; “Extinction detected” at t≈68 s; “MFCs off” at t≈71 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21106F2", true),
    events: [{"label": "Ignition and retraction", "time_s": 32.663, "dataset_id": "CFIG-21106F2-sensors", "source": "PSI-159_Raw Data_21106F2_TP.txt"}, {"label": "Extinction detected", "time_s": 67.663, "dataset_id": "CFIG-21106F2-sensors", "source": "PSI-159_Raw Data_21106F2_TP.txt"}, {"label": "MFCs off", "time_s": 70.663, "dataset_id": "CFIG-21106F2-sensors", "source": "PSI-159_Raw Data_21106F2_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 50% butane in 35.4% oxygen and about 51 kPa. The source table records no hot ignition.", "origin": "template"},
  },
  "CFIG-21106G6": {
    case_id: "CFIG-21106G6",
    title: "CFI-G 21106G6: 50% butane, 21.0% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 20.97,
    pressure_kpa: 50.665,
    z_st: 0.087858915,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21106G6: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21106G6_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 0.8 mg/s; hot ignition: Yes; burn time 20 s; ended by self-extinction (SE). Source comment: “hot flame, the igniter stayed in the flame longer than others.”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈32 s; “Extinction detected” at t≈60 s; “MFCs off” at t≈63 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21106G6", true),
    events: [{"label": "Ignition and retraction", "time_s": 31.737, "dataset_id": "CFIG-21106G6-sensors", "source": "PSI-159_Raw Data_21106G6_TP.txt"}, {"label": "Extinction detected", "time_s": 59.737, "dataset_id": "CFIG-21106G6-sensors", "source": "PSI-159_Raw Data_21106G6_TP.txt"}, {"label": "MFCs off", "time_s": 62.737, "dataset_id": "CFIG-21106G6-sensors", "source": "PSI-159_Raw Data_21106G6_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 50% butane in 21.0% oxygen and about 51 kPa. It ignited, burned for 20 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21106H1": {
    case_id: "CFIG-21106H1",
    title: "CFI-G 21106H1: 50% butane, 20.7% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 20.669,
    pressure_kpa: 50.665,
    z_st: 0.086741882,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21106H1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21106H1_data.csv",
    source_url: null,
    note: "No hot ignition at about half an atmosphere and 20.7% O2; compare with 21106G6, which burned at 21.0%. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 0.8 mg/s; hot ignition: No. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈30 s; “Extinction detected” at t≈47 s; “MFCs off” at t≈50 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21106H1", true),
    events: [{"label": "Ignition and retraction", "time_s": 29.779, "dataset_id": "CFIG-21106H1-sensors", "source": "PSI-159_Raw Data_21106H1_TP.txt"}, {"label": "Extinction detected", "time_s": 46.779, "dataset_id": "CFIG-21106H1-sensors", "source": "PSI-159_Raw Data_21106H1_TP.txt"}, {"label": "MFCs off", "time_s": 49.779, "dataset_id": "CFIG-21106H1-sensors", "source": "PSI-159_Raw Data_21106H1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 50% butane in 20.7% oxygen and about 51 kPa. The source table records no hot ignition.", "origin": "template"},
  },
  "CFIG-21102M2": {
    case_id: "CFIG-21102M2",
    title: "CFI-G 21102M2: 50% butane, 23.4% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 23.365,
    pressure_kpa: 101.33,
    z_st: 0.096631781,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21102M2: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21102M2_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 0.8 mg/s; hot ignition: Yes; burn time 14 s; ended by self-extinction (SE). Source comment: “may have intensified images”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈21 s; “Extinction detected” at t≈40 s; “MFCs off” at t≈43 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21102M2", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.622, "dataset_id": "CFIG-21102M2-sensors", "source": "PSI-159_Raw Data_21102M2_TP.txt"}, {"label": "Extinction detected", "time_s": 39.622, "dataset_id": "CFIG-21102M2-sensors", "source": "PSI-159_Raw Data_21102M2_TP.txt"}, {"label": "MFCs off", "time_s": 42.622, "dataset_id": "CFIG-21102M2-sensors", "source": "PSI-159_Raw Data_21102M2_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 50% butane in 23.4% oxygen and about 101 kPa. It ignited, burned for 14 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21102C3": {
    case_id: "CFIG-21102C3",
    title: "CFI-G 21102C3: 50% butane, 38.6% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 38.622,
    pressure_kpa: 101.33,
    z_st: 0.147616047,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21102C3: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21102C3_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 1.2 mg/s; hot ignition: Yes; burn time 82 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈23 s; “Extinction detected” at t≈109 s; “MFCs off” at t≈112 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21102C3", true),
    events: [{"label": "Ignition and retraction", "time_s": 22.516, "dataset_id": "CFIG-21102C3-sensors", "source": "PSI-159_Raw Data_21102C3_TP.txt"}, {"label": "Extinction detected", "time_s": 108.516, "dataset_id": "CFIG-21102C3-sensors", "source": "PSI-159_Raw Data_21102C3_TP.txt"}, {"label": "MFCs off", "time_s": 111.516, "dataset_id": "CFIG-21102C3-sensors", "source": "PSI-159_Raw Data_21102C3_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 50% butane in 38.6% oxygen and about 101 kPa. It ignited, burned for 82 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21174F4": {
    case_id: "CFIG-21174F4",
    title: "CFI-G 21174F4: 30% butane, 38.4% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 38.406,
    pressure_kpa: 202.66,
    z_st: 0.198049053,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174F4: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174F4_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: Yes; burn time 35 s; ended by flow termination (FT). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈32 s; “MFCs off” at t≈76 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174F4", true),
    events: [{"label": "Ignition and retraction", "time_s": 32.282, "dataset_id": "CFIG-21174F4-sensors", "source": "PSI-159_Raw Data_21174F4_TP.txt"}, {"label": "MFCs off", "time_s": 76.282, "dataset_id": "CFIG-21174F4-sensors", "source": "PSI-159_Raw Data_21174F4_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 38.4% oxygen and about 203 kPa. It ignited, burned for 35 s and was ended by stopping the fuel flow.", "origin": "template"},
  },
  "CFIG-21174A3": {
    case_id: "CFIG-21174A3",
    title: "CFI-G 21174A3: 30% butane, 37.9% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 37.852,
    pressure_kpa: 50.665,
    z_st: 0.195871271,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21174A3: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21174A3_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: Yes; burn time 54 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈20 s; “Extinction detected” at t≈86 s; “MFCs off” at t≈89 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21174A3", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.227, "dataset_id": "CFIG-21174A3-sensors", "source": "PSI-159_Raw Data_21174A3_TP.txt"}, {"label": "Extinction detected", "time_s": 86.227, "dataset_id": "CFIG-21174A3-sensors", "source": "PSI-159_Raw Data_21174A3_TP.txt"}, {"label": "MFCs off", "time_s": 89.227, "dataset_id": "CFIG-21174A3-sensors", "source": "PSI-159_Raw Data_21174A3_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 37.9% oxygen and about 51 kPa. It ignited, burned for 54 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21291J1": {
    case_id: "CFIG-21291J1",
    title: "CFI-G 21291J1: 30% butane, 38.5% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "butane",
    o2_pct: 38.544,
    pressure_kpa: 101.33,
    z_st: 0.303225617,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21291J1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21291J1_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.15; fuel flow 0.75 mg/s; hot ignition: Yes; burn time 80 s; ended by flow termination (FT). Source comment: “Hit the burner temperature limit”. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈32 s; “MFCs off” at t≈113 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21291J1", true),
    events: [{"label": "Ignition and retraction", "time_s": 31.979, "dataset_id": "CFIG-21291J1-sensors", "source": "PSI-159_Raw Data_21291J1_TP.txt"}, {"label": "MFCs off", "time_s": 112.979, "dataset_id": "CFIG-21291J1-sensors", "source": "PSI-159_Raw Data_21291J1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% butane in 38.5% oxygen and about 101 kPa. It ignited, burned for 80 s and was ended by stopping the fuel flow.", "origin": "template"},
  },
  "CFIG-21153A4": {
    case_id: "CFIG-21153A4",
    title: "CFI-G 21153A4: 30% ethane, 33.5% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 33.493,
    pressure_kpa: 50.665,
    z_st: 0.237329338,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21153A4: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21153A4_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 0.5 mg/s; hot ignition: Yes; burn time 56 s; ended by flow termination (FT). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈20 s; “MFCs off” at t≈78 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21153A4", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.141, "dataset_id": "CFIG-21153A4-sensors", "source": "PSI-159_Raw Data_21153A4_TP.txt"}, {"label": "MFCs off", "time_s": 78.141, "dataset_id": "CFIG-21153A4-sensors", "source": "PSI-159_Raw Data_21153A4_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% ethane in 33.5% oxygen and about 51 kPa. It ignited, burned for 56 s and was ended by stopping the fuel flow.", "origin": "template"},
  },
  "CFIG-21153A2": {
    case_id: "CFIG-21153A2",
    title: "CFI-G 21153A2: 30% ethane, 37.6% O₂, 51 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 37.59,
    pressure_kpa: 50.665,
    z_st: 0.257781029,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21153A2: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21153A2_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: Yes; burn time 88 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈24 s; “Extinction detected” at t≈127 s; “MFCs off” at t≈130 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21153A2", true),
    events: [{"label": "Ignition and retraction", "time_s": 23.614, "dataset_id": "CFIG-21153A2-sensors", "source": "PSI-159_Raw Data_21153A2_TP.txt"}, {"label": "Extinction detected", "time_s": 126.614, "dataset_id": "CFIG-21153A2-sensors", "source": "PSI-159_Raw Data_21153A2_TP.txt"}, {"label": "MFCs off", "time_s": 129.614, "dataset_id": "CFIG-21153A2-sensors", "source": "PSI-159_Raw Data_21153A2_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% ethane in 37.6% oxygen and about 51 kPa. It ignited, burned for 88 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21153C7": {
    case_id: "CFIG-21153C7",
    title: "CFI-G 21153C7: 30% ethane, 38.2% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 38.206,
    pressure_kpa: 202.66,
    z_st: 0.260743429,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21153C7: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21153C7_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1 mg/s; hot ignition: Yes; burn time 61 s; ended by flow termination (FT). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈22 s; “MFCs off” at t≈84 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21153C7", true),
    events: [{"label": "Ignition and retraction", "time_s": 21.788, "dataset_id": "CFIG-21153C7-sensors", "source": "PSI-159_Raw Data_21153C7_TP.txt"}, {"label": "MFCs off", "time_s": 83.788, "dataset_id": "CFIG-21153C7-sensors", "source": "PSI-159_Raw Data_21153C7_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% ethane in 38.2% oxygen and about 203 kPa. It ignited, burned for 61 s and was ended by stopping the fuel flow.", "origin": "template"},
  },
  "CFIG-21088P1": {
    case_id: "CFIG-21088P1",
    title: "CFI-G 21088P1: ethane, 18.0% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 17.969,
    pressure_kpa: 101.33,
    z_st: 0.09403323,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21088P1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21088P1_data.csv",
    source_url: null,
    note: "Lowest-oxygen run in this selection that still ignited (18% O2). Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 1 mg/s; hot ignition: Yes; burn time 8 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈34 s; “Extinction detected” at t≈50 s; “MFCs off” at t≈53 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21088P1", true),
    events: [{"label": "Ignition and retraction", "time_s": 33.683, "dataset_id": "CFIG-21088P1-sensors", "source": "PSI-159_Raw Data_21088P1_TP.txt"}, {"label": "Extinction detected", "time_s": 49.683, "dataset_id": "CFIG-21088P1-sensors", "source": "PSI-159_Raw Data_21088P1_TP.txt"}, {"label": "MFCs off", "time_s": 52.683, "dataset_id": "CFIG-21088P1-sensors", "source": "PSI-159_Raw Data_21088P1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with ethane in 18.0% oxygen and about 101 kPa. It ignited, burned for 8 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21088H1": {
    case_id: "CFIG-21088H1",
    title: "CFI-G 21088H1: ethane, 37.6% O₂, 94 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 37.614,
    pressure_kpa: 94.44,
    z_st: 0.174581055,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21088H1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21088H1_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.5; fuel flow 1 mg/s; hot ignition: Yes; burn time 62 s; ended by flow termination (FT). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈44 s; “MFCs off” at t≈107 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21088H1", true),
    events: [{"label": "Ignition and retraction", "time_s": 43.739, "dataset_id": "CFIG-21088H1-sensors", "source": "PSI-159_Raw Data_21088H1_TP.txt"}, {"label": "MFCs off", "time_s": 106.739, "dataset_id": "CFIG-21088H1-sensors", "source": "PSI-159_Raw Data_21088H1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with ethane in 37.6% oxygen and about 94 kPa. It ignited, burned for 62 s and was ended by stopping the fuel flow.", "origin": "template"},
  },
  "CFIG-21162C1": {
    case_id: "CFIG-21162C1",
    title: "CFI-G 21162C1: 30% ethane, 21.0% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 21.0,
    pressure_kpa: 101.33,
    z_st: 0.165606435,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21162C1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21162C1_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 0.5 mg/s; hot ignition: Yes; burn time 19 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Extinction detected” at t≈55 s; “MFCs off” at t≈58 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21162C1", true),
    events: [{"label": "Extinction detected", "time_s": 55.325, "dataset_id": "CFIG-21162C1-sensors", "source": "PSI-159_Raw Data_21162C1_TP.txt"}, {"label": "MFCs off", "time_s": 58.325, "dataset_id": "CFIG-21162C1-sensors", "source": "PSI-159_Raw Data_21162C1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% ethane in 21.0% oxygen and about 101 kPa. It ignited, burned for 19 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21162F1": {
    case_id: "CFIG-21162F1",
    title: "CFI-G 21162F1: 30% ethane, 20.7% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 20.722,
    pressure_kpa: 101.33,
    z_st: 0.163826567,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21162F1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21162F1_data.csv",
    source_url: null,
    note: "No ignition at 20.7% O2; compare with 21162C1, which burned at 21.0% with a lower fuel flow. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: No. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈33 s; “Extinction detected” at t≈57 s; “MFCs off” at t≈60 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21162F1", true),
    events: [{"label": "Ignition and retraction", "time_s": 33.202, "dataset_id": "CFIG-21162F1-sensors", "source": "PSI-159_Raw Data_21162F1_TP.txt"}, {"label": "Extinction detected", "time_s": 57.202, "dataset_id": "CFIG-21162F1-sensors", "source": "PSI-159_Raw Data_21162F1_TP.txt"}, {"label": "MFCs off", "time_s": 60.202, "dataset_id": "CFIG-21162F1-sensors", "source": "PSI-159_Raw Data_21162F1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% ethane in 20.7% oxygen and about 101 kPa. The source table records no hot ignition.", "origin": "template"},
  },
  "CFIG-21162A2": {
    case_id: "CFIG-21162A2",
    title: "CFI-G 21162A2: 30% ethane, 39.5% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "ethane",
    o2_pct: 39.497,
    pressure_kpa: 101.33,
    z_st: 0.266857037,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21162A2: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21162A2_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.5 mg/s; hot ignition: Yes; burn time 71 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈24 s; “Extinction detected” at t≈106 s; “MFCs off” at t≈109 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21162A2", true),
    events: [{"label": "Ignition and retraction", "time_s": 23.741, "dataset_id": "CFIG-21162A2-sensors", "source": "PSI-159_Raw Data_21162A2_TP.txt"}, {"label": "Extinction detected", "time_s": 105.741, "dataset_id": "CFIG-21162A2-sensors", "source": "PSI-159_Raw Data_21162A2_TP.txt"}, {"label": "MFCs off", "time_s": 108.741, "dataset_id": "CFIG-21162A2-sensors", "source": "PSI-159_Raw Data_21162A2_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% ethane in 39.5% oxygen and about 101 kPa. It ignited, burned for 71 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21112A3": {
    case_id: "CFIG-21112A3",
    title: "CFI-G 21112A3: propane, 39.1% O₂, 94 kPa",
    investigation: "ACME CFI-G",
    fuel: "propane",
    o2_pct: 39.127,
    pressure_kpa: 94.44,
    z_st: 0.104501512,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21112A3: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21112A3_data.csv",
    source_url: null,
    note: "Longest undiluted-propane flame in this selection. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=1; fuel flow 1.2 mg/s; hot ignition: Yes; burn time 95 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈21 s; “Extinction detected” at t≈123 s; “MFCs off” at t≈126 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21112A3", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.936, "dataset_id": "CFIG-21112A3-sensors", "source": "PSI-159_Raw Data_21112A3_TP.txt"}, {"label": "Extinction detected", "time_s": 122.936, "dataset_id": "CFIG-21112A3-sensors", "source": "PSI-159_Raw Data_21112A3_TP.txt"}, {"label": "MFCs off", "time_s": 125.936, "dataset_id": "CFIG-21112A3-sensors", "source": "PSI-159_Raw Data_21112A3_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with propane in 39.1% oxygen and about 94 kPa. It ignited, burned for 95 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21112H1": {
    case_id: "CFIG-21112H1",
    title: "CFI-G 21112H1: propane, 21.2% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "propane",
    o2_pct: 21.18,
    pressure_kpa: 101.33,
    z_st: 0.060798229,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21112H1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21112H1_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=1; fuel flow 0.5 mg/s; hot ignition: Yes; burn time 12 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈30 s; “Extinction detected” at t≈53 s; “MFCs off” at t≈56 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21112H1", true),
    events: [{"label": "Ignition and retraction", "time_s": 29.849, "dataset_id": "CFIG-21112H1-sensors", "source": "PSI-159_Raw Data_21112H1_TP.txt"}, {"label": "Extinction detected", "time_s": 52.849, "dataset_id": "CFIG-21112H1-sensors", "source": "PSI-159_Raw Data_21112H1_TP.txt"}, {"label": "MFCs off", "time_s": 55.849, "dataset_id": "CFIG-21112H1-sensors", "source": "PSI-159_Raw Data_21112H1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with propane in 21.2% oxygen and about 101 kPa. It ignited, burned for 12 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21112H3": {
    case_id: "CFIG-21112H3",
    title: "CFI-G 21112H3: propane, 21.1% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "propane",
    o2_pct: 21.14,
    pressure_kpa: 101.33,
    z_st: 0.060694682,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21112H3: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21112H3_data.csv",
    source_url: null,
    note: "No ignition; compare with 21112H1 at nearly the same atmosphere. Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=1; fuel flow 0.5 mg/s; hot ignition: No. Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈32 s; “Extinction detected” at t≈48 s; “MFCs off” at t≈51 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21112H3", true),
    events: [{"label": "Ignition and retraction", "time_s": 32.396, "dataset_id": "CFIG-21112H3-sensors", "source": "PSI-159_Raw Data_21112H3_TP.txt"}, {"label": "Extinction detected", "time_s": 48.396, "dataset_id": "CFIG-21112H3-sensors", "source": "PSI-159_Raw Data_21112H3_TP.txt"}, {"label": "MFCs off", "time_s": 51.396, "dataset_id": "CFIG-21112H3-sensors", "source": "PSI-159_Raw Data_21112H3_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with propane in 21.1% oxygen and about 101 kPa. The source table records no hot ignition.", "origin": "template"},
  },
  "CFIG-21137A5": {
    case_id: "CFIG-21137A5",
    title: "CFI-G 21137A5: 30% propane, 35.6% O₂, 101 kPa",
    investigation: "ACME CFI-G",
    fuel: "propane",
    o2_pct: 35.568,
    pressure_kpa: 101.33,
    z_st: 0.209226104,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21137A5: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21137A5_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1.1 mg/s; hot ignition: Yes; burn time 44 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈21 s; “Extinction detected” at t≈78 s; “MFCs off” at t≈81 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21137A5", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.601, "dataset_id": "CFIG-21137A5-sensors", "source": "PSI-159_Raw Data_21137A5_TP.txt"}, {"label": "Extinction detected", "time_s": 77.601, "dataset_id": "CFIG-21137A5-sensors", "source": "PSI-159_Raw Data_21137A5_TP.txt"}, {"label": "MFCs off", "time_s": 80.601, "dataset_id": "CFIG-21137A5-sensors", "source": "PSI-159_Raw Data_21137A5_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% propane in 35.6% oxygen and about 101 kPa. It ignited, burned for 44 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21130M2": {
    case_id: "CFIG-21130M2",
    title: "CFI-G 21130M2: 30% propane, 21.1% O₂, 203 kPa",
    investigation: "ACME CFI-G",
    fuel: "propane",
    o2_pct: 21.05,
    pressure_kpa: 202.66,
    z_st: 0.137728991,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21130M2: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21130M2_data.csv",
    source_url: null,
    note: "Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 2 mg/s; hot ignition: Yes; burn time 7 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈22 s; “Extinction detected” at t≈41 s; “MFCs off” at t≈44 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21130M2", true),
    events: [{"label": "Ignition and retraction", "time_s": 21.664, "dataset_id": "CFIG-21130M2-sensors", "source": "PSI-159_Raw Data_21130M2_TP.txt"}, {"label": "Extinction detected", "time_s": 40.664, "dataset_id": "CFIG-21130M2-sensors", "source": "PSI-159_Raw Data_21130M2_TP.txt"}, {"label": "MFCs off", "time_s": 43.664, "dataset_id": "CFIG-21130M2-sensors", "source": "PSI-159_Raw Data_21130M2_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% propane in 21.1% oxygen and about 203 kPa. It ignited, burned for 7 s and went out by itself.", "origin": "template"},
  },
  "CFIG-21130N1": {
    case_id: "CFIG-21130N1",
    title: "CFI-G 21130N1: 30% propane, 21.7% O₂, 304 kPa",
    investigation: "ACME CFI-G",
    fuel: "propane",
    o2_pct: 21.666,
    pressure_kpa: 303.99,
    z_st: 0.141086088,
    source_label: "NASA PSI-159 ACME CFI-G, test point 21130N1: PSI-159_Experimental table_CFI-G_Normal Flames.csv; PSI-159_Raw Data_21130N1_data.csv",
    source_url: null,
    note: "Highest-pressure run in this selection (about 3 atm). Source table: Flame type: Normal; fuel mole fraction in the burner stream Xf=0.3; fuel flow 1 mg/s; hot ignition: Yes; burn time 6 s; ended by self-extinction (SE). Test-point script log entries (1 s resolution): “Ignition and retraction” at t≈21 s; “Extinction detected” at t≈37 s; “MFCs off” at t≈40 s. O₂ is the chamber mole fraction before the test; pressure is the table's approximate value converted from bar. Sensor channels are the full raw recording (documented rate 125 Hz); their units are not stated in the source files, so they are shown unconverted.",
    datasets: cfigDatasets("CFIG-21130N1", true),
    events: [{"label": "Ignition and retraction", "time_s": 20.909, "dataset_id": "CFIG-21130N1-sensors", "source": "PSI-159_Raw Data_21130N1_TP.txt"}, {"label": "Extinction detected", "time_s": 36.909, "dataset_id": "CFIG-21130N1-sensors", "source": "PSI-159_Raw Data_21130N1_TP.txt"}, {"label": "MFCs off", "time_s": 39.909, "dataset_id": "CFIG-21130N1-sensors", "source": "PSI-159_Raw Data_21130N1_TP.txt"}],
    research_context: CFIG_RESEARCH_CONTEXT,
    explanation: {"text": "Gas flame test with 30% propane in 21.7% oxygen and about 304 kPa. It ignited, burned for 6 s and went out by itself.", "origin": "template"},
  },
  "FLEX-1213": {
    case_id: "FLEX-1213",
    title: "CFI FLEX-1213: dodecane droplet, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: null,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1213 (CIR F086A04): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1213_Summary.pdf; FLEX-1213_*Data.txt",
    source_url: null,
    note: "Sources disagree on oxygen for this test (Master Sheet 0.17, summary PDF 0.210). Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.17, N₂ 0.83, He 0 (fractions); CIR run F086A04. Summary PDF: P = 772.131 mmHg (102.9 kPa), YO2 = 0.21, D0 = 4.189 mm, kavg = 0.189 mm²/s. The two sources disagree on oxygen, so the O₂ filter value is left unknown. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1213", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.189 mm in the source summary) burned on the ISS at a nominal 1 atm. The source summary gives an average burning-rate constant of 0.189 mm²/s.", "origin": "template"},
  },
  "FLEX-1218": {
    case_id: "FLEX-1218",
    title: "CFI FLEX-1218: dodecane droplet, 21.0% O₂, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1218 (CIR F090A03): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1218_Summary.pdf; FLEX-1218_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F090A03. Summary PDF: P = 769.923 mmHg (102.6 kPa), YO2 = 0.21, D0 = 4.283 mm, kavg = 0.371 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1218", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.283 mm in the source summary) burned on the ISS at a nominal 1 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.371 mm²/s.", "origin": "template"},
  },
  "FLEX-1221": {
    case_id: "FLEX-1221",
    title: "CFI FLEX-1221: dodecane droplet, 21.0% O₂, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1221 (CIR F090A06): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1221_Summary.pdf; FLEX-1221_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.21, N₂ 0.76, He 0 (fractions); CIR run F090A06. Summary PDF: P = 771.672 mmHg (102.9 kPa), YO2 = 0.208, D0 = 4.346 mm, kavg = 0.341 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1221", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.346 mm in the source summary) burned on the ISS at a nominal 1 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.341 mm²/s.", "origin": "template"},
  },
  "FLEX-1223": {
    case_id: "FLEX-1223",
    title: "CFI FLEX-1223: dodecane droplet, 21.0% O₂, 127 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 126.656,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1223 (CIR F090A08): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1223_Summary.pdf; FLEX-1223_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 1.25 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F090A08. Summary PDF: P = 946.618 mmHg (126.2 kPa), YO2 = 0.21, D0 = 4.04 mm, kavg = 0.388 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1223", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.04 mm in the source summary) burned on the ISS at a nominal 1.25 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.388 mm²/s.", "origin": "template"},
  },
  "FLEX-1226": {
    case_id: "FLEX-1226",
    title: "CFI FLEX-1226: dodecane droplet, 21.0% O₂, 127 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 126.656,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1226 (CIR F090A11): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1226_Summary.pdf; FLEX-1226_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 1.25 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F090A11. Summary PDF: P = 947.233 mmHg (126.3 kPa), YO2 = 0.21, D0 = 4.073 mm, kavg = 0.427 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1226", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.073 mm in the source summary) burned on the ISS at a nominal 1.25 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.427 mm²/s.", "origin": "template"},
  },
  "FLEX-1231": {
    case_id: "FLEX-1231",
    title: "CFI FLEX-1231: dodecane droplet, 17.0% O₂, 304 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 17.0,
    pressure_kpa: 303.975,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1231 (CIR F095A06): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1231_Summary.pdf; FLEX-1231_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 3 atm, O₂ 0.17, N₂ 0.83, He 0 (fractions); CIR run F095A06. Summary PDF: P = 2256.819 mmHg (300.9 kPa), YO2 = 0.17, D0 = 4.141 mm, kavg = 0.49 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1231", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.141 mm in the source summary) burned on the ISS at a nominal 3 atm with 17% oxygen. The source summary gives an average burning-rate constant of 0.49 mm²/s.", "origin": "template"},
  },
  "FLEX-1232": {
    case_id: "FLEX-1232",
    title: "CFI FLEX-1232: dodecane droplet, 17.0% O₂, 304 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 17.0,
    pressure_kpa: 303.975,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1232 (CIR F095A09): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1232_Summary.pdf; FLEX-1232_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 3 atm, O₂ 0.17, N₂ 0.83, He 0 (fractions); CIR run F095A09. Summary PDF: P = 2257.447 mmHg (301.0 kPa), YO2 = 0.17, D0 = 4.337 mm, kavg = 0.324 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1232", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.337 mm in the source summary) burned on the ISS at a nominal 3 atm with 17% oxygen. The source summary gives an average burning-rate constant of 0.324 mm²/s.", "origin": "template"},
  },
  "FLEX-1238": {
    case_id: "FLEX-1238",
    title: "CFI FLEX-1238: dodecane droplet, 21.0% O₂, 51 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 50.663,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1238 (CIR F121A05): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1238_Summary.pdf; FLEX-1238_*Data.txt",
    source_url: null,
    note: "Half-atmosphere droplet test. Master Sheet: fuel C12H26, pressure .5 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F121A05. Summary PDF: P = 387.279 mmHg (51.6 kPa), YO2 = 0.21, D0 = 4.463 mm, kavg = 0.369 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1238", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.463 mm in the source summary) burned on the ISS at a nominal .5 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.369 mm²/s.", "origin": "template"},
  },
  "FLEX-1240": {
    case_id: "FLEX-1240",
    title: "CFI FLEX-1240: dodecane droplet, 21.0% O₂, 51 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 50.663,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1240 (CIR F121A07): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1240_Summary.pdf; FLEX-1240_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure .5 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F121A07. Summary PDF: P = 387.496 mmHg (51.7 kPa), YO2 = 0.21, D0 = 4.081 mm, kavg = 0.351 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1240", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.081 mm in the source summary) burned on the ISS at a nominal .5 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.351 mm²/s.", "origin": "template"},
  },
  "FLEX-1249": {
    case_id: "FLEX-1249",
    title: "CFI FLEX-1249: dodecane droplet, 21.0% O₂, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1249 (CIR F125A02): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1249_Summary.pdf; FLEX-1249_*Data.txt",
    source_url: null,
    note: "Clean D²-law example: droplet diameter squared falls almost linearly with time (see the D² fit dataset). Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F125A02. Summary PDF: P = 767.799 mmHg (102.4 kPa), YO2 = 0.21, D0 = 4.127 mm, kavg = 0.426 mm²/s. D² fit made for this project (not a NASA value): least-squares line of D² against time over 4-36 s (hand-chosen linear part, 960 samples) gives K = 0.417 mm²/s, R² = 0.9998. The summary PDF's kavg = 0.426 mm²/s is computed by the source with a method that is not documented in the files used here. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1249", true),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.127 mm in the source summary) burned on the ISS at a nominal 1 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.426 mm²/s.", "origin": "template"},
  },
  "FLEX-1250": {
    case_id: "FLEX-1250",
    title: "CFI FLEX-1250: dodecane droplet, 21.0% O₂, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1250 (CIR F125A03): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1250_Summary.pdf; FLEX-1250_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F125A03. Summary PDF: P = 768.492 mmHg (102.5 kPa), YO2 = 0.209, D0 = 4.042 mm, kavg = 0.383 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1250", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.042 mm in the source summary) burned on the ISS at a nominal 1 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.383 mm²/s.", "origin": "template"},
  },
  "FLEX-1253": {
    case_id: "FLEX-1253",
    title: "CFI FLEX-1253: dodecane droplet, 21.0% O₂, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1253 (CIR F125A07): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1253_Summary.pdf; FLEX-1253_*Data.txt",
    source_url: null,
    note: "Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F125A07. Summary PDF: P = 770.261 mmHg (102.7 kPa), YO2 = 0.208, D0 = 4.282 mm, kavg = 0.47 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1253", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.282 mm in the source summary) burned on the ISS at a nominal 1 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.47 mm²/s.", "origin": "template"},
  },
  "FLEX-1261": {
    case_id: "FLEX-1261",
    title: "CFI FLEX-1261: dodecane droplet, 21.0% O₂, 507 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 506.625,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1261 (CIR F135A05): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1261_Summary.pdf; FLEX-1261_*Data.txt",
    source_url: null,
    note: "Highest-pressure droplet test in this selection (5 atm). Master Sheet: fuel C12H26, pressure 5 atm, O₂ 0.21, N₂ 0.79, He 0 (fractions); CIR run F135A05. Summary PDF: P = 3777.606 mmHg (503.6 kPa), YO2 = 0.21, D0 = 5.646 mm, kavg = 0.618 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1261", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 5.646 mm in the source summary) burned on the ISS at a nominal 5 atm with 21% oxygen. The source summary gives an average burning-rate constant of 0.618 mm²/s.", "origin": "template"},
  },
  "FLEX-1264": {
    case_id: "FLEX-1264",
    title: "CFI FLEX-1264: dodecane droplet, 21.0% O₂, 101 kPa",
    investigation: "CFI (FLEX)",
    fuel: "dodecane",
    o2_pct: 21.0,
    pressure_kpa: 101.325,
    z_st: null,
    source_label: "NASA PSI-39 CFI, FLEX-1264 (CIR F139A02): CFI_DataSummary_Spreadsheet_Jan2021.xlsx; FLEX-1264_Summary.pdf; FLEX-1264_*Data.txt",
    source_url: null,
    note: "Helium-diluted atmosphere: the Master Sheet lists 29% He. Master Sheet: fuel C12H26, pressure 1 atm, O₂ 0.21, N₂ 0.5, He 0.29 (fractions); CIR run F139A02. Summary PDF: P = 763.248 mmHg (101.8 kPa), YO2 = 0.21, D0 = 4.217 mm, kavg = 0.426 mm²/s. The pressure filter uses the Master Sheet's nominal value converted from atm. Each dataset keeps its own source time column; the source does not document how the time bases are synchronised. The wide-band radiometer values are large and negative in the source file and are shown as provided.",
    datasets: flexDatasets("FLEX-1264", false),
    events: [],
    research_context: FLEX_RESEARCH_CONTEXT,
    explanation: {"text": "A single dodecane droplet (D0 = 4.217 mm in the source summary) burned on the ISS at a nominal 1 atm with 21% oxygen and 29% helium. The source summary gives an average burning-rate constant of 0.426 mm²/s.", "origin": "template"},
  },
};

export const FIXTURE_CASES: CaseSummary[] = Object.values(FIXTURE_CASE_DETAILS)
  .map(({ case_id, title, investigation, fuel, o2_pct, pressure_kpa, z_st }) => ({
    case_id,
    title,
    investigation,
    fuel,
    o2_pct,
    pressure_kpa,
    z_st: z_st ?? null,
  }))
  .sort((a, b) => a.case_id.localeCompare(b.case_id));

export const FIXTURE_FILTER_OPTIONS: FilterOptions = (() => {
  const investigations = Array.from(
    new Set(FIXTURE_CASES.map((c) => c.investigation)),
  ).sort();
  const fuels = Array.from(
    new Set(FIXTURE_CASES.map((c) => c.fuel).filter((f): f is string => f !== null)),
  ).sort();
  const o2Values = FIXTURE_CASES.map((c) => c.o2_pct).filter(
    (v): v is number => v !== null,
  );
  const pValues = FIXTURE_CASES.map((c) => c.pressure_kpa).filter(
    (v): v is number => v !== null,
  );
  const zValues = FIXTURE_CASES.map((c) => c.z_st).filter(
    (v): v is number => v !== null && v !== undefined,
  );
  return {
    investigation: investigations,
    fuel: fuels,
    o2_pct: o2Values.length
      ? { min: Math.min(...o2Values), max: Math.max(...o2Values) }
      : null,
    pressure_kpa: pValues.length
      ? { min: Math.min(...pValues), max: Math.max(...pValues) }
      : null,
    z_st: zValues.length
      ? { min: Math.min(...zValues), max: Math.max(...zValues) }
      : null,
  };
})();

const ROWS_21291C1: (number | null)[][] = [
  [0.0, -0.0266, 4.4993, -0.0051, 0.0001, -0.8937, 0.5057],
  [7.072, -0.0263, 4.5, -0.0017, 0.0001, -0.8947, 0.5058],
  [14.144, -0.0271, 4.4995, 0.003, 0.0001, -0.8928, 0.5056],
  [21.216, -0.0271, 4.499, 0.011, 0.0001, -0.8784, 0.5059],
  [28.288, 0.3465, 1.8938, 1.5249, 0.0042, 0.5508, 0.507],
  [35.36, 0.7779, 1.8738, 1.53, 0.0073, 0.5606, 0.5066],
  [42.432, 0.887, 1.7715, 1.5355, 0.0093, 0.5481, 0.5062],
  [49.504, 0.939, 1.658, 1.5363, 0.011, 0.5487, 0.5063],
  [56.576, 0.973, 1.5829, 1.5356, 0.0123, 0.5494, 0.5063],
  [63.648, 1.002, 1.5302, 1.5384, 0.0134, 0.5479, 0.5064],
  [70.72, 1.0266, 1.3707, 1.5298, 0.0142, 0.5483, 0.506],
  [77.792, 1.0431, 1.2096, 1.53, 0.0148, 0.5497, 0.5066],
  [84.864, 1.0549, 1.2131, 1.5326, 0.0152, 0.5465, 0.5066],
  [91.936, 1.0216, 0.8973, 1.531, 0.0155, 0.5468, 0.5069],
  [99.008, 1.0632, 0.7451, 1.5352, 0.0157, 0.5375, 0.5066],
  [106.08, 1.0315, 0.4757, 1.5329, 0.0158, 0.551, 0.5069],
  [113.152, 0.722, 0.5039, 1.5377, 0.0158, 0.5548, 0.5073],
  [120.224, 0.3211, -0.0003, 1.5361, 0.0153, 0.5523, 0.5065],
  [127.296, 1.074, 1.4692, 1.5325, 0.0159, 0.5532, 0.5063],
  [134.368, 1.0857, 1.1872, 1.5354, 0.0162, 0.5508, 0.5066],
  [141.44, 1.0911, 0.9034, 1.5328, 0.0164, 0.5431, 0.5063],
  [148.512, 0.9693, 0.3164, 1.5329, 0.0164, 0.5474, 0.5066],
  [155.584, 0.3409, -0.0004, 1.5294, 0.0159, 0.5471, 0.5063],
  [162.656, 1.0875, 1.6045, 1.5364, 0.0162, 0.5566, 0.5065],
  [169.728, 1.0916, 1.274, 1.5302, 0.0166, 0.543, 0.5058],
  [176.8, 1.1012, 0.9918, 1.5291, 0.0167, 0.5494, 0.5059],
  [183.872, 1.2227, 1.4633, 1.5305, 0.0167, 0.548, 0.5062],
  [190.944, 0.3849, -0.0003, 1.5394, 0.0164, 0.5483, 0.5064],
  [198.017, 1.2284, 1.664, 1.5355, 0.0162, 0.5513, 0.5065],
  [205.088, 1.0942, 1.3381, 1.5356, 0.0166, 0.5477, 0.5062],
  [212.16, 1.1045, 1.0514, 1.5305, 0.0168, 0.549, 0.5058],
  [219.232, 1.1605, 1.2041, 1.5249, 0.0168, 0.5474, 0.5059],
  [226.304, 0.3531, 0.0001, 1.5335, 0.0163, 0.5534, 0.5063],
  [233.376, 1.1064, 1.6309, 1.5365, 0.0164, 0.5528, 0.5059],
  [240.448, 1.1027, 1.257, 1.5312, 0.0167, 0.5448, 0.5064],
  [247.521, 1.1077, 0.9329, 1.53, 0.0169, 0.5564, 0.5062],
  [254.593, 1.1253, 0.6868, 1.5368, 0.0168, 0.5547, 0.5062],
  [261.664, 0.3557, -0.0003, 1.5313, 0.0163, 0.5336, 0.5066],
  [268.736, 1.1039, 1.5127, 1.5319, 0.0165, 0.5478, 0.5067],
  [275.808, 0.1961, 0.0002, -0.027, 0.0161, -0.918, 0.506],
];

const ROWS_21291C1_SP: (number | null)[][] = [
  [-0.009, 0.0, 0.0, 0.0],
  [4.5, 0.0, 0.0, 0.0],
  [9.0, 0.0, 0.0, 0.0],
  [13.5, 0.0, 0.0, 0.0],
  [18.0, 0.0, 0.0, 0.0],
  [22.532, 0.0, 0.0, 0.0],
  [24.033, 0.0, 0.0, 1.55],
  [45.0, 0.0, 0.0, 1.55],
  [90.0, 0.0, 0.0, 1.55],
  [150.0, 0.0, 0.0, 1.55],
  [220.0, 0.0, 0.0, 1.55],
  [270.0, 0.0, 0.0, 1.55],
  [275.0, 0.0, 0.0, 0.0],
];

const ROWS_21174C3: (number | null)[][] = [
  [0.0, -0.0287, 4.5048, 0.0026, 0.0001, -0.885, 0.9412],
  [2.144, -0.0289, 4.5042, 0.0055, 0.0001, -0.8854, 0.9408],
  [6.432, -0.0288, 4.5042, 0.0084, 0.0, -0.8885, 0.9417],
  [10.72, -0.029, 4.5007, 0.0005, 0.0, -0.8845, 0.941],
  [15.008, -0.0285, 4.5003, 0.0025, 0.0, -0.8836, 0.9417],
  [17.152, -0.0293, 4.5032, 1.4116, 0.0, 0.5265, 0.942],
  [21.44, -0.029, 4.5051, 0.0218, 0.0, -0.8692, 0.941],
  [23.584, -0.0288, -0.0007, 0.0161, 0.0, -0.8855, 0.9417],
  [25.728, -0.0226, 0.0001, 2.2078, 0.0001, 1.0752, 0.942],
  [27.872, 1.1362, 2.2728, 2.3146, 0.0021, 1.2901, 0.9414],
  [30.016, 1.1896, 1.7058, 2.3226, 0.0025, 1.2878, 0.9418],
  [32.16, 1.246, 1.5561, 2.3089, 0.0031, 1.2829, 0.9414],
  [36.448, 1.4673, 1.377, 2.3115, 0.0042, 1.2971, 0.9416],
  [40.736, 1.5232, 1.2712, 2.3123, 0.0053, 1.2842, 0.9418],
  [45.024, 1.5613, 1.146, 2.3126, 0.0062, 1.2808, 0.9413],
  [49.312, 1.5848, 0.9828, 2.3173, 0.007, 1.2829, 0.9418],
  [53.6, 1.6095, 0.9053, 2.3117, 0.0078, 1.2807, 0.9416],
  [57.888, 1.3908, 0.327, 2.3126, 0.0084, 1.2836, 0.9415],
  [60.032, 1.8529, 1.0233, 2.3179, 0.0086, 1.2855, 0.9426],
  [62.176, 0.4893, 0.0, 2.3188, 0.0088, 1.2799, 0.9422],
  [66.464, 0.406, 0.0, 2.3178, 0.0089, 1.2835, 0.9414],
  [70.752, 0.3962, -0.0004, 2.3179, 0.0089, 1.2875, 0.9417],
  [75.04, 0.3731, -0.0007, 0.0353, 0.009, -0.687, 0.9414],
  [79.328, 0.1356, -0.0003, -0.0367, 0.0089, -0.925, 0.9413],
  [83.616, 0.0871, -0.0002, -0.0297, 0.0087, -0.92, 0.9414],
];

const ROWS_21174C2: (number | null)[][] = [
  [0.0, -0.029, 3.9313, 0.0022, 0.0001, -0.8932, 0.9411],
  [5.977, -0.0285, 3.9449, 0.0061, 0.0001, -0.89, 0.9419],
  [11.953, -0.0294, 3.8765, 0.0038, 0.0, -0.8851, 0.9414],
  [17.929, -0.0289, 3.9632, 0.0576, 0.0, -0.6899, 0.941],
  [23.905, -0.0292, -0.0006, 0.0112, 0.0, -0.8865, 0.9416],
  [25.897, 4.7555, 4.4839, 3.0424, 0.0001, 1.8951, 0.9415],
  [27.889, 1.5892, 1.2018, 3.081, 0.0017, 1.9888, 0.9414],
  [31.873, 1.7361, 0.7608, 3.0809, 0.0025, 2.0102, 0.9415],
  [35.857, 1.8238, 0.6908, 3.0896, 0.0033, 2.0095, 0.9419],
  [39.841, 1.872, 0.6278, 3.0806, 0.0042, 2.0033, 0.9411],
  [43.825, 1.8922, 0.5297, 3.0813, 0.005, 2.0089, 0.9419],
  [47.809, 1.9852, 0.4801, 3.0858, 0.0057, 2.0126, 0.9412],
  [51.793, 1.9031, 0.2286, 3.089, 0.0063, 2.0084, 0.9414],
  [53.785, 1.7789, 0.6862, 3.0811, 0.0065, 2.005, 0.941],
  [55.777, 0.6613, -0.0005, 3.0861, 0.0067, 2.0155, 0.9414],
  [59.761, 0.2104, -0.0003, 3.0893, 0.0068, 2.0051, 0.942],
  [63.745, 0.1239, 0.0, 3.0865, 0.0068, 1.9789, 0.9418],
  [67.728, 0.0865, 0.0002, 3.0945, 0.0066, 2.0026, 0.9408],
  [69.721, 0.0723, -0.0005, -0.027, 0.0065, -0.8912, 0.9402],
  [73.705, 0.0527, -0.0001, -0.0557, 0.0064, -0.9413, 0.941],
  [77.689, 0.0392, -0.0006, -0.0431, 0.0063, -0.9343, 0.9411],
];

const ROWS_21106F5: (number | null)[][] = [
  [0.0, -0.0286, 4.5038, 0.0014, 0.0001, -0.892, 0.502],
  [6.24, -0.0289, 4.505, -0.001, 0.0, -0.8912, 0.5018],
  [12.48, -0.0287, 4.5047, -0.0018, 0.0, -0.8928, 0.5021],
  [18.721, -0.029, 4.4993, 0.0036, 0.0, -0.8881, 0.5033],
  [22.88, -0.0287, -0.0005, -0.002, 0.0, -0.8954, 0.5018],
  [29.12, -0.0287, -0.0004, -0.0016, 0.0001, -0.8957, 0.5022],
  [35.36, -0.0275, -0.0006, 1.4177, 0.0001, 0.3578, 0.5022],
  [37.44, -0.0227, -0.0005, 1.4379, 0.0001, 0.4586, 0.5021],
  [41.6, -0.0147, 0.0034, 1.4615, 0.0002, 0.4893, 0.5021],
  [45.761, -0.0127, 0.0061, 1.4651, 0.0004, 0.4824, 0.5024],
  [49.92, -0.0118, 0.0077, 1.4613, 0.0006, 0.485, 0.5022],
  [54.081, -0.0169, -0.0003, 1.4697, 0.0007, 0.4879, 0.5018],
  [58.24, -0.0246, -0.0005, 1.4705, 0.0008, 0.4914, 0.5017],
  [62.401, -0.0113, -0.0005, 1.4785, 0.0008, 0.4978, 0.5022],
  [66.561, -0.0276, 0.0, 1.475, 0.0008, 0.4935, 0.5019],
  [70.721, -0.0277, -0.0001, 1.4694, 0.0008, 0.4927, 0.5027],
  [72.801, -0.0278, -0.0003, 0.0225, 0.0008, -0.8306, 0.5021],
  [76.96, -0.0281, 0.0002, -0.0179, 0.0007, -0.907, 0.5018],
  [81.121, -0.0282, -0.0008, -0.0172, 0.0007, -0.9104, 0.5022],
];

const ROWS_21088P1: (number | null)[][] = [
  [0.0, -0.029, 4.5057, 0.0014, 0.0001, -0.8916, 0.4993],
  [8.161, -0.0291, 4.506, 0.001, 0.0001, -0.8932, 0.4995],
  [16.321, -0.0292, 4.5054, 0.0013, 0.0001, -0.8925, 0.4995],
  [24.481, -0.0293, 4.5009, 0.0013, 0.0001, -0.8904, 0.4992],
  [31.009, -0.0293, 4.507, 0.009, 0.0001, -0.8826, 0.4999],
  [34.273, -0.0293, -0.0002, 0.0037, 0.0001, -0.8904, 0.5005],
  [35.905, -0.0265, 0.0002, 2.2622, 0.0001, 1.0449, 0.5001],
  [37.537, 1.4027, 2.5841, 2.3679, 0.0002, 1.3339, 0.4998],
  [39.169, 0.5979, 1.5655, 2.3898, 0.0007, 1.3552, 0.5],
  [40.801, 0.6229, 1.1424, 2.406, 0.001, 1.3688, 0.4999],
  [42.433, 0.6031, 0.749, 2.4196, 0.0013, 1.3765, 0.4998],
  [44.065, 0.7274, 0.3518, 2.4536, 0.0016, 1.4159, 0.4999],
  [45.697, 0.1005, 0.0, 2.4187, 0.0017, 1.3814, 0.4995],
  [48.961, 0.0236, 0.0, 2.424, 0.0018, 1.3855, 0.5002],
  [52.225, 0.0063, -0.0003, 2.4191, 0.0019, 1.3815, 0.4996],
  [53.857, 0.0016, -0.0006, 0.7495, 0.002, 0.7616, 0.4992],
  [55.489, -0.0022, -0.0003, -0.0155, 0.002, -0.8833, 0.4992],
  [60.385, -0.0095, -0.0002, -0.0307, 0.0021, -0.9247, 0.4991],
  [63.649, -0.0124, 0.0001, -0.0256, 0.0021, -0.9291, 0.4994],
];

// Extracted from NASA PSI-39 FLEX-1213 (DropletData, CoolFlameData, RadiometerData)
const ROWS_FLEX_1213_DROPLET: (number | null)[][] = [
  [-5.2, 4.2553],
  [-3.7, 4.1032],
  [-2.2, 4.1616],
  [-0.7, 4.1947],
  [0.8, 4.2023],
  [2.3, 4.176],
  [3.8, 4.1376],
  [5.3, 4.1014],
  [6.8, 4.0638],
  [8.3, 4.0318],
  [9.8, 3.9814],
  [12.8, 3.8686],
  [15.8, 3.7407],
  [18.8, 3.6029],
  [21.8, 3.4346],
  [24.77, 3.2753],
  [27.77, 3.1053],
  [30.63, 2.9316],
  [33.63, 2.747],
  [36.63, 2.5134],
  [39.53, 2.2855],
  [42.53, 1.9956],
  [44.02, null],
  [45.37, 1.7173],
  [46.87, 1.5621],
];

const ROWS_FLEX_1213_COOLFLAME: (number | null)[][] = [
  [6.8, 11.5274, 6.1739],
  [8.3, 12.1979, 5.9439],
  [9.8, 13.1718, 5.9017],
  [12.8, 13.496, 6.2194],
  [15.8, 14.641, 6.0502],
  [18.8, 14.1802, 6.6922],
  [21.8, 14.4141, 5.574],
  [24.77, 14.3253, 6.6456],
  [27.77, 12.8892, 5.9334],
  [30.63, 13.11, 5.2469],
  [33.63, 12.463, 5.2732],
  [36.63, 11.4913, 4.5467],
  [39.53, 11.285, 4.5945],
  [42.53, 10.0565, 4.2253],
  [44.02, 9.7051, 3.7538],
  [45.37, 9.1802, 3.7136],
  [46.87, 8.372, 3.3114],
];

const ROWS_FLEX_1213_RADIOMETER: (number | null)[][] = [
  [-5.2, -5201000, 0.1584],
  [-3.7, -5184000, 0.4664],
  [-2.2, -4990000, 1.2965],
  [-0.7, -4912000, 1.475],
  [0.8, -3204000, 3.0913],
  [2.3, -2480000, 3.8608],
  [3.8, -1620000, 4.6794],
  [5.3, -3890000, 2.6622],
  [6.8, -4220000, 2.1245],
  [9.8, -4340000, 1.9073],
  [15.8, -4310000, 2.0242],
  [21.8, -4290000, 2.0577],
  [27.77, -4390000, 1.9198],
  [33.63, -4510000, 1.6296],
  [39.53, -4640000, 1.4573],
  [45.37, -4820000, 1.1628],
];

// Extracted from NASA PSI-39 FLEX-1249 (B12 D² fit over 4 <= t <= 36 s)
const ROWS_FLEX_1249_D2_FIT: (number | null)[][] = [
  [-11.6, 16.159, null],
  [-9.567, 18.722, null],
  [-7.533, 16.644, null],
  [-5.5, 16.867, null],
  [-3.45, 17.023, null],
  [-1.433, 17.165, null],
  [0.6, 17.084, null],
  [2.633, 16.457, null],
  [4.667, 15.589, 15.5618],
  [6.7, 14.698, 14.7138],
  [8.733, 13.842, 13.8658],
  [10.767, 13.017, 13.0179],
  [12.8, 12.182, 12.1699],
  [14.85, 11.372, 11.315],
  [16.883, 10.595, 10.467],
  [18.917, 9.55, 9.619],
  [20.95, 8.715, 8.7711],
  [22.983, 7.859, 7.9231],
  [25.017, 7.022, 7.0751],
  [27.05, 6.181, 6.2271],
  [29.083, 5.353, 5.3792],
  [31.117, 4.603, 4.5312],
  [33.15, 3.642, 3.6832],
  [35.183, 2.847, 2.8353],
  [37.217, 2.07, null],
  [39.25, 1.133, null],
  [41.283, 0.036, null],
];

const ROWS_FLEX_1249_DROPLET: (number | null)[][] = [
  [-11.6, 4.02],
  [-9.567, 4.327],
  [-7.533, 4.08],
  [-5.5, 4.107],
  [-3.45, 4.126],
  [-1.433, 4.143],
  [0.6, 4.133],
  [2.633, 4.057],
  [4.667, 3.948],
  [6.7, 3.834],
  [8.733, 3.721],
  [10.767, 3.608],
  [12.8, 3.49],
  [14.85, 3.372],
  [16.883, 3.255],
  [18.917, 3.09],
  [20.95, 2.952],
  [22.983, 2.803],
  [25.017, 2.65],
  [27.05, 2.486],
  [29.083, 2.314],
  [31.117, 2.145],
  [33.15, 1.908],
  [35.183, 1.687],
];

const ROWS_FLEX_1249_COOLFLAME: (number | null)[][] = [
  [10.5, 6.027, 0.0],
  [12.034, 13.077, 6.046],
  [13.567, 12.658, 5.595],
  [15.101, 13.23, 6.237],
  [16.634, 14.362, 5.653],
  [18.167, 13.794, 5.227],
  [19.701, 14.207, 5.421],
  [21.234, 14.108, 5.337],
  [22.767, 13.206, 5.588],
  [24.301, 12.187, 5.686],
  [25.834, 12.53, 5.15],
  [27.367, 11.552, 4.619],
  [28.9, 11.676, 4.667],
  [30.434, 11.63, 4.51],
  [31.967, 11.212, 3.958],
  [33.5, 10.487, 3.661],
  [35.034, 9.99, 3.605],
  [36.567, 9.024, 2.697],
  [38.1, 7.976, 2.919],
  [39.633, 6.607, 2.118],
];

const ROWS_FLEX_1249_RADIOMETER: (number | null)[][] = [
  [-68.89, -5451241.431, 0.1584],
  [-54.53, -5464616.4878, 0.1375],
  [-39.17, -5481480.7912, 0.1605],
  [-23.81, -5489622.2, 0.1762],
  [-8.45, -5244217.5177, 0.4863],
  [-0.77, -5079645.1056, 0.7097],
  [6.91, -772850.4283, 8.1929],
  [14.59, -4524286.1222, 3.3252],
  [22.27, -4728983.9543, 2.4711],
  [29.95, -4888322.5244, 1.8843],
  [37.63, -5091857.2466, 1.19],
  [45.31, -5347729.5021, 0.5134],
  [52.99, -5371572.0212, 0.339],
  [60.67, -5394251.6245, 0.2305],
  [68.35, -5410534.3868, 0.1939],
  [76.03, -5464616.5433, 0.2211],
];

const SPECIFIC_DATASET_DATA: Record<string, DatasetData> = {
  "CFIG-21291C1-sensors": {
    dataset: FIXTURE_CASE_DETAILS["CFIG-21291C1"].datasets[0],
    rows: ROWS_21291C1,
    note: "Sampled from NASA PSI-159 Raw Data 21291C1 (125 Hz source recording, 40 representative points across 275.8 s). Units are not stated in source CSV, so raw voltage channels are labelled unitless (null).",
  },
  "CFIG-21291C1-mfc-setpoints": {
    dataset: FIXTURE_CASE_DETAILS["CFIG-21291C1"].datasets[1],
    rows: ROWS_21291C1_SP,
    note: "Commanded Mass Flow Controller (MFC) setpoints in Volts (V) aligned to t=0 of sensor recording.",
  },
  "CFIG-21174C3-sensors": {
    dataset: FIXTURE_CASE_DETAILS["CFIG-21174C3"].datasets[0],
    rows: ROWS_21174C3,
    note: "Sampled from NASA PSI-159 Raw Data 21174C3 (cool-flame run, PCI-D). Raw channel units are null in source files.",
  },
  "CFIG-21174C2-sensors": {
    dataset: FIXTURE_CASE_DETAILS["CFIG-21174C2"].datasets[0],
    rows: ROWS_21174C2,
    note: "Sampled from NASA PSI-159 Raw Data 21174C2 (hot-flame counterpart to 21174C3). Raw channel units are null in source files.",
  },
  "CFIG-21106F5-sensors": {
    dataset: FIXTURE_CASE_DETAILS["CFIG-21106F5"].datasets[0],
    rows: ROWS_21106F5,
    note: "Sampled from NASA PSI-159 Raw Data 21106F5 (direct cool flame without hot ignition at 50.665 kPa). Raw channel units are null.",
  },
  "CFIG-21088P1-sensors": {
    dataset: FIXTURE_CASE_DETAILS["CFIG-21088P1"].datasets[0],
    rows: ROWS_21088P1,
    note: "Sampled from NASA PSI-159 Raw Data 21088P1 (18.0% O₂ ethane run). Raw channel units are null.",
  },
  "FLEX-1213-droplet": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1213"].datasets[0],
    rows: ROWS_FLEX_1213_DROPLET,
    note: "Sampled from NASA PSI-39 FLEX-1213_DropletData.txt; null at t = 44.02 s reflects an unmeasured optical frame.",
  },
  "FLEX-1213-coolflame": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1213"].datasets[1],
    rows: ROWS_FLEX_1213_COOLFLAME,
    note: "Sampled from NASA PSI-39 FLEX-1213_CoolFlameData.txt (starts at t = 6.8 s).",
  },
  "FLEX-1213-radiometer": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1213"].datasets[2],
    rows: ROWS_FLEX_1213_RADIOMETER,
    note: "Sampled from NASA PSI-39 FLEX-1213_RadiometerData.txt; wide-band values are large and negative in the source file and shown unconverted.",
  },
  "FLEX-1249-droplet": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1249"].datasets[0],
    rows: ROWS_FLEX_1249_DROPLET,
    note: "Sampled from NASA PSI-39 FLEX-1249_DropletData.txt (source time base).",
  },
  "FLEX-1249-coolflame": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1249"].datasets[1],
    rows: ROWS_FLEX_1249_COOLFLAME,
    note: "Sampled from NASA PSI-39 FLEX-1249_CoolFlameData.txt.",
  },
  "FLEX-1249-radiometer": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1249"].datasets[2],
    rows: ROWS_FLEX_1249_RADIOMETER,
    note: "Sampled from NASA PSI-39 FLEX-1249_RadiometerData.txt.",
  },
  "FLEX-1249-d2-fit": {
    dataset: FIXTURE_CASE_DETAILS["FLEX-1249"].datasets[3],
    rows: ROWS_FLEX_1249_D2_FIT,
    note: "B12 D² = DropletDiameter_mm² and ordinary least-squares fit line (t = 4–36 s, K = 0.417 mm²/s, R² = 0.9998); D2_fit_mm2 is null outside the fit window.",
  },
};

const DATASET_BY_ID: Record<string, Dataset> = Object.values(
  FIXTURE_CASE_DETAILS,
)
  .flatMap((c) => c.datasets)
  .reduce<Record<string, Dataset>>((acc, ds) => {
    acc[ds.dataset_id] = ds;
    return acc;
  }, {});

export function getFixtureDatasetData(datasetId: string): DatasetData | null {
  if (SPECIFIC_DATASET_DATA[datasetId]) {
    return SPECIFIC_DATASET_DATA[datasetId];
  }
  const descriptor = DATASET_BY_ID[datasetId];
  if (!descriptor) return null;

  // For remaining manifest cases without bespoke samples, reuse verified sensor structure
  // only if explicitly tagged as fixture placeholder; otherwise return empty/representative.
  const isSetpoint = datasetId.endsWith("-mfc-setpoints");
  const isDroplet = datasetId.endsWith("-droplet");
  const isCoolFlame = datasetId.endsWith("-coolflame");
  const isRadiometer = datasetId.endsWith("-radiometer");
  return {
    dataset: descriptor,
    rows: isSetpoint
      ? ROWS_21291C1_SP
      : isDroplet
        ? ROWS_FLEX_1249_DROPLET
        : isCoolFlame
          ? ROWS_FLEX_1249_COOLFLAME
          : isRadiometer
            ? ROWS_FLEX_1249_RADIOMETER
            : ROWS_21174C3,
    note: isSetpoint
      ? "Fixture setpoint profile (V) aligned to t=0."
      : "Fixture demo telemetry curve; connect to live backend for this run's full recording.",
  };
}

const NEIGHBOR_METRIC =
  "Euclidean distance between cases of the same investigation in the plane of " +
  "(o2_pct, pressure_kpa), each feature standardised to zero mean and unit standard " +
  "deviation within that investigation. Cases missing either value have no neighbours and " +
  "are nobody's neighbour. Up to 5 nearest cases, ties ordered by case ID. Fuel and all " +
  "other metadata are ignored. The distance only says how close the test conditions are; " +
  "it is not a calibrated similarity and not a safety score.";

function stdDevSample(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return Math.sqrt(sq / (values.length - 1));
}

export function computeStandardizedNeighbors(
  caseId: string,
  pool: CaseSummary[],
): CaseNeighborsResponse | null {
  const target = pool.find((c) => c.case_id === caseId);
  if (!target) return null;

  const group = pool.filter(
    (c) =>
      c.investigation === target.investigation &&
      c.o2_pct !== null &&
      c.pressure_kpa !== null,
  );
  if (
    target.o2_pct === null ||
    target.pressure_kpa === null ||
    !group.some((c) => c.case_id === caseId)
  ) {
    return { metric: NEIGHBOR_METRIC, items: [] };
  }

  const o2Vals = group.map((c) => c.o2_pct as number);
  const pVals = group.map((c) => c.pressure_kpa as number);
  const o2Mean = o2Vals.reduce((a, b) => a + b, 0) / o2Vals.length;
  const pMean = pVals.reduce((a, b) => a + b, 0) / pVals.length;
  const o2Std = stdDevSample(o2Vals);
  const pStd = stdDevSample(pVals);

  const zPoint = (c: CaseSummary): [number, number] => [
    o2Std > 0 ? ((c.o2_pct as number) - o2Mean) / o2Std : 0,
    pStd > 0 ? ((c.pressure_kpa as number) - pMean) / pStd : 0,
  ];
  const [tx, ty] = zPoint(target);

  const items: CaseNeighborItem[] = group
    .filter((c) => c.case_id !== caseId)
    .map((c) => {
      const [ox, oy] = zPoint(c);
      const distance = Number(Math.hypot(tx - ox, ty - oy).toFixed(4));
      return { case: c, distance };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.case.case_id.localeCompare(b.case.case_id),
    )
    .slice(0, 5);

  return { metric: NEIGHBOR_METRIC, items };
}

export function getFixtureCaseNeighbors(
  caseId: string,
): CaseNeighborsResponse | null {
  return computeStandardizedNeighbors(caseId, FIXTURE_CASES);
}

export function searchFixtureCases(filters: Filters): SearchResponse {
  const clean = sanitizeFilters(filters);
  const error = validateFiltersAgainstOptions(clean, FIXTURE_FILTER_OPTIONS);
  if (error) {
    throw new Error(error);
  }
  const items = FIXTURE_CASES.filter((item) => matchesFilters(item, clean));
  return { items, total: items.length };
}

// Rehearsed prompts aligned with backend/app/ai/interpret.py DEMO_PROMPTS
const DEMO_PROMPT_TABLE: Record<string, Filters> = {
  "pokaż testy z butanem powyżej 200 kpa i ponad 39% tlenu": {
    fuel: ["butane"],
    o2_pct: { min: 39 },
    pressure_kpa: { min: 200 },
  },
  "show butane tests above 200 kpa with more than 39% oxygen": {
    fuel: ["butane"],
    o2_pct: { min: 39 },
    pressure_kpa: { min: 200 },
  },
  "pokaż testy w atmosferze zbliżonej do ziemskiej: 20-22% tlenu, 95-105 kpa": {
    o2_pct: { min: 20, max: 22 },
    pressure_kpa: { min: 95, max: 105 },
  },
  "show tests in an earth-like atmosphere: 20-22% oxygen, 95-105 kpa": {
    o2_pct: { min: 20, max: 22 },
    pressure_kpa: { min: 95, max: 105 },
  },
  "pokaż testy przy niskim ciśnieniu, 45-55 kpa": {
    pressure_kpa: { min: 45, max: 55 },
  },
  "show low-pressure tests, 45-55 kpa": {
    pressure_kpa: { min: 45, max: 55 },
  },
};

export const EXAMPLE_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Butane >200 kPa & >39% O₂ (PL)",
    prompt: "Pokaż testy z butanem powyżej 200 kPa i ponad 39% tlenu",
  },
  {
    label: "Earth-like 20–22% O₂, 95–105 kPa",
    prompt: "Show tests in an Earth-like atmosphere: 20-22% oxygen, 95-105 kPa",
  },
  {
    label: "Low pressure 45–55 kPa",
    prompt: "Show low-pressure tests, 45-55 kPa",
  },
];

export function interpretFixtureFilters(
  text: string,
  currentFilters: Filters,
): InterpretResponse {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/–|—/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "");

  const matched = DEMO_PROMPT_TABLE[normalized];
  if (!matched) {
    return {
      filters: sanitizeFilters(currentFilters),
      warnings: [
        "Demo mode: prompt does not match a rehearsed demo scenario, so active filters were left unchanged.",
      ],
      mode: "demo",
    };
  }

  return {
    filters: sanitizeFilters(matched),
    warnings: [],
    mode: "demo",
  };
}
