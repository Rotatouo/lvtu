import type { Confidence, InferenceResult } from "@/features/portfolio/types";

export type DashScopeErrorCode =
  | "MODEL_NOT_CONFIGURED"
  | "MODEL_TIMEOUT"
  | "MODEL_UPSTREAM_ERROR"
  | "MODEL_RESPONSE_INVALID";

export class DashScopeError extends Error {
  constructor(public readonly code: DashScopeErrorCode) {
    super(code);
    this.name = "DashScopeError";
  }
}

interface ClassifyOptions {
  apiKey?: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
  prompt?: string;
  signal?: AbortSignal;
}

interface DashScopeResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
}

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
// 海外运行时（如 Vercel）访问国内 DashScope 节点通常需要 25~40 秒，
// 原先 20 秒的硬超时会把它掐断。默认放宽到 60 秒，可用环境变量覆盖。
const CLASSIFY_TIMEOUT_MS = Number(process.env.DASHSCOPE_TIMEOUT_MS ?? 60_000);
const CONFIDENCE_VALUES = new Set<Confidence>(["high", "medium", "low"]);

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractJsonObject(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced ?? content).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new DashScopeError("MODEL_RESPONSE_INVALID");
  return candidate.slice(start, end + 1);
}

export function parseDashScopeContent(content: string): InferenceResult {
  try {
    const value = JSON.parse(extractJsonObject(content)) as Record<string, unknown>;
    const confidence = value.confidence;
    const evidence = nullableString(value.evidence);
    if (!CONFIDENCE_VALUES.has(confidence as Confidence) || !evidence) {
      throw new DashScopeError("MODEL_RESPONSE_INVALID");
    }

    return {
      country: nullableString(value.country),
      region: nullableString(value.region),
      city: nullableString(value.city),
      attraction: nullableString(value.attraction),
      confidence: confidence as Confidence,
      evidence,
      lat: nullableNumber(value.lat),
      lng: nullableNumber(value.lng),
      openingNote: nullableString(value.opening_note),
    };
  } catch (error) {
    if (error instanceof DashScopeError) throw error;
    throw new DashScopeError("MODEL_RESPONSE_INVALID");
  }
}

export async function classifyTravelImage(
  bytes: ArrayBuffer,
  mimeType: string,
  options: ClassifyOptions = {},
): Promise<InferenceResult> {
  const BUILTIN_FALLBACK_KEY =
    "sk-ws-H.EXIXMYL.JlWE.MEQCICcUVDl1_CjrjM7OgSfH3LnmxmN0SRTpndsqyMVI5xAAAiB_9Do2-qULanyijumVUso9KuZK8nuXrvBxW-hE89T-AA";
  const apiKey = options.apiKey ?? process.env.DASHSCOPE_API_KEY ?? BUILTIN_FALLBACK_KEY;
  if (!apiKey) throw new DashScopeError("MODEL_NOT_CONFIGURED");

  const fetcher = options.fetcher ?? fetch;
  const baseUrl = (options.baseUrl ?? process.env.DASHSCOPE_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const imageUrl = `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;

  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-vl-plus",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              {
                type: "text",
                text:
                  options.prompt ??
                  "识别这张旅行图片的地点。只返回 JSON，字段为 country、region、city、attraction、confidence(high|medium|low)、evidence、lat、lng、opening_note。没有可靠依据的字段返回 null，不要猜测。",
              },
            ],
          },
        ],
        temperature: 0,
      }),
      signal: options.signal ?? AbortSignal.timeout(CLASSIFY_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new DashScopeError("MODEL_TIMEOUT");
    }
    throw new DashScopeError("MODEL_UPSTREAM_ERROR");
  }

  if (!response.ok) throw new DashScopeError("MODEL_UPSTREAM_ERROR");

  let payload: DashScopeResponse;
  try {
    payload = (await response.json()) as DashScopeResponse;
  } catch {
    throw new DashScopeError("MODEL_RESPONSE_INVALID");
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new DashScopeError("MODEL_RESPONSE_INVALID");
  }
  return parseDashScopeContent(content);
}
