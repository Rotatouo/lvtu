import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * 临时诊断接口：只返回环境变量「是否已配置」（布尔），不返回任何密钥明文。
 * 用于定位 Supabase 不可用的真实原因（项目暂停 / key 失效 / 表或 bucket 缺失）。
 * 定位完成后应删除本文件。
 */
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    DASHSCOPE_API_KEY: Boolean(process.env.DASHSCOPE_API_KEY),
  };

  // 1) 数据库连通性：works 表
  let db: Record<string, unknown>;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("works").select("id").limit(1);
    db = error
      ? {
          ok: false,
          message: error.message,
          code: (error as { code?: string }).code ?? null,
          details: (error as { details?: string }).details ?? null,
          hint: (error as { hint?: string }).hint ?? null,
        }
      : { ok: true, rows: data?.length ?? 0 };
  } catch (e) {
    db = { ok: false, thrown: e instanceof Error ? e.message : String(e) };
  }

  // 2) Storage：列出 bucket（需要 service_role）
  let storage: Record<string, unknown>;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage.listBuckets();
    storage = error
      ? { ok: false, message: error.message }
      : { ok: true, buckets: (data || []).map((b) => b.name) };
  } catch (e) {
    storage = { ok: false, thrown: e instanceof Error ? e.message : String(e) };
  }

  // 3) DashScope：只验证 key 是否可读，不真正调用（避免产生费用）
  const dashscope = {
    keyPresent: Boolean(process.env.DASHSCOPE_API_KEY),
    keyLength: process.env.DASHSCOPE_API_KEY?.length ?? 0,
  };

  return NextResponse.json({ env, db, storage, dashscope });
}
