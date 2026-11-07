import { useCallback, useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { verifyDeliverable } from '@/lib/coordinator/engine';
import { buildDeliverable } from '@/lib/demo/deliverables';
import type { Agent, Task } from '@/types/domain';

const SIMULATED_WORK_MS = 2600;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function messageFor(err: unknown): string {
  return err instanceof Error ? err.message : 'The simulated work could not be updated. Please try again.';
}

export function useWorkExecution() {
  const { saveTaskProgress } = useAppData();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setWorking(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setWorking(false);
    }
  }, []);

  const startWork = useCallback(
    (task: Task, agent: Agent) =>
      run(async () => {
        await wait(SIMULATED_WORK_MS);
        await saveTaskProgress(task.id, { deliverable: buildDeliverable(task, agent) });
      }),
    [run, saveTaskProgress],
  );

  const markReviewed = useCallback(
    (task: Task) =>
      run(async () => {
        if (!task.deliverable) throw new Error('There is no simulated deliverable to review yet.');
        await saveTaskProgress(task.id, {
          deliverable: { ...task.deliverable, reviewedAt: new Date().toISOString() },
        });
      }),
    [run, saveTaskProgress],
  );

  const verifyWork = useCallback(
    (task: Task) =>
      run(async () => {
        if (!task.deliverable?.reviewedAt) throw new Error('Review the simulated deliverable before verifying the work.');
        await saveTaskProgress(task.id, { completedSteps: 7, verificationScore: verifyDeliverable(task) });
      }),
    [run, saveTaskProgress],
  );

  return { working, error, startWork, markReviewed, verifyWork };
}
