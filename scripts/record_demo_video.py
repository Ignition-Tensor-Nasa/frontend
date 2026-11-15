"""Record a natural-cursor walkthrough video of the live PSI-Lens web application."""

from __future__ import annotations

import argparse
import math
import os
import random
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import imageio_ffmpeg
from playwright.sync_api import Locator, Page, sync_playwright

CURSOR_INIT_SCRIPT = r"""
(() => {
  if (window.__psiDemoInstalled) return;
  window.__psiDemoInstalled = true;

  const ensureOverlay = () => {
    if (!document.body) return;

    if (!document.getElementById("psi-demo-style")) {
      const style = document.createElement("style");
      style.id = "psi-demo-style";
      style.textContent = `
        @keyframes psiRippleExpand {
          0% { transform: translate(-50%, -50%) scale(0.35); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.3); opacity: 0; }
        }
        #psi-demo-cursor {
          position: fixed;
          left: 0;
          top: 0;
          width: 28px;
          height: 28px;
          pointer-events: none;
          z-index: 2147483647;
          transform: translate(-3px, -2px);
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 6px rgba(34, 211, 238, 0.55));
          transition: opacity 150ms ease;
        }
        #psi-demo-cursor.pressed {
          transform: translate(-3px, -2px) scale(0.88);
        }
        .psi-demo-ripple {
          position: fixed;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          border: 2.5px solid #22d3ee;
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.7);
          pointer-events: none;
          z-index: 2147483646;
          animation: psiRippleExpand 480ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        #psi-demo-caption {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          padding: 7px 16px;
          border-radius: 9999px;
          background: rgba(6, 10, 22, 0.88);
          border: 1px solid rgba(34, 211, 238, 0.45);
          color: #e2e8f0;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
          pointer-events: none;
          z-index: 2147483645;
          backdrop-filter: blur(8px);
          transition: opacity 220ms ease;
          white-space: nowrap;
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("psi-demo-cursor")) {
      const cursor = document.createElement("div");
      cursor.id = "psi-demo-cursor";
      cursor.innerHTML = `
        <svg viewBox="0 0 28 28" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 2.5L22.5 14.2L13.8 15.8L10.3 24.2L4.5 2.5Z"
                fill="#ffffff" stroke="#060a16" stroke-width="2" stroke-linejoin="round"/>
          <path d="M5.6 4.6L19.8 13.8L12.9 15.1L10.2 21.6L5.6 4.6Z"
                fill="#f8fafc" stroke="#22d3ee" stroke-width="0.9" stroke-linejoin="round"/>
        </svg>`;
      cursor.style.left = (window.__psiCursorX ?? 720) + "px";
      cursor.style.top = (window.__psiCursorY ?? 450) + "px";
      document.body.appendChild(cursor);
    }

    if (!document.getElementById("psi-demo-caption")) {
      const caption = document.createElement("div");
      caption.id = "psi-demo-caption";
      caption.style.opacity = window.__psiCaptionText ? "1" : "0";
      caption.textContent = window.__psiCaptionText || "";
      document.body.appendChild(caption);
    }
  };

  window.__setDemoCaption = (text) => {
    window.__psiCaptionText = text || "";
    ensureOverlay();
    const el = document.getElementById("psi-demo-caption");
    if (el) {
      el.textContent = text || "";
      el.style.opacity = text ? "1" : "0";
    }
  };

  window.addEventListener("mousemove", (e) => {
    window.__psiCursorX = e.clientX;
    window.__psiCursorY = e.clientY;
    ensureOverlay();
    const el = document.getElementById("psi-demo-cursor");
    if (el) {
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
    }
  }, true);

  window.addEventListener("mousedown", (e) => {
    ensureOverlay();
    const el = document.getElementById("psi-demo-cursor");
    if (el) el.classList.add("pressed");
    if (document.body) {
      const r = document.createElement("div");
      r.className = "psi-demo-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 520);
    }
  }, true);

  window.addEventListener("mouseup", () => {
    const el = document.getElementById("psi-demo-cursor");
    if (el) el.classList.remove("pressed");
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureOverlay);
  } else {
    ensureOverlay();
  }
})();
"""


