"use client";

import { useEffect, useMemo, useState } from "react";

type ProjectCommit = {
  sha: string;
  message: string;
  url: string;
  date: string;
  author: string;
};

type Project = {
  name: string;
  repo: string;
  url: string;
  summary?: string;
  description?: string;
  image?: string;
  homepage?: string;
  language?: string;
  tags?: string[];
  topics?: string[];
  stars?: number;
  forks?: number;
  issues?: number;
  updatedAt?: string;
  createdAt?: string;
  pushedAt?: string;
  timelineStart?: string;
  timelineEnd?: string;
  defaultBranch?: string;
  license?: string;
  commitLog?: ProjectCommit[];
  commitActivity?: number[];
  activity?: number[];
  readme?: string;
};

type Category = {
  title: string;
  slug: string;
  projects: Project[];
};

type ContributionDay = {
  date: string;
  contributionCount: number;
  color: string;
};

type ContributionWeek = {
  firstDay: string;
  contributionDays: ContributionDay[];
};

type ContributionMonth = {
  name: string;
  firstDay: string;
  totalWeeks: number;
};

type ContributionCalendar = {
  totalContributions: number;
  weeks: ContributionWeek[];
  months: ContributionMonth[];
};

type ProjectsData = {
  generatedAt?: string;
  user?: string;
  contributions?: ContributionCalendar | null;
  categories: Category[];
};

type ProjectsSectionProps = {
  data: ProjectsData;
};

type PopOrigin = {
  dx: number;
  dy: number;
};

const CONTRIBUTION_CELL_SIZE = 11;
const CONTRIBUTION_CELL_GAP = 4;
const CONTRIBUTION_LABEL_WIDTH = 34;
const CONTRIBUTION_LABEL_GAP = 12;
const CONTRIBUTION_SPARKLINE_WIDTH = 220;
const CONTRIBUTION_SPARKLINE_HEIGHT = 48;
const getContributionLevel = (count: number) => {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
};

const getContributionColor = (day: ContributionDay) => {
  const level = getContributionLevel(day.contributionCount);
  return `var(--contrib-${level})`;
};

const getMonthPositions = (
  months: ContributionMonth[],
  weeks: ContributionWeek[],
) =>
  months
    .map((month) => {
      const weekIndex = weeks.findIndex((week) =>
        week.contributionDays.some((day) => day.date === month.firstDay),
      );
      return {
        name: month.name,
        start: weekIndex,
        span: Math.max(1, month.totalWeeks),
      };
    })
    .filter((month) => month.start >= 0);

