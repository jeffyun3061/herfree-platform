import { cn } from '@/lib/cn';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'muted';
  className?: string;
};

const VARIANT_STYLES = {
  default: 'bg-primary/10 text-primary',
  gold: 'bg-gold/15 text-gold',
  muted: 'bg-cream-dark text-muted',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
