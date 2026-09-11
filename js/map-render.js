import { landRamp, seaRamp, goldRamp, FLOOD_RGB, CB } from "./color-ramps.js";

/**
 * Full-resolution color map renderer.
 * Writes ImageData for the DEM grid; caller scales via canvas.
 */
export class MapRenderer {
  constructor(elev, width, height) {
    this.elev = elev;
    this.w = width;
    this.h = height;
    this.off = document.createElement("canvas");
    this.off.width = width;
    this.off.height = height;
    this.ctx = this.off.getContext("2d", { willReadFrequently: true });
    this.image = this.ctx.createImageData(width, height);
    this.ghost = this.buildGhostCoast();
  }

  /** Precompute modern coastline (elev crosses 0) as a mask. */
  buildGhostCoast() {
    const { elev, w, h } = this;
    const mask = new Uint8Array(w * h);
    for (let j = 1; j < h - 1; j++) {
      const r = j * w;
      for (let i = 1; i < w - 1; i++) {
        const e = elev[r + i];
        const land = e >= 0;
        if (
          (elev[r + i + 1] >= 0) !== land ||
          (elev[r + i - 1] >= 0) !== land ||
          (elev[r + w + i] >= 0) !== land ||
          (elev[r - w + i] >= 0) !== land
        ) {
          mask[r + i] = 1;
        }
      }
    }
    return mask;
  }

  render(seaLevel, opts = {}) {
    const {
      colorblind = false,
      showGhost = true,
      ghostAlpha = 0.35,
      theme = "atlas",
    } = opts;
    const { elev, w, h, image, ghost } = this;
    const data = image.data;
    const sl = seaLevel;
    const landFn = colorblind ? CB.land : landRamp;
    const seaFn = colorblind ? CB.sea : seaRamp;
    const flood = colorblind ? CB.flood : FLOOD_RGB;
    const rgb = [0, 0, 0];

    for (let p = 0, n = w * h; p < n; p++) {
      const e = elev[p];
      let r, g, b;
      if (e < sl) {
        const depth = sl - e;
        if (sl > 0 && e >= 0) {
          r = flood[0];
          g = flood[1];
          b = flood[2];
        } else {
          seaFn(depth, rgb);
          r = rgb[0];
          g = rgb[1];
          b = rgb[2];
        }
      } else if (sl < 0 && e < 0) {
        goldRamp(e, rgb);
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
      } else {
        landFn(e, rgb);
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
      }
      const o = p * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }

    if (showGhost) {
      // light theme: darken; dark theme: lighten
      const lighten = theme !== "atlas";
      const a = Math.round(255 * ghostAlpha);
      for (let p = 0, n = w * h; p < n; p++) {
        if (!ghost[p]) continue;
        const o = p * 4;
        if (lighten) {
          data[o] = Math.min(255, data[o] + a);
          data[o + 1] = Math.min(255, data[o + 1] + a);
          data[o + 2] = Math.min(255, data[o + 2] + a);
        } else {
          data[o] = Math.max(0, data[o] - a);
          data[o + 1] = Math.max(0, data[o + 1] - a);
          data[o + 2] = Math.max(0, data[o + 2] - a);
        }
      }
    }

    this.ctx.putImageData(image, 0, 0);
    return this.off;
  }

  /** Draw offscreen DEM onto a view canvas with zoom/pan + lon wrap. */
  drawTo(view, zoom, cx, cy, smooth, bg = "#0B1220") {
    const ctx = view.getContext("2d");
    const vw = view.width;
    const vh = view.height;
    ctx.imageSmoothingEnabled = smooth;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, vw, vh);
    const baseScale = vh / this.h;
    const s = baseScale * zoom;
    const dw = this.w * s;
    const dh = this.h * s;
    // wrap cx into [0, w)
    const wx = ((cx % this.w) + this.w) % this.w;
    const dx = vw / 2 - wx * s;
    const dy = vh / 2 - cy * s;
    // draw copies so horizontal wrap has no black gap
    ctx.drawImage(this.off, dx, dy, dw, dh);
    if (dx > 0) ctx.drawImage(this.off, dx - dw, dy, dw, dh);
    if (dx + dw < vw) ctx.drawImage(this.off, dx + dw, dy, dw, dh);
    // edge fade into void (soft, not hard black)
    const gradL = ctx.createLinearGradient(0, 0, Math.min(80, vw * 0.06), 0);
    gradL.addColorStop(0, bg);
    gradL.addColorStop(1, "rgba(0,0,0,0)");
    // only if world doesn't fully cover — at high zoom cover always true
    return { s, dx, dy, dw, dh, wx };
  }
}
