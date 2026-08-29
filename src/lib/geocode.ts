/**
 * 地理编码：将文字地址转为经纬度
 * 使用免费的 Nominatim (OpenStreetMap) API
 * 限速：1 次/秒
 */

interface GeocodeResult {
  lat: number;
  lng: number;
}

function buildAddress(
  country: string | null,
  region: string | null,
  city: string | null,
  attraction: string | null
): string {
  const parts = [attraction, city, region, country].filter(Boolean) as string[];
  return parts.join(", ");
}

export async function geocode(
  country: string | null,
  region: string | null,
  city: string | null,
  attraction: string | null
): Promise<GeocodeResult | null> {
  const address = buildAddress(country, region, city, attraction);
  if (!address) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "LvtuApp/1.0 (travel-wishlist)",
      },
      // 必须设超时：Nominatim 是海外服务，卡住会吃满平台层 60s 上限，
      // 被平台掐断后返回 HTML 错误页，前端 res.json() 会炸成 "Unexpected token 'A'"。
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("Geocode error:", err);
    return null;
  }
}
