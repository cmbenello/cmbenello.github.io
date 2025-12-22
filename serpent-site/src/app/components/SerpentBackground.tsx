"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
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

export default function SerpentBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);

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
          a: 0.07 + Math.random() * 0.14,
        };
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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      pathPoints = [];
      pathNeedsInit = true;
    }

    function draw(now: number) {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const dt = Math.min(0.033, Math.max(0.008, (now - last) * 0.001));
      last = now;
      const nowSec = now * 0.001;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#141517";
      ctx.fillRect(0, 0, w, h);

      const min = Math.min(w, h);
      if (pathNeedsInit) resetHead(nowSec);

      let lifeAge = nowSec - lifeStart;
      let totalDuration = lifeDuration + respawnDelay;
      if (lifeAge >= totalDuration) {
        resetHead(nowSec);
        lifeAge = 0;
        totalDuration = lifeDuration + respawnDelay;
      }
      const paused = lifeAge >= lifeDuration;

      const growT = clamp(lifeAge / growDuration, 0, 1);
      const fadeDuration = Math.min(0.6, lifeDuration * 0.25);
      const fadeOutT = clamp((lifeAge - (lifeDuration - fadeDuration)) / fadeDuration, 0, 1);
      const growEase = 1 - Math.pow(1 - growT, 2);
      const fadeEase = 1 - Math.pow(1 - fadeOutT, 2);
      const visibility = growEase * (1 - fadeEase);
      const growthWidth = 0.2 + 0.8 * growEase;
      const scaleVisibility = clamp((growEase - 0.2) / 0.8, 0, 1) * (1 - fadeEase);
      const overlayAlpha = scaleVisibility * 0.35;
      const activeSegments = paused
        ? 0
        : Math.max(1, Math.round(1 + (segmentCount - 1) * growEase));

      const snakeSpeed = min * 0.12;
      const samples: Sample[] = [];
      if (!paused) {
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

      ctx.fillStyle = "#b2bbc6";
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
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
            pushX += (radialX * radialPush + sample.tngX * forwardPush + swirlX * swirlPush) * weight;
            pushY += (radialY * radialPush + sample.tngY * forwardPush + swirlY * swirlPush) * weight;
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
        ctx.globalAlpha = Math.min(1, dot.a + wake * 0.45);
        ctx.beginPath();
        const r = dot.r * (1 + wake * 0.25);
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
        ctx.fill();
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
        glow.addColorStop(0, `rgba(120, 190, 255, ${0.04 * visibility})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(head.x, head.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          const alpha = 0.015 * visibility * s.w;
          if (alpha < 0.005) continue;
          ctx.fillStyle = `rgba(130, 200, 255, ${alpha})`;
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
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current = null;
    };
  }, []);

  const MARGIN = 6;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: "#141517",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          borderRadius: 0,
          background: "transparent",
          border: "1px solid #ffffff",
          boxShadow: "none",
          overflow: "hidden",
          position: "absolute",
          inset: MARGIN,
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
