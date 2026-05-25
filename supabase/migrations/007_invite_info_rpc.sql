-- =============================================
-- Vén — Migration 007: Invite info RPC
-- =============================================
-- SECURITY DEFINER function that returns group name + member names
-- for the invite join screen. Bypasses RLS so non-members can see
-- minimal group info when opening an invite link.

CREATE OR REPLACE FUNCTION public.get_group_invite_info(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'group_name', g.name,
    'member_count', (SELECT COUNT(*) FROM members m WHERE m.group_id = g.id),
    'members', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', m.id,
        'name', m.name,
        'has_user', m.user_id IS NOT NULL
      )), '[]'::json)
      FROM members m WHERE m.group_id = g.id
    )
  ) INTO result
  FROM groups g WHERE g.id = p_group_id;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Nhóm không tồn tại';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_group_invite_info(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_invite_info(UUID) TO authenticated, anon;
