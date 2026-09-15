import { MapRenderer } from "./map-render.js";
import { makeLandFraction, sampleElev, pxToLonLat } from "./geo-utils.js";
import {
  buildUI,
  PRESETS,
  ICE,
  snapSeaLevel,
  clampSeaLevel,
  expStep,
  loadPrefs,
  savePrefs,
  SCI_MIN,
  SCI_MAX,
} from "./ui.js";
import { drawOverlays, loadGeoJson } from "./overlays.js";

const prefs = loadPrefs();

const state = {
  seaLevel: 0,
  landBase: null,
  theme: prefs.theme,
  colorblind: false,
  experimental: prefs.experimental,
  zoom: 1,
  cx: 0,
  cy: 0,
  elev: null,
  meta: null,
  annotations: [],
  layers: { ...prefs.layers },
  statsOpen: prefs.statsOpen,
  presetsOpen: prefs.presetsOpen,
  ice: { gis: false, wais: false, eais: false, glacier: false },
  dragging: false,
  lastX: 0,
  lastY: 0,
  needRender: true,
  landPctFn: null,
  lastScienceLevel: 0,
  geo: { countries: null, cities: null, chinaProv: null, prefectures: null },
};

let ui, renderer, view, minimapImg;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}

async function loadElev() {
  const meta = await fetchJson("./data/meta.json");
  const need = meta.width * meta.height * 2;
  let buf = null;
  try {
    const rg = await fetch("./data/elev.bin.gz");
    if (rg.ok && typeof DecompressionStream !== "undefined") {
      const ds = new DecompressionStream("gzip");
      const stream = rg.body.pipeThrough(ds);
      buf = await new Response(stream).arrayBuffer();
    }
  } catch (_) {
    /* fall through */
  }
  if (!buf || buf.byteLength !== need) {
    const r = await fetch("./data/elev.bin");
    if (!r.ok) throw new Error("elev.bin 加载失败");
    buf = await r.arrayBuffer();
  }
  if (buf.byteLength !== need) {
    throw new Error(`elev.bin 大小不符：${buf.byteLength} ≠ ${need}`);
  }
  return { meta, elev: new Int16Array(buf) };
}

function persist() {
  savePrefs({
    theme: state.theme,
    statsOpen: state.statsOpen,
    presetsOpen: state.presetsOpen,
    experimental: state.experimental,
    layers: state.layers,
  });
}

function bgForTheme() {
  return state.theme === "atlas" ? "#EDE8DC" : "#0B1220";
}

function panelPrefs() {
  return {
    theme: state.theme,
    statsOpen: state.statsOpen,
    presetsOpen: state.presetsOpen,
    experimental: state.experimental,
    layers: state.layers,
  };
}

function resizeCanvas() {
  const wrap = view.parentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  view.style.width = w + "px";
  view.style.height = h + "px";
  view.width = Math.max(1, Math.floor(w * dpr));
  view.height = Math.max(1, Math.floor(h * dpr));
  if (state.meta) clampPan();
  state.needRender = true;
}

function clampPan() {
  const { meta, zoom } = state;
  if (!meta) return;
  const W = meta.width;
  const H = meta.height;
  // longitude: infinite wrap
  state.cx = ((state.cx % W) + W) % W;
  // latitude: zero overscroll — map edge always covers the viewport
  const s = (view.height / H) * zoom;
  const viewH = view.height / s;
  if (viewH >= H) {
    state.cy = H / 2;
  } else {
    const half = viewH / 2;
    state.cy = Math.max(half, Math.min(H - half, state.cy));
  }
}

