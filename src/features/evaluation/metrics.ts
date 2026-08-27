import type { ClueTier, ExpectedDecision, ExpectedLocation } from "./types";

export type LocationField = keyof ExpectedLocation;
export type Confidence = "high" | "medium" | "low";

export interface EvaluationMetricSample {
  id: string;
  clueTier: ClueTier;
  expected: ExpectedLocation;
  actual: ExpectedLocation;
  expectedDecision: ExpectedDecision;
  decision: ExpectedDecision;
  confidence: Confidence;
}

export interface FieldMetric {
  correct: number;
  total: number;
  rate: number;
}

export type FieldMetrics = Record<LocationField, FieldMetric>;

export interface DecisionMetric {
  count: number;
  total: number;
  rate: number;
}

export type DecisionMetrics = Record<ExpectedDecision, DecisionMetric>;

export interface TierMetrics {
  sampleCount: number;
  fields: FieldMetrics;
  decisions: DecisionMetrics;
}

export interface EvaluationReport extends TierMetrics {
  tiers: Record<ClueTier, TierMetrics>;
  badcaseIds: string[];
}

const LOCATION_FIELDS: readonly LocationField[] = [
  "country",
  "region",
  "city",
  "attraction",
];

const CLUE_TIERS: readonly ClueTier[] = ["text", "landmark", "weak"];
const DECISIONS: readonly ExpectedDecision[] = ["confirm", "review", "manual"];

const COUNTRY_ALIASES = new Map<string, string>([
  ["中国", "中国"],
  ["China", "中国"],
  ["中华人民共和国", "中国"],
]);

const BEIJING_ALIASES = new Map<string, string>([
  ["北京", "北京"],
  ["Beijing", "北京"],
  ["北京市", "北京"],
]);

function normalizeLocationValue(
  field: LocationField,
  value: string | null
): string | null {
  if (value === null) return null;

  const trimmed = value.trim();

  if (field === "country") {
    return COUNTRY_ALIASES.get(trimmed) ?? trimmed;
  }

  if (field === "region") {
    const alias = BEIJING_ALIASES.get(trimmed);
    if (alias) return alias;

    return trimmed.replace(
      /(?:壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/u,
      ""
    );
  }

  if (field === "city") {
    const alias = BEIJING_ALIASES.get(trimmed);
    if (alias) return alias;

    return trimmed.replace(/(?:自治州|地区|市)$/u, "");
  }

  return trimmed;
}

function valuesMatch(
  field: LocationField,
  expected: string | null,
  actual: string | null
): boolean {
  if (expected === null || actual === null) {
    return expected === actual;
  }

  return (
    normalizeLocationValue(field, expected) ===
    normalizeLocationValue(field, actual)
  );
}

function hasMismatch(sample: EvaluationMetricSample): boolean {
  return (
    sample.decision !== sample.expectedDecision ||
    LOCATION_FIELDS.some(
      (field) => !valuesMatch(field, sample.expected[field], sample.actual[field])
    )
  );
}

function aggregate(samples: readonly EvaluationMetricSample[]): TierMetrics {
  const total = samples.length;
  const fields = Object.fromEntries(
    LOCATION_FIELDS.map((field) => {
      const correct = samples.filter((sample) =>
        valuesMatch(field, sample.expected[field], sample.actual[field])
      ).length;

      return [field, { correct, total, rate: total === 0 ? 0 : correct / total }];
    })
  ) as FieldMetrics;

  const decisions = Object.fromEntries(
    DECISIONS.map((decision) => {
      const count = samples.filter((sample) => sample.decision === decision).length;
      return [decision, { count, total, rate: total === 0 ? 0 : count / total }];
    })
  ) as DecisionMetrics;

  return { sampleCount: total, fields, decisions };
}

export function calculateMetrics(
  samples: readonly EvaluationMetricSample[]
): EvaluationReport {
  const overall = aggregate(samples);
  const tiers = Object.fromEntries(
    CLUE_TIERS.map((tier) => [
      tier,
      aggregate(samples.filter((sample) => sample.clueTier === tier)),
    ])
  ) as Record<ClueTier, TierMetrics>;

  return {
    ...overall,
    tiers,
    badcaseIds: samples.filter(hasMismatch).map((sample) => sample.id),
  };
}
