"use client";

import { useEffect, useRef } from "react";

type CloudPalette = {
  skyTop: string;
  skyBottom: string;
  stroke: string;
  fill: string;
  mist: string;
};

export const LIGHT_CLOUD_PALETTE: CloudPalette = {
  skyTop: "#f9eed2",
  skyBottom: "#f6e7c6",
  stroke: "rgba(225, 77, 82, 0.9)",
  fill: "rgba(225, 77, 82, 0.18)",
  mist: "rgba(225, 77, 82, 0.1)",
};

export const DARK_CLOUD_PALETTE: CloudPalette = {
  skyTop: "#141517",
  skyBottom: "#1c2027",
  stroke: "rgba(230, 225, 216, 0.5)",
  fill: "rgba(230, 225, 216, 0.12)",
  mist: "rgba(230, 225, 216, 0.14)",
};

export const DEFAULT_CLOUD_PALETTE = LIGHT_CLOUD_PALETTE;

type CloudBackgroundProps = {
  frameMargin?: number;
  active?: boolean;
  palette?: CloudPalette;
  skyOpacity?: number;
};

type Cloud = {
  x: number;
  y: number;
  scale: number;
  speed: number;
  drift: number;
  sway: number;
  opacity: number;
  imageIndex: number;
  flip: number;
  tilt: number;
  phase: number;
  pulse: number;
  wander: number;
};

type Rgba = [number, number, number, number];

type CloudSource = {
  img: HTMLImageElement;
  width: number;
  height: number;
  maxDim: number;
};

type TintedCloud = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  maxDim: number;
};

const TWO_PI = Math.PI * 2;
const MODE_FADE_MS = 700;
const MAX_DPR = 1.5;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const parseColor = (value: string): Rgba => {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : hex;
    const number = Number.parseInt(full, 16);
    if (Number.isNaN(number)) return [0, 0, 0, 1];
    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;
    return [r, g, b, 1];
  }

  const match = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (!match) return [0, 0, 0, 1];
  const parts = match[1]
    .split(",")
    .map((part) => Number.parseFloat(part.trim()));
  return [
    Number.isNaN(parts[0]) ? 0 : parts[0],
    Number.isNaN(parts[1]) ? 0 : parts[1],
    Number.isNaN(parts[2]) ? 0 : parts[2],
    Number.isNaN(parts[3]) ? 1 : clamp01(parts[3]),
  ];
};

const tintCloudImage = (
  img: HTMLImageElement,
  stroke: Rgba,
  fill: Rgba,
) => {
  const width = img.naturalWidth || img.width || 1;
  const height = img.naturalHeight || img.height || 1;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { canvas, width, height, maxDim: Math.max(width, height) };
  }
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    if (alpha <= 0) continue;
    const lum = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
    const ink = Math.pow(1 - lum, 1.35);
    const mix = clamp01(ink);
    const r = fill[0] * (1 - mix) + stroke[0] * mix;
    const g = fill[1] * (1 - mix) + stroke[1] * mix;
    const b = fill[2] * (1 - mix) + stroke[2] * mix;
    const outAlpha = alpha * (fill[3] * (1 - mix) + stroke[3] * mix);
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
    data[i + 3] = Math.round(clamp01(outAlpha) * 255);
  }
  ctx.putImageData(imageData, 0, 0);
  return { canvas, width, height, maxDim: Math.max(width, height) };
};

const CLOUD_SOURCES = [
  "/clouds/cloud2.png",
  "/clouds/cloud3.png",
  "/clouds/cloud4.png",
  "/clouds/cloud6.png",
  "/clouds/cloud7.png",
  "/clouds/cloud8.png",
  "/clouds/cloud9.png",
  "/clouds/cloud10.png",
] as const;

