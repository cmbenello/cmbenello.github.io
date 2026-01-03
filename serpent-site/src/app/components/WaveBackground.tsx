"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type WaveBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  lineColor?: string;
  backgroundColor?: string;
  paused?: boolean;
};

type WaveLine = {
  path: Path2D;
  y: number;
  width: number;
  offset: number;
  phase: number;
};

type WaveLayer = {
  lines: WaveLine[];
  speed: number;
  sway: number;
  swaySpeed: number;
  opacity: number;
};

type WaveLayerSpec = {
  spacingScale: number;
  amplitudeScale: number;
  duration: number;
  swayDuration: number;
  opacity: number;
  primaryStride: number;
  direction: 1 | -1;
};

const MAX_DPR = 1.5;
const TWO_PI = Math.PI * 2;
const BASE_SEED = 42811;
const LAYER_SPECS: WaveLayerSpec[] = [
  {
    spacingScale: 1,
    amplitudeScale: 1,
    duration: 130,
    swayDuration: 90,
    opacity: 0.34,
    primaryStride: 4,
    direction: -1,
  },
  {
    spacingScale: 1.2,
    amplitudeScale: 0.85,
    duration: 170,
    swayDuration: 120,
    opacity: 0.24,
    primaryStride: 5,
    direction: -1,
  },
  {
    spacingScale: 1.45,
    amplitudeScale: 1.05,
    duration: 210,
    swayDuration: 150,
    opacity: 0.18,
    primaryStride: 6,
    direction: -1,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mod = (value: number, modulus: number) =>
  ((value % modulus) + modulus) % modulus;
const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const buildWavePath = (
  segments: number,
  segmentWidth: number,
  amplitude: number,
  rand: () => number,
) => {
  const path = new Path2D();
  path.moveTo(0, 0);
  for (let index = 0; index < segments; index += 1) {
    const x = index * segmentWidth;
    const crest = amplitude * (0.85 + rand() * 0.25);
    const trough = amplitude * (0.55 + rand() * 0.2);
    const crestLead = 0.16 + rand() * 0.08;
    const crestPeak = 0.4 + rand() * 0.08;
    const troughLead = 0.58 + rand() * 0.06;
    const troughTail = 0.86 + rand() * 0.06;

    path.bezierCurveTo(
      x + segmentWidth * crestLead,
      -crest * 1.15,
      x + segmentWidth * crestPeak,
      -crest * 0.95,
      x + segmentWidth * 0.5,
      0,
    );
    path.bezierCurveTo(
      x + segmentWidth * troughLead,
      trough * 0.6,
      x + segmentWidth * troughTail,
      trough * 0.2,
      x + segmentWidth,
      0,
    );
  }
  return path;
};

export default function WaveBackground({
  frameMargin = 32,
  opacity = 1,
  lineColor = "rgba(255, 255, 255, 0.8)",
  backgroundColor = "rgba(40, 58, 90, 1)",
  paused = false,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineColorRef = useRef(lineColor);
  const rafRef = useRef<number | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    lineColorRef.current = lineColor;
  }, [lineColor]);

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

    let w = 1;
    let h = 1;
    let dpr = 1;
    let tileWidth = 1;
    let layers: WaveLayer[] = [];
    let startTime = performance.now();

    const buildLayers = () => {
      const baseSpacing = clamp(h * 0.022, 10, 20);
      const baseStroke = clamp(baseSpacing * 0.09, 0.6, 1.2);
      const baseAmplitude = baseSpacing * 0.4;
      const segmentWidth = clamp(w * 0.18, 140, 240);
      const segments = Math.max(4, Math.ceil(w / segmentWidth) + 2);
      tileWidth = segments * segmentWidth;
      layers = LAYER_SPECS.map((spec, layerIndex) => {
        const rand = createSeededRandom(BASE_SEED + layerIndex * 997);
        const spacing = baseSpacing * spec.spacingScale;
        const amplitude = baseAmplitude * spec.amplitudeScale;
        const lineCount = Math.ceil((h + spacing * 3) / spacing);
        const lines: WaveLine[] = [];
        let y = -spacing * 1.5 + rand() * spacing * 0.15;

        for (let i = 0; i < lineCount; i += 1) {
          const jitter = (rand() - 0.5) * spacing * 0.12;
          const lineY = y + jitter;
          const thickness =
            i % spec.primaryStride === 0
              ? baseStroke * 1.35
              : baseStroke * 0.85;
          const lineAmp = amplitude * (0.95 + rand() * 0.1);
          const path = buildWavePath(segments, segmentWidth, lineAmp, rand);
          lines.push({
            path,
            y: lineY,
            width: thickness,
            offset: rand() * tileWidth,
            phase: rand() * TWO_PI,
          });
          y += spacing;
        }

        return {
          lines,
          speed: (spec.direction * tileWidth) / spec.duration,
          sway: amplitude * 0.65,
          swaySpeed: TWO_PI / spec.swayDuration,
          opacity: spec.opacity,
        };
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLayers();
    };

    const draw = (now: number) => {
      if (pausedRef.current) {
        rafRef.current = null;
        return;
      }
      const elapsed = (now - startTime) * 0.001;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = lineColorRef.current;

      for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
        const layer = layers[layerIndex];
        const drift = mod(elapsed * layer.speed, tileWidth);
        const swayBase = Math.sin(elapsed * layer.swaySpeed + layerIndex);
        ctx.globalAlpha = layer.opacity;

        for (let i = 0; i < layer.lines.length; i += 1) {
          const line = layer.lines[i];
          const sway =
            layer.sway *
            Math.sin(elapsed * layer.swaySpeed + line.phase);
          const lineY = line.y + swayBase * sway;
          const offset = mod(drift + line.offset, tileWidth);
          ctx.save();
          ctx.translate(-offset, lineY);
          ctx.lineWidth = line.width;
          ctx.stroke(line.path);
          ctx.translate(tileWidth, 0);
          ctx.stroke(line.path);
          ctx.restore();
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    const startLoop = () => {
      if (rafRef.current !== null || pausedRef.current) return;
      startTime = performance.now();
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
