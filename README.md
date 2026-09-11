# 海陆变迁

拖动海平面（−150 ~ +80 m），实时查看全球陆地/海洋边界变化。可叠加国家界线、世界城市、中国行政区与大陆名。数据源：ETOPO 2022 Bedrock。

## 本地运行（必须 HTTP）

```powershell
$envPy = "$env:USERPROFILE\AppData\Local\miniconda3\envs\mainland-slr\Scripts\python.exe"
& $envPy scripts/serve.py 8080
# 浏览器打开 http://127.0.0.1:8080/
```

请用 `scripts/serve.py`（正确声明 `application/javascript`）。Windows 上 `python -m http.server` 可能把 `.js` 标成 `text/plain`，导致 ES Module 无法加载。

## 服务器部署

上传 `index.html`、`css/`、`js/`、`data/` 即可。纯静态，无后端。

Nginx 示例见 `DESIGN.md` §9。要点：

- 相对路径
- `elev.bin` / 静态资源长缓存
- 可选 `gzip_static`（已有 `elev.bin.gz`）

## 数据重建

```powershell
conda activate mainland-slr   # 或上述 env 路径
python scripts/download_etopo.py
python scripts/process_etopo.py
```

## 操作

| 操作 | 说明 |
|---|---|
| 滑杆 | 海平面，步进 0.1 m |
| 滚轮 / 拖拽 | 缩放 / 平移 |
| 1–6 | 预设情景 |
| ← → | ±0.1 m；Shift ±1 m |
| 0 | 回到现代 |
| 右侧 | 陆地面积、冰盖开关、注记 |

## 科学局限

一阶近似：固定固体表面 + 海平面切割。无 GIA、无冰盖压载。+60 m 为平衡态展示，非时间预测。
