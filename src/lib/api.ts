import { getDeviceId } from "./device";

/**
 * 归属标识的传输约定：
 * 前端每次请求自动在头里带 x-owner-id（设备 UUID），
 * 服务端 API 用它识别数据归属。未来接登录时把 getDeviceId()
 * 的实现换成读 session 的 user_id，本文件与调用方都不用动。
 */
export const OWNER_HEADER = "x-owner-id";

/**
 * 统一请求入口：自动携带设备标识。用法与原生 fetch 一致。
 */
export function apiFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const ownerId = getDeviceId();
  const headers = new Headers(init?.headers);
  if (ownerId) headers.set(OWNER_HEADER, ownerId);
  return fetch(input, { ...init, headers });
}

/**
 * 服务端：从请求头读取归属标识（读不到返回 null，如旧客户端 / 直连）。
 */
export function readOwnerId(request: Request): string | null {
  return request.headers.get(OWNER_HEADER);
}
