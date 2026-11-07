/*
# Agent skills, demo flag and additional demo agents

Lets each marketplace agent declare the skills it offers so bids can be matched against a task's required skills. Marks every seeded agent as a demo agent and adds four more demo agents so each category has more than one competing bidder.

1. Modified Tables
- `agents`: new column `skills` (text array, the skills the agent offers) and `is_demo` (boolean, true for every seeded agent).

2. New Rows
- Four demo agents: two in Research, one in Development and one in Data Analysis, with varied prices, reputation and delivery times.

3. Security
- No policy or grant changes. The existing read-only grant on `agents` already covers the new columns.

4. Important Notes
- Every agent in this prototype is a simulated demo agent. Bids are generated locally and no real agent work or payment is involved.
- Ids are fixed and inserts use ON CONFLICT DO NOTHING, so the migration is safe to re-run.
*/

ALTER TABLE agents ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT true;

UPDATE agents SET skills = ARRAY['Market research', 'Competitor analysis', 'Technical writing'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000001';
UPDATE agents SET skills = ARRAY['Technical writing', 'SEO', 'Market research'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000002';
UPDATE agents SET skills = ARRAY['Data cleaning', 'Forecasting', 'Dashboards'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000003';
UPDATE agents SET skills = ARRAY['React', 'TypeScript', 'Rust'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000004';
UPDATE agents SET skills = ARRAY['UI design', 'Design systems'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000005';
UPDATE agents SET skills = ARRAY['Security audit', 'Smart contract testing', 'Rust'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000006';
UPDATE agents SET skills = ARRAY['Community monitoring', 'Market research', 'Competitor analysis'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000007';
UPDATE agents SET skills = ARRAY['Process automation', 'Data cleaning', 'Dashboards'], is_demo = true WHERE id = 'a0000000-0000-4000-8000-000000000008';

INSERT INTO agents (id, name, category, tagline, description, reputation, completed_jobs, base_price_usd, avg_delivery_days, is_online, created_at, skills, is_demo) VALUES
  ('a0000000-0000-4000-8000-000000000009', 'Ridge Briefing', 'Research', 'Fast competitor scans with clear takeaways', 'Quick-turn competitor and market scans with a one-page executive summary. Best for tight timelines.', 82, 514, 260.00, 1, true, now() - interval '120 days', ARRAY['Competitor analysis', 'Market research'], true),
  ('a0000000-0000-4000-8000-000000000010', 'Archive Analyst', 'Research', 'Thorough literature and protocol reviews', 'Slower but exhaustive reviews of protocols, papers and documentation with a full source appendix and risk notes.', 93, 1088, 760.00, 5, true, now() - interval '180 days', ARRAY['Market research', 'Technical writing', 'Competitor analysis'], true),
  ('a0000000-0000-4000-8000-000000000011', 'Stack Smith', 'Development', 'Budget-friendly TypeScript builds', 'Small features, integrations and bug fixes in TypeScript and React at a lower price point. Includes basic tests.', 78, 326, 540.00, 3, true, now() - interval '90 days', ARRAY['React', 'TypeScript'], true),
  ('a0000000-0000-4000-8000-000000000012', 'Metric Harbor', 'Data Analysis', 'Forecasts you can defend', 'Statistical modelling, forecasting and data quality audits with methodology notes that a reviewer can reproduce.', 90, 611, 880.00, 4, true, now() - interval '60 days', ARRAY['Forecasting', 'Data cleaning', 'Dashboards'], true)
ON CONFLICT (id) DO NOTHING;
