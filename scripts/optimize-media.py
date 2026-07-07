#!/usr/bin/env python3
"""Compress site media for production: photos, hero frames, and MP4 loops."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "photos"
FRAMES = ROOT / "frames"

# max long-edge by folder (pixels)
PHOTO_PROFILES = {
    "styles": (500, 78),
    "occasions": (800, 78),
    "testimonials": (800, 78),
    "samples": (1000, 78),
    "addons": (1000, 78),
    "about": (800, 78),
    "strips": (900, 78),
    "spark": (1200, 78),
    "meta": (1200, 78),
    "reel": (1200, 78),
}
DEFAULT_PHOTO = (1200, 78)
HERO_WEBP_QUALITY = 55
HERO_WEBP_WIDTH = 800


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def photo_profile(path: Path) -> tuple[int, int]:
    parts = path.relative_to(PHOTOS).parts
    if parts:
        return PHOTO_PROFILES.get(parts[0], DEFAULT_PHOTO)
    return DEFAULT_PHOTO


def export_webp(src: Path, dst: Path, max_edge: int, quality: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    run(
        [
            "cwebp",
            "-quiet",
            "-mt",
            "-m",
            "6",
            "-q",
            str(quality),
            "-resize",
            str(max_edge),
            "0",
            str(src),
            "-o",
            str(dst),
        ]
    )


def optimize_photos() -> int:
    count = 0
    for ext in ("*.png", "*.jpg", "*.jpeg", "*.JPG", "*.JPEG"):
        for src in sorted(PHOTOS.rglob(ext)):
            max_edge, quality = photo_profile(src)
            dst = src.with_suffix(".webp")
            export_webp(src, dst, max_edge, quality)
            count += 1
    return count


def optimize_hero_frames() -> int:
    pngs = sorted(FRAMES.glob("f_*.png"))
    if not pngs:
        pngs = sorted((FRAMES / "_source").glob("f_*.png"))
    q, width = HERO_WEBP_QUALITY, HERO_WEBP_WIDTH
    for src in pngs:
        dst = FRAMES / src.name.replace(".png", ".webp")
        run(
            [
                "cwebp",
                "-quiet",
                "-mt",
                "-m",
                "6",
                "-q",
                str(q),
                "-resize",
                str(width),
                "0",
                str(src),
                "-o",
                str(dst),
            ]
        )
    return len(pngs)


def optimize_video(src: Path) -> None:
    tmp = src.with_suffix(".tmp.mp4")
    poster = src.with_suffix(".poster.webp")
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(src),
            "-an",
            "-vf",
            "scale='min(1280,iw)':-2",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "28",
            "-movflags",
            "+faststart",
            str(tmp),
        ]
    )
    tmp.replace(src)
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(src),
            "-frames:v",
            "1",
            "-vf",
            "scale=640:-2",
            "-c:v",
            "libwebp",
            "-quality",
            "78",
            str(poster),
        ]
    )


def optimize_videos() -> int:
    count = 0
    for src in sorted(PHOTOS.rglob("*.mp4")):
        if src.stat().st_size < 400_000:
            continue
        optimize_video(src)
        count += 1
    return count


def main() -> None:
    photos = optimize_photos()
    frames = optimize_hero_frames()
    videos = optimize_videos()
    print(f"photos: {photos} webp, hero frames: {frames}, videos: {videos}")


if __name__ == "__main__":
    main()
