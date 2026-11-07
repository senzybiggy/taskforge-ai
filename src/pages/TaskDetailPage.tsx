import { useState } from 'react';
import { ArrowLeft, Bot, Calendar, SearchX, Wallet } from 'lucide-react';
import { BidComparison } from '@/components/coordinator/BidComparison';
import { CoordinatorPanel } from '@/components/coordinator/CoordinatorPanel';
import { DeliverableReview } from '@/components/coordinator/DeliverableReview';
import { PaymentPanel } from '@/components/coordinator/PaymentPanel';
import { SubjobList } from '@/components/coordinator/SubjobList';
import { WorkflowStepper } from '@/components/coordinator/WorkflowStepper';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { useAppData } from '@/hooks/useAppData';
import { useCoordinatorRun } from '@/hooks/useCoordinatorRun';
import { useWorkExecution } from '@/hooks/useWorkExecution';
import { recommendedBid } from '@/lib/coordinator/engine';
import { FINAL_STEP } from '@/lib/coordinator/steps';
import { agentLookup } from '@/lib/dashboardStats';
import { daysUntil, formatDate, formatUsd } from '@/lib/format';
import { taskStatus } from '@/lib/labels';
import type { Route } from '@/lib/routes';
import type { Task } from '@/types/domain';

interface TaskDetailPageProps {
  taskId: string;
  navigate: (route: Route) => void;
}

export function TaskDetailPage({ taskId, navigate }: TaskDetailPageProps) {
  const { tasks } = useAppData();
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return (
      <Panel>
        <EmptyState
          icon={SearchX}
          title="This task could not be found"
          description="It may have been removed, or the link is incorrect."
          action={
            <Button variant="secondary" onClick={() => navigate({ name: 'tasks' })} icon={<ArrowLeft className="h-4 w-4" />}>
              Back to my tasks
            </Button>
          }
        />
      </Panel>
    );
  }

  return <TaskWorkspace task={task} navigate={navigate} />;
}

interface TaskWorkspaceProps {
  task: Task;
  navigate: (route: Route) => void;
}

function TaskWorkspace({ task, navigate }: TaskWorkspaceProps) {
  const { agents, transactions } = useAppData();
  const { running, error, stalled, start, confirmAgent } = useCoordinatorRun();
  const { working, error: workError, startWork, markReviewed, verifyWork } = useWorkExecution();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const agentById = agentLookup(agents);
  const recommendedId = recommendedBid(task.bids)?.agentId ?? null;
  const activePickId = pickedId ?? task.selectedAgentId ?? recommendedId;
  const pickedAgent = activePickId ? agentById.get(activePickId) : undefined;
  const selectedAgent = task.selectedAgentId ? agentById.get(task.selectedAgentId) : undefined;
  const taskTransactions = transactions.filter((tx) => tx.taskId === task.id);
  const status = taskStatus(task);
  const awaitingChoice = task.completedSteps === 4 && !running;
  const remaining = daysUntil(task.deadline);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'tasks' })} icon={<ArrowLeft className="h-4 w-4" />}>
          My tasks
        </Button>
      </div>

      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone} dot>{status.label}</Badge>
          <Badge tone="neutral">{task.specialization}</Badge>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">{task.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">{task.description}</p>

        <dl className="mt-6 grid gap-4 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-slate-300">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <dt className="text-xs text-slate-500">Approved budget</dt>
              <dd className="font-semibold text-white">{formatUsd(task.budgetUsd)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-slate-300">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <dt className="text-xs text-slate-500">Deadline</dt>
              <dd className="font-semibold text-white">
                {formatDate(task.deadline)}
                {task.completedSteps < FINAL_STEP && <span className="ml-2 text-xs font-normal text-slate-400">{remaining >= 0 ? `${remaining}d left` : 'Overdue'}</span>}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedAgent ? (
              <AgentAvatar category={selectedAgent.category} size="sm" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-slate-500">
                <Bot className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Assigned agent</dt>
              <dd className="truncate font-semibold text-white">{selectedAgent?.name ?? 'Not selected yet'}</dd>
            </div>
          </div>
        </dl>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">
          <CoordinatorPanel
            task={task}
            pickedAgent={pickedAgent}
            running={running}
            stalled={stalled}
            working={working}
            error={error ?? workError}
            onStart={() => start(task)}
            onConfirmAgent={() => activePickId && confirmAgent(task, activePickId)}
            onStartWork={() => selectedAgent && startWork(task, selectedAgent)}
            onMarkReviewed={() => markReviewed(task)}
            onVerifyWork={() => verifyWork(task)}
          />

          {task.deliverable && <DeliverableReview deliverable={task.deliverable} />}

          {task.bids.length > 0 && (
            <BidComparison
              bids={task.bids}
              agentById={agentById}
              pickedAgentId={awaitingChoice ? activePickId : task.selectedAgentId}
              chosenAgentId={task.selectedAgentId}
              recommendedAgentId={recommendedId}
              interactive={awaitingChoice}
              onPick={setPickedId}
            />
          )}

          {task.subtasks.length > 0 && <SubjobList subtasks={task.subtasks} />}
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Panel className="p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-white">Workflow</h2>
            <p className="mt-1 text-sm text-slate-400">Eight steps from brief to paid work.</p>
            <div className="mt-6">
              <WorkflowStepper task={task} agents={agents} running={running || working} />
            </div>
          </Panel>

          <PaymentPanel task={task} transactions={taskTransactions} />
        </div>
      </div>
    </div>
  );
}
