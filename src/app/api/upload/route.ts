import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// POST /api/upload — 上传文件到 Supabase Storage(不做 AI 分类,不创建作品)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prefix = (formData.get("prefix") as string) || "journals";

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient.storage
      .from("images")
      .upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "上传失败" }, { status: 500 });
    }

    const { data: urlData } = serviceClient.storage
      .from("images")
      .getPublicUrl(filename);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
