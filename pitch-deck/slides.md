---
theme: default
title: PSI-Lens - Mission Control for NASA Microgravity Combustion
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 980
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

<div class="h-full flex flex-col justify-between py-1">
  <div class="space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-400/35">
        NASA Physical Sciences Informatics · Mission Control
      </span>
      <span class="px-3 py-1 rounded-full text-xs font-mono text-orange-300 bg-orange-500/10 border border-orange-400/30">
        PSI-LENS // 3-Minute Jury Pitch
      </span>
    </div>
    <div class="px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-400/45 text-lg font-bold tracking-tight text-white leading-snug">
      <span class="text-orange-300">Challenge:</span> Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data
    </div>
  </div>

  <div class="space-y-4 max-w-4xl">
    <div class="text-5xl font-extrabold tracking-tight leading-tight text-white">
      Fire in Space Breaks<br />
      <span class="bg-gradient-to-r from-cyan-300 via-sky-300 to-orange-300 bg-clip-text text-transparent">
        Every Earth Intuition
      </span>
    </div>
    <p class="text-lg text-slate-300 leading-relaxed max-w-3xl">
      <strong>PSI-Lens</strong> turns 358 fragmented NASA Physical Sciences Informatics CSV &amp; XLSX experiments into one real-time Mission Control dashboard - from natural-language hypothesis to verified spacecraft fire telemetry.
    </p>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="metric-pill rounded-xl px-4 py-3">
      <div class="text-2xl font-bold font-mono text-cyan-300">358</div>
      <div class="text-xs text-slate-400 mt-0.5">Verified NASA PSI Combustion Runs</div>
    </div>
    <div class="metric-pill rounded-xl px-4 py-3">
      <div class="text-2xl font-bold font-mono text-orange-300">6 Missions</div>
      <div class="text-xs text-slate-400 mt-0.5">CFI/FLEX · E-FIELD · Flame Design · SAME-R · SAFFIRE-III</div>
    </div>
    <div class="metric-pill rounded-xl px-4 py-3">
      <div class="text-2xl font-bold font-mono text-emerald-300">30 Hz + 1 Hz</div>
      <div class="text-xs text-slate-400 mt-0.5">Parquet + Polars Streaming &amp; LLM Briefing</div>
    </div>
  </div>

  <div class="pt-3 border-t border-white/10 space-y-1.5 text-sm text-slate-200">
    <div>
      <span class="font-mono font-semibold uppercase text-cyan-300 mr-2">NASA Sources:</span>
      <span class="font-medium">psi.nasa.gov (PSI-159 CFI-G · PSI-39 CFI/FLEX · PSI-10 Flame Design · PSI-100 SAFFIRE-III · PSI-22 E-FIELD · PSI-101 SAME-R) · GRC · NTRS</span>
    </div>
    <div>
      <span class="font-mono font-semibold uppercase text-orange-300 mr-2">Created By:</span>
      <span class="font-semibold text-white">Marcel Bieżuński · Mateusz Frąckowiak · Jakub Grabowski · Jakub Więcław · Bartosz Żelek</span>
    </div>
  </div>
</div>

<!--
Opening (0:00–0:25):
In microgravity, there is no buoyancy-driven convection - flames form spheres, burn colder as "cool flames", and spread along spacecraft walls in counterintuitive ways.
NASA's PSI archive holds these real experiments across hundreds of inconsistent CSVs and Excel sheets. We built PSI-Lens so researchers and mission engineers can explore 358 runs across 6 NASA investigations in seconds.
-->

---
title: Microgravity Combustion & Mission Overview
---

<div class="h-full flex flex-col gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>Microgravity Combustion &amp; Mission Overview</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Unified mission-control dashboard spotlighting featured ISS experiments and Cygnus OA-7 SAFFIRE-III runs right on entry.
    </p>
  </div>

  <div class="gif-stage rounded-xl p-2 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
    <img src="/pitch/01_mission_overview.gif" alt="Mission Overview" class="h-full w-full object-contain rounded-lg" />
  </div>
</div>

<!--
Slide 2 (0:25–0:50):
When you open PSI-Lens, you immediately see our featured Mission Overview cards alongside the full filtered experiment catalog - dark aerospace ergonomics engineered for fast exploration without hunting through spreadsheets.
-->

---
title: Natural-Language Scenario Filter Assistant
---

<div class="h-full flex flex-col gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>Natural-Language Scenario Filter Assistant</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Translate plain-English combustion hypotheses into validated O₂, pressure, fuel, and mission filters with live control highlights.
    </p>
  </div>

  <div class="gif-stage rounded-xl p-2 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
    <img src="/pitch/02_scenario_filters.gif" alt="Scenario Filter Assistant" class="h-full w-full object-contain rounded-lg" />
  </div>
</div>

<!--
Slide 3 (0:50–1:15):
Instead of remembering exact NASA dataset codes, a user types a scenario - e.g., elevated oxygen or low spacecraft cabin pressure. Our assistant emits a validated filter state, flashes changed controls in the UI, and preserves manual control at every step.
-->

---
title: Atmospheric Regime & Parameter Explorer
---

<div class="h-full flex flex-col gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>Atmospheric Regime &amp; Parameter Explorer</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Visualize verified case density across oxygen and pressure envelopes alongside ISS and exploration spacecraft reference regimes.
    </p>
  </div>

  <div class="gif-stage rounded-xl p-2 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
    <img src="/pitch/03_regime_analytics.gif" alt="Atmospheric Regime Explorer" class="h-full w-full object-contain rounded-lg" />
  </div>
