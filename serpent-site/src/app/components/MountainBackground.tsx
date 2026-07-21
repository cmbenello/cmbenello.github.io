"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type MountainBackgroundProps = {
  frameMargin?: number;
  opacity?: number;
  stroke?: string;
  mist?: string;
  mistBoost?: number;
  strokeBoost?: number;
  dashOpacityBoost?: number;
  transitionProgress?: number;
  paused?: boolean;
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

type DashSegment = {
  left: number;
  width: number;
  opacity: number;
};

type DashStrip = {
  bottom: number;
  thickness: number;
  segments: DashSegment[];
};

type DashStripMotion = {
  direction: -1 | 1;
  amplitude: number;
  duration: number;
  delay: number;
};

type DashBandOverrides = {
  stripCount?: number;
  minCount?: number;
  maxCount?: number;
  minWidth?: number;
  maxWidth?: number;
  minGap?: number;
  maxGap?: number;
  countJitter?: number;
  maxGapAllowed?: number;
  fillLimit?: number;
  densityPower?: number;
  lengthPower?: number;
  gapPower?: number;
};

const DEFAULT_STROKE = "rgba(230, 225, 216, 0.5)";
const DEFAULT_MIST = "rgba(230, 225, 216, 0.2)";
const MOUNTAIN_CONTAINER_HEIGHT = 0.66;
const MIST_VERTICAL_SHIFT = 6;
const DASH_STRIP_COUNT = 7;
const DASH_STRIP_THICKNESS = 2.1;
const DASH_SEGMENT_MIN_COUNT = 6;
const DASH_SEGMENT_MAX_COUNT = 18;
const DASH_SEGMENT_MIN_WIDTH = 1.6;
const DASH_SEGMENT_MAX_WIDTH = 7;
const DASH_SEGMENT_MIN_GAP = 2;
const DASH_SEGMENT_MAX_GAP = 12;
const DASH_SEGMENT_COUNT_JITTER = 3;
const DASH_SEGMENT_MAX_ALLOWED_GAP = 14;
const DASH_SEGMENT_FILL_LIMIT = 3;
const DASH_SEGMENT_OPACITY = 0.4;
const DASH_BAND_DROP = 10;
const DASH_TOP_BAND_OFFSET = 6;
const DASH_BAND_GAP = 3;
const DASH_BOTTOM_BAND_GAP = 4;
const DASH_BOTTOM_BAND_HEIGHT = 8;
const DASH_SEGMENT_DENSITY_POWER = 1.4;
const DASH_SEGMENT_LENGTH_POWER = 1.2;
const DASH_SEGMENT_GAP_POWER = 1.0;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};
const buildDashStripMotion = (
  seed: number,
  count: number,
): DashStripMotion[] => {
  const rand = createSeededRandom(seed);
  return Array.from({ length: count }, (_, index) => {
    const direction = rand() < 0.5 ? -1 : 1;
    const amplitude = 18 + rand() * 24;
    const duration = 12 + rand() * 18;
    const delay = -rand() * duration;
    return { direction, amplitude, duration, delay };
  });
};
const enforceMaxGap = (
  segments: DashSegment[],
  maxGap: number,
  widthMin: number,
  widthMax: number,
  rand: () => number,
): DashSegment[] => {
  if (segments.length === 0) return segments;
  const ordered = [...segments].sort((a, b) => a.left - b.left);
  let largestGap = 0;
  let gapStart = 0;
  let gapEnd = 0;
  let previousEnd = 0;

  for (const segment of ordered) {
    const gap = segment.left - previousEnd;
    if (gap > largestGap) {
      largestGap = gap;
      gapStart = previousEnd;
      gapEnd = segment.left;
    }
    previousEnd = segment.left + segment.width;
  }

  const endGap = 100 - previousEnd;
  if (endGap > largestGap) {
    largestGap = endGap;
    gapStart = previousEnd;
    gapEnd = 100;
  }

  if (largestGap <= maxGap) return ordered;

  const available = Math.max(0, largestGap - 0.8);
  const maxWidth = Math.min(widthMax, available);
  const minWidth = Math.min(widthMin, maxWidth);
  if (maxWidth <= 0) return ordered;
  const width = minWidth + rand() * Math.max(0, maxWidth - minWidth);
  const left = gapStart + (gapEnd - gapStart - width) * rand();
  const next = [
    ...ordered,
    {
      left,
      width,
      opacity: DASH_SEGMENT_OPACITY,
    },
  ];
  next.sort((a, b) => a.left - b.left);
  return next;
};
const buildDashStrips = (
  seed: number,
  bandStart: number,
  bandEnd: number,
  overrides: DashBandOverrides = {},
): DashStrip[] => {
  const rand = createSeededRandom(seed);
  const stripCount = overrides.stripCount ?? DASH_STRIP_COUNT;
  const minCount = overrides.minCount ?? DASH_SEGMENT_MIN_COUNT;
  const maxCount = overrides.maxCount ?? DASH_SEGMENT_MAX_COUNT;
  const minWidth = overrides.minWidth ?? DASH_SEGMENT_MIN_WIDTH;
  const maxWidth = overrides.maxWidth ?? DASH_SEGMENT_MAX_WIDTH;
  const minGap = overrides.minGap ?? DASH_SEGMENT_MIN_GAP;
  const maxGap = overrides.maxGap ?? DASH_SEGMENT_MAX_GAP;
  const countJitter = overrides.countJitter ?? DASH_SEGMENT_COUNT_JITTER;
  const maxGapAllowed = overrides.maxGapAllowed ?? DASH_SEGMENT_MAX_ALLOWED_GAP;
  const fillLimit = overrides.fillLimit ?? DASH_SEGMENT_FILL_LIMIT;
  const densityPower = overrides.densityPower ?? DASH_SEGMENT_DENSITY_POWER;
  const lengthPower = overrides.lengthPower ?? DASH_SEGMENT_LENGTH_POWER;
  const gapPower = overrides.gapPower ?? DASH_SEGMENT_GAP_POWER;
  const bandMin = Math.min(bandStart, bandEnd);
  const bandMax = Math.max(bandStart, bandEnd);
  const bandSpan = Math.max(0, bandMax - bandMin);
  const step = stripCount > 1 ? bandSpan / (stripCount - 1) : 0;
  const strips: DashStrip[] = [];

  for (let i = 0; i < stripCount; i += 1) {
    const bottom = bandMin + step * i;
    const thickness = DASH_STRIP_THICKNESS;
    const segments: DashSegment[] = [];
    const topBias = bandSpan > 0 ? clamp01((bottom - bandMin) / bandSpan) : 1;
    const densityBias = Math.pow(topBias, densityPower);
    const lengthBias = Math.pow(topBias, lengthPower);
    const gapBias = Math.pow(topBias, gapPower);
    const baseCount = lerp(minCount, maxCount, densityBias);
    const segmentCount = Math.round(
      baseCount + (rand() - 0.5) * countJitter * 2,
    );
    const clampedCount = Math.min(
      maxCount,
      Math.max(minCount, segmentCount),
    );
    const widthMin = minWidth * lerp(0.6, 1.1, lengthBias);
    const widthMax = maxWidth * lerp(0.35, 1.25, lengthBias);
    const gapMin = minGap * lerp(1.6, 0.6, gapBias);
    const gapMax = maxGap * lerp(1.7, 0.7, gapBias);
    const maxGapAllowedScaled = lerp(maxGapAllowed, maxGapAllowed * 0.55, gapBias);
    let cursor = rand() * 6;

    for (let index = 0; index < clampedCount && cursor < 100; index += 1) {
      const width =
        widthMin + rand() * Math.max(0, widthMax - widthMin);
      if (cursor + width > 100) break;
      segments.push({
        left: cursor,
        width,
        opacity: DASH_SEGMENT_OPACITY,
      });
      const gap =
        gapMin + rand() * Math.max(0, gapMax - gapMin);
      cursor += width + gap;
    }

    let finalSegments = segments;
    for (let fill = 0; fill < fillLimit; fill += 1) {
      const nextSegments = enforceMaxGap(
        finalSegments,
        maxGapAllowedScaled,
        widthMin,
        widthMax,
        rand,
      );
      if (nextSegments.length === finalSegments.length) break;
      finalSegments = nextSegments;
    }
    strips.push({ bottom, thickness, segments: finalSegments });
  }

  return strips;
};
const MOUNTAIN_ONE_ASPECT = 1043 / 478;
const MOUNTAIN_TWO_ASPECT = 902 / 722;
const MOUNTAIN_THREE_ASPECT = 650 / 445;
const MOUNTAIN_FOUR_ASPECT = 661 / 454;
const MOUNTAIN_LAYERS: MountainLayer[] = [
  {
    src: "/moutains/mountain3.webp",
    width: 9,
    left: -4,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 9,
    left: 32,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: 68,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 9,
    left: 104,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: -8,
    bottom: 92,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 7,
    left: 10,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 6,
    left: 26,
    bottom: 94,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: 42,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 7,
    left: 58,
    bottom: 94,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 6,
    left: 74,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: 90,
    bottom: 94,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 7,
    left: 108,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: -6,
    bottom: 72,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 7,
    left: 6,
    bottom: 70,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 7,
    left: 18,
    bottom: 71,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: 30,
    bottom: 70,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 8,
    left: 42,
    bottom: 69,
    opacity: 0.024,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 7,
    left: 56,
    bottom: 71,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: 70,
    bottom: 70,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 7,
    left: 84,
    bottom: 69,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 7,
    left: 98,
    bottom: 71,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 6,
    left: 112,
    bottom: 70,
    opacity: 0.02,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 9,
    left: 6,
    bottom: 64,
    opacity: 0.03,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 10,
    left: 74,
    bottom: 62,
    opacity: 0.035,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: -12,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 10,
    left: -2,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: 8,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 11,
    left: 20,
    bottom: 59,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: 32,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 11,
    left: 44,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: 56,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 10,
    left: 68,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: 80,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 11,
    left: 92,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 8,
    left: 104,
    bottom: 60,
    opacity: 0.04,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 10,
    left: 116,
    bottom: 58,
    opacity: 0.05,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 18,
    left: -8,
    bottom: 46,
    opacity: 0.08,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 6,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 20,
    left: 22,
    bottom: 46,
    opacity: 0.09,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 40,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 22,
    left: 56,
    bottom: 45,
    opacity: 0.09,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 76,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 16,
    left: 86,
    bottom: 44,
    opacity: 0.085,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 14,
    left: 100,
    bottom: 43,
    opacity: 0.08,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 20,
    left: 92,
    bottom: 46,
    opacity: 0.09,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 110,
    bottom: 47,
    opacity: 0.07,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 14,
    left: -6,
    bottom: 54,
    opacity: 0.06,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 12,
    bottom: 53,
    opacity: 0.055,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 16,
    left: 30,
    bottom: 52,
    opacity: 0.065,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 52,
    bottom: 53,
    opacity: 0.055,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 16,
    left: 70,
    bottom: 52,
    opacity: 0.065,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 12,
    left: 90,
    bottom: 53,
    opacity: 0.055,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 16,
    left: 108,
    bottom: 52,
    opacity: 0.065,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 14,
    left: 82,
    bottom: 56,
    opacity: 0.06,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 10,
    left: 94,
    bottom: 55,
    opacity: 0.058,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 12,
    left: 106,
    bottom: 55,
    opacity: 0.06,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 26,
    left: -4,
    bottom: 34,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 18,
    left: 14,
    bottom: 33,
    opacity: 0.11,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 28,
    left: 34,
    bottom: 32,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 18,
    left: 54,
    bottom: 33,
    opacity: 0.11,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 30,
    left: 72,
    bottom: 31,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 18,
    left: 94,
    bottom: 32,
    opacity: 0.11,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 26,
    left: 112,
    bottom: 31,
    opacity: 0.12,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 62,
    left: -10,
    bottom: -24,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 58,
    left: 30,
    bottom: -26,
    opacity: 0.21,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 64,
    left: 70,
    bottom: -24,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 28,
    left: 104,
    bottom: -18,
    opacity: 0.17,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 22,
    left: -6,
    bottom: 22,
    opacity: 0.12,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 18,
    left: 12,
    bottom: 21,
    opacity: 0.11,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 24,
    left: 30,
    bottom: 20,
    opacity: 0.13,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 26,
    left: 54,
    bottom: 21,
    opacity: 0.13,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 24,
    left: 76,
    bottom: 20,
    opacity: 0.12,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 18,
    left: 96,
    bottom: 21,
    opacity: 0.11,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 22,
    left: 112,
    bottom: 20,
    opacity: 0.12,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.webp",
    width: 24,
    left: 114,
    bottom: 10,
    opacity: 0.14,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 34,
    left: -6,
    bottom: 2,
    opacity: 0.19,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
  },
  {
    src: "/moutains/mountain3.webp",
    width: 30,
    left: 18,
    bottom: 1,
    opacity: 0.18,
    tone: "stroke",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 38,
    left: 44,
    bottom: 0,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
  },
  {
    src: "/moutains/mountain4.webp",
    width: 34,
    left: 72,
    bottom: 1,
    opacity: 0.19,
    tone: "stroke",
    aspect: MOUNTAIN_FOUR_ASPECT,
  },
  {
    src: "/moutains/mountain1.webp",
    width: 34,
    left: 100,
    bottom: 0,
    opacity: 0.2,
    tone: "stroke",
    aspect: MOUNTAIN_ONE_ASPECT,
    flip: true,
  },
];
// Procedurally generated extra peaks — deterministic (seeded), filling out the
// same depth bands as the authored composition so the range reads much denser.
type ExtraBand = {
  count: number;
  bottomMin: number;
  bottomMax: number;
  widthMin: number;
  widthMax: number;
  opacityMin: number;
  opacityMax: number;
  tone: "stroke" | "mist";
};
const EXTRA_MOUNTAIN_BANDS: ExtraBand[] = [
  { count: 14, bottomMin: 92, bottomMax: 100, widthMin: 6, widthMax: 9, opacityMin: 0.018, opacityMax: 0.024, tone: "mist" },
  { count: 12, bottomMin: 58, bottomMax: 72, widthMin: 6, widthMax: 11, opacityMin: 0.038, opacityMax: 0.052, tone: "mist" },
  { count: 10, bottomMin: 43, bottomMax: 56, widthMin: 10, widthMax: 22, opacityMin: 0.055, opacityMax: 0.09, tone: "mist" },
  { count: 8, bottomMin: 30, bottomMax: 35, widthMin: 18, widthMax: 28, opacityMin: 0.1, opacityMax: 0.125, tone: "mist" },
  { count: 7, bottomMin: 19, bottomMax: 23, widthMin: 16, widthMax: 24, opacityMin: 0.11, opacityMax: 0.13, tone: "stroke" },
  { count: 5, bottomMin: -2, bottomMax: 10, widthMin: 22, widthMax: 32, opacityMin: 0.14, opacityMax: 0.2, tone: "stroke" },
];
const EXTRA_MOUNTAIN_SOURCES = [
  { src: "/moutains/mountain1.webp", aspect: MOUNTAIN_ONE_ASPECT },
  { src: "/moutains/mountain2.webp", aspect: MOUNTAIN_TWO_ASPECT },
  { src: "/moutains/mountain3.webp", aspect: MOUNTAIN_THREE_ASPECT },
  { src: "/moutains/mountain4.webp", aspect: MOUNTAIN_FOUR_ASPECT },
];
const buildExtraMountainLayers = (): MountainLayer[] => {
  const rand = createSeededRandom(8675309);
  const layers: MountainLayer[] = [];
  for (const band of EXTRA_MOUNTAIN_BANDS) {
    for (let i = 0; i < band.count; i += 1) {
      const pick =
        EXTRA_MOUNTAIN_SOURCES[(rand() * EXTRA_MOUNTAIN_SOURCES.length) | 0];
      layers.push({
        src: pick.src,
        aspect: pick.aspect,
        width: band.widthMin + rand() * (band.widthMax - band.widthMin),
        left: -12 + rand() * 132,
        bottom: band.bottomMin + rand() * (band.bottomMax - band.bottomMin),
        opacity:
          band.opacityMin + rand() * (band.opacityMax - band.opacityMin),
        tone: band.tone,
        flip: rand() < 0.5,
      });
    }
  }
  return layers;
};
const ALL_MOUNTAIN_LAYERS: MountainLayer[] = [
  ...MOUNTAIN_LAYERS,
  ...buildExtraMountainLayers(),
];

