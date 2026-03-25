"use client";

import { useState, useRef, useLayoutEffect } from "react";
type ExperienceEntry = {
  title: string;
  company: string;
  dates: string;
  description: string;
  highlights: string[];
  skills: string[];
  logo?: string;
  courses?: string[];
  link?: { label: string; url: string };
  papers?: { label: string; url?: string; wip?: boolean; note?: string }[];
};

export default function ExperienceTimeline({
  entries,
}: {
  entries: ExperienceEntry[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = entries[selectedIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });

  useLayoutEffect(() => {
    const btn = buttonRefs.current[selectedIndex];
    const container = containerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        top: btnRect.top - containerRect.top,
        height: btnRect.height,
      });
    }
  }, [selectedIndex]);

  return (
    <section className="flex h-full flex-col">
      <div className="mb-6 shrink-0 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] opacity-65">
          02 Experience
        </p>
        <h2 className="text-4xl font-semibold tracking-tight">Experience</h2>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-12">
        {/* left: role list */}
        <div ref={containerRef} className="relative flex flex-col gap-1 lg:col-span-5">
          {/* sliding indicator */}
          <div
            className="pointer-events-none absolute left-0 right-0 rounded-lg"
            style={{
              top: indicatorStyle.top,
              height: indicatorStyle.height,
              background: "var(--panel-surface)",
              borderLeft: "3px solid var(--accent-3)",
              transition: "top 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          {entries.map((entry, i) => {
            const isActive = selectedIndex === i;
            return (
              <button
                key={`${entry.title}-${entry.company}`}
                ref={(el) => { buttonRefs.current[i] = el; }}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className="relative flex w-full cursor-pointer items-center gap-3.5 rounded-lg px-3 py-3 text-left"
                style={{ zIndex: 1, borderLeft: "3px solid transparent" }}
              >
                {entry.logo && (
                  <img
                    src={entry.logo}
                    alt=""
                    className="h-8 w-auto max-w-[80px] shrink-0 rounded-sm object-contain transition-opacity duration-200"
                    style={{ opacity: isActive ? 0.9 : 0.5 }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className="block text-base font-medium leading-tight transition-opacity duration-200"
                    style={{ opacity: isActive ? 1 : 0.75 }}
                  >
                    {entry.title}
                  </span>
                  <span className="block text-sm opacity-55">
                    {entry.company}
                    <span className="mx-1.5 opacity-40">·</span>
                    {entry.dates}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* right: detail panel */}
        <div className="flex flex-col overflow-y-hidden border-l-2 pl-6 lg:col-span-7" style={{ borderColor: "var(--accent-2)" }}>
          <div key={selectedIndex} className="exp-detail-enter flex flex-col">
            <div className="flex items-center gap-4">
              {selected.logo && (
                <img
                  src={selected.logo}
                  alt=""
                  className="h-10 w-auto max-w-[100px] shrink-0 rounded-md object-contain"
                  style={{ opacity: 0.9 }}
                />
              )}
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">{selected.title}</h3>
                <p className="mt-0.5 text-base opacity-65">
                  {selected.company}
                  <span className="mx-2 opacity-40">·</span>
                  {selected.dates}
                </p>
              </div>
            </div>

            <p className="mt-5 text-base leading-relaxed opacity-90">
              {selected.description}
            </p>

            {selected.highlights.length > 0 && (
              <ul className="mt-4 space-y-2 text-base leading-relaxed opacity-80">
                {selected.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5">
                    <span
                      className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--accent-3)" }}
                    />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {selected.courses && selected.courses.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] opacity-50">
                  Classes TA'd
                </p>
                <ul className="space-y-1.5 text-sm leading-relaxed opacity-80">
                  {selected.courses.map((course) => (
                    <li key={course} className="flex gap-2.5">
                      <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--accent-3)" }}
                      />
                      <span>{course}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto pt-6">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] opacity-50">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border px-3.5 py-1.5 text-sm opacity-75"
                    style={{ borderColor: "var(--panel-border)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {selected.link && (
                <a
                  href={selected.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm opacity-70 transition-opacity duration-150 hover:opacity-100"
                  style={{ borderColor: "var(--panel-border)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  {selected.link.label}
                </a>
              )}
              {selected.papers && selected.papers.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] opacity-50">Papers</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.papers.map((paper) => (
                      <div key={paper.label} className="flex items-center gap-1.5">
                        {paper.url ? (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm opacity-70 transition-opacity duration-150 hover:opacity-100"
                            style={{ borderColor: "var(--panel-border)" }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                            </svg>
                            {paper.label}
                          </a>
                        ) : (
                          <span
                            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm opacity-50 cursor-default"
                            style={{ borderColor: "var(--panel-border)" }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                            </svg>
                            {paper.label}
                          </span>
                        )}
                        {paper.note && (
                          <span className="rounded-full border px-2 py-0.5 text-xs opacity-60" style={{ borderColor: "var(--panel-border)" }}>
                            {paper.note}
                          </span>
                        )}
                        {paper.wip && (
                          <span className="rounded-full border px-2 py-0.5 text-xs opacity-60" style={{ borderColor: "var(--accent-3)", color: "var(--accent-3)" }}>
                            WIP
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
