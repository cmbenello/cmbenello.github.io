"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  angle: number;
  seed: number;
};

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  phase: number;
};

type ContourLine = {
  y: number;
  wobble: number;
  freq: number;
  phase: number;
  speed: number;
  amp: number;
};

type Segment = {
  x: number;
  y: number;
};

type Sample = {
  x: number;
  y: number;
  tngX: number;
  tngY: number;
  w: number;
};

type DotStyle = "dot" | "dash" | "cloud" | "contour" | "ripple" | "bloom";
type StarWarpDirection = "up" | "down";

export type SerpentPalette = {
  background: string;
  dot: string;
  glow: string;
  border: string;
  dotStyle?: DotStyle;
  dotDensityScale?: number;
  dotAlphaScale?: number;
  wakeAlphaScale?: number;
  dotRadiusScale?: number;
};

export const DEFAULT_PALETTE: SerpentPalette = {
  background: "#141517",
  dot: "#ffffff",
  glow: "120, 190, 255",
  border: "rgba(255, 255, 255, 0.4)",
  dotStyle: "dot",
  dotDensityScale: 1,
  dotAlphaScale: 1.6,
  wakeAlphaScale: 0.95,
  dotRadiusScale: 1.15,
};

export const LIGHT_PALETTE: SerpentPalette = {
  background: "#f6e7c6",
  dot: "#e14d52",
  glow: "225, 78, 84",
  border: "rgba(192, 24, 33, 0.55)",
  dotStyle: "dash",
  dotDensityScale: 0.7,
  dotAlphaScale: 1.5,
  wakeAlphaScale: 0.8,
  dotRadiusScale: 1,
};

type SerpentBackgroundProps = {
  palette?: SerpentPalette;
  frameMargin?: number;
  starVisibility?: number;
  serpentVisibility?: number;
  backgroundOpacity?: number;
  starWarpTrigger?: number;
  starWarpDirection?: StarWarpDirection;
  starWarpEntering?: boolean;
  paused?: boolean;
};

type Rgb = [number, number, number];
type Rgba = [number, number, number, number];

const WHITE: Rgb = [255, 255, 255];
const STAR_WARP_MS = 520;
const MAX_DPR = 1.5;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInCubic = (value: number) => {
  const t = clamp01(value);
  return t * t * t;
};
const easeOutCubic = (value: number) => {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
};

type PaletteState = {
  background: Rgb;
  dot: Rgb;
  glow: Rgb;
  border: Rgba;
  dotAlphaScale: number;
  wakeAlphaScale: number;
  dotRadiusScale: number;
};

const parseHexColor = (value: string): Rgb => {
  const raw = value.replace("#", "").trim();
  const hex =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : raw;
  const numeric = Number.parseInt(hex, 16);
  if (Number.isNaN(numeric)) return [0, 0, 0];
  return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255];
};

