import PageShell from "./components/PageShell";

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  default_branch: string;
  fork: boolean;
  archived: boolean;
  topics?: string[];
  license?: { name?: string | null } | null;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string | null;
      date?: string | null;
    } | null;
  };
  author?: { login?: string | null } | null;
};

type GitHubProject = {
  name: string;
  url: string;
  description: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  issues: number;
  updatedAt: string;
  defaultBranch: string;
  topics: string[];
  license: string;
  commitLog: Array<{
    sha: string;
    message: string;
    url: string;
    date: string;
    author: string;
  }>;
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

type ContributionResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: ContributionCalendar;
      } | null;
    } | null;
  };
};

const GITHUB_USER = "cmbenello";
const GITHUB_API_BASE = "https://api.github.com";
const REPO_FETCH_LIMIT = 12;
const REPO_DISPLAY_LIMIT = 6;
const COMMIT_LIMIT = 4;
const CONTRIBUTION_CELL_SIZE = 11;
const CONTRIBUTION_CELL_GAP = 4;
const CONTRIBUTION_LABEL_WIDTH = 34;
const CONTRIBUTION_LABEL_GAP = 12;
const CONTRIBUTION_SPARKLINE_WIDTH = 220;
const CONTRIBUTION_SPARKLINE_HEIGHT = 48;

const ABOUT_PARAGRAPHS = [
  "I am a master's student in Financial Mathematics at the University of Chicago, where I completed my undergraduate degree in Mathematics and Computer Science with a specialization in computer systems and a minor in Korean.",
  "My academic and research background spans large-scale data processing, database internals, and high-performance systems, with a growing focus on applying these skills to quantitative finance. This summer, I am conducting research at EPFL under Professor Anastasia Ailamaki on GPU-accelerated compression techniques for analytical database systems.",
  "Previously, I was a researcher at the ChiData Lab at the University of Chicago, working with Professor Aaron Elmore.",
];

const ABOUT_TAGS = [
  "Financial Mathematics",
  "Database Systems",
  "GPU Compression",
  "Quantitative Research",
];

const EDUCATION = [
  {
    school: "University of Chicago",
    degree: "Master's degree",
    field: "Financial Mathematics",
    dates: "Jun 2025 - Dec 2026",
    notes: "",
  },
  {
    school: "University of Chicago",
    degree: "BS",
    field:
      "Mathematics and Computer Science (Systems specialization); Minor in Korean",
    dates: "Sep 2021 - Jun 2025",
    notes: "Dean's List",
  },
  {
    school: "St Paul's School",
    degree: "",
    field: "",
    dates: "2015 - 2021",
    notes: "Mathematics: A*; Further Mathematics: A*; Computer Science: D1",
  },
];

const CURRENT_RESEARCH = [
  "GPU-accelerated compression techniques for analytical database systems",
  "Parallel compression algorithms optimized for modern hardware",
  "Applying systems research to quantitative finance",
];

