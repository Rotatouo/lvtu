import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const DASHSCOPE_API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // 获取已确认的作品列表
    const { data: works, error } = await supabase
      .from("works")
      .select("final_attraction, final_city, final_country")
      .eq("is_confirmed", true)
      .not("final_attraction", "is", null)
      .limit(30);

    if (error) {
      console.error("Fetch works for recommend error:", error);
      return NextResponse.json(
        { error: "推荐暂不可用" },
        { status: 500 }
      );
    }

    if (!works || works.length === 0) {
      return NextResponse.json({
        recommendations: [],
        hint: "添加更多目的地后，AI 会为你推荐相似的去处",
      });
    }

    // 构建目的地列表
    const destinations = works
      .map((w) => {
        const parts = [w.final_attraction, w.final_city, w.final_country]
          .filter(Boolean);
        return parts.join("，");
      })
      .filter(Boolean)
      .slice(0, 15); // 最多 15 个避免 token 溢出

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "推荐暂不可用" },
        { status: 500 }
      );
    }

    const prompt = `以下是用户已经收藏的旅行目的地：${destinations.join("；")}。请基于这些目的地，推荐 3 个新的、风格相似的目的地。返回 JSON 数组：[{ "name": "目的地名", "reason": "一句话推荐理由，含城市/国家" }]。只返回 JSON，不要其他内容。`;

    const response = await fetch(DASHSCOPE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("Recommend API error:", response.status);
      return NextResponse.json(
        { error: "推荐暂不可用" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({
        recommendations: [],
        hint: "暂无可推荐的相似目的地，再多添加一些吧",
      });
    }

    try {
      const recommendations = JSON.parse(match[0]);
      return NextResponse.json({
        recommendations: Array.isArray(recommendations) ? recommendations : [],
      });
    } catch {
      return NextResponse.json({
        recommendations: [],
        hint: "暂无可推荐的相似目的地，再多添加一些吧",
      });
    }
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: "推荐暂不可用" },
      { status: 500 }
    );
  }
}
