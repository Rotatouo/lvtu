import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { readOwnerId } from "@/lib/api";
import { classifyImage } from "@/lib/gemini";
import { geocode } from "@/lib/geocode";
import { parseStoragePublicUrl } from "@/lib/storage";

// 单张识别最长 45s（DASHSCOPE_TIMEOUT_MS），这里给 60s 平台上限。
// 一次请求只处理少量卡片，由前端分批循环，避免整批撞上限被掐断。
export const maxDuration = 60;

/** 单次请求最多处理几张（前端分批，别调大） */
const MAX_PER_REQUEST = 3;

function mimeFromPath(p: string): string {
  const ext = p.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * POST /api/works/reclassify — 对已有的卡片重跑一次 AI 识别，补全州/省与城市。
 *
 * 用途：早期提示词写死「中国必须填省份(region);其他可选」，导致国外卡片只有
 * 国家 + 景点名，中间 region/city 为空。提示词修好只影响新图，存量靠这里补。
 *
 * 为什么让前端传 ids 而不是后端自己筛「region/city 为空」：
 * 识别失败或 AI 仍然给不出 region 时，该卡片会继续命中筛选条件 → 前端循环
 * 会永远跑不完。由前端拿着全量列表显式传入要处理的 id，天然不会死循环。
 */
export async function POST(request: NextRequest) {
  try {
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法操作" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "缺少 ids" }, { status: 400 });
    }

    const batch = ids.slice(0, MAX_PER_REQUEST);
    const supabase = createServiceClient();

    const results: Array<{
      id: string;
      ok: boolean;
      error?: string;
      region?: string | null;
      city?: string | null;
    }> = [];

    for (const id of batch) {
      try {
        // 带 owner 校验：不是自己的卡片查不到，也就改不了
        const { data: work, error: selErr } = await supabase
          .from("works")
          .select("id, image_url")
          .eq("id", id)
          .eq("owner_id", ownerId)
          .single();

        if (selErr || !work) {
          results.push({ id, ok: false, error: "卡片不存在或无权操作" });
          continue;
        }

        const parsed = work.image_url
          ? parseStoragePublicUrl(work.image_url)
          : null;
        if (!parsed) {
          results.push({ id, ok: false, error: "图片地址无法解析" });
          continue;
        }

        // 服务端取图：浏览器直连 supabase.co 会被墙，服务端可以
        const { data: blob, error: dlErr } = await supabase.storage
          .from(parsed.bucket)
          .download(parsed.path);

        if (dlErr || !blob) {
          results.push({ id, ok: false, error: "图片下载失败" });
          continue;
        }

        const buf = Buffer.from(await blob.arrayBuffer());
        const classification = await classifyImage(
          buf.toString("base64"),
          mimeFromPath(parsed.path)
        );

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

        const { error: upErr } = await supabase
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
          .eq("id", id)
          .eq("owner_id", ownerId);

        if (upErr) {
          results.push({ id, ok: false, error: "写回失败" });
          continue;
        }

        results.push({
          id,
          ok: true,
          region: classification.region,
          city: classification.city,
        });
      } catch (e) {
        results.push({
          id,
          ok: false,
          error: e instanceof Error ? e.message : "识别失败",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Reclassify error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
