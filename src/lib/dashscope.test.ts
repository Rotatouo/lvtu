import { describe, expect, it, vi } from "vitest";

import {
  classifyTravelImage,
  DashScopeError,
  parseDashScopeContent,
} from "./dashscope";

describe("parseDashScopeContent", () => {
  it("normalizes a structured model response", () => {
    expect(
      parseDashScopeContent(
        '{"country":"中国","region":"广西壮族自治区","city":"桂林市","attraction":"漓江风景名胜区","confidence":"medium","evidence":"喀斯特峰林与竹筏","lat":25.1631,"lng":110.4305,"opening_note":null}',
      ),
    ).toEqual({
      country: "中国",
      region: "广西壮族自治区",
      city: "桂林市",
      attraction: "漓江风景名胜区",
      confidence: "medium",
      evidence: "喀斯特峰林与竹筏",
      lat: 25.1631,
      lng: 110.4305,
      openingNote: null,
    });
  });

  it("accepts a JSON object wrapped in a Markdown fence", () => {
    const result = parseDashScopeContent(
      '```json\n{"country":"中国","region":null,"city":null,"attraction":null,"confidence":"low","evidence":"没有稳定地标","lat":null,"lng":null,"opening_note":"建议人工补充"}\n```',
    );

    expect(result.confidence).toBe("low");
    expect(result.openingNote).toBe("建议人工补充");
  });

  it("rejects text without a valid result object", () => {
    expect(() => parseDashScopeContent("无法识别")).toThrowError(
      new DashScopeError("MODEL_RESPONSE_INVALID"),
    );
  });
});

describe("classifyTravelImage", () => {
  it("fails before fetch when the service is not configured", async () => {
    const fetcher = vi.fn();

    await expect(
      classifyTravelImage(new ArrayBuffer(2), "image/jpeg", {
        apiKey: "",
        fetcher,
      }),
    ).rejects.toMatchObject({ code: "MODEL_NOT_CONFIGURED" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends a base64 image to qwen-vl-plus and parses the response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content:
                '{"country":"中国","region":"广西壮族自治区","city":"桂林市","attraction":null,"confidence":"medium","evidence":"峰林与水域","lat":25.2,"lng":110.4,"opening_note":null}',
            },
          },
        ],
      }),
    );

    const result = await classifyTravelImage(
      Uint8Array.from([1, 2, 3]).buffer,
      "image/png",
      {
        apiKey: "test-credential",
        fetcher,
      },
    );

    expect(result.city).toBe("桂林市");
    expect(fetcher).toHaveBeenCalledOnce();
    const [, request] = fetcher.mock.calls[0];
    const body = JSON.parse(String(request.body));
    expect(body.model).toBe("qwen-vl-plus");
    expect(body.messages[0].content[0].image_url.url).toBe(
      "data:image/png;base64,AQID",
    );
  });

  it("overrides the request prompt when one is supplied", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content:
                '{"country":null,"region":null,"city":null,"attraction":null,"confidence":"low","evidence":"No unique clue","lat":null,"lng":null,"opening_note":null}',
            },
          },
        ],
      }),
    );

    await classifyTravelImage(new ArrayBuffer(2), "image/webp", {
      apiKey: "test-credential",
      fetcher,
      prompt: "Use only visible evidence. Do not guess.",
    });

    const [, request] = fetcher.mock.calls[0];
    const body = JSON.parse(String(request.body));
    expect(body.messages[0].content[1]).toEqual({
      type: "text",
      text: "Use only visible evidence. Do not guess.",
    });
  });
});
