import { expect, it } from "vitest";

import { upsertConfirmedPlace } from "./session-collection";
import type { ConfirmedPlace } from "./types";

function makeConfirmedPlace(city: string): ConfirmedPlace {
  return {
    sampleId: "sample-test",
    ai: {
      country: "中国",
      region: "广西壮族自治区",
      city: "桂林市",
      attraction: "漓江风景名胜区",
      confidence: "medium",
      evidence: "画面包含喀斯特峰林与水域",
      lat: 25.1631,
      lng: 110.4305,
      openingNote: null,
    },
    final: {
      country: "中国",
      region: "广西壮族自治区",
      city,
      attraction: "漓江风景名胜区",
    },
    confirmedAt: "2026-08-14T00:00:00.000Z",
  };
}

it("replaces a confirmation without mutating the AI result", () => {
  const first = makeConfirmedPlace("桂林市");
  const next = upsertConfirmedPlace(
    [first],
    { ...first, final: { ...first.final, city: "阳朔县" } },
  );

  expect(next).toHaveLength(1);
  expect(next[0].final.city).toBe("阳朔县");
  expect(next[0].ai.city).toBe("桂林市");
  expect(first.final.city).toBe("桂林市");
});