class DemoChoreographer:
    """Drives smooth human-like Bezier cursor paths, scrolling, and clicks."""

    def __init__(self, page: Page, rng_seed: int = 42) -> None:
        self.page = page
        self.rng = random.Random(rng_seed)
        self.x = 720.0
        self.y = 420.0
        self.page.mouse.move(self.x, self.y)

    def set_caption(self, text: str) -> None:
        self.page.evaluate("(txt) => window.__setDemoCaption?.(txt)", text)

    def pause(self, seconds: float) -> None:
        self.page.wait_for_timeout(int(seconds * 1000))

    def smooth_move(
        self, target_x: float, target_y: float, duration_ms: int = 520
    ) -> None:
        x0, y0 = self.x, self.y
        dx = target_x - x0
        dy = target_y - y0
        dist = math.hypot(dx, dy)
        if dist < 2.0:
            self.page.mouse.move(target_x, target_y)
            self.x, self.y = target_x, target_y
            return

        # Perpendicular arc offset for subtle natural wrist curvature.
        nx, ny = -dy / dist, dx / dist
        arc = self.rng.choice([-1.0, 1.0]) * min(48.0, dist * 0.14)
        c1x = x0 + dx * 0.30 + nx * arc
        c1y = y0 + dy * 0.30 + ny * arc
        c2x = x0 + dx * 0.72 + nx * arc * 0.6
        c2y = y0 + dy * 0.72 + ny * arc * 0.6

        steps = max(16, min(48, int(duration_ms / 16)))
        step_wait = max(8, duration_ms / steps)

        for i in range(1, steps + 1):
            raw_t = i / steps
            # Smoothstep ease-in-out
            t = raw_t * raw_t * (3.0 - 2.0 * raw_t)
            u = 1.0 - t
            bx = (
                (u**3) * x0
                + 3 * (u**2) * t * c1x
                + 3 * u * (t**2) * c2x
                + (t**3) * target_x
            )
            by = (
                (u**3) * y0
                + 3 * (u**2) * t * c1y
                + 3 * u * (t**2) * c2y
                + (t**3) * target_y
            )
            self.page.mouse.move(bx, by)
            self.page.wait_for_timeout(step_wait)

        self.x, self.y = target_x, target_y

    def smooth_scroll_to(self, target_y: float, duration_ms: int = 550) -> None:
        self.page.evaluate(
            """([targetY, dur]) => new Promise((resolve) => {
              const startY = window.scrollY;
              const delta = targetY - startY;
              if (Math.abs(delta) < 2) { resolve(); return; }
              const t0 = performance.now();
              const tick = (now) => {
                const raw = Math.min(1, (now - t0) / dur);
                const ease = raw < 0.5
                  ? 4 * raw * raw * raw
                  : 1 - Math.pow(-2 * raw + 2, 3) / 2;
                window.scrollTo(0, startY + delta * ease);
                if (raw < 1) requestAnimationFrame(tick);
                else resolve();
              };
              requestAnimationFrame(tick);
            })""",
            [target_y, duration_ms],
        )
        self.page.wait_for_timeout(120)

    def ensure_visible_smooth(self, locator: Locator, margin_top: int = 110) -> None:
        locator.wait_for(state="visible", timeout=15000)
        in_modal = locator.evaluate(
            "(el) => Boolean(el.closest('[aria-label=\"Multi-Case Telemetry Comparison\"]'))"
        )
        if in_modal:
            locator.scroll_into_view_if_needed()
            self.page.wait_for_timeout(120)
            return
        box = locator.bounding_box()
        if not box:
            return
        vp_h = 900.0
        if box["y"] < margin_top or (box["y"] + box["height"]) > (vp_h - 65):
            cur_scroll = self.page.evaluate("() => window.scrollY")
            desired_scroll = max(
                0.0,
                cur_scroll
                + box["y"]
                - max(margin_top, (vp_h - min(box["height"], 520)) * 0.35),
            )
            self.smooth_scroll_to(desired_scroll, duration_ms=520)

    def move_to(
        self,
        locator: Locator,
        duration_ms: int = 520,
        offset_x: float = 0.0,
        offset_y: float = 0.0,
    ) -> tuple[float, float]:
        self.ensure_visible_smooth(locator)
        box = locator.bounding_box()
        if not box:
            raise RuntimeError(f"Element has no bounding box: {locator}")
        tx = box["x"] + box["width"] * 0.5 + offset_x + self.rng.uniform(-3.0, 3.0)
        ty = box["y"] + box["height"] * 0.5 + offset_y + self.rng.uniform(-2.0, 2.0)
        self.smooth_move(tx, ty, duration_ms=duration_ms)
        return tx, ty

    def click(
        self, locator: Locator, duration_ms: int = 520, post_pause: float = 0.55
    ) -> None:
        tx, ty = self.move_to(locator, duration_ms=duration_ms)
        self.page.wait_for_timeout(110)
        self.page.mouse.down()
        self.page.wait_for_timeout(85)
        self.page.mouse.up()
        self.x, self.y = tx, ty
        self.pause(post_pause)

    def human_type(self, locator: Locator, text: str, delay_ms: int = 42) -> None:
        self.click(locator, duration_ms=480, post_pause=0.2)
        locator.fill("")
        self.page.keyboard.type(text, delay=delay_ms)
        self.pause(0.35)

    def sweep_canvas(
        self,
        locator: Locator,
        points_frac: list[tuple[float, float]],
        step_ms: int = 420,
    ) -> None:
        self.ensure_visible_smooth(locator)
        box = locator.bounding_box()
        if not box:
            return
        for fx, fy in points_frac:
            tx = box["x"] + box["width"] * fx
            ty = box["y"] + box["height"] * fy
            self.smooth_move(tx, ty, duration_ms=step_ms)
            self.pause(0.28)


