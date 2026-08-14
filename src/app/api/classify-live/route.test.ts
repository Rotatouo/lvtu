// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createClassifyHandler } from "./handler";

function makeRequest(file?: File) {
  const form = new FormData();
  if (file) form.set("file", file);
  return new Request("http://localhost/api/classify-live", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/classify-live", () => {
  it("rejects unsupported files before calling the model", async () => {
    const classify = vi.fn();
    const handler = createClassifyHandler(classify);
    const response = await handler(
      makeRequest(new File(["text"], "note.txt", { type: "text/plain" })),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "FILE_TYPE_UNSUPPORTED",
      message: "仅支持 JPG、PNG、WebP 格式",
    });
    expect(classify).not.toHaveBeenCalled();
  });

  it("returns a live result without persistence", async () => {
    const result = {
      country: "中国",
      region: "广西壮族自治区",
      city: "桂林市",
      attraction: null,
      confidence: "medium" as const,
      evidence: "峰林与水域",
      lat: 25.2,
      lng: 110.4,
      openingNote: null,
    };
    const classify = vi.fn().mockResolvedValue(result);
    const response = await createClassifyHandler(classify)(
      makeRequest(new File([Uint8Array.from([1, 2, 3])], "trip.png", { type: "image/png" })),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mode: "live", result });
    expect(classify).toHaveBeenCalledOnce();
  });

  it("maps model failures to a public error response", async () => {
    const classify = vi.fn().mockRejectedValue({ code: "MODEL_TIMEOUT" });
    const response = await createClassifyHandler(classify)(
      makeRequest(new File([Uint8Array.from([1])], "trip.webp", { type: "image/webp" })),
    );

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      code: "MODEL_TIMEOUT",
      message: "识别等待时间过长，请重试或查看评测记录",
    });
  });
});
