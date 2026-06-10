import { cn } from '@/lib/cn';

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label = '불러오는 중…', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
