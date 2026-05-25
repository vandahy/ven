-- Add completed_at column to groups table
ALTER TABLE groups ADD COLUMN completed_at TIMESTAMPTZ DEFAULT NULL;

-- Function to allow any group member to complete a group
CREATE OR REPLACE FUNCTION complete_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM members WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bạn không phải thành viên của nhóm này';
  END IF;

  UPDATE groups SET completed_at = NOW() WHERE id = p_group_id AND completed_at IS NULL;
END;
$$;
