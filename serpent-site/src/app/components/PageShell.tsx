"use client";

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import CloudBackground, {
  DARK_CLOUD_PALETTE,
  LIGHT_CLOUD_PALETTE,
} from "./CloudBackground";
import MountainBackground from "./MountainBackground";
import SerpentBackground, {
  DEFAULT_PALETTE,
  LIGHT_PALETTE,
} from "./SerpentBackground";
import WaveBackground from "./WaveBackground";

const NAV_ITEMS = [
  { label: "About" },
  { label: "Experience" },
  { label: "Research + Publications" },
  { label: "Projects" },
];

const DEFAULT_FRAME_MARGIN = 32;
const NAV_BUTTON_SIZE = 26;
const NAV_DOT_SIZE = 10;
const NAV_GAP = 4;
const NAV_STACK_GAP = 16;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const clamp01 = (value: number) => clamp(value, 0, 1);
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

type PageShellProps = {
  children: ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  const [isLight, setIsLight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);
  const [labelsReady, setLabelsReady] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [effectsPaused, setEffectsPaused] = useState(false);
  const [bgVisible, setBgVisible] = useState(false);
  const [frameMargin, setFrameMargin] = useState(DEFAULT_FRAME_MARGIN);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollRafRef = useRef<number | null>(null);
  const navigatingRef = useRef(false);
  const pauseSourcesRef = useRef<Set<string>>(new Set());
  const themePauseTimeoutRef = useRef<number | null>(null);
  const themeReadyRef = useRef(false);

  // Responsive frame margin
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setFrameMargin(w < 640 ? 12 : w < 1024 ? 20 : DEFAULT_FRAME_MARGIN);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const navRight = Math.max(4, frameMargin - NAV_BUTTON_SIZE - NAV_GAP);
  const navTop = Math.round(frameMargin * 2.4);

  const panels = Children.toArray(children);
  const panelCount = Math.min(panels.length, NAV_ITEMS.length);
  const visiblePanels = panels.slice(0, panelCount);
  const clampIndex = (value: number) =>
    Math.min(Math.max(value, 0), Math.max(0, panelCount - 1));

  const theme = isLight
    ? {
        palette: LIGHT_PALETTE,
        text: "#2f2b26",
        iconShadow: "drop-shadow(0 4px 14px rgba(128, 14, 20, 0.3))",
        iconRing: "rgba(128, 14, 20, 0.22)",
      }
    : {
        palette: DEFAULT_PALETTE,
        text: "#e6e1d8",
        iconShadow: "drop-shadow(0 4px 14px rgba(230, 225, 216, 0.28))",
        iconRing: "rgba(230, 225, 216, 0.2)",
      };
  const cloudPalette = isLight ? LIGHT_CLOUD_PALETTE : DARK_CLOUD_PALETTE;

  useEffect(() => {
    const id = setTimeout(() => setBgVisible(true), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setLabelsReady(true), 1600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    const prevDoc = doc.style.overflow;
    const prevBody = body.style.overflow;
    doc.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      doc.style.overflow = prevDoc;
      body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    const onEffectsPause = (event: Event) => {
      const detail = (event as CustomEvent<{ source?: string; active?: boolean }>)
        .detail;
      if (!detail) return;
      const source = detail.source || "unknown";
      if (detail.active) {
        pauseSourcesRef.current.add(source);
      } else {
        pauseSourcesRef.current.delete(source);
      }
      setEffectsPaused(pauseSourcesRef.current.size > 0);
    };
    window.addEventListener("effects-pause", onEffectsPause as EventListener);
    return () =>
      window.removeEventListener("effects-pause", onEffectsPause as EventListener);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pauseSourcesRef.current.add("tab-hidden");
        setEffectsPaused(true);
      } else {
        pauseSourcesRef.current.delete("tab-hidden");
        setEffectsPaused(pauseSourcesRef.current.size > 0);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!themeReadyRef.current) {
      themeReadyRef.current = true;
      return;
    }
    pauseSourcesRef.current.add("theme");
    setEffectsPaused(true);
    if (themePauseTimeoutRef.current) {
      window.clearTimeout(themePauseTimeoutRef.current);
    }
    themePauseTimeoutRef.current = window.setTimeout(() => {
      pauseSourcesRef.current.delete("theme");
      setEffectsPaused(pauseSourcesRef.current.size > 0);
      themePauseTimeoutRef.current = null;
    }, 550);
    return () => {
      if (themePauseTimeoutRef.current) {
        window.clearTimeout(themePauseTimeoutRef.current);
        themePauseTimeoutRef.current = null;
      }
    };
  }, [isLight]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setPanelHeight(frame.clientHeight);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Compute scroll progress from actual section offsets
  const computeProgress = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return { progress: 0, index: 0 };
    const sections = sectionRefs.current;
    const scrollTop = scrollEl.scrollTop;
    const count = sections.filter(Boolean).length;
    if (count === 0) return { progress: 0, index: 0 };

    for (let i = count - 1; i >= 0; i--) {
      const sec = sections[i];
      if (!sec) continue;
      const top = sec.offsetTop;
      if (scrollTop >= top) {
        const nextSec = sections[i + 1];
        const nextTop = nextSec ? nextSec.offsetTop : top + sec.offsetHeight;
        const span = nextTop - top;
        const frac = span > 0 ? (scrollTop - top) / span : 0;
        return { progress: i + clamp01(frac), index: Math.round(i + clamp01(frac)) };
      }
    }
    return { progress: 0, index: 0 };
  }, []);

  // Track activeIndex in a ref so the layout sync effect doesn't re-run on index change
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !panelHeight) return;
    const idx = activeIndexRef.current;
    const sec = sectionRefs.current[idx];
    if (sec) {
      scrollEl.scrollTo({ top: sec.offsetTop });
    } else {
      scrollEl.scrollTo({ top: idx * panelHeight });
    }
    setScrollProgress(idx);
  }, [panelHeight]);

  useEffect(() => {
    if (activeIndex >= panelCount) {
      const nextIndex = Math.max(0, panelCount - 1);
      setActiveIndex(nextIndex);
      const sec = sectionRefs.current[nextIndex];
      const scrollEl = scrollRef.current;
      if (scrollEl && sec) {
        scrollEl.scrollTo({ top: sec.offsetTop });
      }
    }
  }, [activeIndex, panelCount, panelHeight]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !panelHeight) return;

    const updateProgress = () => {
      const { progress, index } = computeProgress();
      setScrollProgress(progress);
      const nextIndex = clampIndex(index);
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    };

    const handleScroll = () => {
      if (navigatingRef.current) return;
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updateProgress();
      });
    };

    updateProgress();
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, [panelCount, panelHeight, computeProgress]);

  const maxIndex = Math.max(0, panelCount - 1);
  // Use activeIndex (integer) for background blends so they stay full-strength
  // while scrolling within a section. CSS transitions handle the crossfade.
  const bgIndex = activeIndex;
  const serpentBlend = bgIndex === 0 ? 1 : 0;
  const cloudBlend = panelCount > 1 && bgIndex === 1 ? 1 : 0;
  const mountainBlend = panelCount > 2 && bgIndex === 2 ? 1 : 0;
  const waterBlend = panelCount > 3 && bgIndex === 3 ? 1 : 0;
  const cloudActive = cloudBlend > 0.02;
  const showStars = serpentBlend;
  const serpentStrength = serpentBlend;
  const serpentBackgroundOpacity = serpentBlend;
  const mainBackgroundColor = isLight
    ? LIGHT_PALETTE.background
    : DEFAULT_PALETTE.background;
  const mountainToneBoost = isLight
    ? { mist: 1.5, stroke: 1.4 }
    : { mist: 1.6, stroke: 1.1 };
  const mountainPalette = isLight
    ? {
        stroke: "rgba(192, 42, 50, 0.72)",
        mist: "rgba(192, 42, 50, 0.24)",
      }
    : {
        stroke: "rgba(230, 225, 216, 0.55)",
        mist: "rgba(230, 225, 216, 0.22)",
      };
  const contentPanelStyle = {
    textShadow: isLight
      ? "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 12px rgba(0, 0, 0, 0.08)"
      : "0 1px 3px rgba(0, 0, 0, 0.5), 0 2px 16px rgba(0, 0, 0, 0.4)",
  } as const;
  const contentScrimStyle = {
    backgroundImage: "none",
  } as const;
  const navStep = NAV_BUTTON_SIZE + NAV_STACK_GAP;
  const navProgress = activeIndex;
  const cloudGradient = `linear-gradient(180deg, ${mainBackgroundColor} 0%, ${mainBackgroundColor} 100%)`;
  const mountainBackground = mainBackgroundColor;
  const waveColor = isLight
    ? "rgba(140, 28, 36, 1)"
    : "rgba(255, 255, 255, 0.85)";
  return (
    <main
      className="relative h-screen overflow-hidden"
      style={({
        backgroundColor: mainBackgroundColor,
        backgroundImage: "none",
        color: theme.text,
        transition: "background-color 700ms ease, color 700ms ease",
        ["--panel-surface" as const]: isLight
          ? "rgba(252, 244, 228, 0.82)"
          : "rgba(28, 30, 38, 0.85)",
        ["--panel-border" as const]: isLight
          ? "rgba(47, 43, 38, 0.35)"
          : "rgba(230, 225, 216, 0.3)",
        ["--panel-border-strong" as const]: isLight
          ? "rgba(47, 43, 38, 0.6)"
          : "rgba(230, 225, 216, 0.55)",
        ["--accent-rgb" as const]: isLight ? "192 42 50" : "230 225 216",
        ["--accent-color" as const]: isLight
          ? "rgba(192, 42, 50, 0.92)"
          : "rgba(230, 225, 216, 0.92)",
        ["--accent-1" as const]: isLight
          ? "rgba(192, 42, 50, 0.18)"
          : "rgba(230, 225, 216, 0.18)",
        ["--accent-2" as const]: isLight
          ? "rgba(192, 42, 50, 0.35)"
          : "rgba(230, 225, 216, 0.35)",
        ["--accent-3" as const]: isLight
          ? "rgba(192, 42, 50, 0.55)"
          : "rgba(230, 225, 216, 0.55)",
        ["--accent-4" as const]: isLight
          ? "rgba(192, 42, 50, 0.78)"
          : "rgba(230, 225, 216, 0.78)",
        ["--contrib-0" as const]: isLight
          ? "rgba(54, 90, 120, 0.08)"
          : "rgba(8, 18, 28, 0.88)",
        ["--contrib-1" as const]: isLight
          ? "rgba(62, 112, 154, 0.26)"
          : "rgba(78, 140, 196, 0.28)",
        ["--contrib-2" as const]: isLight
          ? "rgba(58, 142, 186, 0.48)"
          : "rgba(86, 172, 216, 0.5)",
        ["--contrib-3" as const]: isLight
          ? "rgba(48, 168, 204, 0.7)"
          : "rgba(96, 206, 232, 0.74)",
        ["--contrib-4" as const]: isLight
          ? "rgba(28, 196, 222, 0.92)"
          : "rgba(140, 234, 255, 0.9)",
        ["--contrib-border" as const]: isLight
          ? "rgba(48, 92, 128, 0.3)"
          : "rgba(84, 128, 164, 0.24)",
      }) as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: cloudGradient,
          opacity: cloudBlend,
          transition: "opacity 600ms ease",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: mountainBackground,
          opacity: mountainBlend,
          transition: "opacity 600ms ease",
        }}
      />
      <div style={{ opacity: bgVisible ? (serpentBlend ? 1 : 0) : 0, transition: "opacity 600ms ease" }}>
        <SerpentBackground
          palette={theme.palette}
          frameMargin={frameMargin}
          starVisibility={showStars}
          serpentVisibility={serpentStrength}
          backgroundOpacity={serpentBackgroundOpacity}
          paused={effectsPaused}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: cloudBlend, transition: "opacity 600ms ease" }}
      >
          <CloudBackground
            frameMargin={frameMargin}
            active={cloudActive}
            palette={cloudPalette}
            skyOpacity={0}
            paused={effectsPaused}
          />
      </div>
      <MountainBackground
        frameMargin={frameMargin}
        opacity={1}
        transitionProgress={mountainBlend}
        stroke={mountainPalette.stroke}
        mist={mountainPalette.mist}
        mistBoost={mountainToneBoost.mist}
        strokeBoost={mountainToneBoost.stroke}
        dashOpacityBoost={isLight ? 0.55 : 1}
        paused={effectsPaused}
      />
      <WaveBackground
        frameMargin={frameMargin}
        opacity={waterBlend * (isLight ? 0.85 : 0.6)}
        backgroundColor="transparent"
        lineColor={waveColor}
        alphaBoost={isLight ? 5 : 1}
        trailFade={isLight ? 0.05 : 0.072}
        lineWidthScale={isLight ? 1.3 : 1}
        paused={effectsPaused}
      />

      <div className="pointer-events-none fixed inset-0 z-20">
        <nav
          aria-label="Site sections"
          className="pointer-events-auto absolute hidden flex-col items-center entrance lg:flex"
          style={{
            animationDelay: "1000ms",
            left: navRight,
            top: navTop,
            gap: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: NAV_STACK_GAP / 2,
              left: "50%",
              width: NAV_BUTTON_SIZE,
              height: NAV_BUTTON_SIZE,
              borderRadius: 7,
              border: `1px solid ${theme.iconRing}`,
              boxShadow: `0 0 12px ${theme.iconRing}`,
              transform: `translate(-50%, ${navProgress * navStep}px)`,
              transition: "transform 250ms ease, border-color 700ms ease, box-shadow 700ms ease",
              pointerEvents: "none",
            }}
          />
          {NAV_ITEMS.slice(0, panelCount).map((item, index) => {
            const isActive = activeIndex === index;
            const labelVisible = labelsReady && activeIndex === 0;
            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                aria-pressed={isActive}
                title={item.label}
                onClick={() => {
                  setActiveIndex(index);
                  navigatingRef.current = true;
                  const scrollEl = scrollRef.current;
                  const sec = sectionRefs.current[index];
                  if (scrollEl && sec) {
                    scrollEl.scrollTo({
                      top: sec.offsetTop,
                      behavior: "smooth",
                    });
                  } else if (scrollEl && panelHeight) {
                    scrollEl.scrollTo({
                      top: index * panelHeight,
                      behavior: "smooth",
                    });
                  }
                  setTimeout(() => { navigatingRef.current = false; }, 800);
                }}
                onMouseEnter={() => setHoveredNavIndex(index)}
                onMouseLeave={() => setHoveredNavIndex(null)}
                className="relative flex items-center justify-center rounded-md hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  width: NAV_BUTTON_SIZE,
                  height: NAV_BUTTON_SIZE + NAV_STACK_GAP,
                  borderRadius: 7,
                  border: "1px solid transparent",
                  transition: "transform 300ms ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: NAV_DOT_SIZE,
                    height: NAV_DOT_SIZE,
                    borderRadius: 999,
                    backgroundColor: theme.text,
                    opacity: isActive ? 0.85 : (hoveredNavIndex === index ? 0.65 : 0.5),
                    boxShadow: isActive ? `0 0 8px ${theme.iconRing}` : "none",
                    transition:
                      "opacity 200ms ease, box-shadow 700ms ease, background-color 700ms ease",
                  }}
                />
                {/* Transparent bridge to eliminate dead zone between dot and label */}
                <span aria-hidden="true" style={{ position: "absolute", left: "100%", top: 0, bottom: 0, width: 12 }} />
                <span
                  aria-hidden="true"
                  className="absolute left-full ml-3 whitespace-nowrap rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.35em]"
                  style={{
                    color: theme.text,
                    borderColor: theme.iconRing,
                    backgroundColor: isLight
                      ? "rgba(249, 238, 210, 0.92)"
                      : "rgba(28, 30, 38, 0.88)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    opacity: hoveredNavIndex === index ? 1 : 0,
                    transform: hoveredNavIndex === index ? "translateX(0)" : "translateX(-6px)",
                    transition: "opacity 200ms ease, transform 200ms ease, color 700ms ease, border-color 700ms ease, background-color 700ms ease",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="pointer-events-auto absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 entrance" style={{ animationDelay: "1100ms" }}>
          <button
            type="button"
            onClick={() => setIsLight((prev) => !prev)}
            aria-pressed={isLight}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            style={{
              background: "transparent",
              border: "none",
              color: theme.text,
              width: 56,
              height: 56,
              display: "grid",
              placeItems: "center",
              padding: 0,
              cursor: "pointer",
              borderRadius: 999,
              filter: theme.iconShadow,
              opacity: 1,
              transition: "color 700ms ease, filter 700ms ease",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "relative",
                width: 44,
                height: 44,
                display: "inline-block",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              >
                <img
                  src="/tarot/sun-icon-light.png"
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: isLight ? 1 : 0,
                    transform: "scale(1.25)",
                    transformOrigin: "center",
                    translate: "-3px -6px",
                    transition: "opacity 700ms ease",
                  }}
                />
                <img
                  src="/tarot/moon-icon-dark.png"
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: isLight ? 0 : 1,
                    transform: "scale(1.5)",
                    transformOrigin: "center",
                    translate: "-3px -6px",
                    transition: "opacity 700ms ease",
                  }}
                />
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="absolute z-10 entrance" style={{ inset: frameMargin, animationDelay: "700ms" }}>
        <div ref={frameRef} className="relative h-full w-full overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={contentScrimStyle}
          />
          <div
            ref={scrollRef}
            className="h-full w-full overflow-y-auto scrollbar-hidden"
            style={{
              scrollSnapType: "y mandatory",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {visiblePanels.map((panel, index) => {
              const isLast = index === visiblePanels.length - 1;
              const sectionStyle = panelHeight
                ? isLast
                  ? { minHeight: panelHeight, maxHeight: panelHeight, overflowY: "auto" as const }
                  : { minHeight: panelHeight }
                : {};
              return (
              <section
                key={NAV_ITEMS[index]?.label ?? index}
                ref={(el) => { sectionRefs.current[index] = el; }}
                className={`flex w-full items-start${isLast ? " scrollbar-hidden" : ""}`}
                style={{
                  ...sectionStyle,
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                <div
                  className="w-full px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-14 lg:px-20"
                  style={contentPanelStyle}
                >
                  {panel}
                </div>
              </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
