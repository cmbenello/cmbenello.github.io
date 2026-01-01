"use client";

import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
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
  { label: "Research + Teaching" },
  { label: "Projects" },
];

const FRAME_MARGIN = 32;
const NAV_BUTTON_SIZE = 26;
const NAV_DOT_SIZE = 10;
const NAV_GAP = 4;
const NAV_STACK_GAP = 16;
const NAV_RIGHT = Math.max(4, FRAME_MARGIN - NAV_BUTTON_SIZE - NAV_GAP);
const NAV_TOP = Math.round(FRAME_MARGIN * 2.4);
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
  const [panelHeight, setPanelHeight] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const panels = Children.toArray(children);
  const panelCount = Math.min(panels.length, NAV_ITEMS.length);
  const visiblePanels = panels.slice(0, panelCount);
  const clampIndex = (value: number) =>
    Math.min(Math.max(value, 0), Math.max(0, panelCount - 1));

  const theme = isLight
    ? {
        palette: LIGHT_PALETTE,
        text: "#4a4740",
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

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !panelHeight) return;
    scrollEl.scrollTo({ top: activeIndex * panelHeight });
    setScrollProgress(activeIndex);
  }, [panelHeight]);

  useEffect(() => {
    if (activeIndex >= panelCount) {
      const nextIndex = Math.max(0, panelCount - 1);
      setActiveIndex(nextIndex);
      const scrollEl = scrollRef.current;
      if (scrollEl && panelHeight) {
        scrollEl.scrollTo({ top: nextIndex * panelHeight });
      }
    }
  }, [activeIndex, panelCount, panelHeight]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !panelHeight) return;

    const updateProgress = () => {
      const progress = scrollEl.scrollTop / panelHeight;
      setScrollProgress(progress);
      const nextIndex = clampIndex(Math.round(progress));
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    };

    const handleScroll = () => {
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
  }, [panelCount, panelHeight]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !panelHeight) return;
    let lastWheelAt = 0;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const direction = Math.sign(event.deltaY);
      if (!direction) return;
      const now = performance.now();
      if (now - lastWheelAt < 220) {
        event.preventDefault();
        return;
      }
      lastWheelAt = now;
      const currentIndex = Math.round(scrollEl.scrollTop / panelHeight);
      const maxIndex = Math.max(0, panelCount - 1);
      const nextIndex = Math.min(
        maxIndex,
        Math.max(0, currentIndex + direction),
      );
      scrollEl.scrollTo({
        top: nextIndex * panelHeight,
        behavior: "smooth",
      });
      event.preventDefault();
    };
    scrollEl.addEventListener("wheel", onWheel, { passive: false });
    return () => scrollEl.removeEventListener("wheel", onWheel);
  }, [panelCount, panelHeight]);

  const panelStyle = panelHeight
    ? ({ height: panelHeight } as const)
    : undefined;
  const maxIndex = Math.max(0, panelCount - 1);
  const progress = panelHeight ? clamp(scrollProgress, 0, maxIndex) : activeIndex;
  const serpentBlend = easeInOut(clamp01(1 - Math.abs(progress) / 0.6));
  const cloudBlend =
    panelCount > 1
      ? easeInOut(clamp01(1 - Math.abs(progress - 1) / 0.35))
      : 0;
  const mountainBlend =
    panelCount > 2
      ? easeInOut(clamp01(1 - Math.abs(progress - 2) / 0.3))
      : 0;
  const waterBlend =
    panelCount > 3
      ? easeInOut(clamp01(1 - Math.abs(progress - 3) / 0.3))
      : 0;
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
      ? "0 1px 8px rgba(0, 0, 0, 0.22)"
      : "0 2px 22px rgba(0, 0, 0, 0.65)",
  } as const;
  const scrimStrong = isLight
    ? "rgba(249, 238, 210, 0.92)"
    : "rgba(10, 11, 13, 0.78)";
  const scrimSoft = isLight
    ? "rgba(249, 238, 210, 0.5)"
    : "rgba(10, 11, 13, 0.32)";
  const scrimClear = isLight
    ? "rgba(249, 238, 210, 0)"
    : "rgba(10, 11, 13, 0)";
  const contentScrimStyle = {
    backgroundImage: `radial-gradient(1200px 520px at 18% 12%, ${scrimStrong} 0%, ${scrimSoft} 55%, ${scrimClear} 100%), radial-gradient(1000px 520px at 78% 62%, ${scrimStrong} 0%, ${scrimSoft} 52%, ${scrimClear} 100%)`,
    transition: "background-image 700ms ease",
  } as const;
  const navStep = NAV_BUTTON_SIZE + NAV_STACK_GAP;
  const navProgress = progress;
  const cloudGradient = `linear-gradient(180deg, ${mainBackgroundColor} 0%, ${mainBackgroundColor} 100%)`;
  const mountainBackground = mainBackgroundColor;
  const waveColor = isLight
    ? "rgba(192, 42, 50, 0.85)"
    : "rgba(255, 255, 255, 0.85)";
  return (
    <main
      className="relative h-screen overflow-hidden"
      style={{
        backgroundColor: mainBackgroundColor,
        backgroundImage: "none",
        color: theme.text,
        transition: "background-color 700ms ease, color 700ms ease",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: cloudGradient,
          opacity: cloudBlend,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: mountainBackground,
          opacity: mountainBlend,
        }}
      />
      <SerpentBackground
        palette={theme.palette}
        frameMargin={FRAME_MARGIN}
        starVisibility={showStars}
        serpentVisibility={serpentStrength}
        backgroundOpacity={serpentBackgroundOpacity}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: cloudBlend }}
      >
        <CloudBackground
          frameMargin={FRAME_MARGIN}
          active={cloudActive}
          palette={cloudPalette}
          skyOpacity={0}
        />
      </div>
      <MountainBackground
        frameMargin={FRAME_MARGIN}
        opacity={1}
        transitionProgress={mountainBlend}
        stroke={mountainPalette.stroke}
        mist={mountainPalette.mist}
        mistBoost={mountainToneBoost.mist}
        strokeBoost={mountainToneBoost.stroke}
        dashOpacityBoost={isLight ? 0.55 : 1}
      />
      <WaveBackground
        frameMargin={FRAME_MARGIN}
        opacity={waterBlend * 0.7}
        backgroundColor="transparent"
        lineColor={waveColor}
      />

      <div className="pointer-events-none fixed inset-0 z-20">
        <nav
          aria-label="Site sections"
          className="pointer-events-auto absolute flex flex-col items-center"
          style={{
            right: NAV_RIGHT,
            top: NAV_TOP,
            gap: NAV_STACK_GAP,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: NAV_BUTTON_SIZE,
              height: NAV_BUTTON_SIZE,
              borderRadius: 7,
              border: `1px solid ${theme.iconRing}`,
              boxShadow: `0 0 12px ${theme.iconRing}`,
              transform: `translate(-50%, ${navProgress * navStep}px)`,
              transition: "border-color 700ms ease, box-shadow 700ms ease",
              pointerEvents: "none",
            }}
          />
          {NAV_ITEMS.slice(0, panelCount).map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                aria-pressed={isActive}
                title={item.label}
                onClick={() => {
                  setActiveIndex(index);
                  const scrollEl = scrollRef.current;
                  if (scrollEl && panelHeight) {
                    scrollEl.scrollTo({
                      top: index * panelHeight,
                      behavior: "smooth",
                    });
                  }
                }}
                className="group relative flex items-center justify-center rounded-md hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  width: NAV_BUTTON_SIZE,
                  height: NAV_BUTTON_SIZE,
                  borderRadius: 7,
                  border: "1px solid transparent",
                  transition:
                    "transform 300ms ease, border-color 700ms ease, box-shadow 700ms ease",
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.35em] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 translate-x-2"
                  style={{
                    color: theme.text,
                    borderColor: theme.iconRing,
                    backgroundColor: isLight
                      ? "rgba(249, 238, 210, 0.92)"
                      : "rgba(20, 21, 23, 0.85)",
                    boxShadow: `0 10px 30px rgba(0, 0, 0, 0.25)`,
                  }}
                >
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: NAV_DOT_SIZE,
                    height: NAV_DOT_SIZE,
                    borderRadius: 999,
                    backgroundColor: theme.text,
                    opacity: isActive ? 0.75 : 0.35,
                    boxShadow: isActive ? `0 0 8px ${theme.iconRing}` : "none",
                    transition:
                      "opacity 200ms ease, box-shadow 700ms ease, background-color 700ms ease",
                  }}
                />
              </button>
            );
          })}
        </nav>

        <div className="pointer-events-auto absolute bottom-8 right-8">
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

      <div className="absolute z-10" style={{ inset: FRAME_MARGIN }}>
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
            {visiblePanels.map((panel, index) => (
              <section
                key={NAV_ITEMS[index]?.label ?? index}
                className="flex h-full w-full items-start"
                style={{
                  ...panelStyle,
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                <div
                  className="w-full px-10 py-14 lg:px-20"
                  style={contentPanelStyle}
                >
                  {panel}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
