/**
 * 设备标识 —— 匿名「各看各的」的数据归属键。
 *
 * 首次访问生成 UUID 存 localStorage（key: lvtu_device_id），之后复用。
 * 局限：存 localStorage 的设备标识是「君子协定」，可被伪造或清除；
 * 对个人项目足够，真正的安全隔离要等登录体系 + RLS。
 *
 * 未来接登录：把「读 localStorage 的 device_id」换成「读 session 的 user_id」，
 * 接口约定不变（owner_id 字段 + x-owner-id 请求头），业务改动面很小。
 */
const DEVICE_ID_KEY = "lvtu_device_id";

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null; // SSR / 构建期
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return null; // localStorage 不可用（隐私模式 / 被禁）时降级为无归属
  }
}
