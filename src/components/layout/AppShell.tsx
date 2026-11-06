import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import type { Route } from '@/lib/routes';

const PAGE_META: Record<Route['name'], { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Your agent economy at a glance' },
  marketplace: { title: 'Agent Marketplace', subtitle: 'Discover, compare and hire specialized AI agents' },
  tasks: { title: 'My Tasks', subtitle: 'Follow every task from brief to approved payment' },
  task: { title: 'Task workspace', subtitle: 'Coordinator progress, bids and payment approval' },
  transactions: { title: 'Transactions', subtitle: 'Payment requests and approved spending' },
  settings: { title: 'Settings', subtitle: 'Workspace details and your approved budget pool' },
};

interface AppShellProps {
  route: Route;
  navigate: (route: Route) => void;
  availableUsd: number | null;
  onCreateTask: () => void;
  children: ReactNode;
}

export function AppShell({ route, navigate, availableUsd, onCreateTask, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = PAGE_META[route.name];

  const handleNavigate = (next: Route) => {
    setMenuOpen(false);
    navigate(next);
  };

  return (
    <div className="min-h-screen">
      <Sidebar route={route} onNavigate={handleNavigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          availableUsd={availableUsd}
          onMenu={() => setMenuOpen(true)}
          onCreateTask={onCreateTask}
        />
        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-8 sm:pt-8">{children}</main>
      </div>
    </div>
  );
}
