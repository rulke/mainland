import { MapRenderer } from "./map-render.js";
import { makeLandFraction, sampleElev, pxToLonLat } from "./geo-utils.js";
import { buildUI, PRESETS, ICE, snapSeaLevel } from "./ui.js";

const state = {
  seaLevel: 0,
  landBase: null,
  theme: "dark",
  colorblind: false,
  showGhost: true,
  zoom: 1,
  cx: 0,
  cy: 0,
  elev: null,
  meta: null,
  annotations: [],
  ice: { gis: false, wais: false, eais: false, glacier: false },
  dragging: false,
  lastX: 0,
  lastY: 0,
  needRender: true,
  landPctFn: null,
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

function resizeCanvas() {
  const wrap = view.parentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  view.style.width = w + "px";
  view.style.height = h + "px";
  view.width = Math.max(1, Math.floor(w * dpr));
  view.height = Math.max(1, Math.floor(h * dpr));
  state.needRender = true;
}

function clampPan() {
  const { meta, zoom } = state;
  const maxX = meta.width / 2;
  const maxY = meta.height / 2;
  // allow some slack
  state.cx = Math.min(meta.width + 200, Math.max(-200, state.cx));
  state.cy = Math.min(meta.height + 100, Math.max(-100, state.cy));
}

function drawMinimapOverlay(s, dx, dy, dw, dh) {
  const mc = ui.els.minimapC;
  const mctx = mc.getContext("2d");
  mctx.clearRect(0, 0, mc.width, mc.height);
  if (minimapImg) mctx.drawImage(minimapImg, 0, 0, mc.width, mc.height);
  // view rect in world px: visible world width = view.width / s
  const vw = view.width / s;
  const vh = view.height / s;
  const x0 = state.cx - vw / 2;
  const y0 = state.cy - vh / 2;
  const rx = (x0 / state.meta.width) * mc.width;
  const ry = (y0 / state.meta.height) * mc.height;
  const rw = (vw / state.meta.width) * mc.width;
  const rh = (vh / state.meta.height) * mc.height;
  mctx.strokeStyle = "rgba(255,255,255,0.9)";
  mctx.lineWidth = 1;
  mctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
}

function paint() {
  if (!renderer || !state.elev) return;
  const off = renderer.render(state.seaLevel, {
    colorblind: state.colorblind,
    showGhost: state.showGhost,
  });
  const smooth = state.zoom <= 4;
  const t = renderer.drawTo(view, state.zoom, state.cx, state.cy, smooth);
  drawMinimapOverlay(t.s, t.dx, t.dy, t.dw, t.dh);

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
  state.seaLevel = Math.max(-150, Math.min(80, sl));
  if (!fromPreset) state.seaLevel = snapSeaLevel(state.seaLevel);
  const pct = state.landPctFn(state.seaLevel);
  ui.setSeaLevelUI(state.seaLevel, pct, state.landBase);
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
  if (keys.length) applySeaLevel(Math.round(sum * 10) / 10, true);
}

function bindMapEvents() {
  const el = view;
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    state.zoom = Math.min(12, Math.max(1, state.zoom * factor));
    state.needRender = true;
  }, { passive: false });

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
    // hover HUD
    const s = (el.height / state.meta.height) * state.zoom;
    const wx = (e.clientX - rect.left) * scaleX;
    const wy = (e.clientY - rect.top) * scaleY;
    const cx = state.cx + (wx - el.width / 2) / s;
    const cy = state.cy + (wy - el.height / 2) / s;
    if (cx >= 0 && cx < state.meta.width && cy >= 0 && cy < state.meta.height) {
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
    state.needRender = true;
  });

  // minimap click/drag pan
  const mm = ui.els.minimapC;
  const mmPan = (e) => {
    const rect = mm.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    state.cx = fx * state.meta.width;
    state.cy = fy * state.meta.height;
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
    onStep: (d) => applySeaLevel(Math.round((state.seaLevel + d) * 10) / 10),
    onIce: applyIce,
    onToggleTheme: () => {
      state.theme = state.theme === "dark" ? "atlas" : "dark";
      document.documentElement.dataset.theme = state.theme;
      ui.setThemeButton(state.theme === "atlas");
    },
    onToggleCb: () => {
      state.colorblind = !state.colorblind;
      ui.setCbButton(state.colorblind);
      state.needRender = true;
    },
    onToggleGhost: () => {
      state.showGhost = !state.showGhost;
      ui.setGhostButton(state.showGhost);
      state.needRender = true;
    },
  });
  ui.setGhostButton(true);

  view = ui.els.map;
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  try {
    const [{ meta, elev }, annotations] = await Promise.all([
      loadElev(),
      fetchJson("./data/annotations.json").catch(() => []),
    ]);
    state.meta = meta;
    state.elev = elev;
    state.annotations = annotations;
    state.cx = meta.width / 2;
    state.cy = meta.height / 2;
    state.landPctFn = makeLandFraction(elev, meta.width, meta.height);
    state.landBase = state.landPctFn(0);
    renderer = new MapRenderer(elev, meta.width, meta.height);

    // minimap image
    minimapImg = new Image();
    minimapImg.src = "./data/elev-min.png";

    if (state.landBase < 27 || state.landBase > 32) {
      console.warn("land fraction out of range", state.landBase);
    }

    bindMapEvents();
    applySeaLevel(0, true);
    // default preset desc
    const now = PRESETS.find((p) => p.id === "now");
    ui.els.sceneDesc.textContent = now.desc;
    loop();
  } catch (err) {
    console.error(err);
    ui.showError(
      "高程数据加载失败。请通过 HTTP 访问（python -m http.server），并确认 data/ 目录完整。"
    );
  }
}

boot();
