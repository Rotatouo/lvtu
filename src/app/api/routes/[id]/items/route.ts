import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { readOwnerId } from "@/lib/api";

// POST /api/routes/[id]/items — 添加地点到路线
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;
    const body = await request.json();
    const { work_id } = body;
    if (!work_id) {
      return NextResponse.json({ error: "缺少 work_id" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法操作" },
        { status: 400 }
      );
    }
    // 校验路线归属：不是自己的路线不能往里加地点
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

    // 获取当前最大 sort_order
    const { data: existing } = await serviceClient
      .from("route_items")
      .select("sort_order")
      .eq("route_id", routeId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await serviceClient
      .from("route_items")
      .upsert({ route_id: routeId, work_id, sort_order: nextOrder }, { onConflict: "route_id,work_id" })
      .select()
      .single();

    if (error) {
      console.error("Add item error:", error);
      return NextResponse.json({ error: "添加失败" }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Items POST error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// DELETE /api/routes/[id]/items — 从路线移除地点
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get("work_id");
    if (!workId) {
      return NextResponse.json({ error: "缺少 work_id" }, { status: 400 });
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

    const { error } = await serviceClient
      .from("route_items")
      .delete()
      .eq("route_id", routeId)
      .eq("work_id", workId);

    if (error) {
      console.error("Remove item error:", error);
      return NextResponse.json({ error: "移除失败" }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Items DELETE error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
