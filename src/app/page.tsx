import { AboutSection } from "@/features/portfolio/components/AboutSection";
import { BadcaseSection } from "@/features/evaluation/components/BadcaseSection";
import { EvaluationSection } from "@/features/evaluation/components/EvaluationSection";
import { StabilitySection } from "@/features/evaluation/components/StabilitySection";
import {
  portfolioBadcases,
  portfolioEvidenceCallCount,
  portfolioEvaluationReport,
  portfolioRetestRuns,
} from "@/features/evaluation/portfolio-data";
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
      <FactStrip evidenceCallCount={portfolioEvidenceCallCount} />
      <ExperienceLab samples={replaySamples} />
      <RoleSection />
      <div className="portfolio-band evaluation-evidence-band" id="evaluation">
        <div className="portfolio-shell">
          <EvaluationSection report={portfolioEvaluationReport} />
        </div>
      </div>
      <StabilitySection
        stability={portfolioEvaluationReport.stability}
        repeatRunCount={portfolioEvaluationReport.repeatRunCount}
      />
      <div className="portfolio-band badcase-evidence-band">
        <div className="portfolio-shell">
          <BadcaseSection
            badcases={portfolioBadcases}
            retestRuns={portfolioRetestRuns}
          />
        </div>
      </div>
      <RetrospectiveSection />
      <AboutSection />
    </main>
  );
}