function drawMinimapOverlay() {
  const mc = ui.els.minimapC;
  const mctx = mc.getContext("2d");
  mctx.clearRect(0, 0, mc.width, mc.height);
  if (minimapImg) mctx.drawImage(minimapImg, 0, 0, mc.width, mc.height);
  const s = (view.height / state.meta.height) * state.zoom;
  const vw = view.width / s;
  const vh = view.height / s;
  const x0 = state.cx - vw / 2;
  const y0 = state.cy - vh / 2;
  const rx = (x0 / state.meta.width) * mc.width;
  const ry = (y0 / state.meta.height) * mc.height;
  const rw = (vw / state.meta.width) * mc.width;
  const rh = (vh / state.meta.height) * mc.height;
  mctx.strokeStyle = "rgba(255,255,255,0.95)";
  mctx.lineWidth = 1;
  mctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
  if (rx < 0) mctx.strokeRect(rx + mc.width + 0.5, ry + 0.5, rw, rh);
  if (rx + rw > mc.width) mctx.strokeRect(rx - mc.width + 0.5, ry + 0.5, rw, rh);
}

function paint() {
  if (!renderer || !state.elev) return;
  clampPan();
  renderer.render(state.seaLevel, {
    colorblind: state.colorblind,
    showGhost: state.layers.ghost,
    theme: state.theme,
  });
  const smooth = state.zoom <= 4;
  const t = renderer.drawTo(view, state.zoom, state.cx, state.cy, smooth, bgForTheme());
  const ctx = view.getContext("2d");
  drawOverlays(ctx, state.geo, t, {
    gridW: state.meta.width,
    gridH: state.meta.height,
    theme: state.theme,
    zoom: state.zoom,
    showCities: state.layers.cities,
    showChina: state.layers.china,
    showContinents: state.layers.continents,
    showCountryNames: state.layers.countryNames,
    showNatural: state.layers.natural !== false,
  });
  drawMinimapOverlay();

  const badge = ui.els.zoomBadge;
  if (state.zoom > 4) {
    badge.hidden = false;
    badge.textContent = `缩放 ${state.zoom.toFixed(1)}× · 原始网格 ≈ 2 km`;
  } else {
    badge.hidden = true;
  }
  state.needRender = false;
}

function activeAnnotations() {
  const sl = state.seaLevel;
  return state.annotations.filter((a) => sl >= a.slMin && sl <= a.slMax);
}

function applySeaLevel(sl, fromPreset) {
  state.seaLevel = clampSeaLevel(sl, state.experimental);
  if (!fromPreset) {
    state.seaLevel = snapSeaLevel(state.seaLevel, state.experimental);
  }
  if (!state.experimental) {
    state.lastScienceLevel = state.seaLevel;
  }
  const pct = state.landPctFn(state.seaLevel);
  ui.setSeaLevelUI(state.seaLevel, pct, state.landBase, state.experimental);
  ui.setAnnotations(activeAnnotations());
  state.needRender = true;
}

function applyIce(keys) {
  state.ice = { gis: false, wais: false, eais: false, glacier: false };
  let sum = 0;
  for (const k of keys) {
    state.ice[k] = true;
    sum += ICE[k].m;
  }
  ui.setIceSum(sum);
  if (keys.length) {
    applySeaLevel(Math.round(sum * 10) / 10, true);
  } else {
    // all unchecked → back to modern
    if (state.experimental) setExperimental(false);
    applySeaLevel(0, true);
  }
}

function setExperimental(on) {
  state.experimental = on;
  ui.applySliderRange(on);
  ui.applyPanelState(panelPrefs());
  persist();
  if (!on) {
    // restore last science value, clamped
    applySeaLevel(state.lastScienceLevel, true);
  } else {
    applySeaLevel(state.seaLevel, true);
  }
}

/**
 * Increment SL by one `step` in `dir` (±1).
 * Experimental: snap to the *same* step grid (avoids 200→500 trap at ±2000).
 * Science: allow magnet snap via applySeaLevel.
 */
function nudgeSeaLevel(dir, step) {
  const exp = state.experimental;
  let next = state.seaLevel + dir * step;
  if (exp) {
    // align to this wheel/key step, then clamp — do not re-snap with expStep(next)
    const s = step > 0 ? step : expStep(state.seaLevel);
    next = Math.round(next / s) * s;
    next = clampSeaLevel(next, true);
    applySeaLevel(next, true);
  } else {
    applySeaLevel(Math.round(next * 10) / 10, false);
  }
}

