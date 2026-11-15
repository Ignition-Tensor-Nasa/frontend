# PSI-Lens - Slide-by-Slide Speaker Transcript (`/pitch`)

Ten plik zawiera gotowy transkrypt wystąpienia do 7 slajdów w ścieżce `/pitch` (`PitchDeckPage.tsx`) - dopasowany do 3-minutowego pitchu przed jury (ok. 180 sekund), w wersji angielskiej (do wygłoszenia przy slajdach EN) oraz w wersji polskiej.

---

## 1. Wersja angielska (Jury Pitch - ~3:00)

### Slide 1 - `01 Introduction` (`0:00 - 0:25`)
**Na slajdzie:** Baner *Challenge: Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data*, nagłówek *Stop Digging Through Terabytes of Raw Data & Hundreds of Papers*, kafelki odbiorców (*Students*, *Engineers*, *Professors & Researchers*) oraz skład zespołu.

> Good afternoon, everyone. We are presenting **PSI-Lens**, built for the **Flame in Freefall** challenge at NASA International Space Apps Challenge 2026.
>
> Studying fire safety in microgravity is hard because NASA's experimental data is scattered across terabytes of archives, hundreds of papers, and inconsistent CSV or Excel spreadsheets.
>
> We built **PSI-Lens** as one unified mission-control entry point for a wide audience: **students** learning how flames behave without gravity, **engineers** comparing cabin oxygen and pressure regimes, and **professors and researchers** who need to group related studies and jump directly to original NASA PSI publications.

---

### Slide 2 - `02 NASA Data & Workflow` (`0:25 - 0:50`)
**Na slajdzie:** 3 kroki workflow (*Condenses & Groups*, *Natural Language + Filters*, *Visualizes & Routes*) oraz 6 kart źródeł NASA PSI (`PSI-159`, `PSI-39`, `PSI-10`, `PSI-100`, `PSI-22`, `PSI-101`).

> Instead of asking users to parse raw archive files manually, PSI-Lens follows a three-step workflow:
> 1. **It condenses and groups** 358 curated combustion runs across 6 real NASA investigations into a fast Parquet and Polars backend.
> 2. **It pairs natural language with physical filters** so plain-English queries update exact numeric and categorical bounds.
> 3. **It visualizes and routes** users from live ECharts curves directly back to the official NASA PSI source records.
>
> Below, every card tracks real NASA PSI missions aboard the ISS and Cygnus OA-7 - spanning cool diffusion flames in `PSI-159` and `PSI-39`, flame design in `PSI-10`, full spacecraft fire telemetry in `PSI-100 SAFFIRE-III`, electric-field combustion in `PSI-22`, and spacecraft smoke particulate benchmarks in `PSI-101 SAME-R`.

---

### Slide 3 - `03 Mission Overview` (`0:50 - 1:15`)
**Na slajdzie:** Nagranie `01_mission_overview.gif` pokazujące dashboard, sekcję *Mission Overview* (SAFFIRE-III S1 & S2) oraz widok szczegółowy konkretnej misji.

> When you open PSI-Lens, you land directly in Mission Control.
>
> Right at the top, our **Mission Overview** spotlights flagship spacecraft runs - including **SAFFIRE-III Sample 1 and Sample 2** aboard Cygnus OA-7, synchronizing 30 Hz chamber thermocouples, radiant heat flux, and smoke detector responses with 1 Hz spacecraft downlink.
>
> Opening any mission gives engineers synchronized multi-unit telemetry, experiment notes, and direct links to the verified NASA dataset without ever leaving the dashboard.

---

### Slide 4 - `04 Scenario Filters` (`1:15 - 1:40`)
**Na slajdzie:** Nagranie `02_scenario_filters.gif` pokazujące asystenta *Scenario Filter Assistant* w akcji.

> Researchers rarely memorize NASA accession IDs or exact column schemas. That is why we built the **Scenario Filter Assistant**.
>
> You can type a physical scenario in plain English - for example, elevated oxygen or low spacecraft cabin pressure - and the assistant translates it into validated filter bounds for O2 percentage, kPa pressure, fuel type, and investigation.
>
> Changed controls highlight immediately in the interface, active chips stay transparent, and manual filter controls always stay in sync.

---

### Slide 5 - `05 Regime Map` (`1:40 - 2:05`)
**Na slajdzie:** Nagranie `03_regime_analytics.gif` pokazujące *Atmospheric Regime & Parameter Explorer* (heatmapa O2 vs ciśnienie, galaktyka parametrów, kontekst bezpieczeństwa).

> Next, our **Atmospheric Regime & Parameter Explorer** maps where those 358 real NASA tests actually exist across oxygen concentration and absolute pressure envelopes, alongside habitat presets such as ISS-like cabin air or exploration atmospheres.
>
> Crucially, empty cells remain empty: PSI-Lens never interpolates unmeasured regimes or fabricates safety zones, keeping every chart grounded strictly in documented measurements.

---

### Slide 6 - `06 Cross-Run Compare` (`2:05 - 2:35`)
**Na slajdzie:** Nagranie `04_cross_run_comparison.gif` pokazujące wieloprzebiegowe porównanie krzywek eksperymentalnych (*Multi-Run Flame Spread Comparison*).

