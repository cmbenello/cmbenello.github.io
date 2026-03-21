"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type WaveBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  lineColor?: string;
  backgroundColor?: string;
  paused?: boolean;
};

/* ── constants ─────────────────────────────────────────────────── */

const MAX_DPR = 1.5;
const TWO_PI = Math.PI * 2;
const BASE_SEED = 42811;
const PARTICLE_COUNT = 1800;
const TRAIL_FADE = 0.072; // faster fade — prevents mesh accumulation over time
const PARTICLE_SPEED_BASE = 35; // px/s base speed — halved for slower feel
const PARTICLE_LIFE_MIN = 3.0;
const PARTICLE_LIFE_MAX = 7.0;

// Particle data layout in Float32Array (stride = 8)
const PX = 0, PY = 1, PPX = 2, PPY = 3;
const PLIFE = 4, PMAXLIFE = 5, PSPEED = 6, PWIDTH = 7;
const STRIDE = 8;

/* ── seeded random ─────────────────────────────────────────────── */

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

/* ── 2D Perlin noise ───────────────────────────────────────────── */

const PERM_SIZE = 256;
let _perm: Uint8Array | null = null;

const buildPerm = (): Uint8Array => {
  if (_perm) return _perm;
  const rand = createSeededRandom(BASE_SEED);
  const p = new Uint8Array(512);
  const base = Array.from({ length: PERM_SIZE }, (_, i) => i);
  for (let i = PERM_SIZE - 1; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 256; i++) {
    p[i] = base[i];
    p[i + 256] = base[i];
  }
  _perm = p;
  return p;
};

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 8 gradient directions for 2D
const GRAD2_X = [1, -1, 1, -1, 1, 0, -1, 0];
const GRAD2_Y = [1, 1, -1, -1, 0, 1, 0, -1];

const grad2 = (hash: number, x: number, y: number): number => {
  const h = hash & 7;
  return GRAD2_X[h] * x + GRAD2_Y[h] * y;
};

const noise2D = (x: number, y: number): number => {
  const perm = buildPerm();
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[xi] + yi];
  const ab = perm[perm[xi] + yi + 1];
  const ba = perm[perm[xi + 1] + yi];
  const bb = perm[perm[xi + 1] + yi + 1];

  return lerp(
    lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u),
    lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u),
    v,
  );
};

/** Multi-octave 2D noise */
const fbm2D = (
  x: number, y: number,
  octaves: number, persistence: number,
): number => {
  let total = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * freq, y * freq) * amp;
    max += amp;
    amp *= persistence;
    freq *= 2;
  }
  return total / max;
};

/* ── curl noise (divergence-free velocity field) ───────────────── */

const CURL_EPS = 0.5;

/**
 * Multi-scale curl noise field.
 * Returns velocity (vx, vy) at position (x, y) at time t.
 * The curl of a scalar noise field is divergence-free,
 * creating naturally swirling, non-crossing flow patterns.
 */
const curlNoise = (
  x: number, y: number, t: number,
  out: { vx: number; vy: number },
): void => {
  let vx = 0, vy = 0;

  // Large scale — broad sweeping ocean currents
  const s1 = 0.0012;
  const n1a = fbm2D(x * s1, (y + CURL_EPS) * s1 + t * 0.007, 4, 0.5);
  const n1b = fbm2D(x * s1, (y - CURL_EPS) * s1 + t * 0.007, 4, 0.5);
  const n1c = fbm2D((x + CURL_EPS) * s1, y * s1 + t * 0.007, 4, 0.5);
  const n1d = fbm2D((x - CURL_EPS) * s1, y * s1 + t * 0.007, 4, 0.5);
  vx += (n1a - n1b) / (2 * CURL_EPS) * 1.8;
  vy += -(n1c - n1d) / (2 * CURL_EPS) * 1.8;

  // Medium scale — wave-level swirls
  const s2 = 0.004;
  const t2 = t * 0.012 + 100;
  const n2a = fbm2D(x * s2, (y + CURL_EPS) * s2 + t2, 3, 0.5);
  const n2b = fbm2D(x * s2, (y - CURL_EPS) * s2 + t2, 3, 0.5);
  const n2c = fbm2D((x + CURL_EPS) * s2, y * s2 + t2, 3, 0.5);
  const n2d = fbm2D((x - CURL_EPS) * s2, y * s2 + t2, 3, 0.5);
  vx += (n2a - n2b) / (2 * CURL_EPS) * 1.2;
  vy += -(n2c - n2d) / (2 * CURL_EPS) * 1.2;

  // Small scale — fine turbulent detail
  const s3 = 0.013;
  const t3 = t * 0.02 + 200;
  const n3a = fbm2D(x * s3, (y + CURL_EPS) * s3 + t3, 2, 0.5);
  const n3b = fbm2D(x * s3, (y - CURL_EPS) * s3 + t3, 2, 0.5);
  const n3c = fbm2D((x + CURL_EPS) * s3, y * s3 + t3, 2, 0.5);
  const n3d = fbm2D((x - CURL_EPS) * s3, y * s3 + t3, 2, 0.5);
  vx += (n3a - n3b) / (2 * CURL_EPS) * 0.7;
  vy += -(n3c - n3d) / (2 * CURL_EPS) * 0.7;

  out.vx = vx;
  out.vy = vy;
};

