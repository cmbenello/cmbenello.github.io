"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type FluidWaveBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  lineColor?: string;
  paused?: boolean;
  /** simulated water particles (background default is conservative) */
  particleCount?: number;
  /** sim seconds per real second — lower = dreamier slow motion */
  timeScale?: number;
  /** additive glow blending; set false on light backgrounds */
  additive?: boolean;
};

/* ── constants ─────────────────────────────────────────────────── */
/*
  A real 2D fluid simulation (Clavet et al. 2005 double-density-relaxation
  SPH). Invisible wave paddles beyond both screen edges drive opposing wave
  trains that collide mid-screen; crashes, curls and spray emerge from the
  physics. Rendered as polylines along each particle's recent trajectory —
  teamLab-style "lines traced by the water itself".
*/

const MAX_DPR = 1.5;
const BASE_SEED = 20260717;
const DEPTH = 0.48; // water depth, fraction of height
const K_PRESSURE = 2400;
const K_NEAR = 9500;
const VISC_SIGMA = 0.44; // coherent, sheet-like flow
const VISC_BETA = 0.01;
const V_MAX = 1100;
const TRAIL_POINTS = 26;
const SUBSTEPS = 2;
const MIST_CAP = 1400;
const PREWARM_S = 5; // sim-seconds stepped before first paint
const RESIZE_PREWARM_S = 4;

/* ── component ─────────────────────────────────────────────────── */

