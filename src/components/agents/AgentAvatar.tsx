import { Bot, Code2, PenLine, Palette, Search, Settings2, ShieldCheck, TrendingUp, BarChart3, type LucideIcon } from 'lucide-react';
import type { Specialization } from '@/types/domain';
import { SPECIALIZATION_STYLES } from '@/lib/labels';

const SPECIALIZATION_ICONS: Record<Specialization, LucideIcon> = {
  Research: Search,
  'Content Writing': PenLine,
  'Data Analysis': BarChart3,
  Development: Code2,
  Design: Palette,
  'Smart Contracts': ShieldCheck,
  'Market Intelligence': TrendingUp,
  Operations: Settings2,
};

const SIZE_CLASSES = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-14 w-14 rounded-2xl',
};

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

interface AgentAvatarProps {
  category?: Specialization;
  size?: keyof typeof SIZE_CLASSES;
}

export function AgentAvatar({ category, size = 'md' }: AgentAvatarProps) {
  const Icon = category ? SPECIALIZATION_ICONS[category] : Bot;
  const gradient = category ? SPECIALIZATION_STYLES[category] : 'from-slate-600 to-slate-500';
  return (
    <span className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${gradient} ring-1 ring-inset ring-white/20 shadow-[0_8px_20px_-8px_rgba(59,130,246,0.6)] ${SIZE_CLASSES[size]}`}>
      <Icon className={`${ICON_SIZES[size]} text-white`} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}
