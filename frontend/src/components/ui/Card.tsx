import { cn } from '@/lib/cn';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={cn(
        'rounded-2xl border border-border bg-card p-4 shadow-sm',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        className,
      )}
    >
      {children}
    </div>
  );
}
