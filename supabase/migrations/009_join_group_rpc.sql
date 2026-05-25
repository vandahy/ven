-- RPC function to join a group as a new member, bypassing RLS
-- Needed because the joining user can't SELECT the group row (not yet a member)
CREATE OR REPLACE FUNCTION public.join_group_as_new_member(p_group_id UUID, p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM groups WHERE id = p_group_id) INTO group_exists;
  IF NOT group_exists THEN
    RETURN FALSE;
  END IF;

  INSERT INTO members (group_id, name, user_id)
  VALUES (p_group_id, p_name, auth.uid());

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.join_group_as_new_member(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_group_as_new_member(UUID, TEXT) TO authenticated;
