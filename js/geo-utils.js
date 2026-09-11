/** Geo helpers — equirectangular, lat-weighted area */

export function lonLatToPx(lon, lat, width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

export function pxToLonLat(x, y, width, height) {
  const lon = (x / width) * 360 - 180;
  const lat = 90 - (y / height) * 180;
  return { lon, lat };
}

export function sampleElev(elev, width, height, lon, lat) {
  const { x, y } = lonLatToPx(lon, lat, width, height);
  const ix = Math.min(width - 1, Math.max(0, Math.floor(x)));
  const iy = Math.min(height - 1, Math.max(0, Math.floor(y)));
  return elev[iy * width + ix];
}

/**
 * Latitude-weighted land fraction percent.
 * Precomputes row weights once for fixed grid.
 */
export function makeLandFraction(elev, width, height) {
  const rowW = new Float64Array(height);
  let wSum = 0;
  for (let j = 0; j < height; j++) {
    const lat = 90 - ((j + 0.5) / height) * 180;
    const w = Math.cos((lat * Math.PI) / 180);
    rowW[j] = w;
    wSum += w * width;
  }
  return function landPct(seaLevel) {
    let sum = 0;
    for (let j = 0; j < height; j++) {
      const base = j * width;
      const w = rowW[j];
      for (let i = 0; i < width; i++) {
        if (elev[base + i] >= seaLevel) sum += w;
      }
    }
    return (sum / wSum) * 100;
  };
}

export function formatSeaLevel(sl, experimental = false) {
  const sign = sl > 0 ? "+" : sl < 0 ? "−" : "+";
  const abs = Math.abs(sl);
  const digits = experimental && abs >= 10 ? 0 : 1;
  return `${sign}${abs.toFixed(digits)} m`;
}

export function seaLevelNote(sl) {
  if (Math.abs(sl) < 0.05) return "现代基准";
  if (sl >= -20 && sl < -0.05) return "间冰期—冰消波动区";
  if (sl <= -100) return "末次冰盛期量级";
  if (sl > 0 && sl <= 1.6) return "IPCC AR6 2100 相关量级";
  if (sl > 2 && sl <= 15) return "格陵兰尺度冰融";
  if (sl > 40) return "冰盖全融平衡态（非时间预测）";
  return "";
}
