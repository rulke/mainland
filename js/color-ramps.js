/* Color ramps — DESIGN.md §5.4–5.6 */

export const LAND_STOPS = [
  [0, 61, 143, 92],
  [200, 107, 154, 74],
  [500, 160, 160, 90],
  [1000, 196, 163, 90],
  [2000, 166, 124, 61],
  [3000, 122, 85, 48],
  [4000, 201, 187, 168],
  [5000, 242, 237, 228],
  [9000, 255, 255, 255],
];

export const SEA_STOPS = [
  [0, 90, 208, 224],
  [50, 43, 184, 212],
  [200, 18, 135, 168],
  [1000, 14, 77, 110],
  [2000, 12, 42, 74],
  [4000, 8, 20, 40],
  [6000, 4, 8, 16],
  [11000, 2, 4, 8],
];

/** Newly emerged shelf when SL < 0: elev in [SL, 0) */
export const GOLD_STOPS = [
  [0, 240, 208, 120],
  [-40, 232, 184, 74],
  [-150, 196, 146, 46],
];

/** Newly flooded land when SL > 0: elev in [0, SL) */
export const FLOOD_RGB = [91, 143, 168];

function makeRamp(stops) {
  // stops: [v, r, g, b] sorted by v ascending
  const vs = stops.map((s) => s[0]);
  const rs = stops.map((s) => s[1]);
  const gs = stops.map((s) => s[2]);
  const bs = stops.map((s) => s[3]);
  return function ramp(v, out) {
    let i = 0;
    const n = vs.length;
    while (i < n - 1 && v > vs[i + 1]) i++;
    if (v <= vs[0]) {
      out[0] = rs[0];
      out[1] = gs[0];
      out[2] = bs[0];
      return;
    }
    if (v >= vs[n - 1]) {
      out[0] = rs[n - 1];
      out[1] = gs[n - 1];
      out[2] = bs[n - 1];
      return;
    }
    const t = (v - vs[i]) / (vs[i + 1] - vs[i] || 1);
    out[0] = (rs[i] + (rs[i + 1] - rs[i]) * t) | 0;
    out[1] = (gs[i] + (gs[i + 1] - gs[i]) * t) | 0;
    out[2] = (bs[i] + (bs[i + 1] - bs[i]) * t) | 0;
  };
}

export const landRamp = makeRamp(LAND_STOPS);
export const seaRamp = makeRamp(SEA_STOPS);
export const goldRamp = makeRamp(GOLD_STOPS);

/** Color-blind-safe overrides */
export const CB = {
  land: makeRamp([
    [0, 0, 128, 128],
    [200, 64, 144, 96],
    [500, 140, 140, 80],
    [1000, 180, 150, 70],
    [2000, 150, 110, 50],
    [3000, 100, 70, 40],
    [4000, 180, 170, 150],
    [5000, 240, 235, 225],
    [9000, 255, 255, 255],
  ]),
  sea: makeRamp([
    [0, 130, 177, 255],
    [50, 80, 120, 230],
    [200, 40, 70, 180],
    [1000, 26, 35, 126],
    [2000, 20, 20, 90],
    [4000, 12, 10, 50],
    [6000, 6, 4, 24],
    [11000, 2, 2, 10],
  ]),
  flood: [206, 147, 216],
};
