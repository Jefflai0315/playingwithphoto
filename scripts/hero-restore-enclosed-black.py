#!/usr/bin/env python3
"""Restore enclosed interior blacks in hero scrub frames.

When background black is keyed out, shirt/hair blacks inside the character
silhouette are removed too. This script:

1. Builds a mask of enclosed transparent regions (holes not connected to the
   image edge through transparent pixels).
2. Restores the original RGB from the PNG backup for dark pixels in those holes.
3. Writes masks to frames/masks/ and updates frames/f_*.png + f_*.webp.

The PNGs still carry original RGB under alpha=0 — that is the backup.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
FRAMES_DIR = ROOT / "frames"
MASK_DIR = FRAMES_DIR / "masks"
SOURCE_DIR = FRAMES_DIR / "_source"

ALPHA_TRANS = 20
ALPHA_FG = 128
BLACK_MAX = 70
BLACK_SUM = 100
MAX_COMPONENT = 2500
MAX_NEIGHBOR_LUMA = 72
WEBP_QUALITY = 60
WEBP_WIDTH = 960


def enclosed_transparent_mask(alpha: np.ndarray) -> np.ndarray:
    """Transparent pixels that cannot reach the image border."""
    h, w = alpha.shape
    trans = alpha < ALPHA_TRANS
    seen = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if trans[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if trans[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and trans[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))

    return trans & ~seen


def is_dark_pixel(rgb: np.ndarray) -> np.ndarray:
    return (rgb.max(axis=2) < BLACK_MAX) | (rgb.sum(axis=2) < BLACK_SUM)


def neighbor_luma(arr: np.ndarray, comp: np.ndarray) -> float:
    rgb = arr[:, :, :3].astype(np.float32)
    fg = arr[:, :, 3] >= ALPHA_FG
    border = ndimage.binary_dilation(comp, iterations=2) & fg
    if not border.any():
        return 255.0
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    return float(lum[border].mean())


def build_restore_mask(arr: np.ndarray) -> np.ndarray:
    enclosed = enclosed_transparent_mask(arr[:, :, 3])
    dark = is_dark_pixel(arr[:, :, :3])
    labeled, count = ndimage.label(enclosed & dark)
    restore = np.zeros(enclosed.shape, dtype=bool)

    for idx in range(1, count + 1):
        comp = labeled == idx
        size = int(comp.sum())
        if size > MAX_COMPONENT:
            continue
        if neighbor_luma(arr, comp) > MAX_NEIGHBOR_LUMA:
            continue
        restore |= comp

    return restore


def restore_frame(arr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    out = arr.copy()
    mask = build_restore_mask(arr)
    out[mask, 3] = 255
    return out, mask


def ensure_source_backup(png: Path) -> None:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    backup = SOURCE_DIR / png.name
    if not backup.exists():
        shutil.copy2(png, backup)


def export_webp(png: Path, webp: Path) -> None:
    subprocess.run(
        [
            "cwebp",
            "-quiet",
            "-mt",
            "-m",
            "6",
            "-q",
            str(WEBP_QUALITY),
            "-resize",
            str(WEBP_WIDTH),
            "0",
            str(png),
            "-o",
            str(webp),
        ],
        check=True,
    )


def process_frame(png: Path, *, mask_only: bool = False) -> int:
    arr = np.array(Image.open(png).convert("RGBA"))
    _, mask = restore_frame(arr)

    MASK_DIR.mkdir(parents=True, exist_ok=True)
    mask_path = MASK_DIR / png.name.replace(".png", "_mask.png")
    Image.fromarray(mask.astype(np.uint8) * 255).save(mask_path)

    restored_count = int(mask.sum())
    if mask_only:
        return restored_count

    ensure_source_backup(png)
    restored, _ = restore_frame(arr)
    Image.fromarray(restored).save(png)
    export_webp(png, png.with_suffix(".webp"))
    return restored_count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mask-only",
        action="store_true",
        help="Write frames/masks only; do not modify PNG/WebP outputs.",
    )
    parser.add_argument(
        "--frame",
        help="Process a single frame stem (e.g. f_030) instead of all frames.",
    )
    args = parser.parse_args()

    if args.frame:
        frames = [FRAMES_DIR / f"{args.frame}.png"]
    else:
        frames = sorted(FRAMES_DIR.glob("f_*.png"))

    if not frames:
        raise SystemExit(f"No frames found in {FRAMES_DIR}")

    total = 0
    for i, png in enumerate(frames, 1):
        if not png.exists():
            raise SystemExit(f"Missing frame: {png}")
        count = process_frame(png, mask_only=args.mask_only)
        total += count
        if i % 10 == 0 or i == len(frames):
            print(f"processed {i}/{len(frames)} — last mask pixels: {count}")

    action = "masked" if args.mask_only else "restored"
    print(f"done — {action} {len(frames)} frames ({total} interior pixels total)")


if __name__ == "__main__":
    main()
