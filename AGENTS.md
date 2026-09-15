# Mainland — 海陆变迁

## 项目是什么

纯静态前端 + 本地数据预处理脚本。产品名 **海陆变迁**。用户拖动海平面（米），世界地图陆地/海洋边界实时变化，用科学色带呈现海拔与水深，并可叠加国家界线、世界城市、中国行政区与大陆名。

**不做**：后端服务、3D 地球、建筑级淹没、±1000 m 假想海平面、5 m 最小步进。

## 路径约定

```
E:\person\ai\claude\Mainland\
├── AGENTS.md              # 本文件（项目规则）
├── DESIGN.md              # 锁版设计规格（唯一真源）
├── README.md              # 部署与验收
├── index.html
├── css/main.css
├── js/
│   ├── main.js
│   ├── map-render.js
│   ├── color-ramps.js
│   ├── ui.js
│   └── geo-utils.js
├── data/                  # 生成物，可提交或由脚本重建
│   ├── elev.bin
│   ├── elev.bin.gz
│   ├── meta.json
│   ├── annotations.json
│   ├── elev-preview.png
│   └── elev-min.png
├── scripts/
│   ├── download_etopo.py
│   └── process_etopo.py
└── dist/                  # 部署包（可选，直接传项目根静态文件也可）
```

- 前端资源一律**相对路径**（`./data/elev.bin`），禁止盘符绝对路径。
- 大原始 DEM（GeoTIFF 等）放 `raw/`，**不提交 git**；`data/` 下生成物可重建。

## 运行环境

| 用途 | 环境 |
|---|---|
| 数据预处理 | 环境名 **`mainland-slr`**（Python 3.12 + numpy + pillow + requests） |
| 前端 | 零构建、零 npm、零 CDN 字体；浏览器直接跑 |

本机落地：conda 官方/清华源 SSL 失败，已在 miniconda `envs/mainland-slr` 用缓存 Python 3.12.13 建等价 venv 并装好依赖。网络正常时用 `conda env create -f environment.yml` 可重建正规 conda 包环境。

```powershell
# 解释器
$envPy = "$env:USERPROFILE\AppData\Local\miniconda3\envs\mainland-slr\Scripts\python.exe"
& $envPy -c "import numpy, PIL; print('ok')"

# 本地验收（必须 HTTP，不要 file://）
& $envPy scripts/serve.py 8080
# 打开 http://127.0.0.1:8080/
# 不要用 python -m http.server：Windows 上可能把 .js 标成 text/plain，模块加载失败
```

**禁止：**
- 未询问就向系统 Python / MIMO_PYTHON / 全局环境 `pip install`
- `pip install --prefix` 指向 MIMO_PYTHON（会误卸载其预装包）

依赖只进 `mainland-slr`。

## 技术约束（锁死）

1. 投影：等距圆柱（Equirectangular），不用墨卡托。
2. 海平面范围：科学档 **−150.0 ~ +80.0 m**，最小步进 **0.1 m**；可选实验档 **±8000 m**（步进自适应）。
3. 显示 1 位小数；负号用 `−`（U+2212）。
4. 高程数据：ETOPO 2022 **Bedrock**（不是 Ice Surface）。
5. 交付栅格：**4320 × 2160**，Int16 小端，单位米。
6. 陆地面积：纬度加权 `w = cos(lat)`，文案写「纬度加权」。
7. 主题：**浅色默认**；深色可切换。
8. 签名视觉：海退时大陆架「金色新生陆地」。
9. 部署：纯静态；GitHub Pages：`https://rulke.github.io/mainland/`（`main` / root）。
10. 本地验收用 `scripts/serve.py`，不要 `python -m http.server`。

细节以 `DESIGN.md` 为准；两文件冲突时 **改 DESIGN.md 先，再改代码**。

## 验证清单（改完必须跑）

- [ ] `scripts/serve.py 8080` 打开页面无控制台报错
- [ ] 滑杆可拖到 −130 / 0 / +60，读数步进 0.1 m
- [ ] 滑杆悬停滚轮：科学档 ±1 m
- [ ] 冰盖全勾后取消全部 → 海平面回到 +0.0 m
- [ ] 点击 LGM 钉侧栏出现白令/巽他等注记
- [ ] 缩放 5–10× 仅省会地级名；≥10× 视口内地级全量
- [ ] 图层「自然地名」可在 1×+ 看到太平洋等大洋名
- [ ] SL=0 纬度加权陆地面积 ∈ **[27%, 32%]**（目标约 29%）
- [ ] SL=−130：白令/巽他/陆架金色可见
- [ ] SL=+60：华北平原、恒河三角洲等大片被淹；格陵兰基岩大部成海
- [ ] 缩放到 8×+ 不脚本错误；小地图视口框正确
- [ ] 深色/纸色切换后文字对比仍可读
- [ ] `data/elev.bin` 能被 `fetch`；失败时有明确错误文案

## 数据与科学诚实

- 模型是一阶近似：固定固体表面 + 水平面切割；无 GIA、无冰盖压载、无沉积。
- +60 m 是冰盖全融**平衡态展示**，不是某一年预测。
- Bedrock 语义：地图上的「冰盖区陆地」是基岩，不是冰体本身。
- 页面脚注必须出现数据源 DOI 与上述局限。

## Git / 协作

- 不提交 `raw/` 原始多 GB DEM。
- 不提交密钥。
- 大改先改 `DESIGN.md` 再动代码。
- 未要求时不 commit。

## 文案

- 界面：简体中文；专名保留英文（IPCC AR6、SSP5-8.5、WAIS、ETOPO）。
- 语气：短句、主动态、局限直说。
