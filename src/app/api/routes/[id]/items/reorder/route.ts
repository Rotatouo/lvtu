import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { readOwnerId } from "@/lib/api";

// PUT /api/routes/[id]/items/reorder — 重排路线内地点
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;
    const body = await request.json();
    const { items } = body as { items: Array<{ id: string; sort_order: number }> };
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "缺少 items" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法操作" },
        { status: 400 }
      );
    }
    // 校验路线归属
    const { data: ownedRoute } = await serviceClient
      .from("routes")
      .select("id")
      .eq("id", routeId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (!ownedRoute) {
      return NextResponse.json(
        { error: "路线不存在或无权操作" },
        { status: 404 }
      );
    }

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
