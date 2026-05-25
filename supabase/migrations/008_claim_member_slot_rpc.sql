-- RPC function to claim an unlinked member slot, bypassing RLS
-- Needed because the joining user can't SELECT the member row (not yet a group member)
CREATE OR REPLACE FUNCTION public.claim_member_slot(p_member_id UUID, p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE members
  SET user_id = auth.uid()
  WHERE id = p_member_id
    AND group_id = p_group_id
    AND user_id IS NULL;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_member_slot(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_member_slot(UUID, UUID) TO authenticated;
