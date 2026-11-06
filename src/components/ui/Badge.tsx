import type { ReactNode } from 'react';

type Tone = 'neutral' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-white/[0.06] text-slate-300 ring-white/10',
  blue: 'bg-blue-500/10 text-blue-300 ring-blue-400/25',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-400/25',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-400/25',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-400/25',
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ tone = 'neutral', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
