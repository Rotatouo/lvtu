import type { InferenceResult } from "@/features/portfolio/types";
import {
  DashScopeError,
  type DashScopeErrorCode,
} from "@/lib/dashscope";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

type Classifier = (bytes: ArrayBuffer, mimeType: string) => Promise<InferenceResult>;

const publicErrors: Record<DashScopeErrorCode, { status: number; message: string }> = {
  MODEL_NOT_CONFIGURED: { status: 503, message: "实时识别服务尚未配置，请查看评测记录" },
  MODEL_TIMEOUT: { status: 504, message: "识别等待时间过长，请重试或查看评测记录" },
  MODEL_UPSTREAM_ERROR: { status: 503, message: "模型服务暂时不可用，请重试或查看评测记录" },
  MODEL_RESPONSE_INVALID: { status: 502, message: "模型返回结果无法解析，请查看评测记录" },
};

function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

function isDashScopeCode(value: unknown): value is DashScopeErrorCode {
  return typeof value === "string" && value in publicErrors;
}

export function createClassifyHandler(classify: Classifier) {
  return async function POST(request: Request) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError(400, "FORM_DATA_INVALID", "上传内容无法读取");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError(400, "FILE_REQUIRED", "请选择一张旅行截图");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(400, "FILE_TYPE_UNSUPPORTED", "仅支持 JPG、PNG、WebP 格式");
    }
    if (file.size > MAX_BYTES) {
      return jsonError(400, "FILE_TOO_LARGE", "图片大小不能超过 10MB");
    }

    try {
      const result = await classify(await file.arrayBuffer(), file.type);
      return Response.json({ mode: "live", result });
    } catch (error) {
      const code = error instanceof DashScopeError
        ? error.code
        : isDashScopeCode((error as { code?: unknown })?.code)
          ? (error as { code: DashScopeErrorCode }).code
          : "MODEL_UPSTREAM_ERROR";
      const publicError = publicErrors[code];
      return jsonError(publicError.status, code, publicError.message);
    }
  };
}
