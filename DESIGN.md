# DESIGN.md — 全球大陆 · 海平面模拟器（锁版规格）

> **唯一设计真源。** 改规格先改本文件，再改代码。与实现冲突时以本文件为准。
> 状态：已锁定（投影 / 范围 / 步进 / 主题 / 部署 / 数据 / 面积算法均已用户确认）

---

## 1. 产品定义

| 项 | 内容 |
|---|---|
| 一句话 | 拖动海平面高度，实时看清全球大陆如何生灭 |
| 用户 | 科普读者、地理/气候爱好者、教师演示、轻量研究预览 |
| 使用场景 | 浏览器打开；可部署到任意静态服务器供他人访问 |
| 非目标 | 建筑级城市淹没、3D 地球、实时遥感、后端 API、±1000 m 假想海平面 |

### 科学模型（一阶近似）

```
elev[x,y] 为 ETOPO 2022 Bedrock 高程（米，相对平均海平面近似）
若 elev < seaLevel  → 海洋，按 (seaLevel - elev) 水深着色
否则                → 陆地，按 elev 海拔着色
当 seaLevel < 0 且 0 ≤ elev < |seaLevel| → 「新生陆地」金色层
当 seaLevel > 0 且 0 ≤ elev < seaLevel   → 「新淹没」灰青 + 斜线
```

**局限（页面脚注必须出现）：**
1. 无地壳均衡回弹（GIA）、无冰盖质量压载
2. 无三角洲沉积与构造抬升
3. +60 m 为冰盖全融平衡态展示，非时间预测
4. 近岸城市尺度精度不足；本工具服务大陆尺度
5. Bedrock：格陵兰/南极显示的是基岩，不是冰体

---

## 2. 已锁定决策（用户确认）

| 决策点 | 锁定值 | 备注 |
|---|---|---|
| 投影 | **等距圆柱 Equirectangular** | 不用墨卡托；经纬均匀 |
| 主题 | **深色默认** + 纸色图集可切换 | |
| 海平面范围 | **−150.0 ~ +80.0 m** | **无** ±1000 实验档 |
| 最小步进 | **0.1 m** | **无** 5 m 专用刻度档 |
| 数据源 | ETOPO 2022 **Bedrock** | 非 Ice Surface |
| 交付分辨率 | **4320 × 2160** Int16 LE | 约 1 角分 / 2 km |
| 面积算法 | 纬度加权 `cos(lat)` | 文案标明「纬度加权」 |
| 验收方式 | **HTTP 打开** | 不承诺 `file://` 双击 |
| 运行环境 | **conda `mainland-slr`** | 预处理专用 |
| 部署 | 纯静态、相对路径 | 可上服务器 |
| 签名视觉 | 金色「新生陆地」 | |

---

## 3. 数据规格

### 3.1 源数据

| 项 | 值 |
|---|---|
| 名称 | ETOPO 2022 15/30/60 Arc-Second Global Relief — **Bedrock elevation** |
| 优先下载 | 60 角秒 GeoTIFF（体积与精度平衡） |
| 官方入口 | https://www.ncei.noaa.gov/products/etopo-global-relief-model |
| 60s Bedrock 直链（备案） | `https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/60s/60s_bed_elev_gtif/ETOPO_2022_v1_60s_N90W180_bed.tif` |
| DOI | 10.25921/fd45-gt74 |
| 备选 | GEBCO 年度网格（bed/sub-ice）；ETOPO1 bedrock（最后手段） |
| 原始存放 | `raw/`（gitignore） |

**为什么 Bedrock：** 海平面上升情景隐含冰盖融化，应露出冰下基岩；Ice Surface 会把冰盖当高程，+60 m 情景错误。

### 3.2 交付数据

