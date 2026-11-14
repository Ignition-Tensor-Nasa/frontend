PSI-Lens — Frontend hackathon guide
Goal: a flashy, credible proof of concept
Build a polished mission-control dashboard that makes NASA combustion data feel immediately explorable. Optimize for a memorable 60–90 second demo, not complete dataset coverage or a production analytics platform. Spend more time on the first screen, chart interaction, and transitions than on infrastructure.

Demo story: choose/type a scenario → filters visibly update → cases appear → open a run → explore its signals → switch visualization → return to results.

This guide is self-contained. Use it as the frontend repository's AGENTS.md or attach it to a task. Implement only the named feature ID, then stop. Report missing dependencies instead of implementing the whole backlog. These feature IDs separate the mandatory demo path from optional hackathon features.

Hackathon scope: mandatory and optional
Scope	Focus	Rule
Mandatory — F00–F09	A striking explorer, assistant-driven filters, real case data, fluid charts, and a rehearsable story	Complete this path. Visual polish is mandatory, not an optional finishing touch.
Optional — F10–F22	Heatmap, comparison, specialized scientific views, similarity, richer interaction	In hackathon scope when explicitly selected; choose by visual payoff and available real data.
These are the only feature categories. Optional does not mean an implied next phase: recommend features based on actual data and remaining hackathon time, and never implement the whole menu unprompted.

Visual direction and shortcuts
Stack: React + Vite + TypeScript + Tailwind CSS + shadcn/ui, TanStack Table v8, and Apache ECharts. Inspect existing work before scaffolding. No Streamlit/Gradio substitution or generic admin-template finish.
Design for the demo laptop first, around 1440×900. Use a dark aerospace palette, large confident typography, luminous cyan/orange accents, atmospheric background, crisp cards, and a strong visual hierarchy. A little theatrical polish is welcome. Do not let decoration obscure actual scientific labels or interactions.
Explorer layout: strong header, prominent scenario input, compact filter rail, and a readable results area. Case layout: striking identity/parameter strip, generous chart canvas, and a small set of obvious controls.
Use deliberate motion: filter-chip highlights when the assistant applies values, smooth chart updates, subtle panel entrance, and good hover/selection feedback. Respect reduced-motion settings and retain readable contrast/keyboard focus.
Curated data, a fixed set of filter controls, hand-picked chart defaults, and a small API client are encouraged. No schema-driven form engine, elaborate state framework, design-system project, or mandatory worker/virtualization pipeline.
Backend returns all matches from a small curated catalogue (under 200 cases). Local TanStack sorting is fine; no server pagination or infinite scroll is needed.
Keep explorer state in memory when opening/returning from a case; no persistence infrastructure is needed for this interaction.
Build against small matching fixtures if the backend is unavailable. Fixture/ rehearsed mode must have a visible demo badge; never silently replace a failed real API response with invented NASA results or call cached output live AI.
Keep the product focused
Frontend owns UI, browser state, CSV parsing, and charts. Backend owns case search, available filter values, case metadata/CSV delivery, and all LLM calls/credentials. No browser LLM keys, chart-specific API endpoints, or bulk measurement prefetch.

Core: explorer, assistant-to-filter interaction, case page, one excellent time-series view, scatter toggle, and CSV download. Once that works, choose optional visuals one at a time. UMAP, parallel coordinates, comparison, and domain panels remain available below, but do not build them merely to tick every idea off. Accounts and an all-purpose scientific chatbot are outside the demo's purpose.

Flashy does not mean fake science: nulls are not zeros; units and source references stay visible. Never fabricate safety zones, confidence bands, measured lunar/Mars tests, or an extinction marker. A metadata note may explain a run without claiming new analysis. Show a brief “research demo, not a safety assessment” label.

Mandatory features — F00–F09
Each row is a separate task, not one giant dashboard prompt. Dependencies refer to frontend work; use the inline API shapes as fixtures until real endpoints exist.

ID	Functionality	Requires
F00	Visual shell and routes	None
F01	Minimal API client and labelled fixtures	F00
F02	Manual filters and active chips	F01
F03	Results table and explorer wiring	F02
F04	Assistant-to-filter interaction	F03
F05	Case page and dataset selection	F01; F03 for navigation
F06	Selected CSV loading	F05
F07	Hero time-series chart	F06
F08	Scatter visualization toggle	F07
F09	Demo choreography and visual polish	Core journey working
First connect F00 → F01 → F02 → F03 → F05 → F06 → F07. Then add F04 and F08, and reserve real time for F09. The assistant is part of the intended demo, but its availability must not block the manual path. Optional visuals are listed separately; reserve time for presentation polish instead of filling every panel.

