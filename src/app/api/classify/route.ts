// 海外运行时访问国内 DashScope 较慢，放宽 Vercel 函数时限（默认 10s 会掐断）
export const maxDuration = 60;

export { POST } from "../classify-live/route";
