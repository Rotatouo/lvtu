import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { readOwnerId } from "@/lib/api";
import { signImageUrls } from "@/lib/storage";

// GET /api/journals — 获取日记列表（仅当前设备）
export async function GET(request: NextRequest) {
  try {
    const ownerId = readOwnerId(request);
    if (!ownerId) return NextResponse.json({ journals: [] });

    const { searchParams } = new URL(request.url);
    const workId = searchParams.get("work_id");

    const serviceClient = createServiceClient();

    // 先拿日记
    let query = serviceClient
      .from("travel_journals")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (workId) {
      query = query.eq("work_id", workId);
    }

    const { data: journals, error } = await query;

    if (error) {
      console.error("Fetch journals error:", error);
      return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }

    if (!journals || journals.length === 0) {
      return NextResponse.json({ journals: [] });
    }

    // 批量获取关联的 works（签临时直链，避免 Storage 桶未公开时前端 403）
    const workIds = [...new Set(journals.map((j) => j.work_id))];
    const { data: works } = await serviceClient
      .from("works")
      .select("id, final_attraction, final_city, final_country, final_region, status, image_url, image_thumb")
      .in("id", workIds);

    const signedWorks = await signImageUrls(works || []);
    const workMap = new Map(signedWorks.map((w) => [w.id, w]));

    const journalsWithWorks = journals.map((j) => ({
      ...j,
      works: workMap.get(j.work_id) || null,
    }));

    return NextResponse.json({ journals: journalsWithWorks });
  } catch (error) {
    console.error("Journals GET error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/journals — 创建日记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { work_id, content, quote, photo_url, visited_at } = body;

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

    // 创建日记
    const { data: journal, error: insertError } = await serviceClient
      .from("travel_journals")
      .insert({
        work_id,
        owner_id: ownerId,
        content: content || "",
        quote: quote || null,
        photo_url: photo_url || null,
        visited_at: visited_at || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert journal error:", insertError);
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    // 同步更新 works 状态为 been_there（带归属校验：只能改自己的卡片）
    const { error: updateError } = await serviceClient
      .from("works")
      .update({ status: "been_there" })
      .eq("id", work_id)
      .eq("owner_id", ownerId);

    if (updateError) {
      console.error("Update work status error:", updateError);
    }

    return NextResponse.json({ journal });
  } catch (error) {
    console.error("Journals POST error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
