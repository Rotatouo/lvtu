import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { classifyImage } from "@/lib/gemini";
import { geocode } from "@/lib/geocode";
import { v4 as uuidv4 } from "uuid";
import { readOwnerId } from "@/lib/api";
import { toStorageProxyUrl } from "@/lib/storage";

// 超时要配套改两层，只改一层无效：
//   平台层 —— 不设会被 Vercel 默认上限掐断（服务端函数默认 10s）
//   代码层 —— src/lib/gemini.ts 里的 AbortSignal.timeout(45s)，要严格小于这里
//            （留 15s 给 Supabase 上传和冷启动），否则拿不到可读的 JSON 错误
export const maxDuration = 60;

/**
 * 给任意 Promise 套一层硬超时，到点即 reject，并清掉定时器。
 *
 * 为什么需要：整条链路原本只有 DashScope（45s，见 lib/gemini.ts）和
 * geocode（8s，见 lib/geocode.ts）有超时，Supabase Storage 上传是唯一
 * 没有保护的一环。上传一卡住就会与 AI 的 45s 叠加，把总耗时顶过平台层
 * 60s 上限 —— 被平台掐断后返回的是 HTML 错误页（不是 JSON），前端
 * res.json() 会炸成 "Unexpected token 'A'"，用户只看到莫名其妙的失败。
 * 加了超时后，异常会变成一条可读的中文错误快速返回，而不是干等一分钟。
 */
function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  // 用 PromiseLike 而非 Promise：Supabase 的查询构造器是 thenable（可 await）
  // 但类型上并非 Promise。Promise.resolve 既能把它转成真 Promise，
  // 也会立刻触发查询执行（Supabase 查询是惰性的，await 时才真正发请求）。
  return Promise.race([Promise.resolve(promise), guard]).finally(() =>
    clearTimeout(timer)
  );
}

export async function POST(request: NextRequest) {
  try {
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法保存" },
        { status: 400 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    // 前端压缩后会把文件名改成 upload-<时间戳>.jpg，原始文件名得单独传过来，
    // 否则下面按文件名做的重复检测永远命中不了。
    const originalName =
      (formData.get("originalName") as string | null) || file.name || "";

    // 检查文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WebP 格式" },
        { status: 400 }
      );
    }

    // 检查文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件过大，请压缩后重试" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    // 生成唯一文件名
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `works/${fileName}`;

    // 重复检测：检查原始文件名是否已存在。
    // 这只是辅助功能，卡住时不值得拖垮整条链路 —— 超时就跳过，照常上传。
    let duplicateId: string | null = null;
    if (originalName) {
      const nameWithoutExt = originalName.replace(/\.[^.]+$/, "");
      try {
        const { data: existing } = await withTimeout(
          supabase
            .from("works")
            .select("id, image_url")
            .eq("owner_id", ownerId)
            .or(`image_url.ilike.%${nameWithoutExt}%`)
            .limit(1),
          3_000,
          "duplicate-check-timeout"
        );
        if (existing && existing.length > 0) {
          duplicateId = existing[0].id;
        }
      } catch {
        // 查重超时/失败不阻塞上传：宁可偶尔多存一条，也好过整张图传失败
      }
    }

    // 上传到 Supabase Storage。
    // 8s 对「服务端 → Supabase」绰绰有余（两者同在国外，正常 <2s），但能在异常
    // 卡住时快速失败 —— 否则会与 AI 的 45s 叠加，顶穿平台层 60s 上限。
    const UPLOAD_TIMEOUT_MS = 8_000;
    const { error: uploadError } = await withTimeout(
      supabase.storage.from("images").upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      }),
      UPLOAD_TIMEOUT_MS,
      "图片上传超时，请重试"
    );

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // 插入作品记录（初始状态）
    const { data: work, error: insertError } = await supabase
      .from("works")
      .insert({
        image_url: imageUrl,
        owner_id: ownerId,
        status: "want_to_go",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    // 异步启动 AI 分类（不阻塞响应）
    // 转 base64 用于 AI
    const base64 = buffer.toString("base64");

    // 记录 AI 耗时：超时、API 报错、返回空，三种失败靠耗时和 message 才能区分
    const aiStartedAt = Date.now();

    try {
      const classification = await classifyImage(base64, file.type);
      const aiElapsedMs = Date.now() - aiStartedAt;

      // 地理编码：AI 没给坐标就用 Nominatim 查
      let { lat, lng } = classification;
      if (lat == null || lng == null) {
        const geo = await geocode(
          classification.country,
          classification.region,
          classification.city,
          classification.attraction
        );
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }

      // 更新分类结果（含坐标 + 百科备注）
      await supabase
        .from("works")
        .update({
          ai_country: classification.country,
          ai_region: classification.region,
          ai_city: classification.city,
          ai_attraction: classification.attraction,
          final_country: classification.country,
          final_region: classification.region,
          final_city: classification.city,
          final_attraction: classification.attraction,
          lat,
          lng,
          opening_note: classification.opening_note,
        })
        .eq("id", work.id);

      const resp: Record<string, unknown> = {
        work: {
          ...work,
          ai_country: classification.country,
          ai_region: classification.region,
          ai_city: classification.city,
          ai_attraction: classification.attraction,
          final_country: classification.country,
          final_region: classification.region,
          final_city: classification.city,
          final_attraction: classification.attraction,
          lat,
          lng,
          opening_note: classification.opening_note,
        },
        classification,
        ai_elapsed_ms: aiElapsedMs,
      };

      if (duplicateId) {
        resp.duplicate = true;
        resp.duplicate_id = duplicateId;
      }

      return NextResponse.json(resp);
    } catch (aiError) {
      const aiElapsedMs = Date.now() - aiStartedAt;
      const aiMessage =
        aiError instanceof Error ? aiError.message : String(aiError);
      console.error("AI classification error:", aiMessage, {
        ms: aiElapsedMs,
        bytes: buffer.length,
        b64: base64.length,
        mime: file.type,
      });
      // AI 失败但图片已保存，返回部分结果。
      // ai_error 必须回传给前端：否则错误只躺在服务端日志里，UI 还会谎报"成功"。
      const failResp: Record<string, unknown> = {
        work: { ...work, image_url: toStorageProxyUrl(work.image_url) },
        classification: null,
        ai_error: aiMessage,
        ai_elapsed_ms: aiElapsedMs,
        warning: "地点识别失败，请手动分类",
      };
      if (duplicateId) {
        failResp.duplicate = true;
        failResp.duplicate_id = duplicateId;
      }
      return NextResponse.json(failResp);
    }
  } catch (error) {
    console.error("Classify error:", error);
    const message =
      error instanceof Error ? error.message : "服务器错误，请稍后重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
