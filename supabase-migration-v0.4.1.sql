-- v0.4.1 数据库变更
-- 1) travel_journals 加 visited_at 字段(实际去过时间)
ALTER TABLE travel_journals ADD COLUMN IF NOT EXISTS visited_at TEXT;

-- 2) 修复:允许匿名读取日记(RLS 之前拦截了 anon key)
ALTER TABLE travel_journals DISABLE ROW LEVEL SECURITY;