const MAX_MOUNTAIN_PEAK = ALL_MOUNTAIN_LAYERS.reduce((maxPeak, layer) => {
  const height = layer.width / layer.aspect;
  const layerBottom =
    layer.tone === "mist" ? layer.bottom - MIST_VERTICAL_SHIFT : layer.bottom;
  return Math.max(maxPeak, layerBottom + height);
}, 0);
const DASH_PEAK = MAX_MOUNTAIN_PEAK * MOUNTAIN_CONTAINER_HEIGHT;
const DASH_TOP_BAND_START = Math.min(
  100,
  Math.max(0, DASH_PEAK + DASH_TOP_BAND_OFFSET),
);
const DASH_LOWER_BAND_START = Math.min(
  100,
  Math.max(0, DASH_PEAK - DASH_BAND_DROP),
);
const DASH_LOWER_BAND_END = Math.min(
  100,
  Math.max(0, DASH_TOP_BAND_START - DASH_BAND_GAP),
);
const DASH_BOTTOM_BAND_END = Math.min(
  100,
  Math.max(0, DASH_LOWER_BAND_START - DASH_BOTTOM_BAND_GAP),
);
const DASH_BOTTOM_BAND_START = Math.min(
  100,
  Math.max(0, DASH_BOTTOM_BAND_END - DASH_BOTTOM_BAND_HEIGHT),
);
const DASH_TOP_BAND_SETTINGS: DashBandOverrides = {
  stripCount: 7,
  minCount: 12,
  maxCount: 30,
  minWidth: 2.2,
  maxWidth: 10,
  minGap: 1.1,
  maxGap: 8,
  countJitter: 4,
  maxGapAllowed: 9,
  fillLimit: 4,
  densityPower: 2.6,
  lengthPower: 2.4,
  gapPower: 1.4,
};
const DASH_LOWER_BAND_SETTINGS: DashBandOverrides = {
  stripCount: 4,
  minCount: 6,
  maxCount: 18,
  minWidth: 1.6,
  maxWidth: 6,
  minGap: 2,
  maxGap: 12,
  countJitter: 3,
  maxGapAllowed: 14,
  fillLimit: 3,
  densityPower: 1.4,
  lengthPower: 0.9,
  gapPower: 1.0,
};
const DASH_BOTTOM_BAND_SETTINGS: DashBandOverrides = {
  stripCount: 3,
  minCount: 4,
  maxCount: 12,
  minWidth: 1.4,
  maxWidth: 6,
  minGap: 2.4,
  maxGap: 14,
  countJitter: 2,
  maxGapAllowed: 16,
  fillLimit: 2,
  densityPower: 1.1,
  lengthPower: 0.95,
  gapPower: 0.9,
};
const DASH_STRIPS = [
  ...buildDashStrips(7411, DASH_TOP_BAND_START, 100, DASH_TOP_BAND_SETTINGS),
  ...(DASH_LOWER_BAND_END > DASH_LOWER_BAND_START
    ? buildDashStrips(
        9137,
        DASH_LOWER_BAND_START,
        DASH_LOWER_BAND_END,
        DASH_LOWER_BAND_SETTINGS,
      )
    : []),
  ...(DASH_BOTTOM_BAND_START > 0 && DASH_BOTTOM_BAND_END > DASH_BOTTOM_BAND_START
    ? buildDashStrips(
        12289,
        DASH_BOTTOM_BAND_START,
        DASH_BOTTOM_BAND_END,
        DASH_BOTTOM_BAND_SETTINGS,
      )
    : []),
];
const DASH_STRIP_MOTION = buildDashStripMotion(5563, DASH_STRIPS.length);

