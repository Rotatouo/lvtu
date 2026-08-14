import { AboutSection } from "@/features/portfolio/components/AboutSection";
import { EvaluationPreview } from "@/features/portfolio/components/EvaluationPreview";
import { ExperienceLab } from "@/features/portfolio/components/ExperienceLab";
import { FactStrip } from "@/features/portfolio/components/FactStrip";
import { PortfolioHero } from "@/features/portfolio/components/PortfolioHero";
import { PortfolioNav } from "@/features/portfolio/components/PortfolioNav";
import { RetrospectiveSection } from "@/features/portfolio/components/RetrospectiveSection";
import { RoleSection } from "@/features/portfolio/components/RoleSection";
import { replaySamples } from "@/features/portfolio/replay-samples";

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#experience">跳到核心体验</a>
      <PortfolioNav />
      <PortfolioHero />
      <FactStrip />
      <ExperienceLab samples={replaySamples} />
      <RoleSection />
      <EvaluationPreview />
      <RetrospectiveSection />
      <AboutSection />
    </main>
  );
}
