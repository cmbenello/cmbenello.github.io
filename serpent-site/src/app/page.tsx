import PageShell from "./components/PageShell";
import ExperienceTimeline from "./components/ExperienceTimeline";
import ProjectsSection from "./components/ProjectsSection";
import projectsData from "../content/projects-data.json";

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
    company: "UChicago CS",
    dates: "Aug 2023 — Present",
    logo: "/logos/chidata.png",
    description:
      "Researching query optimization and parallelizing external merge sort in the ChiData Lab under Professor Aaron Elmore.",
    highlights: [
      "Implemented Small String Optimization to reduce memory usage by 50% and improve query speed",
      "Removed a 500MB CSV import limit in a Rust crate, increasing import speed by 50%",
    ],
    skills: ["Rust", "C++", "DuckDB", "Query Optimization"],
  },
  {
    title: "Teaching Assistant",
    company: "UChicago CS & Mathematics",
    dates: "Sep 2022 — Present",
    logo: "/logos/uchicago-cs.jpg",
    description:
      "TA for computer science and mathematics courses including systems programming, databases, and proof-based math.",
    highlights: [],
    courses: [
      "Math 131 — Calculus I",
      "Math 159 — Intro to Proofs in Analysis (x3)",
      "CMSC 141 — Intro to CS I",
      "CMSC 142 — Intro to CS II",
      "CMSC 143 — Systems Programming I",
      "CMSC 144 — Systems Programming II",
      "CMSC 235 — Database Systems (x3)",
    ],
    skills: ["C", "Python", "Mathematics", "Teaching"],
  },
  {
    title: "Quantitative Researcher",
    company: "Bank of America",
    dates: "Oct — Dec 2025",
    logo: "/logos/bofa.png",
    description:
      "University of Chicago Project Lab placement. Quantitative research and modeling.",
    highlights: [],
    skills: ["Python", "Quantitative Finance", "Data Analysis"],
  },
  {
    title: "Summer Researcher",
    company: "EPFL",
    dates: "Jun — Sep 2025",
    logo: "/logos/epfl.png",
    description:
      "Research on GPU-accelerated compression for analytical databases under Professor Anastasia Ailamaki.",
    highlights: [
      "Built analytical and simulation-based models to predict performance across varying query complexities",
      "Engineered a macroblock-based GPU decompression strategy cutting out-of-memory query times by 50-200%",
    ],
    skills: ["CUDA", "C++", "Python", "GPU Computing", "PostgreSQL"],
  },
  {
    title: "Lead Residential Assistant",
    company: "University of Chicago",
    dates: "2023 — 2024",
    logo: "/logos/uchicago.png",
    description:
      "Led a team of residential assistants. Managed community programming and crisis response.",
    highlights: [],
    skills: ["Leadership", "Event Planning"],
  },
  {
    title: "Analyst",
    company: "TSM",
    dates: "Jul — Sep 2023",
    logo: "/logos/tsm.png",
    description:
      "Esports analytics internship. Market research and content strategy.",
    highlights: [
      "Led market entry strategy research for Counter-Strike 1 and 2",
      "Led development of three CS 2 videos, reaching 130K views",
    ],
    skills: ["Data Analysis", "Market Research", "Strategy"],
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

const PUBLICATIONS = [
  {
    title: "CrocSort: Resource-Efficient, Skew-Resilient Parallel External Merge Sort",
    authors: ["Riki Otaki*", "Charles Benello*", "Fuheng Zhao", "Aaron J. Elmore", "Goetz Graefe"],
    venue: "PVLDB 19(1), 2026",
    note: "* Equal contribution",
    link: "https://github.com/rotaki/ES",
  },
  {
    title: "Paper Title TBD (2)",
    authors: ["Charles Benello", "et al."],
    venue: "Venue TBD",
    note: "",
    link: "",
  },
  {
    title: "Paper Title TBD (3)",
    authors: ["Charles Benello", "et al."],
    venue: "Venue TBD",
    note: "",
    link: "",
  },
  {
    title: "Paper Title TBD (4)",
    authors: ["Charles Benello", "et al."],
    venue: "Venue TBD",
    note: "",
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
      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.35em] opacity-65 entrance" style={{ animationDelay: "900ms" }}>01 About</p>
          <h1 className="text-5xl font-semibold tracking-tight entrance" style={{ animationDelay: "1050ms" }}>
            Charles Benello
          </h1>
          <div className="space-y-3 text-lg opacity-90 entrance" style={{ animationDelay: "1250ms" }}>
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-90 entrance" style={{ animationDelay: "1500ms" }}>
            {ABOUT_TAGS.map((tag) => (
              <span
                key={tag}
                className="tag rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:col-span-5">
          <div className="border-l-2 pl-5 entrance" style={{ borderColor: "var(--accent-2)", animationDelay: "1250ms" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Education
            </p>
            <div className="mt-4 space-y-4 text-sm opacity-90">
              {EDUCATION.map((item) => (
                <div key={`${item.school}-${item.dates}`}>
                  <p className="text-sm font-semibold">{item.school}</p>
                  {(item.degree || item.field) && (
                    <p className="text-xs uppercase tracking-[0.26em] opacity-70">
                      {formatMetaLine([item.degree, item.field])}
                    </p>
                  )}
                  <p className="text-xs opacity-50">{item.dates}</p>
                  {item.notes ? (
                    <p className="text-xs opacity-50">{item.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="border-l-2 pl-5 entrance" style={{ borderColor: "var(--accent-2)", animationDelay: "1550ms" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Current Research
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {CURRENT_RESEARCH.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
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
            <h2 className="text-2xl font-semibold tracking-tight">Research + Publications</h2>
          </div>
          <p className="max-w-2xl text-lg opacity-90">
            Research in database systems and GPU compression, with publications
            in top-tier venues.
          </p>
        </div>

        <div className="grid gap-8 lg:col-span-6">
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Research Focus
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {RESEARCH_FOCUS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Research Highlights
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {RESEARCH_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l-2 pl-5" style={{ borderColor: "var(--accent-2)" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-65">
              Advisors + Labs
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {ADVISORS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent-3)" }} />
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
                  <p className="text-sm font-semibold leading-snug opacity-90">
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
                  <p className="text-xs leading-relaxed opacity-65">
                    {pub.authors.map((author, i) => (
                      <span key={author + i}>
                        {author.includes("Charles Benello") ? (
                          <strong className="opacity-100">{author}</strong>
                        ) : (
                          author
                        )}
                        {i < pub.authors.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                  <p className="text-xs font-medium opacity-55">{pub.venue}</p>
                  {pub.note && (
                    <p className="text-[10px] uppercase tracking-wide opacity-40">{pub.note}</p>
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
