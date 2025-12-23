"use client";

import { useState } from "react";

import SerpentBackground, {
  DEFAULT_PALETTE,
  LIGHT_PALETTE,
} from "./components/SerpentBackground";

export default function Home() {
  const [isLight, setIsLight] = useState(false);
  const theme = isLight
    ? {
        palette: LIGHT_PALETTE,
        text: "#4a4740",
        iconShadow: "drop-shadow(0 4px 14px rgba(128, 14, 20, 0.45))",
        iconRing: "rgba(128, 14, 20, 0.5)",
      }
    : {
        palette: DEFAULT_PALETTE,
        text: "#e6e1d8",
        iconShadow: "drop-shadow(0 4px 14px rgba(230, 225, 216, 0.45))",
        iconRing: "rgba(230, 225, 216, 0.4)",
      };

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background: theme.palette.background,
        color: theme.text,
        transition: "background 700ms ease, color 700ms ease",
      }}
    >
      <SerpentBackground palette={theme.palette} />

      <div className="pointer-events-none absolute inset-0 z-10">
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

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-5xl font-semibold tracking-tight">Charles Benello</h1>
        <p className="mt-4 text-lg opacity-80">
          WIP personal website.
        </p>
      </div>
    </main>
  );
}