// Bird-flight fly-through: each layer loops an approach cycle — born small and
// faint near the horizon, swelling to its authored composition spot mid-cycle,
// then sweeping outward past the camera and below the frame.
// Scales (transform-origin center bottom).
const FLY_START_SCALE = 0.15;
const FLY_GROWTH_SCALE = 0.38; // intermediate stop -> exponential-feeling growth
// Kept modest: with ~170 composited masked layers, large end-scales blow past
// GPU texture memory and the compositor checkerboards (flickering white boxes).
const FLY_END_SCALE_STROKE_MIN = 1.6;
const FLY_END_SCALE_STROKE_MAX = 1.9;
const FLY_END_SCALE_MIST_MIN = 1.3;
const FLY_END_SCALE_MIST_MAX = 1.5;
// Translate magnitudes (% of the layer's own border box, so nearer/larger
// layers sweep farther in absolute px, reinforcing parallax).
const FLY_START_TX = 90; // toward the vanishing point (scaled by -dirX)
const FLY_START_TY = -35; // lifted up toward the horizon
const FLY_END_TX = 150; // sweeps outward past the camera (scaled by +dirX)
const FLY_END_TY = 70; // drops below the frame
const FLY_GROWTH_REMAINING = 0.72; // fraction of start offset left at growth stop
// Keyframe stops (percent of the cycle). Linear animation timing + uneven stop
// spacing makes the approach slow when far away and fast as the peak passes.
const FLY_FADE_IN_PERCENT = 15;
const FLY_FADE_IN_OPACITY = 0.85; // x --base-opacity once fade-in completes
const FLY_GROWTH_PERCENT = 30;
const FLY_MID_PERCENT = 60; // authored composition spot: translate(0,0) scale(1)
const FLY_FADE_OUT_PERCENT = 18; // fades out over the final 18% of the cycle
const FLY_FADE_OUT_START_PERCENT = 100 - FLY_FADE_OUT_PERCENT;
// Peaks whose center sits near mid-frame get pushed to a deterministic side so
// they pass beside the camera instead of into it.
const FLY_CENTER_DIR_MIN = 0.15;
// Approach durations (s) by depth band (layer.bottom: higher = further away).
const FLY_DURATION_FARTHEST = 420;
const FLY_DURATION_FAR = 330;
const FLY_DURATION_MID = 250;
const FLY_DURATION_NEAR = 180;
const FLY_DEPTH_DURATIONS = [
  { minBottom: 90, duration: FLY_DURATION_FARTHEST },
  { minBottom: 43, duration: FLY_DURATION_FAR },
  { minBottom: 20, duration: FLY_DURATION_MID },
  { minBottom: Number.NEGATIVE_INFINITY, duration: FLY_DURATION_NEAR },
];
const FLY_DURATION_JITTER = 0.12; // +/- fraction of the band duration
// Deterministic low-discrepancy increments (SSR-safe: no randomness APIs).
const FLY_PHASE_INCREMENT = 0.61803; // golden-ratio conjugate
const FLY_JITTER_INCREMENT = 0.75488;
const FLY_SCALE_INCREMENT = 0.38197;
const fract = (value: number) => value - Math.floor(value);

