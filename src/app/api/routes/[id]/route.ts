import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// DELETE /api/routes/[id] — 删除路线
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.from("routes").delete().eq("id", id);
    if (error) {
      console.error("Delete route error:", error);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete route error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// PUT /api/routes/[id] — 更新路线
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;
    const serviceClient = createServiceClient();
    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;

    const { data, error } = await serviceClient
      .from("routes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update route error:", error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
    return NextResponse.json({ route: data });
  } catch (error) {
    console.error("Route PUT error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