F00 — Visual shell and routes
Build: a distinctive app shell, header, typography/colors, panel treatments, explorer /, and case route /cases/:caseId. Establish the visual identity as part of this feature, not as a separate deferred styling pass.
Done when: the desktop screen already feels presentation-ready and primary actions are obvious. Narrow screens remain usable without a full mobile redesign.
Do not build: the assistant, real table, or decorative fake science charts.
F01 — Minimal API client and labelled fixtures
Build: one configured API base URL, typed request functions, and tiny matching fixtures for independent development. One flag selects real versus fixture mode.
Done when: both modes use the same payloads and a failed real request produces a clear error/retry rather than an invisible fallback. Demo mode is visibly badged.
Do not build: generated SDKs, complex caching, revision negotiation, or a general-purpose mock-server framework unless already present.
F02 — Manual filters and active chips
Build: fixed investigation/fuel selectors and O₂/pressure controls using API options, with clear units, removable chips, and reset. Hide/disable unavailable fields. Use a simple Apply action for predictable demo behavior.
Done when: controls emit one shared filter state, invalid ranges are blocked, and clearing a control removes its constraint. Sliders have numeric alternatives.
Do not build: arbitrary filter builders, every possible NASA parameter, advanced facet counts, or search itself.
F03 — Results table and explorer wiring
Build: connect committed filters to search and render TanStack results with case name, investigation, available parameters, count, and an obvious Open action. Allow simple local sorting of all returned results and preserve explorer state when navigating to/from a case.
Done when: manual search opens a real case, reset restores results, zero matches have a useful message, and superseded requests cannot overwrite new ones. Don't download measurement CSVs for the table.
Do not build: server pagination, virtualization, URL-state infrastructure, or a made-up “98% similar” score.
F04 — Assistant-to-filter interaction
Build: prominent scenario input, a useful example-prompt chip, a short loading state, and animated highlights showing which filters changed. Apply the returned complete filter state and run ordinary search once. Show warnings and live/demo mode honestly; a compact last-request/result display is enough.
Done when: a rehearsed prompt visibly drives the same controls as manual input. Block duplicate submissions; discard a response if filters changed while it was loading. Provider failure leaves manual search and the rest of the UI usable.
Do not build: persistent messaging, token streaming, RAG answers, a custom chatbot platform, or scientific conclusions generated in the browser.
F05 — Case page and dataset selection
Build: a visually strong case header, key parameters with units, brief note, source label/link, selected-dataset control, and Back action. Include a CSV download button using the selected dataset endpoint; this is not a bulk export feature.
Done when: direct case navigation works, unknown IDs have a clear state, and returning retains filters/results. Sensible defaults point to the most interesting dataset and channels. No automatic download of every dataset.
Do not build: a metadata catalogue UI, provenance graph, or generated summaries.
F06 — Selected CSV loading
Build: fetch the default selected CSV when the user opens a case, and fetch another only on selection. Parse once with a real CSV parser, using descriptors for numeric columns and units. Keep the prepared demo files small enough for a straightforward in-memory approach; show loading and a useful failure state.
Done when: quoting/missing values work, stale loads are ignored/cancelled, and switching chart controls reuses parsed data rather than fetching again. Empty cells remain null; do not introduce zeros or silently drop chunks of data.
Do not build: generic streaming/worker infrastructure or massive-file support.
F07 — Hero time-series chart
Build: a generous ECharts chart with hand-picked default channels, readable axes/units, crosshair tooltip, legend toggles, zoom/brush, and reset. One or two tasteful linked panels are better than many tiny charts. Separate incompatible units rather than silently putting all sensors on one numeric scale.
Done when: a real run immediately looks interesting and zoom/channel changes feel fluid. Null samples remain gaps; resize/unmount disposes listeners properly. Source context stays visible and ordinary chart changes need no API request.
Do not build: generic chart builders, automatic event detection, fitted physics, invented event markers, or uncertainty estimates.
F08 — Scatter visualization toggle
Build: a second view of the same loaded data, with curated numeric X/Y defaults and simple selectors. Switch line/scatter without refetching measurements.
Done when: switching creates an obvious new perspective, labels/units remain correct, and rows excluded for missing/nonnumeric values are acknowledged.
Do not build: UMAP, inferred clusters, or a claim that sensor-space distance measures scientific case similarity.
F09 — Demo choreography and visual polish
Build: refine the actual presentation path: one-click example prompt, useful initial view, filter-change emphasis, crisp selection/hover states, smooth chart transitions, unobtrusive loading, and a clear restart/reset flow. Tune a rehearsed scenario to verified available data; the badge must identify cached/demo AI.
Done when: the presenter can demonstrate the complete story in 60–90 seconds without hunting for controls, empty charts, or an unrecoverable AI outage. Check the real laptop viewport and provide a short presentation click-through.
Do not build: extra modules just to fill space. Spend remaining time fixing awkward interactions and improving visual impact instead.
Optional features — F10–F22
Each feature below is independently selectable, not required to finish the PoC. Prefer a high-impact view with data already prepared over an impressive-sounding module that needs days of new extraction/modeling. F10, F20, and F21 are good early candidates; comparison is valuable if compatible cases are ready. Data-heavy panels and UMAP have higher preparation cost. Optional work must not consume the time needed to make the core demonstration smooth.

