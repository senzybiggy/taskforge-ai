import { Activity, CheckCircle2, Coins, Users, type LucideIcon } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { formatUsd } from '@/lib/format';

interface StatsGridProps {
  totalAgents: number;
  onlineAgents: number;
  activeTasks: number;
  completedTasks: number;
  volumeUsd: number;
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
}

function StatCard({ label, value, hint, icon: Icon, accent }: StatCardProps) {
  return (
    <Panel className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/15">
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40 ${accent}`} />
      <div className="relative flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/10">
          <Icon className="h-4 w-4 text-blue-300" />
        </span>
      </div>
      <p className="relative mt-4 font-display text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="relative mt-1 text-xs text-slate-500">{hint}</p>
    </Panel>
  );
}

export function StatsGrid({ totalAgents, onlineAgents, activeTasks, completedTasks, volumeUsd }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard label="Total agents" value={String(totalAgents)} hint={`${onlineAgents} online now`} icon={Users} accent="bg-blue-500" />
      <StatCard label="Active tasks" value={String(activeTasks)} hint="Being coordinated or delivered" icon={Activity} accent="bg-cyan-400" />
      <StatCard label="Completed tasks" value={String(completedTasks)} hint="Work verified and paid" icon={CheckCircle2} accent="bg-emerald-400" />
      <StatCard
        label="Transaction volume"
        value={formatUsd(volumeUsd)}
        hint="Approved payments to date"
        icon={Coins}
        accent="bg-violet-500"
      />
    </div>
  );
}
