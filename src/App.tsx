import { useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { AppDataProvider } from '@/context/AppDataProvider';
import { useAppData } from '@/hooks/useAppData';
import { useRoute } from '@/hooks/useRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { CreateTaskModal, type TaskDraft } from '@/components/tasks/CreateTaskModal';
import { OverviewPage } from '@/pages/OverviewPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { TasksPage } from '@/pages/TasksPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import type { Route } from '@/lib/routes';
import type { Task } from '@/types/domain';

function Workspace() {
  const [route, navigate] = useRoute();
  const { budget, loading, error, reload, settings } = useAppData();
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft | null>(null);

  const openCreate = (next: TaskDraft | null = null) => {
    setDraft(next);
    setCreateOpen(true);
  };

  const handleCreated = (task: Task) => {
    setCreateOpen(false);
    navigate({ name: 'task', taskId: task.id });
  };

  if (!settings && error) {
    return <LoadError message={error} onRetry={reload} />;
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          Loading your workspace
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell
        route={route}
        navigate={navigate}
        availableUsd={budget?.availableUsd ?? null}
        onCreateTask={() => openCreate()}
      >
        {error && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span>Some data could not be refreshed. {error}</span>
            <Button variant="secondary" size="sm" onClick={reload} loading={loading}>
              Retry
            </Button>
          </div>
        )}
        <PageSwitch route={route} navigate={navigate} onCreateTask={openCreate} />
      </AppShell>
      <CreateTaskModal open={createOpen} draft={draft} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </>
  );
}

interface PageSwitchProps {
  route: Route;
  navigate: (route: Route) => void;
  onCreateTask: (draft?: TaskDraft | null) => void;
}

function PageSwitch({ route, navigate, onCreateTask }: PageSwitchProps) {
  switch (route.name) {
    case 'overview':
      return <OverviewPage navigate={navigate} onCreateTask={() => onCreateTask()} />;
    case 'marketplace':
      return <MarketplacePage onHire={(draft) => onCreateTask(draft)} />;
    case 'tasks':
      return <TasksPage navigate={navigate} onCreateTask={() => onCreateTask()} />;
    case 'task':
      return <TaskDetailPage key={route.taskId} taskId={route.taskId} navigate={navigate} />;
    case 'transactions':
      return <TransactionsPage navigate={navigate} />;
    case 'settings':
      return <SettingsPage />;
  }
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Panel className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-inset ring-amber-400/25">
          <AlertTriangle className="h-6 w-6 text-amber-300" />
        </div>
        <h1 className="font-display text-xl font-semibold text-white">We could not open your workspace</h1>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <Button className="mt-6" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try again
        </Button>
      </Panel>
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <Workspace />
    </AppDataProvider>
  );
}
