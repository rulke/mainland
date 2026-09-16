/** Geographic overlay layers + continent/country labels */

export const CONTINENTS = [
  { name: "亚洲", lon: 95, lat: 45 },
  { name: "欧洲", lon: 15, lat: 50 },
  { name: "非洲", lon: 20, lat: 5 },
  { name: "北美洲", lon: -100, lat: 45 },
  { name: "南美洲", lon: -60, lat: -15 },
  { name: "大洋洲", lon: 140, lat: -25 },
  { name: "南极洲", lon: 0, lat: -80 },
];

/**
 * 内置自然地名（常用名，非全量库）
 * kind: ocean | sea | range | lake | peak
 * minZoom: 开始显示的缩放
 */
export const NATURAL_LABELS = [
  // 大洋
  { name: "太平洋", lon: -150, lat: 0, kind: "ocean", minZoom: 1 },
  { name: "大西洋", lon: -30, lat: 10, kind: "ocean", minZoom: 1 },
  { name: "印度洋", lon: 80, lat: -20, kind: "ocean", minZoom: 1 },
  { name: "北冰洋", lon: 0, lat: 80, kind: "ocean", minZoom: 1 },
  { name: "南大洋", lon: 0, lat: -60, kind: "ocean", minZoom: 1 },
  // 边缘海 / 海湾
  { name: "地中海", lon: 18, lat: 36, kind: "sea", minZoom: 2.5 },
  { name: "加勒比海", lon: -75, lat: 15, kind: "sea", minZoom: 2.5 },
  { name: "孟加拉湾", lon: 88, lat: 15, kind: "sea", minZoom: 2.5 },
  { name: "阿拉伯海", lon: 63, lat: 12, kind: "sea", minZoom: 2.5 },
  { name: "南海", lon: 115, lat: 14, kind: "sea", minZoom: 2.5 },
  { name: "东海", lon: 125, lat: 30, kind: "sea", minZoom: 3.5 },
  { name: "黄海", lon: 123, lat: 35, kind: "sea", minZoom: 4 },
  { name: "日本海", lon: 135, lat: 40, kind: "sea", minZoom: 3.5 },
  { name: "鄂霍次克海", lon: 150, lat: 55, kind: "sea", minZoom: 3 },
  { name: "白令海", lon: -175, lat: 58, kind: "sea", minZoom: 3 },
  { name: "北海", lon: 3, lat: 56, kind: "sea", minZoom: 4 },
  { name: "波罗的海", lon: 19, lat: 58, kind: "sea", minZoom: 4 },
  { name: "黑海", lon: 34, lat: 43, kind: "sea", minZoom: 3.5 },
  { name: "红海", lon: 38, lat: 20, kind: "sea", minZoom: 3 },
  { name: "波斯湾", lon: 51, lat: 27, kind: "sea", minZoom: 3.5 },
  { name: "墨西哥湾", lon: -90, lat: 25, kind: "sea", minZoom: 2.5 },
  { name: "几内亚湾", lon: 0, lat: 3, kind: "sea", minZoom: 3 },
  { name: "孟加拉湾", lon: 88, lat: 14, kind: "sea", minZoom: 2.5 },
  { name: "珊瑚海", lon: 155, lat: -18, kind: "sea", minZoom: 3 },
  { name: "塔斯曼海", lon: 160, lat: -38, kind: "sea", minZoom: 3.5 },
  { name: "喜马拉雅山脉", lon: 85, lat: 29, kind: "range", minZoom: 3 },
  { name: "落基山脉", lon: -110, lat: 45, kind: "range", minZoom: 3 },
  { name: "安第斯山脉", lon: -70, lat: -20, kind: "range", minZoom: 3 },
  { name: "阿尔卑斯山脉", lon: 10, lat: 46.5, kind: "range", minZoom: 4 },
  { name: "乌拉尔山脉", lon: 60, lat: 60, kind: "range", minZoom: 3.5 },
  { name: "昆仑山脉", lon: 85, lat: 36, kind: "range", minZoom: 3.5 },
  { name: "秦岭", lon: 108, lat: 34, kind: "range", minZoom: 5 },
  { name: "大高加索山脉", lon: 44, lat: 43, kind: "range", minZoom: 4 },
  { name: "比利牛斯山脉", lon: 0, lat: 42.5, kind: "range", minZoom: 4.5 },
  { name: "阿巴拉契亚山脉", lon: -80, lat: 38, kind: "range", minZoom: 4 },
  { name: "大分水岭", lon: 146, lat: -30, kind: "range", minZoom: 3.5 },
  { name: "斯堪的纳维亚山脉", lon: 12, lat: 63, kind: "range", minZoom: 4 },
  { name: "天山山脉", lon: 82, lat: 42, kind: "range", minZoom: 3.5 },
  { name: "祁连山", lon: 98, lat: 38, kind: "range", minZoom: 4.5 },
  { name: "横断山脉", lon: 100, lat: 28, kind: "range", minZoom: 4.5 },
  { name: "大兴安岭", lon: 122, lat: 50, kind: "range", minZoom: 4.5 },
  { name: "太行山", lon: 113, lat: 37, kind: "range", minZoom: 5 },
  // 湖泊
  { name: "贝加尔湖", lon: 107, lat: 53.5, kind: "lake", minZoom: 4 },
  { name: "苏必利尔湖", lon: -87, lat: 47.5, kind: "lake", minZoom: 4 },
  { name: "维多利亚湖", lon: 33, lat: -1, kind: "lake", minZoom: 4 },
  { name: "里海", lon: 51, lat: 41, kind: "lake", minZoom: 3.5 },
  { name: "青海湖", lon: 100, lat: 37, kind: "lake", minZoom: 5 },
  { name: "咸海", lon: 59, lat: 45, kind: "lake", minZoom: 4.5 },
  { name: "的的喀喀湖", lon: -69, lat: -16, kind: "lake", minZoom: 4.5 },
  { name: "巴尔喀什湖", lon: 74, lat: 46, kind: "lake", minZoom: 4.5 },
  // 山峰
  { name: "珠穆朗玛峰", lon: 86.925, lat: 27.988, kind: "peak", minZoom: 5 },
  { name: "乔戈里峰", lon: 76.513, lat: 35.88, kind: "peak", minZoom: 5.5 },
  { name: "乞力马扎罗山", lon: 37.35, lat: -3.07, kind: "peak", minZoom: 5 },
  { name: "阿空加瓜山", lon: -68.5, lat: -32.65, kind: "peak", minZoom: 5 },
  { name: "麦金利山", lon: -151.0, lat: 63.07, kind: "peak", minZoom: 5 },
  { name: "厄尔布鲁士山", lon: 42.44, lat: 43.35, kind: "peak", minZoom: 5.5 },
];

