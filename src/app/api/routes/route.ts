import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { readOwnerId } from "@/lib/api";

// GET /api/routes — 获取当前设备的所有路线(含 items + works)
export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) return NextResponse.json({ routes: [] });

    // 拿当前设备的路线
    const { data: routes, error: routeErr } = await serviceClient
      .from("routes")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });

    if (routeErr) {
      console.error("Fetch routes error:", routeErr);
      return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }

    if (!routes || routes.length === 0) {
      return NextResponse.json({ routes: [] });
    }

    // 只拿这些路线的 items
    const routeIds = routes.map((r) => r.id);
    const { data: allItems, error: itemErr } = await serviceClient
      .from("route_items")
      .select("*")
      .in("route_id", routeIds)
      .order("sort_order", { ascending: true });

    if (itemErr) {
      console.error("Fetch items error:", itemErr);
      return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }

    // 批量拿关联 works
    const workIds = [...new Set((allItems || []).map((i) => i.work_id))];
    let workMap = new Map();
    if (workIds.length > 0) {
      const { data: works } = await serviceClient
        .from("works")
        .select("id, final_attraction, final_city, final_country, lat, lng, status, image_url, image_thumb")
        .in("id", workIds);
      (works || []).forEach((w) => workMap.set(w.id, w));
    }

    // 组装
    const itemMap = new Map<string, typeof allItems>();
    (allItems || []).forEach((item) => {
      if (!itemMap.has(item.route_id)) itemMap.set(item.route_id, []);
      itemMap.get(item.route_id)!.push(item);
    });

    const routesWithItems = routes.map((r) => ({
      ...r,
      items: (itemMap.get(r.id) || []).map((item) => ({
        ...item,
        work: workMap.get(item.work_id) || null,
      })),
    }));

    return NextResponse.json({ routes: routesWithItems });
  } catch (error) {
    console.error("Routes GET error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/routes — 创建路线
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;
    if (!name) {
      return NextResponse.json({ error: "缺少 name" }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法操作" },
        { status: 400 }
      );
    }

    const { data, error } = await serviceClient
      .from("routes")
      .insert({
        name: name.trim(),
        color: color || "#60a5fa",
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) {
      console.error("Create route error:", error);
      return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }

    return NextResponse.json({ route: data });
  } catch (error) {
    console.error("Routes POST error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
