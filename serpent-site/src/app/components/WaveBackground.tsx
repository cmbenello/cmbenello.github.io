"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type WaveBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  lineColor?: string;
  backgroundColor?: string;
  paused?: boolean;
  alphaBoost?: number;
  trailFade?: number;
  lineWidthScale?: number;
};

/* ── constants ─────────────────────────────────────────────────── */

const MAX_DPR = 1.5;
const TWO_PI = Math.PI * 2;
const BASE_SEED = 42811;
const PARTICLE_COUNT = 2600;
const TRAIL_FADE = 0.05; // slow fade — long combed ink trails
const RESIDUE_FLUSH_INTERVAL = 12; // frames between strong fade passes
const RESIDUE_FLUSH_ALPHA = 0.18; // strength of the periodic residue flush
const PARTICLE_SPEED_BASE = 38; // px/s base advection speed
const PARTICLE_LIFE_MIN = 3.0;
const PARTICLE_LIFE_MAX = 7.0;
const WARMUP_FRAMES = 220; // pre-warm so swells are formed on arrival

/* ── ocean wave field (stream-function bands) ──────────────────── */
// psi(x,y,t) = sum_k A_k * cos(kx_k*(x - c_k*t) + phase_k) * gauss(y - y_k(x,t), sigma_k)
// velocity = (d psi/dy, -d psi/dx)  → divergence-free traveling orbital rolls.

const BAND_COUNT = 4;
const BAND_Y = [0.16, 0.4, 0.63, 0.85]; // centerline, fraction of height
const BAND_LAMBDA = [0.85, 0.62, 0.72, 0.48]; // wavelength, fraction of width
const BAND_SIGMA = [0.1, 0.13, 0.11, 0.085]; // band half-thickness, fraction of height
const BAND_SIGMA_LAMBDA_CAP = 0.16; // cap sigma relative to wavelength (keeps rolls round on narrow screens)
const BAND_SPEED = [24, 32, 28, 36]; // phase speed px/s — all rightward
const BAND_AMP = [0.9, 1.15, 1.0, 0.8]; // relative orbital strength
const BAND_PHASE = [0.0, 2.1, 4.0, 1.2];
const BAND_FOAM = [0.85, 1.0, 0.9, 0.75]; // per-band foam weight
const BAND_UND_AMP = [0.05, 0.06, 0.05, 0.04]; // centerline undulation, fraction of height
const BAND_UND_CYCLES = [1.3, 1.7, 1.1, 1.9]; // undulation cycles across width
const BAND_UND_SPEED = [0.1, 0.14, 0.08, 0.12]; // undulation drift, rad/s
const BAND_UND_PHASE = [0.0, 1.7, 3.4, 5.1];
const ORBITAL_SPEED = 46; // peak orbital velocity scale, px/s
const DRIFT_SPEED = 14; // constant rightward comb drift, px/s
const CREST_GAIN = 0.9; // crest foam gain — calmer sea so breakers pop

/* ── organic noise perturbation (~15% of field magnitude) ──────── */

const NOISE_SPEED = 7; // px/s
const NOISE_SCALE = 0.005;
const NOISE_OCTAVES = 2;
const NOISE_TIME = 0.02;

/* ── breakers (curling, crashing crests) ───────────────────────── */

const BREAKER_COUNT = 3;
const BREAKER_BANDS = [0, 1, 2]; // ride the upper bands
const BREAKER_RADIUS_MIN = 0.15; // fraction of min(w,h)
const BREAKER_RADIUS_MAX = 0.24;
const BREAKER_BUILD = 2.2; // s — vortex spins up
const BREAKER_CURL_MIN = 2.6; // s — full curl duration range
const BREAKER_CURL_MAX = 5.0;
const BREAKER_BURST = 0.85; // s — crash: speed kick + max brightness
const BREAKER_FADE = 2.6; // s — foam dissipates
const BREAKER_SPIN_SPEED = 300; // rotational velocity scale, px/s
const BREAKER_FOAM = 0.95; // foam contribution at full curl
const BREAKER_BURST_FOAM = 1.5; // extra foam at burst
const BREAKER_BURST_KICK = 2.2; // extra speed multiplier at full burst (spray)
const SPLASH_SPEED = 260; // px/s thrown outward/up at the crash
const SPLASH_UP_BIAS = 0.85; // upward bias of the thrown spray direction
const SPLASH_SPIN_DAMP = 0.75; // how much the spiral dies during the burst
const BREAKER_Y_LIFT = 0.35; // ride above band centerline, × sigma