def extract_preview_frames(video_path: Path, out_dir: Path, ffmpeg_exe: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    probe = subprocess.run(
        [ffmpeg_exe, "-i", str(video_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    duration_s = 60.0
    for line in probe.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip().split(":")
            if len(parts) == 3:
                duration_s = (
                    float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                )
            break

    marks = [
        ("01_explorer_overview.png", max(1.0, duration_s * 0.05)),
        ("02_analytics_deck.png", max(2.0, duration_s * 0.30)),
        ("03_case_flex1249.png", max(3.0, duration_s * 0.56)),
        ("04_saffire_mission_overview.png", max(4.0, duration_s * 0.80)),
    ]
    for name, sec in marks:
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-ss",
                f"{sec:.2f}",
                "-i",
                str(video_path),
                "-frames:v",
                "1",
                str(out_dir / name),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def run_walkthrough(
    url: str,
    out_mp4: Path,
    out_webm: Path | None,
    artifact_mp4: Path | None,
    frames_dir: Path | None,
) -> dict:
    console_errors: list[str] = []
    page_errors: list[str] = []

    with tempfile.TemporaryDirectory(prefix="psi_demo_rec_") as tmp:
        raw_dir = Path(tmp) / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=1,
                record_video_dir=str(raw_dir),
                record_video_size={"width": 1440, "height": 900},
            )
            context.add_init_script(CURSOR_INIT_SCRIPT)
            page = context.new_page()
            page.on(
                "console",
                lambda msg: console_errors.append(msg.text)
                if msg.type == "error"
                else None,
            )
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            # 1. Landing & Mission Overview tile
            page.goto(url, wait_until="networkidle")
            page.locator('[data-testid="special-cases-tile"]').wait_for(
                state="visible", timeout=15000
            )
            page.wait_for_timeout(600)

            demo = DemoChoreographer(page)
            demo.set_caption(
                "1 · PSI-LENS Explorer — 358 NASA PSI runs across 6 microgravity investigations"
            )
            demo.pause(1.1)

            # Hover Mission Overview cards showing per-card Cygnus OA-7 badge
            demo.set_caption(
                "2 · Mission Overview — Dedicated SAFFIRE-III cards (Cygnus OA-7 · 30 Hz + 1 Hz)"
            )
            demo.move_to(
                page.locator('[data-testid="special-case-open-SAFFIRE-III-S1"]'),
                duration_ms=650,
            )
            demo.pause(0.6)
            demo.move_to(
                page.locator('[data-testid="special-case-open-SAFFIRE-III-S2"]'),
                duration_ms=550,
            )
            demo.pause(0.8)

            # 2. Scenario Filter Assistant
            demo.set_caption(
                "3 · Scenario Filter Assistant — Natural-language scenario to validated filters"
            )
            prompt_chip = page.get_by_role(
                "button", name="Earth-like 20–22% O₂, 95–105 kPa"
            )
            demo.click(prompt_chip, duration_ms=580, post_pause=1.1)

            # Hover highlighted fields and active filter chips before resetting
            demo.move_to(
                page.get_by_role("button", name="Reset Demo"), duration_ms=560
            )
            demo.click(page.get_by_role("button", name="Reset Demo"), duration_ms=260, post_pause=0.8)

            # 3. Manual Filter Rail & Quick Presets
            demo.set_caption(
                "4 · Manual Filter Rail & Instant Presets — CFI (FLEX) Droplet filter"
            )
            flex_preset = page.get_by_role("button", name="CFI (FLEX) Droplets")
            demo.click(flex_preset, duration_ms=560, post_pause=0.9)
            reset_rail = page.locator("aside").get_by_role("button", name="Reset")
            demo.click(reset_rail, duration_ms=480, post_pause=0.8)

            # 4. Mission Analytics & Regime Explorer Deck
            demo.set_caption(
                "5 · Atmosphere Heatmap & Habitat Presets across all 358 runs"
            )
            heatmap_canvas = page.locator('[data-testid="atmosphere-heatmap-canvas"]')
            demo.sweep_canvas(
                heatmap_canvas,
                [(0.28, 0.56), (0.32, 0.52), (0.56, 0.52), (0.64, 0.34)],
                step_ms=440,
            )
            # Click an inner populated cell around ~21% O2 / ~100 kPa
            box = heatmap_canvas.bounding_box()
            if box:
                demo.smooth_move(box["x"] + box["width"] * 0.30, box["y"] + box["height"] * 0.52, 420)
                page.mouse.down()
                page.wait_for_timeout(80)
                page.mouse.up()
                demo.pause(0.8)

            demo.click(
                page.get_by_role("button", name="Metric: Mean Z_st"),
                duration_ms=480,
                post_pause=0.9,
            )
            demo.click(
                page.get_by_role("button", name="Metric: Case Count"),
                duration_ms=440,
                post_pause=0.5,
            )

            demo.set_caption(
                "6 · Condition Galaxy & Stoichiometric Mixture Fraction Z_st Regimes"
            )
            demo.click(
                page.get_by_role("tab", name="Condition Galaxy & Z_st"),
                duration_ms=520,
                post_pause=0.8,
            )
            galaxy_canvas = page.locator('[data-testid="experiment-galaxy-canvas"]')
            demo.sweep_canvas(
                galaxy_canvas,
                [(0.32, 0.52), (0.48, 0.44), (0.62, 0.36)],
                step_ms=460,
            )

            demo.set_caption(
                "7 · Prevention / Detection / Suppression Research Context Matrix"
            )
            demo.click(
                page.get_by_role("tab", name="Safety Context Matrix"),
                duration_ms=520,
                post_pause=1.2,
            )
            demo.smooth_scroll_to(demo.page.evaluate("() => window.scrollY + 140"), 450)
            demo.pause(0.7)

            # 5. Cross-Run Telemetry Comparison Modal
            demo.set_caption(
                "8 · Cross-Run Telemetry Comparison — Synchronized Droplet Comparison"
            )
            compare_btn = page.get_by_role(
                "button", name="FLEX Dodecane Droplets (FLEX-1249 vs FLEX-1226)"
            )
            demo.click(compare_btn, duration_ms=540, post_pause=1.0)
            modal = page.locator('[aria-label="Multi-Case Telemetry Comparison"]')
            modal.wait_for(state="visible", timeout=15000)
            modal_canvas = modal.locator("canvas").first
            if modal_canvas.count() > 0:
                demo.sweep_canvas(
                    modal_canvas, [(0.25, 0.48), (0.50, 0.42), (0.75, 0.50)], step_ms=450
                )
            demo.click(
                page.get_by_role("button", name="Close Comparison"),
                duration_ms=460,
                post_pause=0.6,
            )

            # 6. Results Table -> Standard Case Detail Page (FLEX-1249)
            demo.set_caption(
                "9 · Results Table & Standard Case Detail — Opening FLEX-1249 Droplet Run"
            )
            quick_input = page.get_by_label("Quick filter matching runs")
            demo.human_type(quick_input, "FLEX-1249", delay_ms=48)
            demo.click(
                page.get_by_role("button", name="Open Run").first,
                duration_ms=520,
                post_pause=1.0,
            )
            page.locator('[data-testid="hero-timeseries-canvas"]').wait_for(
                state="visible", timeout=15000
            )
            demo.pause(0.7)

            # Switch dataset to D^2 linear fit and explore Hero Time-Series + Scatter + Parallel Coords
            demo.set_caption(
                "10 · Selected Dataset & Hero Time-Series — D² Linear Fit Rate"
            )
            d2_btn = page.get_by_role("button", name="D² history with linear fit").first
            demo.click(d2_btn, duration_ms=500, post_pause=0.9)

            hero_canvas = page.locator('[data-testid="hero-timeseries-canvas"]')
            demo.sweep_canvas(
                hero_canvas,
                [(0.20, 0.35), (0.45, 0.48), (0.68, 0.62), (0.82, 0.72)],
                step_ms=440,
            )

            demo.set_caption(
                "11 · Instant Chart Mode Switching (Scatter & Parallel Coordinates)"
            )
            demo.click(
                page.get_by_role("tab", name="Scatter View"),
                duration_ms=480,
                post_pause=1.0,
            )
            demo.click(
                page.get_by_role("tab", name="Parallel Coords"),
                duration_ms=480,
                post_pause=1.0,
            )
            demo.click(
                page.get_by_role("tab", name="Time-Series"),
                duration_ms=440,
                post_pause=0.5,
            )

            # Scroll through Cool-Flame Lifecycle Deck, Nearest Neighbors, & Earth Apps
            demo.set_caption(
                "12 · Cool-Flame Lifecycle Deck, Nearest Neighbors & Earth Applications"
            )
            lifecycle = page.locator('[aria-label="Synchronized Multi-Dataset Lifecycle"]')
            if lifecycle.count() > 0:
                demo.move_to(lifecycle, duration_ms=520)
                demo.pause(0.9)

            earth_apps = page.locator(
                '[aria-label="Earth Applications & NASA PSI Context"]'
            )
            if earth_apps.count() > 0:
                demo.move_to(earth_apps, duration_ms=560)
                demo.pause(1.0)

            demo.smooth_scroll_to(0, duration_ms=620)
            demo.click(
                page.get_by_role("link", name="Back to Results"),
                duration_ms=500,
                post_pause=0.8,
            )
            page.locator('[data-testid="special-cases-tile"]').wait_for(
                state="visible", timeout=15000
            )
            clear_quick = page.get_by_label("Clear quick filter")
            if clear_quick.count() > 0:
                demo.click(clear_quick, duration_ms=420, post_pause=0.4)

            # 7. Dedicated Mission Overview (SAFFIRE-III-S1 & S2)
            demo.smooth_scroll_to(0, duration_ms=550)
            demo.set_caption(
                "13 · Mission Overview (SAFFIRE-III-S1) — Dedicated 30 Hz + 1 Hz Spacecraft Fire View"
            )
            demo.click(
                page.locator('[data-testid="special-case-open-SAFFIRE-III-S1"]'),
                duration_ms=600,
                post_pause=1.1,
            )
            page.locator('[data-testid="saffire-burn-canvas"]').wait_for(
                state="visible", timeout=15000
            )

            # AI Mission & Telemetry Summary controls
            demo.set_caption(
                "14 · AI Mission & Telemetry Summary — Focus Switch & Bilingual Briefing (EN/PL)"
            )
            demo.click(
                page.get_by_role("button", name="1. 30 Hz Burn & Plume"),
                duration_ms=500,
                post_pause=0.6,
            )
            demo.click(
                page.locator('[aria-label="AI summary language"]').get_by_role(
                    "button", name="en"
                ),
                duration_ms=420,
                post_pause=1.1,
            )

            # Section 1: 30 Hz synchronized burn panels
            demo.set_caption(
                "15 · Section 1: Synchronized 30 Hz Sample Burn & Zoom Presets"
            )
            burn_canvas = page.locator('[data-testid="saffire-burn-canvas"]')
            demo.click(
                page.get_by_role("button", name="Ignition", exact=True),
                duration_ms=480,
                post_pause=0.7,
            )
            demo.click(
                page.get_by_role("button", name="Peak burn", exact=True),
                duration_ms=420,
                post_pause=0.7,
            )
            demo.click(
                page.get_by_role("button", name="Whole run", exact=True),
                duration_ms=420,
                post_pause=0.5,
            )
            demo.sweep_canvas(
                burn_canvas, [(0.25, 0.25), (0.45, 0.22), (0.65, 0.45)], step_ms=420
            )

            # Section 2: TC7-TC12 Flame arrival thresholds
            demo.set_caption(
                "16 · Section 2: Thermocouple Flame Arrival Order (TC7–TC12)"
            )
            demo.click(
                page.get_by_role("button", name="≥ 100 °C"),
                duration_ms=520,
                post_pause=0.7,
            )
            demo.click(
                page.get_by_role("button", name="≥ 600 °C"),
                duration_ms=440,
                post_pause=0.7,
            )
            demo.click(
                page.get_by_role("button", name="≥ 300 °C"),
                duration_ms=420,
                post_pause=0.5,
            )

            # Section 3: 3-second playback animation
            demo.set_caption(
                "17 · Section 3: Animated Sample Heating Replay (3-s Bins)"
            )
            play_btn = page.locator(
                '[aria-label="Section 3: Replay the sample heating up"]'
            ).get_by_role("button", name="Play")
            demo.click(play_btn, duration_ms=520, post_pause=3.2)
            pause_btn = page.locator(
                '[aria-label="Section 3: Replay the sample heating up"]'
            ).get_by_role("button", name="Pause")
            if pause_btn.count() > 0:
                demo.click(pause_btn, duration_ms=420, post_pause=0.5)

            # Section 4: Cygnus OA-7 1 Hz telemetry
            demo.set_caption(
                "18 · Section 4: Cygnus OA-7 1 Hz Smoke Detector & Cabin Downlink"
            )
            sc_canvas = page.locator('[data-testid="saffire-spacecraft-canvas"]')
            demo.sweep_canvas(
                sc_canvas, [(0.30, 0.22), (0.50, 0.22), (0.72, 0.48)], step_ms=450
            )

            # Switch to Sample 2, then return cleanly to Explorer
            demo.set_caption(
                "19 · Companion Sample 2 (160 s) & Return to PSI-LENS Explorer"
            )
            demo.smooth_scroll_to(0, duration_ms=650)
            demo.click(
                page.locator('[data-testid="saffire-switch-SAFFIRE-III-S2"]'),
                duration_ms=520,
                post_pause=1.4,
            )
            demo.click(
                page.get_by_role("link", name="Back to Explorer"),
                duration_ms=540,
                post_pause=1.2,
            )
            demo.set_caption("PSI-LENS · NASA Microgravity Combustion Explorer")
            demo.pause(1.2)

            video_path = Path(page.video.path()) if page.video else None
            context.close()
            browser.close()

            raw_files = list(raw_dir.glob("*.webm"))
            if video_path and video_path.exists():
                raw_webm = video_path
            elif raw_files:
                raw_webm = raw_files[0]
            else:
                raise RuntimeError("No Playwright .webm recording was produced.")

            out_mp4.parent.mkdir(parents=True, exist_ok=True)
            if out_webm:
                out_webm.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(raw_webm, out_webm)

            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            subprocess.run(
                [
                    ffmpeg_exe,
                    "-y",
                    "-i",
                    str(raw_webm),
                    "-c:v",
                    "libx264",
                    "-preset",
                    "medium",
                    "-crf",
                    "18",
                    "-pix_fmt",
                    "yuv420p",
                    "-r",
                    "30",
                    "-movflags",
                    "+faststart",
                    str(out_mp4),
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            if artifact_mp4:
                artifact_mp4.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(out_mp4, artifact_mp4)

            if frames_dir:
                extract_preview_frames(out_mp4, frames_dir, ffmpeg_exe)

    probe = subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-i", str(out_mp4)],
        capture_output=True,
        text=True,
        check=False,
    )
    return {
        "mp4": str(out_mp4),
        "mp4_bytes": out_mp4.stat().st_size,
        "webm": str(out_webm) if out_webm else None,
        "webm_bytes": out_webm.stat().st_size if out_webm and out_webm.exists() else None,
        "artifact_mp4": str(artifact_mp4) if artifact_mp4 else None,
        "console_errors": console_errors,
        "page_errors": page_errors,
        "ffmpeg_info": [
            line.strip()
            for line in probe.stderr.splitlines()
            if "Duration:" in line or "Video:" in line
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--url", default="http://127.0.0.1:5173/")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("/home/bartek/frontend/psi-lens-walkthrough.mp4"),
    )
    parser.add_argument(
        "--webm",
        type=Path,
        default=Path("/home/bartek/frontend/psi-lens-walkthrough.webm"),
    )
    parser.add_argument(
        "--artifact",
        type=Path,
        default=Path(
            "/home/bartek/.gemini/antigravity/brain/259ed303-6957-4c8b-8b08-8b6e51907378/psi-lens-walkthrough.mp4"
        ),
    )
    parser.add_argument(
        "--frames-dir",
        type=Path,
        default=Path(
            "/home/bartek/.gemini/antigravity/brain/259ed303-6957-4c8b-8b08-8b6e51907378/scratch/frames"
        ),
    )
    args = parser.parse_args()
    summary = run_walkthrough(
        args.url, args.out, args.webm, args.artifact, args.frames_dir
    )
    for k, v in summary.items():
        print(f"{k}: {v}")
    if summary["page_errors"] or summary["console_errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
