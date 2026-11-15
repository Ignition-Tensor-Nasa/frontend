"""Slice the live PSI-Lens walkthrough video into 6 looping HD MP4 and GIF clips
for the 3-minute hackathon jury pitch deck.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

import imageio_ffmpeg


@dataclass(frozen=True)
class ClipSpec:
    clip_id: str
    start_s: float
    duration_s: float
    speed: float


CLIPS: list[ClipSpec] = [
    ClipSpec("01_mission_overview", start_s=6.0, duration_s=11.0, speed=1.0),
    ClipSpec("02_scenario_filters", start_s=17.5, duration_s=22.0, speed=1.25),
    ClipSpec("03_regime_analytics", start_s=42.0, duration_s=28.0, speed=1.4),
    ClipSpec("04_cross_run_comparison", start_s=71.0, duration_s=20.0, speed=1.25),
    ClipSpec("05_telemetry_modes", start_s=106.0, duration_s=28.0, speed=1.35),
    ClipSpec("06_saffire_mission", start_s=155.0, duration_s=65.0, speed=1.6),
]


def build_clips(
    source_mp4: Path,
    public_dir: Path,
    artifact_dir: Path | None,
) -> list[dict[str, object]]:
    if not source_mp4.exists():
        raise FileNotFoundError(f"Source walkthrough video not found: {source_mp4}")

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    public_dir.mkdir(parents=True, exist_ok=True)
    if artifact_dir is not None:
        artifact_dir.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, object]] = []

    for clip in CLIPS:
        mp4_path = public_dir / f"{clip.clip_id}.mp4"
        gif_path = public_dir / f"{clip.clip_id}.gif"
        pts_expr = f"setpts=PTS/{clip.speed}"

        # 1. Looping H.264 MP4 clip (1440x900 @ 30 fps)
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-ss",
                f"{clip.start_s:.2f}",
                "-t",
                f"{clip.duration_s:.2f}",
                "-i",
                str(source_mp4),
                "-vf",
                f"{pts_expr},scale=1440:900:flags=lanczos",
                "-r",
                "30",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "20",
                "-pix_fmt",
                "yuv420p",
                "-an",
                "-movflags",
                "+faststart",
                str(mp4_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # 2. High-definition 256-color custom-palette GIF (960x600 @ 12 fps)
        gif_filter = (
            f"{pts_expr},fps=12,scale=960:-1:flags=lanczos,"
            "split[s0][s1];"
            "[s0]palettegen=max_colors=256:stats_mode=diff[p];"
            "[s1][p]paletteuse=dither=sierra2_4a"
        )
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-ss",
                f"{clip.start_s:.2f}",
                "-t",
                f"{clip.duration_s:.2f}",
                "-i",
                str(source_mp4),
                "-vf",
                gif_filter,
                "-loop",
                "0",
                str(gif_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        if artifact_dir is not None:
            shutil.copy2(mp4_path, artifact_dir / mp4_path.name)
            shutil.copy2(gif_path, artifact_dir / gif_path.name)

        results.append(
            {
                "clip_id": clip.clip_id,
                "mp4_bytes": mp4_path.stat().st_size,
                "gif_bytes": gif_path.stat().st_size,
            }
        )
        print(
            f"{clip.clip_id}: mp4={mp4_path.stat().st_size} B, gif={gif_path.stat().st_size} B"
        )

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("/home/bartek/frontend/psi-lens-walkthrough.mp4"),
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("/home/bartek/frontend/public/pitch"),
    )
    parser.add_argument(
        "--artifact-dir",
        type=Path,
        default=Path(
            "/home/bartek/.gemini/antigravity/brain/259ed303-6957-4c8b-8b08-8b6e51907378/pitch"
        ),
    )
    args = parser.parse_args()
    build_clips(args.source, args.out_dir, args.artifact_dir)


if __name__ == "__main__":
    main()