const buildSparklinePoints = (
  values: number[],
  width: number,
  height: number,
  padding = 0,
) => {
  if (!values.length) return "";
  const maxValue = Math.max(1, ...values);
  const usableHeight = Math.max(1, height - padding * 2);
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - padding - (value / maxValue) * usableHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const renderInline = (text: string) => {
  const nodes: Array<string | JSX.Element> = [];
  let index = 0;

  const pushText = (value: string) => {
    if (value) nodes.push(value);
  };

  while (index < text.length) {
    const nextCode = text.indexOf("`", index);
    const nextLink = text.indexOf("[", index);
    const nextSpecialCandidates = [nextCode, nextLink].filter((i) => i !== -1);
    const nextSpecial =
      nextSpecialCandidates.length > 0
        ? Math.min(...nextSpecialCandidates)
        : -1;

    if (nextSpecial === -1) {
      pushText(text.slice(index));
      break;
    }

    if (nextSpecial > index) {
      pushText(text.slice(index, nextSpecial));
      index = nextSpecial;
    }

    if (text[index] === "`") {
      const end = text.indexOf("`", index + 1);
      if (end === -1) {
        pushText(text.slice(index));
        break;
      }
      const content = text.slice(index + 1, end);
      nodes.push(
        <code
          key={`${index}-${end}`}
          className="rounded bg-black/10 px-1 py-0.5 text-xs"
        >
          {content}
        </code>,
      );
      index = end + 1;
      continue;
    }

    if (text[index] === "[") {
      const endLabel = text.indexOf("]", index + 1);
      const startUrl = endLabel !== -1 ? text.indexOf("(", endLabel) : -1;
      const endUrl = startUrl !== -1 ? text.indexOf(")", startUrl) : -1;
      if (endLabel !== -1 && startUrl === endLabel + 1 && endUrl !== -1) {
        const label = text.slice(index + 1, endLabel);
        const url = text.slice(startUrl + 1, endUrl);
        nodes.push(
          <a
            key={`${index}-${endUrl}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {label}
          </a>,
        );
        index = endUrl + 1;
        continue;
      }
      pushText(text[index]);
      index += 1;
      continue;
    }
  }

  return nodes;
};

const renderMarkdown = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  const blocks: JSX.Element[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;
  let codeKey = 0;
  let listKey = 0;

  const flushList = () => {
    if (!listItems.length) return;
    const items = listItems.map((item, index) => (
      <li key={`${listKey}-${index}`}>{renderInline(item)}</li>
    ));
    blocks.push(
      <ul key={`list-${listKey}`} className="ml-4 list-disc space-y-1">
        {items}
      </ul>,
    );
    listItems = [];
    listKey += 1;
  };

  const flushCode = () => {
    if (!codeLines.length) return;
    blocks.push(
      <pre
        key={`code-${codeKey}`}
        className="rounded-xl border border-current/15 bg-black/10 p-3 text-xs leading-relaxed"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
    codeKey += 1;
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      flushList();
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const Heading = (level === 1 ? "h3" : level === 2 ? "h4" : "h5") as
        | "h3"
        | "h4"
        | "h5";
      blocks.push(
        <Heading
          key={`heading-${index}`}
          className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] opacity-70"
        >
          {renderInline(content)}
        </Heading>,
      );
      return;
    }

    const listMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList();

    if (!line.trim()) {
      return;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();
  if (inCode) {
    flushCode();
  }

  return blocks;
};

export default function ProjectsSection({ data }: ProjectsSectionProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(
    null,
  );
  const [categoryOrigin, setCategoryOrigin] = useState<PopOrigin | null>(null);
  const [projectOrigin, setProjectOrigin] = useState<PopOrigin | null>(null);

  useEffect(() => {
    if (!activeProject && !activeCategorySlug) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeProject) {
          setActiveProject(null);
        } else {
          setActiveCategorySlug(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeProject, activeCategorySlug]);

  useEffect(() => {
    const active = Boolean(activeProject || activeCategorySlug);
    window.dispatchEvent(
      new CustomEvent("effects-pause", {
        detail: { source: "modal", active },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("effects-pause", {
          detail: { source: "modal", active: false },
        }),
      );
    };
  }, [activeProject, activeCategorySlug]);

  const contributions = data.contributions ?? null;
  const contributionWeeks = contributions?.weeks ?? [];
  const contributionMonths = contributions
    ? getMonthPositions(contributions.months, contributions.weeks)
    : [];
  const contributionTotal = contributions?.totalContributions ?? 0;
  const weeklyTotals = contributionWeeks.map((week) =>
    week.contributionDays.reduce(
      (total, day) => total + day.contributionCount,
      0,
    ),
  );
  const calendarWidth =
    contributionWeeks.length * CONTRIBUTION_CELL_SIZE +
    Math.max(0, contributionWeeks.length - 1) * CONTRIBUTION_CELL_GAP;
  const contributionSparkline = buildSparklinePoints(
    weeklyTotals,
    CONTRIBUTION_SPARKLINE_WIDTH,
    CONTRIBUTION_SPARKLINE_HEIGHT,
  );

  const categories = data.categories || [];
  const activeCategory = useMemo(
    () =>
      categories.find((category) => category.slug === activeCategorySlug) ||
      null,
    [categories, activeCategorySlug],
  );

  const activeProjectTags = useMemo(() => {
    if (!activeProject) return [] as string[];
    return [
      ...(activeProject.tags || []),
      ...(activeProject.topics || []),
      activeProject.language || "",
    ]
      .filter((tag) => tag && tag.trim().length > 0)
      .slice(0, 8);
  }, [activeProject]);

  const categoryPopStyle = useMemo(() => {
    if (!categoryOrigin) return undefined;
    return {
      ["--pop-x" as const]: `${categoryOrigin.dx}px`,
      ["--pop-y" as const]: `${categoryOrigin.dy}px`,
    };
  }, [categoryOrigin]);

  const projectPopStyle = useMemo(() => {
    if (!projectOrigin) return undefined;
    return {
      ["--pop-x" as const]: `${projectOrigin.dx}px`,
      ["--pop-y" as const]: `${projectOrigin.dy}px`,
    };
  }, [projectOrigin]);

  const readmeBlocks = useMemo(() => {
    if (!activeProject?.readme) return [] as JSX.Element[];
    return renderMarkdown(activeProject.readme);
  }, [activeProject]);

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] opacity-55">
          04 Projects
        </p>
        <h2 className="text-4xl font-semibold tracking-tight">Projects</h2>
        <p className="max-w-2xl text-lg opacity-80">
          Categorized repositories with deep dives, commit history, and readme
          details.
        </p>
      </div>

      {contributions ? (
        <div className="rounded-2xl border border-current/40 bg-current/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.28em] opacity-70">
              {contributionTotal} contributions in the last year
            </p>
            <span className="text-xs uppercase tracking-[0.28em] opacity-55">
              Recent activity
            </span>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="overflow-x-auto pb-2">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `${CONTRIBUTION_LABEL_WIDTH}px ${calendarWidth}px`,
                  columnGap: `${CONTRIBUTION_LABEL_GAP}px`,
                  minWidth:
                    calendarWidth +
                    CONTRIBUTION_LABEL_WIDTH +
                    CONTRIBUTION_LABEL_GAP,
                }}
              >
                <div />
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${contributionWeeks.length}, ${CONTRIBUTION_CELL_SIZE}px)`,
                    columnGap: `${CONTRIBUTION_CELL_GAP}px`,
                  }}
                >
                  {contributionMonths.map((month) => (
                    <div
                      key={`${month.name}-${month.start}`}
                      className="text-[11px] uppercase tracking-[0.25em] opacity-55"
                      style={{
                        gridColumnStart: month.start + 1,
                        gridColumnEnd: month.start + 1 + month.span,
                      }}
                    >
                      {month.name}
                    </div>
                  ))}
                </div>
                <div
                  className="grid text-[10px] uppercase tracking-[0.22em] opacity-50"
                  style={{
                    gridTemplateRows: `repeat(7, ${CONTRIBUTION_CELL_SIZE}px)`,
                    rowGap: `${CONTRIBUTION_CELL_GAP}px`,
                  }}
                >
                  <span style={{ gridRowStart: 2 }}>Mon</span>
                  <span style={{ gridRowStart: 4 }}>Wed</span>
                  <span style={{ gridRowStart: 6 }}>Fri</span>
                </div>
                <div
                  className="grid"
                  style={{
                    gridAutoFlow: "column",
                    gridAutoColumns: `${CONTRIBUTION_CELL_SIZE}px`,
                    gridTemplateRows: `repeat(7, ${CONTRIBUTION_CELL_SIZE}px)`,
                    columnGap: `${CONTRIBUTION_CELL_GAP}px`,
                    rowGap: `${CONTRIBUTION_CELL_GAP}px`,
                    width: `${calendarWidth}px`,
                  }}
                >
                  {contributionWeeks.map((week) =>
                    week.contributionDays.map((day) => (
                      <span
                        key={day.date}
                        title={`${day.date}: ${day.contributionCount} contributions`}
                        aria-label={`${day.date}: ${day.contributionCount} contributions`}
                        style={{
                          width: `${CONTRIBUTION_CELL_SIZE}px`,
                          height: `${CONTRIBUTION_CELL_SIZE}px`,
                          borderRadius: 3,
                          backgroundColor: getContributionColor(day),
                          border: "1px solid var(--contrib-border)",
                          boxSizing: "border-box",
                          display: "inline-block",
                        }}
                      />
                    )),
                  )}
                </div>
              </div>
              <div
                className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] opacity-60"
                style={{
                  paddingLeft:
                    CONTRIBUTION_LABEL_WIDTH + CONTRIBUTION_LABEL_GAP,
                  width: calendarWidth,
                }}
              >
                <span>Less</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      aria-hidden="true"
                      style={{
                        width: `${CONTRIBUTION_CELL_SIZE}px`,
                        height: `${CONTRIBUTION_CELL_SIZE}px`,
                        borderRadius: 3,
                        backgroundColor: `var(--contrib-${level})`,
                        border: "1px solid var(--contrib-border)",
                        boxSizing: "border-box",
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
            <div className="rounded-xl border border-current/40 bg-current/5 p-4">
              <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                Weekly Trend
              </p>
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${CONTRIBUTION_SPARKLINE_WIDTH} ${CONTRIBUTION_SPARKLINE_HEIGHT}`}
                className="mt-3 h-12 w-full"
              >
                <polyline
                  fill="none"
                  stroke="var(--contrib-4)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={contributionSparkline}
                />
              </svg>
              <p className="mt-2 text-xs opacity-70">
                Based on the last 52 weeks of activity.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-current/40 p-5 text-sm opacity-75">
          Run the GitHub sync script to load your contribution calendar.
        </div>
      )}

      <div className="space-y-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              className="group relative overflow-hidden rounded-2xl border border-current/45 bg-current/10 p-5 text-left transition hover:-translate-y-0.5 hover:border-current/70"
              onClick={(event) => {
                setCategoryOrigin({
                  dx: event.clientX - window.innerWidth / 2,
                  dy: event.clientY - window.innerHeight / 2,
                });
                setActiveCategorySlug(category.slug);
              }}
            >
              <span
                aria-hidden="true"
                className="absolute left-6 top-0 h-3 w-16 -translate-y-1 rounded-t-md border border-current/45 bg-current/15"
              />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{category.title}</h3>
                <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                  {category.projects.length} items
                </span>
              </div>
              <p className="mt-2 text-sm opacity-75">
                Open folder to view projects.
              </p>
            </button>
          ))}
        </div>
      </div>

      {activeCategory ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-6 py-10"
          role="dialog"
          aria-modal="true"
          data-modal-root="true"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div
            className="absolute inset-0 folder-fade"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
            onClick={() => setActiveCategorySlug(null)}
            aria-hidden="true"
          />
          <div
            className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border folder-pop"
            style={{
              backgroundColor: "var(--panel-surface, rgba(16, 17, 19, 0.98))",
              borderColor:
                "var(--panel-border-strong, rgba(255, 255, 255, 0.3))",
              ...categoryPopStyle,
            }}
          >
            <div className="flex items-center justify-between border-b border-current/30 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] opacity-60">
                  Folder
                </p>
                <h3 className="text-2xl font-semibold">
                  {activeCategory.title}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-current/40 px-3 py-1 text-xs uppercase tracking-[0.28em] opacity-70 transition hover:opacity-100"
                onClick={() => setActiveCategorySlug(null)}
              >
                Close
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-6"
              onWheel={(event) => event.stopPropagation()}
              onWheelCapture={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {activeCategory.projects.map((project) => {
                  const tags = [
                    ...(project.tags || []),
                    ...(project.topics || []),
                    project.language || "",
                  ]
                    .filter((tag) => tag && tag.trim().length > 0)
                    .slice(0, 4);
                  const summary =
                    project.summary ||
                    project.description ||
                    "Run the GitHub sync script to load details.";
                  return (
                    <button
                      key={project.repo}
                      type="button"
                      className="group rounded-2xl border border-current/40 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-current/70"
                      onClick={(event) => {
                        setProjectOrigin({
                          dx: event.clientX - window.innerWidth / 2,
                          dy: event.clientY - window.innerHeight / 2,
                        });
                        setActiveProject(project);
                      }}
                      aria-haspopup="dialog"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h4 className="text-lg font-semibold">
                          {project.name}
                        </h4>
                        <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                          {project.updatedAt
                            ? `Updated ${project.updatedAt}`
                            : "Click for details"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm opacity-80">{summary}</p>
                      {tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-65">
                          {tags.map((tag) => (
                            <span
                              key={`${project.repo}-${tag}`}
                              className="rounded-full border border-current/40 px-3 py-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeProject ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10"
          role="dialog"
          aria-modal="true"
          data-modal-root="true"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div
            className="absolute inset-0 folder-fade"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
            onClick={() => setActiveProject(null)}
            aria-hidden="true"
          />
          <div
            className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border folder-pop"
            style={{
              backgroundColor: "var(--panel-surface, rgba(16, 17, 19, 0.98))",
              borderColor: "var(--panel-border-strong, rgba(255, 255, 255, 0.3))",
              ...projectPopStyle,
            }}
          >
            <div className="flex items-center justify-between border-b border-current/30 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] opacity-60">
                  {activeProject.repo}
                </p>
                <h3 className="text-2xl font-semibold">
                  {activeProject.name}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-current/40 px-3 py-1 text-xs uppercase tracking-[0.28em] opacity-70 transition hover:opacity-100"
                onClick={() => setActiveProject(null)}
              >
                Close
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-6"
              onWheel={(event) => {
                event.stopPropagation();
              }}
              onWheelCapture={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              <div
                className={`grid gap-6 ${activeProject?.image ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}
              >
                <div className="space-y-6">
                  <div className="rounded-2xl border border-current/40 p-5">
                    <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                      Overview
                    </p>
                    <p className="mt-3 text-sm opacity-85">
                      {activeProject.summary ||
                        activeProject.description ||
                        "Sync GitHub to load project details."}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Repository
                        </p>
                        <a
                          className="text-sm underline underline-offset-4"
                          href={activeProject.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {activeProject.url.replace("https://", "")}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Updated
                        </p>
                        <p className="text-sm">
                          {activeProject.updatedAt || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Stats
                        </p>
                        <p className="text-sm">
                          Stars {activeProject.stars ?? 0} / Forks{" "}
                          {activeProject.forks ?? 0} / Issues{" "}
                          {activeProject.issues ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Default Branch
                        </p>
                        <p className="text-sm">
                          {activeProject.defaultBranch || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Language
                        </p>
                        <p className="text-sm">
                          {activeProject.language || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          License
                        </p>
                        <p className="text-sm">
                          {activeProject.license || "Not specified"}
                        </p>
                      </div>
                    </div>
                    {activeProject.homepage ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Homepage
                        </p>
                        <a
                          className="text-sm underline underline-offset-4"
                          href={activeProject.homepage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {activeProject.homepage}
                        </a>
                      </div>
                    ) : null}
                    {activeProjectTags.length ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Tags
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-70">
                          {activeProjectTags.map((tag) => (
                            <span
                              key={`${activeProject.repo}-${tag}`}
                              className="rounded-full border border-current/40 px-3 py-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-current/40 p-5">
                    <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                      Recent Commits
                    </p>
                    {activeProject.commitLog?.length ? (
                      <ul className="mt-2 space-y-2 text-xs">
                        {activeProject.commitLog.map((commit) => {
                          const commitMeta = commit.date
                            ? `${commit.author} (${commit.date})`
                            : commit.author;
                          return (
                            <li key={`${activeProject.repo}-${commit.sha}`}>
                              <a
                                className="underline underline-offset-4"
                                href={commit.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {commit.sha}
                              </a>
                              <span className="opacity-70"> / </span>
                              <span className="opacity-85">
                                {commit.message}
                              </span>
                              <span className="opacity-70">
                                {" "}- {commitMeta}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs opacity-70">
                        No commit data available.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-current/40 p-5">
                    <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                      Readme
                    </p>
                    {readmeBlocks.length ? (
                      <div className="mt-4 space-y-3 text-sm opacity-85">
                        {readmeBlocks}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm opacity-70">
                        Add a readme override or sync GitHub to load content.
                      </p>
                    )}
                  </div>
                </div>

                {activeProject.image ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-current/40 p-4">
                      <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                        Project Image
                      </p>
                      <div className="mt-3 overflow-hidden rounded-xl border border-current/30">
                        <img
                          src={activeProject.image}
                          alt={`${activeProject.name} cover`}
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