const parseRgbList = (value: string): Rgb => {
  const cleaned = value.replace(/rgba?\(/i, "").replace(")", "");
  const parts = cleaned.split(",").map((part) => Number(part.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

const parseRgbaColor = (value: string): Rgba => {
  const cleaned = value.replace(/rgba?\(/i, "").replace(")", "");
  const parts = cleaned.split(",").map((part) => Number(part.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] ?? 1];
};

const formatRgb = (value: Rgb) =>
  `rgb(${Math.round(value[0])}, ${Math.round(value[1])}, ${Math.round(value[2])})`;

const formatRgba = (rgb: Rgb, alpha: number) =>
  `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(
    rgb[2],
  )}, ${alpha})`;

const formatRgbaValue = (value: Rgba) =>
  `rgba(${Math.round(value[0])}, ${Math.round(value[1])}, ${Math.round(
    value[2],
  )}, ${Math.min(1, Math.max(0, value[3]))})`;

const clonePaletteState = (state: PaletteState): PaletteState => ({
  background: [...state.background],
  dot: [...state.dot],
  glow: [...state.glow],
  border: [...state.border],
  dotAlphaScale: state.dotAlphaScale,
  wakeAlphaScale: state.wakeAlphaScale,
  dotRadiusScale: state.dotRadiusScale,
});

const toPaletteState = (palette: SerpentPalette): PaletteState => ({
  background: parseHexColor(palette.background),
  dot: parseHexColor(palette.dot),
  glow: parseRgbList(palette.glow),
  border: parseRgbaColor(palette.border),
  dotAlphaScale: palette.dotAlphaScale ?? 1,
  wakeAlphaScale: palette.wakeAlphaScale ?? 1,
  dotRadiusScale: palette.dotRadiusScale ?? 1,
});

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const lerpRgb = (from: Rgb, to: Rgb, t: number): Rgb => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
];

const lerpRgba = (from: Rgba, to: Rgba, t: number): Rgba => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
  lerp(from[3], to[3], t),
];

export default function SerpentBackground({
  palette = DEFAULT_PALETTE,
  frameMargin = 32,
  starVisibility = 0,
  serpentVisibility = 1,
  backgroundOpacity = 1,
  starWarpTrigger = 0,
  starWarpDirection = "up",
  starWarpEntering = false,
  paused = false,
}: SerpentBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(paused);
  const dotStyleCurrentRef = useRef<DotStyle>(palette.dotStyle ?? "dot");
  const dotStyleTransitionRef = useRef<{
    from: DotStyle;
    to: DotStyle;
    start: number;
    duration: number;
  } | null>(null);
  const dotDensityRef = useRef<number>(palette.dotDensityScale ?? 1);
  const serpentVisibilityRef = useRef<number>(clamp01(serpentVisibility));
  const starAlphaRef = useRef<number>(clamp01(starVisibility));
  const starTargetRef = useRef<number>(clamp01(starVisibility));
  const starVisibilityRef = useRef<number>(clamp01(starVisibility));
  const backgroundOpacityRef = useRef<number>(clamp01(backgroundOpacity));
  const starTransitionRef = useRef<{
    start: number;
    duration: number;
    from: number;
    to: number;
  } | null>(null);
  const starWarpRef = useRef<{
    start: number;
    duration: number;
    direction: StarWarpDirection;
    entering: boolean;
  } | null>(null);
  const initialPalette = toPaletteState(palette);
  const paletteTargetRef = useRef<PaletteState>(initialPalette);
  const paletteCurrentRef = useRef<PaletteState>(clonePaletteState(initialPalette));
  const transitionRef = useRef<{
    start: number;
    duration: number;
    from: PaletteState;
    to: PaletteState;
  } | null>(null);

  serpentVisibilityRef.current = clamp01(serpentVisibility);
  starVisibilityRef.current = clamp01(starVisibility);
  backgroundOpacityRef.current = clamp01(backgroundOpacity);

  useEffect(() => {
    const nextStyle = palette.dotStyle ?? "dot";
    const currentStyle = dotStyleCurrentRef.current;
    if (currentStyle !== nextStyle) {
      dotStyleTransitionRef.current = {
        from: currentStyle,
        to: nextStyle,
        start: performance.now(),
        duration: 700,
      };
    } else {
      dotStyleTransitionRef.current = null;
      dotStyleCurrentRef.current = nextStyle;
    }
    dotDensityRef.current = palette.dotDensityScale ?? 1;
    const target = toPaletteState(palette);
    const from = paletteCurrentRef.current
      ? clonePaletteState(paletteCurrentRef.current)
      : target;
    transitionRef.current = {
      start: performance.now(),
      duration: 700,
      from,
      to: target,
    };
    paletteTargetRef.current = target;
    if (startLoopRef.current) {
      startLoopRef.current();
    }
  }, [palette]);

  useLayoutEffect(() => {
    const target = starVisibilityRef.current;
    starTargetRef.current = target;
    const from = starAlphaRef.current ?? 0;
    if (target <= 0) {
      if (from > 0.01) {
        starTransitionRef.current = {
          start: performance.now(),
          duration: 600,
          from,
          to: 0,
        };
      } else {
        starTransitionRef.current = null;
        starAlphaRef.current = 0;
      }
      return;
    }
    if (Math.abs(from - target) < 0.01) {
      starTransitionRef.current = null;
      starAlphaRef.current = target;
      return;
    }
    starTransitionRef.current = {
      start: performance.now(),
      duration: 600,
      from,
      to: target,
    };
    if (startLoopRef.current) {
      startLoopRef.current();
    }
  }, [starVisibility]);

  useLayoutEffect(() => {
    if (!starWarpTrigger) return;
    const entering = starWarpEntering;
    starWarpRef.current = {
      start: performance.now(),
      duration: STAR_WARP_MS,
      direction: starWarpDirection,
      entering,
    };
    if (startLoopRef.current) {
      startLoopRef.current();
    }
  }, [starWarpTrigger, starWarpDirection, starWarpEntering]);

  useEffect(() => {
    if (
      clamp01(serpentVisibility) > 0.01 ||
      clamp01(starVisibility) > 0.01 ||
      clamp01(backgroundOpacity) > 0.01
    ) {
      if (startLoopRef.current) {
        startLoopRef.current();
      }
    }
  }, [serpentVisibility, starVisibility, backgroundOpacity]);

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
    ctxRef.current = ctx;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let dots: Dot[] = [];
    let stars: Star[] = [];
    let contourLines: ContourLine[] = [];
    let contourSpacing = 24;
    let last = performance.now();
    let headX = 0;
    let headY = 0;
    let headAngle = 0;
    let turnVelocity = 0;
    let segmentStart = 0;
    let segmentDuration = 1;
    let pathNeedsInit = true;
    let segments: Segment[] = [];
    let segmentCount = 24;
    let segmentSpacing = 8;
    let sampleStride = 2;
    let lifeStart = 0;
    let lifeDuration = 4.5;
    let respawnDelay = 1.2;
    let pathPoints: Segment[] = [];
    let pathSpacing = 6;
    let maxPathPoints = 600;
    let waveBaseAngle = 0;
    let wavePhase = 0;
    let waveSpeed = 0;
    let waveAmplitude = 0;
    let waveDirection = 1;
    let lastSpawnX = 0;
    let lastSpawnY = 0;
    let hasSpawn = false;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const wrapAngle = (angle: number) => {
      let a = angle;
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    };

    const minDistanceToPath = (
      x: number,
      y: number,
      source: Segment[],
      startIndex: number,
      stride: number,
      limit = source.length,
    ) => {
      let minDist = Infinity;
      const end = Math.min(limit, source.length);
      for (let i = startIndex; i < end; i += stride) {
        const seg = source[i];
        const dx = x - seg.x;
        const dy = y - seg.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) minDist = dist;
      }
      return minDist;
    };

    const maxTurn = Math.PI / 2.3;
    const maxTurnRate = Math.PI / 1.5;
    const minTurnRate = Math.PI / 2.6;
    const steerWeight = 0.65;
    const horizontalBias = 0.8;
    const twoPi = Math.PI * 2;
    const randomTurnDuration = () =>
      Math.random() < 0.55 ? 0.45 + Math.random() * 0.55 : 0.95 + Math.random() * 0.75;
    const randomLifeDuration = () => 6 + Math.random() * 3;
    const randomRespawnDelay = () => 1.6 + Math.random() * 1.4;
    const growDuration = 1.1;

    const enforceMinTurn = (delta: number, min = maxTurn * 0.25) => {
      if (Math.abs(delta) < min) {
        const sign = delta === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(delta);
        return sign * min;
      }
      return delta;
    };

    const pickWavePhase = () => {
      let phase = Math.random() * twoPi;
      let tries = 0;
      while ((Math.abs(Math.sin(phase)) < 0.35 || Math.abs(Math.cos(phase)) < 0.25) && tries < 6) {
        phase = Math.random() * twoPi;
        tries += 1;
      }
      return phase;
    };

    const startCurve = (nowSec: number, delta: number, duration = randomTurnDuration()) => {
      segmentStart = nowSec;
      segmentDuration = duration;
      const sign = delta === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(delta);
      const targetAngle = wrapAngle(headAngle + delta);
      const right = 0;
      const left = Math.PI;
      const horizontalAngle =
        Math.abs(wrapAngle(right - headAngle)) < Math.abs(wrapAngle(left - headAngle))
          ? right
          : left;
      const towardTarget = wrapAngle(headAngle + wrapAngle(targetAngle - headAngle) * 0.5);
      waveBaseAngle = wrapAngle(
        towardTarget + wrapAngle(horizontalAngle - towardTarget) * horizontalBias,
      );
      waveBaseAngle = wrapAngle(waveBaseAngle + (Math.random() * 2 - 1) * 0.2);
      waveAmplitude = maxTurn * (0.6 + Math.random() * 0.25);
      waveSpeed = twoPi * (0.3 + Math.random() * 0.35);
      wavePhase = pickWavePhase();
      if (Math.sign(Math.sin(wavePhase)) !== sign) wavePhase += Math.PI;
      waveDirection = sign;
    };

    const seedSegments = () => {
      const seeded: Segment[] = new Array(segmentCount);
      let angle = wrapAngle(headAngle + Math.PI);
      const curve = (waveDirection || 1) * maxTurn * 0.04;
      let x = headX;
      let y = headY;
      seeded[0] = { x, y };
      for (let i = 1; i < segmentCount; i++) {
        angle = wrapAngle(angle + curve);
        x += Math.cos(angle) * segmentSpacing;
        y += Math.sin(angle) * segmentSpacing;
        seeded[i] = { x, y };
      }
      return seeded;
    };

    function resetHead(nowSec: number) {
      const padX = w * 0.18;
      const padY = h * 0.18;
      const min = Math.min(w, h);
      const minSpawnDistance = min * 0.35;
      const prevSegments = segments;
      const prevStride = Math.max(1, Math.round(prevSegments.length / 12));
      const prevPath = pathPoints;
      const prevPathStride = Math.max(1, Math.round(prevPath.length / 16));
      const minPathDistance = Math.max(segmentSpacing * 7, min * 0.2);
      let tries = 0;
      let nextX = 0;
      let nextY = 0;
      do {
        nextX = padX + Math.random() * Math.max(1, w - padX * 2);
        nextY = padY + Math.random() * Math.max(1, h - padY * 2);
        tries += 1;
      } while (
        tries < 18 &&
        ((hasSpawn &&
          Math.hypot(nextX - lastSpawnX, nextY - lastSpawnY) < minSpawnDistance) ||
          (prevSegments.length > 0 &&
            minDistanceToPath(nextX, nextY, prevSegments, 0, prevStride) < minPathDistance) ||
          (prevPath.length > 0 &&
            minDistanceToPath(nextX, nextY, prevPath, 0, prevPathStride) < minPathDistance))
      );
      headX = nextX;
      headY = nextY;
      lastSpawnX = headX;
      lastSpawnY = headY;
      hasSpawn = true;
      const left = headX;
      const right = w - headX;
      const top = headY;
      const bottom = h - headY;
      let baseAngle = 0;
      if (left <= right && left <= top && left <= bottom) {
        baseAngle = 0;
      } else if (right <= top && right <= bottom) {
        baseAngle = Math.PI;
      } else if (top <= bottom) {
        baseAngle = Math.PI / 2;
      } else {
        baseAngle = -Math.PI / 2;
      }
      headAngle = baseAngle + (Math.random() * 2 - 1) * 0.5;
      turnVelocity = 0;
      startCurve(nowSec, enforceMinTurn((Math.random() * 2 - 1) * maxTurn, maxTurn * 0.35));
      segments = seedSegments();
      pathPoints = [{ x: headX, y: headY }];
      lifeStart = nowSec;
      lifeDuration = randomLifeDuration();
      respawnDelay = randomRespawnDelay();
      pathNeedsInit = false;
    }

    function buildDots() {
      const count = Math.min(70000, Math.floor((w * h) / 50));
      dots = new Array(count);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        dots[i] = {
          x,
          y,
          rx: x,
          ry: y,
          vx: 0,
          vy: 0,
          r: Math.random() * 0.7 + 0.6,
          a: 0.06 + Math.random() * 0.1,
          angle: Math.random() * Math.PI * 2,
          seed: Math.random(),
        };
      }
    }

    function buildStars() {
      const count = Math.max(160, Math.min(900, Math.floor((w * h) / 1800)));
      stars = new Array(count);
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        const sizeBias = Math.pow(depth, 1.6);
        stars[i] = {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.22 + sizeBias * 0.9,
          a: 0.08 + depth * 0.3,
          tw: 0.3 + Math.random() * 0.9,
          phase: Math.random() * twoPi,
        };
      }
    }

    function buildContours() {
      contourLines = [];
      const min = Math.min(w, h);
      contourSpacing = Math.max(10, min * 0.02);
      let y = contourSpacing * 0.5;
      while (y < h - contourSpacing * 0.5) {
        y += contourSpacing * (0.35 + Math.random() * 0.55);
        contourLines.push({
          y,
          wobble: contourSpacing * (0.06 + Math.random() * 0.1),
          freq: 0.0035 + Math.random() * 0.0035,
          phase: Math.random() * twoPi,
          speed: 0.08 + Math.random() * 0.12,
          amp: 0.6 + Math.random() * 0.8,
        });
      }
    }

    function resize() {
      const ctx = ctxRef.current;
      const canvasEl = canvasRef.current;
      if (!ctx || !canvasEl) return;
      const parent = canvasEl.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvasEl.width = Math.floor(w * dpr);
      canvasEl.height = Math.floor(h * dpr);
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const min = Math.min(w, h);
      const desiredSegments = Math.round(min / 30);
      segmentCount = Math.round(clamp(desiredSegments, 18, 32));
      segmentSpacing = Math.max(6, min * 0.012);
      sampleStride = Math.max(1, Math.round(segmentCount / 12));
      pathSpacing = Math.max(4, segmentSpacing * 0.6);
      maxPathPoints = Math.round((min / pathSpacing) * 12);
      buildDots();
      buildStars();
      buildContours();
      pathPoints = [];
      pathNeedsInit = true;
    }

    function draw(now: number) {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (pausedRef.current) {
        rafRef.current = null;
        return;
      }
      const dt = Math.min(0.033, Math.max(0.008, (now - last) * 0.001));
      last = now;
      const nowSec = now * 0.001;

      const transition = transitionRef.current;
      let paletteState = paletteCurrentRef.current;
      if (transition) {
        const t = clamp((now - transition.start) / transition.duration, 0, 1);
        const eased = t * t * (3 - 2 * t);
        paletteState = {
          background: lerpRgb(transition.from.background, transition.to.background, eased),
          dot: lerpRgb(transition.from.dot, transition.to.dot, eased),
          glow: lerpRgb(transition.from.glow, transition.to.glow, eased),
          border: lerpRgba(transition.from.border, transition.to.border, eased),
          dotAlphaScale: lerp(transition.from.dotAlphaScale, transition.to.dotAlphaScale, eased),
          wakeAlphaScale: lerp(transition.from.wakeAlphaScale, transition.to.wakeAlphaScale, eased),
          dotRadiusScale: lerp(
            transition.from.dotRadiusScale,
            transition.to.dotRadiusScale,
            eased,
          ),
        };
        paletteCurrentRef.current = paletteState;
        if (t >= 1) {
          transitionRef.current = null;
          paletteCurrentRef.current = transition.to;
          paletteState = transition.to;
        }
      } else if (paletteTargetRef.current) {
        paletteState = paletteTargetRef.current;
        paletteCurrentRef.current = paletteState;
      }

      const containerEl = containerRef.current;
      const backgroundAlpha = backgroundOpacityRef.current;
      if (containerEl) {
        containerEl.style.background =
          backgroundAlpha > 0.01
            ? formatRgba(paletteState.background, backgroundAlpha)
            : "transparent";
      }
      const frameEl = frameRef.current;
      if (frameEl) {
        frameEl.style.borderColor = formatRgbaValue(paletteState.border);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (backgroundAlpha > 0.01) {
        ctx.globalAlpha = backgroundAlpha;
        ctx.fillStyle = formatRgb(paletteState.background);
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      let warpProgress = 0;
      let warpDirection: StarWarpDirection = "up";
      let warpEntering = false;
      const starWarp = starWarpRef.current;
      const warpActive = starWarp !== null;
      if (starWarp) {
        const t = clamp((now - starWarp.start) / starWarp.duration, 0, 1);
        warpProgress = t;
        warpDirection = starWarp.direction;
        warpEntering = starWarp.entering;
        if (t >= 1) {
          starWarpRef.current = null;
        }
      }

      let warpOffset = 0;
      let warpPad = 0;
      let warpFadeLine = 0;
      let warpFadeBand = 0;
      const warpEaseValue = warpEntering
        ? easeOutCubic(warpProgress)
        : easeInCubic(warpProgress);
      if (warpActive) {
        const fieldSize = Math.min(w, h);
        warpPad = Math.max(18, fieldSize * 0.08);
        warpFadeBand = Math.max(28, fieldSize * 0.1);
        const warpDistance = h + warpPad * 2;
        const dirSign = warpDirection === "up" ? -1 : 1;
        warpOffset = dirSign * warpDistance * (warpEntering ? warpEaseValue - 1 : warpEaseValue);
        warpFadeLine = h + warpFadeBand - (h + warpFadeBand * 2) * warpEaseValue;
      }

      const serpentStrength = clamp01(serpentVisibilityRef.current);

      let starAlpha = starAlphaRef.current;
      const starsEnabled = starVisibilityRef.current > 0.01;
      if (!starsEnabled) {
        starTransitionRef.current = null;
        starAlphaRef.current = 0;
        starAlpha = 0;
      } else {
        const starTransition = starTransitionRef.current;
        if (starTransition) {
          const t = clamp((now - starTransition.start) / starTransition.duration, 0, 1);
          const eased = t * t * (3 - 2 * t);
          starAlpha = lerp(starTransition.from, starTransition.to, eased);
          starAlphaRef.current = starAlpha;
          if (t >= 1) {
            starTransitionRef.current = null;
          }
        } else {
          starAlpha = starTargetRef.current;
          starAlphaRef.current = starAlpha;
        }
      }

      const baseStarStrength = starAlpha * 0.7;
      const starStrength = baseStarStrength;
      if (starsEnabled && starStrength > 0.02 && stars.length) {
        const starColor = lerpRgb(paletteState.dot, WHITE, 0.5);
        ctx.save();
        ctx.fillStyle = formatRgb(starColor);
        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          const drawY = warpActive ? star.y + warpOffset : star.y;
          if (warpActive && (drawY < -warpPad || drawY > h + warpPad)) continue;
          const twinkle = 0.65 + 0.35 * Math.sin(nowSec * star.tw + star.phase);
          let fadeAlpha = 1;
          if (warpActive && !warpEntering) {
            if (drawY >= warpFadeLine + warpFadeBand) {
              fadeAlpha = 0;
            } else if (drawY > warpFadeLine - warpFadeBand) {
              fadeAlpha = (warpFadeLine + warpFadeBand - drawY) / (2 * warpFadeBand);
            }
          }
          const alpha = star.a * twinkle * starStrength * fadeAlpha;
          if (alpha < 0.02) continue;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(star.x, drawY, star.r, 0, twoPi);
          ctx.fill();
        }
        ctx.restore();
      }

      if (serpentStrength <= 0.01) {
        const idle =
          starAlpha <= 0.01 &&
          !transitionRef.current &&
          !dotStyleTransitionRef.current &&
          !starTransitionRef.current &&
          !starWarpRef.current;
        if (idle) {
          rafRef.current = null;
          return;
        }
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const min = Math.min(w, h);

      if (pathNeedsInit) resetHead(nowSec);

      let lifeAge = nowSec - lifeStart;
      let totalDuration = lifeDuration + respawnDelay;
      if (lifeAge >= totalDuration) {
        resetHead(nowSec);
        lifeAge = 0;
        totalDuration = lifeDuration + respawnDelay;
      }
      const lifePaused = lifeAge >= lifeDuration;

      const growT = clamp(lifeAge / growDuration, 0, 1);
      const fadeDuration = Math.min(0.6, lifeDuration * 0.25);
      const fadeOutT = clamp((lifeAge - (lifeDuration - fadeDuration)) / fadeDuration, 0, 1);
      const growEase = 1 - Math.pow(1 - growT, 2);
      const fadeEase = 1 - Math.pow(1 - fadeOutT, 2);
      const visibility = growEase * (1 - fadeEase);
      const growthWidth = 0.2 + 0.8 * growEase;
      const scaleVisibility = clamp((growEase - 0.2) / 0.8, 0, 1) * (1 - fadeEase);
      const overlayAlpha = scaleVisibility * 0.35;
      const activeSegments = lifePaused
        ? 0
        : Math.max(1, Math.round(1 + (segmentCount - 1) * growEase));

      const snakeSpeed = min * 0.12;
      const samples: Sample[] = [];
      if (!lifePaused) {
        const selfAvoidRadius = segmentSpacing * 4.2;
        const pathAvoidRadius = selfAvoidRadius * 1.2;
        const tailLength = segmentCount * segmentSpacing;
        const pathIgnore = Math.max(12, Math.round(tailLength / Math.max(1, pathSpacing)));
        const pathLimit = Math.max(0, pathPoints.length - pathIgnore);
        const pathStride = Math.max(1, Math.round(pathLimit / 180));

        if (nowSec - segmentStart >= segmentDuration) {
          const r = Math.random() * 2 - 1;
          const mag = 0.35 + 0.65 * Math.pow(Math.abs(r), 1.2);
          const bias = (r === 0 ? 1 : Math.sign(r)) * mag;
          let candidate = wrapAngle(headAngle + bias * maxTurn);
          const avoidStart = Math.min(6, activeSegments - 1);
          const avoidStride = Math.max(1, sampleStride);
          if (segments.length > avoidStart) {
            const lookahead = segmentSpacing * 6;
            let bestScore = -Infinity;
            let bestAngle = candidate;
            for (let attempt = 0; attempt < 6; attempt++) {
              const angle =
                attempt === 0
                  ? candidate
                  : wrapAngle(headAngle + (Math.random() * 2 - 1) * maxTurn);
              const px = headX + Math.cos(angle) * lookahead;
              const py = headY + Math.sin(angle) * lookahead;
              const edgeDist = Math.min(px, w - px, py, h - py);
              const segmentDist =
                segments.length > avoidStart
                  ? minDistanceToPath(px, py, segments, avoidStart, avoidStride, activeSegments)
                  : Infinity;
              const trailDist =
                pathLimit > 0
                  ? minDistanceToPath(px, py, pathPoints, 0, pathStride, pathLimit)
                  : Infinity;
              const score = Math.min(edgeDist, segmentDist, trailDist);
              if (score > bestScore) {
                bestScore = score;
                bestAngle = angle;
              }
            }
            candidate = bestAngle;
          }
          const diff = wrapAngle(candidate - headAngle);
          const enforced = enforceMinTurn(diff, maxTurn * 0.22);
          candidate = wrapAngle(headAngle + enforced);
          startCurve(nowSec, enforced);
        }

        const edgePad = min * 0.12;
        const distLeft = headX - edgePad;
        const distRight = w - edgePad - headX;
        const distTop = headY - edgePad;
        const distBottom = h - edgePad - headY;
        const edgeDistance = Math.min(distLeft, distRight, distTop, distBottom);
        const edgeInfluence = clamp(1 - edgeDistance / edgePad, 0, 1);
        const centerAngle = Math.atan2(h * 0.5 - headY, w * 0.5 - headX);
        wavePhase += waveSpeed * dt;
        if (wavePhase > twoPi) wavePhase -= twoPi;
        const waveOffset = Math.sin(wavePhase) * waveAmplitude * waveDirection;
        const desiredAngle = wrapAngle(waveBaseAngle + waveOffset);
        const toTarget = wrapAngle(desiredAngle - headAngle);
        const toCenter = wrapAngle(centerAngle - headAngle);
        let steer = toTarget * (1 - edgeInfluence) + toCenter * edgeInfluence * 0.5;
        steer *= steerWeight;

        const avoidStart = Math.min(6, activeSegments - 1);
        const avoidStride = Math.max(1, sampleStride);
        let avoidX = 0;
        let avoidY = 0;
        let minSelfDist = Infinity;
        let minPathDist = Infinity;
        let avoidAngle = headAngle;
        let hasAvoid = false;
        if (segments.length > avoidStart) {
          for (let i = avoidStart; i < activeSegments; i += avoidStride) {
            const seg = segments[i];
            const dx = headX - seg.x;
            const dy = headY - seg.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minSelfDist) minSelfDist = dist;
            if (dist < selfAvoidRadius && dist > 0.001) {
              const weight = (selfAvoidRadius - dist) / selfAvoidRadius;
              avoidX += (dx / dist) * weight;
              avoidY += (dy / dist) * weight;
            }
          }
        }
        if (pathLimit > 0) {
          for (let i = 0; i < pathLimit; i += pathStride) {
            const pt = pathPoints[i];
            const dx = headX - pt.x;
            const dy = headY - pt.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minPathDist) minPathDist = dist;
            if (dist < pathAvoidRadius && dist > 0.001) {
              const weight = (pathAvoidRadius - dist) / pathAvoidRadius;
              avoidX += (dx / dist) * weight * 1.1;
              avoidY += (dy / dist) * weight * 1.1;
            }
          }
        }
        const selfInfluence = clamp((selfAvoidRadius - minSelfDist) / selfAvoidRadius, 0, 1);
        const pathInfluence = clamp((pathAvoidRadius - minPathDist) / pathAvoidRadius, 0, 1);
        const avoidInfluence = clamp(Math.max(selfInfluence, pathInfluence), 0, 1);
        if (avoidInfluence > 0.001 && (avoidX !== 0 || avoidY !== 0)) {
          avoidAngle = Math.atan2(avoidY, avoidX);
          hasAvoid = true;
          const toAvoid = wrapAngle(avoidAngle - headAngle);
          const avoidBlend = clamp(avoidInfluence * 1.1, 0, 0.98);
          steer = steer * (1 - avoidBlend) + toAvoid * avoidBlend;
        }
        if (
          hasAvoid &&
          (minSelfDist < selfAvoidRadius * 0.7 || minPathDist < pathAvoidRadius * 0.7)
        ) {
          startCurve(
            nowSec,
            wrapAngle(avoidAngle - headAngle),
            Math.max(0.2, randomTurnDuration() * 0.6),
          );
          steer = wrapAngle(avoidAngle - headAngle);
        }

        const steerStepLimit = maxTurnRate * dt * (1 + avoidInfluence * 2);
        const targetTurnStep = clamp(steer, -steerStepLimit, steerStepLimit);
        const turnEase = clamp(dt * 6, 0, 1);
        turnVelocity += (targetTurnStep - turnVelocity) * turnEase;
        const minTurnStep = minTurnRate * dt;
        const forcedSign = waveDirection === 0 ? (turnVelocity >= 0 ? 1 : -1) : waveDirection;
        if (Math.abs(turnVelocity) < minTurnStep) {
          turnVelocity = forcedSign * minTurnStep;
        }
        headAngle = wrapAngle(headAngle + turnVelocity);

        headX += Math.cos(headAngle) * snakeSpeed * dt;
        headY += Math.sin(headAngle) * snakeSpeed * dt;

        const bouncePad = edgePad * 0.6;
        let bounced = false;
        if (headX < bouncePad) {
          headX = bouncePad;
          headAngle = Math.PI - headAngle;
          bounced = true;
        } else if (headX > w - bouncePad) {
          headX = w - bouncePad;
          headAngle = Math.PI - headAngle;
          bounced = true;
        }
        if (headY < bouncePad) {
          headY = bouncePad;
          headAngle = -headAngle;
          bounced = true;
        } else if (headY > h - bouncePad) {
          headY = h - bouncePad;
          headAngle = -headAngle;
          bounced = true;
        }
        if (bounced) {
          startCurve(nowSec, enforceMinTurn((Math.random() * 2 - 1) * maxTurn, maxTurn * 0.25));
        }

        if (!pathPoints.length) {
          pathPoints = [{ x: headX, y: headY }];
        } else {
          const lastPoint = pathPoints[pathPoints.length - 1];
          if (Math.hypot(headX - lastPoint.x, headY - lastPoint.y) >= pathSpacing) {
            pathPoints.push({ x: headX, y: headY });
            if (pathPoints.length > maxPathPoints) {
              pathPoints.splice(0, pathPoints.length - maxPathPoints);
            }
          }
        }

        if (!segments.length) {
          segments = seedSegments();
        }

        segments[0].x = headX;
        segments[0].y = headY;
        const follow = 0.72;
        for (let i = 1; i < segments.length; i++) {
          const prev = segments[i - 1];
          const seg = segments[i];
          let dx = seg.x - prev.x;
          let dy = seg.y - prev.y;
          let dist = Math.hypot(dx, dy);
          if (dist < 0.001) {
            dx = -Math.cos(headAngle);
            dy = -Math.sin(headAngle);
            dist = 1;
          }
          const dirX = dx / dist;
          const dirY = dy / dist;
          const desiredX = prev.x + dirX * segmentSpacing;
          const desiredY = prev.y + dirY * segmentSpacing;
          seg.x += (desiredX - seg.x) * follow;
          seg.y += (desiredY - seg.y) * follow;
        }

        for (let i = 0; i < Math.min(activeSegments, segments.length); i += sampleStride) {
          const seg = segments[i];
          let tngX = Math.cos(headAngle);
          let tngY = Math.sin(headAngle);
          if (i > 0) {
            const prev = segments[i - 1];
            const dx = prev.x - seg.x;
            const dy = prev.y - seg.y;
            const len = Math.hypot(dx, dy) || 1;
            tngX = dx / len;
            tngY = dy / len;
          }
          const wBase = 1 - i / Math.max(1, segments.length - 1);
          const wEase = wBase * wBase * (3 - 2 * wBase);
          const w = clamp(0.25 + 0.75 * wEase, 0, 1);
          samples.push({ x: seg.x, y: seg.y, tngX, tngY, w });
        }
      }

      const bodyRadius = min * 0.008 * growthWidth;
      const bodyLength = segmentSpacing * (0.9 + 1.7 * growEase);
      const strength = 80 * visibility;
      const returnStrength = 0.42;
      const baseReturn = 0.012;
      const dragNear = 0.985;
      const dragFar = 0.972;
      const wakeScale = 0.01;
      const radialPush = 0.4;
      const forwardPush = 0.2;
      const swirlPush = 0.24;

      const dotAlphaScale = paletteState.dotAlphaScale * serpentStrength;
      const wakeAlphaScale = paletteState.wakeAlphaScale * serpentStrength;
      const dotRadiusScale = paletteState.dotRadiusScale;
      const dotDensity = dotDensityRef.current;
      let dotStyleFrom = dotStyleCurrentRef.current;
      let dotStyleTo = dotStyleCurrentRef.current;
      let styleMix = 1;
      const styleTransition = dotStyleTransitionRef.current;
      if (styleTransition) {
        const t = clamp((now - styleTransition.start) / styleTransition.duration, 0, 1);
        const eased = t * t * (3 - 2 * t);
        dotStyleFrom = styleTransition.from;
        dotStyleTo = styleTransition.to;
        styleMix = eased;
        if (t >= 1) {
          dotStyleCurrentRef.current = styleTransition.to;
          dotStyleTransitionRef.current = null;
          dotStyleFrom = styleTransition.to;
          dotStyleTo = styleTransition.to;
          styleMix = 1;
        }
      }

      if (dotStyleTo === "bloom") {
        const baseAlpha = 0.45 * dotAlphaScale;
        const minSize = Math.min(w, h);
        const driftX = minSize * 0.08;
        const driftY = minSize * 0.05;
        const centers = [
          { x: w * 0.2, y: h * 0.25, r: minSize * 0.35, phase: 0.0 },
          { x: w * 0.7, y: h * 0.35, r: minSize * 0.42, phase: 1.4 },
          { x: w * 0.5, y: h * 0.7, r: minSize * 0.5, phase: 2.6 },
        ];

        ctx.globalAlpha = baseAlpha;
        for (const blob of centers) {
          const cx = blob.x + Math.sin(nowSec * 0.08 + blob.phase) * driftX;
          const cy = blob.y + Math.cos(nowSec * 0.07 + blob.phase) * driftY;
          const radius = blob.r * (0.85 + 0.08 * Math.sin(nowSec * 0.09 + blob.phase));
          const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
          grad.addColorStop(0, formatRgba(paletteState.dot, 0.55));
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, twoPi);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (dotStyleTo === "ripple") {
        const spacing = Math.max(20, min * 0.055);
        const step = Math.max(14, Math.round(min * 0.018));
        const baseAlpha = 0.18 * dotAlphaScale;
        const lineWidth = Math.max(0.55, min * 0.0011) * dotRadiusScale;
        const margin = spacing * 0.4;

        const rand = (n: number) => {
          const val = Math.sin(n * 12.9898) * 43758.5453;
          return val - Math.floor(val);
        };

        ctx.strokeStyle = formatRgb(paletteState.dot);
        ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;

        let y = margin;
        let i = 0;
        while (y < h - margin) {
          const seed = rand(i + 1.3);
          const spacingScale = 0.65 + rand(i + 2.8) * 0.7;
          const freq = 0.003 + rand(i + 3.9) * 0.0035;
          const phase = rand(i + 5.1) * twoPi;
          const speed = 0.08 + rand(i + 6.4) * 0.12;
          const amp = spacing * (0.18 + rand(i + 7.7) * 0.2);
          const alpha = baseAlpha * (0.7 + seed * 0.5);

          ctx.globalAlpha = alpha;
          ctx.beginPath();
          for (let x = -step; x <= w + step; x += step) {
            const wave = Math.sin(x * freq + phase + nowSec * speed) * amp;
            const yPos = y + wave;
            if (x <= -step) {
              ctx.moveTo(x, yPos);
            } else {
              ctx.lineTo(x, yPos);
            }
          }
          ctx.stroke();
          y += spacing * spacingScale;
          i += 1;
        }
      } else if (dotStyleTo === "contour") {
        const baseAlpha = 0.22 * dotAlphaScale;
        const lineWidth = Math.max(0.5, min * 0.001) * dotRadiusScale;
        const step = Math.max(12, Math.round(min * 0.015));
        const influenceX = min * 0.22;
        const influenceY = min * 0.12;
        const liftScale = min * 0.06 * visibility;
        const minGap = contourSpacing * 0.45;
        const margin = contourSpacing * 0.25;

        ctx.strokeStyle = formatRgb(paletteState.dot);
        ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;

        const lineCount = contourLines.length;
        if (lineCount > 0) {
          const linePoints: { x: number; y: number }[][] = new Array(lineCount)
            .fill(0)
            .map(() => []);
          const lineAlphas = contourLines.map(
            (line) => baseAlpha * (0.7 + line.amp * 0.3),
          );

          for (let x = -step; x <= w + step; x += step) {
            const yValues = new Array(lineCount);
            for (let i = 0; i < lineCount; i++) {
              const line = contourLines[i];
              const wobble =
                Math.sin(x * line.freq + line.phase + nowSec * line.speed) * line.wobble;
              const baseY = line.y + wobble;
              let lift = 0;
              for (let j = 0; j < samples.length; j++) {
                const s = samples[j];
                const dx = x - s.x;
                const dy = baseY - s.y;
                const falloff =
                  Math.exp(
                    -(dx * dx) / (influenceX * influenceX) -
                      (dy * dy) / (influenceY * influenceY),
                  ) *
                  (0.35 + s.w * 0.65);
                lift += falloff;
              }
              yValues[i] = baseY - lift * liftScale * line.amp;
            }

            let prev = margin;
            for (let i = 0; i < lineCount; i++) {
              const clamped = Math.max(yValues[i], prev + minGap);
              yValues[i] = clamped;
              prev = clamped;
            }
            const overflow = yValues[lineCount - 1] - (h - margin);
            if (overflow > 0) {
              for (let i = 0; i < lineCount; i++) {
                yValues[i] -= overflow;
              }
            }
            const underflow = margin - yValues[0];
            if (underflow > 0) {
              for (let i = 0; i < lineCount; i++) {
                yValues[i] += underflow;
              }
            }

            for (let i = 0; i < lineCount; i++) {
              linePoints[i].push({ x, y: yValues[i] });
            }
          }

          for (let i = 0; i < lineCount; i++) {
            const points = linePoints[i];
            if (points.length < 2) continue;
            ctx.globalAlpha = lineAlphas[i];
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let p = 1; p < points.length; p++) {
              ctx.lineTo(points[p].x, points[p].y);
            }
            ctx.stroke();
          }
        }
      } else {
        if (dotStyleTo === "dash" || dotStyleFrom === "dash") {
          ctx.strokeStyle = formatRgb(paletteState.dot);
          ctx.lineCap = "round";
        } else {
          ctx.fillStyle = formatRgb(paletteState.dot);
        }
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          if (dot.seed > dotDensity) continue;
          let infl = 0;
          let pushX = 0;
          let pushY = 0;
          for (let j = 0; j < samples.length; j++) {
            const sample = samples[j];
            const dx = dot.x - sample.x;
            const dy = dot.y - sample.y;
            const s = dx * sample.tngX + dy * sample.tngY;
            const d = dx * -sample.tngY + dy * sample.tngX;
            const sInfl = Math.exp(-(s * s) / (2 * bodyLength * bodyLength));
            const dInfl = Math.exp(-(d * d) / (2 * bodyRadius * bodyRadius));
            const weight = sInfl * dInfl * sample.w;
            if (weight > 0.00002) {
              const side = d >= 0 ? 1 : -1;
              const radialX = -sample.tngY * side;
              const radialY = sample.tngX * side;
              const swirlX = -radialY;
              const swirlY = radialX;
              pushX +=
                (radialX * radialPush + sample.tngX * forwardPush + swirlX * swirlPush) *
                weight;
              pushY +=
                (radialY * radialPush + sample.tngY * forwardPush + swirlY * swirlPush) *
                weight;
              if (weight > infl) infl = weight;
            }
          }

          if (infl > 0.00001) {
            dot.vx += pushX * strength * dt;
            dot.vy += pushY * strength * dt;
          }

          const visibleInfl = infl * visibility;
          const away = 1 - Math.min(1, visibleInfl * 5);
          const returnMix = baseReturn + away * (1 - baseReturn);
          dot.vx += (dot.rx - dot.x) * returnStrength * returnMix * dt;
          dot.vy += (dot.ry - dot.y) * returnStrength * returnMix * dt;

          const drag = dragFar + (dragNear - dragFar) * Math.min(1, visibleInfl * 6);
          dot.vx *= Math.pow(drag, dt * 60);
          dot.vy *= Math.pow(drag, dt * 60);

          dot.x += dot.vx * dt;
          dot.y += dot.vy * dt;

          if (dot.x < 0) {
            dot.x = 0;
            dot.vx = 0;
          } else if (dot.x > w) {
            dot.x = w;
            dot.vx = 0;
          }

          if (dot.y < 0) {
            dot.y = 0;
            dot.vy = 0;
          } else if (dot.y > h) {
            dot.y = h;
            dot.vy = 0;
          }

          const speed = Math.hypot(dot.vx, dot.vy);
          const wake = Math.min(1, visibleInfl * 2.2 + speed * wakeScale);
          const baseAlpha = Math.min(1, dot.a * dotAlphaScale + wake * 0.45 * wakeAlphaScale);
          const needsDash = dotStyleFrom === "dash" || dotStyleTo === "dash";
          if (needsDash && speed > 0.01) {
            const targetAngle = Math.atan2(dot.vy, dot.vx);
            const delta = wrapAngle(targetAngle - dot.angle);
            const angleEase = clamp(dt * 6, 0, 1);
            dot.angle = wrapAngle(dot.angle + delta * angleEase);
          }

          const drawDotStyle = (style: DotStyle, alpha: number) => {
            if (alpha <= 0.001) return;
            ctx.globalAlpha = alpha;
            if (style === "dash") {
              const length = dot.r * (6.6 + wake * 2.4) * dotRadiusScale;
              const half = length * 0.5;
              const cos = Math.cos(dot.angle);
              const sin = Math.sin(dot.angle);
              const dx = cos * half;
              const dy = sin * half;
              const px = -sin;
              const py = cos;
              const wobble = Math.sin(nowSec * 0.6 + dot.seed * 7.2) * 0.2;
              const curve = (dot.seed - 0.5) * 0.7 + wobble;
              const bend = length * 0.18 * curve;
              const cx = dot.x + px * bend;
              const cy = dot.y + py * bend;
              const base = ctx.globalAlpha;
              const lineWidth = Math.max(0.6, dot.r * 0.85) * dotRadiusScale;
              ctx.lineWidth = lineWidth;
              ctx.beginPath();
              ctx.moveTo(dot.x - dx, dot.y - dy);
              ctx.quadraticCurveTo(cx, cy, dot.x + dx, dot.y + dy);
              ctx.stroke();
              const tailCenterX = dot.x - cos * length * 0.2;
              const tailCenterY = dot.y - sin * length * 0.2;
              const tailHalf = length * 0.22;
              const tailDx = cos * tailHalf;
              const tailDy = sin * tailHalf;
              const tailCx = tailCenterX + px * bend * 0.6;
              const tailCy = tailCenterY + py * bend * 0.6;
              ctx.globalAlpha = base * 0.45;
              ctx.lineWidth = lineWidth * 0.7;
              ctx.beginPath();
              ctx.moveTo(tailCenterX - tailDx, tailCenterY - tailDy);
              ctx.quadraticCurveTo(tailCx, tailCy, tailCenterX + tailDx, tailCenterY + tailDy);
              ctx.stroke();
              ctx.globalAlpha = base;
            } else if (style === "cloud") {
              const base = ctx.globalAlpha;
              const cloudRadius = dot.r * (1.6 + wake * 0.5) * dotRadiusScale;
              const offset = cloudRadius * 0.9;
              const ox = Math.cos(dot.angle) * offset;
              const oy = Math.sin(dot.angle) * offset;
              ctx.globalAlpha = base * 0.85;
              ctx.beginPath();
              ctx.arc(dot.x, dot.y, cloudRadius * 1.05, 0, twoPi);
              ctx.fill();
              ctx.globalAlpha = base * 0.7;
              ctx.beginPath();
              ctx.arc(dot.x + ox * 0.7, dot.y + oy * 0.7, cloudRadius * 0.85, 0, twoPi);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(dot.x - ox * 0.6, dot.y - oy * 0.6, cloudRadius * 0.75, 0, twoPi);
              ctx.fill();
              ctx.globalAlpha = base;
            } else {
              ctx.beginPath();
              const r = dot.r * (1 + wake * 0.25) * dotRadiusScale;
              ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
              ctx.fill();
            }
          };

          if (
            (dotStyleFrom === "dot" || dotStyleFrom === "dash") &&
            (dotStyleTo === "dot" || dotStyleTo === "dash") &&
            dotStyleFrom !== dotStyleTo
          ) {
            drawDotStyle(dotStyleFrom, baseAlpha * (1 - styleMix));
            drawDotStyle(dotStyleTo, baseAlpha * styleMix);
          } else {
            drawDotStyle(dotStyleTo, baseAlpha);
          }
        }
      }
      ctx.globalAlpha = 1;

      if (overlayAlpha > 0.02 && samples.length > 0) {
        const head = samples[0];
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        const r = bodyRadius * (5 + 6 * growthWidth);
        const grad = ctx.createRadialGradient(head.x, head.y, r * 0.1, head.x, head.y, r);
        grad.addColorStop(0, `rgba(0, 0, 0, ${0.12 * overlayAlpha})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (visibility > 0.05 && samples.length > 0) {
        const head = samples[0];
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const glowRadius = bodyRadius * (6 + 7 * growthWidth);
        const glow = ctx.createRadialGradient(
          head.x,
          head.y,
          glowRadius * 0.1,
          head.x,
          head.y,
          glowRadius,
        );
        glow.addColorStop(0, formatRgba(paletteState.glow, 0.04 * visibility));
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(head.x, head.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          const alpha = 0.015 * visibility * s.w;
          if (alpha < 0.005) continue;
          ctx.fillStyle = formatRgba(paletteState.glow, alpha);
          ctx.beginPath();
          ctx.arc(s.x, s.y, bodyRadius * (0.6 + s.w), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    const startLoop = () => {
      if (rafRef.current !== null || pausedRef.current) return;
      last = performance.now();
      rafRef.current = requestAnimationFrame(draw);
    };
    startLoopRef.current = startLoop;
    startLoop();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startLoopRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        background: palette.background,
        pointerEvents: "none",
      }}
    >
      <div
        ref={frameRef}
        style={{
          borderRadius: 0,
          background: "transparent",
          border: `1px solid ${palette.border}`,
          boxShadow: "none",
          overflow: "hidden",
          position: "absolute",
          inset: frameMargin,
        }}
      >
        <canvas
          ref={canvasRef}
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