/* ── wave intensity (where crests/foam appear) ─────────────────── */

/**
 * Multi-layer intensity field:
 * 1. Slow background gradient (noise-based) — gives depth and gradients everywhere
 * 2. 3 micro spotlights with complex pulses — appear/disappear independently
 * All additive so overlaps create richer zones.
 */
const waveIntensity = (x: number, y: number, t: number, cw: number, ch: number): number => {
  const r = Math.min(cw, ch) * 0.13;

  // ── Layer 1: slow background noise gradient ──
  // Large-scale, slow-evolving field gives smooth gradients across the whole canvas.
  // Areas quietly brighten and dim independently, never fully dark.
  const n1 = fbm2D(x * 0.0006 + t * 0.0018, y * 0.0005 + t * 0.0012, 3, 0.5);
  const n2 = fbm2D(x * 0.0004 + 30 + t * 0.0010, y * 0.0007 + 30 + t * 0.0020, 2, 0.5);
  const bg = Math.pow((n1 * 0.6 + n2 * 0.4) * 0.5 + 0.5, 2) * 0.12;
  // ^ keep bg subtle — just enough to show gradients without raising the floor

  // ── Layer 2: 3 micro spotlights ──
  const spot = (cx: number, cy: number, pulse: number): number => {
    const dx = (x - cx) / r, dy = (y - cy) / r;
    const f = Math.max(0, 1 - dx * dx - dy * dy);
    return f * f * f * pulse;
  };

  // Complex pulses: sum of two harmonics → less predictable rhythm
  const c1x = cw * (0.25 + 0.30 * Math.sin(t * 0.09) + 0.10 * Math.sin(t * 0.22));
  const c1y = ch * (0.40 + 0.28 * Math.cos(t * 0.07) + 0.08 * Math.cos(t * 0.18));
  const p1 = Math.max(0, 0.45 * Math.sin(t * 0.55) + 0.30 * Math.sin(t * 1.10) + 0.25);

  const c2x = cw * (0.65 + 0.25 * Math.cos(t * 0.06) + 0.09 * Math.sin(t * 0.20));
  const c2y = ch * (0.55 + 0.30 * Math.sin(t * 0.10 + 2.1) + 0.07 * Math.cos(t * 0.24));
  const p2 = Math.max(0, 0.40 * Math.sin(t * 0.70 + 2.1) + 0.25 * Math.sin(t * 0.35 + 1.0) + 0.20);

  const c3x = cw * (0.45 + 0.28 * Math.sin(t * 0.08 + 1.0) + 0.08 * Math.cos(t * 0.26));
  const c3y = ch * (0.65 + 0.25 * Math.cos(t * 0.12 + 4.2) + 0.06 * Math.sin(t * 0.32));
  const p3 = Math.max(0, 0.35 * Math.sin(t * 0.85 + 4.2) + 0.35 * Math.sin(t * 1.70 + 2.0) + 0.15);

  return Math.min(1, bg + spot(c1x, c1y, p1) + spot(c2x, c2y, p2) + spot(c3x, c3y, p3));
};