type FlyParams = {
  dirX: number;
  endScale: number;
  duration: number;
  delay: number;
};
// Memoized at module scope: the layer list is a module constant.
const FLY_PARAMS: FlyParams[] = ALL_MOUNTAIN_LAYERS.map((layer, index) => {
  const layerCenterX = layer.left + layer.width / 2;
  let dirX = Math.max(-1, Math.min(1, (layerCenterX - 50) / 50));
  if (Math.abs(dirX) < FLY_CENTER_DIR_MIN) {
    dirX = index % 2 === 0 ? FLY_CENTER_DIR_MIN : -FLY_CENTER_DIR_MIN;
  }
  const depth =
    FLY_DEPTH_DURATIONS.find((band) => layer.bottom >= band.minBottom) ??
    FLY_DEPTH_DURATIONS[FLY_DEPTH_DURATIONS.length - 1];
  const jitter =
    1 + (fract(index * FLY_JITTER_INCREMENT) - 0.5) * 2 * FLY_DURATION_JITTER;
  const duration = depth.duration * jitter;
  // Golden-ratio phase spread keeps peaks distributed across the whole cycle
  // so they never pulse in sync.
  const delay = -(fract(index * FLY_PHASE_INCREMENT) * duration);
  const endScale = lerp(
    layer.tone === "stroke" ? FLY_END_SCALE_STROKE_MIN : FLY_END_SCALE_MIST_MIN,
    layer.tone === "stroke" ? FLY_END_SCALE_STROKE_MAX : FLY_END_SCALE_MIST_MAX,
    fract(index * FLY_SCALE_INCREMENT),
  );
  return { dirX, endScale, duration, delay };
});

