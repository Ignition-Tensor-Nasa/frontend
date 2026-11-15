import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  ExternalLink,
  Film,
  Flame,
  GitCompare,
  Grid3X3,
  Image as ImageIcon,
  Keyboard,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

type PitchLang = "pl" | "en";
type MediaMode = "gif" | "mp4";

interface BentoPoint {
  title: { pl: string; en: string };
  body: { pl: string; en: string };
  accent: "cyan" | "orange" | "emerald" | "violet";
}

interface KpiMetric {
  label: { pl: string; en: string };
  value: string;
}

interface PitchSlide {
  id: string;
  index: number;
  clipId: string;
  windowLabel: string;
  startSec: number;
  endSec: number;
  tag: { pl: string; en: string };
  shortTitle: { pl: string; en: string };
  headline: { pl: string; en: string };
  subtitle: { pl: string; en: string };
  kpis: KpiMetric[];
  cards: [BentoPoint, BentoPoint, BentoPoint];
  takeaway: { pl: string; en: string };
  liveRoute: string;
  liveLabel: { pl: string; en: string };
  icon: "flame" | "sparkles" | "grid" | "compare" | "activity" | "rocket";
  showArchitecture?: boolean;
}

const TOTAL_PITCH_SECONDS = 180;

const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "problem-vision",
    index: 0,
    clipId: "01_mission_overview",
    windowLabel: "0:00 – 0:25",
    startSec: 0,
    endSec: 25,
    tag: { pl: "01 · PROBLEM & WIZJA", en: "01 · PROBLEM & VISION" },
    shortTitle: { pl: "Ogień w Mikrograwitacji", en: "Microgravity Fire" },
    headline: {
      pl: "Ogień w kosmosie łamie ziemską intuicję — a dane NASA tkwią w surowych arkuszach",
      en: "Space fires break Earth intuition — while NASA PSI telemetry sits fragmented in raw files",
    },
    subtitle: {
      pl: "Dlaczego brak konwekcji zmienia fizykę płomienia i jak PSI-Lens zamienia 358 rozproszonych biegów w centrum dowodzenia.",
      en: "Why zero-buoyancy changes combustion physics and how PSI-Lens unifies 358 NASA runs into one Mission Control.",
    },
    kpis: [
      { label: { pl: "Zweryfikowane biegi", en: "Verified runs" }, value: "358" },
      { label: { pl: "Misje NASA PSI", en: "NASA PSI missions" }, value: "6" },
      { label: { pl: "Od pytania do wykresu", en: "Prompt to telemetry" }, value: "< 2 s" },
    ],
    cards: [
      {
        title: { pl: "Fizyka bez konwekcji", en: "Zero-buoyancy physics" },
        body: {
          pl: "Brak siły wyporu tworzy kuliste płomienie dyfuzyjne, niskotemperaturowe zimne płomienie (Cool Flames) oraz nietypową propagację po tkaninie na pokładzie Cygnus OA-7.",
          en: "Absence of buoyancy produces spherical diffusion flames, low-temperature Cool Flames, and unexpected spacecraft fabric spread aboard Cygnus OA-7.",
        },
        accent: "orange",
      },
      {
        title: { pl: "Fragmentacja surowych danych", en: "Raw NASA PSI silos" },
        body: {
          pl: "Setki niespójnych plików CSV, XLSX i raportów PDF z 6 eksperymentów (CFI/FLEX, CFI-G, E-FIELD, Flame Design, SAME-R, SAFFIRE-III) w różnych jednostkach i częstotliwościach.",
          en: "Hundreds of inconsistent CSV, XLSX, and PDF files across 6 investigations (CFI/FLEX, CFI-G, E-FIELD, Flame Design, SAME-R, SAFFIRE-III) with mixed rates.",
        },
        accent: "cyan",
      },
      {
        title: { pl: "PSI Analysis Dashboard", en: "PSI Analysis Dashboard" },
        body: {
          pl: "Ujednolicony pulpit Mission Control: szybkie filtrowanie Parquet/Polars po stronie backendu i interaktywne wykresy ECharts bez opóźnień sieciowych.",
          en: "A unified Mission Control dashboard backed by pre-curated Parquet/Polars pipelines and fluid multi-panel ECharts visualizations.",
        },
        accent: "emerald",
      },
    ],
    takeaway: {
      pl: "Zamiast godzin ręcznego parsowania arkuszy NASA — 60 sekund od hipotezy badawczej do zweryfikowanego wykresu fizycznego.",
      en: "Turn hours of manual spreadsheet wrangling into a 60-second path from hypothesis to verified NASA telemetry.",
    },
    liveRoute: "/",
    liveLabel: { pl: "Otwórz Live Explorer", en: "Open Live Explorer" },
    icon: "flame",
  },
  {
    id: "scenario-filters",
    index: 1,
    clipId: "02_scenario_filters",
    windowLabel: "0:25 – 0:55",
    startSec: 25,
    endSec: 55,
    tag: { pl: "02 · ASYSTENT SCENARIUSZY", en: "02 · SCENARIO ASSISTANT" },
    shortTitle: { pl: "Asystent AI & Filtry", en: "AI Assistant & Filters" },
    headline: {
      pl: "Od zdania po polsku lub angielsku do zwalidowanych filtrów fizycznych",
      en: "From natural-language scenarios (PL/EN) directly to validated physical constraints",
    },
    subtitle: {
      pl: "Asystent tłumaczy intencję na dokładne zakresy O₂, ciśnienia, paliwa i Z_st, podświetlając zmienione parametry w interfejsie.",
      en: "Translate hypotheses into O₂, pressure, fuel, and Z_st constraints while highlighting modified controls in real time.",
    },
    kpis: [
      { label: { pl: "Języki scenariuszy", en: "Prompt languages" }, value: "PL / EN" },
      { label: { pl: "Zakres tlenu O₂", en: "Observed O₂ span" }, value: "17–40%" },
      { label: { pl: "Ciśnienie absolutne", en: "Absolute pressure" }, value: "51–507 kPa" },
    ],
    cards: [
      {
        title: { pl: "Dwujęzyczny Parser LLM", en: "Bilingual AI Intent Filter" },
        body: {
          pl: "Wpisz np. „Pokaż testy z butanem powyżej 200 kPa i ponad 39% O₂” — model zwraca kompletny, zwalidowany stan filtrów i wywołuje wyszukiwanie w katalogu.",
          en: "Type a scenario such as “Butane >200 kPa & >39% O₂” — the backend validates every bound and updates the exact manual filter state.",
        },
        accent: "cyan",
      },
      {
        title: { pl: "Uczciwa nauka bez halucynacji", en: "Zero fabricated science" },
        body: {
          pl: "AI steruje wyłącznie filtrami; wszystkie wyniki pochodzą ze zweryfikowanego Parquet. Tryby Live AI i Demo są jawnie oznaczone, a błąd LLM nie blokuje pracy ręcznej.",
          en: "AI never invents measurements or safety margins; Live vs Demo mode is explicitly badged, and manual filters always work independently.",
        },
        accent: "emerald",
      },
      {
        title: { pl: "Błyskawiczne Presety Badań", en: "Instant Research Presets" },
        body: {
          pl: "Jednym kliknięciem zawęzisz 358 biegów do kabiny ISS (20–22% O₂, 95–105 kPa), niskociśnieniowych habitatów (45–55 kPa) lub eksperymentów kroplowych CFI (FLEX).",
          en: "Filter 358 runs in one click for ISS Cabin conditions, Low-Pressure habitats, High Z_st flames, or CFI (FLEX) droplet series.",
        },
        accent: "orange",
      },
    ],
    takeaway: {
      pl: "AI przyspiesza eksplorację, ale to deterministyczna walidacja filtrów daje badaczowi 100% powtarzalności.",
      en: "Natural-language speed combined with deterministic server-side range validation and zero guesswork.",
    },
    liveRoute: "/",
    liveLabel: { pl: "Wypróbuj Asystenta", en: "Try Filter Assistant" },
    icon: "sparkles",
  },
  {
    id: "regime-analytics",
    index: 2,
    clipId: "03_regime_analytics",
    windowLabel: "0:55 – 1:30",
    startSec: 55,
    endSec: 90,
    tag: { pl: "03 · MAPA REŻIMÓW & DOWODY", en: "03 · REGIME & SAFETY DECK" },
    shortTitle: { pl: "Heatmap, Galaxy & Dowody", en: "Heatmap, Galaxy & Matrix" },
    headline: {
      pl: "Natychmiastowa mapa przebadanych atmosfer, najbliższych sąsiadów i cytatów NASA",
      en: "Inspect O₂ × Pressure test density, standardized neighbors, and cited NASA safety context",
    },
    subtitle: {
      pl: "Trzy zintegrowane widoki analityczne na ekranie głównym pokazują, gdzie dane są gęste, a gdzie brakuje testów.",
      en: "Three coordinated Explorer modules reveal experimental density, Z_st stoichiometry, and primary-source safety context.",
    },
    kpis: [
      { label: { pl: "Puste komórki mapy", en: "Zero interpolation" }, value: "Honest Gaps" },
      { label: { pl: "Ułamek stechiom. Z_st", en: "Stoichiometry Z_st" }, value: "0.059–0.76" },
      { label: { pl: "Kategorie kontekstu", en: "Context buckets" }, value: "Prev / Det" },
    ],
    cards: [
      {
        title: { pl: "Atmosphere Heatmap", en: "Atmosphere Heatmap" },
        body: {
          pl: "Siatka O₂ × Ciśnienie pokazuje liczbę biegów lub średnie Z_st. Puste pola pozostają puste (brak interpolacji granic bezpieczeństwa), a kliknięcie otwiera listę biegów.",
          en: "Maps O₂ × Pressure cells by run count or mean Z_st without fabricating boundaries; clicking any cell reveals matching runs.",
        },
        accent: "cyan",
      },
      {
        title: { pl: "Condition Galaxy & Z_st", en: "Condition Galaxy & Z_st" },
        body: {
          pl: "Wykres wszystkich warunków z wektorami najbliższych sąsiadów (znormalizowana odległość w (O₂, P)) oraz przełącznikiem na mapę reżimów Z_st × O₂.",
          en: "Interactive O₂–Pressure phase space tracing nearest experimental neighbors plus stoichiometric Z_st × O₂ flammability regimes.",
        },
        accent: "orange",
      },
      {
        title: { pl: "Safety Context Matrix", en: "Safety Context Matrix" },
        body: {
          pl: "Kategoryzacja biegów na Prevention, Detection, Suppression i Unknown wraz z dosłownymi cytatami oraz numerami stron z raportów NASA PSI.",
          en: "Groups runs into Prevention, Detection, Suppression, and Unknown with verbatim quotes and page citations from NASA PSI PDFs.",
        },
        accent: "emerald",
      },
    ],
    takeaway: {
      pl: "Zamiast przeszukiwać dziesiątki PDF-ów, badacz widzi rozkład atmosfery i dowody literaturowe na jednym ekranie.",
      en: "Spot explored habitats and trace NASA primary-source evidence without leaving the main workspace.",
    },
    liveRoute: "/",
    liveLabel: { pl: "Eksploruj Mapy Reżimów", en: "Explore Analytics Deck" },
    icon: "grid",
  },
  {
    id: "cross-run-comparison",
    index: 3,
    clipId: "04_cross_run_comparison",
    windowLabel: "1:30 – 2:05",
    startSec: 90,
    endSec: 125,
    tag: { pl: "04 · PORÓWNYWANIE BIEGÓW", en: "04 · MULTI-CASE OVERLAY" },
    shortTitle: { pl: "Porównanie Multi-Case", en: "Multi-Case Comparison" },
    headline: {
      pl: "Zsynchronizowane zestawienie 2–4 biegów z wyrównaniem do zapłonu i podwójną osią Y",
      en: "Compare 2–4 NASA runs side by side with ignition alignment and automatic dual Y-axes",
    },
    subtitle: {
      pl: "Porównuj gorące i zimne płomienie albo różne misje kosmiczne przy zachowaniu oryginalnych jednostek pomiarowych.",
      en: "Overlay hot vs cool flames or cross-investigation datasets while strictly preserving native physical units.",
    },
    kpis: [
      { label: { pl: "Równoległe biegi", en: "Simultaneous runs" }, value: "2 – 4" },
      { label: { pl: "Wyrównanie czasu", en: "Time sync mode" }, value: "Δt Ignition" },
      { label: { pl: "Różne jednostki", en: "Unit preservation" }, value: "Dual Y-Axis" },
    ],
    cards: [
      {
        title: { pl: "Porównania 1-kliknięciem", en: "Curated 1-click pairs" },
        body: {
          pl: "Gotowe zestawy (np. Hot vs Cool Flame 21174C2 vs 21174C3 lub krople dodekanu FLEX-1249 vs FLEX-1226) plus dowolne przypinanie biegów z tabeli i heatmapy.",
          en: "Launch curated pairs like Hot vs Cool Flame or FLEX Dodecane Droplets instantly, or pin up to 4 custom runs from anywhere.",
        },
        accent: "orange",
      },
      {
        title: { pl: "Wyrównanie do zapłonu (Δt)", en: "Verified ignition alignment" },
        body: {
          pl: "Gdy zbiory zawierają zweryfikowane znaczniki zapłonu w logach, modal przesuwa przebiegi czasowe do wspólnego zera Δt = 0 s.",
          en: "Automatically shifts verified time series to logged ignition Δt = 0 s so burn dynamics align cleanly across runs.",
        },
        accent: "cyan",
      },
      {
        title: { pl: "Bezpieczny Tryb Dual-Axis", en: "Cross-investigation dual axes" },
        body: {
          pl: "Nigdy nie mieszamy różnych wielkości fizycznych na jednej skali — np. ACME [mg/s] i FLEX [mm²] dostają automatycznie oddzielne, kolorowane osie Y.",
          en: "Never mixes incompatible units on one scale — heterogeneous investigations automatically render on dedicated color-coded Y axes.",
        },
        accent: "violet",
      },
    ],
    takeaway: {
      pl: "Bezpośrednie zestawienie różnic w czasie spalania i emisji między dwoma reżimami tlenu oraz ciśnienia.",
      en: "Isolate the exact kinetic impact of O₂ and pressure across experiments in seconds.",
    },
    liveRoute: "/",
    liveLabel: { pl: "Uruchom Porównanie", en: "Open Explorer Queue" },
    icon: "compare",
  },
  {
    id: "telemetry-modes",
    index: 4,
    clipId: "05_telemetry_modes",
    windowLabel: "2:05 – 2:40",
    startSec: 125,
    endSec: 160,
    tag: { pl: "05 · TELEMETRIA & ZIMNE PŁOMIENIE", en: "05 · TELEMETRY & D² LIFECYCLE" },
    shortTitle: { pl: "Time-Series, Scatter & D²", en: "Time-Series, Scatter & D²" },
    headline: {
      pl: "Trzy tryby wizualizacji jednego zbioru JSON + 3-poziomowy cykl życia kropli",
      en: "Zero-refetch chart mode switching plus synchronized 3-tier Cool-Flame lifecycle panels",
    },
    subtitle: {
      pl: "Od klasycznego prawa spalania D² (K = 0.417 mm²/s) po fazy przestrzenne i brushing wielowymiarowy.",
      en: "Switch seamlessly between Time-Series, Scatter Phase Space, and Parallel Coordinates on thousands of cached samples.",
    },
    kpis: [
      { label: { pl: "Stała parowania FLEX-1249", en: "D² burning rate K" }, value: "0.417 mm²/s" },
      { label: { pl: "Dopasowanie liniowe", en: "Linear fit R²" }, value: "0.9998" },
      { label: { pl: "Poziomy cyklu FLEX", en: "Lifecycle tiers" }, value: "3 Linked" },
    ],
    cards: [
      {
        title: { pl: "Hero Time-Series & Prawo D²", en: "Hero Time-Series & D² Law" },
        body: {
          pl: "Płynny zoom i przełączanie kanałów na 1590 próbkach bez zapytań HTTP. Braki danych (null) zostają wyraźną przerwą na wykresie zamiast fałszywego zera.",
          en: "Smooth zoom, crosshair tooltip, and multi-unit split panels. Missing samples stay honest null gaps rather than zeros.",
        },
        accent: "cyan",
      },
      {
        title: { pl: "Scatter & Parallel Coordinates", en: "Scatter & Parallel Coords" },
        body: {
          pl: "Natychmiastowa zmiana perspektywy bez ponownego pobierania danych: wykres fazowy X/Y oraz wielowymiarowe osie z lokalnym zaznaczaniem (brushing).",
          en: "Inspect phase correlations or brush across multiple sensor axes simultaneously in Parallel Coordinates from memory.",
        },
        accent: "violet",
      },
      {
        title: { pl: "Cool-Flame Droplet Lifecycle", en: "Cool-Flame Droplet Deck" },
        body: {
          pl: "Dla misji CFI (FLEX) trzy sprzężone wykresy synchronizują kursor czasu między D/D², średnicą zimnego płomienia (FWHM/P2P) i mocą radiometru.",
          en: "Synchronizes cursor and zoom across Droplet D/D², Cool-Flame FWHM/P2P diameter, and Radiometer power along shared time.",
        },
        accent: "orange",
      },
    ],
    takeaway: {
      pl: "Pełna wierność naukowa (null ≠ 0, dopasowanie backendowe, jednostki) połączona z responsywnością nowoczesnej aplikacji webowej.",
      en: "Scientific fidelity meets fluid 60 fps canvas exploration without desktop tools or notebooks.",
    },
    liveRoute: "/cases/FLEX-1249",
    liveLabel: { pl: "Zobacz FLEX-1249 na żywo", en: "Open FLEX-1249 Live" },
    icon: "activity",
  },
  {
    id: "saffire-architecture",
    index: 5,
    clipId: "06_saffire_mission",
    windowLabel: "2:40 – 3:00",
    startSec: 160,
    endSec: 180,
    tag: { pl: "06 · SAFFIRE-III + ARCHITEKTURA", en: "06 · SAFFIRE-III + ARCHITECTURE" },
    shortTitle: { pl: "Cygnus OA-7 + Stack", en: "Cygnus OA-7 + Stack" },
    headline: {
      pl: "Mission Overview: Pożar na statku Cygnus OA-7 (30 Hz + 1 Hz) i podsumowanie AI",
      en: "SAFFIRE-III spacecraft fire analysis (30 Hz + 1 Hz), AI briefing & Earth fire-safety impact",
    },
    subtitle: {
      pl: "Od czujników spalania próbki SIBAL po telemetrię detektora dymu na statku — i kompletny pipeline danych.",
      en: "Combining chamber combustion dynamics with Cygnus smoke-detector downlink on an end-to-end Polars & React stack.",
    },
    kpis: [
      { label: { pl: "Szczyt temp. próbki (TC11)", en: "Peak surface temp" }, value: "1088 °C" },
      { label: { pl: "Strumień ciepła (Rad 4)", en: "Peak radiant flux" }, value: "169 mW/cm²" },
      { label: { pl: "Opóźnienie detektora FIZ 2", en: "Smoke detector lag" }, value: "23 s" },
    ],
    cards: [
      {
        title: { pl: "4 Sekcje Telemetryczne SAFFIRE-III", en: "4-Section Spacecraft Story" },
        body: {
          pl: "5 zsynchronizowanych paneli 30 Hz (powierzchnia, radiometry, gazy O₂/CO₂), kolejność dotarcia płomienia TC7–TC12, animacja Replay 3 s i 1 Hz telemetria Cygnus.",
          en: "Stacked 30 Hz burn panels, TC7–TC12 flame arrival thresholds (100/300/600 °C), animated 3-s heating replay, and 1 Hz Cygnus FIZ 2 cabin data.",
        },
        accent: "orange",
      },
      {
        title: { pl: "Podsumowanie AI (LLM API)", en: "Bilingual AI Mission Briefing" },
        body: {
          pl: "Dwujęzyczna karta analizy (PL/EN) z wyborem sekcji oraz pytaniem własnym do AI, budująca kontekst ze zweryfikowanych pików i czasów misji.",
          en: "On-demand PL/EN LLM mission briefing with focus presets and custom Q&A grounded strictly in verified telemetry metrics.",
        },
        accent: "cyan",
      },
      {
        title: { pl: "Zastosowania na Ziemi & Wpływ", en: "Earth & Habitat Applications" },
        body: {
          pl: "Każdy bieg linkuje do repozytorium NASA PSI oraz zastosowań w detektorach dymu nowej generacji i bezpieczeństwie kabin orbitalnych oraz księżycowych.",
          en: "Directly informs spacecraft fire-detection thresholds, low-pressure habitat standards, and ultra-sensitive terrestrial smoke sensors.",
        },
        accent: "emerald",
      },
    ],
    takeaway: {
      pl: "Gotowe, skalowalne narzędzie łączące surowe archiwa NASA PSI, analitykę Polars i AI w błyskotliwym interfejsie Mission Control.",
      en: "An end-to-end NASA PSI platform: from raw flight files to AI-assisted scientific insight in three minutes.",
    },
    liveRoute: "/special-cases/SAFFIRE-III-S1",
    liveLabel: { pl: "Otwórz SAFFIRE-III na żywo", en: "Open SAFFIRE-III Live" },
    icon: "rocket",
    showArchitecture: true,
  },
];

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_PITCH_SECONDS, Math.floor(totalSeconds)));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SlideIcon({ kind, className }: { kind: PitchSlide["icon"]; className?: string }) {
  switch (kind) {
    case "flame":
      return <Flame className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "grid":
      return <Grid3X3 className={className} />;
    case "compare":
      return <GitCompare className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "rocket":
      return <Rocket className={className} />;
  }
}

