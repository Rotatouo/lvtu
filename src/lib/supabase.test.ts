// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("can be imported without Supabase configuration", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  const supabaseModule = await import("./supabase");

  expect(supabaseModule.createServiceClient).toBeTypeOf("function");
});

it("checks configuration only when a service client is requested", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const { createServiceClient } = await import("./supabase");

  expect(() => createServiceClient()).toThrow("SUPABASE_NOT_CONFIGURED");
});
