import { useMemo, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppData } from '@/hooks/useAppData';
import { isActiveTask } from '@/lib/labels';
import type { Route } from '@/lib/routes';
import type { Task } from '@/types/domain';

type TaskTab = 'active' | 'completed' | 'all';

interface TasksPageProps {
  navigate: (route: Route) => void;
  onCreateTask: () => void;
}

const TABS: { key: TaskTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

function matchesTab(task: Task, tab: TaskTab): boolean {
  if (tab === 'all') return true;
  return tab === 'active' ? isActiveTask(task) : !isActiveTask(task);
}

export function TasksPage({ navigate, onCreateTask }: TasksPageProps) {
  const { tasks, agents } = useAppData();
  const [tab, setTab] = useState<TaskTab>('active');

  const counts = useMemo(
    () => ({
      active: tasks.filter((task) => isActiveTask(task)).length,
      completed: tasks.filter((task) => !isActiveTask(task)).length,
      all: tasks.length,
    }),
    [tasks],
  );
  const visible = tasks.filter((task) => matchesTab(task, tab));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter tasks" className="inline-flex w-full rounded-xl border border-white/[0.08] bg-ink-800/70 p-1 sm:w-auto">
          {TABS.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                tab === item.key ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
              <span className="rounded-md bg-white/[0.07] px-1.5 text-xs text-slate-400">{counts[item.key]}</span>
            </button>
          ))}
        </div>
        <Button onClick={onCreateTask} icon={<Plus className="h-4 w-4" />} className="sm:self-auto">
          Create New Task
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'completed' ? 'No completed tasks yet' : 'No tasks here yet'}
          description="Describe a piece of work with a budget. The coordinator takes it from there and waits for your approval before paying."
          action={<Button onClick={onCreateTask} icon={<Plus className="h-4 w-4" />}>Create New Task</Button>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((task, index) => (
            <div key={task.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
              <TaskCard
                task={task}
                agent={agents.find((agent) => agent.id === task.selectedAgentId)}
                onOpen={() => navigate({ name: 'task', taskId: task.id })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