F10 — Atmosphere heatmap
Requires: a working core demo and enough cases with verified O₂/pressure. Use a comparable measured metric/outcome when available, otherwise explicit case counts. Skip the view if the atmospheric coverage is too sparse.
Build: a small local heatmap from those case summaries, colored by a documented measured quantity or explicit case count. A metric beyond the core fields needs an agreed small API extension first. Show units/counts and leave empty cells empty.
Done when: users can identify source cases behind a cell and understand what color means. Any habitat annotation is clearly illustrative, not measured gravity.
Do not build: interpolated safe/unsafe territory or a mission safety predictor.
Additional optional features — one row is one task
API extensions and offline artifacts mentioned here are dependencies to agree explicitly, not an instruction to implement the backend from a frontend task.

ID	Functionality	Requires	Deliverable and done boundary
F11	Parallel coordinates	F06/F07 and a compatible multi-record numeric table	Choose axes, show units/scaling, and brush records locally. Explain missing-row exclusions; local brushing is not automatically catalogue filtering.
F12	Multi-case / cross-ACME comparison	F05–F08 and compatible prepared datasets	Explicitly select a small number of runs, show linked charts, and compare verified common channels. Align to ignition only with verified timestamps; preserve unit/gain differences unless a documented conversion exists.
F13	Cool-flame lifecycle	Verified linked CFI/FLEX files and F07	Synchronize droplet D or D², cool-flame FWHM/P2P diameter, and radiometer power. Label the transform; theoretical fits/ML bands require independently prepared, justified artifacts.
F14	Spacecraft fire telemetry	SAFFIRE-III support and F07/F10	Show measured radiometer, airflow, and fan signals with a Time × Sensor heatmap. Preserve channel units or label explicit normalization; don't invent ignition/extinction markers.
F15	Soot/extinction regime map	Verified ACME experimental summaries and F08/F10	Plot Z_st versus T_ad or another measured variable, optionally colored by documented outcome/flame color. No decorative contour becomes a claimed safety boundary.
F16	Smoke versus dust context	Appropriate SAME-R/DAFT/SLICE data and F07	Compare separately labelled measurements, instrument counts, and spatial flow profiles where useful. Unrelated studies do not establish a validated smoke/regolith classifier; housekeeping is not calibrated smoke concentration.
F17	Electric-field / partial-gravity discussion	E-FIELD measurements and F07/F08	Compare measured EfieldVoltage, IonCurrent, and optical response against a 0 V baseline. Any lunar/Mars discussion is clearly a hypothesis, not a voltage-to-g conversion or fabricated confidence/margin estimate.
F18	Prevention/detection/suppression matrix	Reviewed case/study tags in a small API extension	Group cases by research context, preserve source links and an unknown state, and let users open examples. Do not present tags as certified safety performance.
F19	Experiment galaxy / similarity map	Offline embedding or neighbor artifact with source case IDs and an agreed API extension	Start with a visually strong 2D point map and case selection/highlighting. Neighbor ranking needs a stated feature metric, not just UMAP proximity. 3D is a separate presentation upgrade only if 2D is useful.
F20	Habitat scenario presets	F02/F03 and reviewed illustrative constants	Preview/apply visible constraints or chart annotations for scenarios such as ISS, elevated-O₂/lower-pressure habitat, and EVA. Keep unrelated filters, provide reset, and label assumptions; no invented lunar/Mars measurements or certified safety claims.
F21	Chart image export	F07	Export the current visual with units, source, and transform/sampling context. Keep distinct from the canonical CSV download; do not create a generic reporting engine.
F22	Earth applications / case context	Verified manually curated context and F05	Add a concise card connecting research to terrestrial sensing, ventilation, or suppression. Cite the actual research context in the UI, not an invented commercial validation. Avoid another live AI dependency merely for copy.
Small API boundary — included here for independent development
These are planned PoC payloads. Keep backend/frontend changes aligned. There is no requirement to read another planning document or build all endpoints at once.

