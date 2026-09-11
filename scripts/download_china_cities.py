#!/usr/bin/env python3
"""Download China prefecture-level admin units (~333). Exclude districts/counties."""
from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / "data" / "geo"
CACHE = GEO / "_pref_cache"
OUT = GEO / "china_prefectures.geojson"

# Province-level adcodes
MUNICIPALITIES = {110000, 120000, 310000, 500000}  # 京津沪渝
SPECIAL = {810000, 820000, 710000}  # 港澳台 outline-only

PROVINCES = [
    110000, 120000, 130000, 140000, 150000, 210000, 220000, 230000,
    310000, 320000, 330000, 340000, 350000, 360000, 370000, 410000,
    420000, 430000, 440000, 450000, 460000, 500000, 510000, 520000,
    530000, 540000, 610000, 620000, 630000, 640000, 650000, 710000,
    810000, 820000,
]


def curl_json(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 2000:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "curl.exe", "-sS", "-L", "--retry", "4", "--retry-delay", "2",
        "-A", "MainlandViz/1.0", "-o", str(dest), url,
    ]
    r = subprocess.run(cmd, capture_output=True)
    ok = r.returncode == 0 and dest.exists() and dest.stat().st_size > 2000
    if not ok:
        print(f"  curl fail {url} rc={r.returncode}")
    return ok


def is_prefecture_code(adcode: str) -> bool:
    """PPCC00 where CC!=00 → prefecture-level city/prefecture/league/area."""
    if len(adcode) != 6 or not adcode.isdigit():
        return False
    if adcode.endswith("0000"):
        return False  # province
    if adcode.endswith("00"):
        return True  # last two 00, not province → city/prefecture/league
    return False  # district / county-level


def is_province_code(adcode: str) -> bool:
    return len(adcode) == 6 and adcode.isdigit() and adcode.endswith("0000")


def main() -> int:
    features = []
    seen = set()

    for code in PROVINCES:
        cache_path = CACHE / f"{code}.json"
        # Taiwan / some SAR: _full may 404; outline always works for special
        if code in SPECIAL:
            url = f"https://geo.datav.aliyun.com/areas_v3/bound/{code}.json"
            cache_path = CACHE / f"{code}_outline.json"
        else:
            url = f"https://geo.datav.aliyun.com/areas_v3/bound/{code}_full.json"
        print(f"GET {code}", flush=True)
        if not curl_json(url, cache_path):
            time.sleep(0.3)
            continue
        try:
            data = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            print(f"  parse fail {code}: {e}")
            continue

        feats = data.get("features") or []
        kept = 0

        # Municipalities / SAR / Taiwan: keep only province outline
        if code in MUNICIPALITIES or code in SPECIAL:
            outline = CACHE / f"{code}_outline.json"
            ok = curl_json(
                f"https://geo.datav.aliyun.com/areas_v3/bound/{code}.json",
                outline,
            )
            if not ok:
                print(f"  outline missing {code}")
                time.sleep(0.1)
                continue
            try:
                od = json.loads(outline.read_text(encoding="utf-8"))
            except Exception as e:  # noqa: BLE001
                print(f"  outline parse fail {code}: {e}")
                continue
            for f in od.get("features") or []:
                props = f.get("properties") or {}
                ad = str(props.get("adcode") or code)
                if not f.get("geometry") or ad in seen:
                    continue
                f["properties"] = {
                    "adcode": props.get("adcode") or code,
                    "name": props.get("name") or "",
                    "level": "province",
                    "centroid": props.get("centroid") or props.get("center"),
                    "parent": None,
                }
                features.append(f)
                seen.add(ad)
                kept += 1
            print(f"  municipality/special outline +{kept}")
            time.sleep(0.1)
            continue

        for f in feats:
            props = f.get("properties") or {}
            ad = str(props.get("adcode") or "")
            if not f.get("geometry") or not ad or ad in seen:
                continue
            # drop province outline when children exist
            if is_province_code(ad):
                continue
            if not is_prefecture_code(ad):
                continue
            name = props.get("name") or ""
            # hard exclude residual non-prefecture names
            if name.endswith("区") or name.endswith("县") or name.endswith("旗"):
                continue
            if name.endswith("市") or name.endswith("自治州") or name.endswith("地区") or name.endswith("盟"):
                pass
            else:
                # e.g. 省直辖县级行政区划 — skip
                continue
            c = props.get("centroid") or props.get("center")
            f["properties"] = {
                "adcode": props.get("adcode"),
                "name": name,
                "level": "city",
                "centroid": c,
                "parent": code,
            }
            features.append(f)
            seen.add(ad)
            kept += 1
        print(f"  +{kept}")
        time.sleep(0.08)

    out = {"type": "FeatureCollection", "features": features}
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"saved {OUT} features={len(features)} bytes={OUT.stat().st_size}")

    # summary
    by_parent: dict[str, int] = {}
    for f in features:
        p = str(f["properties"].get("parent") or f["properties"].get("adcode"))
        by_parent[p] = by_parent.get(p, 0) + 1
    print("by parent", dict(sorted(by_parent.items())))
    names = [f["properties"]["name"] for f in features]
    print("sample", names[:15], "...", names[-10:])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
