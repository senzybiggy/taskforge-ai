import type { HTMLAttributes } from 'react';

export function Panel({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b from-ink-700/60 to-ink-800/70 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