const EXPERIENCE = [
  {
    title: "Research Assistant",
    company: "University of Chicago Department of Computer Science",
    employmentType: "",
    dates: "Aug 2023 - Present",
    location: "Chicago, Illinois, United States",
    highlights: [
      "Researching query optimization in databases",
      "Exploring parallelizing external merge sort",
      "Implemented Small String Optimization to reduce memory usage by 50% and improve query speed",
      "Removed a 500MB CSV import limit in a Rust crate, increasing import speed by 50%",
    ],
  },
  {
    title: "Teaching Assistant",
    company: "University of Chicago Department of Computer Science",
    employmentType: "Part-time",
    dates: "Sep 2023 - Present",
    location: "Chicago Heights, Illinois, United States",
    highlights: [],
  },
  {
    title: "Quantitative Researcher - University of Chicago Project Lab",
    company: "Bank of America",
    employmentType: "",
    dates: "Oct 2025 - Dec 2025",
    location: "",
    highlights: [],
  },
  {
    title: "Summer Researcher",
    company: "EPFL",
    employmentType: "Full-time",
    dates: "Jun 2025 - Sep 2025",
    location: "Lausanne, Vaud, Switzerland",
    highlights: [
      "Built analytical and simulation-based models to predict performance across varying query complexities",
      "Designed join patterns to evaluate GPU compression on TPC-DS workloads with resource contention models",
      "Engineered a macroblock-based GPU decompression strategy cutting out-of-memory query times by 50-200%",
      "Benchmarked GPU compression techniques to quantify trade-offs for cost-based strategies",
    ],
  },
  {
    title: "Lead Residential Assistant",
    company: "University of Chicago",
    employmentType: "Full-time",
    dates: "2023 - 2024",
    location: "",
    highlights: [],
  },
  {
    title: "Teaching Assistant",
    company: "University of Chicago Department of Mathematics",
    employmentType: "",
    dates: "Sep 2022 - Dec 2023",
    location: "",
    highlights: [],
  },
  {
    title: "Analyst",
    company: "TSM",
    employmentType: "Internship",
    dates: "Jul 2023 - Sep 2023",
    location: "Los Angeles, California, United States",
    highlights: [
      "Led market entry strategy research for Counter-Strike 1 and 2",
      "Analyzed competitor pricing for expansion into Fortnite or Roblox",
      "Led development of three CS 2 videos, reaching 130K views",
    ],
  },
];

const RESEARCH_FOCUS = [
  "Large-scale data processing",
  "Database internals",
  "High-performance systems",
  "GPU-accelerated compression",
];

const RESEARCH_HIGHLIGHTS = [
  "Parallel compression algorithms optimized for modern hardware",
  "Analytical and simulation-based performance models for GPU decompression",
  "Resource contention modeling across I/O, decompression, and compute",
];

const TEACHING_COURSES = [
  "Winter 2026: CMSC 235 - Databases Systems",
  "Fall 2025: CMSC 141 - Intro to CS I",
  "Spring 2025: CMSC 235 - Databases Systems",
  "Winter 2025: CMSC 142 - Intro to CS II",
  "Fall 2024: CMSC 144 - Systems Programming II",
  "Spring 2024: CMSC 235 - Databases Systems",
  "Fall 2023: CMSC 143 - Systems Programming I",
  "Fall 2023: Math 131 - Elem Functions and Calculus I",
  "Spring 2023: Math 159 - Intro to Proofs in Analysis",
  "Winter 2023: Math 159 - Intro to Proofs in Analysis",
  "Fall 2022: Math 159 - Intro to Proofs in Analysis",
];

const ADVISORS = [
  "Professor Aaron Elmore (ChiData Lab, University of Chicago)",
  "Professor Anastasia Ailamaki (DIAS Lab, EPFL)",
];

const formatMetaLine = (parts: Array<string | undefined>) =>
  parts.filter((part) => part && part.trim().length > 0).join(" / ");

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

const formatCommitMessage = (value: string) => value.split("\n")[0] || value;

const getGitHubHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const fetchGitHub = async <T,>(url: string) => {
  try {
    const response = await fetch(url, {
      headers: getGitHubHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const loadGitHubProjects = async (): Promise<GitHubProject[]> => {
  const repoUrl = `${GITHUB_API_BASE}/users/${GITHUB_USER}/repos?sort=updated&direction=desc&per_page=${REPO_FETCH_LIMIT}`;
  const repos = await fetchGitHub<GitHubRepo[]>(repoUrl);
  if (!repos || repos.length === 0) return [];

  const filtered = repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, REPO_DISPLAY_LIMIT);

  const commitResults = await Promise.all(
    filtered.map((repo) =>
      fetchGitHub<GitHubCommit[]>(
        `${GITHUB_API_BASE}/repos/${GITHUB_USER}/${repo.name}/commits?per_page=${COMMIT_LIMIT}`,
      ),
    ),
  );

  return filtered.map((repo, index) => {
    const commits = commitResults[index] || [];
    return {
      name: repo.name,
      url: repo.html_url,
      description: repo.description || "No description provided.",
      homepage: repo.homepage || "",
      language: repo.language || "",
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      issues: repo.open_issues_count || 0,
      updatedAt: formatDate(repo.updated_at),
      defaultBranch: repo.default_branch || "",
      topics: repo.topics || [],
      license: repo.license?.name || "",
      commitLog: commits.map((commit) => ({
        sha: commit.sha.slice(0, 7),
        message: formatCommitMessage(commit.commit.message),
        url: commit.html_url,
        date: formatDate(commit.commit.author?.date),
        author:
          commit.commit.author?.name || commit.author?.login || "Unknown",
      })),
    };
  });
};

const loadGitHubContributions = async (): Promise<ContributionCalendar | null> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const to = new Date();
  const from = new Date();
  from.setFullYear(to.getFullYear() - 1);

  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          months {
            name
            firstDay
            totalWeeks
          }
          weeks {
            firstDay
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
      method: "POST",
      headers: {
        ...getGitHubHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          login: GITHUB_USER,
          from: from.toISOString(),
          to: to.toISOString(),
        },
      }),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as ContributionResponse;
    return (
      data?.data?.user?.contributionsCollection?.contributionCalendar || null
    );
  } catch {
    return null;
  }
};