type MistBand = {
  bottom: number;
  height: number;
  opacity: number;
  shift: number;
  driftDuration: number;
  driftDelay: number;
  breatheDuration: number;
  breatheDelay: number;
};
// Drifting mist banks sitting between the parallax depth bands (container %).
// `shift` is the drift amplitude in % (sign sets the initial direction);
// drift durations alternate direction via the `alternate` keyword, breathe
// durations are half the ~20s opacity cycle.
const MIST_BANDS: MistBand[] = [
  {
    bottom: 14,
    height: 13,
    opacity: 0.32,
    shift: 4,
    driftDuration: 126,
    driftDelay: -41,
    breatheDuration: 10.5,
    breatheDelay: -3,
  },
  {
    bottom: 37,
    height: 11,
    opacity: 0.26,
    shift: -5,
    driftDuration: 98,
    driftDelay: -17,
    breatheDuration: 9,
    breatheDelay: -6.5,
  },
  {
    bottom: 76,
    height: 9,
    opacity: 0.2,
    shift: 3.5,
    driftDuration: 146,
    driftDelay: -84,
    breatheDuration: 12,
    breatheDelay: -1.5,
  },
];
const MIST_BAND_WIDTH = 160; // % of container, so edges never show while drifting
const MIST_BREATHE_MIN = 0.7; // breathing dips to 70% of band opacity (~+/-30%)
const MIST_FEATHER_MASK =
  "linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)";

