import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { readOwnerId } from "@/lib/api";

// PUT /api/journals/[id] — 编辑日记
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, quote, photo_url, visited_at } = body;

    const serviceClient = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法操作" },
        { status: 400 }
      );
    }

    const { data, error } = await serviceClient
      .from("travel_journals")
      .update({
        content: content ?? "",
        quote: quote ?? null,
        photo_url: photo_url ?? null,
        visited_at: visited_at ?? null,
      })
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .single();

    if (error) {
      console.error("Update journal error:", error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({ journal: data });
  } catch (error) {
    console.error("Journals PUT error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// DELETE /api/journals/[id] — 删除日记
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const serviceClient = createServiceClient();
    const ownerId = readOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: "缺少设备标识，无法操作" },
        { status: 400 }
      );
    }

    const { error } = await serviceClient
      .from("travel_journals")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);

    if (error) {
      console.error("Delete journal error:", error);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Journals DELETE error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
