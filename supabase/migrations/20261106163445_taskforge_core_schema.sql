/*
# TaskForge AI core schema

Creates the tables behind the TaskForge AI marketplace: AI agents, tasks handled by the coordinator, payment approvals (ledger entries), and workspace settings. Seeds realistic sample data so the dashboard is populated on first load.

1. New Tables
- `agents`: marketplace AI agents with specialization, reputation (0-100), completed jobs and indicative price.
- `tasks`: user tasks with title, description, USD budget, deadline, required specialization, coordinator progress (completed steps 0-8), generated subtasks, bids and verification score.
- `transactions`: payment requests to agents. Each one starts as pending approval and only moves to approved by an explicit human action. These are internal ledger records, not blockchain transactions.
- `workspace_settings`: single-row workspace settings including the approved budget pool.

2. Modified Tables
- None (new schema).

3. Security
- Row Level Security enabled on every table.
- No sign-in in this version, so policies target `anon` and `authenticated` roles.
- Column-level grants: task budgets and transaction amounts cannot be edited after creation.
- Budget guard trigger: a payment can never exceed its task's approved budget, and approved payments are final.
- Payment decisions run through `approve_payment` and `decline_payment` functions so status and task progress change together.

4. Important Notes
- 4.1 Single-tenant demo data. Anyone with the app can read and write, which is intentional for this prototype. Real multi-user access control should be added with sign-in before handling real funds.
- 4.2 Seeds use fixed ids and `ON CONFLICT DO NOTHING`, so the migration is safe to re-run.
- 4.3 Only one open (non-declined) payment request can exist per task.
*/

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  reputation integer NOT NULL DEFAULT 0 CHECK (reputation BETWEEN 0 AND 100),
  completed_jobs integer NOT NULL DEFAULT 0 CHECK (completed_jobs >= 0),
  base_price_usd numeric(12,2) NOT NULL CHECK (base_price_usd > 0),
  avg_delivery_days integer NOT NULL DEFAULT 1 CHECK (avg_delivery_days > 0),
  is_online boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '',
  budget_usd numeric(12,2) NOT NULL CHECK (budget_usd > 0),
  deadline date NOT NULL,
  specialization text NOT NULL,
  preferred_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  selected_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  completed_steps smallint NOT NULL DEFAULT 0 CHECK (completed_steps BETWEEN 0 AND 8),
  subtasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  bids jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_score integer CHECK (verification_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id),
  amount_usd numeric(12,2) NOT NULL CHECK (amount_usd > 0),
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE INDEX IF NOT EXISTS transactions_task_id_idx ON transactions (task_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_one_open_per_task
  ON transactions (task_id) WHERE status <> 'declined';

CREATE TABLE IF NOT EXISTS workspace_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  workspace_name text NOT NULL DEFAULT 'TaskForge Workspace',
  budget_pool_usd numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_pool_usd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON agents, tasks, transactions, workspace_settings FROM anon, authenticated;

GRANT SELECT ON agents TO anon, authenticated;
GRANT SELECT, INSERT ON tasks TO anon, authenticated;
GRANT UPDATE (completed_steps, selected_agent_id, subtasks, bids, verification_score, updated_at) ON tasks TO anon, authenticated;
GRANT SELECT, INSERT ON transactions TO anon, authenticated;
GRANT UPDATE (status, decided_at) ON transactions TO anon, authenticated;
GRANT SELECT, INSERT ON workspace_settings TO anon, authenticated;
GRANT UPDATE (workspace_name, budget_pool_usd, updated_at) ON workspace_settings TO anon, authenticated;

DROP POLICY IF EXISTS "agents_select" ON agents;
CREATE POLICY "agents_select" ON agents FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "settings_select" ON workspace_settings;
CREATE POLICY "settings_select" ON workspace_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_insert" ON workspace_settings;
CREATE POLICY "settings_insert" ON workspace_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "settings_update" ON workspace_settings;
CREATE POLICY "settings_update" ON workspace_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION enforce_transaction_budget()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  task_budget numeric;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved'
     AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.amount_usd <> OLD.amount_usd) THEN
    RAISE EXCEPTION 'Approved payments are final and cannot be changed';
  END IF;

  SELECT budget_usd INTO task_budget FROM tasks WHERE id = NEW.task_id;
  IF task_budget IS NULL THEN
    RAISE EXCEPTION 'Task % does not exist', NEW.task_id;
  END IF;

  IF NEW.amount_usd > task_budget THEN
    RAISE EXCEPTION 'Payment of % USD exceeds the approved task budget of % USD', NEW.amount_usd, task_budget;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transactions_enforce_budget ON transactions;
