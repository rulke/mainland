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

const COUNTRY_LABEL_ZH = {
  China: "中国",
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

function project(lon, lat, W, H) {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

function inView(x, y, w, h, pad = 20) {
  return x > -pad && y > -pad && x < w + pad && y < h + pad;
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

  if (layers.countries?.features) {
    ctx.save();
    ctx.lineWidth = zoom > 4 ? 1.25 : 0.7;
    ctx.strokeStyle =
      theme === "atlas" ? "rgba(30, 40, 55, 0.45)" : "rgba(232, 238, 247, 0.35)";
    ctx.beginPath();
    for (const f of layers.countries.features) {
      eachRing(f.geometry, (ring) => {
        for (let i = 0; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          const { x, y } = projectView(lon, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      });
    }
    ctx.stroke();
    ctx.restore();
  }

  if (opts.showChina) {
    const src = layers.prefectures?.features?.length
      ? layers.prefectures
      : layers.chinaProv;
    if (src?.features) {
      ctx.save();
      ctx.lineWidth = zoom > 4 ? 1 : 0.6;
      ctx.strokeStyle =
        theme === "atlas" ? "rgba(180, 80, 40, 0.55)" : "rgba(232, 184, 74, 0.45)";
      ctx.beginPath();
      for (const f of src.features) {
        eachRing(f.geometry, (ring) => {
          for (let i = 0; i < ring.length; i++) {
            const [lon, lat] = ring[i];
            const { x, y } = projectView(lon, lat);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        });
      }
      ctx.stroke();

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
