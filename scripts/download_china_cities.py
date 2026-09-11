#!/usr/bin/env python3
"""Download China prefecture-level boundaries from DataV and merge to one GeoJSON."""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "geo" / "china_prefectures.geojson"

# Province adcodes (mainland + 港澳台 as available)
PROVINCES = [
    110000, 120000, 130000, 140000, 150000, 210000, 220000, 230000,
    310000, 320000, 330000, 340000, 350000, 360000, 370000, 410000,
    420000, 430000, 440000, 450000, 460000, 500000, 510000, 520000,
    530000, 540000, 610000, 620000, 630000, 640000, 650000, 710000,
    810000, 820000,
]
UA = {"User-Agent": "MainlandViz/1.0"}


def fetch(url: str) -> dict:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> int:
    features = []
    for code in PROVINCES:
        url = f"https://geo.datav.aliyun.com/areas_v3/bound/{code}_full.json"
        try:
            data = fetch(url)
        except Exception as e:  # noqa: BLE001
            print(f"FAIL {code}: {e}")
            time.sleep(0.5)
            continue
        feats = data.get("features") or []
        n = 0
        for f in feats:
            # keep prefecture/city level, skip nested districts if present as points
            props = f.get("properties") or {}
            name = props.get("name") or ""
            level = props.get("level") or ""
            # DataV _full for province returns the province + its children
            adcode = str(props.get("adcode") or "")
            if adcode and adcode.endswith("0000") and adcode != str(code):
                continue
            # drop the province outline itself when children exist
            if adcode == str(code) and len(feats) > 1:
                continue
            if f.get("geometry"):
                f["properties"] = {
                    "adcode": props.get("adcode"),
                    "name": name,
                    "level": level or "city",
                    "parent": code,
                }
                features.append(f)
                n += 1
        print(f"ok {code}: +{n} (raw {len(feats)})")
        time.sleep(0.15)

    out = {"type": "FeatureCollection", "features": features}
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"saved {OUT} features={len(features)} bytes={OUT.stat().st_size}")
    return 0 if features else 1


if __name__ == "__main__":
    raise SystemExit(main())
