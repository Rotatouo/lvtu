const PUBLIC_STORAGE_RE = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

export function parseStoragePublicUrl(
  url: string
): { bucket: string; path: string } | null {
  const m = url.match(PUBLIC_STORAGE_RE);
  if (!m) return null;
  return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) };
}

/**
 * 把 Supabase Storage 公开 URL 转成同域代理 URL。
 *
 * 适用场景：用户网络无法直连 supabase.co（如国内访问 Storage 域名被墙/关闭连接），
 * 让浏览器通过 Next.js API 路由 `/api/storage/<bucket>/<path>` 间接取图。
 */
export function toStorageProxyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/storage/")) return url;
  const parsed = parseStoragePublicUrl(url);
  if (!parsed) return url;
  return `/api/storage/${encodeURIComponent(parsed.bucket)}/${parsed.path}`;
}

type WithImageFields = {
  image_url?: string | null;
  image_thumb?: string | null;
};

/**
 * 把对象列表里的 Supabase Storage 公开 URL 批量转成同域代理 URL。
 */
export function proxyImageUrls<T extends WithImageFields>(items: T[]): T[] {
  if (items.length === 0) return items;
  return items.map((item) => ({
    ...item,
    image_url: toStorageProxyUrl(item.image_url),
    image_thumb: toStorageProxyUrl(item.image_thumb),
  }));
}