| 文件 | 规格 |
|---|---|
| `data/elev.bin` | 4320×2160，**Int16 小端**，行主序（y 从北到南或南到北，**必须在 meta 写明**），单位米。大小 4320×2160×2 = **18,662,400** 字节 |
| `data/elev.bin.gz` | 上者 gzip，供服务器 `gzip_static` / 前端 DecompressionStream |
| `data/meta.json` | 见下 |
| `data/elev-preview.png` | 全球伪彩预览，用于人工对海岸线 |
| `data/elev-min.png` | 480×240，小地图专用 |
| `data/annotations.json` | 标注点 |

**`meta.json` 字段：**

```json
{
  "width": 4320,
  "height": 2160,
  "dtype": "int16",
  "endianness": "little",
  "rowOrder": "north-to-south",
  "lonMin": -180,
  "lonMax": 180,
  "latMax": 90,
  "latMin": -90,
  "source": "ETOPO 2022 Bedrock",
  "sourceDoi": "10.25921/fd45-gt74",
  "resampledFrom": "60s",
  "minElev": -10984,
  "maxElev": 8248,
  "generatedAt": "ISO-8601"
}
```

**像元中心：**  
`lon = lonMin + (i + 0.5) * 360/width`  
`lat = latMax - (j + 0.5) * 180/height`（north-to-south）

### 3.3 预处理管线（conda `mainland-slr`）

```
scripts/download_etopo.py  →  raw/*.tif
scripts/process_etopo.py   →  data/elev.bin + meta + preview + min + gz
```

处理步骤：
1. Pillow 打开 GeoTIFF 为 16-bit 灰度；若失败 → 报告并询问是否 `pip install tifffile`（**不静默安装**）
2. numpy 最近邻/面积平均重采样到 4320×2160
3. 校正行序为 north-to-south
4. 写 Int16 LE bin + meta
5. 生成 preview / min PNG（色带与前端一致的简化版）
6. gzip
7. 打印统计：min/max、SL=0 经纬度加权陆地比例（应 ≈29%，超出 [27%,32%] 则失败退出）

### 3.4 前端加载

1. `fetch('./data/meta.json')`
2. 优先 `fetch('./data/elev.bin.gz')`，若支持则 `DecompressionStream('gzip')`，否则 `fetch('./data/elev.bin')`
3. `Int16Array` 解析；校验字节长度 = width*height*2
4. 失败：错误条「高程数据加载失败，请通过 HTTP 访问并检查 data/ 目录」

---

## 4. 海平面控制

| 参数 | 值 |
|---|---|
| 范围 | −150.0 ~ +80.0 m |
| 最小步进 | **0.1 m** |
| 显示 | 始终 1 位小数；正数带 `+`；负数用 `−`（U+2212） |
| 默认值 | **+0.0 m** |

### 4.1 磁吸点（±0.25 m）

| 值 | 情景 |
|---|---|
| −130 | 末次冰盛期 LGM |
| −60 | 冰消中期 |
| −20 | 间冰期波动区上沿 |
| 0 | 现代基准（加粗刻度） |
| +2 | 高端近未来 |
| +5 | （过渡，弱磁吸） |
| +10 | 格陵兰尺度 |
| +20 | （过渡） |
| +60 | 冰盖全融经典值 |

### 4.2 轨道刻度

| 类型 | 间隔 |
|---|---|
| 主刻度（带数字） | 20 m：−140…+80（含 0 加粗） |
| 次刻度（短线） | 5 m |
| 情景钉（可点击圆点） | 上表磁吸点，带色：cyan=古海平面，白=0，amber=上升，flood=+60 |

### 4.3 键盘

| 键 | 步长 |
|---|---|
| ← / → | 0.1 m |
| Shift + ← / → | 1.0 m |
| PageUp / PageDown | 5.0 m |
| Home / End | −150 / +80 |
| `0` | 精确 0 |
| `1`–`6` | 六个主预设 |
| `?` | 快捷键浮层 |

### 4.4 动态旁注（读数旁一行小字）

