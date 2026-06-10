import { cn } from '@/lib/cn';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'onPrimary';
};

export function BrandMark({
  size = 'md',
  className,
  showText = true,
  variant = 'default',
}: BrandMarkProps) {
  const iconSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';
  const onPrimary = variant === 'onPrimary';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex items-center justify-center rounded-2xl',
          onPrimary ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-primary text-primary-foreground',
          iconSize,
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M12 3c2 4 5 6 5 9a5 5 0 1 1-10 0c0-3 3-5 5-9Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            onPrimary ? 'text-primary-foreground' : 'text-primary',
            textSize,
          )}
        >
          Herfree
        </span>
      )}
    </div>
  );
}