type BirdSpec = { x: number; y: number; scale: number; bobDelay: number };
type BirdFlock = {
  top: number;
  startLeft: string;
  distance: string;
  cycle: number;
  delay: number;
  birds: BirdSpec[];
};
const SKY_REGION_HEIGHT = 30; // % of frame, measured from the top
const BIRD_WIDTH = 10; // px
const BIRD_HEIGHT = 6; // px
const BIRD_OPACITY = 0.45;
const BIRD_BOB_DURATION = 5.6; // s per half bob (alternate)
const BIRD_BOB_AMPLITUDE = 1.4; // px
const FLOCK_WIDTH = 52; // px
const FLOCK_HEIGHT = 22; // px
// Traverse keyframe shape: visible from fade-in to traverse-end percent of the
// cycle, then a long invisible hold for the remainder.
const BIRD_FADE_IN_PERCENT = 2;
const BIRD_FADE_HOLD_PERCENT = 33;
const BIRD_TRAVERSE_END_PERCENT = 36;
const BIRD_FLOCKS: BirdFlock[] = [
  {
    top: 24,
    startLeft: "-8%",
    distance: "115vw",
    cycle: 132, // ~47s visible traverse
    delay: -30,
    birds: [
      { x: 0, y: 8, scale: 1, bobDelay: 0 },
      { x: 13, y: 1, scale: 0.85, bobDelay: -1.8 },
      { x: 25, y: 11, scale: 0.7, bobDelay: -3.4 },
      { x: 38, y: 5, scale: 0.9, bobDelay: -4.7 },
    ],
  },
  {
    top: 56,
    startLeft: "104%",
    distance: "-115vw",
    cycle: 150, // ~54s visible traverse
    delay: -98,
    birds: [
      { x: 0, y: 3, scale: 0.8, bobDelay: -2.3 },
      { x: 12, y: 10, scale: 0.65, bobDelay: -0.8 },
      { x: 24, y: 1, scale: 0.9, bobDelay: -3.9 },
    ],
  },
];
// Two short arced strokes: a distant-bird chevron.
const BIRD_WING_PATH = "M0.8 4.4 Q3 1.6 5 3.6 Q7 1.6 9.2 4.4";

