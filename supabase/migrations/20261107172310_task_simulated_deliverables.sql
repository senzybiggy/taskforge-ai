/*
# Simulated task deliverables

Stores the simulated demo deliverable produced when work starts on a task, along with the time the user reviewed it. Every deliverable is generated locally as demo output. No real agent work is performed and no NEAR transaction is sent.

1. Modified Tables
- `tasks`: new column `deliverable` (jsonb, null until work starts). Holds the simulated report, its sources, and `reviewedAt` once the user has reviewed it.

2. Security
- The existing column-level grant on `tasks` is extended so the app can write only the new `deliverable` column. Other protected columns are unchanged.

3. Important Notes
- Adding the column is safe to re-run. Existing tasks keep a null deliverable until work starts.
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverable jsonb;

GRANT UPDATE (deliverable) ON tasks TO anon, authenticated;
