/*
# Task skills and server-side budget guard

Adds required skills to tasks and makes the database refuse any new task whose budget is larger than the money still available in the workspace pool.

1. Modified Tables
- `tasks`: new column `skills` (text list). Stores the skills a task requires. Existing tasks receive an empty list.

2. New Functions and Triggers
- `enforce_task_budget()`: runs before a task is inserted. It calculates available budget as the pool minus the budgets of open tasks minus approved payments, and rejects the insert if the task budget is higher.
- `tasks_enforce_budget`: trigger that calls the function above on every new task.

3. Security
- No new policies or grants are needed. The existing column-level permissions already allow inserting into `tasks`, and the trigger function is not callable through the API.

4. Important Notes
- 4.1 The check is applied on insert only. Existing tasks are not changed.
- 4.2 Every statement is idempotent so the migration can be safely re-run.
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_skills_count_check' AND conrelid = 'tasks'::regclass
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_skills_count_check CHECK (cardinality(skills) BETWEEN 0 AND 8);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_task_budget()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_pool numeric;
  v_reserved numeric;
  v_spent numeric;
  v_available numeric;
BEGIN
  SELECT budget_pool_usd INTO v_pool FROM workspace_settings WHERE id = 1;
  SELECT COALESCE(SUM(budget_usd), 0) INTO v_reserved FROM tasks WHERE completed_steps < 8;
  SELECT COALESCE(SUM(amount_usd), 0) INTO v_spent FROM transactions WHERE status = 'approved';

  v_available := COALESCE(v_pool, 0) - v_reserved - v_spent;

  IF NEW.budget_usd > v_available THEN
    RAISE EXCEPTION 'Only % USD is available in your approved budget.', GREATEST(ROUND(v_available, 2), 0);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION enforce_task_budget() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tasks_enforce_budget ON tasks;
CREATE TRIGGER tasks_enforce_budget
  BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION enforce_task_budget();