</div>

<!--
Slide 4 (1:15–1:40):
Beyond the table, the Regime Explorer maps real experiment coverage over O2% vs. Pressure, Z_st flammability distributions, and NASA context tags - never inventing unmeasured data points or fake safety contours.
-->

---
title: Multi-Run Flame Spread Comparison
---

<div class="h-full flex flex-col gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>Multi-Run Flame Spread Comparison</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Pin compatible experiments to inspect synchronized telemetry curves, ignition behavior, and chamber differences side by side.
    </p>
  </div>

  <div class="gif-stage rounded-xl p-2 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
    <img src="/pitch/04_cross_run_comparison.gif" alt="Cross-Run Comparison" class="h-full w-full object-contain rounded-lg" />
  </div>
</div>

<!--
Slide 5 (1:40–2:00):
Users can pin runs right from the catalog into a comparison queue and overlay synchronized sensors across chamber pressures or oxygen concentrations in one click.
-->

---
title: Interactive Time-Series & Scatter Telemetry
---

<div class="h-full flex flex-col gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>Interactive Time-Series &amp; Scatter Telemetry</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Switch smoothly between dual-unit time-series traces and paired X/Y scatter correlations from pre-loaded Parquet JSON.
    </p>
  </div>

  <div class="gif-stage rounded-xl p-2 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
    <img src="/pitch/05_telemetry_modes.gif" alt="Time-Series and Scatter Telemetry" class="h-full w-full object-contain rounded-lg" />
  </div>
</div>

<!--
Slide 6 (2:00–2:25):
Inside any case view, dual-unit ECharts panels keep temperatures, radiometer heat flux, and droplet diameters cleanly separated, while instant Line/Scatter toggling reuses in-memory JSON with zero extra API round-trips.
-->

---
title: SAFFIRE-III Spacecraft Fire Telemetry & AI Briefing
---

<div class="h-full flex flex-col gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>SAFFIRE-III Spacecraft Fire Telemetry &amp; AI Briefing</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Dedicated Cygnus OA-7 fire analysis combining 30 Hz thermopile arrays, flame-arrival ordering, and 1 Hz downlink with an AI summary.
    </p>
  </div>

  <div class="gif-stage rounded-xl p-2 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
    <img src="/pitch/06_saffire_mission.gif" alt="SAFFIRE-III Mission Overview" class="h-full w-full object-contain rounded-lg" />
  </div>
</div>

<!--
Slide 7 (2:25–2:50):
Our flagship spotlight is NASA PSI-100 SAFFIRE-III aboard Cygnus OA-7: we synchronize 30 Hz chamber thermocouples and radiometers with 1 Hz spacecraft smoke-detector downlink and a focus-aware LLM mission briefing grounded strictly in measured peaks.
-->

---
title: Pipeline & Architecture
---

<div class="h-full flex flex-col justify-between gap-3">
  <div class="panel-header rounded-xl px-4 py-2.5 shrink-0">
    <h1>Scientific Data Integrity at Mission-Control Speed</h1>
    <p class="text-xs text-slate-300 mt-1 mb-0">
      Pre-curated Parquet + Polars pipelines power sub-second JSON responses while keeping every chart strictly faithful to NASA measurements.
    </p>
  </div>

  <div class="gif-stage rounded-xl px-6 py-4 flex-1 min-h-0 flex items-center justify-center overflow-hidden">

```mermaid {theme: 'dark', scale: 0.78}
flowchart LR
  A["NASA PSI Files\n(CSV · XLSX)"] --> B["Offline Prep\n(Parquet)"]
  B --> C["FastAPI + Polars\n(JSON API)"]
  C --> D["LLM Assistant\n(& Briefing)"]
  C --> E["React + ECharts\n(Mission Control)"]
  D --> E
```

  </div>

  <div class="grid grid-cols-4 gap-3 shrink-0">
    <div class="metric-pill rounded-xl px-3 py-2">
      <div class="text-xs font-semibold text-cyan-300">Parquet + Polars</div>
      <div class="text-[11px] text-slate-400">Zero per-request CSV parsing</div>
    </div>
    <div class="metric-pill rounded-xl px-3 py-2">
      <div class="text-xs font-semibold text-orange-300">Real Physics Units</div>
      <div class="text-[11px] text-slate-400">Nulls preserved · dual axes</div>
    </div>
    <div class="metric-pill rounded-xl px-3 py-2">
      <div class="text-xs font-semibold text-emerald-300">SAFFIRE-III Bespoke</div>
      <div class="text-[11px] text-slate-400">30 Hz + 1 Hz Cygnus sync</div>
    </div>
    <div class="metric-pill rounded-xl px-3 py-2">
      <div class="text-xs font-semibold text-sky-300">Open Live Explorer</div>
      <div class="text-[11px] text-slate-400">psi-lens // ready to demo</div>
    </div>
  </div>
</div>

<!--
Closing (2:50–3:00):
Under the hood: offline ETL normalizes NASA CSV/XLSX into Parquet, FastAPI + Polars serve typed JSON in milliseconds, and React + Apache ECharts render crisp telemetry with zero fabricated safety claims. Thank you - happy to open the live dashboard for Q&A!
-->
