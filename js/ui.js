import { formatSeaLevel, seaLevelNote, pxToLonLat } from "./geo-utils.js";

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

export function buildUI(root, handlers) {
  root.innerHTML = `
  <header class="top">
    <div class="brand">
      <div class="title">全球大陆 · 海平面模拟器</div>
      <div class="chip" id="chip-scene">现代</div>
    </div>
    <div class="top-actions">
      <span class="src muted">ETOPO 2022 Bedrock</span>
      <button type="button" class="btn" id="btn-theme" title="切换主题">纸色图集</button>
      <button type="button" class="btn" id="btn-cb" title="色盲友好">色盲</button>
      <button type="button" class="btn" id="btn-ghost" title="现代岸线">岸线</button>
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
        <div class="mm-view" id="mm-view"></div>
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
        <p id="scene-desc" class="desc">现代基准。</p>
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
  <footer class="dock">
    <div class="sl-row">
      <label class="sl-label" for="sl">海平面</label>
      <div class="sl-read" id="sl-read">+0.0 m</div>
      <div class="sl-note" id="sl-note"></div>
    </div>
    <input id="sl" class="slider" type="range" min="-150" max="80" step="0.1" value="0"
      aria-valuemin="-150" aria-valuemax="80" aria-valuenow="0" aria-valuetext="海平面正0.0米" />
    <div class="ticks" id="ticks" aria-hidden="true"></div>
    <div class="presets" id="presets"></div>
  </footer>
  <footer class="foot muted">
    数据：ETOPO 2022 Bedrock（NOAA NCEI, DOI: 10.25921/fd45-gt74）。模型：一阶近似（固定固体表面 + 海平面切割），无 GIA、无冰盖压载、无沉积。
    +60 m 为冰盖全融平衡态展示，不是某一年的预测。近岸精细淹没请使用沿海高分辨率 DEM。键盘：←/→ 0.1 m · Shift 1 m · 0 归零 · 1–6 预设。
  </footer>`;

  const $ = (id) => root.querySelector("#" + id);
  const els = {
    map: $("map"),
    hud: $("hud"),
    err: $("err"),
    zoomBadge: $("zoom-badge"),
    minimap: $("minimap"),
    minimapC: $("minimap-c"),
    mmView: $("mm-view"),
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
    btnGhost: $("btn-ghost"),
  };

  // ticks
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

  els.iceBox.innerHTML = Object.entries(ICE)
    .map(
      ([k, v]) =>
        `<label class="ice-item"><input type="checkbox" data-ice="${k}" /> ${v.label}
         <span class="muted">+${v.m} m</span></label>`
    )
    .join("") + `<div class="ice-sum muted" id="ice-sum"></div>`;

  // events
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
  els.btnGhost.addEventListener("click", () => handlers.onToggleGhost());

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
    setSeaLevelUI(sl, landPct, landBase) {
      els.sl.value = String(sl);
      els.sl.setAttribute("aria-valuenow", String(sl));
      els.sl.setAttribute("aria-valuetext", `海平面${sl < 0 ? "负" : "正"}${Math.abs(sl).toFixed(1)}米`);
      els.slRead.textContent = formatSeaLevel(sl);
      els.slNote.textContent = seaLevelNote(sl);
      els.landPct.textContent = landPct.toFixed(2) + "%";
      if (landBase != null) {
        const d = landPct - landBase;
        const sign = d > 0.005 ? "+" : d < -0.005 ? "−" : "";
        els.landDelta.textContent = `较现代 ${sign}${Math.abs(d).toFixed(2)} 个百分点`;
        els.landDelta.className = "delta " + (d > 0.005 ? "up" : d < -0.005 ? "down" : "muted");
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
        ? list.map((a) => `<li><strong>${a.name}</strong><span>${a.note}</span></li>`).join("")
        : `<li class="muted">当前海平面下无匹配注记</li>`;
    },
    showError(msg) {
      els.err.hidden = false;
      els.err.textContent = msg;
    },
    setThemeButton(atlas) {
      els.btnTheme.textContent = atlas ? "深空" : "纸色图集";
    },
    setCbButton(on) {
      els.btnCb.classList.toggle("active", on);
    },
    setGhostButton(on) {
      els.btnGhost.classList.toggle("active", on);
    },
  };
}
