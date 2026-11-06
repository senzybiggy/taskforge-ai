import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppDataContext, type AppDataContextValue } from '@/context/appDataStore';
import { summarizeBudget } from '@/lib/budget';
import {
  createTask,
  decidePayment,
  fetchWorkspace,
  requestPayment,
  updateSettings,
  updateTaskProgress,
} from '@/services/workspaceRepository';
import type { Agent, Task, Transaction, WorkspaceSettings } from '@/types/domain';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchWorkspace();
      setAgents(snapshot.agents);
      setTasks(snapshot.tasks);
      setTransactions(snapshot.transactions);
      setSettings(snapshot.settings);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const budget = useMemo(
    () => (settings ? summarizeBudget(settings, tasks, transactions) : null),
    [settings, tasks, transactions],
  );

  const handleCreateTask = useCallback<AppDataContextValue['createTask']>(async (input) => {
    const task = await createTask(input);
    setTasks((current) => [task, ...current]);
    return task;
  }, []);

  const saveTaskProgress = useCallback<AppDataContextValue['saveTaskProgress']>(async (taskId, patch) => {
    const task = await updateTaskProgress(taskId, patch);
    setTasks((current) => current.map((item) => (item.id === taskId ? task : item)));
    return task;
  }, []);

  const handleRequestPayment = useCallback<AppDataContextValue['requestPayment']>(async (task) => {
    const transaction = await requestPayment(task.id);
    setTransactions((current) => [transaction, ...current]);
    return transaction;
  }, []);

  const handleDecidePayment = useCallback<AppDataContextValue['decidePayment']>(async (transaction, decision) => {
    const result = await decidePayment(transaction.id, decision);
    setTransactions((current) => current.map((tx) => (tx.id === result.transaction.id ? result.transaction : tx)));
    setTasks((current) => current.map((task) => (task.id === result.task.id ? result.task : task)));
  }, []);

  const handleSaveSettings = useCallback<AppDataContextValue['saveSettings']>(async (patch) => {
    const updated = await updateSettings(patch);
    setSettings(updated);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      agents,
      tasks,
      transactions,
      settings,
      budget,
      loading,
      error,
      reload,
      createTask: handleCreateTask,
      saveTaskProgress,
      requestPayment: handleRequestPayment,
      decidePayment: handleDecidePayment,
      saveSettings: handleSaveSettings,
    }),
    [agents, tasks, transactions, settings, budget, loading, error, reload, handleCreateTask, saveTaskProgress, handleRequestPayment, handleDecidePayment, handleSaveSettings],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
