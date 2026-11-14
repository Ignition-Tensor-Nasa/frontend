"""Interactive, standalone page for NASA PSI-100 (Saffire-III spacecraft fire experiment).

Run from backend/:  python3 -m polars_analysis.saffire3 --data-dir ../data_nasa

Reads the calibrated 30 Hz sensor workbooks of both samples and the 1 Hz Cygnus
telemetry CSV, and writes polars_analysis/outputs/saffire3.html (Plotly embedded,
opens without a server). Values and units are the source's; nothing is modelled.
"""

import argparse
import json
from pathlib import Path

from openpyxl import load_workbook
import plotly.graph_objects as go
from plotly.offline import get_plotlyjs
from plotly.subplots import make_subplots
import polars as pl

from .loaders import downsample

FAMILY = "SAFFIRE-III_PSI-100"
TELEMETRY = "Saffire_Data_Table2017.161.00.42.03-EU.csv"
PSI_TO_KPA = 6.894757293168
POINT_LIMIT = 2500  # per curve; min/max envelope keeps peaks, see downsample()
# Validated categorical palette (dataviz reference), fixed order, never cycled.
COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"]
INK, MUTED, GRID = "#0b0b0b", "#52514e", "#e7e6e2"

SAMPLE_TC = [f"Sample Temp {n} (TC{n + 6})" for n in range(1, 7)]
PLUME_TC = [f"Plume Temp {n} (TC{n})" for n in range(1, 7)]
RADIOMETERS = [f"Radiometer {n}" for n in range(1, 5)]
# Panels of the burn explorer: (title, unit, {column: legend label}, factor)
PANELS = [
    ("Sample surface temperature", "°C", {c: f"TC{i + 7}" for i, c in enumerate(SAMPLE_TC)}, 1),
    ("Radiant heat flux", "mW/cm²", {c: f"Radiometer {i + 1}" for i, c in enumerate(RADIOMETERS)}, 1),
    ("Plume (gas) temperature", "°C", {c: f"TC{i + 1}" for i, c in enumerate(PLUME_TC)}, 1),
    ("Oxygen", "%", {"O2": "O₂"}, 1),
    ("Carbon dioxide", "%", {"CO2": "CO₂"}, 1),
    ("Ambient pressure", "kPa", {"Ambient Pressure": "Pressure"}, PSI_TO_KPA),
    ("Air flow speed", "cm/s", {"Anemometer 1": "Anemometer 1", "Anemometer 2": "Anemometer 2"}, 1),
]


def load_sample(root: Path, number: int) -> pl.DataFrame:
    """Calibrated 30 Hz sensor table of one sample; columns keep the source names."""
    path = root / FAMILY / "xlsx" / f"Saffire III Sample {number} Sensors.xlsx"
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        rows = list(workbook["Calibrated Data"].iter_rows(values_only=True))
    finally:
        workbook.close()
    names = [str(value).strip() for value in rows[0][:42] if value is not None]
    table = pl.DataFrame([row[:len(names)] for row in rows[2:] if row[0] is not None],
                         schema=names, orient="row", infer_schema_length=None)
    return (table.drop("Timestamp (ms)").cast(pl.Float64, strict=False)
            .rename({"Elapsed Time (s)": "t"}).sort("t"))


def load_telemetry(root: Path) -> pl.DataFrame:
    """1 Hz downlinked telemetry with t in seconds; rows with a broken timestamp are dropped."""
    raw = pl.read_csv(root / FAMILY / "csv" / TELEMETRY, infer_schema_length=20000)
    return (raw.rename({name: name.replace("P@", "").replace("sfsHk.", "") for name in raw.columns})
            .filter(pl.col("RelativeSeconds") >= 0)
            .with_columns((pl.col("RelativeSeconds") / 1000).alias("t")).sort("t"))


def reported(telemetry: pl.DataFrame, column: str) -> pl.DataFrame:
    """Cygnus channels are multiplexed: a row carries a channel only when it is non-zero."""
    return telemetry.filter(pl.col(column) != 0).select("t", pl.col(column).alias("value"))


def on_window(table: pl.DataFrame, column: str, threshold: float) -> tuple[float, float] | None:
    times = table.filter(pl.col(column) > threshold)["t"]
    return (times.min(), times.max()) if len(times) else None


