"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type MountainBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  stroke?: string;
  mist?: string;
  mistBoost?: number;
  strokeBoost?: number;
  transitionProgress?: number;
};

type MountainLayer = {
  src: string;
  width: number;
  left: number;
  bottom: number;
  opacity: number;
  tone: "stroke" | "mist";
  aspect: number;
  flip?: boolean;
};

const DEFAULT_STROKE = "rgba(230, 225, 216, 0.5)";
const DEFAULT_MIST = "rgba(230, 225, 216, 0.2)";
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const MOUNTAIN_ONE_ASPECT = 1043 / 478;
const MOUNTAIN_TWO_ASPECT = 902 / 722;
const MOUNTAIN_THREE_ASPECT = 650 / 445;
const MOUNTAIN_FOUR_ASPECT = 661 / 454;
const MOUNTAIN_LAYERS: MountainLayer[] = [
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: -6,
    bottom: 72,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 7,
    left: 6,
    bottom: 70,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 7,
    left: 18,
    bottom: 71,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: 30,
    bottom: 70,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 8,
    left: 42,
    bottom: 69,
    opacity: 0.024,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 7,
    left: 56,
    bottom: 71,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: 70,
    bottom: 70,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 7,
    left: 84,
    bottom: 69,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 7,
    left: 98,
    bottom: 71,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: 112,
    bottom: 70,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 9,
    left: 6,
    bottom: 64,
    opacity: 0.03,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 10,
    left: 74,
    bottom: 62,
    opacity: 0.035,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: -12,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 10,
    left: -2,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: 8,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 11,
    left: 20,
    bottom: 59,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: 32,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 11,
    left: 44,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: 56,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 10,
    left: 68,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: 80,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 11,
    left: 92,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: 104,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 10,
    left: 116,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain3.png",
    width: 18,
    left: -8,
    bottom: 46,
    opacity: 0.08,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 6,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 20,
    left: 22,
    bottom: 46,
    opacity: 0.09,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 40,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 22,
    left: 56,
    bottom: 45,
    opacity: 0.09,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 76,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 20,
    left: 92,
    bottom: 46,
    opacity: 0.09,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 110,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 14,
    left: -6,
    bottom: 54,
    opacity: 0.06,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 12,
    bottom: 53,
    opacity: 0.055,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 16,
    left: 30,
    bottom: 52,
    opacity: 0.065,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 52,
    bottom: 53,
    opacity: 0.055,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 16,
    left: 70,
    bottom: 52,
    opacity: 0.065,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 12,
    left: 90,
    bottom: 53,
    opacity: 0.055,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 16,
    left: 108,
    bottom: 52,
    opacity: 0.065,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain3.png",
    width: 26,
    left: -4,
    bottom: 34,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 18,
    left: 14,
    bottom: 33,
    opacity: 0.11,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 28,
    left: 34,
    bottom: 32,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 18,
    left: 54,
    bottom: 33,
    opacity: 0.11,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain1.png",
    width: 30,
    left: 72,
    bottom: 31,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 18,
    left: 94,
    bottom: 32,
    opacity: 0.11,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 26,
    left: 112,
    bottom: 31,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.png",
    width: 62,
    left: -10,
    bottom: -24,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain1.png",
    width: 58,
    left: 30,
    bottom: -26,
    opacity: 0.21,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.png",
    width: 64,
    left: 70,
    bottom: -24,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 28,
    left: 104,
    bottom: -18,
    opacity: 0.17,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 22,
    left: -6,
    bottom: 22,
    opacity: 0.12,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 18,
    left: 12,
    bottom: 21,
    opacity: 0.11,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 24,
    left: 30,
    bottom: 20,
    opacity: 0.13,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.png",
    width: 26,
    left: 54,
    bottom: 21,
    opacity: 0.13,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 24,
    left: 76,
    bottom: 20,
    opacity: 0.12,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 18,
    left: 96,
    bottom: 21,
    opacity: 0.11,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 22,
    left: 112,
    bottom: 20,
    opacity: 0.12,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain4.png",
    width: 34,
    left: -6,
    bottom: 2,
    opacity: 0.19,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 30,
    left: 18,
    bottom: 1,
    opacity: 0.18,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.png",
    width: 38,
    left: 44,
    bottom: 0,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 34,
    left: 72,
    bottom: 1,
    opacity: 0.19,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
  },
  {
    src: "/moutains/mountain1.png",
    width: 34,
    left: 100,
    bottom: 0,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
    flip: true,
  },
];

