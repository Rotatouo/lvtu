// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

it("can be imported without Supabase configuration", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  const route = await import("./route");

  expect(route.POST).toBeTypeOf("function");
});

it("uses the same stateless handler as the live classification endpoint", async () => {
  const legacyRoute = await import("./route");
  const liveRoute = await import("../classify-live/route");

  expect(legacyRoute.POST).toBe(liveRoute.POST);
});

it("exposes the stateless public response contract on the legacy path", async () => {
  const { POST } = await import("./route");
  const form = new FormData();
  form.set("file", new File(["text"], "note.txt", { type: "text/plain" }));

  const response = await POST(
    new Request("http://localhost/api/classify", { method: "POST", body: form }),
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    code: "FILE_TYPE_UNSUPPORTED",
    message: "仅支持 JPG、PNG、WebP 格式",
  });
});
