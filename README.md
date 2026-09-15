# 海陆变迁

**交互式全球海平面—大陆形态可视化**

基于 NOAA **ETOPO 2022 Bedrock** 全球高程数据，以一阶近似模型实时呈现：海平面升降时，陆地与海洋边界如何变化。海退时大陆架以金色标出「新生陆地」，海升时原低地以灰青色标出「新淹没」。

---

## 在线访问

**GitHub Pages：** [https://rulke.github.io/mainland/](https://rulke.github.io/mainland/)


---

## 功能概览

| 模块 | 说明 |
|---|---|
| 海平面 | 科学档 **−150 ～ +80 m**，步进 **0.1 m**；实验档 **±8000 m**（步进自适应 10→500 m） |
| 设色 | 海图式水深色带 + hypsometric 陆地；签名层「金色新生陆地」 |
| 情景 | 末次冰盛期 / 冰消中期 / 现代 / AR6 高排放 2100 / 高端 +2 m / 冰盖全融 +60 m |
| 冰盖 | 格陵兰、WAIS、EAIS、山地冰川勾选合计；**全部取消回到 +0.0 m** |
| 图层 | 国家界线、国家名、世界城市、中国地级行政区（333）、大陆名、自然地名、现代岸线 |
| 地图 | 等距圆柱；缩放 **1×–18×**；经度无限环绕；纬度零过冲钳制 |
| 统计 | 维度加权陆地面积 % 与相对现代变化 |
| 注记 | 白令陆桥、巽他古陆、多格兰等随海平面条件显隐 |
| 主题 | **浅色默认** / 深色切换 |

---

## 操作

| 操作 | 说明 |
|---|---|
| 海平面滑杆 | 步进 0.1 m；悬停**滚轮** ±1 m（Shift 5 m，Ctrl 0.1 m） |
| 实验范围 | 勾选后滑杆变为 ±8000 m |
| 地图 | 滚轮缩放、拖拽平移；双击放大，Shift+双击缩小 |
| 图层 | 顶栏「图层」开关 |
| 情景钉 / 预设 | 滑杆下彩色圆点或底部按钮 |
| 快捷键 | `←` `→` 0.1 m；`Shift` 1 m；`0` 现代；`1`–`6` 预设；`Home`/`End` 两端 |
| 帮助 | 顶栏 **「关于与指南」**（产品介绍、操作、快捷键、数据来源） |

中国地级名显示规则：缩放 **&lt;5×** 不标名；**5×–10×** 仅省会/首府；**≥10×** 视口内地级行政区全量。

---

## 技术架构

- **纯静态**：HTML + CSS + 原生 ES Module，无构建、无 npm、无后端
- **高程栅格**：`data/elev.bin` — 4320×2160，Int16 小端，约 1 角分（~2 km）
- **渲染**：Canvas 2D；Color LUT；叠加矢量 GeoJSON（国界/城市/行政区）
- **环境**：本地预处理使用 conda 环境 `mainland-slr`（Python 3.12 + numpy + Pillow）

---

## 本地运行

需通过 **HTTP** 访问（不要用 `file://` 打开）。

```powershell
# 解释器（本机 conda 环境；亦可 python3 + numpy/Pillow）
$envPy = "$env:USERPROFILE\AppData\Local\miniconda3\envs\mainland-slr\Scripts\python.exe"

# 启动（会正确返回 application/javascript）
& $envPy scripts/serve.py 8080

# 浏览器打开
# http://127.0.0.1:8080/
```

请使用 `scripts/serve.py`。在 Windows 上直接 `python -m http.server` 可能把 `.js` 标成 `text/plain`，导致 ES Module 无法加载。

---

## 数据重建（可选）

修改 DEM 或分辨率时：

```powershell
conda activate mainland-slr
python scripts/download_etopo.py      # → raw/（不入库）
python scripts/process_etopo.py       # → data/elev.bin 等
python scripts/download_china_cities.py  # 中国地级行政区 GeoJSON
```

---

## 数据来源与科学局限

| 来源 | 用途 |
|---|---|
| [ETOPO 2022 Bedrock](https://www.ncei.noaa.gov/products/etopo-global-relief-model)（NOAA NCEI, [DOI: 10.25921/fd45-gt74](https://doi.org/10.25921/fd45-gt74)） | 全球高程/水深 |
| Natural Earth | 国家界线、世界主要城市 |
| 公开行政区划边界 | 中国地级行政区（地级市/自治州/地区/盟；直辖市与港澳台为省级轮廓） |
| 内置常用名 | 大洋、边缘海、主要山脉、大湖、主要山峰（非官方全量库） |

**模型局限（页面「关于与指南」亦有说明）：**

1. 一阶近似：固定固体表面 + 水平面切割；无地壳均衡回弹（GIA）、无冰盖压载、无沉积。
2. **+60 m** 为冰盖全融**平衡态展示**，不是某一年的时间预测。
3. 地图上的格陵兰/南极为 **Bedrock 基岩**，不是冰体本身。
4. 近岸城市尺度淹没需沿海高分辨率 DEM；本工具服务**大陆尺度**。
5. **实验档 ±8000 m** 仅供形态探索，地球无对应自然海平面情景。

---

## 仓库结构

```
mainland/
├── index.html          # 入口
├── css/main.css
├── js/                 # 模块：渲染、图层、UI、主逻辑
├── data/               # elev.bin、geo GeoJSON、meta、预览图
├── scripts/            # 下载/预处理/本地 HTTP
├── AGENTS.md           # 工程约定
└── DESIGN.md           # 设计与交互规格（真源）
```

---