| 条件 | 文案 |
|---|---|
| \|SL\| < 0.05 | 现代基准 |
| −20 ~ 0 | 间冰期—冰消波动区 |
| −150 ~ −100 | 末次冰盛期量级 |
| 0 ~ +1.6 | IPCC AR6 2100 相关量级 |
| +2 ~ +15 | 格陵兰尺度冰融 |
| +40 ~ +80 | 冰盖全融平衡态（非时间预测） |

### 4.5 主预设（6 个，一键飞）

| 键 | 名称 | SL | 解说摘要 |
|---|---|---|---|
| 1 | 末次冰盛期 | −130 m | 约 2.1–2.6 万年前；白令陆桥、巽他古陆、不列颠连欧陆、大陆架广泛出露 |
| 2 | 冰消中期 | −60 m | 末次冰消过程中期；多格兰仍存 |
| 3 | 现代 | 0 m | 基准 |
| 4 | AR6 高排放 2100 | +0.8 m | SSP5-8.5 2100 量级代表值 |
| 5 | 高端情景 | +2.0 m | 低信度高尾 |
| 6 | 冰盖全融 | +60 m | 常用简化平衡态 |

预设切换：滑杆值 400ms tween（`cubic-bezier(.22,1,.36,1)`）；`prefers-reduced-motion` 则直接跳变。

### 4.6 冰盖拆分开关（进阶面板）

```
[ ] 格陵兰        +7.4 m
[ ] 西南极 WAIS   +3.3 m
[ ] 东南极 EAIS   +52.0 m
[ ] 山地冰川      +0.4 m
合计显示，勾选后写入滑杆（覆盖手动值）
```

科学脚注：贡献为海平面当量（SLE）量级，用于理解「+60 从哪来」，非精细冰盖模式。

---

## 5. 视觉设计

### 5.1 风格锚点

**「深渊声呐仪表 × 古典高程设色图集」**

- Chrome：NASA 行星监控台式深色仪表
- 地图：古典 hypsometric（陆）+ 海图等深逻辑（海）
- 签名：海退时大陆架镀金色「新生陆地」

### 5.2 界面 Token（深色默认）

```css
:root {
  /* 背景 */
  --bg-void: #070B12;
  --bg-canvas: #0B1220;
  --bg-panel: #111A2B;
  --bg-panel-2: #162033;
  --bg-inset: #0D1524;
  --bg-glass: rgba(17, 26, 43, 0.82);

  /* 描边 */
  --border-subtle: #1E2A40;
  --border-default: #2A3A55;
  --border-strong: #3D5478;

  /* 文字 */
  --text-primary: #E8EEF7;
  --text-secondary: #9AABC2;
  --text-muted: #6B7F99;
  --text-inverse: #0B1220;

  /* 功能 */
  --accent-amber: #E8B84A;
  --accent-amber-2: #F5D07A;
  --accent-cyan: #3EC6E0;
  --accent-cyan-dim: #1A6B80;
  --accent-flood: #F07178;
  --accent-ok: #3DDC97;
  --focus-ring: #7DD3FC;

  --grid-line: #1A2438;
  --grid-line-major: #2A3A55;
}
```

**纸色图集主题（`[data-theme="atlas"]`）：**

```css
[data-theme="atlas"] {
  --bg-void: #F4F0E6;
  --bg-canvas: #EDE8DC;
  --bg-panel: #F8F5EC;
  --bg-panel-2: #FFFFFF;
  --text-primary: #1A2430;
  --text-secondary: #4A5568;
  --text-muted: #7A8699;
  --border-default: #C9C0AE;
  --accent-amber: #B8860B;
  --accent-cyan: #0E7490;
  --accent-flood: #C2414B;
}
```

地图 hypsometric / 水深色带**两主题共用**（可读性优先）；仅 chrome 与网格线随主题。

### 5.3 字体

