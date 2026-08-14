export type ClueTier = "text" | "landmark" | "weak";
export type ExpectedDecision = "confirm" | "review" | "manual";
export type EvaluationId = `eval-${string}`;

export interface ExpectedLocation {
  country: string | null;
  region: string | null;
  city: string | null;
  attraction: string | null;
}

export interface EvaluationSample {
  id: EvaluationId;
  imagePath: string;
  clueTier: ClueTier;
  sourceNote: string;
  expected: ExpectedLocation;
  expectedDecision: ExpectedDecision;
  verificationNote: string;
}

export type EvaluationManifest = EvaluationSample[];
