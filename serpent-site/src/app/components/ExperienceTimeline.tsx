"use client";

import { useState } from "react";

/* ── types ── */
type ExperienceEntry = {
  title: string;
  company: string;
  employmentType: string;
  dates: string;
  location: string;
  highlights: string[];
};

/* ── main component ── */

export default function ExperienceTimeline({
  entries,
}: {
  entries: ExperienceEntry[];
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setExpandedIndex((prev) => (prev === i ? null : i));

  return (
    <section className="flex h-full flex-col">
      {/* header */}
      <div className="mb-6 shrink-0 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] opacity-65">
          02 Experience
        </p>
        <h2 className="text-4xl font-semibold tracking-tight">Experience</h2>
      </div>

      {/* entries */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden">
        {entries.map((entry, i) => {
          const hasHighlights = entry.highlights.length > 0;
          const isExpanded = expandedIndex === i;
          const preview =
            hasHighlights && !isExpanded
              ? entry.highlights.slice(0, 2).join(" \u00b7 ")
              : null;

          return (
            <div
              key={`${entry.title}-${entry.company}`}
              className="border-t"
              style={{ borderColor: "var(--panel-border)" }}
            >
              {hasHighlights ? (
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="group w-full cursor-pointer py-4 text-left"
                >
                  {/* top row: title + dates */}
                  <div className="flex items-baseline justify-between gap-6">
                    <h3 className="text-base font-semibold leading-snug">
                      {entry.title}
                    </h3>
                    <span className="shrink-0 text-xs uppercase tracking-wider opacity-40">
                      {entry.dates}
                    </span>
                  </div>

                  {/* company */}
                  <p className="mt-0.5 text-sm opacity-60">
                    {entry.company}
                    {entry.employmentType
                      ? ` \u00b7 ${entry.employmentType}`
                      : ""}
                  </p>

                  {/* preview snippet (when collapsed) */}
                  {preview && (
                    <p className="mt-2 line-clamp-1 text-sm opacity-40">
                      {preview}
                    </p>
                  )}

                  {/* expanded highlights */}
                  <div
                    className="grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <ul className="mt-3 space-y-1.5 text-sm opacity-80">
                        {entry.highlights.map((h) => (
                          <li key={h} className="flex gap-2">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full opacity-50" style={{ background: "currentColor" }} />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="py-4">
                  {/* top row: title + dates */}
                  <div className="flex items-baseline justify-between gap-6">
                    <h3 className="text-base font-semibold leading-snug">
                      {entry.title}
                    </h3>
                    <span className="shrink-0 text-xs uppercase tracking-wider opacity-40">
                      {entry.dates}
                    </span>
                  </div>

                  {/* company */}
                  <p className="mt-0.5 text-sm opacity-60">
                    {entry.company}
                    {entry.employmentType
                      ? ` \u00b7 ${entry.employmentType}`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