```css
--font-ui: "Inter", "Segoe UI", "PingFang SC", "Noto Sans SC",
           "Microsoft YaHei", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Cascadia Code", "SF Mono",
             Consolas, "Courier New", monospace;
```

不加载外网字体（部署环境不保证 Google Fonts）。

| 角色 | 字号/行高 | 字重 | 用途 |
|---|---|---|---|
| Display | 28/1.2 | 600 | 产品名 |
| H2 | 18/1.35 | 600 | 面板标题 |
| Body | 14/1.55 | 400 | 正文 |
| Label | 12/1.4 | 500 | 控件标签 |
| Caption | 11/1.4 | 400 | 脚注 |
| Data | 13/1.3 mono | 500 | 海平面读数、坐标 |
| Metric | 22/1.1 mono | 600 | 面积% |
| Scenario | 15/1.3 | 600 | 预设名 |

数字：`font-variant-numeric: tabular-nums`。

### 5.4 地图色带 · 海洋（按水深）

| 水深 m | Hex | 名 |
|---|---|---|
| ≥6000 | `#040810` | 超深渊 |
| 4000–6000 | `#081428` | 深海平原 |
| 2000–4000 | `#0C2A4A` | 深海盆地 |
| 1000–2000 | `#0E4D6E` | 大陆坡下 |
| 200–1000 | `#1287A8` | 大陆坡上 |
| 50–200 | `#2BB8D4` | 陆架外缘 |
| 0–50 | `#5AD0E0` | 浅海 |
| **新淹没**（SL>0 且 0≤elev<SL） | `#5B8FA8` + 8% 斜线 | 曾是陆地 |

### 5.5 地图色带 · 陆地（hypsometric）

| 海拔 m | Hex | 名 |
|---|---|---|
| 0–200 | `#3D8F5C` | 滨海低地 |
| 200–500 | `#6B9A4A` | 丘陵 |
| 500–1000 | `#A0A05A` | 低山 |
| 1000–2000 | `#C4A35A` | 高原 |
| 2000–3000 | `#A67C3D` | 高山 |
| 3000–4000 | `#7A5530` | 极高山 |
| 4000–5000 | `#C9BBA8` | 雪线以上 |
| ≥5000 | `#F2EDE4` | 峰顶 |

### 5.6 签名层 · 新生陆地（SL < 0）

条件：`elev ∈ [0, |SL|)`（现代应是海、因海退露出）

| 层 | 值 |
|---|---|
| 按海拔 | `#F0D078` → `#E8B84A` → `#C4922E` |
| 与现代陆地交界描边 | `#F5D07A` 1px |
| 可选微纹理 | 2px 点阵 8% 白 |

全站唯一允许轻度增亮的地图图层。

### 5.7 幽灵岸线（现代 0 m 岸线）

- 开关默认开
- `rgba(255,255,255,0.35)`，1px；zoom>4 → 1.5px
- 纸色主题：`rgba(30,40,55,0.35)`
- 来源：预处理缓存的 elev≈0 等值折线，或运行时简化提取

### 5.8 色盲模式（`data-cb="1"`）

| 常规 | 色盲安全 |
|---|---|
| 陆地绿系 | 降绿、偏青黄 |
| 海洋青蓝 | 蓝紫阶梯 `#1A237E`→`#82B1FF` |
| 新淹没红 | 洋红 `#CE93D8` |
| 金色新生陆地 | **保持**（对红绿色盲最安全） |

