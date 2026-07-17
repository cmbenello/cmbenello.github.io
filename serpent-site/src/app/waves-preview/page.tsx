"use client";

import { useState } from "react";
import FluidWaveBackground from "../components/FluidWaveBackground";

/*
  Preview of the fluid-simulation wave background (candidate for the
  Projects section). Not linked from anywhere — visit /waves-preview.
  Toggle light/dark with the button to check both palettes.
*/

export default function WavesPreview() {
  const [isLight, setIsLight] = useState(false);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: isLight ? "#f6ecd9" : "#101218",
        transition: "background-color 700ms ease",
      }}
    >
      <FluidWaveBackground
        opacity={isLight ? 0.9 : 0.75}
        lineColor={isLight ? "rgba(140, 28, 36, 1)" : "rgba(255, 255, 255, 0.85)"}
        additive={!isLight}
        paused={false}
      />
      <button
        type="button"
        onClick={() => setIsLight((v) => !v)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10,
          padding: "8px 18px",
          borderRadius: 999,
          border: `1px solid ${isLight ? "rgba(47,43,38,0.4)" : "rgba(230,225,216,0.35)"}`,
          background: "transparent",
          color: isLight ? "#2f2b26" : "#e6e1d8",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {isLight ? "dark" : "light"}
      </button>
    </main>
  );
}
