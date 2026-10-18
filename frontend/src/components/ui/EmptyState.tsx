import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
};

export function EmptyState({ title, description, action, className, variant = 'default' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col', variant === 'compact' ? 'items-start gap-2 py-4 text-left' : 'items-center gap-3 py-16 text-center', className)}>
      <p className="text-base font-medium text-cream-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
