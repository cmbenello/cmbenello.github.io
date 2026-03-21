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
const TRAIL_FADE = 0.09; // alpha per frame — aggressive fade so trails clear fast
const PARTICLE_SPEED_BASE = 70; // px/s base speed
const PARTICLE_LIFE_MIN = 1.2;
const PARTICLE_LIFE_MAX = 3.0;

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

  // Horizontal stretch factor — elongates noise so patterns read as waves
  const H_STRETCH = 0.45; // x-scale compressed → wider horizontal features

  // Large scale — broad sweeping ocean currents
  const s1 = 0.0012;
  const n1a = fbm2D(x * s1 * H_STRETCH, (y + CURL_EPS) * s1 + t * 0.015, 4, 0.5);
  const n1b = fbm2D(x * s1 * H_STRETCH, (y - CURL_EPS) * s1 + t * 0.015, 4, 0.5);
  const n1c = fbm2D((x + CURL_EPS) * s1 * H_STRETCH, y * s1 + t * 0.015, 4, 0.5);
  const n1d = fbm2D((x - CURL_EPS) * s1 * H_STRETCH, y * s1 + t * 0.015, 4, 0.5);
  vx += (n1a - n1b) / (2 * CURL_EPS) * 1.8;
  vy += -(n1c - n1d) / (2 * CURL_EPS) * 1.8;

  // Medium scale — wave-level swirls
  const s2 = 0.004;
  const t2 = t * 0.025 + 100;
  const n2a = fbm2D(x * s2 * H_STRETCH, (y + CURL_EPS) * s2 + t2, 3, 0.5);
  const n2b = fbm2D(x * s2 * H_STRETCH, (y - CURL_EPS) * s2 + t2, 3, 0.5);
  const n2c = fbm2D((x + CURL_EPS) * s2 * H_STRETCH, y * s2 + t2, 3, 0.5);
  const n2d = fbm2D((x - CURL_EPS) * s2 * H_STRETCH, y * s2 + t2, 3, 0.5);
  vx += (n2a - n2b) / (2 * CURL_EPS) * 1.2;
  vy += -(n2c - n2d) / (2 * CURL_EPS) * 1.2;

  // Small scale — fine turbulent detail (less horizontal stretch to keep detail chaotic)
  const s3 = 0.013;
  const t3 = t * 0.04 + 200;
  const sH3 = 0.65; // less stretch at small scale for natural turbulence
  const n3a = fbm2D(x * s3 * sH3, (y + CURL_EPS) * s3 + t3, 2, 0.5);
  const n3b = fbm2D(x * s3 * sH3, (y - CURL_EPS) * s3 + t3, 2, 0.5);
  const n3c = fbm2D((x + CURL_EPS) * s3 * sH3, y * s3 + t3, 2, 0.5);
  const n3d = fbm2D((x - CURL_EPS) * s3 * sH3, y * s3 + t3, 2, 0.5);
  vx += (n3a - n3b) / (2 * CURL_EPS) * 0.7;
  vy += -(n3c - n3d) / (2 * CURL_EPS) * 0.7;

  // Horizontal bias: dampen vertical velocity + add lateral drift
  vy *= 0.4; // suppress vertical motion
  vx += 0.35; // gentle rightward ocean current

  out.vx = vx;
  out.vy = vy;
};

/* ── wave intensity (where crests/foam appear) ─────────────────── */

/**
 * Returns 0-1 indicating wave crest intensity at a position.
 * Used to modulate: particle speed, brightness, line thickness.
 * Creates the bright foam regions vs dark calm regions.
 */
const waveIntensity = (x: number, y: number, t: number): number => {
  // Overlapping wave shapes — horizontally stretched for wave-like crest bands
  const w1 = fbm2D(x * 0.0006 + t * 0.006, y * 0.0022 + t * 0.004, 3, 0.5);
  const w2 = fbm2D(x * 0.0004 + 50 + t * 0.005, y * 0.0028 + 50 + t * 0.008, 2, 0.5);
  const w3 = fbm2D(x * 0.0012 + 100 + t * 0.01, y * 0.0015 + 100, 2, 0.45);

  const raw = (w1 + w2 * 0.7 + w3 * 0.5) / 2.2;
  const remapped = raw * 0.5 + 0.5; // 0-1

  // Very aggressive sharpening — almost all canvas is dark, only peaks are bright
  // This creates the dramatic "crashing wave" concentration effect
  const steep = Math.max(0, Math.min(1, (remapped - 0.4) / 0.3));
  const crashed = steep * steep * steep * steep; // quartic — extremely sharp falloff
  return crashed;
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
          const intensity = waveIntensity(tx, ty, t);
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
        const intensity = waveIntensity(x, y, elapsed);

        // Speed: faster in crest regions
        const speedMul = particles[base + PSPEED];
        const intensitySpeed = 0.15 + intensity * 3.5; // 0.15x in troughs, 3.65x at crests
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

        // Opacity: very bright at crash zones, nearly invisible in calm areas
        const alpha = lifeFade * (0.015 + intensity * 0.7);

        // Line width: thicker at crests
        const baseWidth = particles[base + PWIDTH];
        const lineWidth = baseWidth * (0.3 + intensity * 1.8);

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
