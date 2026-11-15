# PSI-Lens - LaTeX Beamer Pitch Deck (7 Slides)

A standalone, Overleaf-ready **7-slide** LaTeX Beamer presentation (`16:9`) built to satisfy the NASA Space Apps Challenge **Creating a Compelling Demo** requirements and strict **7-slide Global Judging limit**.

## Slide Breakdown (Exactly 7 Frames)

1. **Slide 1 - Title, Challenge & Preview:** Project identity (`PSI-Lens`), selected challenge (*Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data*), team name (`\TeamName`), alphabetical team member roster, and full Mission Control UI preview.
2. **Slide 2 - Why Fire in Space Breaks Every Earth Rule:** Non-technical explanation of buoyancy vs. microgravity combustion and how PSI-Lens replaces scattered archives with one visual entry point.
3. **Slide 3 - User Experience:** Three-step workflow (`Describe Any Scenario -> Validated Live Controls -> Inspect & Verify Sources`) alongside a live screenshot of active filters, heatmap bins, and run catalog.
4. **Slide 4 - Powered by NASA Open Data & Space Tech:** Coverage across all 6 NASA PSI investigations (`PSI-159`, `PSI-39`, `PSI-10`, `PSI-100 SAFFIRE-III`, `PSI-22`, `PSI-101`) and the Parquet + Polars + FastAPI + ECharts pipeline.
5. **Slide 5 - Spacecraft Fire Telemetry (`SAFFIRE-III`):** 30 Hz multi-sensor Cygnus OA-7 burn telemetry visualization, measured peak KPIs (`1088 °C`, `169 mW/cm²`, `23 s`), and scientific data-integrity commitments (`null` preservation, separated axes).
6. **Slide 6 - Atmospheric Regimes & Cross-Run Comparison:** Dual project screenshots showing Condition Galaxy (`O2 × Pressure`) and Multi-Run Telemetry Comparison aligned to ignition (`Δt`).
7. **Slide 7 - Impact, Team & NASA Space Apps 2026:** Audience impact summary, team name and members, event details, Challenge URL, and Reference Video URL.

## Customizing Team Name

Open `main.tex` and update line 19 if your registered NASA Space Apps team name differs from the placeholder:

```latex
\newcommand{\TeamName}{Team PSI-Lens}
```

## How to Compile

### Overleaf (Recommended)
1. Upload the entire `latex-slides/` folder (including `main.tex` and `images/`).
2. Keep compiler set to `pdfLaTeX` (also works with `XeLaTeX` / `LuaLaTeX`).
3. Click **Recompile** and export your 7-page PDF.

### Local TeX Live
```bash
cd latex-slides
pdflatex main.tex && pdflatex main.tex
```