function onKeyDown(e) {
  const exp = state.experimental;
  let step = exp ? expStep(state.seaLevel) : 0.1;
  if (e.shiftKey) step *= 5;
  else if (e.ctrlKey || e.metaKey) step *= 20;

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    nudgeSeaLevel(-1, step);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    nudgeSeaLevel(1, step);
  } else if (e.key === "PageUp") {
    e.preventDefault();
    nudgeSeaLevel(1, exp ? expStep(state.seaLevel) * 5 : 5);
  } else if (e.key === "PageDown") {
    e.preventDefault();
    nudgeSeaLevel(-1, exp ? expStep(state.seaLevel) * 5 : 5);
  } else if (e.key === "Home") {
    applySeaLevel(exp ? -8000 : SCI_MIN, true);
  } else if (e.key === "End") {
    applySeaLevel(exp ? 8000 : SCI_MAX, true);
  } else if (e.key === "0") {
    applySeaLevel(0, true);
  } else if (e.key >= "1" && e.key <= "6") {
    const p = PRESETS[parseInt(e.key, 10) - 1];
    if (p) {
      // presets always science — switch out of exp if needed
      if (state.experimental) setExperimental(false);
      applySeaLevel(p.sl, true);
      ui.els.sceneDesc.textContent = p.desc;
    }
  }
}

function bindMapEvents() {
  const el = view;
  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      state.zoom = Math.min(12, Math.max(1, state.zoom * factor));
      clampPan();
      state.needRender = true;
    },
    { passive: false }
  );

  el.addEventListener("pointerdown", (e) => {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    const rect = el.getBoundingClientRect();
    const scaleX = el.width / rect.width;
    const scaleY = el.height / rect.height;
    const s = (el.height / state.meta.height) * state.zoom;
    const wx = (e.clientX - rect.left) * scaleX;
    const wy = (e.clientY - rect.top) * scaleY;
    let cx = state.cx + (wx - el.width / 2) / s;
    const cy = state.cy + (wy - el.height / 2) / s;
    cx = ((cx % state.meta.width) + state.meta.width) % state.meta.width;
    if (cy >= 0 && cy < state.meta.height) {
      const { lon, lat } = pxToLonLat(cx, cy, state.meta.width, state.meta.height);
      const elev = sampleElev(state.elev, state.meta.width, state.meta.height, lon, lat);
      const sl = state.seaLevel;
      let kind = elev >= sl ? "陆地" : "水深";
      let val = elev >= sl ? `高程 ${elev} m` : `水深 ${Math.round(sl - elev)} m`;
      if (sl < 0 && elev < 0 && elev >= sl) {
        kind = "新生陆地";
        val = `海退露出 · ${elev} m`;
      }
      if (sl > 0 && elev >= 0 && elev < sl) {
        kind = "新淹没";
        val = `曾是陆地 · 水深 ${Math.round(sl - elev)} m`;
      }
      ui.els.hud.hidden = false;
      ui.els.hud.innerHTML = `<div class="hud-coord">${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}</div>
        <div class="hud-kind ${kind === "新生陆地" ? "gold" : kind === "新淹没" ? "flood" : ""}">${kind}</div>
        <div class="hud-val">${val}</div>`;
      ui.els.hud.style.left = e.clientX - rect.left + 14 + "px";
      ui.els.hud.style.top = e.clientY - rect.top + 14 + "px";
    }
    if (state.dragging) {
      const dx = (e.clientX - state.lastX) * scaleX;
      const dy = (e.clientY - state.lastY) * scaleY;
      state.cx -= dx / s;
      state.cy -= dy / s;
      clampPan();
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.needRender = true;
    }
  });
  el.addEventListener("pointerup", () => {
    state.dragging = false;
  });
  el.addEventListener("pointerleave", () => {
    ui.els.hud.hidden = true;
    state.dragging = false;
  });
  el.addEventListener("dblclick", (e) => {
    if (e.shiftKey) state.zoom = Math.max(1, state.zoom / 1.5);
    else state.zoom = Math.min(12, state.zoom * 1.5);
    clampPan();
    state.needRender = true;
  });

  const mm = ui.els.minimapC;
  const mmPan = (e) => {
    const rect = mm.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    state.cx = fx * state.meta.width;
    state.cy = fy * state.meta.height;
    clampPan();
    state.needRender = true;
  };
  mm.addEventListener("pointerdown", (e) => {
    mm.setPointerCapture(e.pointerId);
    mmPan(e);
    mm._pan = true;
  });
  mm.addEventListener("pointermove", (e) => {
    if (mm._pan) mmPan(e);
  });
  mm.addEventListener("pointerup", () => {
    mm._pan = false;
  });
}

