# Kompletny Przewodnik Merytoryczny i Techniczny po Platformie PSI-Lens

Ten dokument wyjaśnia **każdy pojedynczy element interfejsu, każdą opcję, każdy wykres, wszystkie 30 kolumn pomiarowych oraz wszystkie 43 eksperymenty** dostępne w aplikacji **PSI-Lens** (*NASA Physical Sciences Informatics • Microgravity Combustion Telemetry & Experiment Explorer*).

---

## Spis treści

1. [Wprowadzenie i fizyka spalania w mikrograwitacji](#1-wprowadzenie-i-fizyka-spalania-w-mikrograwitacji)
2. [Górny pasek nawigacji i tryby pracy (`AppShell`)](#2-górny-pasek-nawigacji-i-tryby-pracy-appshell)
3. [Asystent scenariuszy AI (`Scenario Filter Assistant` — F04)](#3-asystent-scenariuszy-ai-scenario-filter-assistant--f04)
4. [Lewy panel filtrów i aktywne znaczniki (`FilterRail` & `ActiveFilterChips` — F02)](#4-lewy-panel-filtrów-i-aktywne-znaczniki-filterrail--activefilterchips--f02)
5. [Panel wizualizacji analitycznych (`Mission Analytics & Regime Explorer` — F10, F12, F15, F18, F19, F20)](#5-panel-wizualizacji-analitycznych-mission-analytics--regime-explorer--f10-f12-f15-f18-f19-f20)
6. [Tabela wyników i kolejka porównawcza (`ResultsTable` & `Compare Queue` — F03, F12)](#6-tabela-wyników-i-kolejka-porównawcza-resultstable--compare-queue--f03-f12)
7. [Okno porównywania wielu eksperymentów (`Cross-Run Telemetry Comparison` — F12)](#7-okno-porównywania-wielu-eksperymentów-cross-run-telemetry-comparison--f12)
8. [Strona szczegółów eksperymentu (`CaseDetailPage` — F05, F06, F22, F23)](#8-strona-szczegółów-eksperymentu-casedetailpage--f05-f06-f22-f23)
9. [Kompletny słownik wszystkich kanałów pomiarowych i zdarzeń](#9-kompletny-słownik-wszystkich-kanałów-pomiarowych-i-zdarzeń)
10. [Wszystkie wykresy i kontrolki na stronie przypadku (F07, F08, F11, F13, F21)](#10-wszystkie-wykresy-i-kontrolki-na-stronie-przypadku-f07-f08-f11-f13-f21)
11. [Kompletny katalog wszystkich 43 eksperymentów (29 `ACME CFI-G` + 14 `CFI (FLEX)`)](#11-kompletny-katalog-wszystkich-43-eksperymentów-29-acme-cfi-g--14-cfi-flex)
12. [Szybki przewodnik czytania strony krok po kroku (60-sekundowa ścieżka demonstracyjna)](#12-szybki-przewodnik-czytania-strony-krok-po-kroku-60-sekundowa-ścieżka-demonstracyjna)
13. [Specjalne przypadki kuratorskie: `SAFFIRE-III` (`PSI-100`) — dedykowany widok 4-sekcyjny i podsumowanie AI](#13-specjalne-przypadki-kuratorskie-saffire-iii-psi-100--dedykowany-widok-4-sekcyjny-i-podsumowanie-ai)

---

## 1. Wprowadzenie i fizyka spalania w mikrograwitacji

### 1.1 Dlaczego NASA spala paliwa na Międzynarodowej Stacji Kosmicznej (ISS)?

Na Ziemi płomień świecy ma kształt łzy, ponieważ rozgrzane spaliny są lżejsze od otaczającego powietrza i unoszą się w górę (*konwekcja naturalna* wywołana grawitacją). Wewnątrz **ISS** lub kapsuły kosmicznej panuje **mikrograwitacja** ($\sim 10^{-6}\ g$), w której konwekcja naturalna praktycznie zanika:

* **Transport wyłącznie dyfuzyjny:** Tlen dociera do paliwa, a spaliny odpływają jedynie przez dyfuzję molekularną i słaby wymuszony przepływ wentylacji.
* **Kształt sferyczny / półkulisty:** Płomień nie wyciąga się w górę — otacza źródło paliwa niemal idealną kulą (w eksperymentach kroplowych `FLEX`) lub symetryczną kopułą nad porowatym palnikiem (w eksperymentach `ACME CFI-G`).
* **Bezpieczeństwo pożarowe misji załogowych:** Zrozumienie dolnych granic tlenowych, wpływu ciśnienia oraz zachowania tzw. *zimnych płomieni* decyduje o bezpieczeństwie atmosfer w przyszłych habitatach księżycowych i marsjańskich (gdzie planuje się obniżone ciśnienie przy wyższym udziale $\text{O}_2$, aby zmniejszyć masę konstrukcji i skrócić procedurę dekompresji przed wyjściem w skafander EVA).

### 1.2 Dwa programy badawcze NASA w bazie PSI-Lens

Aplikacja łączy wyselekcjonowany katalog **43 rzeczywistych testów kosmicznych** z repozytorium NASA Physical Sciences Informatics (PSI):

| Kampania (Investigation) | Zbiór PSI | Liczba testów | Aparatura i geometria | Paliwa | Główne zjawisko badane |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ACME CFI-G`** (*Cool Flames Investigation with Gases*) | PSI-159 | **29** | Kulisty palnik gazowy z porowatą sferą w komorze ciśnieniowej *CIR* (*Combustion Integrated Rack*) | `butane` ($\text{C}_4\text{H}_{10}$), `ethane` ($\text{C}_2\text{H}_6$), `propane` ($\text{C}_3\text{H}_8$) — czyste ($X_f=1$) lub rozcieńczone $\text{N}_2$ ($X_f=0.5, 0.3, 0.15$) | Zapłon, samogaśnięcie (*SE*), kontrolowane wyłączenie (*FT*), *Hot Flame* vs *Cool Flame* oraz wielokrotne oscylacje między nimi |
| **`CFI (FLEX)`** (*Flame Extinguishment Experiment — Cool Flames*) | PSI-39 | **14** | Swobodnie zawieszona (lub na włóknie SiC) pojedyncza kropla cieczy w *CIR* | `dodecane` ($n$-dodekan, $\text{C}_{12}\text{H}_{26}$) w $\text{O}_2/\text{N}_2$ (jeden test `FLEX-1264` dodatkowo z $29\%\ \text{He}$) | Dwuetapowe spalanie kropli: gorący płomień $\rightarrow$ gaśnięcie radiacyjne $\rightarrow$ bezdymny, słabo świecący zimny płomień oraz klasyczne prawo parowania/spalania $D^2(t) = D_0^2 - K t$ |

### 1.3 Gorący płomień (*Hot Flame*) vs Zimny płomień (*Cool Flame*)

To najważniejsza koncepcja merytoryczna na całej stronie:

1. **Gorący płomień (*Hot Flame*):**
   * Temperatura: $1200\text{–}2000\text{ K}$.
   * Chemia wysokotemperaturowa — pełne utlenianie paliwa do $\text{CO}_2$ i $\text{H}_2\text{O}$.
   * Emisja światła widzialnego i UV ($\text{OH}^*$, $\text{CH}^*$) — silny skok sygnałów **fotopowielaczy (`PMT1`–`PMT3`)**, **radiometrów (`Radiometer3+...`)**, **prądu jonizacji (`IonCurrent`)** oraz gwałtowny wzrost temperatury na **termoparach (`TCA`–`TCD`, `TCBurner`)**.
2. **Zimny płomień (*Cool Flame*):**
   * Temperatura: zaledwie $550\text{–}800\text{ K}$ ($280\text{–}530\,^\circ\text{C}$).
   * Chemia niskotemperaturowa (reżim *NTC* — *Negative Temperature Coefficient*, z udziałem rodników nadtlenkowych $\text{RO}_2$ i wodoronadtlenków ketonowych).
   * **Praktycznie niewidoczny gołym okiem**, brak sadzy, znacznie słabsze promieniowanie w radiometrach wąskopasmowych ($\sim 100\times$ mniejsze niż w płomieniu gorącym), za to trwałe wydzielanie ciepła i częściowo utlenionych produktów (aldehydów, formaldehydu $\text{CH}_2\text{O}^*$, $\text{CO}$), które mogą **ponownie zapalić się do gorącego płomienia**!
   * W niektórych eksperymentach (np. `CFIG-21106F2`, `CFIG-21106F5`) zimny płomień powstaje bezpośrednio bez fazy gorącej (*„direct cool - no hot ignition”*). W teście `CFIG-21291C1` układ przechodzi aż **5-krotnie** tam i z powrotem (*6 gorących i 5 zimnych płomieni* w jednym biegu).
   * Wyższe ciśnienie i wyższe stężenie tlenu $\text{O}_2$ stabilizują ścieżki reakcji niskotemperaturowych, dlatego *Cool Flame* w `ACME CFI-G` obserwuje się głównie przy $\approx 39\%\ \text{O}_2$ i $\approx 203\text{ kPa}$.

### 1.4 Główne parametry fizykochemiczne i znaczenie `null` / `—`

* **`O₂ (%)` — Stężenie tlenu w atmosferze komory** (zakres w katalogu: `17.0–39.7%` obj., czyli ułamek molowy przed testem):
  * Powietrze ziemskie ma ok. $20.9\text{–}21.0\%\ \text{O}_2$.
  * Wzbogacona atmosfera ($33\text{–}40\%\ \text{O}_2$) przyspiesza kinetykę chemiczną i podtrzymuje płomienie, które zgasłyby na Ziemi.
  * Zubożona atmosfera ($17\text{–}18\%\ \text{O}_2$, np. `CFIG-21088P1`, `FLEX-1231`, `FLEX-1232`) bada dolne granice palności.
* **`Pressure (kPa / psi)` — Ciśnienie absolutne w komorze** (zakres w katalogu: `51–507 kPa`, tj. $0.5\text{–}5.0\text{ atm}$):
  * Przelicznik stosowany w całej aplikacji: $1\ \text{psi} = 6.894757293168\ \text{kPa}$.
  * $101.3\ \text{kPa} \approx 14.7\ \text{psi} = 1\ \text{atm}$ (ciśnienie na poziomie morza i nominalne ciśnienie ISS).
  * $50.7\ \text{kPa} \approx 7.3\ \text{psi} = 0.5\ \text{atm}$ (warunki obniżonego ciśnienia w przyszłych habitatach).
  * Wyższe ciśnienie zwiększa gęstość gazu, szybkość reakcji trójcząsteczkowych (ważnych w chemii zimnych płomieni) oraz straty radiacyjne.
* **`Z_st` — Stechiometryczny ułamek mieszaniny (*Stoichiometric Mixture Fraction*)** (zakres obserwowany w `CFI-G`: `0.061–0.303`, teoretyczne granice `0–1`):
  * Wielkość bezwymiarowa $Z_{st} \in (0, 1)$ mówiąca, jaka część masy w strefie reakcji płomienia dyfuzyjnego musi pochodzić ze strumienia paliwa z palnika, aby całkowicie i bez nadmiaru przereagować z otaczającym tlenem z komory:
    $$Z_{st} = \frac{1}{1 + s \cdot \frac{Y_{F,0}}{Y_{O_2,\infty}}}$$
    gdzie $s$ to stechiometryczny stosunek masowy tlenu do paliwa, $Y_{F,0}$ to udział masowy paliwa w strumieniu z palnika (wynikający z ułamka molowego $X_f$ i domieszki azotu $\text{N}_2$), a $Y_{O_2,\infty}$ to udział masowy tlenu w komorze.
  * **Jak interpretować $Z_{st}$ w tabeli i na wykresach:**
    * **Małe $Z_{st}$** (np. `0.0607` w `CFIG-21112H3` dla czystego propanu $X_f=1$ przy $21.1\%\ \text{O}_2$): strumień z palnika jest czystym, stężonym paliwem, więc powierzchnia płomienia musi odsunąć się daleko od porowatego palnika w stronę utleniacza — płomień ma dużą średnicę i łatwiej traci ciepło przez promieniowanie.
    * **Duże $Z_{st}$** (np. `0.3032` w `CFIG-21291J1` dla bardzo rozcieńczonego butanu $X_f=0.15$ przy $38.5\%\ \text{O}_2$): paliwo w palniku jest mocno rozcieńczone azotem, a w komorze jest dużo tlenu — strefa reakcji przysuwa się blisko powierzchni palnika, silnie go nagrzewając (*„Hit the burner temperature limit”*).
* **Dlaczego w bazie występują wartości `null` / `Unknown (null)` / `—`?**
  * Platforma przestrzega rygorystycznej zasady naukowej: **brak danych nigdy nie jest zastępowany zerem ani zgadywany**.
  * Dla wszystkich 14 eksperymentów kroplowych **`CFI (FLEX)`** pole `Z_st` ma wartość `null`, ponieważ oryginalny arkusz źródłowy NASA (`CFI_DataSummary_Spreadsheet`) nie podaje ułamka mieszaniny palnikowej w tej definicji.
  * Dla testu **`FLEX-1213`** wartość `o2_pct` wynosi `null` (wykluczona z mapy cieplnej i analizy sąsiadów), ponieważ oryginalny *Master Sheet* podaje `O₂ = 0.17`, podczas gdy dokument *FLEX-1213_Summary.pdf* podaje `YO2 = 0.210` — aplikacja nie rozstrzyga konfliktu danych źródłowych w ciemno.
  * W szeregach czasowych brakujące próbki mają wartość `null`, co na wykresach liniowych wyświetla się jako **przerwa w linii**, a w wykresach punktowych i współrzędnych równoległych skutkuje zliczeniem i zaraportowaniem odrzuconych wierszy.

---

## 2. Górny pasek nawigacji i tryby pracy (`AppShell`)

Górny pasek (`AppShell`) jest widoczny stale zarówno na stronie głównej (`/`), jak i na stronie szczegółów eksperymentu (`/cases/:caseId`):

1. **Logo `PSI-LENS` + plakietka `Microgravity Combustion` + opis `NASA Physical Sciences Informatics Telemetry & Experiment Explorer`**:
   * Kliknięcie zawsze przenosi na główny ekran eksploratora (`/`), przy czym aktualne filtry i wyniki pozostają w pamięci przeglądarki.
2. **Plakietka ostrzegawcza `Research demo, not a safety assessment`**:
   * Przypomnienie merytoryczne: aplikacja służy do eksploracji archiwalnych danych eksperymentalnych NASA, a nie do certyfikacji bezpieczeństwa pożarowego statków kosmicznych.
3. **Przełącznik źródła danych (`Data Source Mode`)**:
   * **`Demo Fixtures`**: tryb autonomiczny offline. Wszystkie zapytania katalogowe (43 przypadki), reguły asystenta oraz wycinki szeregów czasowych pochodzą z lokalnych plików demonstracyjnych wbudowanych w aplikację frontendową. Gdy ten tryb jest aktywny, tuż pod nagłówkiem pojawia się pomarańczowy pasek: `DEMO / FIXTURE MODE: Displaying curated NASA PSI sample fixtures & rehearsed AI filter mappings (no live backend call).`
   * **`Live API`**: tryb pełny połączony z backendem FastAPI + Polars (`http://127.0.0.1:8001`). Endpoint `GET /api/v1/datasets/{id}/data` zwraca natywny JSON bezpośrednio z przygotowanych plików **Parquet** (pełne, niepróbkowane szeregi czasowe NASA `125 Hz` / wszystkie próbki z plików FLEX, posortowane po czasie), przycisk eksportu generuje prawdziwy plik CSV z Parquet, a interpretacja scenariuszy przez API działa zgodnie ze zmiennymi `PSI_AI_MODE`, `PSI_AI_PROVIDER` (`anthropic` lub `openrouter`), `PSI_AI_MODEL` oraz odpowiednim kluczem w pliku `.env` backendu (lub zmiennymi środowiskowymi). Gdy backend lub AI nie jest dostępne (np. brak konfiguracji zwracający `503`), aplikacja **nie przełącza się po cichu** na dane demo — zgłasza jawny błąd i udostępnia przycisk ponowienia.
4. **Menu symulacji błędów `Fault Sim` / `Fault Active` *(widoczne wyłącznie w trybie `Demo Fixtures`)* — okno `Failure Rehearsal (Demo)`**:
   Służy do demonstracji i testowania odporności interfejsu na awarie bez wyłączania serwera. Zawiera dokładnie **4 opcje**:
   * **`Normal fixture responses`**: normalne działanie trybu demonstracyjnego (brak wstrzykiwanych błędów).
   * **`Simulate AI 503 unavailable`**: symuluje awarię modelu językowego (`HTTP 503`) w komponencie `Scenario Filter Assistant` — asystent wyświetla komunikat błędu, natomiast ręczne filtry i tabela nadal działają bez zakłóceń.
   * **`Simulate Dataset 503 failure`**: symuluje niedostępność usługi danych telemetrycznych (`HTTP 503`) podczas otwierania eksperymentu lub ładowania jego zbiorów danych.
   * **`Simulate Descriptor/Row mismatch`**: symuluje uszkodzoną odpowiedź z serwera (niezgodność liczby kolumn lub typu liczbowego w wierszu z deskryptorem `columns`, `HTTP 422`), weryfikując mechanizm walidacji kształtu JSON (`validateDatasetData`).
5. **Przycisk `Reset Demo` *(widoczny na stronie głównej `/`)***:
   * Jednym kliknięciem przywraca stan początkowy prezentacji: czyści wszystkie filtry, pole wyszukiwania szybkiego, wpisy asystenta AI, sortowanie tabeli, kolejkę porównań (`Compare Queue`) oraz ewentualną aktywną symulację awarii (`Fault Sim`).

---

## 3. Asystent scenariuszy AI (`Scenario Filter Assistant` — F04)

Górny wyróżniony panel na stronie głównej pozwala tłumaczyć opis scenariusza w języku naturalnym (**polskim lub angielskim**) na ustrukturyzowane filtry parametrów testowych:

* **Pole tekstowe (`Combustion scenario description`)**:
  * Maksymalna długość: **4000 znaków** (przycięte białe znaki, nie może być puste).
  * Wprowadzony tekst po wysłaniu trafia do endpointu `POST /api/v1/filters/interpret` (w trybie `Live API`) lub do lokalnej tabeli dopasowań (w trybie `Demo Fixtures`).
* **Przycisk `Apply Scenario`**:
  * Wysyła opis i automatycznie uruchamia wyszukiwanie w katalogu. Blokuje wielokrotne wysłanie podczas ładowania (`Interpreting…`).
* **Plakietka trybu AI (`AI Mode: live` lub `AI Mode: demo`)**:
  * Informuje uczciwie, czy filtry wygenerował prawdziwy model AI na backendzie (`live` — zielona kropka), czy lokalna/serwerowa mapa zapytań demonstracyjnych (`demo` — pomarańczowa kropka).
* **Trzy przyciski przykładowe (`Examples:`)** — natychmiastowe uruchomienie gotowych scenariuszy:
  1. **`Butane >200 kPa & >39% O₂ (PL)`** $\rightarrow$ wysyła `"Pokaż testy z butanem powyżej 200 kPa i ponad 39% tlenu"` $\rightarrow$ ustawia `fuel=["butane"]`, `o2_pct≥39`, `pressure_kpa≥200`. Zwraca **7** testów z serii `CFIG-21174*` i `21291C1` (w tym większość zimnych płomieni `PCI-*`).
  2. **`Earth-like 20–22% O₂, 95–105 kPa`** $\rightarrow$ wysyła `"Show tests in an Earth-like atmosphere: 20-22% oxygen, 95-105 kPa"` $\rightarrow$ ustawia `o2_pct: 20–22`, `pressure_kpa: 95–105`. Zwraca testy zbliżone do atmosfery ziemskiej / ISS.
  3. **`Low pressure 45–55 kPa`** $\rightarrow$ wysyła `"Show low-pressure tests, 45-55 kPa"` $\rightarrow$ ustawia `pressure_kpa: 45–55`. Zwraca testy podciśnieniowe ($\sim 0.5\ \text{atm}$).
  * W trybie `Demo Fixtures` rozpoznawane są dokładnie oba warianty (PL i EN) powyższych 3 zapytań (łącznie 6 fraz). Wpisanie innej frazy pozostawia aktualne filtry bez zmian i wyświetla ostrzeżenie (`Demo mode: prompt does not match a rehearsed demo scenario...`).
* **Podświetlenie zmienionych filtrów i pasek podsumowania (`Applied prompt`)**:
  * Pola zmodyfikowane przez asystenta rozbłyskują animacją na panelu filtrów po lewej stronie oraz na pasku chipów (`Updated: fuel, o2_pct, pressure_kpa`), aby użytkownik dokładnie widział, *co* AI ustawiło.
  * Ewentualne ostrzeżenia walidacyjne lub nieobsłużone kryteria pojawiają się w bursztynowej ramce poniżej.
  * Jeśli podczas oczekiwania na odpowiedź AI użytkownik ręcznie zmienił filtry, spóźniona odpowiedź asystenta zostaje bezpiecznie odrzucona.

---

## 4. Lewy panel filtrów i aktywne znaczniki (`FilterRail` & `ActiveFilterChips` — F02)

Panel `Test Parameters` po lewej stronie służy do precyzyjnego ręcznego filtrowania katalogu:

### 4.1 Logika wyszukiwania
* **AND między polami, OR wewnątrz kategorii:** zaznaczenie wielu wartości w obrębie jednego pola (np. `butane` i `ethane`) wybiera testy z dowolnym z tych paliw (*OR*); jednoczesne ustawienie `Fuel`, `O₂` i `Pressure` wymaga spełnienia **wszystkich** warunków naraz (*AND*).
* **Zasada dla `null`:** testy o nieznanym parametrze (`null`, np. `FLEX-1213` bez `O₂` lub wszystkie `FLEX` bez `Z_st`) **odpadają**, gdy na dane pole nałożono filtr.

### 4.2 Sekcja `Quick Presets` (4 szybkie filtry)
Jedno kliknięcie od razu ustawia i zatwierdza gotowy zestaw ograniczeń:
1. **`Earth-like (20–22% O₂, 95–105 kPa)`** — warunki atmosfery ziemskiej / pokładowej ISS ($1\ \text{atm}$).
2. **`Low Pressure (45–55 kPa)`** — warunki obniżonego ciśnienia ($\sim 0.5\ \text{atm}$).
3. **`High Z_st (≥ 0.25)`** — płomienie dyfuzyjne mocno rozcieńczonego paliwa w atmosferze wzbogaconej (strefa reakcji blisko palnika).
4. **`CFI (FLEX) Droplets`** — zawęża tabelę i wizualizacje wyłącznie do 14 eksperymentów kroplowych z $n$-dodekanem.

### 4.3 Poszczególne kontrolki parametrów
1. **`Investigation`** (wybór wielokrotny): `ACME CFI-G`, `CFI (FLEX)`.
2. **`Fuel`** (wybór wielokrotny): `butane`, `dodecane`, `ethane`, `propane`.
3. **`O₂ Concentration` (`%` obj.)**:
   * Zakres obserwowany w katalogu wyświetlany przy etykiecie: **`obs 17.0–39.7%`**.
   * Pola liczbowe **`Min`** i **`Max`** (krok `0.5`) oraz zsynchronizowane dwa suwaki zakresu (`0–100%`, krok `0.5`).
   * Walidacja na żywo: blokuje wartości spoza `0–100%` oraz odwrócone przedziały (`Min > Max`).
4. **`Absolute Pressure` (`kPa` i `psi`)**:
   * Zakres obserwowany w katalogu: **`obs 51–507 kPa`**.
   * Pola liczbowe **`Min`** i **`Max`** (krok `1 kPa`) oraz suwaki zakresu (`0–507 kPa`, krok `5 kPa`).
   * Bezpośrednio pod polami `Min` i `Max` wyświetla się **przelicznik na żywo w PSI** (np. `≈ 14.70 psi`).
   * Walidacja blokuje ujemne ciśnienie absolutne (`< 0 kPa`) oraz `Min > Max`.
5. **`Mixture Fraction (Z_st)`**:
   * Zakres obserwowany w katalogu: **`obs 0.061–0.303`**.
   * Pola liczbowe **`Min`** i **`Max`** oraz suwaki zakresu (`0–1`, krok `0.01`).
6. **Przyciski akcji**:
   * **`Apply Filters`** (rozświetlony cyjanem, gdy są niezatwierdzone zmiany w panelu) / **`Apply / Refresh`** (gdy stan roboczy odpowiada już zatwierdzonym filtrom) — wysyła zapytanie `POST /api/v1/cases/search`.
   * **`Reset`** (w prawym górnym rogu panelu `Test Parameters`) — czyści wszystkie aktywne filtry i przywraca pełny katalog.

### 4.4 Pasek aktywnych chipów (`Active Filters:`)
Nad tabelą wyników wyświetla każdy aktywny warunek jako oddzielną pigułkę (np. `Fuel: butane`, `O₂: ≥ 39% O₂`, `Pressure: ≥ 200 kPa (≥ 29.0 psi)`). Kliknięcie krzyżyka `×` usuwa pojedyncze ograniczenie i natychmiast odświeża wyszukiwanie; link **`Clear all`** usuwa wszystkie naraz.

---

## 5. Panel wizualizacji analitycznych (`Mission Analytics & Regime Explorer` — F10, F12, F15, F18, F19, F20)

Ten rozbudowany panel nad tabelą wyników prezentuje przekrojowo **wszystkie aktualnie pasujące eksperymenty** (`X runs plotted`). Posiada **3 główne zakładki** oraz dolny pasek szybkich porównań:

### 5.1 Zakładka 1: `Atmosphere Heatmap (F10)` + `Habitat Presets (F20)`

Pokazuje dwuwymiarową mapę pokrycia przestrzeni atmosferycznej **(stężenie $\text{O}_2$ × ciśnienie komory)** podzieloną na **5 kolumn tlenu** i **4 wiersze ciśnienia**:

* **Kolumny osi X (`O₂_BINS`):**
  1. `16–20% O₂` (atmosfery zubożone w tlen)
  2. `20–24% O₂` (okolice powietrza ziemskiego $21\%$)
  3. `24–32% O₂` (umiarkowane wzbogacenie)
  4. `32–37% O₂` (atmosfery eksploracyjne o podwyższonym $\text{O}_2$)
  5. `37–41% O₂` (wysoko wzbogacony tlen — główne pasmo testów *Cool Flame* w `CFI-G`)
* **Wiersze osi Y (`PRESSURE_BINS`):**
  1. `45–75 kPa (7–11 psi)` (~0.5 atm)
  2. `75–130 kPa (11–19 psi)` (~1 atm — ciśnienie ziemskie / ISS)
  3. `130–250 kPa (19–36 psi)` (~1.25–2 atm)
  4. `250–520 kPa (36–75 psi)` (~3–5 atm)
* **Przełącznik metryki koloru (`Metric`):**
  * **`Metric: Case Count`**: liczba eksperymentów w danej komórce (od ciemnego cyjanu przy 1 teście po jasny cyjan i pomarańczowy przy największym zagęszczeniu).
  * **`Metric: Mean Z_st`**: średnia wartość stechiometrycznego ułamka mieszaniny $Z_{st}$ w danej komórce (od granatu dla niskiego $Z_{st}$ do fioletu i pomarańczowego dla wysokiego $Z_{st}$; komórki zawierające wyłącznie testy kroplowe `FLEX-*` pozostają puste ze względu na `Z_st = null`).
* **Puste komórki i adnotacja `null`:**
  * Puste komórki oznaczają **0 przetestowanych biegów** w bazie dla danej pary $(\text{O}_2, P)$ — aplikacja celowo nie rysuje żadnych wymyślonych stref bezpieczeństwa.
  * Gdy w widoku jest przypadek bez pełnych współrzędnych atmosfery (`FLEX-1213` z `o2_pct = null`), pod wykresem pojawia się informacja: `1 run excluded due to null atmosphere coordinate.`
* **Interakcja po kliknięciu komórki:**
  * Otwiera pod spodem listę `Selected Bin: ... (N runs)` z przyciskiem otwarcia każdego biegu (`Run ...`) oraz przyciskiem `+` przypinającym bieg bezpośrednio do porównania **F12**.
* **Przyciski `Habitat Presets (F20)` nad mapą:**
  * **`ISS Cabin (20–22% O₂, 95–105 kPa)`** — referencja pokładowa ISS (1 atm).
  * **`Low-Pressure Habitat (45–60 kPa)`** — ilustrująca obniżone ciśnienie przyszłych baz kosmicznych ($\sim 7\text{–}8.7\ \text{psi}$).
  * **`Elevated O₂ Enriched (≥ 33% O₂)`** — pasmo atmosfery wzbogaconej w tlen używane do badań granic palności i zimnych płomieni.
  * **`Clear Atmosphere Preset`** — usuwa filtr atmosferyczny i przywraca pełną mapę.
  * *Uwaga merytoryczna na pasku:* są to wyłącznie **ilustracyjne warunki odniesienia** służące do filtrowania, a nie certyfikowane limity księżycowe czy marsjańskie.

### 5.2 Zakładka 2: `Condition Galaxy & Z_st (F19/F15)`

Posiada dwa przełączane tryby wykresu + boczną kartę wybranego węzła (`Selected Galaxy Node`):

1. **Tryb `Condition Galaxy (O₂ × Pressure + B11 Neighbors)` (F19):**
   * Wykres punktowy wszystkich przypadków w płaszczyźnie `O₂ Concentration [%]` (oś X: 14–42%) vs `Pressure [kPa]` (oś Y: 20–540 kPa).
   * **Kolory paliw:** `butane` — pomarańczowy (`#fb923c`), `ethane` — cyjan (`#22d3ee`), `propane` — fioletowy (`#a78bfa`), `dodecane` — szmaragdowy (`#34d399`).
   * **Kształt punktów:** koło (`circle`) = gazowy palnik `ACME CFI-G`; romb (`diamond`) = kropla `CFI (FLEX)`.
   * **Żółte pinezki `Habitat Ref (Illustrative)`:** dwie ilustracyjne referencje projektowe na wykresie: `ISS Ref (21% O₂, 101.3 kPa)` oraz `Exploration Habitat Ref (34% O₂, 56.5 kPa)`.
   * **Przerywane animowane wektory `Neighbor Links (B11)`:** po kliknięciu dowolnego punktu (domyślnie wybrany jest flagowy bieg `CFIG-21291C1`) wykres rysuje linie łączące go z jego **najbliższymi sąsiadami w ramach tej samej kampanii**, a prawa karta pokazuje odległości standaryzowane $d$ (`Nearest Same-Investigation Runs`), przycisk otwarcia (`Open ...`) oraz przycisk **`Compare With Nearest Neighbor`** otwierający bezpośrednio porównanie **F12** z najbliższym sąsiadem!
   * **Jak liczona jest odległość `d` (metryka B11)?** Jest to odległość euklidesowa w płaszczyźnie $(O_2, P)$, gdzie każda z tych dwóch cech została osobno ustandaryzowana w obrębie swojej kampanii ($\mu=0, \sigma=1$). Odległość mierzy **wyłącznie bliskość nastaw atmosfery** w komorze (ignoruje paliwo, $X_f$ i wyniki spalania) — **nie** jest oceną podobieństwa chemicznego ani wskaźnikiem bezpieczeństwa.
2. **Tryb `Stoichiometric Regime Map (Z_st × O₂ · F15)`:**
   * Mapa reżimów palności pokazująca zależność między **`Z_st`** (oś X) a **`O₂ Concentration [%]`** (oś Y).
   * Pozwala natychmiast odróżnić płomienie czystego paliwa (niskie $Z_{st} \approx 0.06\text{–}0.10$) od płomieni paliwa silnie rozcieńczonego azotem (wysokie $Z_{st} \approx 0.20\text{–}0.30$) oraz zobaczyć, jak wraz z $\text{O}_2$ rośnie lub przesuwa się strefa reakcji.
   * Rozmiar punktu odwzorowuje względnie ciśnienie w komorze.
   * Gdy w widoku są testy `FLEX`, nad wykresem widnieje licznik: `X droplet runs omitted (Z_st = null)`.

### 5.3 Zakładka 3: `Safety Context Matrix (F18)`

Czterokolumnowa macierz kontekstu naukowego, oparta wyłącznie na zweryfikowanych cytatach z oryginalnej dokumentacji NASA (`PSI-39` oraz `PSI-159`), bez dorabiania klasyfikacji:

1. **`Prevention` (Prewencja zapłonu / ponownego zapłonu — 14 testów `CFI (FLEX)`):**
   * Obejmuje eksperymenty kroplowe `FLEX`, ponieważ raport NASA *Cool Flames in Space, a Hot Prospect on Earth* wprost opisuje zimne płomienie jako zagrożenie wtórnym zapłonem (*re-ignition hazard*) oraz badanie granic palności paliw ciekłych dla bezpieczeństwa statków kosmicznych (z dokładnymi cytatami ze stron 3 i 23 PDF). Zawiera przyciski do szybkiego otwarcia przykładowych biegów i przefiltrowania katalogu do `CFI (FLEX)`.
2. **`Detection` (Detekcja pożaru — 0 testów):**
   * Jawny stan pusty (`Status: Not asserted in current curated bundle`) — żaden dokument w obecnej paczce `PSI-39` / `PSI-159` nie certyfikuje czujników dymu ani wykrywania pożaru (struktura gotowa na przyszłe zbiory takie jak `SAME-R`, `SLICE`, `SAFFIRE`).
3. **`Suppression` (Gaszenie pożaru — 0 testów):**
   * Jawny stan pusty — znaczniki zakończenia w logach (`SE` = samogaśnięcie, `FT` = zamknięcie dopływu paliwa) to punkty skryptu aparaturowego, a nie testy środków gaśniczych.
4. **`Unknown / Ops Logs` (Brak przypisania bezpieczeństwa / logi operacyjne — 29 testów `ACME CFI-G`):**
   * Dokumentacja techniczna dołączona do `PSI-159` opisuje konstrukcję palnika i logi dzienne, bez formalnych deklaracji w kategoriach prewencja/detekcja/gaszenie.

### 5.4 Dolny pasek `Instant Comparisons (F12):`
Trzy gotowe przyciski uruchamiające jednym kliknięciem modal porównania wieloprzebiegowego **F12**:
1. **`Hot vs Cool Flame (21174C2 vs 21174C3)`** — porównuje w niemal identycznej atmosferze ($39.5\text{–}39.7\%\ \text{O}_2$, $202.7\ \text{kPa}$) gorący płomień (`PCI-hot`) z zimnym płomieniem (`PCI-D`).
2. **`Ethane O₂ Span (21088P1 vs 21088H1)`** — porównuje dolną granicę zapłonu etanu przy $18.0\%\ \text{O}_2$ z długim spalaniem przy $37.6\%\ \text{O}_2$ ($\sim 1\ \text{atm}$).
3. **`FLEX Dodecane Droplets (FLEX-1249 vs FLEX-1226)`** — porównuje spalanie kropli dodekanu przy $1\ \text{atm}$ vs $1.25\ \text{atm}$.

---

## 6. Tabela wyników i kolejka porównawcza (`ResultsTable` & `Compare Queue` — F03, F12)

Tabela pod panelem analitycznym pokazuje wszystkie testy pasujące do aktywnych filtrów:

* **Nagłówek i szybkie filtrowanie tekstowe (`Filter by case ID, title, fuel…`):**
  * Wpisywany tekst filtruje lokalnie w pamięci widoczne wiersze tabeli i wizualizacje w `Mission Analytics & Regime Explorer` według `case_id`, tytułu, nazwy kampanii lub paliwa — **bez** wysyłania zapytań do serwera.
* **Kolumny tabeli (wszystkie dane sortowalne lokalnie przez TanStack Table v8):**
  1. **Ikona wyboru (`+` / `✓`)**: przypina lub odpina przypadek do kolejki porównawczej (`Compare Queue`, maks. 4 biegi naraz).
  2. **`Run / Case`**: identyfikator (`CFIG-...` lub `FLEX-...`) oraz pełny tytuł eksperymentu.
  3. **`Investigation`**: plakietka kampanii (`ACME CFI-G` lub `CFI (FLEX)`).
  4. **`Fuel`**: paliwo (`butane`, `ethane`, `propane`, `dodecane`).
  5. **`O₂ (%)`**: stężenie tlenu w `%` (lub bursztynowa etykieta `— (null)` dla `FLEX-1213`).
  6. **`Pressure`**: ciśnienie w `kPa` oraz poniżej w przeliczeniu na `psi`.
  7. **`Z_st`**: stechiometryczny ułamek mieszaniny (lub `— (null)` dla testów `FLEX-*`).
  8. **Przycisk otwarcia (`→` / kliknięcie wiersza)**: otwiera stronę szczegółów `/cases/:caseId`, przy czym filtry i sortowanie eksploratora zostają zachowane w pamięci przy powrocie.
* **Pływający pasek w prawym dolnym rogu (`Compare Queue (X/4)`):**
  * Pojawia się, gdy przypięty jest co najmniej 1 test. Pokazuje przypięte znaczniki `Pinned ...`, przycisk `Clear` oraz przycisk **`Open Overlay Comparison`** (aktywny od 2 wybranych biegów; przy 1 biegu wyświetla `Select 1 more run`).

---

## 7. Okno porównywania wielu eksperymentów (`Cross-Run Telemetry Comparison` — F12)

Modal porównania wieloprzebiegowego umożliwia nakładanie na jednym interaktywnym wykresie od **2 do 4 eksperymentów** jednocześnie:

1. **Tabela parametrów porównawczych u góry okna:**
   * Zestawia obok siebie: nazwę biegu, kampanię, paliwo, `O₂`, `Pressure`, `Z_st` oraz **`Ignition Event t₀`** (dokładny czas zapłonu ze skryptu aparaturowego `*_TP.txt` lub `—` dla biegów bez logu, np. `FLEX`). Zawiera też przyciski szybkiego usunięcia biegu lub przejścia do jego strony szczegółów.
2. **Dwa tryby pracy (dobierane automatycznie do wybranych biegów):**
   * **Tryb Wspólnego Zbioru (*Shared Dataset Overlay Mode*):** gdy wszystkie wybrane testy należą do tej samej rodziny (np. tylko `ACME CFI-G` lub tylko `CFI (FLEX)`). Pozwala wybrać zbiór (np. `sensors` vs `mfc-setpoints` lub `droplet` / `coolflame` / `radiometer`) oraz konkretny kanał Y do nałożenia na wspólną oś Y w tej samej jednostce fizycznej.
   * **Tryb Między-kampańny (*Cross-Investigation Dual-Axis Mode*):** gdy jednocześnie porównujesz np. palnik gazowy `ACME CFI-G` z kroplą `CFI (FLEX)`. Interfejs automatycznie włącza dwie niezależne osie Y: **lewa oś** dla `ACME CFI-G` (wybrany kanał, np. `Radiometer3+30LoGain [raw]`) oraz **prawa oś** dla `CFI (FLEX)` (wybrany kanał, np. `DropletDiameter_mm [mm]` lub `TotalNarrowBandPower_W [W]`) — nigdy nie mieszając niezgodnych jednostek na jednej skali!
   * Jeśli w trybie wspólnym zostanie wybrany zbiór specyficzny tylko dla jednej kampanii (np. `d2-fit` istniejący tylko w `FLEX-1249`), modal jawnie informuje paskiem `Omitted from ... overlay (incompatible dataset family): ...`, które biegi pominięto.
3. **Przełącznik osi czasu (`Time: Aligned to Verified Ignition (Δt)` vs `Time: Raw Sensor Base (time_s)`):**
   * **Wyrównanie do zapłonu ($\Delta t = t - t_0$):** przesuwa oś czasu każdego biegu `CFI-G` tak, aby chwila zapłonu z logu (`Ignition and retraction`, np. $t_0 \approx 21\text{ s}$ lub $33\text{ s}$) wypadła dokładnie w $\Delta t = 0\ \text{s}$. Dzięki temu można bezpośrednio porównać dynamikę płomienia po zapłonie mimo różnych czasów nagrzewania przed zapłonem. Uwaga: dla biegów `FLEX` (brak pliku `*_TP.txt`) $t_0 = 0$ i czas pozostaje czasem źródłowym.
   * **Czas surowy (`time_s`):** wyświetla oryginalny czas od początku nagrania bez przesunięcia.
4. **Przycisk `Save Snapshot`**:
   * Eksportuje wykres porównawczy jako wysokiej jakości plik PNG (`comparison-....png`).

---

## 8. Strona szczegółów eksperymentu (`CaseDetailPage` — F05, F06, F22, F23)

Po wejściu w wybrany test (`/cases/:caseId`) strona dzieli się na przejrzyste sekcje:

1. **Pasek tożsamości i nawigacji u góry:**
   * Przycisk **`Back to Results`** (wraca do eksploratora z zachowaniem filtrów; w widoku błędu 404 widnieje **`Back to Explorer`**).
   * Odznaki `case_id` i `investigation` oraz przycisk **`Pin to Compare` / `Pinned to Compare`**.
   * **4 karty kluczowych parametrów z jednostkami:** `Fuel`, `Oxygen Concentration (% O₂)`, `Chamber Pressure (kPa i psi)` oraz `Mixture Fraction (Z_st)` (lub `Unknown (null)` przy braku danych).
   * **Sekcja wyjaśnienia narracyjnego** z plakietką **`Origin: template`** lub **`Origin: llm`**: krótkie podsumowanie warunków testu, przy czym `template` oznacza deterministyczny szablon z metadanych (bez halucynacji modelu językowego), a `llm` opis wygenerowany przez LLM na backendzie.
   * **Źródło i metadane (`Experimental Metadata & Run Context`):** pełna nazwa tabel źródłowych NASA, oryginalny komentarz (`note`), rodzaj zakończenia (`SE` vs `FT`), czas spalania, parametry z arkusza i PDF.
2. **Wybór zbioru danych (`Selected Dataset:` — F05) oraz `Export Raw CSV` (F23):**
   * Dla **`ACME CFI-G`** dostępne są **2 zbiory**:
     * `*-sensors`: *Sensor recording (raw channels)* — pełny, niepróbkowany zapis czujników (`125 Hz` z surowych plików, serwowany natywnie z Polars Parquet jako JSON bez utraty rozdzielczości; jednostki kanałów napięciowych nie są podane w źródle).
     * `*-mfc-setpoints`: *MFC setpoints (commanded)* — napięcia zadane regulatorów przepływu gazu (`V`), z czasem `time_s` współdzielącym punkt zerowy z rejestrem czujników.
   * Dla **`CFI (FLEX)`** dostępne są **3 zbiory** (a dla **`FLEX-1249` aż 4 zbiory**):
     * `*-droplet`: *Droplet diameter history* (`DropletDiameter_mm`) — każda oryginalna próbka z własną kolumną czasu pliku.
     * `*-coolflame`: *Cool-flame diameter* (`CoolFlameDiameterFWHM_mm`, `CoolFlameDiameterP2P_mm`).
     * `*-radiometer`: *Radiometer power* (`TotalWideBandPower_W`, `TotalNarrowBandPower_W`; ujemne wartości szerokopasmowe zachowane dokładnie tak, jak w pliku NASA).
     * `FLEX-1249-d2-fit` *(tylko w `FLEX-1249`)*: *D² history with linear fit (K = 0.417 mm²/s)* (`D2_mm2`, `D2_fit_mm2`, dopasowanie OLS w oknie `4–36 s`, `960` próbek, `R² = 0.9998`, bez pasma niepewności).
   * Kliknięcie innego zbioru pobiera tylko ten zbiór bezpośrednio z `GET /api/v1/datasets/{id}/data` (JSON z Parquet z walidacją deskryptora kolumn i wartości skończonych/`null`).
   * Przycisk **`Export Raw CSV`** *(widoczny w trybie `Live API`)* pobiera bezpośrednio plik CSV wygenerowany z Parquet na backendzie (`GET /api/v1/datasets/{id}/csv`) jako opcjonalny eksport, bez używania go do renderowania wykresów.
3. **Dolne panele merytoryczne:**
   * **`Research Context` (B14):** wyjaśnia powiązanie programu z bezpieczeństwem pożarowym statków kosmicznych (lub jego brak dla `PSI-159`), przytacza dokładne cytaty ze źródeł NASA i wyraźne zastrzeżenie o niecertyfikowaniu bezpieczeństwa.
   * **`Nearest Condition Runs` (B11):** pokazuje do **5 najbliższych biegów z tej samej kampanii** wraz z dokładnymi różnicami warunków ($\Delta \text{O}_2$, $\Delta P$, odległość standaryzowana $d$) i klikalnymi linkami pozwalającymi przeskoczyć do sąsiedniego testu (np. od testu bez zapłonu `21106H1` do testu z zapłonem `21106G6`).
   * **`Earth Applications & NASA PSI Investigation Context` (F22):** prezentuje oficjalne metadane NASA PSI dla danej kampanii (`PSI-159` dla `ACME CFI-G` lub `PSI-39` dla `CFI (FLEX)`), aparat badawczy na Międzynarodowej Stacji Kosmicznej (`CIR` / `MDCA`), dosłowne pole **`Research Impacts / Earth Benefits`** (m.in. potencjalny wzrost sprawności silników spalinowych z $\le 38\%$ do $60\%$ dzięki spalaniu ultra-ubogiemu w płomieniach zimnych w `PSI-159` oraz modelowanie liczb oktanowych/cetanowych i silników HCCI w `PSI-39`), podsumowanie celów kampanii oraz bezpośrednie linki do repozytorium NASA PSI (`https://psi.nasa.gov/physci/repo/data/investigations/PSI-159` i `PSI-39`), także w nagłówku `Source Reference`. Zastrzeżenie podkreśla, że jest to kontekst badawczy, a nie komercyjna walidacja ani certyfikacja bezpieczeństwa.

---

## 9. Kompletny słownik wszystkich kanałów pomiarowych i zdarzeń

### 9.1 Kanały w zbiorze `ACME CFI-G` (`*-sensors` — dokładnie 20 kolumn)

Oryginalna rejestracja ma dokumentowaną częstotliwość $125\ \text{Hz}$. Ponieważ pliki surowych danych `PSI-159_Raw Data_*_data.csv` nie podają jednoznacznych jednostek inżynierskich na osi Y dla kanałów czujników, aplikacja uczciwie oznacza je jako **`[raw]`** (wartości napięciowe/przetwornikowe w skali aparaturowej):

| Klucz kolumny (`key`) | Etykieta na stronie | Co mierzy i jak interpretować? |
| :--- | :--- | :--- |
| **`time_s`** | `Elapsed time [s]` | Czas od początku rejestracji zestawu pomiarowego w sekundach. |
| **`MFCA1StaticMixerFlow`** | `MFC A1 static mixer flow (raw)` | Przepływ gazu przez kontroler masy A1 (mieszalnik statyczny — dopływ głównego gazu / gazu rozcieńczającego $\text{N}_2$ w torze palnika). Skok/spadek oznacza zmianę składu lub otwarcie/zamknięcie przepływu. |
| **`MFCA2BypassFlow`** | `MFC A2 bypass flow (raw)` | Przepływ przez tor obejściowy (bypass) A2 służący do wstępnego ustalania/płukania lub rozdziału strumienia przed palnikiem. W `CFIG-21291C1` wyraźnie widać cykliczne wahania przepływu w rytm regulacji testu. |
| **`MFCA3FuelFlow`** | `MFC A3 fuel flow (raw)` | Faktycznie zmierzony sygnał przepływu paliwa przez regulator masy A3. Płaski poziom dodatni oznacza czas aktywnego podawania paliwa (między zapłonem a `MFCs off`). |
| **`IonCurrent`** | `Ion current (raw)` | Prąd jonizacji płomienia mierzony sondą elektryczną. Ponieważ płomień gorący wytwarza mnóstwo jonów ($\text{CHO}^+$, $\text{H}_3\text{O}^+$) w reakcji chemojonizacji, `IonCurrent` jest czułym detektorem **obecności strefy reakcji** między falami gorącymi i gaśnięciem. |
| **`PTA1`** | `Pressure transducer PTA1 (raw)` | Przetwornik ciśnienia komory / linii nr 1. Rejestruje stan ciśnienia w układzie (niewielki impuls przy zapłonie w zamkniętej komorze *CIR*). |
| **`PTA2`** | `Pressure transducer PTA2 (raw)` | Drugi przetwornik ciśnienia w układzie gazowym/komorze (*redundancja / pomiar różnicowy linii*). |
| **`PTA3`** | `Pressure transducer PTA3 (raw)` | Trzeci przetwornik ciśnienia w układzie badawczym `CFI-G`. |
| **`PMT1`** | `Photomultiplier PMT1 (raw)` | **Fotopowielacz #1** — niezwykle czuły detektor optyczny świecenia płomienia (zwykle przez filtr pasmowy rodników wzbudzonych, np. $\text{OH}^*$/$\text{CH}^*$ lub szerokopasmowo). Gwałtowne piki oznaczają fazę **gorącego płomienia**, a spadek bliski zera lub bardzo niski poziom wskazuje na przejście do **zimnego płomienia** albo zgaśnięcie. |
| **`PMT2`** | `Photomultiplier PMT2 (raw)` | **Fotopowielacz #2** (drugi kanał optyczny / inny filtr widmowy lub kąt obserwacji komory). |
| **`PMT3`** | `Photomultiplier PMT3 (raw)` | **Fotopowielacz #3** (trzeci kanał optyczny — w tym o innej czułości/zakresie widmowym, np. do słabego światła zimnego płomienia). |
| **`TCA`** | `Thermocouple TCA (raw)` | Termopara A mierząca lokalną temperaturę gazu/otoczenia przy palniku (bezwładność cieplna sprawia, że rośnie i opada łagodniej niż sygnały optyczne `PMT`). |
| **`TCB`** | `Thermocouple TCB (raw)` | Termopara B w kolejnej pozycji przestrzennej względem sfery palnika. |
| **`TCC`** | `Thermocouple TCC (raw)` | Termopara C — pomiar profilu termicznego wokół płomienia. |
| **`TCD`** | `Thermocouple TCD (raw)` | Termopara D — czwarty punkt pomiaru temperatury w strefie palnika. |
| **`TCBurner`** | `Burner thermocouple (raw)` | Termopara umieszczona bezpośrednio przy/w korpusie porowatego palnika sferycznego. Gdy płomień przysuwa się blisko palnika (wysokie $Z_{st}$), `TCBurner` rośnie gwałtownie (w `CFIG-21291J1` aż do przerwania testu: *„Hit the burner temperature limit”*). |
| **`Radiometer3+60LoGain`** | `Radiometer +60, low gain (raw)` | Szerokokątny / kierunkowy czujnik promieniowania cieplnego o pozycji kątowej `+60` i niskim wzmocnieniu (*low gain*), odporny na nasycenie przy bardzo jasnych gorących płomieniach. |
| **`Radiometer3+30LoGain`** | `Radiometer +30, low gain (raw)` | Główny radiometr referencyjny o pozycji `+30` (*low gain*), domyślnie wyświetlany na wykresie `Time-Series`. Najlepiej pokazuje bilans emisji podczerwonej płomienia (wysoka półka w *Hot Flame*, spadek w *Cool Flame*). |
| **`Radiometer3-10LoGain`** | `Radiometer -10, low gain (raw)` | Radiometr o pozycji kątowej `-10`, niskie wzmocnienie — monitoruje promieniowanie z innego sektora wokół palnika. |
| **`RadiometerOffset`** | `Offset radiometer (raw)` | Kanał tła/przesunięcia radiometru (*offset*), służący do kontroli dryftu termicznego i poziomu bazowego przed zapłonem i po wyłączeniu przepływów. |

### 9.2 Kanały nastaw przepływu `ACME CFI-G` (`*-mfc-setpoints` — 4 kolumny)

| Klucz kolumny (`key`) | Etykieta na stronie | Jednostka | Znaczenie |
| :--- | :--- | :--- | :--- |
| **`time_s`** | `Elapsed time` | `s` | Czas w sekundach. |
| **`MFCA1Setpoint(V)`** | `MFC A1 setpoint` | `V` | Napięcie sterujące zadane na regulator A1 (mieszalnik statyczny). |
| **`MFCA2Setpoint(V)`** | `MFC A2 setpoint` | `V` | Napięcie sterujące zadane na regulator A2 (bypass). |
| **`MFCA3Setpoint(V)`** | `MFC A3 setpoint` | `V` | Napięcie sterujące zadane na regulator paliwa A3 — dokładnie wyznacza skok ze stanu `0 V` na zadany przepływ i powrót do `0 V`. |

### 9.3 Zdarzenia ze skryptu aparaturowego `ACME CFI-G` (`*_TP.txt`, rozdzielczość $\approx 1\ \text{s}$)

Na wykresie czasowym dla zbioru `*-sensors` pionowe przerywane linie w kolorze bursztynowym oznaczają zdarzenia zarejestrowane przez sterownik eksperymentu:
* **`Ignition and retraction`**: wysunięcie gorącej spirali/iskrownika, zapłon mieszanki i wycofanie zapalnika ze strefy płomienia.
* **`Extinction detected`**: detekcja samogaśnięcia (*SE*) przez logikę sterującą komory (nie występuje w biegach przerwanych ręcznie/czasowo przez `FT`).
* **`MFCs off`**: zamknięcie masowych regulatorów przepływu paliwa i zakończenie podawania gazu.

### 9.4 Kanały w zbiorach kroplowych `CFI (FLEX)` (`FLEX-*` — łącznie 8 kolumn w 4 zbiorach)

> **Ważna uwaga synchronizacyjna NASA:** każdy z 3 plików danych `FLEX` (`droplet`, `coolflame`, `radiometer`) pochodzi z osobnego przyrządu i przechowuje własną oś czasu `time_s`, a oryginalna dokumentacja nie określa wspólnej synchronizacji zegarów między nimi.

| Zbiór (`dataset_id`) | Klucz kolumny | Etykieta | Jednostka | Znaczenie fizyczne |
| :--- | :--- | :--- | :--- | :--- |
| `*-droplet` | **`time_s`** | `Time (source time base)` | `s` | Czas bazowy wideo analizy kropli. |
| `*-droplet` | **`DropletDiameter_mm`** | `Droplet diameter` | `mm` | Średnica kropli $n$-dodekanu $D(t)$ wyznaczona z klatek kamery (typowa kropla początkowa ma $D_0 \approx 4.0\text{–}5.6\ \text{mm}$). |
| `*-coolflame` | **`CoolFlameDiameterFWHM_mm`** | `Cool-flame diameter (FWHM)` | `mm` | Średnica otoczki zimnego płomienia w połowie wysokości profilu jasności (*Full Width at Half Maximum* z kamery UV/intensyfikowanej). |
| `*-coolflame` | **`CoolFlameDiameterP2P_mm`** | `Cool-flame diameter (peak to peak)` | `mm` | Średnica mierzona od maksimum do maksimum intensywności po obu stronach pierścienia zimnego płomienia (*Peak-to-Peak*). |
| `*-radiometer` | **`TotalWideBandPower_W`** | `Total wide-band power` | `W` | Całkowita moc promieniowania szerokopasmowego. **W oryginalnych plikach NASA wartości są duże i ujemne** (np. ok. `-7 W` do `-20 W` z powodu niekalibrowanego/odwróconego offsetu detektora) — aplikacja świadomie pokazuje je wprost bez „poprawiania” w locie. |
| `*-radiometer` | **`TotalNarrowBandPower_W`** | `Total narrow-band power` | `W` | Całkowita moc promieniowania wąskopasmowego [W] — czyste wyjście z radiometru, na którym najwyraźniej widać pik gorącego zapłonu ($0.5\text{–}3\ \text{W}$) oraz płaskie, niskie plateau fazy zimnego płomienia ($\sim 0.01\text{–}0.04\ \text{W}$). |
| `FLEX-1249-d2-fit` | **`D2_mm2`** | `Droplet diameter squared` | `mm²` | Kwadrat średnicy kropli $D^2(t)$, który w klasycznym modelu Godsave’a–Spaldinga opada liniowo z czasem. |
| `FLEX-1249-d2-fit` | **`D2_fit_mm2`** | `Least-squares line (fit window only)` | `mm²` | Dopasowanie prostej metodą najmniejszych kwadratów (nie jest wartością NASA, wyliczone w tym projekcie dla okna $4\text{–}36\ \text{s}$, 960 próbek): daje stałą szybkości spalania **$K = 0.417\ \text{mm}^2/\text{s}$** przy współczynniku dopasowania **$R^2 = 0.9998$** (dla porównania podsumowanie PDF NASA podaje $k_{\text{avg}} = 0.426\ \text{mm}^2/\text{s}$). |

---

## 10. Wszystkie wykresy i kontrolki na stronie przypadku (F07, F08, F11, F13, F21)

Na stronie eksperymentu znajdują się dwa bloki wizualizacyjne: główny obszar roboczy **`TelemetryWorkspace`** (3 zakładki) oraz rozwijany **`Cool-Flame Droplet Lifecycle Deck (F13)`**.

### 10.1 Zakładka 1: `Time-Series` (`HeroTimeSeriesChart` — F07 & F21)

Główny interaktywny wykres przebiegów czasowych w ECharts:
* **Pigułki wyboru kanałów (`Channels`):** kliknięcie dowolnego kanału (np. `Radiometer +30, low gain (raw) [raw]`) włącza/wyłącza krzywą z zachowaniem spójnych kolorów. Obok każdej nazwy podana jest jej jednostka (`[raw]`, `[V]`, `[mm]`, `[mm²]`, `[W]`).
* **Automatyczna separacja niezgodnych jednostek:** jeśli zaznaczysz jednocześnie kanały w dwóch różnych jednostkach (np. `time` i `[V]` vs `[raw]`), wykres automatycznie dzieli się w pionie na **2 zsynchronizowane panele**, a pod przyciskami pojawia się informacja `Incompatible sensor units (...) are separated across linked panels/axes rather than merged on one scale.`
* **Przycisk `Default Channels`:** przywraca domyślny, ręcznie dobrany zestaw najbardziej informatywnych kanałów dla wybranego zbioru (w `sensors`: `Radiometer3+30LoGain`, `PMT1`, `MFCA3FuelFlow`; w `mfc-setpoints`: wszystkie 3 napięcia; w `coolflame`: `FWHM` + `P2P`; w `radiometer`: `TotalNarrowBandPower_W`; w `d2-fit`: `D2_mm2` + `D2_fit_mm2`).
* **Narzędzia powiększania (Zoom):**
  * Kółko myszy wewnątrz wykresu płynnie przybliża/oddala wycinek czasu.
  * Dolny suwak **`DataZoom`** pozwala chwytać uchwyty początku i końca okna lub przesuwać cały zaznaczony wycinek czasu.
  * W prawym górnym rogu płótna wykresu znajdują się ikony lupy ECharts: **`Box Zoom`** (zaznaczanie prostokąta myszą) i **`Undo Zoom`** (cofnięcie kroku powiększenia).
  * Przycisk **`Reset Zoom`** nad wykresem jednym kliknięciem przywraca pełny zakres $0\text{–}100\%$ czasu.
* **Linie zdarzeń skryptowych:** bursztynowy pasek nad wykresem wypisuje dokładne czasy z pliku `*_TP.txt`, a na wykresie rysują się opisane pionowe linie przerywane.
* **Przycisk `Export PNG` (F21):** zapisuje aktualny wykres z zachowaniem osi i jednostek jako obraz PNG (`{dataset_id}-timeseries.png`) w rozdzielczości $2\times$.

### 10.2 Zakładka 2: `Scatter View` (`ScatterPlotChart` — F08)

Przełącza widok tych samych wczytanych danych (bez ponownego pobierania z backendu) na wykres rozrzutu **Kanał X vs Kanał Y**:
* **Listy wyboru `X-Axis Channel` i `Y-Axis Channel`:** pozwalają zestawić dowolne dwa kanały liczbowe (np. `MFCA3FuelFlow` na osi X i `Radiometer3+30LoGain` na osi Y — pokazując histerezę zapłonu i gaśnięcia przy tym samym przepływie, albo `PMT1` vs `Radiometer` pokazując dwa reżimy płomienia gorącego i zimnego).
* **Automatyczne wartości domyślne:** wybiera dwie pierwsze kolumny z `default_y`, jeśli zbiór ma co najmniej dwie (`FWHM` vs `P2P` dla zimnego płomienia; `D2_mm2` vs `D2_fit_mm2` dla testu dopasowania $D^2$), albo `default_x` (`time_s`) vs `default_y[0]`.
* **Liczniki kompletności próbek:**
  * Zielono-cyjanowa odznaka `X plotted points`: liczba faktycznie narysowanych par $(x, y)$.
  * Pomarańczowa odznaka `X rows excluded (null/non-numeric)`: jawna liczba wierszy pominiętych, ponieważ co najmniej jedna z wybranych osi miała wartość `null` (brakująca próbka nie jest zamieniana na zero!).
* **Narzędzia:** kółko myszy i dolny suwak powiększenia, podpowiedź `Sample #idx` po najechaniu na punkt oraz **`Export PNG`**.

### 10.3 Zakładka 3: `Parallel Coords` (`ParallelCoordinatesChart` — F11)

Wielowymiarowy wykres współrzędnych równoległych pozwalający oglądać od **2 do 7 kanałów** naraz (każda linia łamana to jeden moment czasowy w teście):
* **Pigułki wyboru osi (maks. 7 równolegle):** kliknięciem dodajesz lub usuwasz osie (minimum 2 muszą pozostać aktywne); przycisk **`Defaults`** wraca do domyślnego zestawu kanałów.
* **Inteligentne próbkowanie przy dużych zbiorach (`strided samples`):** jeśli kompletnych wierszy jest ponad `1500` (co często zdarza się w trybie `Live API` przy $125\ \text{Hz}$), wykres równomiernie próbkuje co $k$-ty wiersz i jawnie informuje w etykiecie: `X strided samples (Y complete rows)`, aby uniknąć zawieszenia przeglądarki. Wiersze z `null` w którejkolwiek z wybranych osi są wykluczane i zliczane.
* **Skala barwna (`visualMap`):** u góry znajduje się pasek gradientu od **`Low {firstCol}`** (fiolet) przez cyjan po **`High {firstCol}`** (pomarańczowy) — koloruje każdą linię według jej wartości na **pierwszej wybranej osi** (zwykle `time_s`, dzięki czemu widać ewolucję całego zestawu czujników w czasie od początku do końca biegu!).
* **Interaktywne filtrowanie na osiach (*Axis Brushing*):** przeciągnięcie pionowego zakresu bezpośrednio po dowolnej osi pionowej podświetla tylko te momenty czasowe, które spełniają zaznaczony przedział na danej osi (jest to filtrowanie lokalne wykresu, nie zmienia filtrów katalogu).
* **Przycisk `Export PNG`:** zapisuje wykres jako PNG.

### 10.4 Panel `Cool-Flame Droplet Lifecycle Deck` (`CoolFlameLifecycleDeck` — F13)

Panel pod obszarem roboczym, otwierany automatycznie dla wszystkich 14 eksperymentów **`CFI (FLEX)`** (i zwinięty domyślnie w `ACME CFI-G`, gdzie można go ręcznie rozwinąć przyciskiem **`Launch Synchronized Multi-Dataset View (F13)`** lub zwinąć przyciskiem **`Collapse Lifecycle Deck`**):

* **Cel naukowy (dlaczego 3 zbiory naraz?):** pojedynczy wykres pokazuje jeden plik na raz. W eksperymentach kroplowych kluczowe zjawiska zachodzą w tym samym momencie na 3 różnych przyrządach:
  1. **Tier 1:** średnica kropli (`Show D² (mm²)` vs `Show D (mm)` — przełącznik powyżej wykresu). Gdy bieg nie ma gotowego zbioru `*-d2-fit`, aplikacja wylicza $D^2(t) = (\text{DropletDiameter\_mm})^2$ jako jawną transformację po stronie klienta (oznaczoną w podtytule panelu), a dla `FLEX-1249` prezentuje krzywą z dopasowaną prostą **B12 OLS Fit: `K = 0.417 mm²/s • R² = 0.9998`**.
  2. **Tier 2:** średnica zimnego płomienia (`CoolFlameDiameterFWHM_mm` i `CoolFlameDiameterP2P_mm`). Płomień zimny zapala się po zgaśnięciu gorącego i ma znacznie mniejszą/ewoluującą otoczkę niż gorący płomień.
  3. **Tier 3:** moc radiometryczna (`TotalNarrowBandPower_W` w `W`) — wyraźnie pokazuje nagły szczyt gorącego zapłonu oraz długie, niskie plateau promieniowania fazy zimnego płomienia (współczynnik skali na osiach bywa odwrócony o rząd wielkości).
* **Uwaga dotycząca czasu:** nagłówek panelu przypomina, że `FLEX` posiada niezależne osie czasu z 3 plików bez udokumentowanej synchronizacji zegara, a w trybie `Live API` wszystkie 3–4 zbiory ładują się równolegle i niezależnie.

---

## 11. Kompletny katalog wszystkich 43 eksperymentów (`29 ACME CFI-G` + `14 CFI (FLEX)`)

Poniżej znajdują się **wszystkie 43 testy z bazy PSI-Lens** wraz z kompletem ich dokładnych parametrów merytorycznych w momencie publikacji tego przewodnika.

### 11.1 Kampania `ACME CFI-G` — 29 eksperymentów z palnikiem gazowym (`PSI-159`)

Oznaczenia zakończenia testu w tabeli:
* **`SE`** (*Self-Extinction*) — płomień zgasł samoczynnie w komorze.
* **`FT`** (*Flow Termination*) — płomień palił się stabilnie aż do zaprogramowanego wyłączenia dopływu paliwa (`MFCs off`).
* **`No hot ign.`** — w tabeli źródłowej brak gorącego zapłonu (albo brak zapłonu w ogóle, albo **bezpośredni zimny płomień** bez fazy gorącej).
* $X_f$ — ułamek molowy paliwa w strumieniu zasilającym palnik (reszta $1 - X_f$ to azot $\text{N}_2$).

| Case ID | Paliwo ($X_f$) | $\text{O}_2$ [%] | Ciśnienie [kPa] ([psi]) | $Z_{st}$ | Przepływ paliwa | Czas spalania | Zakończenie i czasy skryptu `*_TP.txt` (`Ign` / `Ext` / `MFC off`) | Szczegóły i komentarz NASA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CFIG-21088H1`** | `ethane` ($0.5$) | `37.614` | `94.44` (`13.70`) | `0.1746` | `1.0 mg/s` | `62 s` | `FT` (`44 s` / `—` / `107 s`) | Długie spalanie etanu w wzbogaconym $\text{O}_2$ zakończone odcięciem gazu. |
| **`CFIG-21088P1`** | `ethane` ($0.5$) | `17.969` | `101.33` (`14.70`) | `0.0940` | `1.0 mg/s` | `8 s` | `SE` (`34 s` / `50 s` / `53 s`) | **Najniższe $\text{O}_2$ ($18.0\%$) w selekcji, przy którym nastąpił zapłon**; krótkie spalanie przed samogaśnięciem. |
| **`CFIG-21102C3`** | `butane` ($0.5$) | `38.622` | `101.33` (`14.70`) | `0.1476` | `1.2 mg/s` | `82 s` | `SE` (`23 s` / `109 s` / `112 s`) | Stabilny gorący płomień butanu 50% przy wysokim tlenie i ciśnieniu $1\ \text{atm}$. |
| **`CFIG-21102M2`** | `butane` ($0.5$) | `23.365` | `101.33` (`14.70`) | `0.0966` | `0.8 mg/s` | `14 s` | `SE` (`21 s` / `40 s` / `43 s`) | Komentarz źródłowy: *„may have intensified images”*. |
| **`CFIG-21106F2`** | `butane` ($0.5$) | `35.424` | `50.665` (`7.35`) | `0.1376` | `0.8 mg/s` | `—` | `No hot ign.` (`33 s` / `68 s` / `71 s`) | **Bezpośredni zimny płomień bez gorącego zapłonu** (*„direct cool - no hot ignition”*) przy $0.5\ \text{atm}$. |
| **`CFIG-21106F5`** | `butane` ($0.5$) | `35.294` | `50.665` (`7.35`) | `0.1372` | `0.5 mg/s` | `—` | `No hot ign.` (`32 s` / `67 s` / `70 s`) | **Bezpośredni zimny płomień bez gorącego zapłonu** (*„direct cool - no hot ignition”*) przy niższym przepływie $0.5\ \text{mg/s}$. |
| **`CFIG-21106G6`** | `butane` ($0.5$) | `20.970` | `50.665` (`7.35`) | `0.0879` | `0.8 mg/s` | `20 s` | `SE` (`32 s` / `60 s` / `63 s`) | Gorący zapłon przy $21.0\%\ \text{O}_2$ i $0.5\ \text{atm}$ (*„hot flame, the igniter stayed in the flame longer than others”*); porównaj z `21106H1`. |
| **`CFIG-21106H1`** | `butane` ($0.5$) | `20.669` | `50.665` (`7.35`) | `0.0867` | `0.8 mg/s` | `—` | `No hot ign.` (`30 s` / `47 s` / `50 s`) | **Granica palności ($20.7\%\ \text{O}_2$ vs $21.0\%$ w `21106G6`)**: brak gorącego zapłonu przy niemal tych samych warunkach. |
| **`CFIG-21112A3`** | `propane` ($1.0$) | `39.127` | `94.44` (`13.70`) | `0.1045` | `1.2 mg/s` | `95 s` | `SE` (`21 s` / `123 s` / `126 s`) | **Najdłuższy płomień czystego (nierozcieńczonego) propanu** w selekcji. |
| **`CFIG-21112H1`** | `propane` ($1.0$) | `21.180` | `101.33` (`14.70`) | `0.0608` | `0.5 mg/s` | `12 s` | `SE` (`30 s` / `53 s` / `56 s`) | Czysty propan na granicy palności w atmosferze zbliżonej do ziemskiej — zapalił się na $12\ \text{s}$. |
| **`CFIG-21112H3`** | `propane` ($1.0$) | `21.140` | `101.33` (`14.70`) | `0.0607` | `0.5 mg/s` | `—` | `No hot ign.` (`32 s` / `48 s` / `51 s`) | **Najniższe $Z_{st}$ w całym katalogu (`0.0607`)**; brak zapłonu tuż obok `21112H1` mimo niemal identycznej atmosfery. |
| **`CFIG-21130M2`** | `propane` ($0.3$) | `21.050` | `202.66` (`29.39`) | `0.1377` | `2.0 mg/s` | `7 s` | `SE` (`22 s` / `41 s` / `44 s`) | Rozcieńczony propan przy podwyższonym ciśnieniu $\sim 2\ \text{atm}$. |
| **`CFIG-21130N1`** | `propane` ($0.3$) | `21.666` | `303.99` (`44.09`) | `0.1411` | `1.0 mg/s` | `6 s` | `SE` (`21 s` / `37 s` / `40 s`) | **Najwyższe ciśnienie wśród testów `CFI-G` ($\sim 3\ \text{atm}$ / $304\ \text{kPa}$)** — szybkie gaśnięcie po $6\ \text{s}$. |
| **`CFIG-21137A5`** | `propane` ($0.3$) | `35.568` | `101.33` (`14.70`) | `0.2092` | `1.1 mg/s` | `44 s` | `SE` (`21 s` / `78 s` / `81 s`) | Rozcieńczony propan w $35.6\%\ \text{O}_2$ przy $1\ \text{atm}$. |
| **`CFIG-21153A2`** | `ethane` ($0.3$) | `37.590` | `50.665` (`7.35`) | `0.2578` | `1.5 mg/s` | `88 s` | `SE` (`24 s` / `127 s` / `130 s`) | Etan 30% w podciśnieniu $0.5\ \text{atm}$ i wysokim tlenie — długie spalanie ($88\ \text{s}$). |
| **`CFIG-21153A4`** | `ethane` ($0.3$) | `33.493` | `50.665` (`7.35`) | `0.2373` | `0.5 mg/s` | `56 s` | `FT` (`20 s` / `—` / `78 s`) | Etan 30% przy $0.5\ \text{atm}$ zakończony wyłączeniem dopływu. |
| **`CFIG-21153C7`** | `ethane` ($0.3$) | `38.206` | `202.66` (`29.39`) | `0.2607` | `1.0 mg/s` | `61 s` | `FT` (`22 s` / `—` / `84 s`) | Etan 30% przy $2\ \text{atm}$ i wysokim $Z_{st}$ (`0.261`), utrzymany do końca testu. |
| **`CFIG-21162A2`** | `ethane` ($0.3$) | `39.497` | `101.33` (`14.70`) | `0.2669` | `1.5 mg/s` | `71 s` | `SE` (`24 s` / `106 s` / `109 s`) | Etan 30% w bardzo bogatym tlenie przy $1\ \text{atm}$. |
| **`CFIG-21162C1`** | `ethane` ($0.3$) | `21.000` | `101.33` (`14.70`) | `0.1656` | `0.5 mg/s` | `19 s` | `SE` (`—` / `55 s` / `58 s`) | Etan 30% w $21.0\%\ \text{O}_2$, $1\ \text{atm}$ (w logu skryptowym brak wpisu `Ign`, obecne `Ext` i `MFC off`); porównaj z `21162F1`. |
| **`CFIG-21162F1`** | `ethane` ($0.3$) | `20.722` | `101.33` (`14.70`) | `0.1638` | `1.5 mg/s` | `—` | `No hot ign.` (`33 s` / `57 s` / `60 s`) | Brak zapłonu przy $20.7\%\ \text{O}_2$ i wyższym przepływie $1.5\ \text{mg/s}$ (wobec `21162C1`). |
| **`CFIG-21174A3`** | `butane` ($0.3$) | `37.852` | `50.665` (`7.35`) | `0.1959` | `1.5 mg/s` | `54 s` | `SE` (`20 s` / `86 s` / `89 s`) | Butan 30% przy niskim ciśnieniu $0.5\ \text{atm}$ i wysokim $\text{O}_2$. |
| **`CFIG-21174C2`** | `butane` ($0.3$) | `39.655` | `202.66` (`29.39`) | `0.2029` | `2.0 mg/s` | `29 s` | `SE` (`23 s` / `64 s` / `67 s`) | **`PCI-hot` (najwyższe $\text{O}_2$ w bazie: `39.655%`)**: gorący odpowiednik do pary z `21174C3` (wyższy przepływ $2\ \text{mg/s}$ podtrzymał płomień gorący). |
| **`CFIG-21174C3`** | `butane` ($0.3$) | `39.537` | `202.66` (`29.39`) | `0.2025` | `1.5 mg/s` | `35 s` | `SE` (`23 s` / `70 s` / `73 s`) | **`Cool flame: yes, PCI-D`** (*„Cool flame!”*): niemal te same warunki co `21174C2`, lecz przepływ $1.5\ \text{mg/s}$ przeszedł w zimny płomień! |
| **`CFIG-21174C4`** | `butane` ($0.3$) | `39.431` | `202.66` (`29.39`) | `0.2020` | `1.0 mg/s` | `90 s` | `SE` (`23 s` / `125 s` / `128 s`) | **`Cool flame: yes, PCI-B`** (*„Cool flame!”*): zimny płomień przy jeszcze niższym przepływie $1.0\ \text{mg/s}$, płonący aż $90\ \text{s}$. |
| **`CFIG-21174D1`** | `butane` ($0.3$) | `39.249` | `202.66` (`29.39`) | `0.2013` | `1.0 mg/s` | `83 s` | `SE` (`21 s` / `118 s` / `121 s`) | **`Cool flame: yes, PCI-C`** (*„Cool flame!”*): powtórzenie w warunkach bardzo bliskich `21174C4`. |
| **`CFIG-21174F1`** | `butane` ($0.3$) | `39.082` | `202.66` (`29.39`) | `0.2007` | `1.5 mg/s` | `40 s` | `SE` (`30 s` / `84 s` / `87 s`) | **`Cool flame: yes, PCI-E`** (*„Cool flame!”*): piąty przypadek z serii zimnych płomieni `21174*`. |
| **`CFIG-21174F4`** | `butane` ($0.3$) | `38.406` | `202.66` (`29.39`) | `0.1980` | `1.5 mg/s` | `35 s` | `FT` (`32 s` / `—` / `76 s`) | Normalny płomień butanu przy nieco niższym $\text{O}_2$ ($38.4\%$) zakończony odcięciem gazu. |
| **`CFIG-21291C1`** | `butane` ($0.3$) | `39.423` | `202.66` (`29.39`) | `0.2020` | `1.0 mg/s` | `246 s` | `FT` (`24 s` / `—` / `271 s`) | **Główny przypadek demonstracyjny (`PCI-F`)**: **5 pełnych przejść z gorącego płomienia w zimny** w jednym $246$-sekundowym biegu (*„5 transitions from hot to cool, 6 hot and 5 cool flames”*). |
| **`CFIG-21291J1`** | `butane` ($0.15$) | `38.544` | `101.33` (`14.70`) | `0.3032` | `0.75 mg/s` | `80 s` | `FT` (`32 s` / `—` / `113 s`) | **Najwyższe $Z_{st}$ w całym katalogu (`0.3032`)** z powodu silnego rozcieńczenia ($X_f=0.15$). Komentarz: *„Hit the burner temperature limit”*. |

### 11.2 Kampania `CFI (FLEX)` — 14 eksperymentów kroplowych z $n$-dodekanem (`PSI-39`)

Wszystkie testy używają ciekłego $n$-dodekanu ($\text{C}_{12}\text{H}_{26}$), dlatego `Z_st = null`. Wartość ciśnienia w filtrze pochodzi z arkusza głównego (*Master Sheet*: w $\text{atm}$ przeliczonym na $\text{kPa}$), a dokładniejsze ciśnienie zmierzone w $\text{mmHg}$ i przeliczone na $\text{kPa}$ podane jest z raportów `Summary PDF`.

| Case ID | Numer biegu CIR | $\text{O}_2$ [%] (Master / PDF $Y_{\text{O}_2}$) | Skład gazu (ułamki mol.) | Ciśnienie w filtrze [kPa] (Master / Summary PDF) | Początkowa średnica $D_0$ [mm] | Średnia stała spalania $k_{\text{avg}}$ [$\text{mm}^2/\text{s}$] | Uwagi i cechy szczególne |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`FLEX-1213`** | `F086A04` | **`null`** (`0.17` vs PDF `0.21`) | $\text{O}_2$ `0.17` / $\text{N}_2$ `0.83` (spór z PDF) | `101.325` (`1 atm` / `772.13 mmHg = 102.9 kPa`) | `4.189` | `0.189` | **Celowy przypadek `o2_pct = null`**: źródła NASA podają sprzeczne stężenie tlenu ($17\%$ vs $21\%$), więc filtr zachowuje niepewność. |
| **`FLEX-1218`** | `F090A03` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `101.325` (`1 atm` / `769.92 mmHg = 102.6 kPa`) | `4.283` | `0.371` | Kropla w nominalnym powietrzu $1\ \text{atm}$. |
| **`FLEX-1221`** | `F090A06` | `21.0` (`0.21` / `0.208`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.76` (w arkuszu) | `101.325` (`1 atm` / `771.67 mmHg = 102.9 kPa`) | `4.346` | `0.341` | Większa kropla przy $1\ \text{atm}$ i $21\%\ \text{O}_2$. |
| **`FLEX-1223`** | `F090A08` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `126.656` (`1.25 atm` / `946.62 mmHg = 126.2 kPa`) | `4.040` | `0.388` | Test przy lekko podwyższonym ciśnieniu $1.25\ \text{atm}$. |
| **`FLEX-1226`** | `F090A11` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `126.656` (`1.25 atm` / `947.23 mmHg = 126.3 kPa`) | `4.073` | `0.427` | Drugi test przy $1.25\ \text{atm}$ (część pary szybkiego porównania F12). |
| **`FLEX-1231`** | `F095A06` | `17.0` (`0.17` / `0.17`) | $\text{O}_2$ `0.17`, $\text{N}_2$ `0.83` | `303.975` (`3 atm` / `2256.82 mmHg = 300.9 kPa`) | `4.141` | `0.490` | Atmosfera zubożona ($17\%\ \text{O}_2$) przy wysokim ciśnieniu $3\ \text{atm}$. |
| **`FLEX-1232`** | `F095A09` | `17.0` (`0.17` / `0.17`) | $\text{O}_2$ `0.17`, $\text{N}_2$ `0.83` | `303.975` (`3 atm` / `2257.45 mmHg = 301.0 kPa`) | `4.337` | `0.324` | Powtórzenie przy $17\%\ \text{O}_2$ i $3\ \text{atm}$ dla nieco większej kropli ($4.34\ \text{mm}$). |
| **`FLEX-1238`** | `F121A05` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `50.663` (`0.5 atm` / `387.28 mmHg = 51.6 kPa`) | `4.463` | `0.369` | Test półatmosferyczny ($0.5\ \text{atm}$). |
| **`FLEX-1240`** | `F121A07` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `50.663` (`0.5 atm` / `387.50 mmHg = 51.7 kPa`) | `4.081` | `0.351` | Drugi test półatmosferyczny ($0.5\ \text{atm}$) dla mniejszej kropli ($4.08\ \text{mm}$). |
| **`FLEX-1249`** | `F125A02` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `101.325` (`1 atm` / `767.80 mmHg = 102.4 kPa`) | `4.127` | `0.426` | **Czysty wzorzec prawa $D^2$**: zawiera 4. zbiór `FLEX-1249-d2-fit` ($K = 0.417\ \text{mm}^2/\text{s}$, $R^2 = 0.9998$ w oknie $4\text{–}36\ \text{s}$). |
| **`FLEX-1250`** | `F125A03` | `21.0` (`0.21` / `0.209`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `101.325` (`1 atm` / `768.49 mmHg = 102.5 kPa`) | `4.042` | `0.383` | Test referencyjny $1\ \text{atm}$ / $21\%\ \text{O}_2$. |
| **`FLEX-1253`** | `F125A07` | `21.0` (`0.21` / `0.208`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | `101.325` (`1 atm` / `770.26 mmHg = 102.7 kPa`) | `4.282` | `0.470` | Szybsze spalanie ($k_{\text{avg}} = 0.470$) przy $1\ \text{atm}$. |
| **`FLEX-1261`** | `F135A05` | `21.0` (`0.21` / `0.21`) | $\text{O}_2$ `0.21`, $\text{N}_2$ `0.79` | **`506.625`** (`5 atm` / `3777.61 mmHg = 503.6 kPa`) | `5.646` | `0.618` | **Najwyższe ciśnienie ($5\ \text{atm}$), największa kropla ($5.65\ \text{mm}$) i najwyższa stała spalania ($0.618\ \text{mm}^2/\text{s}$) w bazie**. |
| **`FLEX-1264`** | `F139A02` | `21.0` (`0.21` / `0.21`) | **$\text{O}_2$ `0.21`, $\text{N}_2$ `0.50`, $\text{He}$ `0.29`** | `101.325` (`1 atm` / `763.25 mmHg = 101.8 kPa`) | `4.217` | `0.426` | **Jedyny test z helem ($29\%\ \text{He}$)**: wysoka przewodność cieplna helu zmienia wymianę ciepła względem czystego powietrza. |

---

## 12. Szybki przewodnik czytania strony krok po kroku (60-sekundowa ścieżka demonstracyjna)

1. **Start w trybie `Live API`** (albo `Demo Fixtures` bez backendu) na stronie głównej: obejrzyj 43 przypadki w **`Atmosphere Heatmap (F10)`** i wypróbuj `Habitat Presets (F20)`.
2. **Kliknij przykład AI** `Butane >200 kPa & >39% O₂ (PL)` $\rightarrow$ obserwuj podświetlenie zmienionych pól po lewej, chipy nad tabelą i 7 wyselekcjonowanych biegów.
3. **Przełącz na zakładkę `Condition Galaxy & Z_st (F19/F15)`** $\rightarrow$ kliknij punkt `CFIG-21291C1` (6 gorących / 5 zimnych płomieni), zobacz jego sąsiadów **B11** i porównaj go w oknie **F12** z `CFIG-21174C2` (tylko gorący płomień) z włączonym wyrównaniem do zapłonu **`Time: Aligned to Verified Ignition (Δt)`**.
4. **Otwórz bieg `CFIG-21291C1`** $\rightarrow$ na wykresie `Time-Series` zobacz 5 charakterystycznych schodków spadku i powrotu na kanałach `Radiometer3+30LoGain` i `PMT1`; przełącz na `Scatter View` i `Parallel Coords`, aby obejrzeć korelację wielokanałową.
5. **Wróć (`Back to Results`), kliknij preset `CFI (FLEX) Droplets` i otwórz `FLEX-1249`** $\rightarrow$ w sekcji `Cool-Flame Droplet Lifecycle Deck (F13)` zobacz w jednym widoku spadek $D^2(t)$ z linią prostą ($K = 0.417\ \text{mm}^2/\text{s}$, $R^2 = 0.9998$), średnicę zimnego płomienia (`FWHM` i `P2P`) oraz skok mocy na radiometrze wąskopasmowym (`TotalNarrowBandPower_W`).
6. **Na stronie głównej kliknij kartę `SAFFIRE-III-S1` w kafelku `Special Featured Cases · SAFFIRE-III (NASA PSI-100)`** $\rightarrow$ przejdziesz do dedykowanego widoku `/special-cases/SAFFIRE-III-S1` (stworzonego wyłącznie dla `SAFFIRE-III`), przeczytaj **AI Mission & Telemetry Summary** (PL/EN), obejrzyj 7 zsynchronizowanych paneli `30 Hz` dla Próbki 1 (`1088 °C` na `TC11`), przełącz na `Sample 2`, uruchom odtwarzanie **`Play`** w Sekcji 3 i zbadaj reakcję kabinowego detektora dymu `FIZ 2` po $23\ \text{s}$ w Sekcji 4 (`1 Hz`).

---

## 13. Specjalne przypadki kuratorskie: `SAFFIRE-III` (`PSI-100`) — dedykowany widok 4-sekcyjny i podsumowanie AI

Poza standardowym katalogiem **43 eksperymentów** (`29 ACME CFI-G` + `14 CFI (FLEX)`), na stronie głównej nad wynikami znajduje się osobny kafelek **`Special Featured Cases · SAFFIRE-III (NASA PSI-100)`** prezentujący **`2 special cases`**: **`SAFFIRE-III-S1`** oraz **`SAFFIRE-III-S2`**.

> **Ważna uwaga konstrukcyjna:** Widok dostępny pod `/special-cases/:caseId` (`SaffireSpecPage`, adaptacja skryptu `saffire3`) jest **przygotowany wyłącznie dla tych dwóch przypadków `SAFFIRE-III`**. Po kliknięciu kafelka nie otwiera się uniwersalna strona `CaseDetailPage`, lecz specjalny 4-sekcyjny układ analityczny połączony z modułem podsumowania AI.

### 13.1 Czym był eksperyment NASA `SAFFIRE-III` (`PSI-100`)?

W 2017 roku, po odłączeniu zaopatrzeniowego statku towarowego **Cygnus OA-7** od Międzynarodowej Stacji Kosmicznej (zanim spłonął przy kontrolowanym wejściu w atmosferę), NASA przeprowadziła wewnątrz bezzałogowej kabiny kontrolowany pożar wielkoskalowej próbki (`~0.4 × 0.94 m`, przepływ powietrza ok. $25\ \text{cm/s}$, tlen $\approx 19.84\text{–}19.88\%$, ciśnienie początkowe $99.4\ \text{kPa}$). Pozwoliło to jednocześnie mierzyć:
* **Wewnątrz komory testowej (`30 Hz`):** gęstą sieć termopar powierzchniowych i gazowych, radiometrów, czujników $\text{O}_2$, $\text{CO}_2$, ciśnienia oraz anemometrów z arkuszy `Saffire III Sample 1 Sensors.xlsx` (`20,909` próbek, $690\ \text{s}$) i `Saffire III Sample 2 Sensors.xlsx` (`4,848` próbek, $160\ \text{s}$).
* **W kabinie statku Cygnus (`1 Hz`):** pokładową telemetrię statku z pliku `Saffire_Data_Table2017.161.00.42.03-EU.csv` (`11,449` wierszy, $6900\ \text{s}$), w tym komercyjny kabinowy detektor dymu **`FIZ 2` (scatterometer)** reagujący na impulsy drutu dymnego (`smoke_wire`) i produkty spalania.

### 13.2 Porównanie obu specjalnych przypadków (`Sample 1` vs `Sample 2`)

| Case ID | Czas trwania (`30 Hz`) | Okno zapalnika (`Igniter`) | Szczyt powierzchni (`TC7–TC12`) | Szczyt w smudze (`TC1–TC6`) | Radiometr i atmosfera | Charakterystyka |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`SAFFIRE-III-S1`** | `690.0 s` | `19.9 – 26.9 s` | **`1088 °C`** (`TC11`, $247\ \text{s}$ po zapłonie) | **`942 °C`** (`TC4`) | `169 mW/cm²` (`Radiometer 4`); $\text{O}_2$: $19.84 \rightarrow 19.40\%$; $\text{CO}_2$: $0.40 \rightarrow 0.61\%$; $\Delta P$: $+0.51\ \text{kPa}$; nawiew `25 cm/s` | **Pełnoskalowy pożar próbki** obejmujący wszystkie termopary i wyraźnie zmieniający skład gazu oraz ciśnienie w komorze. |
| **`SAFFIRE-III-S2`** | `160.0 s` | `60.03 – 67.98 s` | **`20.04 °C`** (`TC12`, próg $100\,^\circ\text{C}$ nieosiągnięty) | **`48.35 °C`** (`TC3` podczas zapalnika) | `-3.72 mW/cm²` (tło ok. `-17.5`); $\text{O}_2$: $19.88 \rightarrow 19.69\%$; $\text{CO}_2$: $0.38 \rightarrow 0.39\%$; $\Delta P$: $+0.15\ \text{kPa}$; nawiew `21 cm/s` | **Towarzyszący zapis `30 Hz` z krótszym impulsem zapalnika ($8.0\ \text{s}$)** — wyraźny skok temperatury w gazie smugi (`TC3`), podczas gdy powierzchnia próbki pozostała $\le 20.04\,^\circ\text{C}$. |

* **6 kafelków podsumowujących w nagłówku:** wyliczają bezpośrednio na górze strony szczytową temperaturę próbki, szczytowy strumień promieniowania (z przypomnieniem o ujemnej kalibracji spoczynkowej radiometrów ok. $-17\text{ do }-18\ \text{mW/cm}^2$), zmianę $\text{O}_2/\text{CO}_2$, przyrost ciśnienia od $99.4\ \text{kPa}$, prędkość przepływu przed zapłonem oraz czas reakcji detektora `FIZ 2` ($23\ \text{s}$).
* **Przełącznik `Sample 1` / `Sample 2`:** przyciski w nagłówku (oraz nad Sekcją 1) przełączają widoki między `SAFFIRE-III-S1` i `SAFFIRE-III-S2`, aktualizując wszystkie 4 sekcje i kontekst AI bez przeładowywania całej strony.

### 13.3 Moduł `AI Mission & Telemetry Summary (LLM Analysis)`

Dedykowana karta AI nad wykresami korzysta z endpointu backendowego `POST /api/v1/special-cases/{case_id}/ai-summary`:
* **Przełącznik języka (`PL` / `EN`) i 4 tryby fokusu:**
  * `Mission Overview` — przekrojowe podsumowanie pożaru i telemetrii Cygnusa;
  * `1. 30 Hz Burn & Plume` — analiza przebiegu palenia, radiometrów, termopar i gazów $\text{O}_2/\text{CO}_2$;
  * `2–3. Flame Arrival & Replay` — interpretacja kolejności nagrzewania `TC7–TC12` i zastrzeżeń geometrycznych;
  * `4. Cygnus 1 Hz Cabin` — analiza drutu dymnego (`smoke_wire`), opóźnienia `FIZ 2` ($23\ \text{s}$ od $0.025\ \text{V}$ do szczytu $1.805\ \text{V}$) oraz ciśnienia kabinowego `EPS`.
* **Pole własnego pytania (`Custom AI summary question`) + `Regenerate AI Summary`:** pozwala zadać modelowi AI szczegółowe pytanie dotyczące telemetryki `SAFFIRE-III` (np. o różnicę między Sample 1 a Sample 2).
* **Uczciwa odznaka trybu (`AI Mode: live` vs `AI Mode: demo`):** wyraźnie rozróżnia odpowiedź wygenerowaną przez zewnętrzny klucz LLM (`live`) od ugruntowanego w danych podsumowania offline (`demo`), pokazując jawnie sekcję **`Measurement Scope & Caveats`**.

### 13.4 Cztery sekcje wykresów na stronie `/special-cases/:caseId`

1. **Sekcja 1 — `The burn, sensor by sensor (30 Hz)`:**
   * 7 pionowo ułożonych paneli ze **wspólną, zsynchronizowaną osią czasu i wspólnym celownikiem (*crosshair*)**:
     1. `Sample surface temperature` (`TC7–TC12`, $^\circ\text{C}$);
     2. `Radiant heat flux` (`Radiometer 1–4`, $\text{mW/cm}^2$);
     3. `Plume (gas) temperature` (`TC1–TC6`, $^\circ\text{C}$);
     4. `Oxygen` ($\text{O}_2$, $\%$);
     5. `Carbon dioxide` ($\text{CO}_2$, $\%$);
     6. `Ambient pressure` ($\text{kPa}$);
     7. `Air flow speed` (`Anemometer 1–2`, $\text{cm/s}$).
   * **Obwiednia `min/max` do `2500` punktów na krzywą:** wiernie zachowuje ostre piki $30\ \text{Hz}$ i granice braków danych (`null`) bez sztucznego wygładzania.
   * **Żółty pasek zapalnika (`Igniter`):** zaznacza czas podania prądu zapalnika (`19.9–26.9 s` w Sample 1, `60.03–67.98 s` w Sample 2).
   * **Presety okien czasowych (`Whole run`, `Ignition`, `Peak burn`) oraz `Save Snapshot` (PNG).**
2. **Sekcja 2 — `Following the flame across the sample (TC7–TC12)`:**
   * Pokazuje czas pierwszego przekroczenia wybranego progu temperatury przez każdą termoparę powierzchniową:
     * dla **Sample 1**: progi **`≥ 100 °C`**, **`≥ 300 °C`** (domyślny), **`≥ 600 °C`**;
     * dla **Sample 2**: progi **`≥ 15 °C`** (domyślny), **`≥ 17 °C`** oraz **`≥ 100 °C`** (aby uczciwie pokazać, że żadna termopara nie osiągnęła $100\,^\circ\text{C}$, a lekkie nagrzanie od impulsu wynosiło kilkanaście $^\circ\text{C}$).
   * **Zastrzeżenie naukowe:** przetworzone arkusze nie podają współrzędnych geometrycznych montażu `TC7–TC12`, więc wykres dokumentuje **kolejność i czasy dotarcia**, a nie wyliczoną prędkość rozprzestrzeniania płomienia.
3. **Sekcja 3 — `Heating across the thermocouples (3 s bins)`:**
   * Interaktywny wykres słupkowy profilu temperatury dla `TC7–TC12` zagregowany w 3-sekundowych przedziałach czasu.
   * Przyciski **`Play` / `Pause`**, **`Reset`** oraz **suwak czasu** pozwalają obejrzeć krok po kroku falę cieplną przechodzącą po kolejnych termoparach próbki aż do ostygnięcia.
4. **Sekcja 4 — `What the spacecraft itself noticed (Cygnus 1 Hz telemetry)`:**
   * 5 zsynchronizowanych paneli z łączności pokładowej `1 Hz` Cygnusa OA-7:
     1. `Cygnus smoke detector FIZ 2, scatterometer` (`V` — surowy sygnał woltowy rozpraszania dymu, nie skalibrowane stężenie cząstek);
     2. `Saffire radiometers, 1 Hz downlink` ($\text{mW/cm}^2$);
     3. `Cygnus cabin pressure` (`EPS 1`, $\text{kPa}$);
     4. `Cygnus cabin air temperature` ($^\circ\text{C}$);
     5. `Saffire air flow` (`Anemometer 1`, $\text{cm/s}$).
   * **Zdarzenia na osi czasu:** przerywane pionowe linie oznaczają impulsy **`smoke_wire`** (drutu dymnego), a żółte pasy zaznaczają okna zapalników **Sample 2** (`~5759 s`) i **Sample 1** (`~5954 s`). Widać, że kabinowy detektor dymu `FIZ 2` zareagował **$\approx 23\ \text{s}$** po pierwszym impulsie drutu dymnego, wzrastając od tła $0.025\ \text{V}$ do szczytu $1.805\ \text{V}$ w trakcie palenia Próbki 1.
   * **Presety okien (`Experiment`, `First smoke`, `Whole downlink`) oraz `Save Snapshot` (PNG).**
   * **Rozdzielenie osi czasu:** zegar `30 Hz` komory Saffire i zegar `1 Hz` telemetryki Cygnusa różnią się w znacznikach źródłowych o ok. **1 dobę**, dlatego Sekcje 1–3 oraz Sekcja 4 celowo zachowują oddzielne osie czasu zamiast sztucznego nakładania.
