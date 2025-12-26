"use client";

type MountainBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  stroke?: string;
  mist?: string;
  mistBoost?: number;
  strokeBoost?: number;
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
const MOUNTAIN_ONE_ASPECT = 1043 / 478;
const MOUNTAIN_TWO_ASPECT = 902 / 722;
const MOUNTAIN_THREE_ASPECT = 650 / 445;
const MOUNTAIN_FOUR_ASPECT = 661 / 454;
const MOUNTAIN_LAYERS: MountainLayer[] = [
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
    bottom: 10,
    opacity: 0.19,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 30,
    left: 18,
    bottom: 8,
    opacity: 0.18,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.png",
    width: 38,
    left: 44,
    bottom: 9,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 34,
    left: 72,
    bottom: 8,
    opacity: 0.19,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
  },
  {
    src: "/moutains/mountain1.png",
    width: 34,
    left: 100,
    bottom: 9,
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
}: MountainBackgroundProps) {
  const inset = frameMargin + 1;
  const alpha = clamp01(opacity);
  const edgeBleed = Math.max(48, frameMargin * 1.4);
  const verticalBleed = Math.max(72, frameMargin * 2);

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
          left: inset - edgeBleed,
          right: inset - edgeBleed,
          bottom: inset - verticalBleed,
          height: `calc(66% + ${verticalBleed}px)`,
          overflow: "hidden",
        }}
      >
        {MOUNTAIN_LAYERS.map((layer, index) => {
          const color = layer.tone === "mist" ? mist : stroke;
          const mistHeight = clamp01((layer.bottom - 24) / 90);
          const depthFade = layer.tone === "mist" ? 1 - mistHeight * 0.3 : 1;
          const toneBoost = layer.tone === "mist" ? mistBoost : strokeBoost;
          const layerOpacity = clamp01(layer.opacity * depthFade * toneBoost);
          const translate = layer.flip
            ? "translateX(-50%) scaleX(-1)"
            : "translateX(-50%)";
          return (
            <div
              key={`${layer.src}-${index}`}
              style={{
                position: "absolute",
                left: `${layer.left}%`,
                bottom: `${layer.bottom}%`,
                width: `${layer.width}%`,
                aspectRatio: String(layer.aspect),
                maxHeight: "100%",
                backgroundColor: color,
                opacity: layerOpacity,
                transform: translate,
                transformOrigin: "center",
                maskImage: `url(${layer.src})`,
                WebkitMaskImage: `url(${layer.src})`,
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskSize: "contain",
                WebkitMaskSize: "contain",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
