CREATE OR REPLACE FUNCTION decline_payment(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE transactions
     SET status = 'declined', decided_at = now()
   WHERE id = p_transaction_id AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending payment found to decline';
  END IF;
END;
$$;

REVOKE UPDATE (status, decided_at) ON transactions FROM anon, authenticated;
REVOKE UPDATE ON transactions FROM anon, authenticated;
