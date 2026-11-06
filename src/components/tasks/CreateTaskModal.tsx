import { useState, type FormEvent } from 'react';
import { ArrowRight, Bot, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextArea, TextInput } from '@/components/ui/Field';
import { useAppData } from '@/hooks/useAppData';
import { formatUsd } from '@/lib/format';
import { SPECIALIZATIONS, type NewTaskInput, type Specialization, type Task } from '@/types/domain';

export interface TaskDraft {
  specialization?: Specialization;
  preferredAgentId?: string | null;
}

interface CreateTaskModalProps {
  open: boolean;
  draft: TaskDraft | null;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

interface FormState {
  title: string;
  description: string;
  budget: string;
  deadline: string;
  specialization: Specialization;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function toIsoDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function defaultDeadline(): string {
  return toIsoDate(new Date(Date.now() + 14 * 86400000));
}

export function CreateTaskModal({ open, draft, onClose, onCreated }: CreateTaskModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Create a new task"
      description="Describe the work. The coordinator will analyze it, find agents and ask you to approve payment."
    >
      {open && <CreateTaskForm draft={draft} onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function CreateTaskForm({ draft, onClose, onCreated }: Omit<CreateTaskModalProps, 'open'>) {
  const { createTask, agents, budget } = useAppData();
  const preferredAgent = agents.find((agent) => agent.id === draft?.preferredAgentId) ?? null;
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    budget: '',
    deadline: defaultDeadline(),
    specialization: draft?.specialization ?? 'Research',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableUsd = budget?.availableUsd ?? 0;
  const parsedBudget = Number(form.budget);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const title = form.title.trim();
    if (title.length < 3) next.title = 'Give the task a title of at least 3 characters.';
    if (title.length > 120) next.title = 'Keep the title under 120 characters.';
    if (form.description.trim().length < 20) next.description = 'Describe the work in at least 20 characters.';
    if (!form.budget || !Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      next.budget = 'Enter a budget greater than zero.';
    } else if (parsedBudget > availableUsd) {
      next.budget = `Only ${formatUsd(availableUsd)} is available in your approved budget.`;
    }
    if (!form.deadline || form.deadline < toIsoDate(new Date())) {
      next.deadline = 'Choose a deadline today or later.';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    const input: NewTaskInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      budgetUsd: Math.round(parsedBudget * 100) / 100,
      deadline: form.deadline,
      specialization: form.specialization,
      preferredAgentId: preferredAgent?.id ?? null,
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const task = await createTask(input);
      onCreated(task);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The task could not be created. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id="create-task-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3">
        <span className="text-sm text-slate-300">Approved budget available</span>
        <span className="font-display text-lg font-semibold text-white">{formatUsd(availableUsd)}</span>
      </div>

      {preferredAgent && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/[0.07] px-4 py-3 text-sm text-slate-300">
          <Bot className="h-4 w-4 shrink-0 text-blue-300" />
          <span>
            Requested agent: <span className="font-medium text-white">{preferredAgent.name}</span>. The coordinator will still compare every bid.
          </span>
        </div>
      )}

      <Field label="Task title" htmlFor="task-title" error={errors.title}>
        <TextInput
          id="task-title"
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="e.g. Competitive landscape report for NEAR lending"
          maxLength={120}
          autoFocus
        />
      </Field>

      <Field label="Detailed description" htmlFor="task-description" error={errors.description} hint="Include goals, constraints, inputs and what a good result looks like.">
        <TextArea
          id="task-description"
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="Describe the outcome you need, the audience, sources to use and acceptance criteria."
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Budget (USD)" htmlFor="task-budget" error={errors.budget} hint="Never exceeded. Unused budget stays in your pool.">
          <TextInput
            id="task-budget"
            type="number"
            inputMode="decimal"
            min={1}
            step="1"
            value={form.budget}
            onChange={(event) => updateField('budget', event.target.value)}
            placeholder="1200"
          />
        </Field>
        <Field label="Deadline" htmlFor="task-deadline" error={errors.deadline}>
          <TextInput
            id="task-deadline"
            type="date"
            min={toIsoDate(new Date())}
            value={form.deadline}
            onChange={(event) => updateField('deadline', event.target.value)}
          />
        </Field>
      </div>

      <Field label="Required specialization" htmlFor="task-specialization" hint="Only agents with this specialization will bid.">
        <SelectInput
          id="task-specialization"
          value={form.specialization}
          onChange={(event) => updateField('specialization', event.target.value as Specialization)}
        >
          {SPECIALIZATIONS.map((item) => (
            <option key={item} value={item} className="bg-ink-900">
              {item}
            </option>
          ))}
        </SelectInput>
      </Field>

      {submitError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {submitError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} icon={<ArrowRight className="h-4 w-4" />}>
          Submit task
        </Button>
      </div>
    </form>
  );
}
