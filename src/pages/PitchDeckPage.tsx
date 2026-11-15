import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

interface PitchSlide {
  id: string;
  clipId: string;
  shortTitle: string;
  headline: string;
  description: string;
  liveRoute: string;
  liveLabel: string;
}

const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "mission-overview",
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
    clipId: "04_cross_run_comparison",
    shortTitle: "Cross-Run Compare",
    headline: "Multi-Run Flame Spread Comparison",
    description:
      "Select multiple compatible experiments to inspect synchronized telemetry curves, ignition behavior, and chamber differences side by side.",
    liveRoute: "/",
    liveLabel: "Open Explorer",
  },
  {
    id: "telemetry-modes",
    clipId: "05_telemetry_modes",
    shortTitle: "Signal Telemetry",
    headline: "Interactive Time-Series & Scatter Telemetry",
    description:
      "Switch smoothly between dual-unit time-series traces and paired X/Y scatter correlations directly from loaded run telemetry.",
    liveRoute: "/cases/FLEX-1249",
    liveLabel: "Open Case View",
  },
  {
    id: "saffire-mission",
    clipId: "06_saffire_mission",
    shortTitle: "SAFFIRE-III",
    headline: "SAFFIRE-III Spacecraft Fire Telemetry & AI Briefing",
    description:
      "Cygnus OA-7 spacecraft fire analysis combining 30 Hz thermopile arrays, flame-arrival ordering, and 1 Hz telemetry with an AI mission brief.",
    liveRoute: "/special-cases/SAFFIRE-III-S1",
    liveLabel: "Open SAFFIRE-III",
  },
];

export function PitchDeckPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const deckRef = useRef<HTMLDivElement | null>(null);

  const slide = PITCH_SLIDES[activeIndex];
  const slideCount = PITCH_SLIDES.length;

  const goToSlide = useCallback((idx: number) => {
    setActiveIndex(((idx % slideCount) + slideCount) % slideCount);
  }, [slideCount]);

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
      } else if (event.key >= "1" && event.key <= "6") {
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
  }, [activeIndex, goToSlide, toggleFullscreen]);

  return (
    <div
      ref={deckRef}
      data-testid="pitch-deck-page"
      className={cn(
        "space-y-4",
        isFullscreen && "min-h-screen bg-[#060b14] p-4 sm:p-6 overflow-y-auto",
      )}
    >
      {/* Top control & header bar above the full-width GIF */}
      <section className="panel-surface rounded-2xl p-4 sm:p-5 space-y-3">
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

        {/* Concise Title + Short Description right above the GIF */}
        <div className="pt-1 border-t border-white/10 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {slide.headline}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-5xl">
            {slide.description}
          </p>
        </div>
      </section>

      {/* Full-width animated GIF stage */}
      <section className="panel-surface-cyan rounded-2xl p-2 sm:p-3">
        <div className="w-full overflow-hidden rounded-xl bg-slate-950/90 border border-cyan-400/20">
          <img
            key={slide.clipId}
            src={`/pitch/${slide.clipId}.gif`}
            alt={slide.headline}
            className="w-full h-auto block"
          />
        </div>
      </section>
    </div>
  );
}
