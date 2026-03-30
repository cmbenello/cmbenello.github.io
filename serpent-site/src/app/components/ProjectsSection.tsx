"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { createPortal } from "react-dom";

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
  category?: string;
  summary?: string;
  description?: string;
  image?: string;
  gif?: string;
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
  featured?: boolean;
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

type Category = {
  slug: string;
  title: string;
  projects: Project[];
};

type ProjectsData = {
  generatedAt?: string;
  user?: string;
  contributions?: ContributionCalendar | null;
  projects: Project[];
  categories?: Category[];
};

type ProjectsSectionProps = {
  data: ProjectsData;
};

type PopOrigin = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
};

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const CONTRIBUTION_CELL_SIZE = 11;
const CONTRIBUTION_CELL_GAP = 4;
const CONTRIBUTION_LABEL_WIDTH = 34;
const CONTRIBUTION_LABEL_GAP = 12;
const CONTRIBUTION_SPARKLINE_WIDTH = 220;
const CONTRIBUTION_SPARKLINE_HEIGHT = 48;
const CONTRIBUTION_STEP = CONTRIBUTION_CELL_SIZE + CONTRIBUTION_CELL_GAP;
const HEATMAP_GRID_LEFT = 28;
const HEATMAP_GRID_TOP = 22;
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
  const nodes: Array<string | ReactElement> = [];
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
  const blocks: ReactElement[] = [];
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
          className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] opacity-90"
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

// ── Netflix-style card components ─────────────────────────────────────────────

const LANG_GRADIENTS: Record<string, [string, string]> = {
  python: ["#3776AB", "#FFD43B"],
  typescript: ["#3178C6", "#23afe8"],
  javascript: ["#F0DB4F", "#3a3a3a"],
  "c++": ["#659ad2", "#f18636"],
  rust: ["#CE422B", "#F0A05A"],
  java: ["#e76f00", "#5382A1"],
  go: ["#00ACD7", "#375EAB"],
  r: ["#276bbf", "#75aadb"],
  julia: ["#9558b2", "#389826"],
  swift: ["#f05138", "#ffac45"],
  kotlin: ["#7f52ff", "#e44857"],
  scala: ["#dc322f", "#003b6f"],
};
const DEFAULT_GRADIENT: [string, string] = ["#6366f1", "#a855f7"];

const CATEGORY_ACCENTS: Record<string, string> = {
  "machine-learning": "#818cf8",
  research: "#2dd4bf",
  personal: "#fbbf24",
  school: "#60a5fa",
  teaching: "#f472b6",
  work: "#34d399",
  featured: "#f59e0b",
  more: "#818cf8",
};
const DEFAULT_ACCENT = "#818cf8";

function getLangGradient(language?: string): [string, string] {
  const lang = (language ?? "").toLowerCase();
  return LANG_GRADIENTS[lang] ?? DEFAULT_GRADIENT;
}

