export type Confidence = "high" | "medium" | "low";
export type ReviewDecision = "confirm" | "review" | "manual";

export interface LocationFields {
  country: string | null;
  region: string | null;
  city: string | null;
  attraction: string | null;
}

export interface InferenceResult extends LocationFields {
  confidence: Confidence;
  evidence: string;
  lat: number | null;
  lng: number | null;
  openingNote: string | null;
}

export interface ReplaySample {
  id: `sample-0${1 | 2 | 3 | 4 | 5 | 6}`;
  title: string;
  clueType: "text" | "landmark" | "weak" | "conflict";
  decision: ReviewDecision;
  imageSrc: string;
  imageAlt: string;
  sourceNote: string;
  ai: InferenceResult;
  verified: LocationFields;
}

export interface ReviewableResult {
  id: string;
  mode: "replay" | "live";
  ai: InferenceResult;
  verified: LocationFields;
}

export interface ConfirmedPlace {
  sampleId: string;
  ai: InferenceResult;
  final: LocationFields;
  confirmedAt: string;
}
