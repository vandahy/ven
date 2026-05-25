-- =============================================
-- Vén — Migration 006: Invite join RLS policies
-- =============================================
-- Allow authenticated users to claim an unlinked member slot
-- or add themselves as a new member when joining via invite link.

CREATE POLICY "Users can claim unlinked member slots"
  ON members FOR UPDATE
  USING (
    user_id IS NULL
  )
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can join groups via invite"
  ON members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.groups WHERE id = group_id)
  );
