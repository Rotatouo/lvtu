import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { geocode } from "@/lib/geocode";
import { readOwnerId } from "@/lib/api";
import { proxyImageUrls } from "@/lib/storage";

// GET /api/works — 获取当前设备（owner_id）的所有作品
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const ownerId = readOwnerId(request);
    // 无归属标识（旧客户端 / 直连 curl）：安全侧默认 —— 不返回任何数据
    if (!ownerId) return NextResponse.json({ works: [] });

    const { data: works, error } = await supabase
      .from("works")
      .select("*")
      .eq("owner_id", ownerId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }

    // 浏览器可能无法直连 supabase.co（如国内网络），把图片 URL 转成同域代理
    const proxiedWorks = proxyImageUrls(works || []);
    return NextResponse.json({ works: proxiedWorks });
  } catch (error) {
    console.error("Works GET error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

// POST /api/works — 手动创建作品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, region, city, attraction } = body;

    if (!attraction && !city) {
      return NextResponse.json(
        { error: "请至少填写城市或景点名称" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法保存" },
        { status: 400 }
      );
    }

    // 地理编码
    const geo = await geocode(country, region, city, attraction);

    const { data: work, error } = await supabase
      .from("works")
      .insert({
        owner_id: ownerId,
        final_country: country || null,
        final_region: region || null,
        final_city: city || null,
        final_attraction: attraction || null,
        ai_country: country || null,
        ai_region: region || null,
        ai_city: city || null,
        ai_attraction: attraction || null,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        is_confirmed: true,
        status: "want_to_go",
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    return NextResponse.json({ work });
  } catch (error) {
    console.error("Works POST error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
