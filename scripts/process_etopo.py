#!/usr/bin/env python3
"""
Process ETOPO 2022 Bedrock GeoTIFF → data/elev.bin (4320x2160 Int16 LE)
plus meta.json, preview, minimap, gzip. Must run with numpy + Pillow.
"""
from __future__ import annotations

import gzip
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # ETOPO 60s is ~233e6 pixels

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
DATA = ROOT / "data"
SRC = RAW / "ETOPO_2022_v1_60s_N90W180_bed.tif"

W, H = 4320, 2160
# hypsometric + bathymetry for preview (simplified, matches DESIGN.md)
LAND_STOPS = [
    (0, (61, 143, 92)),
    (200, (107, 154, 74)),
    (500, (160, 160, 90)),
    (1000, (196, 163, 90)),
    (2000, (166, 124, 61)),
    (3000, (122, 85, 48)),
    (4000, (201, 187, 168)),
    (5000, (242, 237, 228)),
    (9000, (255, 255, 255)),
]
SEA_STOPS = [
    (0, (90, 208, 224)),
    (50, (43, 184, 212)),
    (200, (18, 135, 168)),
    (1000, (14, 77, 110)),
    (2000, (12, 42, 74)),
    (4000, (8, 20, 40)),
    (6000, (4, 8, 16)),
    (11000, (2, 4, 8)),
]


def ramp(stops, ascending: bool):
    xs = np.array([s[0] for s in stops], dtype=np.float64)
    cs = np.array([s[1] for s in stops], dtype=np.float64)

    def f(v):
        v = np.asarray(v, dtype=np.float64)
        out = np.empty(v.shape + (3,), dtype=np.uint8)
        if ascending:
            out[..., 0] = np.interp(v, xs, cs[:, 0])
            out[..., 1] = np.interp(v, xs, cs[:, 1])
            out[..., 2] = np.interp(v, xs, cs[:, 2])
        else:
            # stops are depth-ascending (0 shallow → deep); for depth values
            out[..., 0] = np.interp(v, xs, cs[:, 0])
            out[..., 1] = np.interp(v, xs, cs[:, 1])
            out[..., 2] = np.interp(v, xs, cs[:, 2])
        return out

    return f


land_c = ramp(LAND_STOPS, True)
sea_c = ramp(SEA_STOPS, True)


def load_source(path: Path) -> np.ndarray:
    """Return float64 elevation (H0, W0), north-to-south preferred."""
    im = Image.open(path)
    print(f"PIL mode={im.mode} size={im.size}")
    arr = np.array(im)
    if arr.ndim == 3:
        arr = arr[..., 0]
    print(f"src array {arr.shape} dtype={arr.dtype} min={arr.min()} max={arr.max()}")
    # ETOPO GeoTIFF is typically north-to-south already; if min lat row is ocean-heavy ok.
    return arr


def block_mean(a: np.ndarray, th: int, tw: int) -> np.ndarray:
    """Area-average resample by integer factors via reshape-mean (no partial edges)."""
    h, w = a.shape
    # crop to multiple
    h2, w2 = (h // th) * th, (w // tw) * tw
    a = a[:h2, :w2].astype(np.float64)
    return a.reshape(h2 // th, th, w2 // tw, tw).mean(axis=(1, 3))


def weighted_land_fraction(elev: np.ndarray, sea_level: float) -> float:
    h, w = elev.shape
    lat = np.linspace(89.9, -89.9, h)  # north to south
    wgt = np.cos(np.deg2rad(lat))[:, None] * np.ones((h, w))
    land = elev >= sea_level
    return float((land * wgt).sum() / wgt.sum() * 100.0)


def save_png(path: Path, elev: np.ndarray) -> None:
    sl = 0.0
    h, w = elev.shape
    rgb = np.empty((h, w, 3), dtype=np.uint8)
    land = elev >= sl
    depth = np.clip(sl - elev, 0, 11000)
    rgb[land] = land_c(elev[land])
    rgb[~land] = sea_c(depth[~land])
    Image.fromarray(rgb, "RGB").save(path, optimize=True)
    print(f"wrote {path}")


def main() -> int:
    if not SRC.exists():
        print(f"missing source: {SRC}", file=sys.stderr)
        return 1
    DATA.mkdir(parents=True, exist_ok=True)
    src = load_source(SRC)
    h0, w0 = src.shape
    # ETOPO 60s: 21600 x 10800; factors
    if w0 % W != 0 or h0 % H != 0:
        # try non-integer path: use PIL resize BOX
        print(f"non-integer factor {w0}x{h0} → {W}x{H}, using BOX resize")
        im = Image.fromarray(src.astype(np.float32), mode="F")
        im = im.resize((W, H), resample=Image.Resampling.BOX)
        elev = np.array(im, dtype=np.float32)
    else:
        fy, fx = h0 // H, w0 // W
        print(f"block mean factors fy={fy} fx={fx}")
        elev = block_mean(src, fy, fx).astype(np.float32)

    elev_i16 = np.clip(np.round(elev), -32768, 32767).astype(np.int16)
    bin_path = DATA / "elev.bin"
    elev_i16.astype("<i2").tofile(bin_path)
    print(f"wrote {bin_path} bytes={bin_path.stat().st_size} expect={W*H*2}")

    with gzip.open(DATA / "elev.bin.gz", "wb", compresslevel=6) as gz:
        gz.write(elev_i16.astype("<i2").tobytes())
    print(f"wrote elev.bin.gz bytes={(DATA/'elev.bin.gz').stat().st_size}")

    lf0 = weighted_land_fraction(elev_i16, 0.0)
    meta = {
        "width": W,
        "height": H,
        "dtype": "int16",
        "endianness": "little",
        "rowOrder": "north-to-south",
        "lonMin": -180,
        "lonMax": 180,
        "latMax": 90,
        "latMin": -90,
        "source": "ETOPO 2022 Bedrock",
        "sourceDoi": "10.25921/fd45-gt74",
        "resampledFrom": "60s",
        "minElev": int(elev_i16.min()),
        "maxElev": int(elev_i16.max()),
        "landFractionSl0WeightedPct": round(lf0, 3),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    (DATA / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print("meta:", meta)

    save_png(DATA / "elev-preview.png", elev_i16)
    # minimap 480x240
    mini = Image.open(DATA / "elev-preview.png").resize((480, 240), Image.Resampling.BOX)
    mini.save(DATA / "elev-min.png", optimize=True)
    print("wrote elev-min.png")

    if not (27.0 <= lf0 <= 32.0):
        print(f"WARN land fraction {lf0:.2f}% outside [27,32] — check orientation/source", file=sys.stderr)
        return 2
    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
