import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { classifyImage } from "@/lib/gemini";
import { geocode } from "@/lib/geocode";
import { v4 as uuidv4 } from "uuid";

// 平台层超时：不设会被 Vercel 默认上限掐断（服务端函数默认 10s）
// 代码层不设 fetch 超时，让慢网/冷启动能跑完
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

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

    // 重复检测：检查原始文件名是否已存在
    const originalName = file.name;
    let duplicateId: string | null = null;
    if (originalName) {
      const nameWithoutExt = originalName.replace(/\.[^.]+$/, "");
      const { data: existing } = await supabase
        .from("works")
        .select("id, image_url")
        .or(`image_url.ilike.%${nameWithoutExt}%`)
        .limit(1);
      if (existing && existing.length > 0) {
        duplicateId = existing[0].id;
      }
    }

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

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

    try {
      const classification = await classifyImage(base64, file.type);

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
      };

      if (duplicateId) {
        resp.duplicate = true;
        resp.duplicate_id = duplicateId;
      }

      return NextResponse.json(resp);
    } catch (aiError) {
      console.error("AI classification error:", aiError);
      // AI 失败但图片已保存，返回部分结果
      const failResp: Record<string, unknown> = {
        work,
        classification: null,
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
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
