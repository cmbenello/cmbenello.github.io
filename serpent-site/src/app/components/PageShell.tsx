"use client";

import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import SerpentBackground, {
  DEFAULT_PALETTE,
  LIGHT_PALETTE,
} from "./SerpentBackground";

const NAV_ITEMS = [
  { label: "Work" },
  { label: "Research" },
  { label: "Tattoo" },
  { label: "Elements" },
];

const FRAME_MARGIN = 32;
const TRANSITION_MS = 520;
const NAV_BUTTON_SIZE = 26;
const NAV_DOT_SIZE = 10;
const NAV_GAP = 4;
const NAV_RIGHT = Math.max(4, FRAME_MARGIN - NAV_BUTTON_SIZE - NAV_GAP);
const NAV_TOP = Math.round(FRAME_MARGIN * 2.4);

type PageShellProps = {
  children: ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  const [isLight, setIsLight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [panelHeight, setPanelHeight] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const panels = Children.toArray(children);
  const panelCount = Math.min(panels.length, NAV_ITEMS.length);
  const visiblePanels = panels.slice(0, panelCount);

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

  useEffect(() => {
    if (activeIndex >= panelCount) {
      setActiveIndex(Math.max(0, panelCount - 1));
    }
  }, [activeIndex, panelCount]);

  const offset = panelHeight ? activeIndex * panelHeight : 0;
  const railStyle = {
    transform: `translateY(-${offset}px)`,
    transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    willChange: "transform",
    height: panelHeight ? `${panelHeight * panelCount}px` : undefined,
  } as const;

  const panelStyle = panelHeight ? ({ height: panelHeight } as const) : undefined;

  return (
    <main
      className="relative h-screen overflow-hidden"
      style={{
        backgroundColor: theme.palette.background,
        color: theme.text,
        transition: "background-color 700ms ease, color 700ms ease",
      }}
    >
      <SerpentBackground palette={theme.palette} frameMargin={FRAME_MARGIN} />

      <div className="pointer-events-none fixed inset-0 z-20">
        <nav
          aria-label="Site sections"
          className="pointer-events-auto absolute flex flex-col items-center gap-4"
          style={{
            right: NAV_RIGHT,
            top: NAV_TOP,
          }}
        >
          {NAV_ITEMS.slice(0, panelCount).map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                aria-pressed={isActive}
                title={item.label}
                onClick={() => setActiveIndex(index)}
                className="flex items-center justify-center rounded-md hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  width: NAV_BUTTON_SIZE,
                  height: NAV_BUTTON_SIZE,
                  borderRadius: 7,
                  border: isActive ? `1px solid ${theme.iconRing}` : "1px solid transparent",
                  transition:
                    "transform 300ms ease, border-color 700ms ease, box-shadow 700ms ease",
                }}
              >
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
          <div style={railStyle}>
            {visiblePanels.map((panel, index) => (
              <section
                key={NAV_ITEMS[index]?.label ?? index}
                className="flex h-full w-full items-center"
                style={panelStyle}
              >
                <div className="mx-auto w-full max-w-3xl px-10 py-16">{panel}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