def thin(table: pl.DataFrame, column: str, factor: float = 1) -> pl.DataFrame:
    return downsample(table.select("t", (pl.col(column) * factor).alias("value")), "t", POINT_LIMIT)


def style(figure: go.Figure, height: int) -> None:
    figure.update_layout(
        height=height, template="plotly_white", paper_bgcolor="#fcfcfb", plot_bgcolor="#fcfcfb",
        font=dict(family="system-ui, -apple-system, Segoe UI, sans-serif", size=13, color=INK),
        margin=dict(l=70, r=30, t=50, b=50), hoverlabel=dict(namelength=-1),
    )
    figure.update_xaxes(gridcolor=GRID, zeroline=False, linecolor=GRID, tickfont=dict(color=MUTED))
    figure.update_yaxes(gridcolor=GRID, zeroline=False, linecolor=GRID, tickfont=dict(color=MUTED))


def burn_figure(sample: pl.DataFrame, igniter: tuple[float, float] | None,
                presets: dict[str, tuple[float, float]]) -> go.Figure:
    """Stacked small multiples sharing the time axis (one y scale per measure)."""
    figure = make_subplots(rows=len(PANELS), cols=1, shared_xaxes=True, vertical_spacing=0.035,
                           subplot_titles=[f"{title} ({unit})" for title, unit, _, _ in PANELS])
    for row, (title, unit, columns, factor) in enumerate(PANELS, start=1):
        for index, (column, label) in enumerate(columns.items()):
            data = thin(sample, column, factor)
            figure.add_trace(go.Scatter(
                x=data["t"], y=data["value"], name=label, mode="lines",
                line=dict(width=2, color=COLORS[index]), legendgroup=title, legendgrouptitle_text=title,
                hovertemplate=f"{label}: %{{y:.2f}} {unit}<extra></extra>"), row=row, col=1)
        figure.update_yaxes(title_text=unit, row=row, col=1)
    if igniter:
        figure.add_vrect(x0=igniter[0], x1=igniter[1], fillcolor="#eda100", opacity=0.25, line_width=0,
                         annotation_text="igniter on", annotation_position="top left",
                         annotation_font=dict(size=11, color=MUTED), row=1, col=1)
        for row in range(2, len(PANELS) + 1):
            figure.add_vrect(x0=igniter[0], x1=igniter[1], fillcolor="#eda100", opacity=0.25,
                             line_width=0, row=row, col=1)
    last = f"xaxis{len(PANELS)}"
    figure.update_xaxes(showspikes=True, spikemode="across", spikethickness=1, spikecolor=MUTED,
                        spikedash="solid")
    figure.update_xaxes(title_text="Time since recording start (s)", rangeslider=dict(visible=True, thickness=0.03),
                        row=len(PANELS), col=1)
    style(figure, 1750)
    figure.update_layout(
        hovermode="x unified", hoversubplots="axis", legend=dict(groupclick="toggleitem", tracegroupgap=14),
        updatemenus=[dict(type="buttons", direction="right", x=0, xanchor="left", y=1.035, yanchor="bottom",
                          buttons=[dict(label=label, method="relayout",
                                        args=[{f"{last}.range": list(window)}])
                                   for label, window in presets.items()])],
    )
    return figure


def arrival_figure(sample: pl.DataFrame, thresholds: list[int]) -> go.Figure:
    """When each sample thermocouple first reached a temperature; threshold chosen by buttons."""
    labels = [f"TC{n + 7}" for n in range(6)]
    arrivals = {}
    for threshold in thresholds:
        arrivals[threshold] = [
            (sample.filter(pl.col(column) >= threshold)["t"].min()) for column in SAMPLE_TC]
    peaks = [sample[column].max() for column in SAMPLE_TC]
    first = thresholds[1]
    figure = go.Figure(go.Scatter(
        x=arrivals[first], y=labels, mode="markers+text", marker=dict(size=16, color=COLORS[1]),
        text=[None if value is None else f"{value:.0f} s" for value in arrivals[first]],
        textposition="middle right", textfont=dict(color=INK), customdata=peaks,
        hovertemplate="%{y} first reached the threshold at %{x:.1f} s"
                      "<br>peak %{customdata:.0f} °C<extra></extra>"))
    style(figure, 380)
    figure.update_layout(
        xaxis=dict(title="Time since recording start (s)", range=[0, sample["t"].max()]),
        yaxis=dict(title="Sample thermocouple", autorange="reversed"), margin=dict(t=70),
        updatemenus=[dict(type="buttons", direction="right", x=0, xanchor="left", y=1.08, yanchor="bottom",
                          active=1, buttons=[dict(
                              label=f"≥ {threshold} °C", method="restyle",
                              args=[{"x": [arrivals[threshold]],
                                     "text": [[None if value is None else f"{value:.0f} s"
                                               for value in arrivals[threshold]]]}])
                              for threshold in thresholds])],
    )
    return figure


