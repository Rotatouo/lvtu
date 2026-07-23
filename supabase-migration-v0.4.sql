-- v0.4 数据库迁移
-- works 表新增字段
ALTER TABLE works ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE works ADD COLUMN IF NOT EXISTS opening_note TEXT;

-- 旅行日记表
CREATE TABLE IF NOT EXISTS travel_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  quote TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_journals_work_id ON travel_journals(work_id);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON travel_journals(created_at DESC);