export default function CloudBackground({
  frameMargin = 32,
  active = false,
  palette = DEFAULT_CLOUD_PALETTE,
  skyOpacity = 1,
}: CloudBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(active);
  const startLoopRef = useRef<(() => void) | null>(null);
  const paletteRef = useRef(palette);
  const paletteCurrentRef = useRef(palette);
  const paletteTargetRef = useRef(palette);
  const skyOpacityRef = useRef(skyOpacity);
  const tintRef = useRef<((nextPalette: CloudPalette) => void) | null>(null);
  const sourceImagesRef = useRef<CloudSource[]>([]);
  const tintedImagesRef = useRef<TintedCloud[]>([]);
  const tintedImagesNextRef = useRef<TintedCloud[] | null>(null);
  const imagesReadyRef = useRef(false);
  const tintTransitionRef = useRef<{ start: number; duration: number } | null>(null);

  useEffect(() => {
    paletteRef.current = palette;
    if (tintRef.current) {
      tintRef.current(palette);
    }
  }, [palette]);

  useEffect(() => {
    activeRef.current = active;
    if (active && startLoopRef.current) {
      startLoopRef.current();
    }
  }, [active]);

  useEffect(() => {
    skyOpacityRef.current = skyOpacity;
  }, [skyOpacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let clouds: Cloud[] = [];
    let last = performance.now();

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const createTintedImages = (nextPalette: CloudPalette) => {
      const stroke = parseColor(nextPalette.stroke);
      const fill = parseColor(nextPalette.fill);
      return sourceImagesRef.current.map((source) =>
        tintCloudImage(source.img, stroke, fill),
      );
    };

    const startTintTransition = (nextPalette: CloudPalette) => {
      if (!imagesReadyRef.current || sourceImagesRef.current.length === 0) {
        paletteCurrentRef.current = nextPalette;
        paletteTargetRef.current = nextPalette;
        tintedImagesRef.current = [];
        tintedImagesNextRef.current = null;
        tintTransitionRef.current = null;
        return;
      }

      if (!activeRef.current) {
        tintedImagesRef.current = createTintedImages(nextPalette);
        paletteCurrentRef.current = nextPalette;
        paletteTargetRef.current = nextPalette;
        tintedImagesNextRef.current = null;
        tintTransitionRef.current = null;
        return;
      }

      if (tintedImagesRef.current.length === 0) {
        tintedImagesRef.current = createTintedImages(nextPalette);
        paletteCurrentRef.current = nextPalette;
        paletteTargetRef.current = nextPalette;
        tintedImagesNextRef.current = null;
        tintTransitionRef.current = null;
        return;
      }

      tintedImagesNextRef.current = createTintedImages(nextPalette);
      paletteTargetRef.current = nextPalette;
      tintTransitionRef.current = {
        start: performance.now(),
        duration: MODE_FADE_MS,
      };
    };
    tintRef.current = startTintTransition;

    const loadImages = () => {
      const images = CLOUD_SOURCES.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
      let loaded = 0;
      const finalize = () => {
        sourceImagesRef.current = images.map((img) => {
          const width = img.naturalWidth || 1;
          const height = img.naturalHeight || 1;
          return {
            img,
            width,
            height,
            maxDim: Math.max(width, height),
          };
        });
        imagesReadyRef.current = true;
        startTintTransition(paletteRef.current);
        buildClouds();
      };
      const markLoaded = () => {
        loaded += 1;
        if (loaded >= images.length) finalize();
      };
      images.forEach((img) => {
        if (img.complete) {
          markLoaded();
        } else {
          img.onload = markLoaded;
          img.onerror = markLoaded;
        }
      });
    };

    const buildClouds = () => {
      if (!imagesReadyRef.current || sourceImagesRef.current.length === 0) return;
      const imageCount = sourceImagesRef.current.length;
      const baseCount = Math.max(6, Math.round(w / 150));
      const layers = [
        { count: baseCount + 4, scale: 1.0, speed: 3.4, opacity: 0.44 },
        { count: baseCount + 7, scale: 0.74, speed: 2.4, opacity: 0.32 },
        { count: baseCount + 10, scale: 0.56, speed: 1.7, opacity: 0.24 },
        { count: baseCount + 13, scale: 0.4, speed: 1.2, opacity: 0.2 },
      ];

      clouds = [];
      const topPad = h * 0.08;
      const usableHeight = h - topPad * 2;
      layers.forEach((layer) => {
        for (let i = 0; i < layer.count; i += 1) {
          const imageIndex = Math.floor(Math.random() * imageCount);
          const image = sourceImagesRef.current[imageIndex];
          const aspect = image ? image.width / image.height : 1;
          const isVertical = aspect < 0.9;
          const yNorm = clamp(Math.pow(Math.random(), 1.6), 0.04, 0.98);
          const sizeBias = clamp(1 - yNorm * 0.45, 0.55, 1);
          const scale =
            (0.72 + Math.random() * 0.55) *
            layer.scale *
            (isVertical ? 1.1 : 1) *
            sizeBias;
          const verticalFade = 0.85 + (1 - yNorm) * 0.15;
          clouds.push({
            x: Math.random() * w,
            y: topPad + yNorm * usableHeight,
            scale,
            speed: layer.speed * (0.5 + Math.random() * 0.6) * (Math.random() > 0.2 ? 1 : -1),
            drift: 3.5 + Math.random() * 5.5,
            sway: 0.06 + Math.random() * 0.1,
            opacity: layer.opacity * (0.65 + Math.random() * 0.35) * verticalFade,
            imageIndex,
            flip: Math.random() > 0.5 ? 1 : -1,
            tilt: (Math.random() * 2 - 1) * 0.06,
            phase: Math.random() * TWO_PI,
            pulse: 0.02 + Math.random() * 0.03,
            wander: 6 + Math.random() * 8,
          });
        }
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
      buildClouds();
    };

    const draw = (now: number) => {
      if (!activeRef.current) {
        rafRef.current = null;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.01, (now - last) * 0.001));
      last = now;
      const nowSec = now * 0.001;
      const skyAlpha = clamp(skyOpacityRef.current, 0, 1);
      const transition = tintTransitionRef.current;
      let blend = 0;
      let paletteFrom = paletteCurrentRef.current;
      let paletteTo = paletteCurrentRef.current;
      let hasTransition = false;
      if (transition && tintedImagesNextRef.current) {
        const t = clamp((now - transition.start) / transition.duration, 0, 1);
        blend = easeInOut(t);
        paletteTo = paletteTargetRef.current;
        hasTransition = true;
        if (t >= 1) {
          tintedImagesRef.current = tintedImagesNextRef.current;
          tintedImagesNextRef.current = null;
          paletteCurrentRef.current = paletteTo;
          tintTransitionRef.current = null;
          hasTransition = false;
          blend = 0;
          paletteFrom = paletteCurrentRef.current;
          paletteTo = paletteCurrentRef.current;
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (skyAlpha > 0.01) {
        const drawSky = (paletteValue: CloudPalette, alpha: number) => {
          const sky = ctx.createLinearGradient(0, 0, 0, h);
          sky.addColorStop(0, paletteValue.skyTop);
          sky.addColorStop(1, paletteValue.skyBottom);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        };
        if (hasTransition) {
          drawSky(paletteFrom, skyAlpha * (1 - blend));
          drawSky(paletteTo, skyAlpha * blend);
        } else {
          drawSky(paletteFrom, skyAlpha);
        }
      }

      const cloudImages = tintedImagesRef.current;
      const cloudImagesNext = hasTransition ? tintedImagesNextRef.current : null;
      if (!imagesReadyRef.current || cloudImages.length === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const baseSize = Math.min(w, h) * 0.4;

      for (let i = 0; i < clouds.length; i += 1) {
        const cloud = clouds[i];
        const image = cloudImages[cloud.imageIndex];
        if (!image) continue;
        cloud.x += cloud.speed * dt;
        const maxDim = image.maxDim;
        const scale = (baseSize * cloud.scale) / maxDim;
        const width = image.width * scale;
        const height = image.height * scale;
        const wrapPad = width * 1.2;
        if (cloud.x > w + wrapPad) cloud.x = -wrapPad;
        if (cloud.x < -wrapPad) cloud.x = w + wrapPad;

        const bob = Math.sin(nowSec * cloud.sway + cloud.phase) * cloud.drift;
        const wander = Math.sin(nowSec * 0.12 + cloud.phase * 1.7) * cloud.wander;
        const x = cloud.x + wander;
        const y = cloud.y + bob;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(cloud.tilt);
        const puff = 1 + Math.sin(nowSec * 0.1 + cloud.phase) * cloud.pulse;
        ctx.scale(cloud.flip * puff, puff);
        if (hasTransition && cloudImagesNext) {
          const nextImage = cloudImagesNext[cloud.imageIndex] ?? image;
          const alphaFrom = clamp(cloud.opacity * (1 - blend), 0, 1);
          const alphaTo = clamp(cloud.opacity * blend, 0, 1);
          if (alphaFrom > 0.001) {
            ctx.globalAlpha = alphaFrom;
            ctx.drawImage(image.canvas, -width / 2, -height / 2, width, height);
          }
          if (alphaTo > 0.001) {
            ctx.globalAlpha = alphaTo;
            ctx.drawImage(nextImage.canvas, -width / 2, -height / 2, width, height);
          }
        } else {
          ctx.globalAlpha = clamp(cloud.opacity, 0, 1);
          ctx.drawImage(image.canvas, -width / 2, -height / 2, width, height);
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    loadImages();
    resize();
    window.addEventListener("resize", resize);
    const startLoop = () => {
      if (rafRef.current !== null) return;
      last = performance.now();
      rafRef.current = requestAnimationFrame(draw);
    };
    startLoopRef.current = startLoop;
    if (activeRef.current) {
      startLoop();
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startLoopRef.current = null;
      tintRef.current = null;
    };
  }, []);

  const inset = frameMargin + 1;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transition: "opacity 600ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset,
          overflow: "hidden",
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
