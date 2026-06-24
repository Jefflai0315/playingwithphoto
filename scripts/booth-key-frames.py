#!/usr/bin/env python3
"""Key booth frames: edge flood + global matte/highlight removal."""

from __future__ import annotations

import subprocess
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRAMES_DIR = ROOT / "photos" / "booth" / "frames"
VIDEO = ROOT / "photos" / "booth" / "assembled-scrub.mp4"
BG_FLOOR = 185
MATTE_CEIL = 248
NEUTRAL_SPREAD = 16
HIGHLIGHT_MIN = 247


def is_neutral(r: int, g: int, b: int) -> bool:
    return max(r, g, b) - min(r, g, b) <= NEUTRAL_SPREAD


def is_matte_pixel(r: int, g: int, b: int) -> bool:
    lo = min(r, g, b)
    return BG_FLOOR <= lo < MATTE_CEIL and is_neutral(r, g, b)


def is_highlight_pixel(r: int, g: int, b: int) -> bool:
    return min(r, g, b) >= HIGHLIGHT_MIN and is_neutral(r, g, b)


def key_frame(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def idx(x: int, y: int) -> int:
        return y * w + x

    def try_seed(x: int, y: int) -> None:
        i = idx(x, y)
        if seen[i]:
            return
        r, g, b, _ = px[x, y]
        if not is_matte_pixel(r, g, b):
            return
        seen[i] = 1
        q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        if x > 0:
            try_seed(x - 1, y)
        if x + 1 < w:
            try_seed(x + 1, y)
        if y > 0:
            try_seed(x, y - 1)
        if y + 1 < h:
            try_seed(x, y + 1)

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if is_matte_pixel(r, g, b) or is_highlight_pixel(r, g, b):
                px[x, y] = (r, g, b, 0)

    return img


def ensure_sources() -> list[Path]:
    sources = sorted(FRAMES_DIR.glob("src_*.png"))
    if sources:
        return sources

    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    if not VIDEO.exists():
        raise SystemExit(f"Missing source video: {VIDEO}")

    pattern = str(FRAMES_DIR / "src_%04d.png")
    print("extracting lossless frames from video…")
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(VIDEO),
            "-vf", "scale=560:-1",
            pattern,
        ],
        check=True,
    )
    return sorted(FRAMES_DIR.glob("src_*.png"))


def main() -> None:
    sources = ensure_sources()
    if not sources:
        raise SystemExit(f"No frames found in {FRAMES_DIR}")

    for i, src in enumerate(sources, 1):
        dst = FRAMES_DIR / f"b_{src.stem.replace('src_', '')}.png"
        key_frame(Image.open(src)).save(dst, optimize=True)
        if i % 20 == 0 or i == len(sources):
            print(f"keyed {i}/{len(sources)}")

    for tmp in FRAMES_DIR.glob("src_*.png"):
        tmp.unlink()

    print(f"done — {len(sources)} frames (matte {BG_FLOOR}+)")


if __name__ == "__main__":
    main()
