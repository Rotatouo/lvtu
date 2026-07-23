-- 旅途 (Journey) 数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建作品表
CREATE TABLE IF NOT EXISTS works (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url       TEXT,
  image_thumb     TEXT,
  -- AI 原始分类
  ai_country      TEXT,
  ai_region       TEXT,
  ai_city         TEXT,
  ai_attraction   TEXT,
  -- 用户确认后的分类
  final_country      TEXT,
  final_region       TEXT,
  final_city         TEXT,
  final_attraction   TEXT,
  is_confirmed    BOOLEAN DEFAULT FALSE,
  -- 元数据
  source_platform TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'want_to_go',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_works_country ON works(final_country);
CREATE INDEX IF NOT EXISTS idx_works_city ON works(final_city);
CREATE INDEX IF NOT EXISTS idx_works_created ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);

-- 3. 启用 RLS（行级安全）
ALTER TABLE works ENABLE ROW LEVEL SECURITY;

-- 4. 创建存储桶（在 Supabase Dashboard > Storage 中手动创建）
-- 存储桶名称：images
-- 访问权限：公开（public）

-- 5. 存储桶策略（在 Storage > Policies 中配置）
-- 允许所有人读取（公开图片访问）：
--   Policy name: Public read access
--   Allowed operation: SELECT
--   Target roles: (leave empty for public)

-- 允许 service_role 上传：
--   Policy name: Service role upload
--   Allowed operation: INSERT
--   Target roles: service_role

-- 6. 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