### 5.9 布局

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP  产品名 · 情景 chip · 数据源 · 主题/色盲/设置                  │ 48px
├──────────────────────────────────────────────────────────┬───────┤
│                                                          │ STATS │
│                    地图画布 Canvas                        │ 280px │
│   缩放/平移 · 悬停 HUD · 可选标注 · 小地图                  │       │
│                                                          │       │
├──────────────────────────────────────────────────────────┴───────┤
│ DOCK  滑杆 + 读数 + 旁注 + 预设条                                 │ 120–140px
└──────────────────────────────────────────────────────────────────┘
```

间距网格 4px；面板圆角 10px；按钮 8px；chip 999px。

**STATS 模块：**
1. 纬度加权陆地面积 %（Metric mono）
2. Δ vs 现代（amber 增 / flood 减）
3. 当前情景说明（Body）
4. 此刻生效的标注列表

**悬停 HUD：** 坐标 + 高程或水深；若属新生陆地显示金色「新露出陆架」。

### 5.10 动效

| 场景 | 时长 | 缓动 |
|---|---|---|
| 预设 tween | 400ms | cubic-bezier(.22,1,.36,1) |
| 面积数字 | 180ms | linear |
| 面板进入 | 160ms | ease-out |
| 标注首次出现 | 240ms | ease-out |
| hover | 120ms | ease |

`@media (prefers-reduced-motion: reduce)` 关闭非必要动效。

---

## 6. 地图导航

| 项 | 规格 |
|---|---|
| 投影 | 等距圆柱 |
| Zoom | 1× – 12× |
| 缩放锚点 | 光标 / 捏合中点 |
| 滚轮增量 | ×1.2 |
| 平移 | 左键拖 / 触屏单指 |
| 双击 | 放大；Shift+双击缩小 |
| `+` `-` `0` | 放大 缩小 复位 |
| 平滑 | zoom≤4 双线性；>4 默认最近邻（可关） |
| 高倍提示 | zoom>4 角标「原始网格 ≈ 2 km」 |
| 小地图 | 右下 140×70，源 `elev-min.png`，可拖视口 |
| 区域书签 | 白令 / 巽他 / 北海 / 南海陆架 / 哈德逊湾 / 华北平原 |

触控目标 ≥44px；滑杆命中区高 32px。

---

## 7. 标注系统

`data/annotations.json` 数组项：

```json
{
  "id": "beringia",
  "name": "白令陆桥",
  "lon": 170, "lat": 65,
  "slMax": -30,
  "slMin": -150,
  "note": "亚洲与北美在低海平面时连通"
}
```

- 仅当 `slMin ≤ currentSL ≤ slMax` 时显示点与侧栏文案
- 示例条目：beringia、sundaland、doggerland、sahul、hudson、scs_shelf

---

## 8. 页面脚注（常驻）

```
数据：ETOPO 2022 Bedrock（NOAA NCEI, DOI: 10.25921/fd45-gt74）
模型：一阶近似（固定固体表面 + 海平面切割）。无 GIA、无冰盖压载、无沉积。
+60 m 为冰盖全融平衡态展示，不是某一年的预测。近岸精细淹没请使用沿海高分辨率 DEM。
```

---

## 9. 部署

### 9.1 静态目录

上传项目中：`index.html`、`css/`、`js/`、`data/`（含 bin/gz/json/png）。不需要 Node 服务端。

### 9.2 Nginx 示例

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/mainland;
  index index.html;

  location / {
    try_files $uri $uri/ =404;
  }

  location ~* \.(bin|gz|png|json|js|css)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    gzip_static on;
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }
}
```

### 9.3 本地验收

```powershell
conda activate mainland-slr
python -m http.server 8080
# http://127.0.0.1:8080/
```

### 9.4 约定

- 全部相对路径
- 零 CDN 依赖
- HTML 不缓存；data/js/css 长缓存
- 跨版本升级 data 时，同步改 query（如 `elev.bin?v=2`）或清 CDN

---

## 10. 文件与模块职责

| 文件 | 职责 |
|---|---|
| `index.html` | 结构：顶栏、canvas、stats、dock、脚注、错误条 |
| `css/main.css` | 全部 token、布局、主题、响应式 |
| `js/color-ramps.js` | 水深/陆地/新生/淹没 LUT 生成 |
| `js/geo-utils.js` | 像元↔经纬、cos(lat) 权重、面积统计 |
| `js/map-render.js` | Canvas 绘制、缩放变换、ImageDate 着色、幽灵岸线 |
| `js/ui.js` | 滑杆、预设、键盘、主题、HUD、标注列表 |
| `js/main.js` | 启动、加载数据、状态机、rAF 循环 |

