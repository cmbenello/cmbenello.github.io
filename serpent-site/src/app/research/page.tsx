import PageShell from "../components/PageShell";
import ExperienceTimeline from "../components/ExperienceTimeline";
import ProjectsSection from "../components/ProjectsSection";
import AboutSection from "../components/AboutSection";
import ResearchSection from "../components/ResearchSection";
import projectsData from "../../content/projects-data.json";
import { EXPERIENCE } from "../data/page-data";

export default function Research() {
  return (
    <PageShell>
      <AboutSection />
      <ResearchSection />
      <ExperienceTimeline entries={EXPERIENCE} />
      <ProjectsSection data={projectsData} />
    </PageShell>
  );
}
