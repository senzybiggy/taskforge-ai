import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-inset ring-blue-400/20">
        <Icon className="h-6 w-6 text-blue-300" aria-hidden="true" />
      </div>
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      <p className="max-w-sm text-sm text-slate-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
