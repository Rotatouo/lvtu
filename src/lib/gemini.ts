import type { ClassificationResult } from "@/types";

const DASHSCOPE_API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

const CLASSIFICATION_PROMPT = `你是顶级旅行目的地识别专家。分析这张社交媒体截图，提取目的地信息。

首先检查截图中是否有文字信息：
- 定位标签（如📍XX）、话题标签（如#西藏）、配文、评论中的地名 → 最高优先级
- 水印中@的用户名/账号 → 可能隐含地点线索

如果截图中有风景/建筑图片但没有明确地名文字，你必须通过视觉特征识别：
- 标志性建筑（埃菲尔铁塔、自由女神像、悉尼歌剧院、大本钟、泰姬陵、长城、东方明珠等）
- 自然地貌（富士山、尼亚加拉瀑布、撒哈拉沙漠、马尔代夫环礁等）
- 独特城市景观（威尼斯运河、圣托里尼蓝白建筑、布拉格查理大桥等）
- 宗教建筑（教堂、寺庙、清真寺的建筑风格可推断地区）
- 气候/植被特征（热带棕榈、北欧极光、沙漠仙人掌等）

只输出 JSON（不要 markdown 代码块）：
{"country":"国家名(完整,如'中国')","region":"省/州/大区(完整,如'四川省'/'阿坝藏族羌族自治州')","city":"城市名(完整,必须保留'市'/'县'/'州'/'地区'等行政后缀,如'北京市'/'稻城县')","attraction":"景点名","confidence":"high/medium/low","evidence":"推断依据（30字内）","lat":纬度数字,"lng":经度数字,"opening_note":"三行出行参考,每行用\\n分隔。若无法确定具体信息则填null。"}

规则：
1. 有文字标签 → confidence 为 high，优先采信文字
2. 纯视觉识别 → confidence 为 medium，evidence 说明识别了哪些特征
3. 无法确定 → confidence 为 low，各字段填 null
4. lat/lng 尽量给出景点的大致经纬度（数字），不确定填 null
5. 中国必须填省份(region);其他可选
6. **重要**:city/region 字段必须保留完整的行政后缀("市"/"县"/"州"/"地区"/"自治区"等),不要省略。例如'阿坝藏族羌族自治州'不能简写成'阿坝','稻城县'不能写成'稻城'

【opening_note 生成规则】
opening_note 须严格按以下格式生成三行文本,每行用\\n分隔:

🕒 最佳时间：[根据景点所在地区气候/旅游属性,写出最佳游玩季节或时段,一句即可]
💰 消费参考：[门票价格区间、人均消费水平或住宿费用参考,一句即可]
💡 小贴士：[根据目的地类型选择匹配的规则,只写一条最关键的]

根据目的地类型,小贴士从以下匹配项中选取一条:
- 博物馆/美���馆/科技馆 → 闭馆日提醒+需提前预约+建议游览时长
- 自然山川/海岛/森林公园/湖泊/瀑布 → 最佳观赏时段+装备建议或防晒提醒
- 城市/县/国家 → 建议游玩天数+推荐住宿区域
- 餐厅/咖啡馆/酒吧 → 招牌菜推荐+是否需要排队或预约
- 购物中心/免税店/市集 → 退税信息或折扣时段+最佳逛购时间
- 酒店/民宿/度假村 → 入住退房时间+特色体验推荐
- 演出/赛事/演唱会 → 建议提前到场+禁带物品提醒
- 交通枢纽/观景台 → 首末班时间或最佳拍摄位置
- 主题乐园/游乐园 → 快速通行方式+必玩项目推荐
- 无法确定类型 → 建议提前查询官网获取最新信息

格式范例: 🕒 最佳时间：3-5月和9-11月,春秋季气候宜人\\n💰 消费参考：门票60元,周边住宿200-400元/晚\\n💡 小贴士：周一闭馆,需提前在官网预约,建议预留3小时游览`;

export async function classifyImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ClassificationResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error("未配置 DASHSCOPE_API_KEY");
  }

  // 必须设代码层超时：平台（Vercel / EdgeOne）到点会直接掐断并返回 HTML 错误页，
  // 前端 res.json() 会炸成 "Unexpected token 'A'"，用户只看到莫名其妙的失败。
  // 主动超时才能返回可读的 JSON 错误。默认 45s，给 Supabase 上传 + 冷启动留 15s 余量。
  const timeoutMs = Number(process.env.DASHSCOPE_TIMEOUT_MS ?? 45_000);

  const response = await fetch(DASHSCOPE_API_URL, {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen-vl-plus",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            { type: "text", text: CLASSIFICATION_PROMPT },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `通义千问 API 错误 (${response.status}): ${errText.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  if (!text) {
    throw new Error("通义千问返回为空");
  }

  // 提取 JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI 返回格式异常，未能提取 JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    country: parsed.country || null,
    region: parsed.region || null,
    city: parsed.city || null,
    attraction: parsed.attraction || null,
    confidence: parsed.confidence || "medium",
    evidence: parsed.evidence || "",
    lat: typeof parsed.lat === "number" ? parsed.lat : null,
    lng: typeof parsed.lng === "number" ? parsed.lng : null,
    opening_note: parsed.opening_note || null,
  };
}
