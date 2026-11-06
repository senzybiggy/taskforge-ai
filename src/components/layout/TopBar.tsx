import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatUsd } from '@/lib/format';

interface TopBarProps {
  title: string;
  subtitle: string;
  availableUsd: number | null;
  onMenu: () => void;
  onCreateTask: () => void;
}

export function TopBar({ title, subtitle, availableUsd, onMenu, onCreateTask }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-8">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="rounded-xl p-2 text-slate-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          <p className="hidden truncate text-sm text-slate-400 sm:block">{subtitle}</p>
        </div>
        {availableUsd !== null && (
          <div className="hidden items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-3 py-2 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <span className="text-xs text-slate-400">Available budget</span>
            <span className="text-sm font-semibold text-white">{formatUsd(availableUsd)}</span>
          </div>
        )}
        <Button onClick={onCreateTask} icon={<Plus className="h-4 w-4" />} className="shrink-0">
          <span className="hidden sm:inline">Create New Task</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </header>
  );
}
