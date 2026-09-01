import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// POST /api/works/bulk-delete — 批量删除作品（数据库 + Storage 图片）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: unknown = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "缺少 ids" }, { status: 400 });
    }
    // 单张删除走 DELETE /api/works/[id]，这里只处理批量
    if (ids.length === 1) {
      return NextResponse.json({ error: "单张请走单删接口" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 先查图片 URL（删 Storage 用）
    const { data: works } = await supabase
      .from("works")
      .select("id, image_url")
      .in("id", ids as string[]);

    // 删数据库记录
    const { error: deleteError } = await supabase
      .from("works")
      .delete()
      .in("id", ids as string[]);

    if (deleteError) {
      console.error("Bulk delete error:", deleteError);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    // 删 Storage 图片（失败不阻塞，DB 已删，只是留孤儿文件）
    const paths = (works || [])
      .map((w) => w.image_url?.split("/").pop())
      .filter(Boolean)
      .map((name) => `works/${name}`);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove(paths);
      if (storageError) {
        console.error("Bulk delete storage error:", storageError);
      }
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Works bulk delete error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
