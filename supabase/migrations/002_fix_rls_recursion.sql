-- =============================================
-- Vén — Migration 002: Fix RLS recursion
-- =============================================
-- The original members SELECT policy queried `members` from within itself,
-- causing "infinite recursion detected in policy for relation 'members'"
-- whenever the client fetched groups joined with members.
-- Fix: extract the membership check into a SECURITY DEFINER function
-- so it bypasses RLS when called inside another policy.

DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view members in their groups" ON members;
DROP POLICY IF EXISTS "Users can add members to their groups" ON members;
DROP POLICY IF EXISTS "Group creator can remove members" ON members;

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated, anon;

CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

CREATE POLICY "Users can view members in their groups"
  ON members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  );

CREATE POLICY "Users can add members to their groups"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
    OR public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Group creator can remove members"
  ON members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  );
