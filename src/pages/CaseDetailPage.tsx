import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Download,
  ExternalLink,
  FileSpreadsheet,
  GitCompare,
  Globe,
  Info,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  ApiError,
  downloadDatasetCsv,
  getCaseDetail,
  getCaseNeighbors,
  getDatasetData,
} from "../api/client";
import type {
  CaseDetail,
  CaseNeighborsResponse,
  Dataset,
  DatasetData,
} from "../api/types";
import { CoolFlameLifecycleDeck } from "../components/CoolFlameLifecycleDeck";
import { TelemetryWorkspace } from "../components/TelemetryWorkspace";
import { useExplorer } from "../context/ExplorerContext";
import { cn, formatNumber, formatSignedDelta, kpaToPsi } from "../lib/utils";

type PsiInvestigationMetadata = {
  accession: string;
  officialTitle: string;
  flightPlatform: string;
  hardwareName: string;
  hardwareUrl: string;
  psiUrl: string;
  earthBenefits: string;
  objectivesSummary: string;
};

// Verbatim metadata from NASA PSI (combustion.json) for F22 Earth applications & deep-links.
const PSI_INVESTIGATION_METADATA: Record<string, PsiInvestigationMetadata> = {
  "ACME CFI-G": {
    accession: "PSI-159",
    officialTitle:
      "Advanced Combustion via Microgravity Experiments / Cool Flames Investigation with Gases",
    flightPlatform: "International Space Station (ISS)",
    hardwareName: "ACME Combustion Integrated Rack (CIR)",
    hardwareUrl: "https://www1.grc.nasa.gov/space/iss-research/iss-fcf/cir/",
    psiUrl: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-159",
    earthBenefits:
      "Combustion provides 86% of the world’s energy and an even higher fraction of the energy used for transportation. The internal combustion engines used for transportation generally have thermal efficiencies of 38% or lower because of thermal losses. These efficiencies may increase to 60% if future engines can take advantage of ultra-lean combustion. However, this progress is being impeded by the limited understanding of the chemistry of cool flames. Research into cool diffusion flames (whose peak temperatures are 500 – 1000 K) has grown exponentially since they were discovered in 2012. The measurements performed for this project will help to test and advance cool flame kinetics mechanisms. This should facilitate the development of more efficient internal combustion engines.",
    objectivesSummary:
      "Determine the conditions for which cool diffusion flames occur for propane, n-butane, and n-pentane (normal and inverse flames across Zst, Tad, and flow rate) on the ISS, and test chemical kinetics mechanisms against CFD predictions.",
  },
  "CFI (FLEX)": {
    accession: "PSI-39",
    officialTitle: "Cool Flames Investigation (CFI)",
    flightPlatform: "International Space Station (ISS)",
    hardwareName:
      "Multi-User Droplet Combustion Apparatus (MDCA) / Combustion Integrated Rack (CIR)",
    hardwareUrl:
      "https://www1.grc.nasa.gov/space/iss-research/iss-fcf/combustion-science/mdca/",
    psiUrl: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-39",
    earthBenefits:
      "A basic understanding of cool flames is important for understanding ignition phenomena of practical fuels and fuel additives. Cool flames play a key role in the development and selection of new fuels and the design of advanced engines such as clean, high-efficiency Homogeneous Charge Compression Ignition (HCCI) engines. The research will also help combustion chemists to develop new computational models to compute combustion performance in for many practical applications on earth, including an understanding of how cool flame reactivity determines octane and cetane number for fuels in spark ignition and diesel engines. Cool Flames Investigation (CFI) will provide critical validation for complex chemical kinetic mechanisms, advance the understanding of flame dynamics and instabilities in low-temperature combustion, and support the design of safer spacecraft systems by refining knowledge of combustion in microgravity environments.",
    objectivesSummary:
      "Examine n-dodecane and n-dodecane/iso-dodecane droplet combustion across 0.25–5 atm and helium-diluted atmospheres to quantify droplet size, pressure, cool-flame extinction, and soot formation.",
  },
  "ACME Flame Design": {
    accession: "PSI-10",
    officialTitle:
      "Advanced Combustion via Microgravity Experiments / Flame Design",
    flightPlatform: "International Space Station (ISS)",
    hardwareName: "ACME / Combustion Integrated Rack (CIR)",
    hardwareUrl:
      "https://www1.grc.nasa.gov/space/iss-research/iss-fcf/combustion-science/acme/implementation/",
    psiUrl: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-10",
    earthBenefits:
      "This project has the potential for improving efficiency and reducing pollutant emissions in terrestrial combustors. For example, it is contributing to novel designs of future coal power plants.",
    objectivesSummary:
      "Obtain soot-inception limits, detailed quasi-steady flame measurements, and extinction limits for normal and inverse spherical ethylene and methane diffusion flames across flow rate, Zst, N2/CO2 dilution, and pressure.",
  },
  "Saffire-III": {
    accession: "PSI-100",
    officialTitle: "Spacecraft Fire Experiment-III",
    flightPlatform: "Cygnus Cargo Vehicle (OA-7 post-unberth)",
    hardwareName: "Saffire-III Enclosure in Cygnus",
    hardwareUrl:
      "https://www1.grc.nasa.gov/space/iss-research/msg/saffire/",
    psiUrl: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
    earthBenefits:
      "The Saffire-I experiment provides a new way to study a realistic fire on an exploration vehicle, which has not been possible in the past because the risks are too high. Instruments on an unmanned cargo vessel measure oxygen, carbon dioxide, heat, pressure and flame growth, and two video cameras provide views of the flame. Results determine microgravity flammability limits for several spacecraft materials, help to validate NASA’s material selection criteria, and how microgravity and limited oxygen affect flame size. The investigation is crucial for the safety of current and future space missions. Studying fire in small, sealed environments such as the Cygnus cargo supply vehicle benefits fire safety and prevention efforts on Earth, including inside mines, airplanes, or submarines.",
    objectivesSummary:
      "Determine how rapidly a large-scale SIBAL cloth fire grows in low gravity at 30 cm/s airflow and investigate low-g flammability limits relative to NASA normal-gravity screening tests.",
  },
  "ACME E-FIELD Flames": {
    accession: "PSI-22",
    officialTitle:
      "Advanced Combustion via Microgravity Experiments Electric-Field Effects on Laminar Diffusion Flames",
    flightPlatform: "International Space Station (ISS)",
    hardwareName: "ACME / Combustion Integrated Rack (CIR)",
    hardwareUrl:
      "https://www1.grc.nasa.gov/space/iss-research/iss-fcf/combustion-science/acme/implementation/",
    psiUrl: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-22",
    earthBenefits:
      "The E-FIELD Flames research is not being conducted to serve any space applications, but it is possible that its findings could aid the development of future space-based combustion devices (e.g., for solid waste processing). The use of electric fields to control flames can reduce the production of harmful pollutants in practical terrestrial combustion. The combustion of fossil fuel is the primary human source of greenhouse gas and acid rain and furthermore creates soot, which can be beneficial but is also a health hazard. Combustion using electrical fields may also allow for more efficient combustion, reducing fuel consumption in addition to unwanted emissions.",
    objectivesSummary:
      "Understand the relationship between electric-field voltage and chemi-ion current, dynamic flame response to electric-field changes, soot formation, and near-limit lifted flames.",
  },
  "SAME-R": {
    accession: "PSI-101",
    officialTitle: "Smoke Aerosol Measurement Experiment-Reflight",
    flightPlatform: "International Space Station (ISS)",
    hardwareName: "Comparative Soot Diagnostic Hardware",
    hardwareUrl:
      "https://ntrs.nasa.gov/api/citations/19960008413/downloads/19960008413.pdf",
    psiUrl: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
    earthBenefits:
      "Along with the results from the original SAME investigation, the results from SAME-R can lead to technology for an advanced fire detector for future spacecraft that will be used for long duration missions. SAME will provide quantitative data on the sensitivity of these detectors to reduced gravity smokes that will allow evaluation of the adequacy of these existing technologies using relevant data. The current Fire Prevention, Detection, and Suppression (FPDS) program plan allows for the re-evaluation of future sensor technology, to allow new technology and capability to be utilized. The results from SAME are needed to provide the reduced gravity baseline data against which future detection technology developments can be evaluated. The smoke detectors developed from the results of SAME can also be useful in other extreme environments on Earth, such as submarines or underwater laboratories. Accurate detection of smoke in these environments can save lives.",
    objectivesSummary:
      "Quantify liquid smoke particulate size distributions and relate them to smoke generation, transport, and ISS/Shuttle fire detector sensitivity across spacecraft materials in microgravity.",
  },
};