CREATE TRIGGER transactions_enforce_budget
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION enforce_transaction_budget();

CREATE OR REPLACE FUNCTION approve_payment(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_task_id uuid;
BEGIN
  UPDATE transactions
     SET status = 'approved', decided_at = now()
   WHERE id = p_transaction_id AND status = 'pending_approval'
   RETURNING task_id INTO v_task_id;

  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'No pending payment found for approval';
  END IF;

  UPDATE tasks
     SET completed_steps = 8, updated_at = now()
   WHERE id = v_task_id AND completed_steps = 7;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task is not waiting for payment approval';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION decline_payment(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
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

REVOKE EXECUTE ON FUNCTION approve_payment(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION decline_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_payment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decline_payment(uuid) TO anon, authenticated;

INSERT INTO agents (id, name, category, tagline, description, reputation, completed_jobs, base_price_usd, avg_delivery_days, is_online, created_at) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Atlas Research', 'Research', 'Source-verified briefs in hours', 'Deep web and on-chain research that cites every claim. Strong on competitive landscapes, protocol analysis and due diligence memos.', 96, 1842, 420.00, 2, true, now() - interval '400 days'),
  ('a0000000-0000-4000-8000-000000000002', 'Quill Scribe', 'Content Writing', 'Long-form writing with a sharp voice', 'Articles, documentation and newsletters tailored to developer audiences. Includes SEO outline and editorial review.', 91, 1260, 260.00, 2, true, now() - interval '380 days'),
  ('a0000000-0000-4000-8000-000000000003', 'Lattice Analyst', 'Data Analysis', 'Dashboards that answer the question', 'Cleans, models and visualizes on-chain and market data. Delivers reproducible notebooks and a plain-language summary.', 94, 977, 610.00, 3, true, now() - interval '350 days'),
  ('a0000000-0000-4000-8000-000000000004', 'Forge Engineer', 'Development', 'Production-ready front ends and APIs', 'Full-stack implementation with tests, typed interfaces and deployment notes. Specializes in React, TypeScript and Rust tooling.', 89, 705, 1150.00, 5, true, now() - interval '300 days'),
  ('a0000000-0000-4000-8000-000000000005', 'Pixel Muse', 'Design', 'Interfaces that feel premium', 'Product design, brand systems and high-fidelity UI kits. Delivers component specs ready for engineering handoff.', 87, 530, 480.00, 4, true, now() - interval '260 days'),
  ('a0000000-0000-4000-8000-000000000006', 'Vault Auditor', 'Smart Contracts', 'Security reviews before mainnet', 'Manual and tool-assisted audits of contracts with severity-ranked findings, proofs of concept and remediation checks.', 97, 412, 1900.00, 6, true, now() - interval '240 days'),
  ('a0000000-0000-4000-8000-000000000007', 'Signal Scout', 'Market Intelligence', 'Weekly ecosystem signal reports', 'Tracks launches, funding and community momentum across Web3 ecosystems and turns them into concise, sourced briefings.', 84, 689, 330.00, 2, true, now() - interval '200 days'),
  ('a0000000-0000-4000-8000-000000000008', 'Ledger Ops', 'Operations', 'Reconciliation and reporting, automated', 'Automates recurring operational workflows: reconciliations, invoice checks and monthly reporting with audit trails.', 79, 298, 240.00, 1, true, now() - interval '150 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspace_settings (id, workspace_name, budget_pool_usd) VALUES
  (1, 'TaskForge Workspace', 5000.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, budget_usd, deadline, specialization, selected_agent_id, completed_steps, subtasks, bids, verification_score, created_at, updated_at) VALUES
  ('b0000000-0000-4000-8000-000000000001',
   'Competitive landscape report for NEAR DeFi lending',
   'Map the top lending protocols on NEAR, compare collateral models, rates and risk controls, and summarize the gaps we could fill with a new product. Include sources for every claim.',
   1200.00, DATE '2026-10-20', 'Research', 'a0000000-0000-4000-8000-000000000001', 8,
   '[{"id":"b0000000-0000-4000-8000-000000000001-0","title":"Scope and requirements","description":"Clarify the brief, constraints and success criteria."},{"id":"b0000000-0000-4000-8000-000000000001-1","title":"Research core work","description":"Execute the main deliverable against the brief."},{"id":"b0000000-0000-4000-8000-000000000001-2","title":"Quality review","description":"Check output against acceptance criteria and fix gaps."},{"id":"b0000000-0000-4000-8000-000000000001-3","title":"Delivery package","description":"Assemble the final deliverable and summary notes."}]'::jsonb,
   '[{"agentId":"a0000000-0000-4000-8000-000000000001","amountUsd":980,"etaDays":2,"score":92},{"agentId":"a0000000-0000-4000-8000-000000000007","amountUsd":1050,"etaDays":3,"score":71}]'::jsonb,
   94, now() - interval '12 days', now() - interval '9 days'),
  ('b0000000-0000-4000-8000-000000000002',
   'Security review for the staking contract before mainnet',
   'Audit the staking module for reentrancy, reward math and access control issues. Deliver a severity-ranked findings report with reproduction steps.',
   1600.00, DATE '2026-12-01', 'Smart Contracts', NULL, 4,
   '[{"id":"b0000000-0000-4000-8000-000000000002-0","title":"Scope and requirements","description":"Clarify the brief, constraints and success criteria."},{"id":"b0000000-0000-4000-8000-000000000002-1","title":"Smart Contracts core work","description":"Execute the main deliverable against the brief."},{"id":"b0000000-0000-4000-8000-000000000002-2","title":"Quality review","description":"Check output against acceptance criteria and fix gaps."},{"id":"b0000000-0000-4000-8000-000000000002-3","title":"Delivery package","description":"Assemble the final deliverable and summary notes."}]'::jsonb,
   '[{"agentId":"a0000000-0000-4000-8000-000000000006","amountUsd":1480,"etaDays":6,"score":84}]'::jsonb,
   NULL, now() - interval '3 days', now() - interval '1 day'),
  ('b0000000-0000-4000-8000-000000000003',
   'Launch blog series on account abstraction',
   'Write a three-part series explaining account abstraction on NEAR for developers new to the topic, with code examples reviewed by an engineer.',
   600.00, DATE '2026-11-20', 'Content Writing', 'a0000000-0000-4000-8000-000000000002', 7,
   '[{"id":"b0000000-0000-4000-8000-000000000003-0","title":"Scope and requirements","description":"Clarify the brief, constraints and success criteria."},{"id":"b0000000-0000-4000-8000-000000000003-1","title":"Content Writing core work","description":"Execute the main deliverable against the brief."},{"id":"b0000000-0000-4000-8000-000000000003-2","title":"Quality review","description":"Check output against acceptance criteria and fix gaps."},{"id":"b0000000-0000-4000-8000-000000000003-3","title":"Delivery package","description":"Assemble the final deliverable and summary notes."}]'::jsonb,
   '[{"agentId":"a0000000-0000-4000-8000-000000000002","amountUsd":540,"etaDays":2,"score":90},{"agentId":"a0000000-0000-4000-8000-000000000007","amountUsd":510,"etaDays":2,"score":63}]'::jsonb,
   91, now() - interval '2 days', now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (id, task_id, agent_id, amount_usd, status, created_at, decided_at) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 980.00, 'approved', now() - interval '9 days', now() - interval '8 days'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 540.00, 'pending_approval', now() - interval '2 hours', NULL)
ON CONFLICT (id) DO NOTHING;
