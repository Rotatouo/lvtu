import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// POST /api/works/confirm — 批量确认待识别卡片（is_confirmed = true）
// 供「待确认专区」的「全部确认」按钮使用。
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: unknown = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "缺少 ids" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("works")
      .update({
        is_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids as string[])
      .select();

    if (error) {
      console.error("Confirm error:", error);
      return NextResponse.json({ error: "确认失败" }, { status: 500 });
    }

    return NextResponse.json({ works: data || [] });
  } catch (error) {
    console.error("Works confirm error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