> Once you narrow down candidate experiments, you can pin compatible runs and compare them side by side in the **Cross-Run Comparison** view.
>
> Multiple experiments render on synchronized timelines while preserving original physical units and missing (`null`) intervals rather than coercing gaps to zero. Users can seamlessly explore parameter correlations or jump straight to the primary NASA reference.

---

### Slide 7 - `07 Hackathon` (`2:35 - 3:00`)
**Na slajdzie:** Podsumowanie wydarzenia (`NASA International Space Apps Challenge 2026`), nazwa wyzwania, link do wyzwania i filmu referencyjnego.

> To wrap up: **PSI-Lens** was created by our five-person team during the **NASA International Space Apps Challenge 2026** for the challenge *Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data*.
>
> Everything shown here runs on real curated NASA PSI datasets via Parquet, Polars, FastAPI, React, and Apache ECharts. Here are the direct links to the official challenge page and reference video - thank you, and we are ready to switch to the live Explorer for questions!

---

## 2. Wersja polska (do prezentacji PL lub notatek mówcy - ~3:00)

### Slajd 1 - `01 Introduction` (`0:00 - 0:25`)
> Cześć wszystkim! Przedstawiamy **PSI-Lens** - projekt stworzony na wyzwanie **Flame in Freefall** podczas NASA International Space Apps Challenge 2026.
>
> Badanie pożarów w mikrograwitacji bywa trudne, bo dane NASA są rozrzucone po terabajtach archiwów, setkach publikacji oraz niespójnych plikach CSV i Excel.
>
> Stworzyliśmy jeden, wspólny dashboard dla szerokiego grona odbiorców: dla **studentów** poznających zachowanie płomienia bez grawitacji, **inżynierów** analizujących parametry tlenu i ciśnienia oraz **profesorów i badaczy**, którzy potrzebują szybko grupować badania i przechodzić bezpośrednio do oryginalnych źródeł NASA PSI.

---

### Slajd 2 - `02 NASA Data & Workflow` (`0:25 - 0:50`)
> Zamiast ręcznego przekopywania surowych plików, PSI-Lens działa w trzech krokach:
> 1. **Kondensuje i grupuje** 358 zweryfikowanych eksperymentów z 6 misji NASA w szybkim pipeline opartym o Parquet i Polars.
> 2. **Łączy język naturalny z filtrami fizycznymi**, tłumacząc opis scenariusza na dokładne granice stężenia O2, ciśnienia i paliwa.
> 3. **Wizualizuje i kieruje do źródeł**, łącząc interaktywne wykresy ECharts z bezpośrednimi odnośnikami do repozytorium NASA PSI.
>
> Poniżej widzicie 6 realnych programów badawczych z pokładu ISS oraz statku Cygnus OA-7 (`PSI-159`, `PSI-39`, `PSI-10`, `PSI-100 SAFFIRE-III`, `PSI-22`, `PSI-101`).

---

### Slajd 3 - `03 Mission Overview` (`0:50 - 1:15`)
> Po wejściu do aplikacji od razu trafiamy do widoku głównego oraz sekcji **Mission Overview**, wyróżniającej kluczowe eksperymenty - na czele z dużym pożarem **SAFFIRE-III (`PSI-100`)** na pokładzie Cygnus OA-7.
>
> Widok konkretnej misji synchronizuje dane z czujników komorowych 30 Hz (termoelementy do 1088 °C, radiometry, czujniki dymu) z telemetrią statku 1 Hz i podsumowaniem misji.

---

### Slajd 4 - `04 Scenario Filters` (`1:15 - 1:40`)
> Użytkownik nie musi pamiętać kodów eksperymentów NASA. W polu **Scenario Filter Assistant** wpisujemy scenariusz zwykłym językiem - na przykład wysokie stężenie tlenu albo obniżone ciśnienie kabinowe.
>
> Asystent ustawia zwalidowane filtry, podświetla zmienione kontrolki w panelu bocznym i uruchamia wyszukiwanie, zachowując pełną kontrolę manualną i czytelne chipy aktywnych filtrów.

---

### Slajd 5 - `05 Regime Map` (`1:40 - 2:05`)
> Kolejny moduł - **Atmospheric Regime & Parameter Explorer** - pokazuje na mapie cieplnej oraz rozkładach parametrów, gdzie dokładnie w przestrzeni O2 i ciśnienia znajdują się zmierzone testy NASA względem scenariuszy kabinowych takich jak ISS.
>
> Puste komórki pozostają puste: aplikacja nigdy nie zmyśla niezmierzonych stref bezpieczeństwa ani brakujących punktów.

---

### Slajd 6 - `06 Cross-Run Compare` (`2:05 - 2:35`)
> Wybrane eksperymenty możemy przypiąć i porównać bezpośrednio obok siebie w widoku **Multi-Run Flame Spread Comparison**.
>
> Zsynchronizowane osie czasu zachowują oryginalne jednostki pomiarowe oraz wartości `null` jako przerwy na wykresie zamiast sztucznego zerowania, co pozwala rzetelnie porównać przebieg zapłonu i rozprzestrzeniania płomienia.

---

### Slajd 7 - `07 Hackathon` (`2:35 - 3:00`)
> Podsumowując: **PSI-Lens** powstał w ramach **NASA International Space Apps Challenge 2026** dla wyzwania *Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data*.
>
> Na slajdzie końcowym znajdują się linki do strony wyzwania i materiału referencyjnego NASA. Dziękujemy i zapraszamy do pytań oraz podglądu aplikacji na żywo!
