import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  GraduationCap,
  Layers,
  Maximize2,
  Minimize2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

interface NasaSourceRef {
  accession: string;
  label: string;
  platform: string;
  summary: string;
  url: string;
}

const NASA_SOURCES: NasaSourceRef[] = [
  {
    accession: "PSI-159",
    label: "ACME CFI-G",
    platform: "ISS · CIR",
    summary:
      "Gaseous normal and inverse cool diffusion flames (propane, n-butane, n-pentane) across Z_st, T_ad, radiometers, and PMT sensors.",
    url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-159",
  },
  {
    accession: "PSI-39",
    label: "CFI (FLEX)",
    platform: "ISS · MDCA / CIR",
    summary:
      "n-Dodecane and iso-dodecane droplet combustion across 0.25-5 atm capturing droplet diameter (D²) decay and cool-flame extinction.",
    url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-39",
  },
  {
    accession: "PSI-10",
    label: "ACME Flame Design",
    platform: "ISS · ACME / CIR",
    summary:
      "Spherical ethylene and methane diffusion flames measuring soot-inception limits, N2/CO2 dilution, and pressure boundaries.",
    url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-10",
  },
  {
    accession: "PSI-100",
    label: "SAFFIRE-III",
    platform: "Cygnus OA-7",
    summary:
      "Large-scale 0.4 x 0.94 m SIBAL cloth fire with 30 Hz chamber thermocouples (1088 °C peak) synced to 1 Hz Cygnus downlink telemetry.",
    url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-100",
  },
  {
    accession: "PSI-22",
    label: "ACME E-FIELD",
    platform: "ISS · ACME / CIR",
    summary:
      "Laminar diffusion flames under electric fields tracking applied voltage, chemi-ion current, soot behavior, and near-limit lift.",
    url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-22",
  },
  {
    accession: "PSI-101",
    label: "SAME-R",
    platform: "ISS · NTRS / PSI",
    summary:
      "Microgravity smoke aerosol particulate sizing and transport data benchmarking spacecraft smoke-detector sensitivity.",
    url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
  },
];

const TEAM_CREATORS = [
  "Marcel Bieżuński",
  "Mateusz Frąckowiak",
  "Jakub Grabowski",
  "Jakub Więcław",
  "Bartosz Żelek",
];

interface PitchSlide {
  id: string;
  kind: "intro" | "sources" | "gif";
  clipId?: string;
  shortTitle: string;
  headline: string;
  description: string;
  liveRoute: string;
  liveLabel: string;
}

