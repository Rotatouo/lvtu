import { describe, expect, it } from "vitest";

import { mockRoutes, mockWorks } from "./mock-data";

describe("public mock data", () => {
  it("does not use excluded locations as AI or confirmed examples", () => {
    const publicLocationFields = mockWorks.flatMap((work) => [
      work.ai_country,
      work.ai_region,
      work.ai_city,
      work.ai_attraction,
      work.final_country,
      work.final_region,
      work.final_city,
      work.final_attraction,
    ]);

    expect(publicLocationFields.join(" ")).not.toMatch(/日本|东京/u);
  });

  it("keeps every route item linked to an existing work", () => {
    const workIds = new Set(mockWorks.map((work) => work.id));

    for (const route of mockRoutes) {
      for (const item of route.items ?? []) {
        expect(workIds.has(item.work_id)).toBe(true);
        expect(item.work?.id).toBe(item.work_id);
      }
    }
  });
});
