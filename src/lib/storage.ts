import { createServiceClient } from "./supabase";

const PUBLIC_STORAGE_RE = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

export function parseStoragePublicUrl(
  url: string
): { bucket: string; path: string } | null {
  const m = url.match(PUBLIC_STORAGE_RE);
  if (!m) return null;
  return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
}

type WithImageFields = {
  image_url?: string | null;
  image_thumb?: string | null;
};

/**
 * 把对象列表里的 Supabase Storage 公开 URL 转成 service-role 签名 URL。
 *
 * 用途：当 Storage 桶没有开 Public / RLS 禁止匿名读时，前端直接用公开 URL
 * 会 403；由服务端用 service role 批量签发临时直链，前端就能正常加载图片。
 *
 * 注意：只处理匹配 /storage/v1/object/public/<bucket>/<path> 的 URL；
 * 不匹配的原样返回。
 */
export async function signImageUrls<T extends WithImageFields>(
  items: T[],
  expiresInSeconds = 86400 // 24 小时
): Promise<T[]> {
  if (items.length === 0) return items;

  const supabase = createServiceClient();
  const bucketMap = new Map<
    string,
    Array<{
      index: number;
      field: "image_url" | "image_thumb";
      path: string;
    }>
  >();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    for (const field of ["image_url", "image_thumb"] as const) {
      const url = item[field];
      if (!url) continue;
      const parsed = parseStoragePublicUrl(url);
      if (!parsed) continue;
      if (!bucketMap.has(parsed.bucket)) {
        bucketMap.set(parsed.bucket, []);
      }
      bucketMap.get(parsed.bucket)!.push({ index: i, field, path: parsed.path });
    }
  }

  if (bucketMap.size === 0) return items;

  const results = items.map((item) => ({ ...item }));

  for (const [bucket, entries] of bucketMap) {
    const paths = entries.map((e) => e.path);
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresInSeconds);
    if (error || !data) {
      console.error(`[signImageUrls] bucket=${bucket} error:`, error);
      continue;
    }
    for (let j = 0; j < entries.length; j++) {
      const signed = data[j]?.signedUrl;
      if (signed) {
        const { index, field } = entries[j];
        results[index][field] = signed;
      }
    }
  }

  return results;
}
