"use client";

export type WaterPalette = {
  backgroundTop: string;
  backgroundBottom: string;
  surface: string;
};

export const LIGHT_WATER_PALETTE: WaterPalette = {
  backgroundTop: "#dbe7f3",
  backgroundBottom: "#c2d8ee",
  surface: "rgba(255, 255, 255, 0.35)",
};

export const DARK_WATER_PALETTE: WaterPalette = {
  backgroundTop: "#0f1c2b",
  backgroundBottom: "#0a1522",
  surface: "rgba(164, 206, 255, 0.18)",
};

export const DEFAULT_WATER_PALETTE = DARK_WATER_PALETTE;

type WaterBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  transitionProgress?: number;
  palette?: WaterPalette;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function WaterBackground({
  frameMargin = 32,
  opacity = 1,
  transitionProgress,
  palette = DEFAULT_WATER_PALETTE,
}: WaterBackgroundProps) {
  const inset = frameMargin + 1;
  const alpha = clamp01(opacity);
  const reveal = clamp01(transitionProgress ?? alpha);
  const layerOpacity = alpha * reveal;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: layerOpacity,
        transition: "opacity 600ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset,
          overflow: "hidden",
          backgroundImage: `linear-gradient(180deg, ${palette.backgroundTop} 0%, ${palette.backgroundBottom} 100%)`,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(180deg, ${palette.surface} 0%, rgba(0, 0, 0, 0) 65%)`,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}
