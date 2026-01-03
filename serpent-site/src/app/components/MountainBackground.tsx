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
    src: "/moutains/mountain3.png",
    width: 9,
    left: -4,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 9,
    left: 32,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 8,
    left: 68,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 9,
    left: 104,
    bottom: 100,
    opacity: 0.022,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: -8,
    bottom: 92,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 7,
    left: 10,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 6,
    left: 26,
    bottom: 94,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: 42,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 7,
    left: 58,
    bottom: 94,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 6,
    left: 74,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_FOUR_ASPECT,
    flip: true,
  },
  {
    src: "/moutains/mountain2.png",
    width: 6,
    left: 90,
    bottom: 94,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain3.png",
    width: 7,
    left: 108,
    bottom: 93,
    opacity: 0.019,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
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
    src: "/moutains/mountain3.png",
    width: 16,
    left: 86,
    bottom: 44,
    opacity: 0.085,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 14,
    left: 100,
    bottom: 43,
    opacity: 0.08,
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
    width: 14,
    left: 82,
    bottom: 56,
    opacity: 0.06,
    tone: "mist",
    aspect: MOUNTAIN_THREE_ASPECT,
  },
  {
    src: "/moutains/mountain2.png",
    width: 10,
    left: 94,
    bottom: 55,
    opacity: 0.058,
    tone: "mist",
    aspect: MOUNTAIN_TWO_ASPECT,
  },
  {
    src: "/moutains/mountain4.png",
    width: 12,
    left: 106,
    bottom: 55,
    opacity: 0.06,
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
    src: "/moutains/mountain2.png",
    width: 24,
    left: 114,
    bottom: 10,
    opacity: 0.14,
    tone: "stroke",
    aspect: MOUNTAIN_TWO_ASPECT,
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
const MAX_MOUNTAIN_PEAK = MOUNTAIN_LAYERS.reduce((maxPeak, layer) => {
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
  const layerCount = MOUNTAIN_LAYERS.length;
  const revealSpan = 0.35;
  const enableFlyThrough = true;
  const dashOpacity = easeInOut(revealProgress) * alpha * dashOpacityBoost;
  const dashColor = stroke;
  const animationPlayState = paused ? "paused" : "running";

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
          const stripStyle: CSSProperties = {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${strip.bottom.toFixed(2)}%`,
            height: `${strip.thickness.toFixed(2)}px`,
            animation: dashAnimation,
            animationPlayState,
            transform: "translateX(0px)",
            ["--dash-shift" as const]: dashShift,
          };
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
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          bottom: inset,
          height: `${(MOUNTAIN_CONTAINER_HEIGHT * 100).toFixed(2)}%`,
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
            layer.tone === "mist"
              ? layer.bottom - MIST_VERTICAL_SHIFT
              : layer.bottom;
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
            animationPlayState,
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
          @keyframes dash-drift {
            0% {
              transform: translateX(calc(var(--dash-shift) * -1));
            }
            100% {
              transform: translateX(var(--dash-shift));
            }
          }
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
            .dash-strip {
              animation: none !important;
              transform: translateX(0px) !important;
            }
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
