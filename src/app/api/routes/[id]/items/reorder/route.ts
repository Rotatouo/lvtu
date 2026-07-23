import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// PUT /api/routes/[id]/items/reorder — 重排路线内地点
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // keep route id context
    const body = await request.json();
    const { items } = body as { items: Array<{ id: string; sort_order: number }> };
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "缺少 items" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    for (const item of items) {
      await serviceClient
        .from("route_items")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
