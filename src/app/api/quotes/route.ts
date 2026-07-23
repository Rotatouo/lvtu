import { NextRequest, NextResponse } from "next/server";

const DASHSCOPE_API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

function buildPrompt(attraction: string, city: string, country: string): string {
  const place = [attraction, city, country].filter(Boolean).join("，");
  return `请为"${place}"生成 3 条文艺风格的旅行感悟句子。每条 15-30 字，有文学感但不矫情，像是一位作家路过此地会写下的句子。直接返回 JSON 数组格式：["句子1","句子2","句子3"]，不要任何其他内容。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attraction, city, country } = body;

    if (!attraction && !city) {
      return NextResponse.json(
        { error: "请至少提供景点或城市名称" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "生成失败" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(
      attraction || "",
      city || "",
      country || ""
    );

    const response = await fetch(DASHSCOPE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      console.error("Quotes API error:", response.status);
      return NextResponse.json(
        { error: "生成失败" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // 提取 JSON 数组
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error("Quotes parse error: no array found in", text);
      return NextResponse.json(
        { error: "生成失败" },
        { status: 500 }
      );
    }

    try {
      const quotes = JSON.parse(match[0]);
      if (!Array.isArray(quotes) || quotes.length === 0) {
        return NextResponse.json(
          { error: "生成失败" },
          { status: 500 }
        );
      }
      return NextResponse.json({ quotes });
    } catch {
      return NextResponse.json(
        { error: "生成失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Quotes error:", error);
    return NextResponse.json(
      { error: "生成失败" },
      { status: 500 }
    );
  }
}