export function CaseDetailPage() {
  const { caseId = "" } = useParams<{ caseId: string }>();
  const decodedCaseId = decodeURIComponent(caseId);
  return <CaseDetailView key={decodedCaseId} decodedCaseId={decodedCaseId} />;
}

function CaseDetailView({ decodedCaseId }: { decodedCaseId: string }) {

  const {
    dataSourceMode,
    faultInjection,
    caseCache,
    cacheCaseDetail,
    datasetCache,
    cacheDatasetData,
    comparedCaseIds,
    toggleCompareCase,
    setComparedCases,
    setComparisonOpen,
  } = useExplorer();

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(
    () => caseCache[decodedCaseId] ?? null,
  );
  const [caseLoading, setCaseLoading] = useState<boolean>(
    () => !caseCache[decodedCaseId],
  );
  const [caseError, setCaseError] = useState<{
    status: number;
    message: string;
  } | null>(null);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    () => caseCache[decodedCaseId]?.datasets[0]?.dataset_id ?? null,
  );

  const [datasetData, setDatasetData] = useState<DatasetData | null>(null);
  const [datasetLoading, setDatasetLoading] = useState<boolean>(false);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  const [neighbors, setNeighbors] = useState<CaseNeighborsResponse | null>(null);
  const [neighborsLoading, setNeighborsLoading] = useState<boolean>(false);
  const [neighborsError, setNeighborsError] = useState<string | null>(null);
  const [csvDownloading, setCsvDownloading] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const caseReqIdRef = useRef(0);
  const dataReqIdRef = useRef(0);
  const neighborsReqIdRef = useRef(0);

  const loadCase = useCallback(async () => {
    const reqId = ++caseReqIdRef.current;
    const cached = caseCache[decodedCaseId];
    if (cached) {
      setCaseDetail(cached);
      setCaseError(null);
      setCaseLoading(false);
      setSelectedDatasetId((prev) =>
        prev && cached.datasets.some((d) => d.dataset_id === prev)
          ? prev
          : (cached.datasets[0]?.dataset_id ?? null),
      );
      return;
    }

    const controller = new AbortController();
    setCaseLoading(true);
    setCaseError(null);

    try {
      const detail = await getCaseDetail(
        decodedCaseId,
        { mode: dataSourceMode },
        controller.signal,
      );
      if (reqId !== caseReqIdRef.current) return;
      cacheCaseDetail(detail);
      setCaseDetail(detail);
      setSelectedDatasetId(detail.datasets[0]?.dataset_id ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (reqId !== caseReqIdRef.current) return;
      const status = err instanceof ApiError ? err.status : 0;
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Could not load case metadata.";
      setCaseError({ status, message });
      setCaseDetail(null);
    } finally {
      if (reqId === caseReqIdRef.current) {
        setCaseLoading(false);
      }
    }
  }, [cacheCaseDetail, caseCache, dataSourceMode, decodedCaseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  useEffect(() => {
    if (!caseDetail) {
      setNeighbors(null);
      setNeighborsError(null);
      setNeighborsLoading(false);
      return;
    }
    const reqId = ++neighborsReqIdRef.current;
    const controller = new AbortController();
    setNeighborsLoading(true);
    setNeighborsError(null);

    getCaseNeighbors(caseDetail.case_id, { mode: dataSourceMode }, controller.signal)
      .then((res) => {
        if (reqId !== neighborsReqIdRef.current) return;
        setNeighbors(res);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (reqId !== neighborsReqIdRef.current) return;
        setNeighborsError(
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load nearest condition cases.",
        );
      })
      .finally(() => {
        if (reqId === neighborsReqIdRef.current) {
          setNeighborsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [caseDetail, dataSourceMode]);

  const selectedDataset: Dataset | undefined = caseDetail?.datasets.find(
    (d) => d.dataset_id === selectedDatasetId,
  );

  const loadDataset = useCallback(
    async (dataset: Dataset, bypassCache = false, signal?: AbortSignal) => {
      const reqId = ++dataReqIdRef.current;
      const cached = !bypassCache ? datasetCache[dataset.dataset_id] : undefined;
      if (cached && faultInjection === "none") {
        setDatasetData(cached);
        setDatasetError(null);
        setDatasetLoading(false);
        return;
      }

      setDatasetLoading(true);
      setDatasetError(null);

      try {
        const data = await getDatasetData(
          dataset.dataset_id,
          dataset,
          { mode: dataSourceMode, fault: faultInjection },
          signal,
        );
        if (reqId !== dataReqIdRef.current) return;
        cacheDatasetData(dataset.dataset_id, data);
        setDatasetData(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (reqId !== dataReqIdRef.current) return;
        const message =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to load dataset JSON telemetry.";
        setDatasetError(message);
        setDatasetData(null);
      } finally {
        if (reqId === dataReqIdRef.current) {
          setDatasetLoading(false);
        }
      }
    },
    [cacheDatasetData, dataSourceMode, datasetCache, faultInjection],
  );

  useEffect(() => {
    if (!selectedDataset) {
      setDatasetData(null);
      setDatasetError(null);
      setDatasetLoading(false);
      return;
    }
    const controller = new AbortController();
    void loadDataset(selectedDataset, false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadDataset, selectedDataset]);

  if (caseLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-36 rounded-2xl bg-slate-900/70 border border-slate-800" />
        <div className="h-[460px] rounded-2xl bg-slate-900/70 border border-slate-800" />
      </div>
    );
  }

  if (caseError || !caseDetail) {
    const isNotFound = caseError?.status === 404;
    return (
      <div className="panel-surface rounded-2xl p-8 max-w-2xl mx-auto mt-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/15 border border-rose-500/35 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-rose-400" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold text-white">
            {isNotFound ? "Experiment Case Not Found" : "Case Load Error"}
          </h1>
          <p className="text-sm text-slate-300">
            {caseError?.message ?? `No case record found for "${decodedCaseId}".`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Explorer
          </Link>
          {!isNotFound && (
            <button
              type="button"
              onClick={() => void loadCase()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const psiMeta = PSI_INVESTIGATION_METADATA[caseDetail.investigation];
  const resolvedSourceUrl = caseDetail.source_url ?? psiMeta?.psiUrl ?? null;

  return (
    <div className="space-y-5 animate-panel-in">
      {/* Top Navigation & Case Identity Strip (F05) */}
      <section className="panel-surface-cyan rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Results
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md font-mono-telemetry bg-cyan-500/15 border border-cyan-400/35 text-cyan-200">
              {caseDetail.case_id}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200 font-medium">
              {caseDetail.investigation}
            </span>
            <button
              type="button"
              onClick={() => toggleCompareCase(caseDetail.case_id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer",
                comparedCaseIds.includes(caseDetail.case_id)
                  ? "bg-orange-500/25 border-orange-400/60 text-orange-100"
                  : "bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-orange-400/50 hover:text-orange-200",
              )}
            >
              {comparedCaseIds.includes(caseDetail.case_id) ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>
                {comparedCaseIds.includes(caseDetail.case_id)
                  ? "Pinned to Compare"
                  : "Pin to Compare"}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {caseDetail.title}
          </h1>

          {/* Parameter Strip with Clear Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Fuel
              </span>
              <span className="text-base font-semibold text-orange-300 mt-0.5 block">
                {caseDetail.fuel ?? "Unknown (null)"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Oxygen Concentration
              </span>
              <span className="text-base font-semibold font-mono-telemetry text-cyan-300 mt-0.5 block">
                {caseDetail.o2_pct !== null
                  ? `${formatNumber(caseDetail.o2_pct, 2)} % O₂`
                  : "Unknown (null)"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Chamber Pressure
              </span>
              <span className="text-base font-semibold font-mono-telemetry text-slate-100 mt-0.5 block">
                {caseDetail.pressure_kpa !== null
                  ? `${formatNumber(caseDetail.pressure_kpa, 2)} kPa (${formatNumber(kpaToPsi(caseDetail.pressure_kpa), 2)} psi)`
                  : "Unknown (null)"}
              </span>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 px-4 py-3">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-slate-400">
                Mixture Fraction (Z_st)
              </span>
              <span className="text-base font-semibold font-mono-telemetry text-slate-100 mt-0.5 block">
                {caseDetail.z_st !== null && caseDetail.z_st !== undefined
                  ? formatNumber(caseDetail.z_st, 4)
                  : "Unknown (null)"}
              </span>
            </div>
          </div>
        </div>

        {/* Short Template Explanation (B15) */}
        {caseDetail.explanation && (
          <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/25 px-4 py-3 text-xs sm:text-sm text-slate-200 flex flex-wrap items-start justify-between gap-2.5 leading-relaxed">
            <p className="flex-1 min-w-[240px]">{caseDetail.explanation.text}</p>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-telemetry uppercase tracking-wider bg-slate-900 border border-cyan-500/30 text-cyan-300 shrink-0">
              Origin: {caseDetail.explanation.origin}
            </span>
          </div>
        )}

        {caseDetail.note && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>{caseDetail.note}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-300 shrink-0">
              Source Reference:
            </span>
            <span className="truncate">{caseDetail.source_label}</span>
          </div>
          {resolvedSourceUrl && (
            <a
              href={resolvedSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline underline-offset-4 shrink-0"
            >
              <span>
                {psiMeta
                  ? `NASA PSI Repository (${psiMeta.accession})`
                  : "NASA PSI Source"}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </section>

      {/* Dataset Selector Strip (F05 / F23) */}
      <section className="panel-surface rounded-xl p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono-telemetry uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
              Selected Dataset:
            </span>
            {caseDetail.datasets.length === 0 ? (
              <span className="text-xs text-slate-400">
                No telemetry datasets attached to this case.
              </span>
            ) : (
              caseDetail.datasets.map((ds) => {
                const active = ds.dataset_id === selectedDatasetId;
                return (
                  <button
                    key={ds.dataset_id}
                    type="button"
                    onClick={() => {
                      setSelectedDatasetId(ds.dataset_id);
                      setCsvError(null);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                      active
                        ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100 shadow-sm"
                        : "bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500",
                    )}
                  >
                    {ds.label}
                  </button>
                );
              })
            )}
          </div>

          {selectedDataset && dataSourceMode === "live" && (
            <button
              type="button"
              disabled={csvDownloading}
              onClick={async () => {
                setCsvDownloading(true);
                setCsvError(null);
                try {
                  await downloadDatasetCsv(selectedDataset.dataset_id);
                } catch (err) {
                  setCsvError(
                    err instanceof ApiError
                      ? err.detail
                      : err instanceof Error
                        ? err.message
                        : "CSV export failed.",
                  );
                } finally {
                  setCsvDownloading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Download backend-exported CSV directly (not used for chart loading)"
            >
              <Download className="h-3.5 w-3.5" />
              {csvDownloading ? "Downloading CSV…" : "Export Raw CSV"}
            </button>
          )}
        </div>

        {csvError && (
          <p role="alert" className="text-xs text-rose-300 font-mono-telemetry">
            CSV Export Failed: {csvError}
          </p>
        )}
      </section>

      {/* F06 Loading / Error / Chart Workspace */}
      {selectedDataset && datasetLoading && (
        <div className="panel-surface rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 w-64 rounded bg-slate-800" />
          <div className="h-[440px] rounded-xl bg-slate-900/80 border border-slate-800" />
        </div>
      )}

      {selectedDataset && !datasetLoading && datasetError && (
        <div
          role="alert"
          className="panel-surface rounded-2xl border border-rose-500/40 bg-rose-950/25 p-6 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-rose-100">
                Dataset Telemetry Load Failed
              </h3>
              <p className="text-xs text-rose-200/90 font-mono-telemetry">
                {datasetError}
              </p>
              {dataSourceMode === "live" && (
                <p className="text-xs text-slate-400 pt-1">
                  Note: Dataset loader requests Parquet-backed JSON from{" "}
                  <code>/api/v1/datasets/&#123;dataset_id&#125;/data</code>.
                  Ensure backend curated data is prepared or switch to Demo
                  Fixtures in the header.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadDataset(selectedDataset, true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 border border-rose-400/50 text-rose-100 hover:bg-rose-500/30 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Dataset Load
          </button>
        </div>
      )}

      {selectedDataset && !datasetLoading && !datasetError && datasetData && (
        <TelemetryWorkspace
          datasetData={datasetData}
          sourceLabel={caseDetail.source_label}
          events={(caseDetail.events ?? []).filter(
            (ev) => ev.dataset_id === selectedDataset.dataset_id,
          )}
        />
      )}

      {/* Synchronized Multi-Dataset Lifecycle Deck (F13) */}
      <CoolFlameLifecycleDeck caseDetail={caseDetail} />

      {/* Research Context (B14) & Nearest Condition Cases (B11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {caseDetail.research_context && (
          <section
            aria-label="Research Context"
            className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">
                  Research Context
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {caseDetail.research_context.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-mono-telemetry uppercase tracking-wider border",
                      tag === "unknown"
                        ? "bg-slate-800/90 border-slate-700 text-slate-300"
                        : "bg-cyan-500/15 border-cyan-400/40 text-cyan-200",
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {caseDetail.research_context.rationale}
            </p>

            {caseDetail.research_context.evidence.length > 0 && (
              <div className="space-y-2">
                {caseDetail.research_context.evidence.map((ev, idx) => (
                  <blockquote
                    key={`${ev.document}-${ev.page}-${idx}`}
                    className="rounded-lg bg-slate-950/70 border border-slate-800/90 px-3 py-2 text-xs space-y-1"
                  >
                    <p className="text-slate-200 italic">“{ev.quote}”</p>
                    <footer className="text-[10px] font-mono-telemetry text-slate-400">
                      {ev.document} · p. {ev.page}
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}

            {caseDetail.research_context.disclaimer && (
              <p className="text-[11px] text-amber-300/85 border-t border-slate-800/70 pt-2">
                {caseDetail.research_context.disclaimer}
              </p>
            )}
          </section>
        )}

        <section
          aria-label="Nearest Condition Cases"
          className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-white">
                Nearest Condition Runs
              </h2>
            </div>
            <span className="text-[11px] font-mono-telemetry text-slate-400">
              (O₂, Pressure)
            </span>
          </div>

          {neighborsLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 rounded-lg bg-slate-800/60" />
              <div className="h-10 rounded-lg bg-slate-800/60" />
            </div>
          )}

          {neighborsError && !neighborsLoading && (
            <p className="text-xs text-rose-300">{neighborsError}</p>
          )}

          {!neighborsLoading && !neighborsError && neighbors && (
            <>
              {neighbors.items.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No nearest neighbors computed for this case (missing O₂ or pressure metadata prevents (o2_pct, pressure_kpa) coordinate distance).
                </p>
              ) : (
                <ul className="space-y-2">
                  {neighbors.items.map((item) => {
                    const deltaO2 = formatSignedDelta(
                      item.case.o2_pct,
                      caseDetail.o2_pct,
                      1,
                      "%",
                    );
                    const deltaP = formatSignedDelta(
                      item.case.pressure_kpa,
                      caseDetail.pressure_kpa,
                      1,
                      "kPa",
                    );
                    return (
                      <li key={item.case.case_id} className="flex items-stretch gap-2">
                        <Link
                          to={`/cases/${encodeURIComponent(item.case.case_id)}`}
                          className="flex-1 min-w-0 flex items-center justify-between gap-3 rounded-xl bg-slate-950/65 border border-slate-800/90 px-3 py-2 hover:border-cyan-400/50 transition-colors group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-telemetry text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                                {item.case.case_id}
                              </span>
                              {item.case.fuel && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-200 border border-orange-500/25">
                                  {item.case.fuel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 truncate mt-0.5">
                              {item.case.o2_pct !== null
                                ? `${formatNumber(item.case.o2_pct, 1)}% O₂`
                                : "null O₂"}
                              {" · "}
                              {item.case.pressure_kpa !== null
                                ? `${formatNumber(item.case.pressure_kpa, 1)} kPa`
                                : "null kPa"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(deltaO2 || deltaP) && (
                              <span className="hidden sm:inline-block font-mono-telemetry text-[10px] text-slate-400">
                                {[deltaO2 && `ΔO₂ ${deltaO2}`, deltaP && `ΔP ${deltaP}`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                            <span className="font-mono-telemetry text-xs text-slate-200 px-2 py-1 rounded-md bg-slate-900 border border-slate-700/80">
                              d = {formatNumber(item.distance, 3)}
                            </span>
                          </div>
                        </Link>
                        <button
                          type="button"
                          title={`Compare ${caseDetail.case_id} with ${item.case.case_id}`}
                          onClick={() => {
                            setComparedCases([caseDetail.case_id, item.case.case_id]);
                            setComparisonOpen(true);
                          }}
                          className="shrink-0 px-2.5 rounded-xl bg-slate-950/65 border border-slate-800/90 text-orange-300 hover:border-orange-400/60 hover:bg-orange-500/15 transition-colors flex items-center justify-center cursor-pointer"
                          aria-label={`Compare with ${item.case.case_id}`}
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="text-[11px] text-slate-400 border-t border-slate-800/70 pt-2 leading-relaxed">
                {neighbors.metric}
              </p>
            </>
          )}
        </section>
      </div>

      {/* Earth Applications & Official NASA PSI Investigation Context (F22) */}
      {psiMeta && (
        <section
          aria-label="Earth Applications & NASA PSI Context"
          className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Earth Applications &amp; NASA PSI Investigation Context (F22)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono-telemetry">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-200">
                {psiMeta.accession}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                {psiMeta.flightPlatform}
              </span>
              <a
                href={psiMeta.hardwareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-cyan-500/35 text-cyan-200 hover:border-cyan-400 transition-colors"
              >
                <span>{psiMeta.hardwareName}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div className="lg:col-span-2 rounded-xl bg-slate-950/65 border border-slate-800/90 p-3.5 space-y-1.5">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-emerald-300">
                Research Impacts / Earth Benefits
              </span>
              <p className="text-slate-200">{psiMeta.earthBenefits}</p>
            </div>

            <div className="rounded-xl bg-slate-950/65 border border-slate-800/90 p-3.5 space-y-1.5">
              <span className="block text-[10px] font-mono-telemetry uppercase tracking-wider text-cyan-300">
                Investigation Objectives
              </span>
              <p className="text-slate-300">{psiMeta.objectivesSummary}</p>
              <p className="text-[11px] text-slate-400 pt-1">
                {psiMeta.officialTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/70 pt-2">
            <span>
              Source: NASA Physical Sciences Informatics (PSI) Repository —{" "}
              {psiMeta.accession}, verbatim &ldquo;Research Impacts/Earth
              Benefits&rdquo; metadata; research context only, not a commercial
              validation or safety certification.
            </span>
            <a
              href={psiMeta.psiUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline underline-offset-4 shrink-0"
            >
              <span>Open {psiMeta.accession} on NASA PSI</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