def playback_figure(sample: pl.DataFrame, step: float = 3.0) -> go.Figure:
    """Animated temperature profile across the six sample thermocouples."""
    labels = [f"TC{n + 7}" for n in range(6)]
    binned = (sample.with_columns((pl.col("t") // step * step).alias("bin"))
              .group_by("bin").agg([pl.col(column).max() for column in SAMPLE_TC]).sort("bin"))
    top = max(binned[column].max() for column in SAMPLE_TC) * 1.08

    def bar(row):
        return go.Bar(x=labels, y=[row[column] for column in SAMPLE_TC], marker_color=COLORS[1],
                      marker_line_width=0, hovertemplate="%{x}: %{y:.0f} °C<extra></extra>")

    rows = binned.to_dicts()
    figure = go.Figure(
        data=[bar(rows[0])],
        frames=[go.Frame(data=[bar(row)], name=f"{row['bin']:.0f}") for row in rows])
    style(figure, 460)
    figure.update_layout(
        bargap=0.35, yaxis=dict(title="°C", range=[0, top]), xaxis=dict(title="Sample thermocouple"),
        margin=dict(t=30, b=110),
        updatemenus=[dict(type="buttons", direction="right", x=0, xanchor="left", y=-0.32, yanchor="top",
                          buttons=[
                              dict(label="▶ Play", method="animate", args=[None, dict(
                                  frame=dict(duration=60, redraw=False), transition=dict(duration=0),
                                  fromcurrent=True)]),
                              dict(label="⏸ Pause", method="animate", args=[[None], dict(
                                  frame=dict(duration=0, redraw=False), mode="immediate")])])],
        sliders=[dict(active=0, x=0.2, len=0.8, y=-0.2, currentvalue=dict(prefix="t = ", suffix=" s"),
                      steps=[dict(label=frame.name, method="animate", args=[[frame.name], dict(
                          frame=dict(duration=0, redraw=False), mode="immediate")])
                             for frame in figure.frames])],
    )
    return figure


def spacecraft_figure(telemetry: pl.DataFrame, events: dict) -> go.Figure:
    """What Cygnus itself recorded, on the telemetry file's own time axis."""
    saffire = telemetry.filter(pl.col("Radiometer1value") > -1000)  # sentinel when Saffire is off
    panels = [
        ("Cygnus smoke detector FIZ 2, scatterometer (V)", "V",
         [("Scatter", reported(telemetry, "CDH_F2PCM_SMK_DET_SCAT_SENS_P"))]),
        ("Saffire radiometers, 1 Hz downlink (mW/cm²)", "mW/cm²",
         [(f"Radiometer {n}", saffire.select("t", pl.col(f"Radiometer{n}value").alias("value")))
          for n in range(1, 5)]),
        ("Cygnus cabin pressure (kPa)", "kPa",
         [(f"EPS {n}", reported(telemetry, f"F{n}PCM_AIR_PRES_EPS{n}_SIG_POS")
           .with_columns(pl.col("value") * PSI_TO_KPA)) for n in (1, 2, 3)]),
        ("Cygnus cabin air temperature (°C)", "°C",
         [("Air temperature", reported(telemetry, "PCM_ETS_TEMP_SIG"))]),
        ("Saffire air flow (cm/s)", "cm/s",
         [("Anemometer 1", saffire.select("t", pl.col("Anemometer1").alias("value")))]),
    ]
    figure = make_subplots(rows=len(panels), cols=1, shared_xaxes=True, vertical_spacing=0.05,
                           subplot_titles=[title for title, _, _ in panels])
    for row, (title, unit, series) in enumerate(panels, start=1):
        for index, (label, data) in enumerate(series):
            figure.add_trace(go.Scatter(
                x=data["t"], y=data["value"], name=label, mode="lines",
                line=dict(width=2, color=COLORS[index]), legendgroup=title, legendgrouptitle_text=title.split(",")[0],
                hovertemplate=f"{label}: %{{y:.3f}} {unit}<extra></extra>"), row=row, col=1)
        figure.update_yaxes(title_text=unit, row=row, col=1)
        for label, window, color in (("Sample 2 igniter", events["igniter2"], "#eda100"),
                                     ("Sample 1 igniter", events["igniter1"], "#eda100")):
            if window:
                figure.add_vrect(x0=window[0], x1=window[1] + 1, fillcolor=color, opacity=0.45, line_width=0,
                                 annotation_text=label if row == 1 else None, annotation_position="top left",
                                 annotation_font=dict(size=11, color=MUTED), row=row, col=1)
        for moment in events["smoke_wire"]:
            figure.add_vline(x=moment, line=dict(color=MUTED, width=1, dash="dot"), row=row, col=1)
    last = f"xaxis{len(panels)}"
    figure.update_xaxes(showspikes=True, spikemode="across", spikethickness=1, spikecolor=MUTED,
                        spikedash="solid")
    figure.update_xaxes(title_text="Telemetry time (s)", rangeslider=dict(visible=True, thickness=0.04),
                        range=list(events["window"]), row=len(panels), col=1)
    style(figure, 1250)
    figure.update_layout(
        hovermode="x unified", hoversubplots="axis", legend=dict(groupclick="toggleitem", tracegroupgap=14),
        updatemenus=[dict(type="buttons", direction="right", x=0, xanchor="left", y=1.05, yanchor="bottom",
                          buttons=[
                              dict(label="Experiment", method="relayout",
                                   args=[{f"{last}.range": list(events["window"])}]),
                              dict(label="First smoke", method="relayout",
                                   args=[{f"{last}.range": [events["smoke_wire"][0] - 30,
                                                            events["smoke_wire"][0] + 150]}]),
                              dict(label="Whole downlink", method="relayout",
                                   args=[{f"{last}.range": [0, telemetry["t"].max()]}])])],
    )
    return figure


def facts(sample: pl.DataFrame, telemetry: pl.DataFrame) -> tuple[list[tuple[str, str, str]], dict]:
    """Headline numbers and telemetry events, all computed from the files."""
    igniter = on_window(sample, "Igniter Current", 0.3)
    before = sample.filter(pl.col("t") < igniter[0])
    hottest = max(SAMPLE_TC, key=lambda column: sample[column].max())
    radiometer = max(RADIOMETERS, key=lambda column: sample[column].max())
    peak_row = sample.row(sample[hottest].arg_max(), named=True)
    scatter = reported(telemetry, "CDH_F2PCM_SMK_DET_SCAT_SENS_P")
    saffire = telemetry.filter(pl.col("Radiometer1value") > -1000)
    wire = saffire.filter(pl.col("SmokeWireCurrent") > 0.2)["t"].to_list()
    baseline = scatter.filter(pl.col("t") < wire[0])["value"].max()
    first_rise = scatter.filter((pl.col("t") >= wire[0]) & (pl.col("value") > 2 * baseline))["t"].min()
    events = {
        "igniter1": on_window(saffire, "Sample1IgniterCurrent", 0.3),
        "igniter2": on_window(saffire, "Sample2IgniterCurrent", 0.3),
        "smoke_wire": wire, "window": (saffire["t"].min() - 60, saffire["t"].max()),
        "scatter_baseline": baseline, "scatter_peak": scatter["value"].max(),
        "scatter_peak_t": scatter.row(scatter["value"].arg_max())[0], "first_rise": first_rise,
    }
    tiles = [
        (f"{sample[hottest].max():.0f} °C", "peak sample temperature",
         f"{hottest.split('(')[1].rstrip(')')}, {peak_row['t'] - igniter[0]:.0f} s after ignition"),
        (f"{sample[radiometer].max():.0f} mW/cm²", "peak radiant heat flux",
         f"{radiometer}; idle reading is about {before[radiometer].mean():.0f}"),
        (f"{before['O2'].mean():.2f} → {sample['O2'].min():.2f} %", "oxygen, before → lowest",
         f"CO₂ {before['CO2'].mean():.2f} → {sample['CO2'].max():.2f} %"),
        (f"+{(sample['Ambient Pressure'].max() - before['Ambient Pressure'].mean()) * PSI_TO_KPA:.2f} kPa",
         "ambient pressure rise",
         f"from {before['Ambient Pressure'].mean() * PSI_TO_KPA:.1f} kPa"),
        (f"{before['Anemometer 1'].mean():.0f} cm/s", "air flow through the test section",
         "Anemometer 1, average before ignition"),
        (f"{first_rise - wire[0]:.0f} s", "smoke wire → Cygnus detector",
         f"scatter {baseline:.3f} V → peak {events['scatter_peak']:.2f} V"),
    ]
    return tiles, events


PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Saffire-III: a fire aboard Cygnus</title>
<style>
:root {{ --surface:#fcfcfb; --page:#f4f3ef; --ink:#0b0b0b; --muted:#52514e; --line:#e7e6e2; --accent:#eb6834; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--page); color:var(--ink);
  font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif; }}
main {{ max-width:1180px; margin:0 auto; padding:32px 16px 64px; }}
h1 {{ font-size:clamp(28px,4vw,42px); line-height:1.15; margin:0 0 8px; }}
h2 {{ font-size:24px; margin:48px 0 6px; }}
p {{ max-width:78ch; margin:8px 0; }} .lede {{ font-size:18px; color:var(--muted); }}
.muted {{ color:var(--muted); font-size:14px; }}
.tiles {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; margin:24px 0; }}
.tile {{ background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:16px; }}
.tile b {{ display:block; font-size:28px; line-height:1.2; }}
.tile span {{ display:block; font-weight:600; margin-top:2px; }}
.tile small {{ color:var(--muted); }}
.card {{ background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:8px; margin:16px 0;
  overflow:hidden; }}
.tabs {{ display:flex; gap:8px; margin:16px 0 0; flex-wrap:wrap; }}
.tabs button {{ font:inherit; padding:8px 16px; border-radius:999px; border:1px solid var(--line);
  background:var(--surface); color:var(--ink); cursor:pointer; }}
.tabs button[aria-selected="true"] {{ background:var(--ink); color:#fff; border-color:var(--ink); }}
.tabs button:focus-visible {{ outline:3px solid var(--accent); outline-offset:2px; }}
[hidden] {{ display:none; }}
ul {{ max-width:78ch; padding-left:20px; }} li {{ margin:4px 0; }}
</style></head><body><main>
<p class="muted">NASA Physical Sciences Informatics · PSI-100 · Spacecraft Fire Experiment III (Saffire-III)</p>
<h1>A fire, lit on purpose, aboard a spacecraft</h1>
<p class="lede">After the Cygnus cargo vehicle left the ISS, Saffire-III ignited a sample about 0.4 m wide and
0.94 m tall inside it. These are the measurements that came back, from the experiment's own sensors and
from the vehicle's.</p>
<div class="tiles">{tiles}</div>

<h2>1. The burn, sensor by sensor</h2>
<p>Every panel shares one time axis: move the pointer to read all sensors at the same moment, drag to zoom,
use the buttons for preset windows, and click legend entries to hide curves. The yellow band is the igniter.</p>
<div class="tabs" role="tablist" aria-label="Sample">
<button role="tab" aria-selected="true" data-tab="s1">Sample 1 · the large burn ({d1:.0f} s)</button>
<button role="tab" aria-selected="false" data-tab="s2">Sample 2 · {d2:.0f} s recording</button></div>
<div class="card" id="s1">{burn1}</div>
<div class="card" id="s2" hidden>{burn2}</div>
<p class="muted">Curves are drawn from a min/max envelope of the 30 Hz record (at most {limit} points per curve),
so peaks are kept; no smoothing or interpolation. Radiometers read about −17 mW/cm² when idle; values are
shown as calibrated by the source.</p>

<h2>2. Following the flame across the sample</h2>
<p>Six thermocouples sit on the sample. The moment each one first reaches a temperature shows the order in
which the flame arrived. Choose the temperature that counts as “arrived”.</p>
<div class="card">{arrival}</div>
<p class="muted">Thermocouple positions are not given in the files used here, so this shows order and timing,
not a spread rate.</p>

<h2>3. Replay the sample heating up</h2>
<p>Press play, or drag the slider, to watch the six sample thermocouples through the burn
(highest reading in each 3-second step).</p>
<div class="card">{playback}</div>

<h2>4. What the spacecraft itself noticed</h2>
<p>The same event in Cygnus telemetry. Dotted lines are smoke-wire pulses, used to make the air flow visible.
The cabin smoke detector answers the first pulse about {lag:.0f} s later, then climbs to its highest reading
during the Sample 1 burn, while cabin pressure and air temperature step up.</p>
<div class="card">{spacecraft}</div>
<ul class="muted">
<li>Cygnus channels arrive roughly every 6 s, each on its own row; rows where a channel is absent are skipped,
never filled in.</li>
<li>Smoke-detector readings are the detector's output in volts, as labelled by the source, not a smoke
concentration.</li>
<li>This file uses its own clock (seconds from the start of the downlink). The Saffire and Cygnus clocks in
the source differ by about a day, so sections 1–3 and section 4 are not placed on one time axis here.</li>
</ul>

<h2>Sources</h2>
<ul class="muted">
<li>Saffire III Sample 1 Sensors.xlsx and Sample 2 Sensors.xlsx, sheet “Calibrated Data” (30 Hz).</li>
<li>{telemetry} (1 Hz telemetry); channel units from “Saffire-III 1 Hz Telemetry Data.xlsx”.</li>
<li>Sample size and mission sequence: SAFFIRE-III Operations.pdf. Pressure converted from psi
(1 psi = 6.894757 kPa).</li>
</ul>
</main>
<script>{plotlyjs}</script>
<script>
const figures = {figures};
for (const [id, figure] of Object.entries(figures)) {{
  Plotly.newPlot(id + "-plot", figure.data, figure.layout, {{responsive: true, displaylogo: false}})
    .then(plot => figure.frames && Plotly.addFrames(plot, figure.frames));
}}
document.querySelectorAll(".tabs button").forEach(button => button.addEventListener("click", () => {{
  document.querySelectorAll(".tabs button").forEach(other => {{
    const selected = other === button;
    other.setAttribute("aria-selected", selected);
    document.getElementById(other.dataset.tab).hidden = !selected;
  }});
  Plotly.Plots.resize(document.getElementById(button.dataset.tab).querySelector(".js-plotly-plot"));
}}));
</script></body></html>
"""


def build(data_dir: Path, output: Path) -> dict:
    sample1, sample2 = load_sample(data_dir, 1), load_sample(data_dir, 2)
    telemetry = load_telemetry(data_dir)
    tiles, events = facts(sample1, telemetry)
    igniter1 = on_window(sample1, "Igniter Current", 0.3)
    hottest = max(SAMPLE_TC, key=lambda column: sample1[column].max())
    peak = sample1["t"][sample1[hottest].arg_max()]
    figures = {
        "burn1": burn_figure(sample1, igniter1, {
            "Whole run": (0, sample1["t"].max()),
            "Ignition": (igniter1[0] - 15, igniter1[1] + 60),
            "Peak burn": (peak - 60, peak + 150)}),
        "burn2": burn_figure(sample2, on_window(sample2, "Igniter Current", 0.3),
                             {"Whole run": (0, sample2["t"].max())}),
        "arrival": arrival_figure(sample1, [100, 300, 600]),
        "playback": playback_figure(sample1),
        "spacecraft": spacecraft_figure(telemetry, events),
    }
    html = PAGE.format(
        tiles="".join(f'<div class="tile"><b>{value}</b><span>{label}</span><small>{detail}</small></div>'
                      for value, label, detail in tiles),
        d1=sample1["t"].max(), d2=sample2["t"].max(), limit=POINT_LIMIT,
        lag=events["first_rise"] - events["smoke_wire"][0], telemetry=TELEMETRY,
        plotlyjs=get_plotlyjs(),
        figures=json.dumps({name: json.loads(figure.to_json()) for name, figure in figures.items()}),
        **{name: f'<div id="{name}-plot"></div>' for name in figures},
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, "utf-8")
    return {"tiles": tiles, "events": events}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).resolve().parents[2] / "data_nasa")
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parent / "outputs" / "saffire3.html")
    args = parser.parse_args()
    report = build(args.data_dir.resolve(), args.output.resolve())
    for value, label, detail in report["tiles"]:
        print(f"{label}: {value} ({detail})")
    print({key: value for key, value in report["events"].items() if key != "smoke_wire"})
    print(f"Wrote {args.output}")
