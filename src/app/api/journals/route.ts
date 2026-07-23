import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// GET /api/journals — 获取日记列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get("work_id");

    const serviceClient = createServiceClient();

    // 先拿日记
    let query = serviceClient
      .from("travel_journals")
      .select("*")
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

    // 批量获取关联的 works
    const workIds = [...new Set(journals.map((j) => j.work_id))];
    const { data: works } = await serviceClient
      .from("works")
      .select("id, final_attraction, final_city, final_country, final_region, status, image_url, image_thumb")
      .in("id", workIds);

    const workMap = new Map((works || []).map((w) => [w.id, w]));

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

    // 创建日记
    const { data: journal, error: insertError } = await serviceClient
      .from("travel_journals")
      .insert({
        work_id,
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

    // 同步更新 works 状态为 been_there
    const { error: updateError } = await serviceClient
      .from("works")
      .update({ status: "been_there" })
      .eq("id", work_id);

    if (updateError) {
      console.error("Update work status error:", updateError);
    }

    return NextResponse.json({ journal });
  } catch (error) {
    console.error("Journals POST error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
