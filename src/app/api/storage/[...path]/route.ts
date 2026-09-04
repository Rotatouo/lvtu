import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * GET /api/storage/<bucket>/<...path>
 *
 * 代理 Supabase Storage 文件。用于浏览器无法直连 supabase.co 的场景：
 * 前端请求同域代理地址，服务端用 service role 从 Storage 下载文件后返回。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path || path.length < 2) {
      return new NextResponse("Missing bucket or file path", { status: 400 });
    }

    const [bucket, ...rest] = path;
    const filePath = rest.join("/");

    if (!bucket || !filePath) {
      return new NextResponse("Missing bucket or file path", { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error || !data) {
      console.error("Storage proxy download error:", error);
      return new NextResponse("Not found", { status: 404 });
    }

    const contentType = data.type || "application/octet-stream";
    const bytes = await data.arrayBuffer();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Storage proxy error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