type Range = { min?: number; max?: number };
type Filters = {
  investigation?: string[]; fuel?: string[];
  o2_pct?: Range; pressure_kpa?: Range;
};
type FilterOptions = {
  investigation: string[]; fuel: string[];
  o2_pct: { min: number; max: number } | null;
  pressure_kpa: { min: number; max: number } | null;
};
type CaseSummary = {
  case_id: string; title: string; investigation: string;
  fuel: string | null; o2_pct: number | null; pressure_kpa: number | null;
};
type Dataset = {
  dataset_id: string; label: string;
  columns: { key: string; label: string;
    data_type: "number" | "string"; unit: string | null }[];
  default_x: string | null; default_y: string[];
};
type CaseDetail = CaseSummary & {
  source_label: string; source_url: string | null; note: string | null;
  datasets: Dataset[];
};
Endpoint	Request	Successful response
GET /api/v1/filters	None	FilterOptions
POST /api/v1/cases/search	{ filters?: Filters }	{ items: CaseSummary[], total: number }
GET /api/v1/cases/{case_id}	Case ID	CaseDetail
GET /api/v1/datasets/{dataset_id}/csv	Dataset ID	One normalized CSV
POST /api/v1/filters/interpret	{ text: string, current_filters?: Filters }	`{ filters: Filters, warnings: string[], mode: "live"
Search defaults to empty filters and returns all matches from the small curated catalogue, ordered by case ID; total = items.length. Local table sort is allowed. No server pagination, revision negotiation, or metadata envelope.
AND across fields, OR within category lists; numeric bounds are inclusive and either bound may be absent, not both. Remove unset keys; don't send empty arrays. Null metadata fails active filters. Reject invalid keys/categories, reversed or nonfinite ranges, O₂ outside 0–100, and negative absolute pressure. API options supply real categories/observed bounds, not fabricated data or domain limits.
Filter units: percentage points O₂ and kPa absolute. Explicit display conversion to psi is fine: 1 psi = 6.894757293168 kPa. A null numeric option means unavailable.
Interpretation text is trimmed, nonempty, ≤4,000 characters; current filters default empty. Response filters is a complete replacement state, not a patch; preserve unrelated constraints server-side. No supported change means unchanged filters with warnings. mode must be displayed; never pass demo output off as a live call. A failed live call must not silently switch to demo responses.
CSV: UTF-8, comma delimiter, one header row matching descriptors, normal quoting, decimal-point numbers, empty cells for nulls, no metadata preamble. Defaults identify existing numeric columns or are null/empty. Use text/csv; charset=utf-8; Content-Disposition supplies the filename and is exposed via CORS. A normalized or explicitly sampled export is not necessarily an untouched NASA source file.
Errors use FastAPI-style { detail: string }; default 422 validation can put an array in detail. Handle 404 missing IDs, 422 invalid input, and 503 unavailable data/AI with concise feedback. Do not build a general error-code framework.
Finish line
Build/typecheck successfully, run a few relevant checks, and manually rehearse the real-data journey. Verify Back, reset, no results, a CSV failure, and AI-unavailable behavior. A couple of focused tests beat an elaborate suite that delays integration. Report what was checked, provide the demo click-through, and stop.

Implement F07 only using this guide and the existing F06 parsed data. Make the real time-series view visually impressive and smooth. Check zoom, channels, and resize. Do not add heatmaps, ML, backend work, or a generic chart framework.