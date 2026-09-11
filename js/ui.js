import { formatSeaLevel, seaLevelNote } from "./geo-utils.js";

export const PRESETS = [
  {
    id: "lgm",
    key: "1",
    name: "末次冰盛期",
    sl: -130,
    desc: "约 2.1–2.6 万年前。白令陆桥出露，巽他古陆连成一体，不列颠与欧洲相连，大陆架广泛成陆。",
  },
  {
    id: "deglac",
    key: "2",
    name: "冰消中期",
    sl: -60,
    desc: "末次冰消过程中期。多格兰仍存，海岸线较今明显偏外。",
  },
  {
    id: "now",
    key: "3",
    name: "现代",
    sl: 0,
    desc: "现代平均海平面基准。",
  },
  {
    id: "ar6",
    key: "4",
    name: "AR6 高排放 2100",
    sl: 0.8,
    desc: "SSP5-8.5 2100 量级代表值（官方区间约 0.63–1.01 m）。",
  },
  {
    id: "high2",
    key: "5",
    name: "高端情景",
    sl: 2.0,
    desc: "低信度高尾，2100 有可能触及。",
  },
  {
    id: "ice",
    key: "6",
    name: "冰盖全融",
    sl: 60,
    desc: "常用简化平衡态（全冰盖约 60–72 m 量级）。不是某一年的预测。",
  },
];

export const ICE = {
  gis: { label: "格陵兰", m: 7.4 },
  wais: { label: "西南极 WAIS", m: 3.3 },
  eais: { label: "东南极 EAIS", m: 52.0 },
  glacier: { label: "山地冰川", m: 0.4 },
};

export const MAGNETS = [-130, -60, -20, 0, 2, 5, 10, 20, 60];

export function snapSeaLevel(sl) {
  for (const m of MAGNETS) {
    if (Math.abs(sl - m) <= 0.25) return m;
  }
  return Math.round(sl * 10) / 10;
}

const LS = {
  theme: "mainland.theme",
  statsOpen: "mainland.statsOpen",
  presetsOpen: "mainland.presetsOpen",
  layers: "mainland.layers",
};

