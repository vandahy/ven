-- =============================================
-- Vén — Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Bảng 1: Nhóm
CREATE TABLE groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 2: Thành viên nhóm
CREATE TABLE members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 3: Chi tiêu
CREATE TABLE expenses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  amount          NUMERIC(12,0) NOT NULL,
  payer_id        UUID REFERENCES members(id),
  split_between   UUID[] NOT NULL,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 4: Thanh toán đã xong
CREATE TABLE settlements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_member UUID REFERENCES members(id),
  to_member   UUID REFERENCES members(id),
  amount      NUMERIC(12,0) NOT NULL,
  settled_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Groups: user can see groups they belong to
CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creator can update"
  ON groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Group creator can delete"
  ON groups FOR DELETE
  USING (created_by = auth.uid());

-- Members: user can see members in their groups
CREATE POLICY "Users can view members in their groups"
  ON members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM members AS m WHERE m.user_id = auth.uid()
    )
    OR group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add members to their groups"
  ON members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
    OR group_id IN (
      SELECT group_id FROM members AS m WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Group creator can remove members"
  ON members FOR DELETE
  USING (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

-- Expenses: user can see/add expenses in their groups
CREATE POLICY "Users can view expenses in their groups"
  ON expenses FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add expenses to their groups"
  ON expenses FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Expense creator can update"
  ON expenses FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Expense creator can delete"
  ON expenses FOR DELETE
  USING (created_by = auth.uid());

-- Settlements: same as expenses
CREATE POLICY "Users can view settlements in their groups"
  ON settlements FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add settlements"
  ON settlements FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM members WHERE user_id = auth.uid()
    )
  );
