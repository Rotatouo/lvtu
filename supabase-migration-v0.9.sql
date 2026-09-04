-- ═══════════════════════════════════════════════════════════════
-- v0.9 设备级数据隔离（匿名「各看各的」）
--
-- 背景：此前全站共享一份数据（无 owner 字段、service_role 绕过 RLS）。
-- 本次给三张核心表加 owner_id（设备标识），实现设备级匿名隔离：
--   works             心愿卡片
--   travel_journals   旅行日记
--   routes            路线
--   route_items       （不加 —— 通过 route_id → routes.owner_id 关联，
--                      避免重复存储同一归属）
--
-- 存量数据 owner_id 为 NULL：加字段后谁都看不到（隔离生效），
-- 由用户执行「认领」SQL（见文末被注释掉的部分）归属到自己设备。
--
-- 在 Supabase SQL Editor 执行一次即可，可重复执行（幂等）。
-- ═══════════════════════════════════════════════════════════════

-- 1. works 加 owner_id
ALTER TABLE works ADD COLUMN IF NOT EXISTS owner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_works_owner_id ON works(owner_id);

-- 2. travel_journals 加 owner_id
ALTER TABLE travel_journals ADD COLUMN IF NOT EXISTS owner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_journals_owner_id ON travel_journals(owner_id);

-- 3. routes 加 owner_id
ALTER TABLE routes ADD COLUMN IF NOT EXISTS owner_id TEXT;
CREATE INDEX IF NOT EXISTS idx_routes_owner_id ON routes(owner_id);

-- ───────────────────────────────────────────────────────────────
-- 认领存量数据（用户部署后，拿到自己的 device_id 再执行）
-- 把 '你的device_id' 替换成浏览器 localStorage 里 lvtu_device_id 的值：
--
-- UPDATE works            SET owner_id = '你的device_id' WHERE owner_id IS NULL;
-- UPDATE travel_journals  SET owner_id = '你的device_id' WHERE owner_id IS NULL;
-- UPDATE routes           SET owner_id = '你的device_id' WHERE owner_id IS NULL;
-- ───────────────────────────────────────────────────────────────
