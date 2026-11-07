import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { isAutomaticStep, nextAutomaticPatch } from '@/lib/coordinator/engine';
import type { Task } from '@/types/domain';

function stepDelay(completedSteps: number): number {
  if (completedSteps === 5) return 1200;
  return 900;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function messageFor(err: unknown): string {
  return err instanceof Error ? err.message : 'The coordinator stopped unexpectedly. Please try again.';
}

export function useCoordinatorRun() {
  const { agents, saveTaskProgress } = useAppData();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stalled, setStalled] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const runAutomatic = useCallback(
    async (start: Task) => {
      setRunning(true);
      setError(null);
      setStalled(false);
      let current = start;
      try {
        while (!cancelledRef.current && isAutomaticStep(current.completedSteps)) {
          await wait(stepDelay(current.completedSteps));
          if (cancelledRef.current) break;
          const patch = nextAutomaticPatch(current, agents);
          if (!patch) {
            setStalled(true);
            break;
          }
          current = await saveTaskProgress(current.id, patch);
        }
      } catch (err) {
        setError(messageFor(err));
      } finally {
        setRunning(false);
      }
    },
    [agents, saveTaskProgress],
  );

  const confirmAgent = useCallback(
    async (task: Task, agentId: string) => {
      setError(null);
      try {
        const updated = await saveTaskProgress(task.id, { selectedAgentId: agentId, completedSteps: 5 });
        await runAutomatic(updated);
      } catch (err) {
        setError(messageFor(err));
      }
    },
    [runAutomatic, saveTaskProgress],
  );

  return { running, error, stalled, start: runAutomatic, confirmAgent };
}
