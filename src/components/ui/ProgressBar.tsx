interface ProgressBarProps {
  value: number;
  tone?: 'blue' | 'emerald' | 'amber';
  label?: string;
}

const FILL_CLASSES = {
  blue: 'from-blue-500 to-cyan-300',
  emerald: 'from-emerald-500 to-teal-300',
  amber: 'from-amber-500 to-yellow-300',
};

export function ProgressBar({ value, tone = 'blue', label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out ${FILL_CLASSES[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