/* ── rendering ─────────────────────────────────────────────────── */

const SPEED_FLOOR = 0.55; // speed multiplier in dark troughs
const SPEED_GAIN = 1.5; // extra speed at full foam intensity
const ALPHA_BASE = 0.016; // low baseline — masses of lines build tone
const ALPHA_CREST = 0.38; // alpha added at full intensity
const WIDTH_CREST = 1.6; // width gain at full intensity
const FOAM_WHITE_START = 0.45; // intensity where whitening begins
const FOAM_WHITE_BASE = 0.35; // whiten cap for dark line colors (light mode red ink)
const FOAM_WHITE_LUM_SPAN = 0.6; // + this × luminance → pure white for white ink
const SPAWN_BIAS_PROB = 0.7;
const SPAWN_CANDIDATES = 3;

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

const CURL_EPS = 0.5;

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
  alphaBoost = 1,
  trailFade,
  lineWidthScale = 1,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineColorRef = useRef(lineColor);
  const bgColorRef = useRef(backgroundColor);
  const rafRef = useRef<number | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const resizeRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(paused);
  const alphaBoostRef = useRef(alphaBoost);
  const trailFadeRef = useRef(trailFade ?? TRAIL_FADE);
  const lineWidthScaleRef = useRef(lineWidthScale);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    lineColorRef.current = lineColor;
    // Clear trail canvas when color changes to avoid stale colored trails
    const tc = trailCanvasRef.current;
    if (tc) {
      const ctx = tc.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, tc.width, tc.height);
    }
  }, [lineColor]);

  useEffect(() => {
    alphaBoostRef.current = alphaBoost;
  }, [alphaBoost]);

  useEffect(() => {
    trailFadeRef.current = trailFade ?? TRAIL_FADE;
  }, [trailFade]);

  useEffect(() => {
    lineWidthScaleRef.current = lineWidthScale;
  }, [lineWidthScale]);

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
    trailCanvasRef.current = trailCanvas;

    let w = 1, h = 1, dpr = 1;
    let prevTime = performance.now();
    let simTime = 0; // accumulated simulation time — continuous across pauses
    let fadeFrame = 0; // counter for the periodic residue flush

    // Particle pool — flat Float32Array for performance
    const particles = new Float32Array(PARTICLE_COUNT * STRIDE);
    const rand = createSeededRandom(BASE_SEED + 9999);
    const brRand = createSeededRandom(BASE_SEED + 777);
    const vel = { vx: 0, vy: 0, intensity: 0, kick: 1 }; // reused output object

    /* ── band parameters resolved to pixels (recomputed on resize) ── */
    const bandKx = new Float64Array(BAND_COUNT); // 2π / wavelength_px
    const bandC = new Float64Array(BAND_COUNT); // phase speed px/s
    const bandSigma = new Float64Array(BAND_COUNT);
    const bandSigInv2 = new Float64Array(BAND_COUNT); // 1 / sigma²
    const bandAmp = new Float64Array(BAND_COUNT); // psi amplitude
    const bandY0 = new Float64Array(BAND_COUNT);
    const bandUndAmp = new Float64Array(BAND_COUNT);
    const bandUndKx = new Float64Array(BAND_COUNT);
    // per-frame phase terms
    const bandArgT = new Float64Array(BAND_COUNT);
    const bandUndT = new Float64Array(BAND_COUNT);

    /* ── breaker state ── */
    const brX = new Float64Array(BREAKER_COUNT);
    const brY = new Float64Array(BREAKER_COUNT);
    const brAge = new Float64Array(BREAKER_COUNT);
    const brCurl = new Float64Array(BREAKER_COUNT);
    const brRadFrac = new Float64Array(BREAKER_COUNT);
    const brRad = new Float64Array(BREAKER_COUNT);
    const brRadInv2 = new Float64Array(BREAKER_COUNT);
    const brEnv = new Float64Array(BREAKER_COUNT);
    const brBurst = new Float64Array(BREAKER_COUNT);
    const brSpinCoef = new Float64Array(BREAKER_COUNT);
    for (let j = 0; j < BREAKER_COUNT; j++) {
      brRadFrac[j] = BREAKER_RADIUS_MIN + brRand() * (BREAKER_RADIUS_MAX - BREAKER_RADIUS_MIN);
      brCurl[j] = BREAKER_CURL_MIN + brRand() * (BREAKER_CURL_MAX - BREAKER_CURL_MIN);
    }

    const recomputeMetrics = () => {
      for (let k = 0; k < BAND_COUNT; k++) {
        const lambda = BAND_LAMBDA[k] * w;
        bandKx[k] = TWO_PI / lambda;
        bandC[k] = BAND_SPEED[k];
        bandSigma[k] = Math.min(BAND_SIGMA[k] * h, BAND_SIGMA_LAMBDA_CAP * lambda);
        bandSigInv2[k] = 1 / (bandSigma[k] * bandSigma[k]);
        bandAmp[k] = BAND_AMP[k] * ORBITAL_SPEED * bandSigma[k];
        bandY0[k] = BAND_Y[k] * h;
        bandUndAmp[k] = BAND_UND_AMP[k] * h;
        bandUndKx[k] = (TWO_PI * BAND_UND_CYCLES[k]) / w;
      }
      const minDim = Math.min(w, h);
      for (let j = 0; j < BREAKER_COUNT; j++) {
        brRad[j] = brRadFrac[j] * minDim;
        brRadInv2[j] = 1 / (brRad[j] * brRad[j]);
      }
    };

    const reseedBreaker = (j: number, fromOffCanvas: boolean) => {
      brAge[j] = 0;
      brCurl[j] = BREAKER_CURL_MIN + brRand() * (BREAKER_CURL_MAX - BREAKER_CURL_MIN);
      brX[j] = fromOffCanvas
        ? -brRad[j] * (0.5 + brRand()) // slide in from the left
        : (0.05 + 0.6 * brRand()) * w; // build anywhere left-of-center
    };

    const initBreakers = () => {
      const avgCurl = (BREAKER_CURL_MIN + BREAKER_CURL_MAX) * 0.5;
      const cycle = BREAKER_BUILD + avgCurl + BREAKER_BURST + BREAKER_FADE;
      for (let j = 0; j < BREAKER_COUNT; j++) {
        brX[j] = (0.1 + 0.8 * brRand()) * w;
        // Stagger lifecycles so something is always mid-curl somewhere
        brAge[j] = (j / BREAKER_COUNT) * cycle;
      }
    };

    const updateBreakers = (dt: number) => {
      for (let j = 0; j < BREAKER_COUNT; j++) {
        const b = BREAKER_BANDS[j % BREAKER_BANDS.length];
        brAge[j] += dt;
        brX[j] += (bandC[b] + DRIFT_SPEED) * dt;

        const total = BREAKER_BUILD + brCurl[j] + BREAKER_BURST + BREAKER_FADE;
        if (brAge[j] > total) {
          reseedBreaker(j, false);
        } else if (brX[j] > w + brRad[j] * 1.5) {
          reseedBreaker(j, true);
        }

        // Lifecycle envelope: build → curl → burst → fade
        const age = brAge[j];
        let env: number;
        let burst = 0;
        if (age < BREAKER_BUILD) {
          const f = age / BREAKER_BUILD;
          env = f * f * (3 - 2 * f);
        } else if (age < BREAKER_BUILD + brCurl[j]) {
          env = 1;
        } else if (age < BREAKER_BUILD + brCurl[j] + BREAKER_BURST) {
          env = 1;
          burst = Math.sin((Math.PI * (age - BREAKER_BUILD - brCurl[j])) / BREAKER_BURST);
        } else {
          const f = Math.min(Math.max((age - BREAKER_BUILD - brCurl[j] - BREAKER_BURST) / BREAKER_FADE, 0), 1);
          env = 1 - f * f * (3 - 2 * f);
        }
        brEnv[j] = env;
        brBurst[j] = burst;
        brSpinCoef[j] = (BREAKER_SPIN_SPEED * env) / brRad[j];

        // Ride the band centerline, lifted toward the crest top
        brY[j] =
          bandY0[b] +
          bandUndAmp[b] * Math.sin(bandUndKx[b] * brX[j] + bandUndT[b]) -
          BREAKER_Y_LIFT * bandSigma[b];
      }
    };

    const precomputeFrame = (t: number, dt: number) => {
      for (let k = 0; k < BAND_COUNT; k++) {
        bandArgT[k] = BAND_PHASE[k] - bandKx[k] * bandC[k] * t;
        bandUndT[k] = BAND_UND_PHASE[k] + BAND_UND_SPEED[k] * t;
      }
      updateBreakers(dt);
    };

    /**
     * Ocean velocity field + foam intensity at (x, y).
     * velocity = analytic curl of the band stream function (divergence-free)
     *          + constant drift + small fbm perturbation + breaker vortices.
     * intensity = crest proximity (positive psi lobes) + breaker envelopes.
     */
    const sampleField = (
      x: number, y: number, t: number,
      out: { vx: number; vy: number; intensity: number; kick: number },
    ): void => {
      let vx = DRIFT_SPEED;
      let vy = 0;
      let crest = 0;

      for (let k = 0; k < BAND_COUNT; k++) {
        const und = bandUndKx[k] * x + bandUndT[k];
        const yk = bandY0[k] + bandUndAmp[k] * Math.sin(und);
        const dy = y - yk;
        const u2 = dy * dy * bandSigInv2[k];
        if (u2 > 9) continue; // beyond 3 sigma — negligible

        const g = Math.exp(-0.5 * u2);
        const gp = -dy * bandSigInv2[k] * g; // dG/dy
        const arg = bandKx[k] * x + bandArgT[k];
        const cosA = Math.cos(arg);
        const sinA = Math.sin(arg);
        const ykp = bandUndAmp[k] * bandUndKx[k] * Math.cos(und); // d y_k / dx

        // (d psi/dy, -d psi/dx)
        vx += bandAmp[k] * cosA * gp;
        vy += bandAmp[k] * (bandKx[k] * sinA * g + cosA * gp * ykp);

        // Crest foam: positive cos lobes, sharpened
        if (cosA > 0) crest += BAND_FOAM[k] * cosA * cosA * cosA * g;
      }

      // Small organic perturbation (curl of fbm — keeps field divergence-free)
      const ns = NOISE_SCALE;
      const tt = t * NOISE_TIME + 100;
      const na = fbm2D(x * ns, (y + CURL_EPS) * ns + tt, NOISE_OCTAVES, 0.5);
      const nb = fbm2D(x * ns, (y - CURL_EPS) * ns + tt, NOISE_OCTAVES, 0.5);
      const nc = fbm2D((x + CURL_EPS) * ns, y * ns + tt, NOISE_OCTAVES, 0.5);
      const nd = fbm2D((x - CURL_EPS) * ns, y * ns + tt, NOISE_OCTAVES, 0.5);
      const ninv = NOISE_SPEED / (2 * CURL_EPS * ns);
      vx += (na - nb) * ninv;
      vy += -(nc - nd) * ninv;

      let foam = crest * CREST_GAIN;
      let kick = 1;

      // Breaker vortices: lines curl over the crest; at the burst the spiral
      // dies and the water is THROWN — a directed splash outward and upward.
      for (let j = 0; j < BREAKER_COUNT; j++) {
        const dxb = x - brX[j];
        const dyb = y - brY[j];
        const q2 = (dxb * dxb + dyb * dyb) * brRadInv2[j];
        if (q2 >= 1) continue;
        const f = (1 - q2) * (1 - q2);
        const burst = brBurst[j];
        // Rotation curling forward over the wave, damped while bursting so
        // the crash reads as a splash, not a faster spiral.
        const spin = brSpinCoef[j] * f * (1 - burst * SPLASH_SPIN_DAMP);
        vx += -dyb * spin;
        vy += dxb * spin;
        if (burst > 0.01) {
          const d = Math.sqrt(dxb * dxb + dyb * dyb) || 1;
          const splash = burst * f * SPLASH_SPEED;
          vx += (dxb / d) * splash;
          vy += (dyb / d - SPLASH_UP_BIAS) * splash;
        }
        foam += f * (brEnv[j] * BREAKER_FOAM + burst * BREAKER_BURST_FOAM);
        kick += f * burst * BREAKER_BURST_KICK;
      }

      out.vx = vx;
      out.vy = vy;
      out.intensity = foam > 1 ? 1 : foam;
      out.kick = kick;
    };

    /** Foam intensity only — used for crest-biased particle spawning. */
    const foamAt = (x: number, y: number): number => {
      let foam = 0;
      for (let k = 0; k < BAND_COUNT; k++) {
        const und = bandUndKx[k] * x + bandUndT[k];
        const yk = bandY0[k] + bandUndAmp[k] * Math.sin(und);
        const dy = y - yk;
        const u2 = dy * dy * bandSigInv2[k];
        if (u2 > 9) continue;
        const cosA = Math.cos(bandKx[k] * x + bandArgT[k]);
        if (cosA <= 0) continue;
        foam += BAND_FOAM[k] * cosA * cosA * cosA * Math.exp(-0.5 * u2);
      }
      foam *= CREST_GAIN;
      for (let j = 0; j < BREAKER_COUNT; j++) {
        const dxb = x - brX[j];
        const dyb = y - brY[j];
        const q2 = (dxb * dxb + dyb * dyb) * brRadInv2[j];
        if (q2 >= 1) continue;
        const f = (1 - q2) * (1 - q2);
        foam += f * (brEnv[j] * BREAKER_FOAM + brBurst[j] * BREAKER_BURST_FOAM);
      }
      return foam;
    };

    const respawnParticle = (i: number, initialRandom: boolean) => {
      const base = i * STRIDE;

      // Seed position — biased toward wave crests so density follows the swells
      let px: number, py: number;
      if (!initialRandom && rand() < SPAWN_BIAS_PROB) {
        let bestX = rand() * w, bestY = rand() * h;
        let bestI = foamAt(bestX, bestY);
        for (let attempt = 1; attempt < SPAWN_CANDIDATES; attempt++) {
          const tx = rand() * w, ty = rand() * h;
          const intensity = foamAt(tx, ty);
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
      particles[base + PWIDTH] = 0.4 + rand() * 0.6; // 0.4-1.0 base width
    };

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

      recomputeMetrics();
    };

    /** One simulation + draw step into the trail canvas (shared by warmup and rAF loop). */
    const stepFrame = (dt: number) => {
      simTime += dt;
      const t = simTime;
      precomputeFrame(t, dt);

      const color = parseColor(lineColorRef.current);
      // Whiten less for dark inks (light-mode red) so foam stays visible on cream
      const lum = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
      const whitenMax = FOAM_WHITE_BASE + FOAM_WHITE_LUM_SPAN * lum;

      // ── Step 1: Fade the trail canvas ──
      const trailW = trailCanvas.width;
      const trailH = trailCanvas.height;
      const trailDpr = trailW / w;
      trailCtx.setTransform(1, 0, 0, 1, 0, 0);
      trailCtx.globalCompositeOperation = "destination-out";
      trailCtx.fillStyle = `rgba(0, 0, 0, ${trailFadeRef.current})`;
      trailCtx.fillRect(0, 0, trailW, trailH);
      // Small per-frame destination-out fades stall on 8-bit alpha (decrement
      // rounds to zero below ~0.5/fade), leaving a permanent haze. A stronger
      // periodic pass flushes that residue without shortening trails much.
      fadeFrame += 1;
      if (fadeFrame % RESIDUE_FLUSH_INTERVAL === 0) {
        trailCtx.fillStyle = `rgba(0, 0, 0, ${RESIDUE_FLUSH_ALPHA})`;
        trailCtx.fillRect(0, 0, trailW, trailH);
      }
      trailCtx.globalCompositeOperation = "source-over";

      // ── Step 2: Update particles and draw segments ──
      trailCtx.setTransform(trailDpr, 0, 0, trailDpr, 0, 0);
      trailCtx.lineCap = "round";

      const ab = alphaBoostRef.current;
      const lws = lineWidthScaleRef.current;

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

        // Sample the ocean field (velocity + foam intensity + burst kick)
        sampleField(x, y, t, vel);
        const intensity = vel.intensity;

        // Speed: slow comb in the troughs, fast on crests, kicked at a burst
        const speed =
          PARTICLE_SPEED_BASE *
          particles[base + PSPEED] *
          (SPEED_FLOOR + intensity * SPEED_GAIN) *
          vel.kick;

        // Advance position along the field direction
        const mag = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy) || 1;
        particles[base + PX] = x + (vel.vx / mag) * speed * dt;
        particles[base + PY] = y + (vel.vy / mag) * speed * dt;

        // Respawn off-canvas particles
        const nx = particles[base + PX];
        const ny = particles[base + PY];
        if (nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) {
          respawnParticle(i, false);
          continue;
        }

        // Life fade (fade in at start, fade out at end)
        const lifeFrac = particles[base + PLIFE] / particles[base + PMAXLIFE];
        const fadeIn = Math.min(lifeFrac * 5, 1);
        const fadeOut = Math.min((1 - lifeFrac) * 4, 1);
        const lifeFade = Math.min(fadeIn, fadeOut);

        // Opacity: low baseline so masses of lines build tone; crests pop
        const i2 = intensity * intensity;
        const alpha = Math.min(lifeFade * (ALPHA_BASE + i2 * ALPHA_CREST) * ab, 1);
        if (alpha < 0.003) continue;

        // Width: fine lines everywhere, thicker at high intensity
        const lineWidth = particles[base + PWIDTH] * (1 + i2 * WIDTH_CREST) * lws;

        // Color: whiten toward foam only at high intensity
        let wt = (intensity - FOAM_WHITE_START) / (1 - FOAM_WHITE_START);
        wt = wt < 0 ? 0 : wt > 1 ? 1 : wt;
        const blend = wt * wt * whitenMax;
        const r = Math.round(color.r + (255 - color.r) * blend);
        const g = Math.round(color.g + (255 - color.g) * blend);
        const b = Math.round(color.b + (255 - color.b) * blend);

        // Draw line segment
        trailCtx.globalAlpha = alpha;
        trailCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        trailCtx.lineWidth = lineWidth;
        trailCtx.beginPath();
        trailCtx.moveTo(particles[base + PPX], particles[base + PPY]);
        trailCtx.lineTo(particles[base + PX], particles[base + PY]);
        trailCtx.stroke();
      }
    };

    const draw = (now: number) => {
      if (pausedRef.current) {
        rafRef.current = null;
        return;
      }

      const dt = Math.min((now - prevTime) * 0.001, 0.05);
      prevTime = now;

      stepFrame(dt);

      // Composite trail canvas onto display canvas
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.drawImage(trailCanvas, 0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    initBreakers();

    // Initialize all particles with random life offsets
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      respawnParticle(i, true);
    }

    // Pre-warm trail canvas so the sea is already formed when the user arrives,
    // rather than an empty canvas that fills in slowly.
    for (let f = 0; f < WARMUP_FRAMES; f++) {
      stepFrame(1 / 60);
    }

    const startLoop = () => {
      if (rafRef.current !== null || pausedRef.current) return;
      prevTime = performance.now();
      rafRef.current = requestAnimationFrame(draw);
    };
    startLoopRef.current = startLoop;
    resizeRef.current = resize;
    startLoop();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startLoopRef.current = null;
      resizeRef.current = null;
    };
  }, []);

  // Re-measure canvas when frame margin changes
  useEffect(() => {
    resizeRef.current?.();
  }, [frameMargin]);

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
