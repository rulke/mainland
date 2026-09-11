/** Geographic overlay layers + continent labels */

export const CONTINENTS = [
  { name: "亚洲", lon: 95, lat: 45 },
  { name: "欧洲", lon: 15, lat: 50 },
  { name: "非洲", lon: 20, lat: 5 },
  { name: "北美洲", lon: -100, lat: 45 },
  { name: "南美洲", lon: -60, lat: -15 },
  { name: "大洋洲", lon: 140, lat: -25 },
  { name: "南极洲", lon: 0, lat: -80 },
];

function eachRing(geom, fn) {
  if (!geom) return;
  const { type, coordinates } = geom;
  if (type === "Polygon") {
    for (const ring of coordinates) fn(ring);
  } else if (type === "MultiPolygon") {
    for (const poly of coordinates) for (const ring of poly) fn(ring);
  }
}

function project(lon, lat, W, H) {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

/**
 * Draw vector overlays on the view canvas after the DEM is blitted.
 * ctx is the view canvas context; transform already applied via drawImage args,
 * so we convert lon/lat → view pixels using the same s/dx/dy.
 */
export function drawOverlays(ctx, layers, t, opts) {
  const { s, dx, dy } = t;
  const W = opts.gridW;
  const H = opts.gridH;
  const theme = opts.theme;
  const zoom = opts.zoom;

  const projectView = (lon, lat) => {
    const p = project(lon, lat, W, H);
    return { x: dx + p.x * s, y: dy + p.y * s };
  };

  // Countries
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

  // China admin (prefectures preferred, else provinces)
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
      // labels only when zoomed enough — avoid name flood
      if (zoom >= 5) {
        ctx.fillStyle =
          theme === "atlas" ? "rgba(40, 30, 20, 0.75)" : "rgba(240, 230, 200, 0.8)";
        ctx.font = `500 ${Math.max(10, Math.min(13, 9 + zoom * 0.3))}px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = "center";
        const showAllUnits = zoom >= 7;
        for (const f of src.features) {
          const name = f.properties?.name || "";
          if (!name) continue;
          if (
            !showAllUnits &&
            !name.endsWith("市") &&
            !name.endsWith("自治州") &&
            !name.endsWith("地区")
          ) {
            continue;
          }
          if (name.endsWith("区") && zoom < 8) continue;
          const c = f.properties?.centroid || f.properties?.center;
          let lon, lat;
          if (Array.isArray(c)) {
            lon = c[0];
            lat = c[1];
          } else {
            const ring = f.geometry?.coordinates?.[0]?.[0] || f.geometry?.coordinates?.[0];
            if (!ring?.length) continue;
            lon = ring[0][0];
            lat = ring[0][1];
          }
          const { x, y } = projectView(lon, lat);
          if (x < -40 || y < -20 || x > ctx.canvas.width + 40 || y > ctx.canvas.height + 20)
            continue;
          ctx.fillText(name, x, y);
        }
      }
      ctx.restore();
    }
  }

  // World cities
  if (opts.showCities && layers.cities?.features) {
    ctx.save();
    const capOnly = zoom < 2.5;
    ctx.fillStyle = theme === "atlas" ? "#1a2430" : "#e8eef7";
    ctx.strokeStyle = theme === "atlas" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    ctx.font = `500 ${zoom >= 3 ? 12 : 11}px "Segoe UI", "PingFang SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (const f of layers.cities.features) {
      const p = f.properties || {};
      const isCap = p.adm0cap === 1 || p.adm0cap === "1" || p.worldcity === 1;
      if (capOnly && !isCap) continue;
      const natscale = p.natscale || p.scalerank || 5;
      // show larger places earlier
      if (zoom < 3 && natscale > 3 && !isCap) continue;
      if (zoom < 4.5 && natscale > 5 && !isCap) continue;
      const g = f.geometry;
      if (!g || g.type !== "Point") continue;
      const [lon, lat] = g.coordinates;
      const { x, y } = projectView(lon, lat);
      if (x < -10 || y < -10 || x > ctx.canvas.width + 10 || y > ctx.canvas.height + 10)
        continue;
      const r = isCap ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const label = p.NAME || p.name || p.nameascii || "";
      if (label && zoom >= 2.2) {
        if (opts.showChina && zoom >= 4 && (p.sov_a3 === "CHN" || p.adm0_a3 === "CHN")) {
          if (!isCap) continue;
        }
        ctx.strokeText(label, x + 5, y - 1);
        ctx.fillText(label, x + 5, y - 1);
      }
    }
    ctx.restore();
  }

  // Continent names
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
      if (x < -80 || y < -40 || x > ctx.canvas.width + 80 || y > ctx.canvas.height + 40)
        continue;
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