/* ── parse rgba color ──────────────────────────────────────────── */

const parseColor = (
  color: string,
): { r: number; g: number; b: number } => {
  const m = color.match(/[\d.]+/g);
  if (m && m.length >= 3) {
    return {
      r: parseFloat(m[0]),
      g: parseFloat(m[1]),
      b: parseFloat(m[2]),
    };
  }
  return { r: 255, g: 255, b: 255 };
};

/* ── component ─────────────────────────────────────────────────── */

export default function WaveBackground({
  frameMargin = 32,
  opacity = 1,
  lineColor = "rgba(255, 255, 255, 0.8)",
  backgroundColor = "rgba(40, 58, 90, 1)",
  paused = false,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineColorRef = useRef(lineColor);
  const bgColorRef = useRef(backgroundColor);
  const rafRef = useRef<number | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    lineColorRef.current = lineColor;
  }, [lineColor]);

  useEffect(() => {
    bgColorRef.current = backgroundColor;
  }, [backgroundColor]);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    if (startLoopRef.current) {
      startLoopRef.current();
    }
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Offscreen trail canvas
    const trailCanvas = document.createElement("canvas");
    const trailCtx = trailCanvas.getContext("2d");
    if (!trailCtx) return;

    let w = 1, h = 1, dpr = 1;
    let startTime = performance.now();
    let prevTime = startTime;

    // Particle pool — flat Float32Array for performance
    const particles = new Float32Array(PARTICLE_COUNT * STRIDE);
    const rand = createSeededRandom(BASE_SEED + 9999);
    const vel = { vx: 0, vy: 0 }; // reused output object

    const respawnParticle = (i: number, initialRandom: boolean) => {
      const base = i * STRIDE;
      const t = (performance.now() - startTime) * 0.001;

      // Seed position — biased toward wave crest regions
      let px: number, py: number;
      if (!initialRandom && rand() < 0.65) {
        // Try to spawn near a crest — sample a few random positions and pick brightest
        let bestX = rand() * w, bestY = rand() * h, bestI = 0;
        for (let attempt = 0; attempt < 3; attempt++) {
          const tx = rand() * w, ty = rand() * h;
          const intensity = waveIntensity(tx, ty, t, w, h);
          if (intensity > bestI) {
            bestX = tx; bestY = ty; bestI = intensity;
          }
        }
        px = bestX; py = bestY;
      } else {
        px = rand() * w;
        py = rand() * h;
      }

      particles[base + PX] = px;
      particles[base + PY] = py;
      particles[base + PPX] = px;
      particles[base + PPY] = py;

      const life = PARTICLE_LIFE_MIN + rand() * (PARTICLE_LIFE_MAX - PARTICLE_LIFE_MIN);
      particles[base + PLIFE] = initialRandom ? rand() * life : life;
      particles[base + PMAXLIFE] = life;
      particles[base + PSPEED] = 0.7 + rand() * 0.6; // 0.7-1.3 multiplier
      particles[base + PWIDTH] = 0.3 + rand() * 1.0; // 0.3-1.3 base width
    };

    // Initialize all particles with random life offsets
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      respawnParticle(i, true);
    }

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      // Display canvas at full DPR
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Trail canvas at reduced DPR for softer trails + performance
      const trailDpr = Math.min(dpr, 1.0);
      trailCanvas.width = Math.floor(w * trailDpr);
      trailCanvas.height = Math.floor(h * trailDpr);

      // Clear trail on resize
      trailCtx.setTransform(trailDpr, 0, 0, trailDpr, 0, 0);
      trailCtx.clearRect(0, 0, w, h);
    };

    const draw = (now: number) => {
      if (pausedRef.current) {
        rafRef.current = null;
        return;
      }

      const elapsed = (now - startTime) * 0.001;
      const dt = Math.min((now - prevTime) * 0.001, 0.05);
      prevTime = now;

      const color = parseColor(lineColorRef.current);
      const bgColor = parseColor(bgColorRef.current);

      // ── Step 1: Fade the trail canvas ──
      // Use destination-out to fade trails — works with transparent bg
      const trailW = trailCanvas.width;
      const trailH = trailCanvas.height;
      const trailDpr = trailW / w;
      trailCtx.setTransform(1, 0, 0, 1, 0, 0);
      trailCtx.globalCompositeOperation = "destination-out";
      trailCtx.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE})`;
      trailCtx.fillRect(0, 0, trailW, trailH);
      trailCtx.globalCompositeOperation = "source-over";

      // ── Step 2: Update particles and draw segments ──
      trailCtx.setTransform(trailDpr, 0, 0, trailDpr, 0, 0);
      trailCtx.lineCap = "round";

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const base = i * STRIDE;

        // Decrement life
        particles[base + PLIFE] -= dt;
        if (particles[base + PLIFE] <= 0) {
          respawnParticle(i, false);
          continue;
        }

        // Store previous position
        const x = particles[base + PX];
        const y = particles[base + PY];
        particles[base + PPX] = x;
        particles[base + PPY] = y;

        // Sample curl noise at current position
        curlNoise(x, y, elapsed, vel);

        // Sample wave intensity for modulation
        const intensity = waveIntensity(x, y, elapsed, w, h);

        // Speed: always moving, spotlights add energy
        const speedMul = particles[base + PSPEED];
        const intensitySpeed = 0.7 + intensity * 1.8; // 0.7x always, up to 2.5x at spotlight
        const speed = PARTICLE_SPEED_BASE * speedMul * intensitySpeed;

        // Advance position
        const mag = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy) || 1;
        particles[base + PX] = x + (vel.vx / mag) * speed * dt;
        particles[base + PY] = y + (vel.vy / mag) * speed * dt;

        // Wrap around edges
        const nx = particles[base + PX];
        const ny = particles[base + PY];
        if (nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) {
          respawnParticle(i, false);
          continue;
        }

        // Life fade (fade in at start, fade out at end)
        const lifeFrac = particles[base + PLIFE] / particles[base + PMAXLIFE];
        const fadeIn = Math.min(lifeFrac * 5, 1); // fast fade in
        const fadeOut = Math.min((1 - lifeFrac) * 4, 1);
        const lifeFade = Math.min(fadeIn, fadeOut);

        // Opacity: near-zero floor, steep power curve — most lines barely visible,
        // spotlight peaks pop brightly (tanh-like contrast)
        const i2 = intensity * intensity;
        const alpha = lifeFade * (0.012 + i2 * i2 * 0.70);

        // Width: thin everywhere, thick only at high intensity
        const baseWidth = particles[base + PWIDTH];
        const lineWidth = baseWidth * (0.3 + intensity * intensity * 2.5);

        // Color: tint toward white at crests
        const crestBlend = intensity * intensity; // quadratic for sharp crest highlight
        const r = Math.round(color.r + (255 - color.r) * crestBlend * 0.4);
        const g = Math.round(color.g + (255 - color.g) * crestBlend * 0.4);
        const b = Math.round(color.b + (255 - color.b) * crestBlend * 0.4);

        // Draw line segment
        trailCtx.globalAlpha = alpha;
        trailCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        trailCtx.lineWidth = lineWidth;
        trailCtx.beginPath();
        trailCtx.moveTo(particles[base + PPX], particles[base + PPY]);
        trailCtx.lineTo(particles[base + PX], particles[base + PY]);
        trailCtx.stroke();
      }

      // ── Step 3: Composite trail canvas onto display canvas ──
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.drawImage(trailCanvas, 0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    const startLoop = () => {
      if (rafRef.current !== null || pausedRef.current) return;
      startTime = performance.now();
      prevTime = startTime;
      rafRef.current = requestAnimationFrame(draw);
    };
    startLoopRef.current = startLoop;
    startLoop();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startLoopRef.current = null;
    };
  }, []);

  const inset = frameMargin + 1;
  const containerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity,
    transition: "opacity 600ms ease, background-color 600ms ease",
  };

  return (
    <div aria-hidden="true" style={containerStyle}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          top: inset,
          bottom: inset,
          overflow: "hidden",
          backgroundColor,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
