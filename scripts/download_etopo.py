#!/usr/bin/env python3
"""Download ETOPO 2022 60s Bedrock GeoTIFF into raw/."""
from __future__ import annotations

import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
DEST = RAW / "ETOPO_2022_v1_60s_N90W180_bed.tif"

URLS = [
    (
        "https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/60s/"
        "60s_bed_elev_gtif/ETOPO_2022_v1_60s_N90W180_bed.tif"
    ),
]

UA = "MainlandViz/1.0 (educational; contact: local)"
CHUNK = 1024 * 1024


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as resp, open(part, "wb") as f:
        total = resp.headers.get("Content-Length")
        total_n = int(total) if total else None
        done = 0
        while True:
            chunk = resp.read(CHUNK)
            if not chunk:
                break
            f.write(chunk)
            done += len(chunk)
            if total_n and done % (10 * CHUNK) < CHUNK:
                pct = 100.0 * done / total_n
                mb = done / 1e6
                speed = mb / max(time.time() - t0, 1e-6)
                print(f"  {mb:8.1f} MB  {pct:5.1f}%  {speed:5.1f} MB/s", flush=True)
    if dest.exists():
        dest.unlink()
    part.rename(dest)
    print(f"saved {dest} ({dest.stat().st_size} bytes)")


def main() -> int:
    if DEST.exists() and DEST.stat().st_size > 100_000_000:
        print(f"already present: {DEST} ({DEST.stat().st_size})")
        return 0
    last_err: Exception | None = None
    for url in URLS:
        print(f"GET {url}")
        try:
            download(url, DEST)
            return 0
        except Exception as e:  # noqa: BLE001
            last_err = e
            print(f"  failed: {e}")
    print(f"download failed: {last_err}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
