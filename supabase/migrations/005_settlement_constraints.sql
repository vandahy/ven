-- =============================================
-- Vén — Migration 005: Settlement unique constraint + DELETE policy
-- =============================================

ALTER TABLE settlements
  ADD CONSTRAINT settlements_unique_pair
  UNIQUE (group_id, from_member, to_member);

CREATE POLICY "Group members can delete settlements"
  ON settlements FOR DELETE
  USING (
    public.is_group_member(group_id, auth.uid())
  );
