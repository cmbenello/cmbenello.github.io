import PageShell from "./components/PageShell";
import ExperienceTimeline from "./components/ExperienceTimeline";
import ProjectsSection from "./components/ProjectsSection";
import projectsData from "../content/projects-data.json";

const ABOUT_PARAGRAPHS = [
  "I'm a master's student in Financial Mathematics at the University of Chicago and an incoming tech intern at Alter Domus — with a background in low-level systems research, database internals, and high-performance computing.",
  "I work on large-scale systems and performance engineering, with a recent focus on hardware accelerators — particularly GPUs — and how they can be applied to analytical database workloads. I've published in PVLDB and CIDR, working with Professor Aaron Elmore at UChicago's ChiData Lab and Professor Anastasia Ailamaki at EPFL's DIAS Lab.",
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

const CURRENT_WORK = [
  "Research: adaptive sort configuration across disaggregated and cloud-native hardware",
  "Research: GPU-accelerated compression for analytical databases",
  "Evaluating policy compliance gaps in Rust LLM code generation benchmarks",
  "CovTSP: near-optimal transit coverage solver using real GTFS network data",
  "New IDE interface designed around LLM-assisted development workflows",
];

const EXPERIENCE = [
  {
    title: "Database Research Assistant",
    company: "ChiData Research Lab",
    dates: "Aug 2023 — Present",
    logo: "/logos/chidata.png",
    description:
      "Two published papers (PVLDB, CIDR) and ongoing research on external sort — building predictive models for sort configuration on disaggregated and cloud-native hardware, with prior work on resource-adaptive query execution and engine internals.",
    highlights: [
      "First-authored CrocSort (PVLDB 2026): a parallel external merge sort that completes under tight memory budgets where PostgreSQL, DuckDB, and ClickHouse abort, by jointly planning memory and phase-specific thread counts",
      "Co-authored Resource-Adaptive Query Execution with Paged Memory Management (CIDR 2025): enabling query execution to adapt to available memory at runtime",
      "Building a predictive model for CrocSort's configuration knobs on disaggregated and cloud-native hardware — recommending near-optimal (memory, threads) configs without brute-force sweeps, with small-scale calibration transferring to production within ~3% of optimal",
      "Implemented Small String Optimization for more compact string storage, reducing memory usage by 40% and improving query speeds",
    ],
    skills: ["Rust", "DuckDB", "Query Optimization", "Parallel Programming", "Performance Modelling", "Systems Research"],
    papers: [
      { label: "CrocSort — PVLDB 2026", url: "https://github.com/rotaki/ES", note: "In Review" },
      { label: "Resource-Adaptive Query Execution — CIDR 2025", url: "https://vldb.org/cidrdb/papers/2025/p2-otaki.pdf" },
      { label: "Sorting Without Guessing: Adaptive Sort Configuration Across Disaggregated and Cloud-Native Environments — HPTS 2026", wip: true },
    ],
  },
  {
    title: "Quantitative Researcher",
    company: "Bank of America",
    dates: "Sept — Dec 2025",
    logo: "/logos/bofa.png",
    description:
      "Built AI-powered infrastructure for optimizing Bank of America's HQLA (High Quality Liquid Assets) portfolio — generating forward-looking risk scenarios, modeling macro shocks, and surfacing reallocation suggestions through agentic pipelines.",
    highlights: [
      "Engineered a multi-agent debate (MAD) system where competing LLM agents generate and challenge macro stress scenarios, producing probability-weighted portfolio reallocation recommendations",
      "Built a daily UST yield curve ingestion pipeline pulling real-time market, macro, and news data into structured curve snapshots used as model inputs",
      "Prototyped liquidity coverage and profitability risk metrics, and developed a FastAPI service exposing the optimizer to downstream dashboards",
      "Shipped full-stack interfaces: a Next.js scenario explorer, a Flask yield curve dashboard, and a React Native mobile app for on-the-go portfolio monitoring",
    ],
    skills: ["LLM Agents", "Python", "Quantitative Finance", "Risk Modeling", "Next.js", "React Native"],
    link: { label: "View Repository", url: "https://github.com/cmbenello/bofa_hqla" },
  },
  {
    title: "GPU Systems Researcher",
    company: "EPFL",
    dates: "Jun — Sep 2025",
    logo: "/logos/epfl.png",
    description:
      "Researched GPU-accelerated compression for large-scale analytical databases at EPFL's DIAS Lab under Professor Anastasia Ailamaki — focusing on decompression strategies, workload modelling, and cost-based performance trade-offs.",
    highlights: [
      "Engineered a macroblock-based GPU decompression strategy cutting out-of-memory query times by 50–200%",
      "Built simulation models to predict query performance across workload complexities, enabling adaptive decompression strategies",
      "Designed join patterns for TPC-DS benchmarks with resource contention models across I/O, decompression, and compute",
      "Benchmarked GPU compression trade-offs, shaping a new cost-based research direction and contributing to a forthcoming publication",
    ],
    skills: ["CUDA", "C++", "Python", "GPU Computing"],
  },
  {
    title: "Teaching Assistant",
    company: "UChicago CS & Mathematics",
    dates: "Sep 2022 — March 2026",
    logo: "/logos/uchicago-cs.jpg",
    description:
      "TAed across CS and math for 3+ years, consistently earning some of the highest discussion scores in my sections — and picked up a TA award nomination along the way.",
    highlights: [],
    courses: [
      "Winter 2026 · CMSC 235 — Database Systems",
      "Fall 2025 · CMSC 141 — Intro to CS I",
      "Spring 2025 · CMSC 235 — Database Systems",
      "Winter 2025 · CMSC 142 — Intro to CS II",
      "Fall 2024 · CMSC 144 — Systems Programming II",
      "Spring 2024 · CMSC 235 — Database Systems",
      "Fall 2023 · CMSC 143 — Systems Programming I",
      "Fall 2023 · Math 131 — Calculus I",
      "Spring 2023 · Math 159 — Intro to Proofs in Analysis",
      "Winter 2023 · Math 159 — Intro to Proofs in Analysis",
      "Fall 2022 · Math 159 — Intro to Proofs in Analysis",
    ],
    skills: ["Python", "C", "Analysis", "Calculus"],
  },
  {
    title: "Lead Residential Assistant",
    company: "University of Chicago",
    dates: "2022 — 2024",
    logo: "/logos/uchicago.png",
    description:
      "Led a staff of 8 RAs across three summers supporting ~1,000 high school students in UChicago's collegiate summer programme — students simultaneously taking university courses, holding part-time jobs, and conducting research.",
    highlights: [
      "Managed a team of 8 residential assistants: coordinating schedules, staff development, and on-call crisis response across a large residential community",
      "Designed and ran a full programme of activities, events, and community initiatives to support student wellbeing throughout each summer term",
      "Acted as primary point of contact for student welfare, mediating conflicts and escalating where appropriate",
      "Returned for three consecutive summers, taking on increasing leadership responsibility each year",
    ],
    skills: ["Leadership", "Team Management", "Event Planning", "Crisis Response"],
  },
  {
    title: "Business Analyst",
    company: "TSM",
    dates: "Jul — Sep 2023",
    logo: "/logos/tsm.png",
    description:
      "Business strategy internship at a leading esports organization, spanning market entry research, competitive intelligence, and content development.",
    highlights: [
      "Sole subject-matter expert on a new title entry strategy — conducted market research and product analysis, and presented findings and opportunity predictions directly to executives",
      "Audited a competitor's digital map product and pricing, sourcing intelligence from 40+ companies to model build costs, platform strategy, and expansion potential into emerging virtual platforms",
      "Directed production of three video campaigns, writing the storyboards — achieving 6.5× the channel's typical viewership on a platform with 2.3M subscribers",
    ],
    skills: ["Market Research", "Competitive Intelligence", "Strategy", "Content Strategy"],
  },
];

const RESEARCH_FOCUS = [
  "Large-scale data processing",
  "Database internals",
  "High-performance systems",
  "GPU-accelerated compression",
];

const RESEARCH_HIGHLIGHTS = [
  "Predictive modelling for CrocSort configuration on disaggregated and cloud-native hardware — finding diminishing returns in thread counts and near-optimal config selection without brute-force sweeps",
  "Resource-adaptive query execution with paged memory management",
  "GPU-accelerated compression: decompression strategies, workload modelling, and cost-based trade-offs",
  "Policy gap in Rust code generation benchmarks: showing that code passing SWE-bench tests can still violate project-defined safety and style policies",
  "Exploring external sort on GPUs, disaggregated hardware, and cloud-native environments — understanding how storage/compute separation and elastic resources reshape sorting performance",
];

const PUBLICATIONS = [
  {
    title: "CrocSort: Resource-Efficient, Skew-Resilient Parallel External Merge Sort",
    authors: ["Riki Otaki*", "Charles Benello*", "Fuheng Zhao", "Aaron J. Elmore", "Goetz Graefe"],
    venue: "PVLDB 19(1), 2026",
    note: "* Equal contribution",
    link: "https://github.com/rotaki/ES",
  },
  {
    title: "Sorting Without Guessing: Adaptive Sort Configuration Across Disaggregated and Cloud-Native Environments",
    authors: ["Charles Benello", "Riki Otaki", "Fuheng Zhao", "Aaron J. Elmore", "Goetz Graefe"],
    venue: "HPTS 2026",
    note: "WIP",
    link: "",
  },
  {
    title: "Resource-Adaptive Query Execution with Paged Memory Management",
    authors: ["Riki Otaki", "Jun Hyuk Chang", "Charles Benello", "Aaron J. Elmore", "Goetz Graefe"],
    venue: "CIDR 2025",
    note: "",
    link: "https://vldb.org/cidrdb/papers/2025/p2-otaki.pdf",
  },
  {
    title: "Benchmarks Pass, Policies Fail: A Policy Gap in Rust Code Generation Evaluation",
    authors: ["Matt Gaughan", "Charles Benello"],
    venue: "In preparation",
    note: "WIP",
    link: "",
  },
];

const ADVISORS = [
  "Professor Aaron Elmore (ChiData Lab, University of Chicago)",
  "Professor Anastasia Ailamaki (DIAS Lab, EPFL)",
];

const formatMetaLine = (parts: Array<string | undefined>) =>
  parts.filter((part) => part && part.trim().length > 0).join(" / ");

export default function Home() {
  return (
    <PageShell>
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

      <ExperienceTimeline entries={EXPERIENCE} />

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-12">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] opacity-65">03 Research + Publications</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Research + Publications</h2>
          </div>
        </div>

        <div className="grid gap-8 lg:col-span-6">
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Research Focus
            </p>
            <ul className="mt-4 space-y-2 text-base opacity-80">
              {RESEARCH_FOCUS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Research Highlights
            </p>
            <ul className="mt-4 space-y-2 text-base opacity-80">
              {RESEARCH_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Advisors + Labs
            </p>
            <ul className="mt-4 space-y-2 text-base opacity-80">
              {ADVISORS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-8 lg:col-span-6">
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Publications
            </p>
            <div className="mt-4 space-y-5">
              {PUBLICATIONS.map((pub) => (
                <div key={pub.title + pub.venue} className="space-y-1">
                  <p className="text-base font-semibold leading-snug opacity-90">
                    {pub.link ? (
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-1 underline-offset-2 transition-opacity hover:opacity-100"
                        style={{ textDecorationColor: "var(--accent-3)" }}
                      >
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                  </p>
                  <p className="text-base leading-relaxed opacity-85">
                    {pub.authors.map((author, i) => (
                      <span key={author + i}>
                        {author.includes("Charles Benello") ? (
                          <strong className="underline underline-offset-2 decoration-1 opacity-100">{author}</strong>
                        ) : (
                          author
                        )}
                        {i < pub.authors.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                  <p className="text-sm font-medium opacity-55">{pub.venue}</p>
                  {pub.note && (
                    <p className="text-xs uppercase tracking-wide opacity-40">{pub.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProjectsSection data={projectsData} />
    </PageShell>
  );
}
