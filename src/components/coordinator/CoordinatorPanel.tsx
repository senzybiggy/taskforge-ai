import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Loader2, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { FINAL_STEP, activeStepId } from '@/lib/coordinator/steps';
import { passesVerification } from '@/lib/coordinator/engine';
import type { Agent, Task } from '@/types/domain';

interface CoordinatorPanelProps {
  task: Task;
  pickedAgent: Agent | undefined;
  running: boolean;
  stalled: boolean;
  working: boolean;
  error: string | null;
  onStart: () => void;
  onConfirmAgent: () => void;
  onStartWork: () => void;
  onMarkReviewed: () => void;
  onVerifyWork: () => void;
}

export function CoordinatorPanel({
  task,
  pickedAgent,
  running,
  stalled,
  working,
  error,
  onStart,
  onConfirmAgent,
  onStartWork,
  onMarkReviewed,
  onVerifyWork,
}: CoordinatorPanelProps) {
  const step = task.completedSteps;
  const finished = step >= FINAL_STEP;
  const verified = step >= 7 && passesVerification(task.verificationScore);
  const agentName = pickedAgent?.name ?? 'The agent';

  let title = 'Coordinator is ready';
  let body = 'Start the coordinator to analyze the brief and look for agents. It pauses at the decisions that need you.';
  let action: ReactNode = null;

  if (finished) {
    title = 'Task complete';
    body = 'The simulated work was verified and the simulated payment was approved within budget.';
  } else if (running) {
    title = 'Coordinator is working';
    body = 'Analyzing, matching and checking progress automatically. You can leave this page open.';
    action = (
      <Button variant="secondary" disabled icon={<Loader2 className="h-4 w-4 animate-spin" />}>
        Working
      </Button>
    );
  } else if (stalled && step <= 2) {
    title = 'No agent could bid';
    body = 'No agent with this specialization can work within this budget. Create a new task with a different specialization or a larger budget.';
  } else if (step === 4) {
    title = 'Choose an agent';
    body = 'Bids are scored on reputation, price and delivery time. Pick an agent to continue, or keep the recommendation.';
    action = (
      <Button onClick={onConfirmAgent} disabled={!pickedAgent} icon={<ShieldCheck className="h-4 w-4" />}>
        {pickedAgent ? `Hire ${pickedAgent.name}` : 'Select an agent'}
      </Button>
    );
  } else if (step === 6) {
    if (!task.deliverable) {
      title = 'Ready to start work';
      body = `${agentName} is hired. Start the work to generate its simulated deliverable. No real work is performed.`;
      action = (
        <Button onClick={onStartWork} loading={working} icon={<Play className="h-4 w-4" />}>
          Start work
        </Button>
      );
    } else if (!task.deliverable.reviewedAt) {
      title = 'Review the deliverable';
      body = 'The simulated report is ready below. Read it, then mark it reviewed to unlock verification.';
      action = (
        <Button variant="secondary" onClick={onMarkReviewed} loading={working} icon={<Eye className="h-4 w-4" />}>
          Mark as reviewed
        </Button>
      );
    } else {
      title = 'Ready to verify';
      body = 'You reviewed the simulated deliverable. Verify the work to unlock the simulated payment.';
      action = (
        <Button onClick={onVerifyWork} loading={working} icon={<ShieldCheck className="h-4 w-4" />}>
          Work verified
        </Button>
      );
    }
  } else if (step === 7) {
    title = verified ? 'Work verified' : 'Verification needs review';
    body = verified
      ? 'The simulated work passed verification against your brief. Approve the simulated payment to close the task.'
      : 'The deliverable did not pass verification. Review the work before any payment is requested.';
  } else if (step === 1 || step === 2 || step === 3) {
    title = step === 1 ? 'Task received' : 'Coordinator paused';
    body = step === 1
      ? 'The brief is queued. Start the coordinator to analyze it and discover agents.'
      : 'The coordinator stopped before finishing. Resume to continue from this step.';
    action = (
      <Button onClick={onStart} icon={step === 1 ? <Play className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}>
        {step === 1 ? 'Start coordinator' : 'Resume coordinator'}
      </Button>
    );
  } else if (step === 5) {
    title = 'Agent hired';
    body = `${agentName} is hired. Resume to move the job into work in progress.`;
    action = (
      <Button onClick={onStart} icon={<RotateCcw className="h-4 w-4" />}>
        Resume coordinator
      </Button>
    );
  }

  return (
    <Panel className="relative overflow-hidden p-6 sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            Autonomous coordinator
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="amber">Simulated demo</Badge>
            <Badge tone="neutral">Step {activeStepId(step)} of {FINAL_STEP}</Badge>
            {task.verificationScore !== null && <Badge tone={verified ? 'emerald' : 'rose'}>Verification {task.verificationScore}/100</Badge>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {finished && (
        <div className="relative mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Simulated work completed and simulated payment recorded within the approved budget.
        </div>
      )}

      {error && (
        <div role="alert" className="relative mt-5 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </Panel>
  );
}
