import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume - Charles Benello",
  description: "Charles Benello's resume",
};

export default function Resume() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#1a1a1a",
      }}
    >
      <object
        data="/Charles_Benello_Resume.pdf"
        type="application/pdf"
        style={{ width: "100%", height: "100%", border: "none" }}
      >
        <iframe
          src="/Charles_Benello_Resume.pdf"
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Charles Benello Resume"
        />
      </object>
    </main>
  );
}