function accentClasses(accent: BentoPoint["accent"]): string {
  switch (accent) {
    case "cyan":
      return "border-cyan-500/35 bg-cyan-950/15 hover:border-cyan-400/55";
    case "orange":
      return "border-orange-500/35 bg-orange-950/15 hover:border-orange-400/55";
    case "emerald":
      return "border-emerald-500/35 bg-emerald-950/15 hover:border-emerald-400/55";
    case "violet":
      return "border-violet-500/35 bg-violet-950/15 hover:border-violet-400/55";
  }
}

function accentBadgeDot(accent: BentoPoint["accent"]): string {
  switch (accent) {
    case "cyan":
      return "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]";
    case "orange":
      return "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]";
    case "emerald":
      return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
    case "violet":
      return "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]";
  }
}

export function PitchDeckPage() {
  const deckRootRef = useRef<HTMLDivElement | null>(null);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [lang, setLang] = useState<PitchLang>("pl");
  const [mediaMode, setMediaMode] = useState<MediaMode>("gif");
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<boolean>(false);

  const slide = PITCH_SLIDES[slideIndex] ?? PITCH_SLIDES[0];

  const goToSlide = useCallback((nextIdx: number, syncTimer = false) => {
    const bounded = Math.max(0, Math.min(PITCH_SLIDES.length - 1, nextIdx));
    setSlideIndex(bounded);
    setMediaError(false);
    if (syncTimer) {
      setElapsedSec(PITCH_SLIDES[bounded].startSec);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        const el = deckRootRef.current ?? document.documentElement;
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Ignore fullscreen denial in non-interactive/test browsers
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => {
        if (prev >= TOTAL_PITCH_SECONDS) {
          setTimerRunning(false);
          return TOTAL_PITCH_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || !autoAdvance) return;
    const targetIdx = PITCH_SLIDES.findIndex(
      (s) => elapsedSec >= s.startSec && elapsedSec < s.endSec,
    );
    if (targetIdx >= 0 && targetIdx !== slideIndex) {
      setSlideIndex(targetIdx);
      setMediaError(false);
    }
  }, [autoAdvance, elapsedSec, slideIndex, timerRunning]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToSlide(slideIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(slideIndex - 1);
      } else if (e.key >= "1" && e.key <= String(PITCH_SLIDES.length)) {
        e.preventDefault();
        goToSlide(Number(e.key) - 1);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToSlide, slideIndex, toggleFullscreen]);

  const mediaUrl = useMemo(
    () => `/pitch/${slide.clipId}.${mediaMode}`,
    [mediaMode, slide.clipId],
  );
  const gifDownloadUrl = `/pitch/${slide.clipId}.gif`;
  const mp4DownloadUrl = `/pitch/${slide.clipId}.mp4`;
  const timerPct = Math.min(100, (elapsedSec / TOTAL_PITCH_SECONDS) * 100);

  return (
    <div
      ref={deckRootRef}
      data-testid="pitch-deck-page"
      className={cn(
        "space-y-4 animate-panel-in",
        isFullscreen && "bg-[#060913] p-5 min-h-screen overflow-y-auto",
      )}
    >
      {/* Top Presenter Bar: Slide selector pills, 3:00 Timer, Media Format, Language & Fullscreen */}
      <section
        aria-label="Presentation controls"
        className="panel-surface rounded-2xl p-3 sm:p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Slide Progress Pills */}
          <nav
            aria-label="Pitch slides"
            className="flex flex-wrap items-center gap-1.5"
          >
            {PITCH_SLIDES.map((item, idx) => {
              const active = idx === slideIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSlide(idx, !timerRunning)}
                  data-testid={`pitch-slide-tab-${idx + 1}`}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-2",
                    active
                      ? "bg-cyan-500/20 border-cyan-400/65 text-white shadow-[0_0_20px_-6px_rgba(34,211,238,0.65)]"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono-telemetry text-[11px] font-bold px-1.5 py-0.5 rounded",
                      active
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-slate-800/90 text-slate-300",
                    )}
                  >
                    0{idx + 1}
                  </span>
                  <div className="hidden xl:block leading-tight">
                    <div className="text-[11px] font-semibold truncate max-w-[130px]">
                      {item.shortTitle[lang]}
                    </div>
                    <div className="text-[9px] font-mono-telemetry text-slate-400">
                      {item.windowLabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Timer + Format + Language + Fullscreen */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3:00 Jury Timer */}
            <div
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/85 px-2.5 py-1.5 text-xs"
              data-testid="pitch-timer-box"
            >
              <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span className="font-mono-telemetry font-bold text-white tabular-nums">
                {formatClock(elapsedSec)} / 03:00
              </span>

              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className={cn(
                  "px-2 py-0.5 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors",
                  timerRunning
                    ? "bg-orange-500/25 text-orange-200 border border-orange-400/40"
                    : "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/30",
                )}
              >
                {timerRunning ? (
                  <>
                    <Pause className="h-3 w-3" />
                    {lang === "pl" ? "Pauza" : "Pause"}
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    {lang === "pl" ? "Start 3:00" : "Start 3:00"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setElapsedSec(0);
                  setSlideIndex(0);
                }}
                title={lang === "pl" ? "Resetuj stoper i wróć do slajdu 1" : "Reset timer & slide"}
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setAutoAdvance((v) => !v)}
                className={cn(
                  "hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono-telemetry border cursor-pointer transition-colors",
                  autoAdvance
                    ? "bg-cyan-500/15 border-cyan-400/45 text-cyan-200"
                    : "bg-slate-900 border-slate-700 text-slate-400",
                )}
                title={
                  lang === "pl"
                    ? "Automatycznie zmieniaj slajdy zgodnie z harmonogramem 3:00"
                    : "Auto-advance slides with 3:00 schedule"
                }
              >
                Auto {autoAdvance ? "ON" : "OFF"}
              </button>
            </div>

            {/* Media Format Switcher (GIF vs MP4) */}
            <div
              role="group"
              aria-label="Slide media format"
              className="inline-flex items-center rounded-xl border border-slate-700/80 bg-slate-950/85 p-0.5 text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setMediaMode("gif");
                  setMediaError(false);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-mono-telemetry font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all",
                  mediaMode === "gif"
                    ? "bg-orange-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                GIF
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaMode("mp4");
                  setMediaError(false);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-mono-telemetry font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all",
                  mediaMode === "mp4"
                    ? "bg-cyan-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <Film className="h-3.5 w-3.5" />
                MP4
              </button>
            </div>

            {/* Language Switcher */}
            <div
              role="group"
              aria-label="Presentation language"
              className="inline-flex items-center rounded-xl border border-slate-700/80 bg-slate-950/85 p-0.5 text-xs font-mono-telemetry"
            >
              <button
                type="button"
                onClick={() => setLang("pl")}
                className={cn(
                  "px-2 py-1 rounded-lg font-semibold cursor-pointer transition-colors",
                  lang === "pl"
                    ? "bg-cyan-500/25 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                PL
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "px-2 py-1 rounded-lg font-semibold cursor-pointer transition-colors",
                  lang === "en"
                    ? "bg-cyan-500/25 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
              className="p-2 rounded-xl border border-slate-700/80 bg-slate-950/85 text-slate-300 hover:text-white hover:border-cyan-400/50 cursor-pointer transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Continuous 3-minute pacing progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80 relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-orange-400 transition-all duration-500"
              style={{
                width: `${timerRunning || elapsedSec > 0 ? timerPct : ((slideIndex + 1) / PITCH_SLIDES.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Bento Grid Slide Stage */}
      <section
        key={slide.id}
        aria-label={slide.shortTitle[lang]}
        className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch"
      >
        {/* Left: Framed Animated GIF / Looping MP4 Viewport */}
        <div className="xl:col-span-7 panel-surface-cyan rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono-telemetry uppercase tracking-wider bg-cyan-500/15 border border-cyan-400/40 text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {slide.tag[lang]}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono-telemetry bg-slate-900/90 border border-slate-700/80 text-slate-300">
                {slide.windowLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono-telemetry">
              <a
                href={gifDownloadUrl}
                download={`${slide.clipId}.gif`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-orange-200 hover:border-orange-400/55 transition-colors"
              >
                <Download className="h-3 w-3" />
                .GIF
              </a>
              <a
                href={mp4DownloadUrl}
                download={`${slide.clipId}.mp4`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-cyan-200 hover:border-cyan-400/55 transition-colors"
              >
                <Download className="h-3 w-3" />
                .MP4
              </a>
            </div>
          </div>

          {/* Browser Bezel Frame */}
          <div className="relative rounded-xl border border-slate-700/80 bg-[#040711] overflow-hidden shadow-[0_24px_60px_-20px_rgba(6,182,212,0.28)]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/90 bg-slate-950/90 text-[10px] font-mono-telemetry text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/75" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/75" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/75" />
                <span className="ml-2 text-slate-300">
                  psi-lens.local{slide.liveRoute}
                </span>
              </div>
              <span className="text-cyan-300 uppercase">
                {slide.clipId}.{mediaMode}
              </span>
            </div>

            <div className="relative aspect-[16/10] w-full bg-[#050812] flex items-center justify-center">
              {mediaError ? (
                <div className="p-6 text-center space-y-2 text-xs text-slate-400">
                  <p className="font-mono-telemetry text-amber-300">
                    {mediaUrl}
                  </p>
                  <p>
                    {lang === "pl"
                      ? "Klip gotowy w folderze public/pitch — uruchom serwer dev/preview, aby wyświetlić podgląd."
                      : "Clip asset served from public/pitch."}
                  </p>
                </div>
              ) : mediaMode === "gif" ? (
                <img
                  key={mediaUrl}
                  src={mediaUrl}
                  alt={slide.headline[lang]}
                  onError={() => setMediaError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  key={mediaUrl}
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setMediaError(true)}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Optional Slide 6 Architecture Strip */}
          {slide.showArchitecture && (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/15 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-mono-telemetry uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {lang === "pl" ? "Architektura:" : "Pipeline:"}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono-telemetry text-slate-200">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  NASA CSV / XLSX / PDF
                </span>
                <span className="text-cyan-400">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-200">
                  Parquet + Polars
                </span>
                <span className="text-cyan-400">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-orange-500/40 text-orange-200">
                  FastAPI + LLM API
                </span>
                <span className="text-cyan-400">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/40 text-emerald-200">
                  React + ECharts
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Structured Bento Copy, KPIs & Jury Takeaway */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-3">
          <div className="panel-surface rounded-2xl p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-orange-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 mt-0.5">
                  <SlideIcon kind={slide.icon} className="h-5 w-5 text-orange-300" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                    {slide.headline[lang]}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {slide.subtitle[lang]}
                  </p>
                </div>
              </div>

              {/* 3 Sharp KPIs */}
              <div className="grid grid-cols-3 gap-2">
                {slide.kpis.map((kpi) => (
                  <div
                    key={kpi.value + kpi.label.en}
                    className="rounded-xl border border-slate-800 bg-slate-950/75 px-3 py-2"
                  >
                    <div className="font-mono-telemetry text-sm sm:text-base font-bold text-cyan-300">
                      {kpi.value}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {kpi.label[lang]}
                    </div>
                  </div>
                ))}
              </div>

              {/* 3 Bento Cards */}
              <div className="space-y-2.5 pt-1">
                {slide.cards.map((card) => (
                  <article
                    key={card.title.en}
                    className={cn(
                      "rounded-xl border p-3 transition-colors space-y-1",
                      accentClasses(card.accent),
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          accentBadgeDot(card.accent),
                        )}
                      />
                      <h2 className="text-xs sm:text-sm font-semibold text-white">
                        {card.title[lang]}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-4">
                      {card.body[lang]}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {/* Bottom Jury Takeaway Callout */}
            <div className="rounded-xl border border-orange-400/40 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-cyan-500/10 p-3 flex items-start gap-2.5">
              <Zap className="h-4 w-4 text-orange-300 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono-telemetry uppercase tracking-wider text-orange-300 font-semibold">
                  {lang === "pl" ? "Kluczowy wniosek dla Jury" : "Jury Takeaway"}
                </div>
                <p className="text-xs font-medium text-slate-100 leading-relaxed">
                  {slide.takeaway[lang]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Presenter Navigation & Live Jump Bar */}
      <footer className="panel-surface rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={slideIndex === 0}
            onClick={() => goToSlide(slideIndex - 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {lang === "pl" ? "Poprzedni" : "Prev"}
          </button>
          <span className="font-mono-telemetry text-xs text-slate-300 px-2">
            {slideIndex + 1} / {PITCH_SLIDES.length}
          </span>
          <button
            type="button"
            disabled={slideIndex === PITCH_SLIDES.length - 1}
            onClick={() => goToSlide(slideIndex + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {lang === "pl" ? "Następny" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[11px] font-mono-telemetry text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Keyboard className="h-3.5 w-3.5 text-cyan-400" />
            ← / → / Space
          </span>
          <span>·</span>
          <span>1–6 {lang === "pl" ? "slajdy" : "slides"}</span>
          <span>·</span>
          <span>F {lang === "pl" ? "pełny ekran" : "fullscreen"}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <Cpu className="h-3.5 w-3.5" />
            public/pitch/*.{mediaMode}
          </span>
        </div>

        <Link
          to={slide.liveRoute}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-500/20 border border-orange-400/55 text-orange-100 hover:bg-orange-400 hover:text-slate-950 transition-colors"
        >
          <span>{slide.liveLabel[lang]}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </div>
  );
}
