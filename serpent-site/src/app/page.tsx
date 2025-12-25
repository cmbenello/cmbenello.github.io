import PageShell from "./components/PageShell";

export default function Home() {
  return (
    <PageShell>
      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] opacity-55">01 Work</p>
        <h1 className="text-5xl font-semibold tracking-tight">Charles Benello</h1>
        <p className="text-lg opacity-80">
          WIP personal website. Selected projects, case studies, and experiments.
        </p>
        <div className="h-px w-16 bg-current opacity-25" />
      </div>

      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] opacity-55">02 Research</p>
        <h2 className="text-4xl font-semibold tracking-tight">Research</h2>
        <p className="text-lg opacity-80">
          Notes, studies, and references that inform the visual system.
        </p>
        <div className="h-px w-16 bg-current opacity-25" />
      </div>

      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] opacity-55">03 Tattoo</p>
        <h2 className="text-4xl font-semibold tracking-tight">Tattoo</h2>
        <p className="text-lg opacity-80">
          Flash, references, and collaborations in progress.
        </p>
        <div className="h-px w-16 bg-current opacity-25" />
      </div>

      <div className="space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] opacity-55">04 Elements</p>
        <h2 className="text-4xl font-semibold tracking-tight">Elements</h2>
        <p className="text-lg opacity-80">
          Four elements explorations and sketches.
        </p>
        <div className="h-px w-16 bg-current opacity-25" />
      </div>
    </PageShell>
  );
}