function getInitials(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Thumbnail area shared by inline card and hover popup */
function CardThumbnail({
  project,
  imgError,
  onImgError,
  showTitle = true,
  showLanguage = false,
  useGif = false,
}: {
  project: Project;
  imgError: boolean;
  onImgError: () => void;
  /** Show name strip at bottom — false in popup since info panel has the name */
  showTitle?: boolean;
  /** Show language pill — only on popup */
  showLanguage?: boolean;
  /** Use gif instead of static image when available */
  useGif?: boolean;
}) {
  const [g1, g2] = getLangGradient(project.language);
  const initials = getInitials(project.name);
  const displayImage = useGif && project.gif ? project.gif : project.image;

  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
      {displayImage && !imgError && !displayImage.includes("opengraph.githubassets.com") ? (
        <img
          src={displayImage}
          alt={project.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={onImgError}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${g1}dd, ${g2}dd)` }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              style={{
                fontSize: "2.75rem",
                fontWeight: 800,
                color: "rgba(255,255,255,0.80)",
                textShadow: "0 2px 16px rgba(0,0,0,0.5)",
                letterSpacing: "-0.04em",
              }}
            >
              {initials}
            </span>
          </div>
        </div>
      )}

      {/* Language pill — only visible on popup */}
      {showLanguage && project.language && (
        <div className="absolute right-2 top-2 z-10">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(6px)",
            }}
          >
            {project.language}
          </span>
        </div>
      )}

      {/* Title strip at bottom — hidden in popup (info panel has the name) */}
      {showTitle && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 px-3 py-2.5"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
          }}
        >
          <p
            className="truncate text-sm font-semibold text-white"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
          >
            {project.name}
          </p>
        </div>
      )}
    </div>
  );
}

const HOVER_DELAY_MS = 300;
const HOVER_WARM_MS = 50; // Near-instant when moving between cards
const HOVER_WARM_WINDOW = 800; // Window after a popup closes where next hover is fast
const SCALE = 1.3;
const EXPAND_MS = 200;
const CLOSE_ANIM_MS = 220;
const EDGE_THRESHOLD = 80;

/** Shared timestamp — when any card popup was last active, nearby hovers skip the delay */
let lastPopupCloseTime = 0;

/** Shared dismiss callback — ensures only one popup is open at a time */
let dismissActivePopup: (() => void) | null = null;

function ProjectCard({
  project,
  accentColor,
  onOpen,
}: {
  project: Project;
  accentColor: string;
  onOpen: (project: Project, rect: DOMRect) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [fixedRect, setFixedRect] = useState<DOMRect | null>(null);
  const [origin, setOrigin] = useState("center top");
  const cardRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const summary = project.summary || project.description || "";
  const tags = [
    ...(project.tags ?? []),
    ...(project.topics ?? []),
    project.language ?? "",
  ]
    .filter((t) => t?.trim())
    .slice(0, 3);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const dismissPopup = useCallback(() => {
    setExpanded(false);
    setShowPopup(false);
    setClosing(false);
    scrollContainerRef.current = null;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = () => {
    // Cancel any in-progress close
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (showPopup) return; // Already showing

    // Dismiss any other open popup immediately
    if (dismissActivePopup && dismissActivePopup !== dismissPopup) {
      dismissActivePopup();
    }

    // If another popup was recently open, skip the long delay (instant feel)
    const timeSinceLastPopup = Date.now() - lastPopupCloseTime;
    const delay = timeSinceLastPopup < HOVER_WARM_WINDOW ? HOVER_WARM_MS : HOVER_DELAY_MS;

    // Start hover delay
    hoverTimerRef.current = setTimeout(() => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setFixedRect(rect);

      // Determine transform-origin based on edge proximity
      const vw = window.innerWidth;
      if (rect.left < EDGE_THRESHOLD) {
        setOrigin("left top");
      } else if (rect.right > vw - EDGE_THRESHOLD) {
        setOrigin("right top");
      } else {
        setOrigin("center top");
      }

      // Dismiss any other open popup before showing ours
      if (dismissActivePopup && dismissActivePopup !== dismissPopup) {
        dismissActivePopup();
      }
      dismissActivePopup = dismissPopup;

      setShowPopup(true);
      setClosing(false);
      // Trigger expansion on next frame for CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });
    }, delay);
  };

  const handleMouseLeaveCard = () => {
    // Cancel pending hover
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Don't close if popup is already showing (popup handles its own leave)
  };

  const handlePopupLeave = () => {
    // Animate back to scale(1), then unmount
    setExpanded(false);
    setClosing(true);
    lastPopupCloseTime = Date.now();
    if (dismissActivePopup === dismissPopup) {
      dismissActivePopup = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setShowPopup(false);
      setClosing(false);
    }, CLOSE_ANIM_MS);
  };

  return (
    <>
      {/* Inline card — always in layout flow */}
      <button
        ref={cardRef}
        type="button"
        className="relative w-full overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2"
        style={{
          aspectRatio: "16 / 9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          borderRadius: 12,
          // Hide original when popup is visible so no ghost duplicate
          visibility: showPopup ? "hidden" : "visible",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeaveCard}
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onOpen(project, rect);
        }}
      >
        <CardThumbnail
          project={project}
          imgError={imgError}
          onImgError={() => setImgError(true)}
        />
      </button>

      {/* Netflix-style hover popup — portal to document.body */}
      {showPopup && fixedRect && portalTarget && createPortal(
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            left: fixedRect.left,
            top: fixedRect.top,
            width: fixedRect.width,
            zIndex: 99999,
            transformOrigin: origin,
            transform: expanded ? `scale(${SCALE})` : "scale(1)",
            opacity: closing ? 0 : 1,
            transition: closing
              ? `transform ${CLOSE_ANIM_MS}ms ease-out, opacity ${CLOSE_ANIM_MS}ms ease-out ${CLOSE_ANIM_MS * 0.3}ms`
              : `transform ${EXPAND_MS}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${EXPAND_MS}ms ease`,
            pointerEvents: "auto",
          }}
          onMouseLeave={handlePopupLeave}
          onWheel={(e) => {
            const card = cardRef.current;
            const popup = popupRef.current;
            if (!card || !popup) return;
            // Cache the scroll container on first use
            if (!scrollContainerRef.current) {
              let el: HTMLElement | null = card.parentElement;
              while (el) {
                const s = getComputedStyle(el);
                if ((s.overflowY === "auto" || s.overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
                  scrollContainerRef.current = el;
                  break;
                }
                el = el.parentElement;
              }
            }
            const sc = scrollContainerRef.current;
            if (sc && e.deltaY !== 0) {
              const atTop = sc.scrollTop <= 0 && e.deltaY < 0;
              const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1 && e.deltaY > 0;
              if (atTop || atBottom) {
                // At boundary — forward to the parent snap-scroll container to change page
                const parent = sc.parentElement?.closest('.overflow-y-auto') as HTMLElement | null;
                if (parent) {
                  parent.scrollTop += e.deltaY;
                  // Dismiss popup when changing pages
                  handlePopupLeave();
                  return;
                }
              }
              sc.scrollTop += e.deltaY;
            }
            // Horizontal scroll on filmstrip
            const filmstrip = card.closest('.overflow-x-auto');
            if (filmstrip && e.deltaX !== 0) {
              (filmstrip as HTMLElement).scrollLeft += e.deltaX;
            }
            // Update popup position directly on DOM — no React re-render
            const rect = card.getBoundingClientRect();
            popup.style.top = `${rect.top}px`;
            popup.style.left = `${rect.left}px`;
          }}
        >
          <button
            type="button"
            className="w-full overflow-hidden rounded-xl text-left"
            style={{
              borderRadius: 12,
              boxShadow: expanded
                ? `0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}44`
                : "0 2px 8px rgba(0,0,0,0.2)",
              transition: closing
                ? `box-shadow ${CLOSE_ANIM_MS}ms ease`
                : `box-shadow ${EXPAND_MS}ms ease`,
              background: "rgba(20, 20, 24, 0.98)",
            }}
            onClick={() => onOpen(project, fixedRect)}
          >
            {/* Thumbnail — no title or language (info panel has it), use gif */}
            <CardThumbnail
              project={project}
              imgError={imgError}
              onImgError={() => setImgError(true)}
              showTitle={false}
              showLanguage={false}
              useGif={true}
            />

            {/* Netflix-style info panel below thumbnail */}
            <div
              className="px-3 pb-3 pt-2 space-y-2"
              style={{
                maxHeight: expanded ? 120 : 0,
                opacity: expanded ? 1 : 0,
                overflow: "hidden",
                transition: closing
                  ? `max-height ${CLOSE_ANIM_MS}ms ease-in, opacity ${CLOSE_ANIM_MS * 0.5}ms ease-in`
                  : `max-height ${EXPAND_MS}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${EXPAND_MS * 0.6}ms ease ${EXPAND_MS * 0.3}ms`,
              }}
            >
              <p className="text-sm font-semibold leading-tight text-white">
                {project.name}
              </p>
              {summary && (
                <p
                  className="text-xs leading-snug text-white/60"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {summary}
                </p>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
                      style={{
                        background: accentColor + "2a",
                        color: accentColor,
                        border: `1px solid ${accentColor}44`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        </div>,
        portalTarget,
      )}
    </>
  );
}

// FilmstripRow removed — replaced by responsive grid layout in main render

// ── Main section ──────────────────────────────────────────────────────────────

const CLOSE_MS = 160;

export default function ProjectsSection({ data }: ProjectsSectionProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectOrigin, setProjectOrigin] = useState<PopOrigin | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselPaused = useRef(false);

  // Auto-rotate carousel every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      if (!carouselPaused.current) setCarouselIdx((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const projectPanelRef = useRef<HTMLDivElement>(null);
  const projectBackdropRef = useRef<HTMLDivElement>(null);

  const closeProject = () => {
    const panel = projectPanelRef.current;
    const backdrop = projectBackdropRef.current;
    const o = projectOrigin ?? { tx: 0, ty: 0, sx: 0.9, sy: 0.9 };
    backdrop && (backdrop.style.pointerEvents = "none");
    panel?.animate(
      [
        {
          transform: "translate(0,0) scale(1,1)",
          opacity: 1,
          borderRadius: "24px",
        },
        {
          transform: `translate(${o.tx}px,${o.ty}px) scale(${o.sx},${o.sy})`,
          opacity: 0,
          borderRadius: "16px",
        },
      ],
      {
        duration: CLOSE_MS,
        easing: "cubic-bezier(0.4,0,1,1)",
        fill: "forwards",
      },
    );
    backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: CLOSE_MS,
      easing: "ease-in",
      fill: "forwards",
    });
    setTimeout(() => setActiveProject(null), CLOSE_MS);
  };

  const openProject = (project: Project, rect: DOMRect) => {
    const modalW = Math.min(window.innerWidth - 48, 1152);
    const modalH = window.innerHeight * 0.92;
    const tx = rect.left + rect.width / 2 - window.innerWidth / 2;
    const ty = rect.top + rect.height / 2 - window.innerHeight / 2;
    const sx = rect.width / modalW;
    const sy = rect.height / modalH;
    setProjectOrigin({ tx, ty, sx, sy });
    setActiveProject(project);
  };

  useEffect(() => {
    if (!activeProject) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProject();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeProject]);

  useEffect(() => {
    if (!contribModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContribModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contribModalOpen]);

  useEffect(() => {
    const active = Boolean(activeProject);
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
  }, [activeProject]);

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
  const heatmapWidth = HEATMAP_GRID_LEFT + contributionWeeks.length * CONTRIBUTION_STEP - CONTRIBUTION_CELL_GAP;
  const heatmapHeight = HEATMAP_GRID_TOP + 7 * CONTRIBUTION_STEP - CONTRIBUTION_CELL_GAP;

  // Support both flat (new) and nested (legacy) data formats
  const allProjects = useMemo(() => {
    if (data.projects) {
      // New flat format — category is a field on each project
      return data.projects.map((p) => ({
        ...p,
        categorySlug: p.category || "uncategorized",
        categoryTitle: toTitleCase(p.category || "uncategorized"),
      }));
    }
    // Legacy nested format
    return (data.categories || []).flatMap((cat) =>
      cat.projects.map((p) => ({
        ...p,
        categorySlug: cat.slug,
        categoryTitle: cat.title,
      })),
    );
  }, [data]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === "all") return allProjects;
    return allProjects.filter((p) => p.categorySlug === activeFilter);
  }, [allProjects, activeFilter]);

  const categoryRows = useMemo(() => {
    const grouped = new Map<string, { slug: string; title: string; projects: typeof allProjects }>();
    for (const p of filteredProjects) {
      const existing = grouped.get(p.categorySlug);
      if (existing) {
        existing.projects.push(p);
      } else {
        grouped.set(p.categorySlug, {
          slug: p.categorySlug,
          title: p.categoryTitle,
          projects: [p],
        });
      }
    }

    // When filtering a specific category, skip merging
    if (activeFilter !== "all") {
      return Array.from(grouped.values());
    }

    // Hybrid: categories with 3+ projects get own row, rest merge into "More Projects"
    const bigRows: typeof grouped extends Map<string, infer V> ? V[] : never = [];
    const smallProjects: typeof allProjects = [];
    for (const cat of grouped.values()) {
      if (cat.projects.length >= 3) {
        bigRows.push(cat);
      } else {
        smallProjects.push(...cat.projects);
      }
    }
    bigRows.sort((a, b) => {
      if (a.slug === "uncategorized") return 1;
      if (b.slug === "uncategorized") return -1;
      return a.title.localeCompare(b.title);
    });
    if (smallProjects.length > 0) {
      bigRows.push({ slug: "more", title: "More Projects", projects: smallProjects });
    }
    return bigRows;
  }, [filteredProjects, activeFilter]);

  const featuredProjects = useMemo(() =>
    allProjects.filter((p) => p.featured),
  [allProjects]);

  const recentActivity = useMemo(() =>
    allProjects
      .flatMap((p) =>
        (p.commitLog ?? []).map((c) => ({
          ...c,
          projectName: p.name,
          projectUrl: p.url,
        }))
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20),
    [allProjects]
  );

  const filterOptions = useMemo(() => {
    const catMap = new Map<string, { slug: string; title: string; count: number }>();
    for (const p of allProjects) {
      const existing = catMap.get(p.categorySlug);
      if (existing) {
        existing.count++;
      } else {
        catMap.set(p.categorySlug, {
          slug: p.categorySlug,
          title: p.categoryTitle,
          count: 1,
        });
      }
    }
    return [
      { slug: "all", title: "All", count: allProjects.length },
      ...Array.from(catMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
    ];
  }, [allProjects]);

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

  const projectPopStyle = useMemo(() => {
    if (!projectOrigin) return undefined;
    return {
      ["--flip-tx" as const]: `${projectOrigin.tx}px`,
      ["--flip-ty" as const]: `${projectOrigin.ty}px`,
      ["--flip-sx" as const]: `${projectOrigin.sx}`,
      ["--flip-sy" as const]: `${projectOrigin.sy}`,
    } as CSSProperties;
  }, [projectOrigin]);

  const readmeBlocks = useMemo(() => {
    if (!activeProject?.readme) return [] as ReactElement[];
    return renderMarkdown(activeProject.readme);
  }, [activeProject]);

  return (
    <section className="space-y-3">
      {/* Header bar with title, contribution, and filter pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 entrance" style={{ animationDelay: "900ms" }}>
          <h2 className="text-4xl font-semibold tracking-tight">Projects</h2>
          {contributions ? (
            <button
              type="button"
              onClick={() => setContribModalOpen(true)}
              className="card flex items-center gap-3 rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-150 hover:opacity-100 opacity-90 group"
              style={{ outline: "none" }}
            >
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {contributionTotal.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] opacity-60">
                  contributions this year
                </p>
              </div>
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${CONTRIBUTION_SPARKLINE_WIDTH} ${CONTRIBUTION_SPARKLINE_HEIGHT}`}
                className="h-6 w-28"
              >
                <polyline
                  fill="none"
                  stroke="var(--contrib-4)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={contributionSparkline}
                />
              </svg>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70 transition-opacity flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="relative flex flex-wrap gap-2 entrance" style={{ animationDelay: "1200ms" }}>
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.slug;
            const isAll = opt.slug === "all";
            const accent = isAll
              ? "#e6e1d8"
              : CATEGORY_ACCENTS[opt.slug] ?? DEFAULT_ACCENT;
            return (
              <button
                key={opt.slug}
                type="button"
                className="rounded-full px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? accent + "28" : "transparent",
                  color: isActive ? accent : undefined,
                  border: isActive
                    ? `1.5px solid ${accent}55`
                    : "1.5px solid var(--panel-border, rgba(255,255,255,0.12))",
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 400,
                }}
                onClick={() => setActiveFilter(opt.slug)}
              >
                {opt.title}
                <span className="ml-1.5 opacity-50">{opt.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects content */}
      <div className="space-y-8 pb-16 sm:pb-20 md:pb-24">
        {/* Featured — Netflix-style billboard */}
        {featuredProjects.length > 0 && activeFilter === "all" && (() => {
          const count = featuredProjects.length;
          const activeIdx = ((carouselIdx % count) + count) % count;
          const project = featuredProjects[activeIdx];
          const [g1, g2] = getLangGradient(project.language);
          const displayImage = project.image;
          const hasImage = displayImage && !displayImage.includes("opengraph.githubassets.com");

          return (
            <div
              className="relative overflow-hidden rounded-2xl cursor-pointer"
              style={{ aspectRatio: "16 / 9", maxHeight: "70vh", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={() => { carouselPaused.current = true; }}
              onMouseLeave={() => { carouselPaused.current = false; }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                openProject(project, rect);
              }}
            >
              {/* Backdrop images — all stacked, only active one visible */}
              {featuredProjects.map((p, i) => {
                const img = p.image;
                const show = img && !img.includes("opengraph.githubassets.com");
                const [lg1, lg2] = getLangGradient(p.language);
                return (
                  <div
                    key={p.repo}
                    className={i === activeIdx ? "billboard-active" : ""}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: i === activeIdx ? 1 : 0,
                      transition: i === activeIdx ? undefined : "opacity 500ms ease",
                      zIndex: i === activeIdx ? 1 : 0,
                    }}
                  >
                    {show ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: `linear-gradient(135deg, ${lg1}dd, ${lg2}dd)` }}
                      />
                    )}
                  </div>
                );
              })}

              {/* Vignette — bottom gradient for centered text */}
              <div
                className="absolute inset-0 z-[2]"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.1) 55%, transparent 70%)",
                }}
              />

              {/* Text content — centered */}
              <div
                key={activeIdx}
                className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8 flex flex-col items-center text-center"
              >
                <h3
                  className="billboard-text-in text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)", opacity: 0 }}
                >
                  {project.name}
                </h3>
                {project.summary && (
                  <p
                    className="billboard-text-in text-sm sm:text-base text-white/80 line-clamp-2 leading-relaxed mb-3 max-w-xl"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)", opacity: 0 }}
                  >
                    {project.summary}
                  </p>
                )}
              </div>

              {/* Thumbnail strip + progress — bottom center */}
              <div className="absolute inset-x-0 bottom-3 z-10 flex flex-col items-center gap-2">
                {/* Thumbnail strip */}
                <div className="flex gap-2">
                  {featuredProjects.map((p, i) => {
                    const thumb = p.image;
                    const showThumb = thumb && !thumb.includes("opengraph.githubassets.com");
                    const [tg1, tg2] = getLangGradient(p.language);
                    const isActive = i === activeIdx;
                    return (
                      <button
                        key={p.repo}
                        type="button"
                        className="relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300"
                        style={{
                          width: 64,
                          height: 36,
                          border: isActive ? "2px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.15)",
                          opacity: isActive ? 1 : 0.5,
                          transform: isActive ? "scale(1.1)" : "scale(1)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIdx(i);
                        }}
                        aria-label={`Show ${p.name}`}
                      >
                        {showThumb ? (
                          <img src={thumb} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${tg1}, ${tg2})` }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="flex gap-1.5">
                  {featuredProjects.map((_, i) => (
                    <div
                      key={i}
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ width: 32, background: "rgba(255,255,255,0.15)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: i === activeIdx ? "100%" : "0%",
                          background: CATEGORY_ACCENTS.featured,
                          transition: i === activeIdx ? "width 4s linear" : "width 300ms ease",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Category grid sections */}
        {categoryRows.map((cat) => {
          const accentColor = CATEGORY_ACCENTS[cat.slug] ?? DEFAULT_ACCENT;
          return (
            <div key={cat.slug} className="space-y-3">
              <div className="flex items-baseline gap-3">
                <h3 className="text-lg font-semibold tracking-tight">{cat.title}</h3>
                <span className="text-xs uppercase tracking-[0.28em]" style={{ color: accentColor }}>
                  {cat.projects.length} {cat.projects.length === 1 ? "project" : "projects"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cat.projects.map((project, i) => (
                  <div
                    key={project.repo}
                    className="grid-card-enter"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <ProjectCard project={project} accentColor={accentColor} onOpen={openProject} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project detail modal */}
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
            ref={projectBackdropRef}
            className="absolute inset-0 folder-fade"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
            onClick={closeProject}
            aria-hidden="true"
          />
          <div
            ref={projectPanelRef}
            className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border folder-pop"
            style={{
              backgroundColor: "var(--panel-surface, rgba(16, 17, 19, 0.98))",
              borderColor:
                "var(--panel-border-strong, rgba(255, 255, 255, 0.3))",
              transformOrigin: "center center",
              ...projectPopStyle,
            }}
          >
            <div className="flex items-center justify-between border-b border-current/30 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] opacity-90">
                  {activeProject.repo}
                </p>
                <h3 className="text-2xl font-semibold">
                  {activeProject.name}
                </h3>
              </div>
              <button
                type="button"
                className="tag rounded-full px-3 py-1 text-xs uppercase tracking-[0.28em] opacity-90 transition hover:opacity-100"
                onClick={closeProject}
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
                  <div className="card rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                      Overview
                    </p>
                    <p className="mt-3 text-sm opacity-85">
                      {activeProject.summary ||
                        activeProject.description ||
                        "Sync GitHub to load project details."}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
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
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                          Updated
                        </p>
                        <p className="text-sm">
                          {activeProject.updatedAt || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                          Stats
                        </p>
                        <p className="text-sm">
                          Stars {activeProject.stars ?? 0} / Forks{" "}
                          {activeProject.forks ?? 0} / Issues{" "}
                          {activeProject.issues ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                          Default Branch
                        </p>
                        <p className="text-sm">
                          {activeProject.defaultBranch || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                          Language
                        </p>
                        <p className="text-sm">
                          {activeProject.language || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                          License
                        </p>
                        <p className="text-sm">
                          {activeProject.license || "Not specified"}
                        </p>
                      </div>
                    </div>
                    {activeProject.homepage ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
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
                        <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                          Tags
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-90">
                          {activeProjectTags.map((tag) => (
                            <span
                              key={`${activeProject.repo}-${tag}`}
                              className="tag rounded-full px-3 py-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="card rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-[0.26em] opacity-90">
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
                              <span className="opacity-90"> / </span>
                              <span className="opacity-85">
                                {commit.message}
                              </span>
                              <span className="opacity-90">
                                {" "}- {commitMeta}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs opacity-90">
                        No commit data available.
                      </p>
                    )}
                  </div>

                  <div className="card rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                      Readme
                    </p>
                    {readmeBlocks.length ? (
                      <div className="mt-4 space-y-3 text-sm opacity-85">
                        {readmeBlocks}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm opacity-90">
                        Add a readme override or sync GitHub to load content.
                      </p>
                    )}
                  </div>
                </div>

                {activeProject.image ? (
                  <div className="space-y-6">
                    <div className="card rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.26em] opacity-90">
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

      {/* Contribution heatmap modal */}
      {contribModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10"
          role="dialog"
          aria-modal="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 folder-fade"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setContribModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border folder-pop"
            style={{
              backgroundColor: "var(--panel-surface, rgba(16,17,19,0.98))",
              borderColor: "var(--panel-border-strong, rgba(255,255,255,0.3))",
            }}
          >
            <div className="flex items-center justify-between border-b border-current/30 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] opacity-60">
                  {data.user ?? "cmbenello"}
                </p>
                <h3 className="text-2xl font-semibold">Activity</h3>
              </div>
              <button
                type="button"
                className="tag rounded-full px-3 py-1 text-xs uppercase tracking-[0.28em] opacity-90 transition hover:opacity-100"
                onClick={() => setContribModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-6"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Stats */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {contributionTotal.toLocaleString()}
                </span>
                <span className="text-sm opacity-55">contributions this year</span>
              </div>

              {/* Heatmap grid */}
              {contributionWeeks.length > 0 && (
                <div
                  className="rounded-xl border border-current/10 p-4"
                  style={{ background: "rgba(0,0,0,0.15)" }}
                >
                  <svg
                    viewBox={`0 0 ${heatmapWidth} ${heatmapHeight}`}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    preserveAspectRatio="xMinYMin meet"
                  >
                    {/* Month labels */}
                    {contributionMonths.map((month) => (
                      <text
                        key={month.name + month.start}
                        x={HEATMAP_GRID_LEFT + month.start * CONTRIBUTION_STEP}
                        y={14}
                        fontSize={9}
                        fill="currentColor"
                        fillOpacity={0.55}
                        style={{ fontFamily: "inherit" }}
                      >
                        {month.name}
                      </text>
                    ))}
                    {/* Day-of-week labels */}
                    {([{ label: "Mon", idx: 1 }, { label: "Wed", idx: 3 }, { label: "Fri", idx: 5 }]).map(({ label, idx }) => (
                      <text
                        key={label}
                        x={HEATMAP_GRID_LEFT - 4}
                        y={HEATMAP_GRID_TOP + idx * CONTRIBUTION_STEP + CONTRIBUTION_CELL_SIZE - 1}
                        fontSize={9}
                        textAnchor="end"
                        fill="currentColor"
                        fillOpacity={0.45}
                        style={{ fontFamily: "inherit" }}
                      >
                        {label}
                      </text>
                    ))}
                    {/* Contribution cells */}
                    {contributionWeeks.flatMap((week, wIdx) =>
                      week.contributionDays.map((day, dIdx) => (
                        <rect
                          key={day.date}
                          x={HEATMAP_GRID_LEFT + wIdx * CONTRIBUTION_STEP}
                          y={HEATMAP_GRID_TOP + dIdx * CONTRIBUTION_STEP}
                          width={CONTRIBUTION_CELL_SIZE}
                          height={CONTRIBUTION_CELL_SIZE}
                          rx={2}
                          fill={getContributionColor(day)}
                        >
                          <title>
                            {day.date}: {day.contributionCount} contribution{day.contributionCount !== 1 ? "s" : ""}
                          </title>
                        </rect>
                      ))
                    )}
                  </svg>
                  {/* Legend */}
                  <div className="mt-3 flex items-center gap-1.5 justify-end">
                    <span className="text-[9px] uppercase tracking-wider opacity-45 mr-1">Less</span>
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: `var(--contrib-${level})`,
                        }}
                      />
                    ))}
                    <span className="text-[9px] uppercase tracking-wider opacity-45 ml-1">More</span>
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {recentActivity.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] opacity-65 mb-3">
                    Recent Activity
                  </p>
                  <ul className="space-y-2.5">
                    {recentActivity.map((commit, i) => (
                      <li
                        key={`${commit.sha}-${i}`}
                        className="grid gap-x-3 text-xs"
                        style={{ gridTemplateColumns: "5rem auto 1fr 3rem" }}
                      >
                        <span className="opacity-40 tabular-nums self-start pt-px">{commit.date}</span>
                        <span className="opacity-70 truncate self-start pt-px">{commit.projectName}</span>
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-80 hover:opacity-100 underline underline-offset-2 truncate"
                        >
                          {commit.message}
                        </a>
                        <span className="opacity-30 font-mono text-right self-start pt-px">{commit.sha}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
