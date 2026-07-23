import { NextRequest, NextResponse } from "next/server";

// 天气代码 → 中文描述
const WEATHER_MAP: Record<number, string> = {
  0: "晴天",
  1: "晴间多云",
  2: "多云",
  3: "阴天",
};

function getWeatherDesc(code: number): string {
  if (WEATHER_MAP[code]) return WEATHER_MAP[code];
  if (code >= 45 && code <= 48) return "雾";
  if (code >= 51 && code <= 67) return "雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "阵雨";
  if (code >= 85 && code <= 86) return "阵雪";
  if (code >= 95 && code <= 99) return "雷暴";
  return "未知";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "请提供 lat 和 lng 参数" },
        { status: 400 }
      );
    }

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m`;

    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "lvtu-app/1.0" },
    });

    if (!response.ok) {
      console.error("Weather API error:", response.status);
      return NextResponse.json(
        { error: "天气数据暂不可用" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const current = data.current;

    if (!current) {
      return NextResponse.json(
        { error: "天气数据暂不可用" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      temperature: current.temperature_2m,
      weather: getWeatherDesc(current.weather_code),
      windSpeed: current.wind_speed_10m,
    });
  } catch (error) {
    console.error("Weather error:", error);
    return NextResponse.json(
      { error: "天气数据暂不可用" },
      { status: 500 }
    );
  }
}
