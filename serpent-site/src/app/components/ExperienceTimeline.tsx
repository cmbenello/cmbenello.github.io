"use client";

import { useState } from "react";
type ExperienceEntry = {
  title: string;
  company: string;
  dates: string;
  description: string;
  highlights: string[];
  skills: string[];
  logo?: string;
  courses?: string[];
};

export default function ExperienceTimeline({
  entries,
}: {
  entries: ExperienceEntry[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = entries[selectedIndex];

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
        <div className="flex flex-col gap-1 lg:col-span-5">
          {entries.map((entry, i) => {
            const isActive = selectedIndex === i;
            return (
              <button
                key={`${entry.title}-${entry.company}`}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className="flex w-full cursor-pointer items-center gap-3.5 rounded-lg px-3 py-3 text-left transition-all duration-150"
                style={{
                  background: isActive ? "var(--panel-surface)" : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--accent-3)"
                    : "3px solid transparent",
                }}
              >
                {entry.logo && (
                  <img
                    src={entry.logo}
                    alt=""
                    className="h-8 w-auto max-w-[80px] shrink-0 rounded-sm object-contain"
                    style={{ opacity: isActive ? 0.9 : 0.5 }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span
                    className="block text-base font-medium leading-tight transition-opacity duration-150"
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
        <div className="flex flex-col overflow-y-auto border-l-2 pl-6 lg:col-span-7" style={{ borderColor: "var(--accent-2)" }}>
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
                Courses
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.courses.map((course) => (
                  <span
                    key={course}
                    className="rounded-md border px-2.5 py-1 text-xs opacity-70"
                    style={{ borderColor: "var(--panel-border)" }}
                  >
                    {course}
                  </span>
                ))}
              </div>
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
          </div>
        </div>
      </div>
    </section>
  );
}