const getContributionColor = (day: ContributionDay) => {
  if (day.contributionCount <= 0) {
    return "rgba(255, 255, 255, 0.08)";
  }
  return day.color || "rgba(34, 197, 94, 0.85)";
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

export default async function Home() {
  const projects = await loadGitHubProjects();
  const contributions = await loadGitHubContributions();
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
  const maxWeeklyTotal = Math.max(1, ...weeklyTotals);
  const sparklinePoints = weeklyTotals
    .map((value, index) => {
      const x =
        (index / Math.max(1, weeklyTotals.length - 1)) *
        CONTRIBUTION_SPARKLINE_WIDTH;
      const y =
        CONTRIBUTION_SPARKLINE_HEIGHT -
        (value / maxWeeklyTotal) * CONTRIBUTION_SPARKLINE_HEIGHT;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <PageShell>
      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.35em] opacity-55">
            01 About
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Charles Benello
          </h1>
          <div className="space-y-3 text-lg opacity-80">
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-70">
            {ABOUT_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-current/25 px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Education
            </p>
            <div className="mt-4 space-y-4 text-sm opacity-80">
              {EDUCATION.map((item) => (
                <div key={`${item.school}-${item.dates}`}>
                  <p className="text-sm font-semibold">{item.school}</p>
                  {(item.degree || item.field) && (
                    <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                      {formatMetaLine([item.degree, item.field])}
                    </p>
                  )}
                  <p className="text-xs opacity-70">{item.dates}</p>
                  {item.notes ? (
                    <p className="text-xs opacity-70">{item.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Current Research
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {CURRENT_RESEARCH.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] opacity-55">
            02 Experience
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">Experience</h2>
          <p className="max-w-2xl text-lg opacity-80">
            Research, teaching, and analytics roles across academia and
            industry.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {EXPERIENCE.map((role) => {
            const trimmedHighlights = role.highlights.slice(0, 2);
            return (
              <article
                key={`${role.title}-${role.company}`}
                className="rounded-2xl border border-current/25 p-4"
              >
                <h3 className="text-base font-semibold">{role.title}</h3>
                <p className="text-sm opacity-80">
                  {formatMetaLine([role.company, role.employmentType || ""]) ||
                    role.company}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.26em] opacity-55">
                  {formatMetaLine([role.dates, role.location])}
                </p>
                {trimmedHighlights.length ? (
                  <ul className="mt-2 space-y-1 text-xs opacity-75 list-disc list-inside">
                    {trimmedHighlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-12">
          <p className="text-xs uppercase tracking-[0.35em] opacity-55">
            03 Research + Teaching
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Research + Teaching
          </h2>
          <p className="max-w-2xl text-lg opacity-80">
            Research in database systems and GPU compression, plus teaching in
            computer science and mathematics.
          </p>
        </div>

        <div className="grid gap-4 lg:col-span-6">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Research Focus
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {RESEARCH_FOCUS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Research Highlights
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {RESEARCH_HIGHLIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-6">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Teaching
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {TEACHING_COURSES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Advisors + Labs
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {ADVISORS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] opacity-55">
            04 Projects
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">Projects</h2>
          <p className="max-w-2xl text-lg opacity-80">
            Automatically pulled from GitHub, sorted by most recently updated.
          </p>
        </div>
        {contributions ? (
          <div className="rounded-2xl border border-current/25 p-5">
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
                          backgroundColor:
                            level === 0
                              ? "rgba(255, 255, 255, 0.08)"
                              : `rgba(34, 197, 94, ${0.25 + level * 0.15})`,
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
              <div className="rounded-xl border border-current/15 p-4">
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
                    stroke="rgba(34, 197, 94, 0.9)"
                    strokeWidth="2"
                    points={sparklinePoints}
                  />
                </svg>
                <p className="mt-2 text-xs opacity-70">
                  Based on the last 52 weeks of activity.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-current/25 p-5 text-sm opacity-75">
            Add a GitHub token to load the contribution calendar.
          </div>
        )}
        {projects.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const summaryTags = [project.language, ...project.topics]
                .filter((tag) => tag && tag.trim().length > 0)
                .slice(0, 4);
              return (
                <details
                  key={project.url}
                  className="rounded-2xl border border-current/25 px-5 py-4"
                >
                  <summary
                    className="cursor-pointer list-none"
                    style={{ listStyle: "none" }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                        Updated {project.updatedAt}
                      </span>
                    </div>
                    <p className="mt-2 text-sm opacity-80">
                      {project.description}
                    </p>
                    {summaryTags.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-65">
                        {summaryTags.map((tag) => (
                          <span
                            key={`${project.name}-${tag}`}
                            className="rounded-full border border-current/25 px-3 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-4 text-xs uppercase tracking-[0.28em] opacity-55">
                      Click to expand details
                    </p>
                  </summary>
                  <div className="mt-4 border-t border-current/15 pt-4 text-sm opacity-80">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Repository
                        </p>
                        <a
                          className="text-sm underline underline-offset-4"
                          href={project.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {project.url.replace("https://", "")}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Stats
                        </p>
                        <p className="text-sm">
                          Stars {project.stars} / Forks {project.forks} / Issues{" "}
                          {project.issues}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Default Branch
                        </p>
                        <p className="text-sm">
                          {project.defaultBranch || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          License
                        </p>
                        <p className="text-sm">
                          {project.license || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {project.homepage ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Homepage
                        </p>
                        <a
                          className="text-sm underline underline-offset-4"
                          href={project.homepage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {project.homepage}
                        </a>
                      </div>
                    ) : null}

                    {project.topics.length ? (
                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                          Topics
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-70">
                          {project.topics.map((topic) => (
                            <span
                              key={`${project.name}-${topic}`}
                              className="rounded-full border border-current/25 px-3 py-1"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.26em] opacity-60">
                        Recent Commits
                      </p>
                      {project.commitLog.length ? (
                        <ul className="mt-2 space-y-2 text-xs">
                          {project.commitLog.map((commit) => {
                            const commitMeta = commit.date
                              ? `${commit.author} (${commit.date})`
                              : commit.author;
                            return (
                              <li key={`${project.name}-${commit.sha}`}>
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
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-current/25 p-6 text-sm opacity-75">
            GitHub projects are unavailable. Add a GitHub token and refresh to
            load repos.
          </div>
        )}
      </section>
    </PageShell>
  );
}