export default function MountainBackground({
  frameMargin = 32,
  opacity = 1,
  stroke = DEFAULT_STROKE,
  mist = DEFAULT_MIST,
  mistBoost = 1,
  strokeBoost = 1,
  dashOpacityBoost = 1,
  transitionProgress,
  paused = false,
}: MountainBackgroundProps) {
  const inset = frameMargin + 1;
  const alpha = clamp01(opacity);
  const revealProgress = clamp01(transitionProgress ?? alpha);
  const previousProgressRef = useRef(revealProgress);
  const isEntering = revealProgress >= previousProgressRef.current;
  const layerCount = ALL_MOUNTAIN_LAYERS.length;
  const revealSpan = 0.35;
  const dashOpacity = easeInOut(revealProgress) * alpha * dashOpacityBoost;
  const dashColor = stroke;
  const skyOpacity = clamp01(easeInOut(revealProgress) * alpha);
  const animationPlayState = paused ? "paused" : "running";

  useEffect(() => {
    previousProgressRef.current = revealProgress;
  }, [revealProgress]);

  const renderMountainLayer = (layer: MountainLayer, index: number) => {
    const orderIndex = isEntering ? index : layerCount - 1 - index;
    const start =
      (orderIndex / Math.max(1, layerCount - 1)) * (1 - revealSpan);
    const reveal = easeInOut(clamp01((revealProgress - start) / revealSpan));
    const color = layer.tone === "mist" ? mist : stroke;
    const mistHeight = clamp01((layer.bottom - 24) / 90);
    const depthFade = layer.tone === "mist" ? 1 - mistHeight * 0.3 : 1;
    const toneBoost = layer.tone === "mist" ? mistBoost : strokeBoost;
    const layerOpacity = clamp01(
      layer.opacity * depthFade * toneBoost * reveal * alpha,
    );
    const layerBottom =
      layer.tone === "mist" ? layer.bottom - MIST_VERTICAL_SHIFT : layer.bottom;
    const fly = FLY_PARAMS[index];
    // The fly keyframes own `transform` and `opacity`, so the old
    // translateX(-50%) centering moves into `left`, the flip moves onto an
    // inner mask div, and the staggered reveal flows through --base-opacity
    // (CSS animations override inline opacity; the keyframes consume the var).
    const layerStyle = {
      position: "absolute",
      left: `${layer.left - layer.width / 2}%`,
      bottom: `${layerBottom}%`,
      width: `${layer.width}%`,
      aspectRatio: String(layer.aspect),
      maxHeight: "100%",
      opacity: layerOpacity,
      transformOrigin: "center bottom",
      animation: `mountain-fly ${fly.duration.toFixed(1)}s linear ${fly.delay.toFixed(1)}s infinite`,
      animationPlayState,
      // No willChange: permanently promoting ~170 masked layers exhausts GPU
      // texture memory and the compositor flickers white tiles.
      "--base-opacity": layerOpacity,
      "--fly-dir-x": fly.dirX.toFixed(3),
      "--fly-end-scale": fly.endScale.toFixed(2),
    } as CSSProperties;
    const maskStyle: CSSProperties = {
      width: "100%",
      height: "100%",
      backgroundColor: color,
      transform: layer.flip ? "scaleX(-1)" : undefined,
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
        style={layerStyle}
      >
        <div style={maskStyle} />
      </div>
    );
  };

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
        aria-hidden="true"
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          top: inset,
          bottom: inset,
          opacity: dashOpacity,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {DASH_STRIPS.map((strip, stripIndex) => {
          const motion = DASH_STRIP_MOTION[stripIndex];
          const dashShift = motion
            ? `${(motion.amplitude * motion.direction).toFixed(2)}px`
            : "0px";
          const dashAnimation = motion
            ? `dash-drift ${motion.duration.toFixed(
                1,
              )}s linear ${motion.delay.toFixed(1)}s infinite alternate`
            : undefined;
          const stripStyle = {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${strip.bottom.toFixed(2)}%`,
            height: `${strip.thickness.toFixed(2)}px`,
            animation: dashAnimation,
            animationPlayState,
            transform: "translateX(0px)",
            "--dash-shift": dashShift,
          } as CSSProperties;
          return (
            <div
              key={`dash-strip-${stripIndex}`}
              className="dash-strip"
              style={stripStyle}
            >
              {strip.segments.map((segment, segmentIndex) => (
                <span
                  key={`dash-${stripIndex}-${segmentIndex}`}
                  style={{
                    position: "absolute",
                    left: `${segment.left.toFixed(2)}%`,
                    width: `${segment.width.toFixed(2)}%`,
                    height: "100%",
                    backgroundColor: dashColor,
                    opacity: segment.opacity,
                    borderRadius: "999px",
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          top: inset,
          height: `${SKY_REGION_HEIGHT}%`,
          overflow: "hidden",
          opacity: skyOpacity,
          pointerEvents: "none",
        }}
      >
        {BIRD_FLOCKS.map((flock, flockIndex) => {
          const flockStyle = {
            position: "absolute",
            top: `${flock.top}%`,
            left: flock.startLeft,
            width: FLOCK_WIDTH,
            height: FLOCK_HEIGHT,
            opacity: 0,
            animation: `bird-flock-traverse ${flock.cycle}s linear ${flock.delay}s infinite`,
            animationPlayState,
            willChange: "transform, opacity",
            ["--flock-distance" as const]: flock.distance,
          } as CSSProperties;
          return (
            <div
              key={`bird-flock-${flockIndex}`}
              className="bird-flock"
              style={flockStyle}
            >
              {flock.birds.map((bird, birdIndex) => (
                <span
                  key={`bird-${flockIndex}-${birdIndex}`}
                  className="bird"
                  style={{
                    position: "absolute",
                    left: bird.x,
                    top: bird.y,
                    display: "block",
                    lineHeight: 0,
                    opacity: BIRD_OPACITY,
                    animation: `bird-bob ${BIRD_BOB_DURATION}s ease-in-out ${bird.bobDelay}s infinite alternate`,
                    animationPlayState,
                  }}
                >
                  <svg
                    width={(BIRD_WIDTH * bird.scale).toFixed(1)}
                    height={(BIRD_HEIGHT * bird.scale).toFixed(1)}
                    viewBox={`0 0 ${BIRD_WIDTH} ${BIRD_HEIGHT}`}
                    fill="none"
                  >
                    <path
                      d={BIRD_WING_PATH}
                      stroke={stroke}
                      strokeWidth={0.9}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          bottom: inset,
          height: `${(MOUNTAIN_CONTAINER_HEIGHT * 100).toFixed(2)}%`,
          overflow: "hidden",
        }}
      >
        {ALL_MOUNTAIN_LAYERS.map((layer, index) =>
          renderMountainLayer(layer, index),
        )}
        {MIST_BANDS.map((band, bandIndex) => {
          const bandOpacity = clamp01(
            band.opacity * mistBoost * easeInOut(revealProgress) * alpha,
          );
          const bandStyle = {
            position: "absolute",
            left: `${(-(MIST_BAND_WIDTH - 100) / 2).toFixed(1)}%`,
            width: `${MIST_BAND_WIDTH}%`,
            bottom: `${band.bottom}%`,
            height: `${band.height}%`,
            opacity: bandOpacity,
            animation: `mist-drift ${band.driftDuration}s ease-in-out ${band.driftDelay}s infinite alternate`,
            animationPlayState,
            ["--mist-shift" as const]: `${band.shift}%`,
          } as CSSProperties;
          return (
            <div
              key={`mist-band-${bandIndex}`}
              className="mountain-mist-band"
              style={bandStyle}
            >
              <div
                className="mountain-mist-breathe"
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(90deg, transparent 0%, ${mist} 35%, ${mist} 65%, transparent 100%)`,
                  maskImage: MIST_FEATHER_MASK,
                  WebkitMaskImage: MIST_FEATHER_MASK,
                  animation: `mist-breathe ${band.breatheDuration}s ease-in-out ${band.breatheDelay}s infinite alternate`,
                  animationPlayState,
                }}
              />
            </div>
          );
        })}
        <style jsx global>{`
          @keyframes dash-drift {
            0% {
              transform: translateX(calc(var(--dash-shift) * -1));
            }
            100% {
              transform: translateX(var(--dash-shift));
            }
          }
          /* NOTE: styled-jsx drops keyframe blocks whose selectors are template
             interpolations, so every value below is a literal. Keep in sync with
             the FLY_* constants above (90/-35 start offsets, 0.72 remaining at
             the 30% growth stop, fade-in 15%, mid 60%, fade-out from 82%). */
          @keyframes mountain-fly {
            0% {
              transform: translate(calc(var(--fly-dir-x) * -90%), -35%)
                scale(0.15);
              opacity: 0;
            }
            15% {
              opacity: calc(var(--base-opacity) * 0.85);
            }
            30% {
              transform: translate(calc(var(--fly-dir-x) * -64.8%), -25.2%)
                scale(0.38);
            }
            60% {
              transform: translate(0%, 0%) scale(1);
              opacity: var(--base-opacity);
            }
            82% {
              opacity: var(--base-opacity);
            }
            100% {
              transform: translate(calc(var(--fly-dir-x) * 150%), 70%)
                scale(var(--fly-end-scale));
              opacity: 0;
            }
          }
          @keyframes mist-drift {
            0% {
              transform: translateX(calc(var(--mist-shift) * -1));
            }
            100% {
              transform: translateX(var(--mist-shift));
            }
          }
          /* Literal values — keep in sync with MIST_BREATHE_MIN and BIRD_*
             constants above (see the styled-jsx note on mountain-fly). */
          @keyframes mist-breathe {
            0% {
              opacity: 0.7;
            }
            100% {
              opacity: 1;
            }
          }
          @keyframes bird-flock-traverse {
            0% {
              transform: translateX(0);
              opacity: 0;
            }
            2% {
              opacity: 1;
            }
            33% {
              opacity: 1;
            }
            36% {
              transform: translateX(var(--flock-distance));
              opacity: 0;
            }
            100% {
              transform: translateX(var(--flock-distance));
              opacity: 0;
            }
          }
          @keyframes bird-bob {
            0% {
              transform: translateY(-1.4px);
            }
            100% {
              transform: translateY(1.4px);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .dash-strip {
              animation: none !important;
              transform: translateX(0px) !important;
            }
            .mountain-layer {
              animation: none !important;
              transform: translate(0, 0) scale(1) !important;
              opacity: var(--base-opacity) !important;
            }
            .mountain-mist-band {
              animation: none !important;
              transform: translateX(0) !important;
            }
            .mountain-mist-breathe {
              animation: none !important;
              opacity: 1 !important;
            }
            .bird-flock {
              animation: none !important;
              transform: translateX(0) !important;
              opacity: 0 !important;
            }
            .bird {
              animation: none !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
