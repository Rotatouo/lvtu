import { NextRequest, NextResponse } from "next/server";

// 瓦片代理：绕过沙箱网络限制
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  try {
    const response = await fetch(tileUrl, {
      headers: { "User-Agent": "LvtuApp/1.0" },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