### 状态对象（示意）

```js
state = {
  seaLevel: 0,          // m, 0.1 步进
  theme: 'dark' | 'atlas',
  colorblind: false,
  showGhostCoast: true,
  showAnnotations: true,
  zoom: 1, cx: 0, cy: 0,  // 视口
  elev: Int16Array,
  meta: {},
  ice: { gis:false, wais:false, eais:false, glacier:false }
}
```

### 渲染循环

- 仅在 seaLevel / 视口 / 主题 / 开关变化时重绘
- 着色写入 `ImageData` → `putImageData`（或离屏 canvas 再 drawImage 缩放）
- 全图 9.3e6 像素，目标 <30ms/帧；若低配卡顿，降级 internal 2160×1080 显示源（meta 标明）

---

## 11. 响应式

| 断点 | 布局 |
|---|---|
| ≥1280 | 完整：右 stats + 底 dock + 小地图 |
| 900–1279 | stats 抽屉；小地图可关 |
| 600–899 | 预设横滑；直方图区（若有）折叠 |
| <600 | 地图全屏 + 底部 sheet 控件；悬停改长按 |

---

## 12. 无障碍

- 滑杆 `role="slider"` + `aria-valuemin/max/now/valuetext`（中文：「海平面正2.3米」）
- 所有按钮可 Tab；`:focus-visible` 用 `--focus-ring`
- 对比度：正文 ≥4.5:1
- `prefers-reduced-motion`
- 色盲模式开关

---

## 13. P0 / P1 / 不做

### P0（第一版必须）

1. 加载 elev.bin + 自检  
2. Canvas 全球着色（海/陆/金色新生/新淹没）  
3. 海平面滑杆 −150~+80，0.1 m  
4. 六预设 + 解说 + 冰盖拆分开关  
5. 维度加权陆地面积 + Δ  
6. 幽灵岸线  
7. 缩放平移小地图区域书签  
8. 悬停 HUD  
9. 深色/纸色主题  
10. 脚注与错误态  
11. README 部署说明  

### P1（第二迭代，另开任务）

- 海拔直方图 + 海平面竖线  
- Delta 相对现代叠加层  
- 分屏擦除对比  
- URL 状态 `?sl=&z=&x=&y=`  
- 导出 PNG（含色标与元数据）  
- 时间轴播放  
- 剖面工具  
- 色盲模式完善  

### 明确不做

- ±1000 m、5 m 最小步进、墨卡托默认、3D、建筑淹没、后端、WebGPU、外网字体 CDN  

---

## 14. 验收清单（Definition of Done）

- [ ] `conda env list` 含 `mainland-slr`；`python -c "import numpy,PIL"` 通过  
- [ ] `data/elev.bin` 尺寸精确 18,662,400 字节  
- [ ] meta.json 完整；SL=0 加权陆地 ∈ [27%,32%]  
- [ ] HTTP 打开无控制台错误  
- [ ] 滑杆 0.1 m 可键盘/鼠标操作  
- [ ] LGM / 0 / +60 三个情景目视符合预期地理故事  
- [ ] 缩放 1×–12×、小地图、区域书签可用  
- [ ] 主题切换可读  
- [ ] 脚注含 DOI 与局限  
- [ ] 相对路径，可丢到任意静态服务器  

---

## 15. 变更日志

| 日期 | 变更 |
|---|---|
| 初版 | 方案提出 |
| 终审后 | 纬度加权面积；HTTP 验收；conda；静态部署 |
| 锁版 | **取消 ±1000；取消 5 m 最小刻度；范围 −150~+80；步进 0.1 m；conda `mainland-slr`** |