export function loadPrefs() {
  let theme = "atlas";
  let statsOpen = true;
  let presetsOpen = true;
  let layers = {
    countries: true,
    cities: true,
    china: true,
    continents: true,
    ghost: true,
  };
  try {
    theme = localStorage.getItem(LS.theme) || "atlas";
    const s = localStorage.getItem(LS.statsOpen);
    const p = localStorage.getItem(LS.presetsOpen);
    if (s != null) statsOpen = s === "1";
    if (p != null) presetsOpen = p === "1";
    const raw = localStorage.getItem(LS.layers);
    if (raw) layers = { ...layers, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { theme: theme === "dark" ? "dark" : "atlas", statsOpen, presetsOpen, layers };
}

export function savePrefs(p) {
  try {
    localStorage.setItem(LS.theme, p.theme);
    localStorage.setItem(LS.statsOpen, p.statsOpen ? "1" : "0");
    localStorage.setItem(LS.presetsOpen, p.presetsOpen ? "1" : "0");
    localStorage.setItem(LS.layers, JSON.stringify(p.layers));
  } catch {
    /* ignore */
  }
}

export function buildUI(root, handlers) {
  root.innerHTML = `
  <header class="top">
    <div class="brand">
      <div class="title-block">
        <div class="title">海陆变迁</div>
        <div class="subtitle muted">ETOPO 2022 · 海平面 −150 ～ +80 m</div>
      </div>
      <div class="chip" id="chip-scene">现代</div>
    </div>
    <div class="top-actions">
      <div class="layer-menu" id="layer-menu">
        <button type="button" class="btn" id="btn-layers" aria-expanded="false">图层</button>
        <div class="layer-pop" id="layer-pop" hidden>
          <label><input type="checkbox" data-layer="countries" checked /> 国家界线</label>
          <label><input type="checkbox" data-layer="cities" checked /> 世界城市</label>
          <label><input type="checkbox" data-layer="china" checked /> 中国行政区</label>
          <label><input type="checkbox" data-layer="continents" checked /> 大陆名</label>
          <label><input type="checkbox" data-layer="ghost" checked /> 现代岸线</label>
        </div>
      </div>
      <button type="button" class="btn" id="btn-theme">深色</button>
      <button type="button" class="btn" id="btn-cb" title="色盲友好">色盲</button>
      <button type="button" class="btn btn-icon" id="btn-stats" title="统计面板">»</button>
    </div>
  </header>
  <div class="body">
    <main class="map-wrap">
      <canvas id="map" aria-label="世界高程地图"></canvas>
      <div class="hud" id="hud" hidden></div>
      <div class="zoom-badge" id="zoom-badge" hidden></div>
      <div class="err" id="err" hidden></div>
      <div class="minimap" id="minimap">
        <canvas id="minimap-c" width="140" height="70"></canvas>
      </div>
      <div class="legend">
        <div class="lg-row"><span class="sw gold"></span>新生陆地（海退）</div>
        <div class="lg-row"><span class="sw flood"></span>新淹没（海升）</div>
        <div class="lg-row"><span class="sw land"></span>陆地</div>
        <div class="lg-row"><span class="sw sea"></span>海洋</div>
        <div class="lg-row"><span class="sw ghost"></span>现代岸线</div>
      </div>
    </main>
    <aside class="stats" id="stats">
      <section>
        <h2>纬度加权陆地面积</h2>
        <div class="metric" id="land-pct">—</div>
        <div class="delta muted" id="land-delta">—</div>
      </section>
      <section>
        <h2>当前情景</h2>
        <p id="scene-desc" class="desc">现代平均海平面基准。</p>
      </section>
      <section>
        <h2>冰盖贡献（可选）</h2>
        <div id="ice-box" class="ice-box"></div>
      </section>
      <section>
        <h2>此刻可见注记</h2>
        <ul id="anno-list" class="anno-list"></ul>
      </section>
    </aside>
  </div>
  <footer class="dock" id="dock">
    <div class="sl-row">
      <label class="sl-label" for="sl">海平面</label>
      <div class="sl-read" id="sl-read">+0.0 m</div>
      <div class="sl-note" id="sl-note"></div>
      <button type="button" class="btn btn-ghost btn-collapse" id="btn-presets" title="情景预设">情景</button>
    </div>
    <input id="sl" class="slider" type="range" min="-150" max="80" step="0.1" value="0"
      aria-valuemin="-150" aria-valuemax="80" aria-valuenow="0" aria-valuetext="海平面正0.0米" />
    <div class="ticks" id="ticks" aria-hidden="true"></div>
    <div class="presets" id="presets"></div>
  </footer>
  <footer class="foot muted">
    数据：ETOPO 2022 Bedrock（NOAA NCEI, DOI: 10.25921/fd45-gt74）。模型：一阶近似（固定固体表面 + 海平面切割），无 GIA、无冰盖压载、无沉积。
    +60 m 为冰盖全融平衡态展示，不是某一年的预测。国界/城市：Natural Earth；中国行政区：公开行政区划边界。键盘：←/→ 0.1 m · Shift 1 m · 0 归零 · 1–6 预设。
  </footer>`;

  const $ = (id) => root.querySelector("#" + id);
  const els = {
    map: $("map"),
    hud: $("hud"),
    err: $("err"),
    zoomBadge: $("zoom-badge"),
    minimap: $("minimap"),
    minimapC: $("minimap-c"),
    sl: $("sl"),
    slRead: $("sl-read"),
    slNote: $("sl-note"),
    ticks: $("ticks"),
    presets: $("presets"),
    landPct: $("land-pct"),
    landDelta: $("land-delta"),
    sceneDesc: $("scene-desc"),
    chip: $("chip-scene"),
    iceBox: $("ice-box"),
    annoList: $("anno-list"),
    btnTheme: $("btn-theme"),
    btnCb: $("btn-cb"),
    btnStats: $("btn-stats"),
    btnPresets: $("btn-presets"),
    btnLayers: $("btn-layers"),
    layerPop: $("layer-pop"),
    stats: $("stats"),
    dock: $("dock"),
  };

  let tickHtml = "";
  for (let v = -150; v <= 80; v += 5) {
    const major = v % 20 === 0;
    const pos = ((v + 150) / 230) * 100;
    tickHtml += `<div class="tick ${major ? "major" : ""}" style="left:${pos}%"></div>`;
    if (major) {
      tickHtml += `<div class="tick-label" style="left:${pos}%">${v > 0 ? "+" : ""}${v}</div>`;
    }
  }
  for (const m of MAGNETS) {
    const pos = ((m + 150) / 230) * 100;
    const cls = m === 0 ? "pin zero" : m < 0 ? "pin past" : m >= 40 ? "pin flood" : "pin rise";
    tickHtml += `<button type="button" class="${cls}" style="left:${pos}%" data-sl="${m}" title="${m} m"></button>`;
  }
  els.ticks.innerHTML = tickHtml;

  els.presets.innerHTML = PRESETS.map(
    (p) =>
      `<button type="button" class="preset" data-sl="${p.sl}" data-id="${p.id}" title="${p.desc}">
        <span class="p-name">${p.name}</span>
        <span class="p-val">${p.sl > 0 ? "+" : p.sl < 0 ? "−" : ""}${Math.abs(p.sl).toFixed(1)} m</span>
      </button>`
  ).join("");

  els.iceBox.innerHTML =
    Object.entries(ICE)
      .map(
        ([k, v]) =>
          `<label class="ice-item"><input type="checkbox" data-ice="${k}" /> ${v.label}
         <span class="muted">+${v.m} m</span></label>`
      )
      .join("") + `<div class="ice-sum muted" id="ice-sum"></div>`;

  els.sl.addEventListener("input", () => {
    handlers.onSeaLevel(parseFloat(els.sl.value));
  });
  els.presets.addEventListener("click", (e) => {
    const b = e.target.closest(".preset");
    if (!b) return;
    handlers.onSeaLevel(parseFloat(b.dataset.sl), true);
    const p = PRESETS.find((x) => x.id === b.dataset.id);
    if (p) els.sceneDesc.textContent = p.desc;
  });
  els.ticks.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sl]");
    if (!b) return;
    handlers.onSeaLevel(parseFloat(b.dataset.sl), true);
  });
  els.iceBox.addEventListener("change", () => {
    const checked = [...els.iceBox.querySelectorAll("input:checked")].map(
      (i) => i.dataset.ice
    );
    handlers.onIce(checked);
  });
  els.btnTheme.addEventListener("click", () => handlers.onToggleTheme());
  els.btnCb.addEventListener("click", () => handlers.onToggleCb());
  els.btnStats.addEventListener("click", () => handlers.onToggleStats());
  els.btnPresets.addEventListener("click", () => handlers.onTogglePresets());
  els.btnLayers.addEventListener("click", () => {
    const open = els.layerPop.hidden;
    els.layerPop.hidden = !open;
    els.btnLayers.setAttribute("aria-expanded", open ? "true" : "false");
  });
  els.layerPop.addEventListener("change", (e) => {
    const i = e.target.closest("input[data-layer]");
    if (!i) return;
    handlers.onLayer(i.dataset.layer, i.checked);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#layer-menu")) {
      els.layerPop.hidden = true;
      els.btnLayers.setAttribute("aria-expanded", "false");
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea")) return;
    const step = e.shiftKey ? 1 : 0.1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlers.onStep(-step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handlers.onStep(step);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      handlers.onStep(5);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      handlers.onStep(-5);
    } else if (e.key === "Home") {
      handlers.onSeaLevel(-150, true);
    } else if (e.key === "End") {
      handlers.onSeaLevel(80, true);
    } else if (e.key === "0") {
      handlers.onSeaLevel(0, true);
    } else if (e.key >= "1" && e.key <= "6") {
      const p = PRESETS[parseInt(e.key, 10) - 1];
      if (p) {
        handlers.onSeaLevel(p.sl, true);
        els.sceneDesc.textContent = p.desc;
      }
    }
  });

  return {
    els,
    applyPanelState(prefs) {
      document.documentElement.dataset.theme = prefs.theme;
      els.btnTheme.textContent = prefs.theme === "atlas" ? "深色" : "浅色";
      els.stats.classList.toggle("is-collapsed", !prefs.statsOpen);
      els.btnStats.textContent = prefs.statsOpen ? "»" : "«";
      els.btnStats.title = prefs.statsOpen ? "收起统计" : "展开统计";
      els.presets.classList.toggle("is-collapsed", !prefs.presetsOpen);
      els.dock.classList.toggle("presets-collapsed", !prefs.presetsOpen);
      els.btnPresets.classList.toggle("active", prefs.presetsOpen);
      for (const [k, v] of Object.entries(prefs.layers)) {
        const i = els.layerPop.querySelector(`input[data-layer="${k}"]`);
        if (i) i.checked = !!v;
      }
    },
    setSeaLevelUI(sl, landPct, landBase) {
      els.sl.value = String(sl);
      els.sl.setAttribute("aria-valuenow", String(sl));
      els.sl.setAttribute(
        "aria-valuetext",
        `海平面${sl < 0 ? "负" : "正"}${Math.abs(sl).toFixed(1)}米`
      );
      els.slRead.textContent = formatSeaLevel(sl);
      els.slNote.textContent = seaLevelNote(sl);
      els.landPct.textContent = landPct.toFixed(2) + "%";
      if (landBase != null) {
        const d = landPct - landBase;
        const sign = d > 0.005 ? "+" : d < -0.005 ? "−" : "";
        els.landDelta.textContent = `较现代 ${sign}${Math.abs(d).toFixed(2)} 个百分点`;
        els.landDelta.className =
          "delta " + (d > 0.005 ? "up" : d < -0.005 ? "down" : "muted");
      }
      const near = PRESETS.find((p) => Math.abs(p.sl - sl) < 0.05);
      els.chip.textContent = near ? near.name : "自定义";
      const fill = ((sl + 150) / 230) * 100;
      els.sl.style.setProperty("--fill", fill + "%");
    },
    setIceSum(total) {
      const el = document.getElementById("ice-sum");
      if (el) el.textContent = total > 0 ? `合计 +${total.toFixed(1)} m` : "";
    },
    setAnnotations(list) {
      els.annoList.innerHTML = list.length
        ? list
            .map((a) => `<li><strong>${a.name}</strong><span>${a.note}</span></li>`)
            .join("")
        : `<li class="muted">当前海平面下无匹配注记</li>`;
    },
    showError(msg) {
      els.err.hidden = false;
      els.err.textContent = msg;
    },
    setCbButton(on) {
      els.btnCb.classList.toggle("active", on);
    },
  };
}