const COUNTRY_LABEL_ZH = {
  China: "中华人民共和国",
  Russia: "俄罗斯",
  "United States of America": "美国",
  Canada: "加拿大",
  Brazil: "巴西",
  Australia: "澳大利亚",
  India: "印度",
  Argentina: "阿根廷",
  Kazakhstan: "哈萨克斯坦",
  Algeria: "阿尔及利亚",
  "Dem. Rep. Congo": "刚果（金）",
  Greenland: "格陵兰",
  Mexico: "墨西哥",
  Indonesia: "印度尼西亚",
  Sudan: "苏丹",
  Libya: "利比亚",
  Iran: "伊朗",
  Mongolia: "蒙古",
  Peru: "秘鲁",
  Chad: "乍得",
  Niger: "尼日尔",
  Angola: "安哥拉",
  Mali: "马里",
  "South Africa": "南非",
  Colombia: "哥伦比亚",
  Ethiopia: "埃塞俄比亚",
  Bolivia: "玻利维亚",
  Mauritania: "毛里塔尼亚",
  Egypt: "埃及",
  Tanzania: "坦桑尼亚",
  Nigeria: "尼日利亚",
  Venezuela: "委内瑞拉",
  Namibia: "纳米比亚",
  Pakistan: "巴基斯坦",
  Mozambique: "莫桑比克",
  Turkey: "土耳其",
  Chile: "智利",
  Zambia: "赞比亚",
  Myanmar: "缅甸",
  Afghanistan: "阿富汗",
  France: "法国",
  Japan: "日本",
  Germany: "德国",
  "United Kingdom": "英国",
  Italy: "意大利",
  Spain: "西班牙",
  Ukraine: "乌克兰",
  Poland: "波兰",
  "Saudi Arabia": "沙特阿拉伯",
  "South Korea": "韩国",
  "North Korea": "朝鲜",
  Thailand: "泰国",
  Vietnam: "越南",
  Philippines: "菲律宾",
  Malaysia: "马来西亚",
  "New Zealand": "新西兰",
  Norway: "挪威",
  Sweden: "瑞典",
  Finland: "芬兰",
  Iceland: "冰岛",
  Ireland: "爱尔兰",
};

