import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { geocode } from "@/lib/geocode";

// PUT /api/works/[id] — 更新作品分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { country, region, city, attraction, notes, status, is_confirmed } = body;

    // 构建更新对象（只更新传入的字段）
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (country !== undefined) updates.final_country = country || null;
    if (region !== undefined) updates.final_region = region || null;
    if (city !== undefined) updates.final_city = city || null;
    if (attraction !== undefined) updates.final_attraction = attraction || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (status !== undefined) updates.status = status;
    // 「确认」操作：只标记已确认、不改分类字段 —— 不触发 geocode，也不改坐标
    if (is_confirmed !== undefined) updates.is_confirmed = !!is_confirmed;
    // 分类字段被修改时才标记为已确认 + 重新 geocode
    if (country !== undefined || region !== undefined || city !== undefined || attraction !== undefined) {
      updates.is_confirmed = true;

      // 用新值 geocode
      const geo = await geocode(
        country ?? null,
        region ?? null,
        city ?? null,
        attraction ?? null
      );
      if (geo) {
        updates.lat = geo.lat;
        updates.lng = geo.lng;
      }
    }

    const supabase = createServiceClient();
    const { data: work, error } = await supabase
      .from("works")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({ work });
  } catch (error) {
    console.error("Works PUT error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

// DELETE /api/works/[id] — 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // 先查作品获取图片 URL
    const { data: work } = await supabase
      .from("works")
      .select("image_url")
      .eq("id", id)
      .single();

    // 删除数据库记录
    const { error } = await supabase.from("works").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    // 尝试删除 Storage 中的图片
    if (work?.image_url) {
      const urlParts = work.image_url.split("/");
      const filePath = `works/${urlParts[urlParts.length - 1]}`;
      await supabase.storage.from("images").remove([filePath]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Works DELETE error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