const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "introduction",
    kind: "intro",
    shortTitle: "Introduction",
    headline: "What Is PSI-Lens?",
    description:
      "One unified mission-control dashboard turning terabytes of scattered NASA combustion archives and hundreds of papers into interactive, filterable science.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
  {
    id: "nasa-data-sources",
    kind: "sources",
    shortTitle: "NASA Data & Workflow",
    headline: "Inside the NASA PSI Dataset & Workflow",
    description:
      "PSI-Lens normalizes 358 verified runs across 6 NASA investigations from raw CSV, XLSX, and technical reports into filterable, chart-ready telemetry.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
  {
    id: "mission-overview",
    kind: "gif",
    clipId: "01_mission_overview",
    shortTitle: "Mission Overview",
    headline: "Microgravity Combustion & Mission Overview",
    description:
      "Unified mission-control dashboard turning 358 NASA PSI runs into explorable telemetry, spotlighting Cygnus OA-7 SAFFIRE-III.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
  {
    id: "scenario-filters",
    kind: "gif",
    clipId: "02_scenario_filters",
    shortTitle: "Scenario Filters",
    headline: "Natural-Language Scenario Filter Assistant",
    description:
      "Translate plain-English combustion hypotheses into validated O₂, pressure, fuel, and mission filters with live highlight feedback.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
  {
    id: "regime-analytics",
    kind: "gif",
    clipId: "03_regime_analytics",
    shortTitle: "Regime Map",
    headline: "Atmospheric Regime & Parameter Explorer",
    description:
      "Visualize verified case density across oxygen and pressure envelopes alongside ISS and exploration spacecraft reference regimes.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
  {
    id: "cross-run-comparison",
    kind: "gif",
    clipId: "04_cross_run_comparison",
    shortTitle: "Cross-Run Compare",
    headline: "Multi-Run Flame Spread Comparison",
    description:
      "Select multiple compatible experiments to inspect synchronized telemetry curves, ignition behavior, and chamber differences side by side.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
];

let nextGifPlayNonce = 0;

export function PitchDeckPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gifPlayNonce, setGifPlayNonce] = useState(() => (nextGifPlayNonce += 1));
  const [activeGifSrc, setActiveGifSrc] = useState<string | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const gifBlobCacheRef = useRef<Record<string, Blob>>({});
  const activeObjectUrlRef = useRef<string | null>(null);

  const slide = PITCH_SLIDES[activeIndex];
  const slideCount = PITCH_SLIDES.length;

  const activateSlideMedia = useCallback((nextIdx: number) => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    const targetSlide = PITCH_SLIDES[nextIdx];
    if (targetSlide?.kind !== "gif" || !targetSlide.clipId) {
      setActiveGifSrc(null);
      return;
    }

    const clipId = targetSlide.clipId;
    const nonce = (nextGifPlayNonce += 1);
    setGifPlayNonce(nonce);

    const cachedBlob = gifBlobCacheRef.current[clipId];
    if (cachedBlob && typeof URL.createObjectURL === "function") {
      const objectUrl = URL.createObjectURL(cachedBlob);
      activeObjectUrlRef.current = objectUrl;
      setActiveGifSrc(objectUrl);
      return;
    }

    setActiveGifSrc(`/pitch/${clipId}.gif?play=${nonce}`);

    const isJsdom =
      typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
    if (!isJsdom && typeof fetch === "function") {
      void fetch(`/pitch/${clipId}.gif`)
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => {
          if (blob) {
            gifBlobCacheRef.current[clipId] = blob;
          }
        })
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
    };
  }, []);

  const goToSlide = useCallback(
    (idx: number) => {
      const normalized = ((idx % slideCount) + slideCount) % slideCount;
      setActiveIndex(normalized);
      activateSlideMedia(normalized);
    },
    [activateSlideMedia, slideCount],
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await (deckRef.current ?? document.documentElement).requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen rejection in non-interactive browser contexts
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goToSlide(activeIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(activeIndex - 1);
      } else if (event.key >= "1" && event.key <= String(slideCount)) {
        event.preventDefault();
        goToSlide(Number(event.key) - 1);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, goToSlide, slideCount, toggleFullscreen]);

  const stageHeightClass = isFullscreen
    ? "min-h-[calc(100vh-195px)]"
    : "min-h-[calc(100vh-300px)]";

  return (
    <div
      ref={deckRef}
      data-testid="pitch-deck-page"
      className={cn(
        "space-y-3",
        isFullscreen && "min-h-screen bg-[#060b14] p-4 sm:p-5 overflow-y-auto",
      )}
    >
      {/* Top control & header bar above the stage */}
      <section className="panel-surface rounded-2xl p-3.5 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Slide selector pills */}
          <nav
            aria-label="Presentation slides"
            className="flex flex-wrap items-center gap-1.5"
          >
            {PITCH_SLIDES.map((item, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`pitch-slide-tab-${idx + 1}`}
                  onClick={() => goToSlide(idx)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
                      : "bg-slate-900/60 text-slate-400 border border-white/10 hover:text-slate-100 hover:border-white/25",
                  )}
                >
                  <span className="font-mono text-[11px] opacity-80">
                    0{idx + 1}
                  </span>
                  <span>{item.shortTitle}</span>
                </button>
              );
            })}
          </nav>

          {/* Compact navigation, live-app link, and fullscreen action */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              aria-label="Previous slide"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-900/60 text-slate-300 border border-white/10 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="px-2 font-mono text-xs text-slate-400 tabular-nums">
              0{activeIndex + 1} / 0{slideCount}
            </span>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              aria-label="Next slide"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-900/60 text-slate-300 border border-white/10 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <Link
              to={slide.liveRoute}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-cyan-500/15 text-cyan-200 border border-cyan-400/35 hover:bg-cyan-500/25 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {slide.liveLabel}
            </Link>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="inline-flex items-center justify-center rounded-lg p-1.5 bg-slate-900/60 text-slate-300 border border-white/10 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Concise Title + Short Description right above the stage */}
        <div className="pt-1 border-t border-white/10 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {slide.headline}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-5xl">
            {slide.description}
          </p>
        </div>
      </section>

      {/* Stage: Slide 1 Intro, Slide 2 NASA Data & Workflow, or Slides 3-6 GIF */}
      <section className="panel-surface-cyan rounded-2xl p-2">
        {slide.kind === "gif" && slide.clipId && (
          <div className="w-full overflow-hidden rounded-xl bg-slate-950/90 border border-cyan-400/20 flex items-center justify-center">
            <img
              key={`${slide.clipId}-${gifPlayNonce}`}
              src={activeGifSrc ?? `/pitch/${slide.clipId}.gif?play=${gifPlayNonce}`}
              alt={slide.headline}
              className={cn(
                "w-full object-contain block",
                isFullscreen
                  ? "max-h-[calc(100vh-175px)]"
                  : "max-h-[calc(100vh-280px)]",
              )}
            />
          </div>
        )}

        {slide.kind === "intro" && (
          <div
            data-testid="pitch-intro-stage"
            className={cn(
              "w-full rounded-xl bg-slate-950/90 border border-cyan-400/20 p-6 sm:p-8 flex flex-col justify-between gap-5",
              stageHeightClass,
            )}
          >
            {/* Main thesis */}
            <div className="space-y-4 w-full">
              <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-mono uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                NASA Physical Sciences Informatics · Single Entry Point
              </span>
              <div
                data-testid="pitch-challenge-banner"
                className="rounded-xl px-5 py-4 bg-orange-500/15 border border-orange-400/50"
              >
                <p className="text-xl sm:text-[26px] font-extrabold tracking-tight text-white leading-snug">
                  <span className="text-orange-300">Challenge:</span>{" "}
                  Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data
                </p>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Stop Digging Through Terabytes of Raw Data &amp; Hundreds of Papers
              </h2>
            </div>

            {/* Who it is built for — compact cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-900/75 border border-cyan-400/25 px-5 py-4 flex items-center">
                <div className="inline-flex items-center gap-2.5 text-cyan-300 text-base sm:text-[19px] font-semibold">
                  <GraduationCap className="w-5 h-5 shrink-0" />
                  <span>Students</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/75 border border-orange-400/25 px-5 py-4 flex items-center">
                <div className="inline-flex items-center gap-2.5 text-orange-300 text-base sm:text-[19px] font-semibold">
                  <Wrench className="w-5 h-5 shrink-0" />
                  <span>Engineers</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/75 border border-emerald-400/25 px-5 py-4 flex items-center">
                <div className="inline-flex items-center gap-2.5 text-emerald-300 text-base sm:text-[19px] font-semibold">
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <span>Professors &amp; Researchers</span>
                </div>
              </div>
            </div>

            {/* Creators footer — prominent tiles */}
            <div className="flex-1 flex flex-col justify-center pt-4 border-t border-white/10 space-y-3">
              <div className="text-base sm:text-lg font-mono font-bold uppercase tracking-wider text-orange-300">
                Created By
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {TEAM_CREATORS.map((author) => (
                  <span
                    key={author}
                    className="inline-flex items-center justify-center text-center rounded-2xl px-4 py-6 sm:py-7 text-lg sm:text-xl font-extrabold tracking-tight bg-slate-900/95 border border-orange-400/45 text-white shadow-[0_0_20px_rgba(251,146,60,0.12)]"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {slide.kind === "sources" && (
          <div
            data-testid="pitch-sources-stage"
            className={cn(
              "w-full rounded-xl bg-slate-950/90 border border-cyan-400/20 p-6 sm:p-7 flex flex-col justify-between gap-6",
              stageHeightClass,
            )}
          >
            {/* Unified workflow cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-2xl bg-slate-900/85 border border-cyan-400/25 p-5 sm:p-6 flex items-center">
                <div className="flex items-center gap-3 text-cyan-300 text-lg sm:text-2xl font-bold">
                  <Database className="w-6 h-6 shrink-0" />
                  <span>Condenses &amp; Groups</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/85 border border-orange-400/25 p-5 sm:p-6 flex items-center">
                <div className="flex items-center gap-3 text-orange-300 text-lg sm:text-2xl font-bold">
                  <Sparkles className="w-6 h-6 shrink-0" />
                  <span>Natural Language + Filters</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/85 border border-emerald-400/25 p-5 sm:p-6 flex items-center">
                <div className="flex items-center gap-3 text-emerald-300 text-lg sm:text-2xl font-bold">
                  <Layers className="w-6 h-6 shrink-0" />
                  <span>Visualizes &amp; Routes</span>
                </div>
              </div>
            </div>

            {/* Expanded NASA Data Sources breakdown */}
            <div className="flex-1 flex flex-col justify-between space-y-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-cyan-300">
                  NASA Data Sources (PSI Repository · GRC · NTRS)
                </div>
                <span className="text-xs sm:text-sm text-slate-300">
                  Original units &amp; sampling rates preserved - click any investigation to open NASA PSI
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                {NASA_SOURCES.map((src) => (
                  <a
                    key={src.accession}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl bg-slate-900/90 border border-cyan-400/25 hover:border-cyan-400/70 p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <div className="inline-flex items-center gap-1.5 text-base font-bold text-white group-hover:text-cyan-200 whitespace-nowrap">
                        <span className="font-mono text-cyan-300 whitespace-nowrap shrink-0">
                          {src.accession}
                        </span>
                        <span className="text-slate-400 shrink-0">·</span>
                        <span>{src.label}</span>
                      </div>
                      <span className="rounded-md px-2 py-0.5 text-xs font-mono font-semibold bg-slate-950 text-orange-300 border border-orange-400/25 whitespace-nowrap shrink-0">
                        {src.platform}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      {src.summary}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