export default function MountainBackground({
  frameMargin = 32,
  opacity = 1,
  stroke = DEFAULT_STROKE,
  mist = DEFAULT_MIST,
  mistBoost = 1,
  strokeBoost = 1,
  transitionProgress,
}: MountainBackgroundProps) {
  const inset = frameMargin + 1;
  const alpha = clamp01(opacity);
  const revealProgress = clamp01(transitionProgress ?? alpha);
  const previousProgressRef = useRef(revealProgress);
  const isEntering = revealProgress >= previousProgressRef.current;
  const layerCount = MOUNTAIN_LAYERS.length;
  const revealSpan = 0.35;
  const enableFlyThrough = true;

  useEffect(() => {
    previousProgressRef.current = revealProgress;
  }, [revealProgress]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: alpha,
        transition: "opacity 600ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          bottom: inset,
          height: "66%",
          overflow: "hidden",
        }}
      >
        {MOUNTAIN_LAYERS.map((layer, index) => {
          const orderIndex = isEntering ? index : layerCount - 1 - index;
          const start = (orderIndex / Math.max(1, layerCount - 1)) * (1 - revealSpan);
          const reveal = easeInOut(
            clamp01((revealProgress - start) / revealSpan),
          );
          const color = layer.tone === "mist" ? mist : stroke;
          const mistHeight = clamp01((layer.bottom - 24) / 90);
          const depthFade = layer.tone === "mist" ? 1 - mistHeight * 0.3 : 1;
          const toneBoost = layer.tone === "mist" ? mistBoost : strokeBoost;
          const layerOpacity = clamp01(
            layer.opacity * depthFade * toneBoost * reveal * alpha,
          );
          const layerBottom =
            layer.tone === "mist" ? layer.bottom - 6 : layer.bottom;
          const depth = clamp01((34 - layer.bottom) / 50);
          const flyStartScale = 0.8 + depth * 0.08;
          const flyEndScale = 1.02 + depth * 0.12;
          const flyStartShift = -(4 + depth * 6);
          const flyEndShift = 10 + depth * 14;
          const flyDuration = 42 - depth * 6 + (index % 3) * 2.5;
          const phase = index / Math.max(1, layerCount);
          const flyDelay = -(phase * flyDuration);
          const animation = enableFlyThrough
            ? `mountain-fly ${flyDuration.toFixed(
                1,
              )}s linear ${flyDelay.toFixed(1)}s infinite`
            : "";
          const wrapperStyle = {
            position: "absolute",
            left: `${layer.left}%`,
            bottom: `${layerBottom}%`,
            width: `${layer.width}%`,
            aspectRatio: String(layer.aspect),
            maxHeight: "100%",
            opacity: layerOpacity,
            transform: "translateX(-50%)",
            animation: animation || undefined,
            animationFillMode: animation ? "both" : undefined,
            transformOrigin: "center bottom",
            ["--base-opacity" as const]: layerOpacity,
            ["--base-shift" as const]: "-50%",
            ["--fly-start-y" as const]: `${(-flyStartShift).toFixed(1)}px`,
            ["--fly-end-y" as const]: `${flyEndShift.toFixed(1)}px`,
            ["--fly-start-scale" as const]: flyStartScale.toFixed(3),
            ["--fly-end-scale" as const]: flyEndScale.toFixed(3),
          } as CSSProperties;
          const layerStyle: CSSProperties = {
            width: "100%",
            height: "100%",
            backgroundColor: color,
            opacity: 1,
            transform: layer.flip ? "scaleX(-1)" : undefined,
            transformOrigin: "center",
            maskImage: `url(${layer.src})`,
            WebkitMaskImage: `url(${layer.src})`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskSize: "contain",
            WebkitMaskSize: "contain",
          };
          return (
            <div
              key={`${layer.src}-${index}`}
              className="mountain-layer"
              style={wrapperStyle}
            >
              <div style={layerStyle} />
            </div>
          );
        })}
        <style jsx global>{`
          @keyframes mountain-fly {
            0% {
              transform: translateX(var(--base-shift))
                translateY(var(--fly-start-y))
                scale(var(--fly-start-scale));
              opacity: 0;
            }
            20% {
              opacity: calc(var(--base-opacity) * 0.85);
            }
            70% {
              opacity: var(--base-opacity);
            }
            100% {
              transform: translateX(var(--base-shift))
                translateY(var(--fly-end-y))
                scale(var(--fly-end-scale));
              opacity: 0;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .mountain-layer {
              animation: none !important;
              transform: translateX(-50%) !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
