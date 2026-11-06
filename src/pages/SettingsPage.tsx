import { useState, type FormEvent } from 'react';
import { BadgeCheck, Link2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAppData } from '@/hooks/useAppData';
import { formatUsd } from '@/lib/format';

interface SettingsForm {
  workspaceName: string;
  budgetPoolUsd: string;
}

type FormErrors = Partial<Record<keyof SettingsForm, string>>;

export function SettingsPage() {
  const { settings, budget, saveSettings } = useAppData();
  const [form, setForm] = useState<SettingsForm>({
    workspaceName: settings?.workspaceName ?? '',
    budgetPoolUsd: String(settings?.budgetPoolUsd ?? ''),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const committedUsd = (budget?.reservedUsd ?? 0) + (budget?.spentUsd ?? 0);
  const pool = budget?.poolUsd ?? 0;
  const usedPct = pool > 0 ? committedUsd / pool : 0;
  const dirty =
    settings !== null &&
    (form.workspaceName.trim() !== settings.workspaceName || Number(form.budgetPoolUsd) !== settings.budgetPoolUsd);

  const update = (key: keyof SettingsForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const name = form.workspaceName.trim();
    const poolValue = Number(form.budgetPoolUsd);
    if (name.length < 2) next.workspaceName = 'Use a workspace name of at least 2 characters.';
    if (name.length > 60) next.workspaceName = 'Keep the workspace name under 60 characters.';
    if (form.budgetPoolUsd.trim() === '' || !Number.isFinite(poolValue) || poolValue < 0) {
      next.budgetPoolUsd = 'Enter a pool amount of zero or more.';
    } else if (Math.round(poolValue * 100) < Math.round(committedUsd * 100)) {
      next.budgetPoolUsd = `The pool cannot drop below ${formatUsd(committedUsd)}, which is already reserved for tasks or spent.`;
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await saveSettings({
        workspaceName: form.workspaceName.trim(),
        budgetPoolUsd: Math.round(Number(form.budgetPoolUsd) * 100) / 100,
      });
      setSaved(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Your settings could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <Panel className="p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-white">Workspace</h2>
          <p className="mt-1 text-sm text-slate-400">The name and approved budget pool every task draws from.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
            <Field label="Workspace name" htmlFor="workspace-name" error={errors.workspaceName} hint="Shown in the sidebar and on your reports.">
              <TextInput id="workspace-name" value={form.workspaceName} maxLength={60} onChange={(event) => update('workspaceName', event.target.value)} />
            </Field>

            <Field
              label="Approved budget pool (USD)"
              htmlFor="budget-pool"
              error={errors.budgetPoolUsd}
              hint="Tasks can never spend more than this pool. Lowering it cannot cut into reserved or spent funds."
            >
              <TextInput
                id="budget-pool"
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                value={form.budgetPoolUsd}
                onChange={(event) => update('budgetPoolUsd', event.target.value)}
              />
            </Field>

            {submitError && (
              <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {submitError}
              </p>
            )}

            <div className="flex flex-col-reverse items-stretch gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-end">
              {saved && !dirty && (
                <span className="flex items-center justify-center gap-2 text-sm text-emerald-300 sm:mr-auto sm:justify-start">
                  <BadgeCheck className="h-4 w-4" />
                  Changes saved
                </span>
              )}
              <Button type="submit" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </form>
        </Panel>

        <Panel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400 ring-1 ring-inset ring-white/10">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-semibold text-white">NEAR wallet</h2>
                <Badge tone="neutral">Not connected</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Wallet connection arrives with the NEAR integration. Until then, every payment is a simulated local record.
              </p>
            </div>
          </div>
          <Button variant="secondary" disabled icon={<Link2 className="h-4 w-4" />} className="sm:shrink-0">
            Connect wallet
          </Button>
        </Panel>
      </div>

      <Panel className="flex h-fit flex-col gap-6 p-6 sm:p-7">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Budget breakdown</h2>
          <p className="mt-1 text-sm text-slate-400">How your approved pool is used.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Used or reserved</span>
            <span className="font-medium text-white">{Math.round(usedPct * 100)}%</span>
          </div>
          <ProgressBar value={usedPct * 100} tone={usedPct > 0.85 ? 'amber' : 'blue'} label="Budget used" />
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <BreakdownRow label="Pool" value={formatUsd(pool)} />
          <BreakdownRow label="Reserved for open tasks" value={formatUsd(budget?.reservedUsd ?? 0)} />
          <BreakdownRow label="Spent (approved)" value={formatUsd(budget?.spentUsd ?? 0)} />
          <BreakdownRow label="Pending approval" value={formatUsd(budget?.pendingUsd ?? 0)} />
          <div className="border-t border-white/[0.07] pt-3">
            <BreakdownRow label="Available" value={formatUsd(budget?.availableUsd ?? 0)} strong />
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function BreakdownRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className={strong ? 'font-display text-base font-semibold text-white' : 'font-medium text-slate-200'}>{value}</dd>
    </div>
  );
}