export default function FluidWaveBackground({
  frameMargin = 0,
  opacity = 1,
  lineColor = "rgba(255, 255, 255, 0.85)",
  paused = false,
  particleCount = 2600,
  timeScale = 0.2,
  additive = true,
}: FluidWaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    /* seeded PRNG (mulberry32) */
    let seed = BASE_SEED;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    /* line colour → rgb for the brightness ramp */
    const colorMatch = lineColor.match(
      /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/
    );
    const cr = colorMatch ? Number(colorMatch[1]) : 255;
    const cg = colorMatch ? Number(colorMatch[2]) : 255;
    const cb = colorMatch ? Number(colorMatch[3]) : 255;
    const tint = (a: number) => `rgba(${cr},${cg},${cb},${a.toFixed(3)})`;

    /* ── sim state ── */
    let W = 2;
    let H = 2;
    let dpr = 1;
    let N = 0;
    let h = 1;
    let h2 = 1;
    let s0 = 1;
    let rho0 = 10;
    let floorY = 1;
    let EXT = 0;
    let GOFF = 2;
    let G = 600;
    let px!: Float32Array, py!: Float32Array;
    let ppx!: Float32Array, ppy!: Float32Array;
    let vx!: Float32Array, vy!: Float32Array;
    let rho!: Float32Array, rhoN!: Float32Array;
    let nb!: Int16Array;
    let gx = 1, gy = 1, cells = 1;
    let cellStart!: Int32Array, cellEntries!: Int32Array;
    let cellOf!: Int32Array, cellCnt!: Int32Array;
    let trail!: Float32Array;
    let trailRec = 0;
    let simT = 0;
    let substeps = SUBSTEPS;

    const pad = {
      eL: 0, eR: 0, wL: 2.4, wR: 2.9,
      ph2L: 0, ph2R: 0, phL: 0, phR: 0,
      surgeT: 4.5, surgeSide: 0, surgeDur: 0, nextSurge: 2.5,
      xL: 0, xR: 0, vL: 0, vR: 0,
    };

    /* mist droplets shed by airborne water */
    const mX = new Float32Array(MIST_CAP);
    const mY = new Float32Array(MIST_CAP);
    const mVX = new Float32Array(MIST_CAP);
    const mVY = new Float32Array(MIST_CAP);
    const mAge = new Float32Array(MIST_CAP);
    const mLife = new Float32Array(MIST_CAP);
    const mOn = new Uint8Array(MIST_CAP);
    let mHead = 0;

    const build = () => {
      dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      W = Math.max(320, Math.round(rect.width) || 320);
      H = Math.max(240, Math.round(rect.height) || 240);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      seed = BASE_SEED;
      pad.eL = rnd() * 6.28;
      pad.eR = rnd() * 6.28;
      pad.ph2L = rnd() * 6.28;
      pad.ph2R = rnd() * 6.28;
      pad.phL = rnd() * 6.28;
      pad.phR = rnd() * 6.28;
      pad.surgeT = 4.5;
      pad.surgeDur = 0;
      pad.nextSurge = 2.5;

      G = 1.5 * H;
      floorY = 0.985 * H;
      EXT = 0.18 * W; // tank extends offscreen: wall slosh stays out of view
      const depthPx = DEPTH * H;
      const area = (W + 2 * EXT) * depthPx;
      s0 = Math.sqrt(area / particleCount);
      h = 2.0 * s0;
      h2 = h * h;
      GOFF = Math.ceil(EXT / h) + 2;

      const cols = Math.floor((W + 2 * EXT) / s0);
      const rows = Math.floor(depthPx / s0);
      N = cols * rows;
      px = new Float32Array(N); py = new Float32Array(N);
      ppx = new Float32Array(N); ppy = new Float32Array(N);
      vx = new Float32Array(N); vy = new Float32Array(N);
      rho = new Float32Array(N); rhoN = new Float32Array(N);
      nb = new Int16Array(N);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          px[i] = -EXT + (c + 0.5) * s0 + (rnd() - 0.5) * s0 * 0.3 + (r % 2) * s0 * 0.5;
          py[i] = floorY - (r + 0.5) * s0 + (rnd() - 0.5) * s0 * 0.3;
          ppx[i] = px[i]; ppy[i] = py[i];
          i++;
        }
      }
      N = i;

      gx = Math.ceil(W / h) + 2 * GOFF;
      gy = Math.ceil(H / h) + 4;
      cells = gx * gy;
      cellStart = new Int32Array(cells + 1);
      cellEntries = new Int32Array(N);
      cellOf = new Int32Array(N);
      cellCnt = new Int32Array(cells);

      trail = new Float32Array(N * TRAIL_POINTS * 2);
      for (i = 0; i < N; i++) {
        for (let tp = 0; tp < TRAIL_POINTS; tp++) {
          trail[(i * TRAIL_POINTS + tp) * 2] = px[i];
          trail[(i * TRAIL_POINTS + tp) * 2 + 1] = py[i];
        }
      }
      trailRec = 0;
      mOn.fill(0);

      /* calibrate rest density from the settled lattice */
      buildGrid();
      computeDensity();
      let sum = 0, cnt = 0;
      for (i = 0; i < N; i++) {
        if (nb[i] >= 12) { sum += rho[i]; cnt++; }
      }
      rho0 = cnt > 0 ? sum / cnt : 10;
    };

    const cellIndex = (x: number, y: number) => {
      let cx = (x / h + GOFF) | 0;
      let cy = (y / h + 2) | 0;
      if (cx < 0) cx = 0; if (cx >= gx) cx = gx - 1;
      if (cy < 0) cy = 0; if (cy >= gy) cy = gy - 1;
      return cy * gx + cx;
    };

    function buildGrid() {
      cellCnt.fill(0);
      for (let i = 0; i < N; i++) {
        const ci = cellIndex(px[i], py[i]);
        cellOf[i] = ci;
        cellCnt[ci]++;
      }
      let acc = 0;
      for (let i = 0; i < cells; i++) { cellStart[i] = acc; acc += cellCnt[i]; }
      cellStart[cells] = acc;
      cellCnt.fill(0);
      for (let i = 0; i < N; i++) {
        const c2 = cellOf[i];
        cellEntries[cellStart[c2] + cellCnt[c2]] = i;
        cellCnt[c2]++;
      }
    }

    function viscosity(sdt: number) {
      for (let i = 0; i < N; i++) {
        const xi = px[i], yi = py[i];
        const cxi = (xi / h + GOFF) | 0, cyi = (yi / h + 2) | 0;
        for (let oy = -1; oy <= 1; oy++) {
          const cy2 = cyi + oy;
          if (cy2 < 0 || cy2 >= gy) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const cx2 = cxi + ox;
            if (cx2 < 0 || cx2 >= gx) continue;
            const cid = cy2 * gx + cx2;
            const st = cellStart[cid], en = cellStart[cid + 1];
            for (let e = st; e < en; e++) {
              const j = cellEntries[e];
              if (j <= i) continue;
              const dx = px[j] - xi, dy = py[j] - yi;
              const r2 = dx * dx + dy * dy;
              if (r2 >= h2 || r2 < 1e-9) continue;
              const r = Math.sqrt(r2), q = 1 - r / h;
              const ux = dx / r, uy = dy / r;
              const u = (vx[i] - vx[j]) * ux + (vy[i] - vy[j]) * uy;
              if (u > 0) {
                let I = sdt * q * (VISC_SIGMA * u + VISC_BETA * u * u);
                if (I > u * 0.5) I = u * 0.5;
                const Ix = I * ux, Iy = I * uy;
                vx[i] -= Ix; vy[i] -= Iy;
                vx[j] += Ix; vy[j] += Iy;
              }
            }
          }
        }
      }
    }

    function computeDensity() {
      for (let i = 0; i < N; i++) { rho[i] = 0; rhoN[i] = 0; nb[i] = 0; }
      for (let i = 0; i < N; i++) {
        const xi = px[i], yi = py[i];
        const cxi = (xi / h + GOFF) | 0, cyi = (yi / h + 2) | 0;
        for (let oy = -1; oy <= 1; oy++) {
          const cy2 = cyi + oy;
          if (cy2 < 0 || cy2 >= gy) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const cx2 = cxi + ox;
            if (cx2 < 0 || cx2 >= gx) continue;
            const cid = cy2 * gx + cx2;
            const st = cellStart[cid], en = cellStart[cid + 1];
            for (let e = st; e < en; e++) {
              const j = cellEntries[e];
              if (j <= i) continue;
              const dx = px[j] - xi, dy = py[j] - yi;
              const r2 = dx * dx + dy * dy;
              if (r2 >= h2 || r2 < 1e-9) continue;
              const q = 1 - Math.sqrt(r2) / h;
              const q2 = q * q, q3 = q2 * q;
              rho[i] += q2; rho[j] += q2;
              rhoN[i] += q3; rhoN[j] += q3;
              nb[i]++; nb[j]++;
            }
          }
        }
      }
    }

    function relax(sdt: number) {
      const sdt2 = sdt * sdt;
      for (let i = 0; i < N; i++) {
        const Pi = K_PRESSURE * (rho[i] - rho0), PNi = K_NEAR * rhoN[i];
        const xi = px[i], yi = py[i];
        let accX = 0, accY = 0;
        const cxi = (xi / h + GOFF) | 0, cyi = (yi / h + 2) | 0;
        for (let oy = -1; oy <= 1; oy++) {
          const cy2 = cyi + oy;
          if (cy2 < 0 || cy2 >= gy) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const cx2 = cxi + ox;
            if (cx2 < 0 || cx2 >= gx) continue;
            const cid = cy2 * gx + cx2;
            const st = cellStart[cid], en = cellStart[cid + 1];
            for (let e = st; e < en; e++) {
              const j = cellEntries[e];
              if (j <= i) continue;
              const dx = px[j] - xi, dy = py[j] - yi;
              const r2 = dx * dx + dy * dy;
              if (r2 >= h2 || r2 < 1e-9) continue;
              const r = Math.sqrt(r2), q = 1 - r / h;
              const Pj = K_PRESSURE * (rho[j] - rho0), PNj = K_NEAR * rhoN[j];
              const D = sdt2 * ((Pi + Pj) * q + (PNi + PNj) * q * q) * 0.25;
              const ux = dx / r, uy = dy / r;
              const Dx = D * ux, Dy = D * uy;
              px[j] += Dx; py[j] += Dy;
              accX -= Dx; accY -= Dy;
            }
          }
        }
        px[i] += accX; py[i] += accY;
      }
    }

    function paddles(t: number) {
      const AL = W * (0.048 + 0.028 * (0.5 + 0.5 * Math.sin(0.11 * t + pad.eL)));
      const AR = W * (0.045 + 0.028 * (0.5 + 0.5 * Math.sin(0.13 * t + pad.eR)));
      if (t > pad.nextSurge) {
        pad.surgeT = t;
        pad.surgeDur = 1.4 + rnd() * 0.8;
        pad.surgeSide = rnd() < 0.35 ? 2 : rnd() < 0.5 ? 0 : 1;
        pad.nextSurge = t + 6.0 + rnd() * 3.0;
      }
      const su = (t - pad.surgeT) / pad.surgeDur;
      const boost = su >= 0 && su < 1 ? 1 + 1.7 * Math.sin(Math.PI * su) : 1;
      let aL = AL, aR = AR;
      if (pad.surgeSide === 0 || pad.surgeSide === 2) aL *= boost;
      if (pad.surgeSide === 1 || pad.surgeSide === 2) aR *= boost;

      /* primary stroke + a shorter second harmonic -> wave groups */
      const w2L = pad.wL * 2.3, w2R = pad.wR * 2.3;
      const oL = aL * (0.5 - 0.5 * Math.cos(pad.wL * t + pad.phL)) +
        0.25 * aL * (0.5 - 0.5 * Math.cos(w2L * t + pad.ph2L));
      const oR = aR * (0.5 - 0.5 * Math.cos(pad.wR * t + pad.phR)) +
        0.25 * aR * (0.5 - 0.5 * Math.cos(w2R * t + pad.ph2R));
      const voL = aL * 0.5 * pad.wL * Math.sin(pad.wL * t + pad.phL) +
        0.25 * aL * 0.5 * w2L * Math.sin(w2L * t + pad.ph2L);
      const voR = aR * 0.5 * pad.wR * Math.sin(pad.wR * t + pad.phR) +
        0.25 * aR * 0.5 * w2R * Math.sin(w2R * t + pad.ph2R);
      pad.xL = -EXT + oL; pad.vL = voL;
      pad.xR = W + EXT - oR; pad.vR = -voR;
    }

    function boundaries() {
      for (let i = 0; i < N; i++) {
        if (py[i] > floorY) {
          py[i] = floorY;
          if (ppy[i] > floorY) ppy[i] = floorY;
        }
        if (px[i] < pad.xL) {
          px[i] = pad.xL + 0.01;
          const vpx = px[i] - ppx[i];
          if (vpx < pad.vL / 60) ppx[i] = px[i] - pad.vL / 60;
        }
        if (px[i] > pad.xR) {
          px[i] = pad.xR - 0.01;
          const vpx2 = px[i] - ppx[i];
          if (vpx2 > pad.vR / 60) ppx[i] = px[i] - pad.vR / 60;
        }
        if (py[i] < -H * 0.5) py[i] = -H * 0.5;
      }
    }

    const spawnMist = (x: number, y: number, vx0: number, vy0: number) => {
      const m = mHead;
      mHead = (mHead + 1) % MIST_CAP;
      mOn[m] = 1; mX[m] = x; mY[m] = y;
      mVX[m] = vx0 * 0.75 + (rnd() - 0.5) * 260;
      mVY[m] = vy0 * 0.75 + (rnd() - 0.5) * 180;
      mAge[m] = 0; mLife[m] = 0.9 + rnd() * 1.4;
    };

    function stepMist(dt: number) {
      for (let i = 0; i < N; i += 2) {
        if (nb[i] < 6 && vy[i] < -200 && rnd() < dt * 5) {
          spawnMist(px[i], py[i], vx[i], vy[i]);
        }
      }
      for (let m = 0; m < MIST_CAP; m++) {
        if (!mOn[m]) continue;
        mAge[m] += dt;
        if (mAge[m] >= mLife[m]) { mOn[m] = 0; continue; }
        mVY[m] += G * 0.55 * dt;
        mVX[m] *= 1 - 1.2 * dt;
        mVY[m] *= 1 - 0.5 * dt;
        mX[m] += mVX[m] * dt;
        mY[m] += mVY[m] * dt;
        if (mY[m] > floorY - 4) mOn[m] = 0;
      }
    }

    function step(dt: number) {
      const sdt = dt / substeps;
      for (let s = 0; s < substeps; s++) {
        simT += sdt;
        paddles(simT);
        for (let i = 0; i < N; i++) vy[i] += G * sdt;
        buildGrid();
        viscosity(sdt);
        for (let i = 0; i < N; i++) {
          ppx[i] = px[i]; ppy[i] = py[i];
          px[i] += vx[i] * sdt; py[i] += vy[i] * sdt;
        }
        buildGrid();
        computeDensity();
        relax(sdt);
        boundaries();
        const inv = 1 / sdt;
        for (let i = 0; i < N; i++) {
          let nvx = (px[i] - ppx[i]) * inv;
          let nvy = (py[i] - ppy[i]) * inv;
          const sp2 = nvx * nvx + nvy * nvy;
          if (sp2 > V_MAX * V_MAX) {
            const f = V_MAX / Math.sqrt(sp2);
            nvx *= f; nvy *= f;
          }
          if (!isFinite(nvx) || !isFinite(nvy)) {
            nvx = 0; nvy = 0;
            px[i] = W * 0.5; py[i] = floorY - 10;
          }
          vx[i] = nvx; vy[i] = nvy;
        }
      }
      stepMist(dt);
    }

    function recordTrails() {
      const hp = trailRec % TRAIL_POINTS;
      const prev = ((trailRec - 1) % TRAIL_POINTS + TRAIL_POINTS) % TRAIL_POINTS;
      for (let i = 0; i < N; i++) {
        const base = i * TRAIL_POINTS * 2;
        const lx = trail[base + prev * 2], ly = trail[base + prev * 2 + 1];
        const dx = px[i] - lx, dy = py[i] - ly;
        if (dx * dx + dy * dy > 2500) {
          /* teleport/clamp jump: reset the ring so no straight rod renders */
          for (let tp = 0; tp < TRAIL_POINTS; tp++) {
            trail[base + tp * 2] = px[i];
            trail[base + tp * 2 + 1] = py[i];
          }
        } else {
          trail[base + hp * 2] = px[i];
          trail[base + hp * 2 + 1] = py[i];
        }
      }
      trailRec++;
    }

    function render() {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.globalCompositeOperation = "source-over";
      ctx!.clearRect(0, 0, W, H);
      ctx!.globalCompositeOperation = additive ? "lighter" : "source-over";
      ctx!.lineJoin = "round";
      ctx!.lineCap = "round";

      /* drifting light field: patchy illumination so wave faces catch light
         unevenly — breaks the parallel-front uniformity */
      const kx1 = 6.283 / (0.34 * W), ky1 = 6.283 / (0.22 * H);
      const kx2 = 6.283 / (0.13 * W), ky2 = 6.283 / (0.40 * H);
      const lt = simT;
      const b0d = new Path2D(), b0l = new Path2D(), b1d = new Path2D(), b1l = new Path2D();
      const b2d = new Path2D(), b2l = new Path2D(), spr = new Path2D();
      const hp = trailRec % TRAIL_POINTS;
      for (let i = 0; i < N; i++) {
        const sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        const air = nb[i] < 5;
        let P2: Path2D;
        if (air) P2 = spr;
        else {
          const lum = Math.sin(px[i] * kx1 + lt * 0.35) * Math.sin(py[i] * ky1 - lt * 0.22)
            + 0.8 * Math.sin(px[i] * kx2 - lt * 0.18 + py[i] * ky2);
          const litP = lum > 0.35;
          P2 = sp < 60 ? (litP ? b0l : b0d) : sp < 160 ? (litP ? b1l : b1d) : litP ? b2l : b2d;
        }
        const base = i * TRAIL_POINTS * 2;
        let first = true;
        for (let tp2 = 0; tp2 < TRAIL_POINTS; tp2++) {
          const idx = ((hp + tp2) % TRAIL_POINTS) * 2;
          const tx = trail[base + idx], ty = trail[base + idx + 1];
          if (first) { P2.moveTo(tx, ty); first = false; }
          else P2.lineTo(tx, ty);
        }
        P2.lineTo(px[i], py[i]);
      }
      ctx!.strokeStyle = tint(0.08); ctx!.lineWidth = 1.0; ctx!.stroke(b0d);
      ctx!.strokeStyle = tint(0.22); ctx!.lineWidth = 1.0; ctx!.stroke(b0l);
      ctx!.strokeStyle = tint(0.12); ctx!.lineWidth = 1.0; ctx!.stroke(b1d);
      ctx!.strokeStyle = tint(0.32); ctx!.lineWidth = 1.0; ctx!.stroke(b1l);
      ctx!.strokeStyle = tint(0.2); ctx!.lineWidth = 1.05; ctx!.stroke(b2d);
      ctx!.strokeStyle = tint(0.48); ctx!.lineWidth = 1.05; ctx!.stroke(b2l);
      ctx!.strokeStyle = tint(0.1); ctx!.lineWidth = 2.6; ctx!.stroke(spr);
      ctx!.strokeStyle = tint(0.55); ctx!.lineWidth = 0.9; ctx!.stroke(spr);

      const mist = new Path2D();
      for (let m = 0; m < MIST_CAP; m++) {
        if (!mOn[m]) continue;
        mist.moveTo(mX[m], mY[m]);
        mist.lineTo(mX[m] - mVX[m] * 0.04, mY[m] - mVY[m] * 0.04 - 0.4);
      }
      ctx!.strokeStyle = tint(0.13); ctx!.lineWidth = 2.4; ctx!.stroke(mist);
      ctx!.strokeStyle = tint(0.55); ctx!.lineWidth = 0.8; ctx!.stroke(mist);
    }

    /* ── boot ── */
    build();
    render();

    /* Incremental prewarm: instead of blocking the main thread for ~1.5 s at
       mount, fast-forward the sim ~20 steps per frame (only while visible)
       until it has lived PREWARM_S sim-seconds. The sea forms in well under
       a second of wall-clock without ever janking the page. */
    let warmRemaining = Math.round(PREWARM_S * 60);
    let warmCounter = 0;

    let raf = 0;
    let frame = 0;
    let ema = 16;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0)) dt = 0.0001;
      if (dt > 0.05) dt = 0.05;
      if (pausedRef.current) return;
      if (warmRemaining > 0) {
        const burst = Math.min(20, warmRemaining);
        for (let s = 0; s < burst; s++) {
          step(1 / 60);
          warmCounter++;
          if (warmCounter % 2 === 0) recordTrails();
        }
        warmRemaining -= burst;
        render();
        return;
      }
      ema = ema * 0.95 + dt * 1000 * 0.05;
      if (ema > 24 && substeps > 1) substeps = 1;
      step(timeScale / 60);
      frame++;
      if (frame % 2 === 0) recordTrails();
      render();
    };
    raf = requestAnimationFrame(loop);

    /* debounced resize: rebuild + short re-prewarm so the sea returns mid-motion */
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        if (Math.abs(rect.width - W) < 4 && Math.abs(rect.height - H) < 4) return;
        build();
        simT = 0;
        warmRemaining = Math.round(RESIZE_PREWARM_S * 60);
        warmCounter = 0;
        render();
      }, 200);
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      if (resizeTimer) clearTimeout(resizeTimer);
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [lineColor, particleCount, timeScale, additive]);

  const containerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity,
    transition: "opacity 600ms ease",
  };

  return (
    <div aria-hidden="true" style={containerStyle}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: frameMargin,
          right: frameMargin,
          top: frameMargin,
          bottom: frameMargin,
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
}