function loop() {
  if (state.needRender) paint();
  requestAnimationFrame(loop);
}

async function boot() {
  const app = document.getElementById("app");
  ui = buildUI(app, {
    onSeaLevel: (sl, fromPreset) => applySeaLevel(sl, fromPreset),
    onIce: applyIce,
    onToggleExperimental: (on) => setExperimental(on),
    onWheelStep: (dir, e) => {
      const exp = state.experimental;
      let step = exp ? expStep(state.seaLevel) : 1;
      if (e.shiftKey) step = exp ? step * 5 : 5;
      else if (e.ctrlKey || e.metaKey) step = exp ? step / 10 : 0.1;
      nudgeSeaLevel(dir, step);
    },
    onToggleTheme: () => {
      state.theme = state.theme === "atlas" ? "dark" : "atlas";
      ui.applyPanelState(panelPrefs());
      persist();
      state.needRender = true;
    },
    onToggleCb: () => {
      state.colorblind = !state.colorblind;
      ui.setCbButton(state.colorblind);
      state.needRender = true;
    },
    onToggleStats: () => {
      state.statsOpen = !state.statsOpen;
      ui.applyPanelState(panelPrefs());
      persist();
      resizeCanvas();
    },
    onTogglePresets: () => {
      state.presetsOpen = !state.presetsOpen;
      ui.applyPanelState(panelPrefs());
      persist();
      resizeCanvas();
    },
    onLayer: (key, on) => {
      state.layers[key] = on;
      persist();
      state.needRender = true;
    },
    onKey: onKeyDown,
  });
  ui.applyPanelState(panelPrefs());
  ui.applySliderRange(state.experimental);

  view = ui.els.map;
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  try {
    const [{ meta, elev }, annotations, countries, cities, chinaProv, prefectures] =
      await Promise.all([
        loadElev(),
        fetchJson("./data/annotations.json").catch(() => []),
        loadGeoJson("./data/geo/countries_110m.geojson"),
        loadGeoJson("./data/geo/populated_places_110m.geojson"),
        loadGeoJson("./data/geo/china_provinces.geojson"),
        loadGeoJson("./data/geo/china_prefectures.geojson"),
      ]);
    state.meta = meta;
    state.elev = elev;
    state.annotations = annotations;
    state.geo = { countries, cities, chinaProv, prefectures };
    state.cx = meta.width / 2;
    state.cy = meta.height / 2;
    state.landPctFn = makeLandFraction(elev, meta.width, meta.height);
    state.landBase = state.landPctFn(0);
    renderer = new MapRenderer(elev, meta.width, meta.height);

    minimapImg = new Image();
    minimapImg.src = "./data/elev-min.png";

    bindMapEvents();
    applySeaLevel(0, true);
    const now = PRESETS.find((p) => p.id === "now");
    ui.els.sceneDesc.textContent = now.desc;
    loop();
  } catch (err) {
    console.error(err);
    ui.showError(
      "高程数据加载失败。请通过 HTTP 访问（scripts/serve.py），并确认 data/ 目录完整。"
    );
  }
}

boot();
