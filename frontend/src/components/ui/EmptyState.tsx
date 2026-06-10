import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
      <p className="text-base font-medium text-cream-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
