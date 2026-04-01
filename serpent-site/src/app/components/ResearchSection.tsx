import { RESEARCH_FOCUS, RESEARCH_HIGHLIGHTS, PUBLICATIONS, ADVISORS } from "../data/page-data";

export default function ResearchSection() {
  return (
    <section className="relative z-0 grid gap-10 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-12 entrance" style={{ animationDelay: "900ms" }}>
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Research + Publications</h2>
        </div>
      </div>

      <div className="grid gap-8 lg:col-span-6 entrance" style={{ animationDelay: "1200ms" }}>
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

      <div className="grid gap-8 lg:col-span-6 entrance" style={{ animationDelay: "1500ms" }}>
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
  );
}
