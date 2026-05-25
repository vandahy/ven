-- =============================================
-- Vén — Migration 004: Enable Supabase Realtime
-- =============================================
-- Add all tables to the supabase_realtime publication
-- so postgres_changes subscriptions fire for them.

ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
