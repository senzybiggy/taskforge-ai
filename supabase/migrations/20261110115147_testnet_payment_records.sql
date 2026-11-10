/*
# Record NEAR testnet payments

1. Summary
- Payments are now marked approved only after a NEAR testnet transfer succeeds on chain.
- Each approved payment stores the transaction hash, the recipient testnet account, the transferred amount in NEAR, and the network.
- The app can no longer approve a payment without a transaction hash.

2. Modified table
- `transactions`: new columns `near_tx_hash`, `near_recipient`, `near_amount_near`, `near_network` (all nullable, so existing rows and declined payments are unaffected).
- A unique index on `near_tx_hash` stops the same on-chain transaction from being recorded against two payments.

3. New function
- `record_testnet_payment(p_transaction_id, p_tx_hash, p_recipient, p_amount_near)` validates the hash format, the testnet recipient, and the fixed 0.001 NEAR amount. It then approves the pending payment and moves the task to Payment approved, in one transaction.
- It runs with the owner's rights so the anonymous app role does not need write access to the new columns.

4. Security
- Execute permission on `record_testnet_payment` is granted only to `anon` and `authenticated`, after revoking it from PUBLIC.
- The older `approve_payment` function can no longer be called through the API, so it cannot mark a payment approved without a transaction.

5. Important notes
- 5.1 The database checks the format of the hash but cannot confirm the transfer on chain. The app confirms the transfer succeeded in the wallet before calling this function.
- 5.2 Transfers are limited to 0.001 NEAR on testnet. No mainnet or real funds are involved.
*/

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS near_tx_hash text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS near_recipient text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS near_amount_near text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS near_network text;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_near_tx_hash_key
  ON transactions (near_tx_hash) WHERE near_tx_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION record_testnet_payment(
  p_transaction_id uuid,
  p_tx_hash text,
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

REVOKE EXECUTE ON FUNCTION record_testnet_payment(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_testnet_payment(uuid, text, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION approve_payment(uuid) FROM anon, authenticated;
