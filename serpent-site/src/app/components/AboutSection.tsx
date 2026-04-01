import { ABOUT_PARAGRAPHS, EDUCATION, CURRENT_WORK, formatMetaLine } from "../data/page-data";

export default function AboutSection() {
  return (
    <section className="grid gap-x-10 gap-y-6 lg:grid-cols-12">
      <div className="lg:col-span-12 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] opacity-65 entrance" style={{ animationDelay: "900ms" }}>01 About</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight entrance" style={{ animationDelay: "1050ms" }}>
          Charles Benello
        </h1>
      </div>
      <div className="space-y-4 lg:col-span-7">
        <div className="space-y-3 text-base sm:text-lg opacity-90 entrance" style={{ animationDelay: "1250ms" }}>
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 entrance" style={{ animationDelay: "1500ms" }}>
          <a
            href="https://github.com/cmbenello"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm opacity-70 transition-opacity duration-150 hover:opacity-100"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/charles-benello/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm opacity-70 transition-opacity duration-150 hover:opacity-100"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
        </div>
      </div>

      <div className="grid gap-8 lg:col-span-5">
        <div className="border-l-2 pl-5 entrance" style={{ borderColor: "var(--accent-2)", animationDelay: "1250ms" }}>
          <p className="text-xs uppercase tracking-[0.32em] opacity-65">
            Education
          </p>
          <div className="mt-4 space-y-5">
            {EDUCATION.map((item) => (
              <div key={`${item.school}-${item.dates}`}>
                <p className="text-base font-semibold">{item.school}</p>
                {(item.degree || item.field) && (
                  <p className="text-sm opacity-75 mt-0.5">
                    {formatMetaLine([item.degree, item.field])}
                  </p>
                )}
                <p className="text-sm opacity-50">{item.dates}</p>
                {item.notes ? (
                  <p className="text-sm opacity-50">{item.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="border-l-2 pl-5 entrance" style={{ borderColor: "var(--accent-2)", animationDelay: "1550ms" }}>
          <p className="text-xs uppercase tracking-[0.32em] opacity-65">
            Current Work
          </p>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            {CURRENT_WORK.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
