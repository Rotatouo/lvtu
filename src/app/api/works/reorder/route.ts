import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

interface ReorderItem {
  id: string;
  sort_order: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = body.items as ReorderItem[] | undefined;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "请提供 items 数组 [{id, sort_order}]" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 批量更新
    const updates = items.map((item) =>
      supabase
        .from("works")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error("Reorder errors:", errors.map((e) => e.error));
      return NextResponse.json(
        { error: "部分排序更新失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
