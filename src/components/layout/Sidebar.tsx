import { Bot, Hexagon, LayoutDashboard, ListChecks, Receipt, Settings, Wallet, X, type LucideIcon } from 'lucide-react';
import type { Route } from '@/lib/routes';
import { Badge } from '@/components/ui/Badge';
import { useWallet } from '@/hooks/useWallet';
import type { WalletStatus } from '@/context/walletStore';
import { NEAR_NETWORK_ID } from '@/services/nearWallet';

function walletLabel(status: WalletStatus, accountId: string | null): string {
  if (accountId) return `Connected to ${NEAR_NETWORK_ID}`;
  if (status === 'initializing') return 'Checking wallet';
  if (status === 'error') return 'Wallet unavailable';
  return 'Not connected';
}

interface NavItem {
  key: Route['name'];
  label: string;
  icon: LucideIcon;
  route: Route;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, route: { name: 'overview' } },
  { key: 'marketplace', label: 'Agent Marketplace', icon: Bot, route: { name: 'marketplace' } },
  { key: 'tasks', label: 'My Tasks', icon: ListChecks, route: { name: 'tasks' } },
  { key: 'transactions', label: 'Transactions', icon: Receipt, route: { name: 'transactions' } },
  { key: 'settings', label: 'Settings', icon: Settings, route: { name: 'settings' } },
];

function isActive(item: NavItem, route: Route): boolean {
  if (item.key === 'tasks') return route.name === 'tasks' || route.name === 'task';
  return item.key === route.name;
}

interface SidebarProps {
  route: Route;
  onNavigate: (route: Route) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ route, onNavigate, open, onClose }: SidebarProps) {
  const { status, accountId } = useWallet();
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <button type="button" onClick={() => onNavigate({ name: 'overview' })} className="group flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.9)] transition group-hover:scale-105">
            <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="text-left">
            <span className="block font-display text-base font-semibold tracking-tight text-white">TaskForge AI</span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">Agent Economy</span>
          </span>
        </button>
        <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Workspace</p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, route);
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.route)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-blue-500/12 text-white ring-1 ring-inset ring-blue-400/25'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
              }`}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />}
              <Icon className={`h-[18px] w-[18px] transition-colors ${active ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 p-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Wallet className="h-3.5 w-3.5 text-slate-500" />
              NEAR wallet
            </span>
            <Badge tone={accountId ? 'emerald' : 'neutral'} dot={accountId !== null}>
              {walletLabel(status, accountId)}
            </Badge>
          </div>
          {accountId && <p className="mt-2 truncate font-mono text-xs text-slate-200">{accountId}</p>}
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Payments are simulated ledger entries. No real NEAR transactions are sent yet.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.06] bg-ink-900/90 backdrop-blur-xl lg:block">
        {content}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink-950/70 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in-left border-r border-white/[0.08] bg-ink-900 shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
