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

        <div className="grid gap-4 lg:col-span-5">
          <div className="card rounded-2xl p-5 entrance" style={{ animationDelay: "1250ms" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-90">
              Education
            </p>
            <div className="mt-4 space-y-4 text-sm opacity-90">
              {EDUCATION.map((item) => (
                <div key={`${item.school}-${item.dates}`}>
                  <p className="text-sm font-semibold">{item.school}</p>
                  {(item.degree || item.field) && (
                    <p className="text-xs uppercase tracking-[0.26em] opacity-90">
                      {formatMetaLine([item.degree, item.field])}
                    </p>
                  )}
                  <p className="text-xs opacity-90">{item.dates}</p>
                  {item.notes ? (
                    <p className="text-xs opacity-90">{item.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="card rounded-2xl p-5 entrance" style={{ animationDelay: "1550ms" }}>
            <p className="text-xs uppercase tracking-[0.32em] opacity-90">
              Current Research
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-90 list-disc list-inside">
              {CURRENT_RESEARCH.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ExperienceTimeline entries={EXPERIENCE} />

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-12">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] opacity-65">03 Research + Teaching</p>
            <h2 className="text-2xl font-semibold tracking-tight">Research + Teaching</h2>
          </div>
          <p className="max-w-2xl text-lg opacity-90">
            Research in database systems and GPU compression, plus teaching in
            computer science and mathematics.
          </p>
        </div>

        <div className="grid gap-4 lg:col-span-6">
          <div className="card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-90">
              Research Focus
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-90 list-disc list-inside">
              {RESEARCH_FOCUS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-90">
              Research Highlights
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-90 list-disc list-inside">
              {RESEARCH_HIGHLIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-6">
          <div className="card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-90">
              Teaching
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-90 list-disc list-inside">
              {TEACHING_COURSES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-90">
              Advisors + Labs
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-90 list-disc list-inside">
              {ADVISORS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ProjectsSection data={projectsData} />
    </PageShell>
  );
}
