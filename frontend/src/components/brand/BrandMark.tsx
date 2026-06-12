import { cn } from '@/lib/cn';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'onPrimary' | 'light';
};

export function BrandMark({
  size = 'md',
  className,
  showText = true,
  variant = 'default',
}: BrandMarkProps) {
  const iconSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-[15px]' : 'text-lg';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex items-center justify-center text-primary',
          iconSize,
          variant === 'onPrimary' && 'text-white',
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            d="M12 2.5l7.5 4.3v5.5c0 4.5-3 7.9-7.5 9.5C7.5 20.2 4.5 16.8 4.5 12.3V6.8L12 2.5Z"
            strokeLinejoin="round"
          />
          <path d="M12 8v6M9.5 11h5" strokeLinecap="round" />
        </svg>
      </span>
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight text-ink',
            variant === 'onPrimary' && 'text-white',
            variant === 'light' && 'text-navy-foreground',
            textSize,
          )}
        >
          Herfree
        </span>
      )}
    </div>
  );
}
