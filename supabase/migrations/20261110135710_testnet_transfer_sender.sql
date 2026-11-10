/*
# Store the sender account for NEAR testnet transfers

1. Modified table
- `transactions`: new nullable column `near_sender` holding the testnet account that signed the transfer.

2. Function
- `record_testnet_payment` now takes the sender account as well, validates it with the same testnet account rule as the recipient, and stores it with the payment.
- The previous four-argument version is removed so only the sender-aware version can record payments.

3. Security
- Execute permission is revoked from PUBLIC and granted only to `anon` and `authenticated`, as before.
*/

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS near_sender text;

DROP FUNCTION IF EXISTS record_testnet_payment(uuid, text, text, text);

CREATE OR REPLACE FUNCTION record_testnet_payment(
  p_transaction_id uuid,
  p_tx_hash text,
  p_sender text,
  p_recipient text,
  p_amount_near text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id uuid;
BEGIN
  IF p_tx_hash IS NULL OR p_tx_hash !~ '^[1-9A-HJ-NP-Za-km-z]{43,44}$' THEN
    RAISE EXCEPTION 'A valid NEAR transaction hash is required';
  END IF;
  IF p_sender IS NULL OR p_sender !~ '^[a-z0-9._-]+\.testnet$' THEN
    RAISE EXCEPTION 'A NEAR testnet sender account is required';
  END IF;
  IF p_recipient IS NULL OR p_recipient !~ '^[a-z0-9._-]+\.testnet$' THEN
    RAISE EXCEPTION 'A NEAR testnet account is required';
  END IF;
  IF p_amount_near IS DISTINCT FROM '0.001' THEN
    RAISE EXCEPTION 'Test transfers must be exactly 0.001 NEAR';
  END IF;

  UPDATE transactions
     SET status = 'approved',
         decided_at = now(),
         near_tx_hash = p_tx_hash,
         near_sender = p_sender,
         near_recipient = p_recipient,
         near_amount_near = p_amount_near,
         near_network = 'testnet'
   WHERE id = p_transaction_id AND status = 'pending_approval'
   RETURNING task_id INTO v_task_id;

  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'No pending payment found for approval';
  END IF;

  UPDATE tasks
     SET completed_steps = 8, updated_at = now()
   WHERE id = v_task_id AND completed_steps = 7;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The task is not ready for payment approval';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_testnet_payment(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_testnet_payment(uuid, text, text, text, text) TO anon, authenticated;