/** 省会 / 自治区首府（主要地级市，5×–10× 显示） */
const CAPITAL_NAMES = new Set([
  "北京市",
  "天津市",
  "上海市",
  "重庆市",
  "石家庄市",
  "太原市",
  "呼和浩特市",
  "沈阳市",
  "长春市",
  "哈尔滨市",
  "南京市",
  "杭州市",
  "合肥市",
  "福州市",
  "南昌市",
  "济南市",
  "郑州市",
  "武汉市",
  "长沙市",
  "广州市",
  "南宁市",
  "海口市",
  "成都市",
  "贵阳市",
  "昆明市",
  "拉萨市",
  "西安市",
  "兰州市",
  "西宁市",
  "银川市",
  "乌鲁木齐市",
  "台北市",
  "香港特别行政区",
  "澳门特别行政区",
]);

const MAJOR_AT_ZOOM2 = new Set([
  "China",
  "Russia",
  "United States of America",
  "Canada",
  "Brazil",
  "Australia",
  "India",
  "Argentina",
  "Kazakhstan",
  "Algeria",
  "Dem. Rep. Congo",
  "Greenland",
  "Antarctica",
]);

function eachRing(geom, fn) {
  if (!geom) return;
  const { type, coordinates } = geom;
  if (type === "Polygon") {
    for (const ring of coordinates) fn(ring);
  } else if (type === "MultiPolygon") {
    for (const poly of coordinates) for (const ring of poly) fn(ring);
  } else if (type === "LineString") {
    fn(coordinates);
  } else if (type === "MultiLineString") {
    for (const line of coordinates) fn(line);
  }
}

/**
 * Natural Earth 将台湾标成独立主权要素。
 * 产品约定：台港澳仅通过「中国行政区」层展示，国家层不单独描边/标名。
 */
function skipSeparateChinaSAR(props) {
  const iso = String(props?.ISO_A3 || props?.ISO_A3_EH || props?.ADM0_ISO || "").toUpperCase();
  const name = String(props?.NAME || props?.ADMIN || props?.NAME_ZH || "");
  if (iso === "TWN" || iso === "HKG" || iso === "MAC") return true;
  if (/^Taiwan$|^Hong Kong$|^Macao$|^Macau$/.test(name)) return true;
  if (name.includes("台湾") || name.includes("香港") || name.includes("澳门")) return true;
  return false;
}

