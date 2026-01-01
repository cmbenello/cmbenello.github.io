import PageShell from "./components/PageShell";

const ABOUT_TAGS = [
  "Research Strategy",
  "Experience Design",
  "Narrative Systems",
  "Cultural Form",
];

const EXPERIENCE_ROLES = [
  {
    title: "Independent Research Designer",
    org: "Freelance / Studio",
    years: "2021-Present",
    summary:
      "Partnering with product teams to translate research into narrative systems and experience direction.",
    focus: ["Research strategy", "Synthesis systems", "Experience design"],
  },
  {
    title: "Design Researcher",
    org: "Product Studio",
    years: "2018-2021",
    summary:
      "Led qualitative studies and service journeys across early-stage and scale-up products.",
    focus: ["Fieldwork", "Journey mapping", "Service design"],
  },
  {
    title: "UX Designer",
    org: "Digital Lab",
    years: "2015-2018",
    summary:
      "Built interaction systems and design libraries for complex, data-heavy tools.",
    focus: ["Design systems", "Prototyping", "Usability testing"],
  },
];

const EXPERIENCE_HIGHLIGHTS = [
  "End-to-end research programs (discovery to synthesis to prototype)",
  "Cross-functional workshops and facilitation",
  "Experience visioning for calm, long-form products",
];

const RESEARCH_FOCUS = [
  "Human-AI collaboration",
  "Cultural symbolism and form",
  "Knowledge mapping and synthesis",
  "Attention, ritual, and calm interfaces",
];

const RESEARCH_METHODS = [
  "Field interviews",
  "Diary studies",
  "Journey mapping",
  "Sensemaking frameworks",
  "Prototype testing",
];

const RESEARCH_OUTPUTS = [
  {
    title: "Linework as Memory",
    type: "Field study",
    year: "2024",
    summary:
      "How line-based motifs influence recall and emotional tone in digital spaces.",
  },
  {
    title: "Pattern Language for Calm UIs",
    type: "Concept report",
    year: "2023",
    summary:
      "A set of interaction patterns designed to reduce cognitive load.",
  },
];

const TEACHING_TOPICS = [
  "Sensemaking frameworks",
  "Storytelling with research",
  "Symbolic form and interface rhythm",
  "Qual methods for small teams",
];

const TEACHING_SESSIONS = [
  {
    title: "Sensemaking for Product Teams",
    format: "Workshop",
    year: "2024",
    summary:
      "Hands-on synthesis practice for turning interviews into actionable themes.",
  },
  {
    title: "Narrative Prototyping",
    format: "Guest lecture",
    year: "2023",
    summary:
      "Building story-led prototypes that align teams around direction and tone.",
  },
];

const PROJECTS = [
  {
    title: "Atlas Research Ops",
    role: "Research Lead",
    year: "2024",
    summary:
      "Built a knowledge map and synthesis workflow for a distributed research team.",
    tags: ["Sensemaking", "Service Design", "Tooling"],
  },
  {
    title: "Signal Archive",
    role: "Product Designer",
    year: "2023",
    summary:
      "Designed an archival product that turns qualitative data into shareable briefs.",
    tags: ["Qual Research", "Data Storytelling", "Prototypes"],
  },
  {
    title: "Ritual Interface",
    role: "Design Researcher",
    year: "2022",
    summary:
      "Explored how ritual and symbolism can shape calm, focused digital experiences.",
    tags: ["Cultural Research", "Interaction", "Visual Language"],
  },
  {
    title: "Pattern Atlas",
    role: "Research Strategist",
    year: "2021",
    summary:
      "Created a visual pattern library to align teams on interaction tone and narrative flow.",
    tags: ["Design Systems", "Pattern Library", "Product Vision"],
  },
];

export default function Home() {
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
          <p className="max-w-xl text-lg opacity-80">
            Research-driven designer focused on narrative systems, calm
            interfaces, and cultural form.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-70">
            {ABOUT_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-current/20 px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Current Focus
            </p>
            <p className="mt-3 text-lg font-semibold">
              Research systems for calm products
            </p>
            <p className="mt-2 text-sm opacity-75">
              Helping teams move from insight to experience through structured
              sensemaking and visual language.
            </p>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Availability
            </p>
            <p className="mt-3 text-lg font-semibold">Independent / Studio</p>
            <p className="mt-2 text-sm opacity-75">
              Open to short engagements, concept explorations, and research
              partnerships.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-12">
          <p className="text-xs uppercase tracking-[0.35em] opacity-55">
            02 Experience
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">Experience</h2>
          <p className="max-w-2xl text-lg opacity-80">
            Research, design, and systems work across product teams and studios.
          </p>
        </div>

        <div className="space-y-4 lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.32em] opacity-60">Roles</p>
          <div className="space-y-4">
            {EXPERIENCE_ROLES.map((role) => (
              <article
                key={role.title}
                className="rounded-2xl border border-current/25 px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold">{role.title}</h3>
                  <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                    {role.org} / {role.years}
                  </span>
                </div>
                <p className="mt-2 text-sm opacity-80">{role.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-65">
                  {role.focus.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-current/20 px-3 py-1"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Experience Highlights
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {EXPERIENCE_HIGHLIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Collaboration
            </p>
            <p className="mt-3 text-sm opacity-80">
              Open to research leadership, concept design, and partnership work
              with teams building knowledge-heavy products.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] opacity-60">
              Focus: calm, information-dense experiences
            </p>
          </div>
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
            A practice centered on cultural form, meaning, and calm systems.
          </p>
        </div>

        <div className="grid gap-4 lg:col-span-6">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Focus Areas
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              {RESEARCH_FOCUS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Methods
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-70">
              {RESEARCH_METHODS.map((method) => (
                <span
                  key={method}
                  className="rounded-full border border-current/20 px-3 py-1"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-6">
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Teaching Topics
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-70">
              {TEACHING_TOPICS.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-current/20 px-3 py-1"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-current/25 p-5">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Formats
            </p>
            <ul className="mt-4 space-y-2 text-sm opacity-80 list-disc list-inside">
              <li>Guest lectures and critiques</li>
              <li>Half-day workshops</li>
              <li>Team intensives</li>
              <li>Mentorship sessions</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-12 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Selected Studies
            </p>
            <div className="space-y-4">
              {RESEARCH_OUTPUTS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-current/25 px-5 py-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                      {item.type} / {item.year}
                    </span>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{item.summary}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] opacity-60">
              Recent Sessions
            </p>
            <div className="space-y-4">
              {TEACHING_SESSIONS.map((session) => (
                <article
                  key={session.title}
                  className="rounded-2xl border border-current/25 px-5 py-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold">{session.title}</h3>
                    <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                      {session.format} / {session.year}
                    </span>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{session.summary}</p>
                </article>
              ))}
            </div>
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
            Selected collaborations across research, design systems, and product
            strategy.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PROJECTS.map((project) => (
            <article
              key={project.title}
              className="rounded-2xl border border-current/25 px-5 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <span className="text-xs uppercase tracking-[0.28em] opacity-55">
                  {project.role} / {project.year}
                </span>
              </div>
              <p className="mt-2 text-sm opacity-80">{project.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] opacity-65">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-current/20 px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