function project(lon, lat, W, H) {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

function inView(x, y, w, h, pad = 20) {
  return x > -pad && y > -pad && x < w + pad && y < h + pad;
}

/** Path2D caches in world-grid space (avoid rebuilding every pan frame). */
const _pathCache = {
  countries: null,
  countriesSig: "",
  china: null,
  chinaSig: "",
};

function gridPathFromFeatures(features, skipFn, W, H) {
  const path = new Path2D();
  for (const f of features) {
    if (skipFn && skipFn(f.properties)) continue;
    eachRing(f.geometry, (ring) => {
      for (let i = 0; i < ring.length; i++) {
        const [lon, lat] = ring[i];
        const x = ((lon + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      path.closePath();
    });
  }
  return path;
}

function getCountriesPath(features, W, H) {
  const sig = `${features.length}:${W}x${H}`;
  if (_pathCache.countries && _pathCache.countriesSig === sig) {
    return _pathCache.countries;
  }
  _pathCache.countries = gridPathFromFeatures(features, skipSeparateChinaSAR, W, H);
  _pathCache.countriesSig = sig;
  return _pathCache.countries;
}

function getChinaPath(features, W, H) {
  const sig = `${features.length}:${W}x${H}`;
  if (_pathCache.china && _pathCache.chinaSig === sig) {
    return _pathCache.china;
  }
  _pathCache.china = gridPathFromFeatures(features, null, W, H);
  _pathCache.chinaSig = sig;
  return _pathCache.china;
}

export function drawOverlays(ctx, layers, t, opts) {
  const { s, dx, dy } = t;
  const W = opts.gridW;
  const H = opts.gridH;
  const theme = opts.theme;
  const zoom = opts.zoom;
  const vw = ctx.canvas.width;
  const vh = ctx.canvas.height;

  const projectView = (lon, lat) => {
    const p = project(lon, lat, W, H);
    return { x: dx + p.x * s, y: dy + p.y * s };
  };

  if (layers.countries?.features?.length) {
    const path = getCountriesPath(layers.countries.features, W, H);
    ctx.save();
    ctx.setTransform(s, 0, 0, s, dx, dy);
    ctx.lineWidth = (zoom > 4 ? 1.25 : 0.7) / s;
    ctx.strokeStyle =
      theme === "atlas" ? "rgba(30, 40, 55, 0.45)" : "rgba(232, 238, 247, 0.35)";
    ctx.stroke(path);
    ctx.restore();
  }

  if (opts.showChina) {
    const src = layers.prefectures?.features?.length
      ? layers.prefectures
      : layers.chinaProv;
    if (src?.features?.length) {
      const path = getChinaPath(src.features, W, H);
      ctx.save();
      ctx.setTransform(s, 0, 0, s, dx, dy);
      ctx.lineWidth = (zoom > 4 ? 1 : 0.6) / s;
      ctx.strokeStyle =
        theme === "atlas" ? "rgba(180, 80, 40, 0.55)" : "rgba(232, 184, 74, 0.45)";
      ctx.stroke(path);
      ctx.restore();

      // labels: <5 none · 5–10 capitals · ≥10 all in viewport
      if (zoom >= 5) {
        const capitalsOnly = zoom < 10;
        const candidates = [];
        for (const f of src.features) {
          const name = f.properties?.name || "";
          if (!name) continue;
          if (capitalsOnly && !CAPITAL_NAMES.has(name)) continue;
          const c = f.properties?.centroid || f.properties?.center;
          let lon, lat;
          if (Array.isArray(c)) {
            lon = c[0];
            lat = c[1];
          } else {
            const ring =
              f.geometry?.coordinates?.[0]?.[0] || f.geometry?.coordinates?.[0];
            if (!ring?.length) continue;
            lon = ring[0][0];
            lat = ring[0][1];
          }
          const { x, y } = projectView(lon, lat);
          if (!inView(x, y, vw, vh, 8)) continue;
          candidates.push({ x, y, name });
        }
        ctx.fillStyle =
          theme === "atlas" ? "rgba(40, 30, 20, 0.8)" : "rgba(240, 230, 200, 0.85)";
        ctx.font = `500 ${Math.max(10, Math.min(13, 9 + zoom * 0.25))}px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          ctx.fillText(c.name, c.x, c.y);
        }
      }
      ctx.restore();
    }
  }

  if (opts.showCities && layers.cities?.features) {
    ctx.save();
    const capOnly = zoom < 2.5;
    ctx.font = `500 ${zoom >= 3 ? 12 : 11}px "Segoe UI", "PingFang SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const candidates = [];
    for (const f of layers.cities.features) {
      const p = f.properties || {};
      const isCap = p.adm0cap === 1 || p.adm0cap === "1" || p.worldcity === 1;
      const natscale = p.natscale || p.scalerank || 5;
      if (capOnly && !isCap) continue;
      if (zoom < 3 && natscale > 3 && !isCap) continue;
      if (zoom < 4.5 && natscale > 5 && !isCap) continue;
      const g = f.geometry;
      if (!g || g.type !== "Point") continue;
      const label = p.NAME || p.name || p.nameascii || "";
      // no name → never draw a bare dot
      if (!label) continue;
      if (opts.showChina && zoom >= 4 && (p.sov_a3 === "CHN" || p.adm0_a3 === "CHN")) {
        if (!isCap) continue;
      }
      const [lon, lat] = g.coordinates;
      const { x, y } = projectView(lon, lat);
      if (!inView(x, y, vw, vh, 12)) continue;
      candidates.push({ x, y, label, isCap, natscale });
    }
    candidates.sort((a, b) => b.isCap - a.isCap || a.natscale - b.natscale);
    const MAX_CITY = 30;
    ctx.fillStyle = theme === "atlas" ? "#1a2430" : "#e8eef7";
    ctx.strokeStyle = theme === "atlas" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.min(MAX_CITY, candidates.length); i++) {
      const c = candidates[i];
      const r = c.isCap ? 3 : 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // point and name always together
      ctx.strokeText(c.label, c.x + 5, c.y - 1);
      ctx.fillText(c.label, c.x + 5, c.y - 1);
    }
    ctx.restore();
  }

  if (opts.showCountryNames && layers.countries?.features) {
    ctx.save();
    const needMajorOnly = zoom < 2;
    const needSet = zoom < 3.2 ? MAJOR_AT_ZOOM2 : null;
    ctx.fillStyle =
      theme === "atlas" ? "rgba(40, 45, 55, 0.72)" : "rgba(230, 235, 245, 0.72)";
    ctx.font = `600 ${zoom < 2 ? 11 : zoom < 4 ? 12 : 13}px "Segoe UI", "PingFang SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let drawn = 0;
    for (const f of layers.countries.features) {
      const p = f.properties || {};
      if (skipSeparateChinaSAR(p)) continue;
      const en = p.NAME || p.ADMIN || p.name || "";
      if (!en || en === "Antarctica") continue;
      if (needMajorOnly && !MAJOR_AT_ZOOM2.has(en)) continue;
      if (needSet && !needSet.has(en) && zoom < 3.2) {
        const sr = p.LABELRANK ?? p.labelrank ?? 99;
        if (sr > 3) continue;
      }
      let label = p.NAME_ZH || COUNTRY_LABEL_ZH[en] || "";
      if (!label && zoom >= 3.5) label = en;
      if (!label) continue;
      const c =
        p.LABEL_X != null
          ? [p.LABEL_X, p.LABEL_Y]
          : p.label_x != null
            ? [p.label_x, p.label_y]
            : null;
      let lon, lat;
      if (c && c[0] != null) {
        lon = c[0];
        lat = c[1];
      } else {
        let sx = 0, sy = 0, n = 0;
        eachRing(f.geometry, (ring) => {
          for (let i = 0; i < ring.length; i += Math.max(1, (ring.length / 8) | 0)) {
            sx += ring[i][0];
            sy += ring[i][1];
            n++;
          }
        });
        if (!n) continue;
        lon = sx / n;
        lat = sy / n;
      }
      const { x, y } = projectView(lon, lat);
      if (!inView(x, y, vw, vh, 40)) continue;
      if (drawn > 24) break;
      ctx.fillText(label, x, y);
      drawn++;
    }
    ctx.restore();
  }

  if (opts.showContinents) {
    ctx.save();
    const alpha = zoom <= 1.5 ? 0.55 : zoom <= 3 ? 0.35 : 0.18;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = theme === "atlas" ? "#1a2430" : "#e8eef7";
    ctx.font = `600 ${Math.round(16 + Math.min(zoom, 4))}px "Segoe UI", "PingFang SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const c of CONTINENTS) {
      const { x, y } = projectView(c.lon, c.lat);
      if (!inView(x, y, vw, vh, 80)) continue;
      ctx.fillText(c.name, x, y);
    }
    ctx.restore();
  }

  // 自然地名：海洋 / 海湾 / 山脉 / 湖泊 / 山峰
  if (opts.showNatural) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const item of NATURAL_LABELS) {
      if (zoom < item.minZoom) continue;
      const { x, y } = projectView(item.lon, item.lat);
      if (!inView(x, y, vw, vh, 20)) continue;
      const isWater = item.kind === "ocean" || item.kind === "sea" || item.kind === "lake";
      const isPeak = item.kind === "peak";
      let font;
      let alpha = 1;
      if (item.kind === "ocean") {
        font = `600 ${Math.round(14 + Math.min(zoom, 3))}px "Segoe UI", "PingFang SC", sans-serif`;
        alpha = zoom <= 2 ? 0.55 : 0.4;
      } else if (item.kind === "sea") {
        font = `500 ${Math.round(11 + Math.min(zoom, 2))}px "Segoe UI", "PingFang SC", sans-serif`;
        alpha = 0.55;
      } else if (item.kind === "range") {
        font = `italic 600 ${Math.round(11 + Math.min(zoom, 2))}px "Segoe UI", "PingFang SC", sans-serif`;
        alpha = zoom >= 6 ? 0.45 : 0.65;
      } else if (item.kind === "lake") {
        font = `500 ${Math.round(10 + Math.min(zoom, 2))}px "Segoe UI", "PingFang SC", sans-serif`;
        alpha = 0.6;
      } else {
        font = `500 10px "Segoe UI", "PingFang SC", sans-serif`;
        alpha = 0.75;
      }
      ctx.globalAlpha = alpha;
      ctx.font = font;
      // water: lighter on dark, darker blue on light; range: ink
      if (isWater) {
        ctx.fillStyle = theme === "atlas" ? "rgba(14, 90, 130, 0.9)" : "rgba(160, 210, 240, 0.95)";
        ctx.strokeStyle = theme === "atlas" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)";
      } else {
        ctx.fillStyle = theme === "atlas" ? "rgba(60, 45, 30, 0.9)" : "rgba(235, 220, 190, 0.95)";
        ctx.strokeStyle = theme === "atlas" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";
      }
      ctx.lineWidth = 2;
      if (isPeak) {
        // small triangle + name
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 4, y + 3);
        ctx.lineTo(x - 4, y + 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeText(item.name, x + 8, y);
        ctx.fillText(item.name, x + 8, y);
      } else {
        ctx.strokeText(item.name, x, y);
        ctx.fillText(item.name, x, y);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export async function loadGeoJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
